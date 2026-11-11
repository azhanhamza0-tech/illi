import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { initialMovies } from '../data/movies';
import { User, PaymentRequest } from '../types/movie';

const initialUsers: User[] = [
  {
    id: 'usr_owner_1',
    uid: 'usr_owner_1',
    name: 'خاوەنی پلاتفۆرم (ڕوانین)',
    email: 'rwanin1@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: 'owner',
    package: 'VIP',
    subscriptionStatus: 'active',
    vipExpiresAt: '2027-01-01',
    joinDate: '2024-01-01',
    status: 'active',
    dailyMinutesRemaining: 9999,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const initialCategories = [
  { id: 'cat-1', nameKurdish: 'ئاکشن (Action)', nameEnglish: 'Action', count: 42 },
  { id: 'cat-2', nameKurdish: 'کۆمیدی (Comedy)', nameEnglish: 'Comedy', count: 28 },
  { id: 'cat-3', nameKurdish: 'ترسناک (Horror)', nameEnglish: 'Horror', count: 19 },
  { id: 'cat-4', nameKurdish: 'ڕۆمانسی (Romance)', nameEnglish: 'Romance', count: 23 },
  { id: 'cat-5', nameKurdish: 'دراما (Drama)', nameEnglish: 'Drama', count: 54 },
  { id: 'cat-6', nameKurdish: 'زانستی خەیاڵی (Sci-Fi)', nameEnglish: 'Sci-Fi', count: 18 },
  { id: 'cat-7', nameKurdish: 'ئەنیمەیشن (Animation)', nameEnglish: 'Animation', count: 31 },
  { id: 'cat-8', nameKurdish: 'سینەمای کوردی (Kurdish)', nameEnglish: 'Kurdish', count: 65 },
  { id: 'cat-9', nameKurdish: 'تورکی (Turkish)', nameEnglish: 'Turkish', count: 27 },
  { id: 'cat-10', nameKurdish: 'عەرەبی (Arabic)', nameEnglish: 'Arabic', count: 21 },
  { id: 'cat-11', nameKurdish: 'ئینگلیزی (English)', nameEnglish: 'English', count: 70 }
];

const initialPaymentsData: PaymentRequest[] = [];

let isSeedingRunning = false;

export const dbSeeder = {
  /**
   * Automatically seed Firestore collections if they are empty
   */
  seedFirestoreIfEmpty: async (): Promise<{ seeded: boolean; message: string }> => {
    if (isSeedingRunning) {
      return { seeded: false, message: 'Seeding already in progress' };
    }

    isSeedingRunning = true;
    try {
      // 1. Check movies
      let moviesEmpty = false;
      try {
        const moviesSnap = await getDocs(collection(db, 'movies'));
        moviesEmpty = moviesSnap.empty;
      } catch (err) {
        console.warn('Could not read Firestore movies for check:', err);
      }

      if (moviesEmpty) {
        console.log('Seeding initial movies to Firestore...');
        for (const movie of initialMovies) {
          try {
            await setDoc(doc(db, 'movies', movie.id), {
              ...movie,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          } catch (e) {
            console.warn(`Failed writing movie ${movie.id}:`, e);
          }
        }
      }

      // 2. Check users
      let usersEmpty = false;
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersEmpty = usersSnap.empty;
      } catch (err) {
        console.warn('Could not read Firestore users for check:', err);
      }

      if (usersEmpty) {
        console.log('Seeding initial users to Firestore...');
        for (const u of initialUsers) {
          try {
            await setDoc(doc(db, 'users', u.id), u);
          } catch (e) {
            console.warn(`Failed writing user ${u.id}:`, e);
          }
        }
      }

      // 3. Check categories
      let catEmpty = false;
      try {
        const catSnap = await getDocs(collection(db, 'categories'));
        catEmpty = catSnap.empty;
      } catch (err) {
        console.warn('Could not read Firestore categories for check:', err);
      }

      if (catEmpty) {
        for (const cat of initialCategories) {
          try {
            await setDoc(doc(db, 'categories', cat.id), cat);
          } catch (e) {}
        }
      }

      // 4. Check payments
      let payEmpty = false;
      try {
        const paySnap = await getDocs(collection(db, 'payments'));
        payEmpty = paySnap.empty;
      } catch (err) {
        console.warn('Could not read Firestore payments for check:', err);
      }

      if (payEmpty) {
        for (const p of initialPaymentsData) {
          try {
            await setDoc(doc(db, 'payments', p.id), p);
          } catch (e) {}
        }
      }

      // 5. Check admins
      let adminsEmpty = false;
      try {
        const admSnap = await getDocs(collection(db, 'admins'));
        adminsEmpty = admSnap.empty;
      } catch (err) {
        console.warn('Could not read Firestore admins for check:', err);
      }

      if (adminsEmpty) {
        const defaultAdmins = [
          {
            id: 'adm_1',
            email: 'rwanin1@gmail.com',
            name: 'خاوەنی سەرەکی (ڕوانین)',
            role: 'owner',
            status: 'active',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            createdAt: '2024-01-01'
          }
        ];
        for (const adm of defaultAdmins) {
          try {
            await setDoc(doc(db, 'admins', adm.id), adm);
          } catch (e) {}
        }
      }

      // 6. Check staff
      let staffEmpty = false;
      try {
        const staffSnap = await getDocs(collection(db, 'staff'));
        staffEmpty = staffSnap.empty;
      } catch (err) {
        console.warn('Could not read Firestore staff for check:', err);
      }

      if (staffEmpty) {
        const defaultStaff = [
          {
            id: 'stf_1',
            name: 'خاوەنی ماڵپەڕ (Owner)',
            roleTitle: 'دامەزرێنەر و بەڕێوەبەری سەرەکی پلاتفۆرم',
            category: 'owner',
            badge: 'OWNER & FOUNDER',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
            bio: 'دامەزرێنەری پلاتفۆرمی ڕوانین ستریم بۆ پێشکەشکردنی بەهێزترین فیلم، زنجیرە و ئەنیمێ بە ژێرنووسی کوردی.',
            email: 'rwanin1@gmail.com',
            telegram: 'https://t.me/rwanin_stream',
            order: 1,
            createdAt: '2024-01-01'
          }
        ];
        for (const st of defaultStaff) {
          try {
            await setDoc(doc(db, 'staff', st.id), st);
          } catch (e) {}
        }
      }

      isSeedingRunning = false;
      return { seeded: true, message: 'داتابەیسی فایەربەیس بە سەرکەوتوویی پڕکرایەوە و سینک کرا.' };
    } catch (error: any) {
      isSeedingRunning = false;
      console.warn('Seed error:', error);
      return { seeded: false, message: error.message || 'هەڵە لە پڕکردنەوەی داتابەیس' };
    }
  },

  /**
   * Force overwrite / sync all collections to Firestore (useful for Admin)
   */
  forceSyncAllCollections: async (): Promise<{ success: boolean; count: number }> => {
    let count = 0;
    try {
      for (const movie of initialMovies) {
        await setDoc(doc(db, 'movies', movie.id), {
          ...movie,
          updatedAt: new Date().toISOString()
        });
        count++;
      }

      for (const u of initialUsers) {
        await setDoc(doc(db, 'users', u.id), u);
        count++;
      }

      for (const cat of initialCategories) {
        await setDoc(doc(db, 'categories', cat.id), cat);
        count++;
      }

      return { success: true, count };
    } catch (e: any) {
      console.warn('Force sync note:', e);
      return { success: false, count };
    }
  }
};
