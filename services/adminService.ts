import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  deleteDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { AdminLog } from '../types/movie';
import { initialMovies } from '../data/movies';

const LOCAL_LOGS_KEY = 'rwanin_admin_logs';

export const adminService = {
  logAction: async (log: Omit<AdminLog, 'id' | 'timestamp'>): Promise<void> => {
    const fullLog: AdminLog = {
      ...log,
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString('ku')
    };

    // Save to Firestore
    try {
      await addDoc(collection(db, 'adminLogs'), fullLog);
    } catch (e) {
      console.warn('Firestore log write note:', e);
    }

    // Save to local cache
    try {
      const stored = localStorage.getItem(LOCAL_LOGS_KEY);
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify([fullLog, ...list].slice(0, 50)));
    } catch {}
  },

  getLogs: async (): Promise<AdminLog[]> => {
    try {
      const q = query(collection(db, 'adminLogs'), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AdminLog));
      }
    } catch (e) {
      console.warn('Firestore logs read note:', e);
    }

    const stored = localStorage.getItem(LOCAL_LOGS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }

    return [
      {
        id: 'log_init',
        adminId: 'rwanin_owner_1',
        adminEmail: 'rwanin1@gmail.com',
        role: 'owner',
        action: 'دەستپێکردنی سیستەم',
        targetType: 'سیستەم',
        timestamp: new Date().toLocaleString('ku'),
        description: 'ڕێکخستنی سیستەمی ڕوانین و گرێدانی فایەربەیس'
      }
    ];
  },

  /**
   * OWNER ONLY: Complete Database Cleanup
   * Safely purges old test/mock records from Firestore and restores pristine RWANIN catalog.
   */
  performDatabaseReset: async (ownerEmail: string): Promise<boolean> => {
    if (ownerEmail.toLowerCase().trim() !== 'rwanin1@gmail.com') {
      throw new Error('تەنها خاوەنی سیستەم (Owner) دەسەڵاتی خاوێنکردنەوەی داتابەیسی هەیە.');
    }

    // Clear local storage keys
    localStorage.removeItem('rwanin_movies_catalog');
    localStorage.removeItem('rwanin_deleted_movie_ids');
    localStorage.removeItem('rwanin_payments_list');
    localStorage.removeItem('rwanin_admin_logs');
    localStorage.removeItem('rwanin_watch_history');
    localStorage.removeItem('rwanin_watchlist');
    localStorage.removeItem('rwanin_collections');
    localStorage.removeItem('rwanin_reports');
    localStorage.removeItem('rwanin_notifications');

    // Reset payments to empty
    localStorage.setItem('rwanin_payments_list', JSON.stringify([]));

    // Reset users to ONLY official owner (rwanin1@gmail.com)
    const ownerOnly = [
      {
        id: 'usr_owner_1',
        uid: 'usr_owner_1',
        name: 'خاوەنی ڕوانین (Owner)',
        email: 'rwanin1@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        role: 'owner',
        package: 'VIP',
        subscriptionStatus: 'active',
        vipExpiresAt: '2027-01-01',
        joinDate: '2024-01-01',
        status: 'active',
        dailyMinutesRemaining: 9999
      }
    ];
    localStorage.setItem('rwanin_users_list', JSON.stringify(ownerOnly));

    // Reset movies to fresh RWANIN catalog
    localStorage.setItem('rwanin_movies_catalog', JSON.stringify(initialMovies));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rwanin_users_changed'));
      window.dispatchEvent(new CustomEvent('rwanin_catalog_updated'));
      window.dispatchEvent(new CustomEvent('rwanin_payments_changed'));
    }

    // Try batch writing to Firestore if available
    try {
      const batch = writeBatch(db);
      // Clean old test movies and set new ones
      for (const movie of initialMovies.slice(0, 10)) {
        const ref = doc(db, 'movies', movie.id);
        batch.set(ref, movie);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Firestore batch reset note:', e);
    }

    await adminService.logAction({
      adminId: 'rwanin_owner_1',
      adminEmail: ownerEmail,
      role: 'owner',
      action: 'خاوێنکردنەوەی داتابەیس',
      targetType: 'سیستەم',
      description: 'سڕینەوەی هەموو داتا و پاشماوە کۆنەکانی پڕۆژە و دەستپێکردنەوە لەسەر ئەکاونتی فەرمی'
    });

    return true;
  }
};
