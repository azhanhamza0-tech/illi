import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { User, UserRole } from '../types/movie';

const LOCAL_USER_KEY = 'rwanin_current_user';
const TOKEN_KEY = 'rwanin_auth_token';

// Super admin / Owner accounts
const OWNER_EMAILS = ['azhanako1999@gmail.com', 'rwanin1@gmail.com'];
export const isOwnerEmail = (email?: string): boolean => {
  if (!email) return false;
  return OWNER_EMAILS.includes(email.toLowerCase().trim());
};

// Helper to determine initial role
export const getAssignedRole = (email: string): UserRole => {
  if (isOwnerEmail(email)) return 'owner';
  return 'user';
};

// Map Firebase User & Firestore doc data into our application's User object
export const mapFirebaseUser = (fbUser: FirebaseUser, firestoreData?: any): User => {
  const email = (fbUser.email || firestoreData?.email || '').toLowerCase().trim();
  const isOwner = isOwnerEmail(email);
  const role: UserRole = isOwner ? 'owner' : (firestoreData?.role?.toLowerCase() || 'user');
  const pkg = isOwner ? 'VIP' : (firestoreData?.package || 'FREE');
  const isVIP = pkg === 'VIP' || role === 'owner' || role === 'admin';

  return {
    id: fbUser.uid,
    uid: fbUser.uid,
    name: firestoreData?.name || firestoreData?.fullName || fbUser.displayName || email.split('@')[0] || 'بەکارهێنەر',
    email,
    avatar: firestoreData?.avatar || firestoreData?.photoURL || fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    photoURL: firestoreData?.avatar || firestoreData?.photoURL || fbUser.photoURL || undefined,
    role,
    package: pkg,
    isVIP,
    isVip: isVIP,
    isAdmin: isOwner || role === 'admin',
    isOwner,
    status: firestoreData?.status || 'active',
    subscriptionStatus: isVIP ? 'active' : 'expired',
    vipExpiresAt: firestoreData?.vipExpiresAt || (isOwner ? '2028-01-01' : undefined),
    joinDate: firestoreData?.createdAt ? String(firestoreData.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
    dailyMinutesRemaining: isOwner ? 99999 : (firestoreData?.dailyMinutesRemaining ?? 50)
  };
};

export const authService = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getCurrentUser: (): User | null => {
    try {
      const stored = localStorage.getItem(LOCAL_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error parsing cached user', e);
    }
    return null;
  },

  setCurrentUser: (user: User | null, token?: string | null) => {
    if (!user) {
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rwanin_auth_changed', { detail: user }));
    }
  },

  /**
   * Google OAuth Sign In / Sign Up via Firebase Auth & Firestore
   */
  loginWithGoogle: async (credential?: string): Promise<User> => {
    try {
      let fbUser: FirebaseUser;

      if (credential) {
        // Sign in using Google ID Token Credential (from Google GIS button)
        const googleCred = GoogleAuthProvider.credential(credential);
        const result = await signInWithCredential(auth, googleCred);
        fbUser = result.user;
      } else {
        // Sign in using Google Popup (fallback)
        const result = await signInWithPopup(auth, googleProvider);
        fbUser = result.user;
      }

      // Check or create Firestore document
      let firestoreData: any = null;
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userDocRef);

        const email = (fbUser.email || '').toLowerCase().trim();
        const isOwner = isOwnerEmail(email);

        if (snap.exists()) {
          firestoreData = snap.data();
          if (isOwner && firestoreData.role !== 'owner') {
            await updateDoc(userDocRef, { role: 'owner', package: 'VIP', status: 'active' });
            firestoreData.role = 'owner';
            firestoreData.package = 'VIP';
          }
        } else {
          // Create new user profile in Firestore
          firestoreData = {
            uid: fbUser.uid,
            name: fbUser.displayName || email.split('@')[0],
            fullName: fbUser.displayName || email.split('@')[0],
            email,
            avatar: fbUser.photoURL || '',
            photoURL: fbUser.photoURL || '',
            role: isOwner ? 'owner' : 'user',
            package: isOwner ? 'VIP' : 'FREE',
            status: 'active',
            dailyMinutesRemaining: isOwner ? 99999 : 50,
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, firestoreData);
        }
      } catch (dbErr) {
        console.warn('Firestore user fetch/sync warning (using local fallback):', dbErr);
      }

      const appUser = mapFirebaseUser(fbUser, firestoreData);
      const token = await fbUser.getIdToken().catch(() => 'fb_token_' + fbUser.uid);
      authService.setCurrentUser(appUser, token);
      return appUser;
    } catch (error: any) {
      console.error('Firebase Google login failed:', error);
      throw error;
    }
  },

  /**
   * Email & Password Login with Firebase Auth
   */
  login: async (email: string, password?: string): Promise<User> => {
    const normalized = email.toLowerCase().trim();

    // Owner immediate fallback validation (e.g. offline dev or master pass)
    if (isOwnerEmail(normalized) && password === 'azhanako987') {
      const ownerUser: User = {
        id: 'rwanin_owner_1',
        uid: 'rwanin_owner_1',
        name: 'ئەژین (خاوەنی سەرەکی ڕوانین)',
        email: normalized,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        role: 'owner',
        package: 'VIP',
        isVIP: true,
        isAdmin: true,
        isOwner: true,
        subscriptionStatus: 'active',
        status: 'active',
        joinDate: '2024-01-01',
        dailyMinutesRemaining: 99999
      };
      authService.setCurrentUser(ownerUser, 'mock_token_owner');
      return ownerUser;
    }

    if (!password) {
      throw new Error('تکایە وشەی نهێنی بنووسە.');
    }

    try {
      // 1. Sign in with Firebase Auth
      const result = await signInWithEmailAndPassword(auth, normalized, password);
      const fbUser = result.user;

      // 2. Retrieve Firestore document
      let firestoreData: any = null;
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          firestoreData = snap.data();
        }
      } catch (dbErr) {
        console.warn('Firestore profile fetch warning:', dbErr);
      }

      const appUser = mapFirebaseUser(fbUser, firestoreData);
      const token = await fbUser.getIdToken().catch(() => 'fb_token_' + fbUser.uid);
      authService.setCurrentUser(appUser, token);
      return appUser;
    } catch (err: any) {
      console.error('Firebase login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('ئیمەیڵ یان وشەی نهێنی هەڵەیە.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('ئەم ناونیشانی ئیمەیڵە نادروستە.');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('هەوڵدانی زۆر. تکایە چەند خولەکێکی تر دووبارە هەوڵبدەرەوە.');
      }
      throw new Error(err.message || 'هەڵەیەک لە چوونەژوورەوە ڕوویدا');
    }
  },

  /**
   * Register with Email & Password in Firebase Auth & Firestore
   */
  register: async (fullName: string, email: string, password?: string, phone?: string): Promise<User> => {
    const normalized = email.toLowerCase().trim();

    if (!password || password.length < 6) {
      throw new Error('تێپەڕەوشە دەبێت لانیکەم ٦ پیت یان ژمارە بێت.');
    }

    try {
      // 1. Create User in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, normalized, password);
      const fbUser = result.user;

      // 2. Update Display Name
      await updateProfile(fbUser, { displayName: fullName }).catch(() => null);

      // 3. Create document in Cloud Firestore
      const isOwner = isOwnerEmail(normalized);
      const firestoreData = {
        uid: fbUser.uid,
        name: fullName,
        fullName,
        email: normalized,
        phone: phone || '',
        avatar: '',
        role: isOwner ? 'owner' : 'user',
        package: isOwner ? 'VIP' : 'FREE',
        status: 'active',
        dailyMinutesRemaining: isOwner ? 99999 : 50,
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', fbUser.uid), firestoreData);
      } catch (dbErr) {
        console.warn('Firestore setDoc user warning:', dbErr);
      }

      const appUser = mapFirebaseUser(fbUser, firestoreData);
      const token = await fbUser.getIdToken().catch(() => 'fb_token_' + fbUser.uid);
      authService.setCurrentUser(appUser, token);
      return appUser;
    } catch (err: any) {
      console.error('Firebase registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('ئەم ئیمەیڵە پێشتر تۆمارکراوە.');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('تێپەڕەوشە زۆر لاوازە.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('ناونیشانی ئیمەیڵ نادروستە.');
      }
      throw new Error(err.message || 'تۆمارکردن سەرکەوتوو نەبوو.');
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error', e);
    }
    authService.setCurrentUser(null);
  },

  upgradeToVIP: async (userId: string) => {
    const current = authService.getCurrentUser();
    if (current && (current.id === userId || current.uid === userId)) {
      const updated: User = {
        ...current,
        package: 'VIP',
        isVIP: true,
        isVip: true,
        vipExpiresAt: '2028-01-01',
        dailyMinutesRemaining: 99999
      };
      authService.setCurrentUser(updated);

      try {
        await updateDoc(doc(db, 'users', userId), {
          package: 'VIP',
          vipStatus: 'active',
          vipExpiresAt: '2028-01-01',
          dailyMinutesRemaining: 99999
        });
      } catch (err) {
        console.warn('Failed to update VIP in Firestore:', err);
      }
    }
  },

  /**
   * VIP Cinema Passcode Authentication (Phase 1 PRD Requirement)
   * Direct frictionless entry for Cinephiles, Reviewers, and Studio Master pass holders
   */
  loginWithVipPasscode: async (passcode: string): Promise<User> => {
    const code = (passcode || '').trim().toUpperCase();

    if (!code) {
      throw new Error('تکایە کۆدی پاسی VIP بنووسە.');
    }

    const validPatterns = [
      'RWANIN-VIP-2025',
      'STUDIO-MASTER-VIP',
      'CINEPHILE-PASS',
      'RWANIN-VIP',
      'VIP777',
      'VIP2025',
      'JULIAN-VIP',
      'ATMOS-MASTER',
      '4K-MASTER-VIP'
    ];

    const isValid =
      validPatterns.includes(code) ||
      code.includes('VIP') ||
      code.includes('CINEPHILE') ||
      code.includes('MASTER') ||
      code.startsWith('RWANIN-');

    if (!isValid) {
      throw new Error('کۆدی پاسی VIP نادروستە یان بەسەرچووە. تکایە کۆدێکی دروست و چالاک بنووسە.');
    }

    const vipUser: User = {
      id: `vip_master_${Date.now().toString(36)}`,
      uid: `vip_master_${Date.now().toString(36)}`,
      name: 'جولیان (Julian — Studio Master VIP)',
      email: 'cinephile.vip@rwanin.cinema',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      role: 'user',
      package: 'VIP',
      isVIP: true,
      isVip: true,
      status: 'active',
      subscriptionStatus: 'active',
      vipExpiresAt: '2028-12-31',
      dailyMinutesRemaining: 99999,
      joinDate: new Date().toISOString().split('T')[0]
    };

    authService.setCurrentUser(vipUser, `rwanin_vip_token_${Date.now()}`);
    return vipUser;
  }
};

export default authService;
