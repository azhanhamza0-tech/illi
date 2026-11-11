import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { StaffMember } from '../types/movie';

const LOCAL_STAFF_KEY = 'rwanin_staff_list';

const defaultStaff: StaffMember[] = [
  {
    id: 'stf_1',
    name: 'خاوەنی ماڵپەڕ (Owner)',
    roleTitle: 'دامەزرێنەر و بەڕێوەبەری سەرەکی پلاتفۆرم',
    category: 'owner',
    badge: 'OWNER & FOUNDER',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    bio: 'دامەزرێنەری پلاتفۆرمی ڕوانین ستریم بۆ پێشکەشکردنی بەهێزترین فیلم، زنجیرە و ئەنیمێ بە ژێرنووسی کوردی و کوالیتی بێ وێنە.',
    email: 'rwanin1@gmail.com',
    telegram: 'https://t.me/rwanin_stream',
    instagram: 'https://instagram.com/rwanin.stream',
    order: 1,
    createdAt: '2024-01-01'
  },
  {
    id: 'stf_3',
    name: 'دیاری ئەحمەد',
    roleTitle: 'سەرپەرشتیاری بەشی وەرگێڕانی کوردی',
    category: 'translator',
    badge: 'HEAD TRANSLATOR',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400',
    bio: 'وەرگێڕی فەرمی زنجیرە دراماکان و فیلمە بەناوبانگە جیهانییەکان بە کوردییەکی پاراو و ڕێک و پێك.',
    telegram: 'https://t.me/rwanin_stream',
    order: 3,
    createdAt: '2024-03-10'
  },
  {
    id: 'stf_4',
    name: 'سۆران کامەران',
    roleTitle: 'پەرەپێدەری سیستم و ئەندازیاری داتابەیس',
    category: 'developer',
    badge: 'LEAD DEVELOPER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    bio: 'بەرپرسی بەشی تەکنیکی، دیزاینی UI/UX و پەرەپێدانی سێرڤەر و ژێرخانی پەخشی خێرای ڕوانین.',
    telegram: 'https://t.me/rwanin_stream',
    order: 4,
    createdAt: '2024-04-01'
  }
];

export const staffService = {
  getStaff: async (): Promise<StaffMember[]> => {
    try {
      const snap = await getDocs(collection(db, 'staff'));
      if (!snap.empty) {
        const list: StaffMember[] = snap.docs.map((d: any) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || '',
            roleTitle: data.roleTitle || '',
            category: data.category || 'admin',
            badge: data.badge || '',
            avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
            bio: data.bio || '',
            email: data.email || '',
            telegram: data.telegram || '',
            instagram: data.instagram || '',
            order: data.order ?? 99,
            createdAt: data.createdAt ? data.createdAt.slice(0, 10) : '2024-01-01'
          };
        });
        const cleanedList = list.filter((s) => s.email !== 'onlineguard515@gmail.com' && s.id !== 'stf_2');
        cleanedList.sort((a, b) => a.order - b.order);
        localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(cleanedList));
        return cleanedList;
      }
    } catch (e) {
      console.warn('Firestore staff read note:', e);
    }

    const stored = localStorage.getItem(LOCAL_STAFF_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const cleanedStored = parsed.filter((s: StaffMember) => s.email !== 'onlineguard515@gmail.com' && s.id !== 'stf_2');
        cleanedStored.sort((a: StaffMember, b: StaffMember) => a.order - b.order);
        return cleanedStored;
      } catch {}
    }

    localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(defaultStaff));
    return defaultStaff;
  },

  addStaff: async (staffData: Omit<StaffMember, 'id' | 'createdAt'>): Promise<StaffMember> => {
    const id = `stf_${Date.now()}`;
    const newStaff: StaffMember = {
      ...staffData,
      id,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'staff', id), newStaff);
    } catch (e) {
      console.warn('Firestore staff write note:', e);
    }

    // Save to localStorage
    const current = await staffService.getStaff();
    const updated = [...current, newStaff];
    updated.sort((a, b) => a.order - b.order);
    localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(updated));

    return newStaff;
  },

  updateStaff: async (id: string, updates: Partial<StaffMember>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'staff', id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore staff update note:', e);
    }

    const current = await staffService.getStaff();
    const updated = current.map((s) => (s.id === id ? { ...s, ...updates } : s));
    updated.sort((a, b) => a.order - b.order);
    localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(updated));
  },

  deleteStaff: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'staff', id));
    } catch (e) {
      console.warn('Firestore staff delete note:', e);
    }

    const current = await staffService.getStaff();
    const updated = current.filter((s) => s.id !== id);
    localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(updated));
  }
};
