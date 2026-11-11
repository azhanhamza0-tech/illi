import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  reload,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { SignUpData, UserProfile } from './types';

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

export const validatePhone = (phone: string): boolean => {
  // Allow digits with optional leading +, spaces, or dashes (at least 8 digits)
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?[0-9]{8,15}$/.test(cleaned);
};

export const validatePassword = (password: string): { valid: boolean; errorKey?: string } => {
  if (password.length < 8) {
    return { valid: false, errorKey: 'min_length' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, errorKey: 'no_uppercase' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, errorKey: 'no_lowercase' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, errorKey: 'no_number' };
  }
  return { valid: true };
};

// Map Firebase errors to Kurdish Sorani
export const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'هەڵەیەکی نەزانراو ڕوویدا.';
  const code = error.code || error.message || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'ئیمەیڵ یان وشەی نهێنی هەڵەیە.';
    case 'auth/user-not-found':
      return 'ئەم هەژمارەیە نەدۆزرایەوە.';
    case 'auth/email-already-in-use':
      return 'ئەم ئیمەیڵە پێشتر هەژماری هەیە.';
    case 'auth/invalid-email':
      return 'ناونیشانی ئیمەیڵەکە نادروستە.';
    case 'auth/weak-password':
      return 'تێپەڕەوشەکە لاوازە، دەبێت لانی کەم ٨ پیت بێت لەگەڵ پیتی گەورە و بچووک و ژمارە.';
    case 'auth/too-many-requests':
      return 'هەوڵەکان زۆر بوون. تکایە چەند خولەکێک دواتر هەوڵ بدەرەوە.';
    case 'auth/network-request-failed':
      return 'کێشەی هێڵی ئینتەرنێت هەیە. تکایە هێڵەکەت بپشکنە.';
    case 'auth/user-disabled':
      return 'ئەم هەژمارە لەلایەن ڕوانینەوە ناچالاک کراوە.';
    case 'auth/operation-not-allowed':
      return 'چوونەژوورەوە بە ئیمەیڵ لە ئێستادا کارا نییە.';
    case 'auth/requires-recent-login':
      return 'تکایە دووبارە بچۆ ژوورەوە بۆ ئەنجامدانی ئەم کردارە.';
    case 'auth/expired-action-code':
      return 'بەستەری پشتڕاستکردنەوە بەسەرچووە. تکایە داوای بەستەرێکی نوێ بکە.';
    case 'auth/invalid-action-code':
      return 'بەستەری پشتڕاستکردنەوە نادروستە یان پێشتر بەکارهاتووە.';
    default:
      if (typeof error === 'string') return error;
      if (error.message && !error.message.includes('Firebase:')) return error.message;
      return 'کێشەیەک ڕوویدا. تکایە دووبارە هەوڵ بدەرەوە.';
  }
};

/**
 * 1. Sign up new user
 * Validates, creates Firebase Auth account, updates displayName,
 * creates users/{uid} document in Firestore, and sends verification email.
 * Never stores password in Firestore.
 */
export const signUpUser = async (data: SignUpData): Promise<FirebaseUser> => {
  // Validate Full Name
  const trimmedName = data.fullName ? data.fullName.trim() : '';
  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('تکایە ناوی تەواو بنووسە (لانی کەم ٢ پیت).');
  }

  // Validate Email
  const lowerEmail = data.email ? data.email.trim().toLowerCase() : '';
  if (!validateEmail(lowerEmail)) {
    throw new Error('تکایە ناونیشانێکی دروستی ئیمەیڵ بنووسە.');
  }

  // Validate Phone
  const trimmedPhone = data.phone ? data.phone.trim() : '';
  if (!validatePhone(trimmedPhone)) {
    throw new Error('تکایە ژمارە مۆبایلێکی دروست بنووسە (نموونە: 0750xxxxxxx یان +9647xxxxxxxxx).');
  }

  // Validate Password
  const pwdCheck = validatePassword(data.password);
  if (!pwdCheck.valid) {
    if (pwdCheck.errorKey === 'min_length') {
      throw new Error('تێپەڕەوشە دەبێت لانی کەم ٨ پیت بێت.');
    }
    throw new Error('تێپەڕەوشە دەبێت پیتی گەورە (A-Z)، پیتی بچووک (a-z) و ژمارە (0-9)ی تێدابێت.');
  }

  // Validate Password Confirmation
  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    throw new Error('تێپەڕەوشە و دووپاتکردنەوەکەی وەک یەک نین.');
  }

  // Create Firebase Auth user
  const cred = await createUserWithEmailAndPassword(auth, lowerEmail, data.password);
  const fbUser = cred.user;

  // Update displayName in Firebase Auth
  try {
    await updateProfile(fbUser, { displayName: trimmedName });
  } catch (profileErr) {
    console.warn('Could not update Firebase displayName:', profileErr);
  }

  // Create User Document in Firestore: users/{uid}
  // IMPORTANT: Password is NEVER saved in Firestore!
  const initialUserData: UserProfile = {
    uid: fbUser.uid,
    id: fbUser.uid,
    fullName: trimmedName,
    name: trimmedName,
    email: lowerEmail,
    phone: trimmedPhone,
    role: 'USER',
    emailVerified: false,
    package: 'FREE',
    vipStatus: 'inactive',
    vipExpiresAt: null,
    photoURL: fbUser.photoURL || null,
    avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    status: 'active',
    dailyMinutesRemaining: 50,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: null
  };

  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    await setDoc(userDocRef, initialUserData);
  } catch (firestoreErr) {
    console.error('Firestore user profile creation error:', firestoreErr);
  }

  // Ensure user immediately appears in Admin Users list
  try {
    const rawStored = localStorage.getItem('rwanin_users_list');
    let usersList: any[] = [];
    if (rawStored) {
      try { usersList = JSON.parse(rawStored); } catch (_) {}
    }
    const newMemberUser = {
      id: fbUser.uid,
      uid: fbUser.uid,
      name: trimmedName,
      email: lowerEmail,
      phone: trimmedPhone,
      role: 'user',
      package: 'FREE',
      subscriptionStatus: 'active',
      status: 'active',
      joinDate: new Date().toISOString().slice(0, 10),
      dailyMinutesRemaining: 50,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    };
    const cleaned = usersList.filter((u: any) => u.email?.toLowerCase() !== lowerEmail);
    localStorage.setItem('rwanin_users_list', JSON.stringify([newMemberUser, ...cleaned]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rwanin_users_changed'));
    }
  } catch (e) {
    console.warn('Sync to local users error:', e);
  }

  // Send Firebase Email Verification
  try {
    await sendEmailVerification(fbUser);
  } catch (verifyErr) {
    console.warn('Verification email dispatch error:', verifyErr);
  }

  return fbUser;
};

/**
 * 2. Login user
 * Authenticates with Firebase, reloads user to get current emailVerified status,
 * and if verified, updates lastLoginAt and retrieves Firestore profile.
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: FirebaseUser; profile: UserProfile | null; verified: boolean }> => {
  const lowerEmail = email.trim().toLowerCase();
  const cred = await signInWithEmailAndPassword(auth, lowerEmail, password);
  let fbUser = cred.user;

  // Reload user to get fresh token and latest emailVerified status
  try {
    await reload(fbUser);
    fbUser = auth.currentUser || fbUser;
  } catch (reloadErr) {
    console.warn('User reload error:', reloadErr);
  }

  const isVerified = Boolean(fbUser.emailVerified);

  let profile: UserProfile | null = null;

  if (isVerified) {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        profile = snap.data() as UserProfile;
        // Update last login and ensure emailVerified is synced
        await updateDoc(userDocRef, {
          emailVerified: true,
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Safe profile creation if doc doesn't exist
        profile = {
          uid: fbUser.uid,
          id: fbUser.uid,
          fullName: fbUser.displayName || lowerEmail.split('@')[0],
          name: fbUser.displayName || lowerEmail.split('@')[0],
          email: lowerEmail,
          phone: fbUser.phoneNumber || '',
          role: 'USER',
          emailVerified: true,
          package: 'FREE',
          vipStatus: 'inactive',
          vipExpiresAt: null,
          photoURL: fbUser.photoURL || null,
          avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          status: 'active',
          dailyMinutesRemaining: 50,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        };
        await setDoc(userDocRef, profile);
      }
    } catch (dbErr) {
      console.warn('Firestore user profile sync warning:', dbErr);
    }
  }

  return { user: fbUser, profile, verified: isVerified };
};

/**
 * 3. Logout user
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * 4. Send email verification
 */
export const sendVerificationEmail = async (user?: FirebaseUser): Promise<void> => {
  const targetUser = user || auth.currentUser;
  if (!targetUser) {
    throw new Error('هیچ بەکارهێنەرێک نەدۆزرایەوە بۆ ناردنی ئیمەیڵ.');
  }
  await sendEmailVerification(targetUser);
};

/**
 * 5. Resend verification email
 */
export const resendVerificationEmail = async (user?: FirebaseUser): Promise<void> => {
  await sendVerificationEmail(user);
};

/**
 * 6. Check email verification status
 * Reloads user, checks user.emailVerified, and if true updates Firestore.
 */
export const checkEmailVerification = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  await reload(user);
  const updatedUser = auth.currentUser;
  if (!updatedUser) return false;

  if (updatedUser.emailVerified) {
    try {
      const userDocRef = doc(db, 'users', updatedUser.uid);
      await updateDoc(userDocRef, {
        emailVerified: true,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Could not sync emailVerified status to Firestore:', e);
    }
    return true;
  }

  return false;
};

/**
 * 7. Reset password
 */
export const resetPassword = async (email: string): Promise<void> => {
  const lowerEmail = email.trim().toLowerCase();
  if (!validateEmail(lowerEmail)) {
    throw new Error('تکایە ناونیشانێکی دروستی ئیمەیڵ بنووسە.');
  }
  await sendPasswordResetEmail(auth, lowerEmail);
};

/**
 * 8. Get current Firebase user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * 9. Get Firestore User Profile
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Error reading user profile:', err);
  }
  return null;
};

/**
 * 10. Create User Profile
 */
export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(
    userDocRef,
    {
      ...data,
      uid,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

/**
 * 11. Update Last Login Timestamp
 */
export const updateLastLogin = async (uid: string): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Could not update last login:', err);
  }
};
