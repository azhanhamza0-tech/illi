import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AuthContextType, SignUpData, UserProfile, AuthUser } from './types';
import { authService, isOwnerEmail } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile data to state & storage
  const syncProfile = useCallback((u: any) => {
    if (!u) {
      setUser(null);
      setUserProfile(null);
      return;
    }

    const email = (u.email || '').toLowerCase().trim();
    const isOwner = isOwnerEmail(email);
    const role = isOwner ? 'owner' : (u.role || 'user').toLowerCase();
    const pkg = isOwner ? 'VIP' : (u.package || 'FREE').toUpperCase();
    const isAdmin = role === 'admin' || isOwner;
    const isVIP = pkg === 'VIP' || isAdmin;

    const authUserObj: AuthUser = {
      uid: u.uid || u.id || `u_${Date.now()}`,
      id: u.id || u.uid || `u_${Date.now()}`,
      email,
      name: u.name || u.fullName || email.split('@')[0] || 'ڕوانین',
      displayName: u.name || u.fullName || email.split('@')[0] || 'ڕوانین',
      avatar: u.avatar || u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      photoURL: u.avatar || u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      emailVerified: true,
      role: role as any,
      package: pkg as any,
      status: u.status || 'active',
      dailyMinutesRemaining: u.dailyMinutesRemaining ?? (isOwner ? 99999 : 50)
    };

    const profileObj: UserProfile = {
      uid: authUserObj.uid,
      id: authUserObj.id,
      fullName: authUserObj.name || '',
      name: authUserObj.name || '',
      email: authUserObj.email || '',
      phone: u.phone || '',
      role: role as any,
      emailVerified: true,
      package: pkg as any,
      vipStatus: isVIP ? 'active' : 'inactive',
      vipExpiresAt: u.vipExpiresAt || null,
      photoURL: authUserObj.avatar || null,
      avatar: authUserObj.avatar,
      status: 'active',
      dailyMinutesRemaining: authUserObj.dailyMinutesRemaining,
      createdAt: u.joinDate || '2024-01-01',
      lastLoginAt: new Date().toISOString()
    };

    setUser(authUserObj);
    setUserProfile(profileObj);
  }, []);

  // Initialize user from cached session and listen to Firebase Auth
  useEffect(() => {
    // 1. Initial fast load from local cache
    const cachedUser = authService.getCurrentUser();
    if (cachedUser) {
      syncProfile(cachedUser);
    }
    setLoading(false);

    // 2. Real-time Firebase Auth state change listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: any) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          let firestoreData = snap.exists() ? snap.data() : null;

          const email = (fbUser.email || '').toLowerCase().trim();
          const isOwner = isOwnerEmail(email);

          const syncedUser = {
            id: fbUser.uid,
            uid: fbUser.uid,
            name: firestoreData?.name || firestoreData?.fullName || fbUser.displayName || email.split('@')[0],
            email,
            avatar: firestoreData?.avatar || firestoreData?.photoURL || fbUser.photoURL,
            role: isOwner ? 'owner' : (firestoreData?.role || 'user'),
            package: isOwner ? 'VIP' : (firestoreData?.package || 'FREE'),
            status: firestoreData?.status || 'active',
            dailyMinutesRemaining: isOwner ? 99999 : (firestoreData?.dailyMinutesRemaining ?? 50)
          };

          syncProfile(syncedUser);
          authService.setCurrentUser(syncedUser as any);
        } catch (err) {
          console.warn('Error reading user profile from Firestore on auth change:', err);
        }
      } else {
        // If no Firebase user and cached user was not offline master admin, clear session
        const current = authService.getCurrentUser();
        if (current && isOwnerEmail(current.email) && current.id === 'rwanin_owner_1') {
          // Keep offline master session
        } else {
          syncProfile(null);
        }
      }
    });

    // 3. Custom internal events
    const handleAuthCustomEvent = (e: any) => {
      const updated = e.detail !== undefined ? e.detail : authService.getCurrentUser();
      syncProfile(updated);
    };

    window.addEventListener('rwanin_auth_changed', handleAuthCustomEvent);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('rwanin_auth_changed', handleAuthCustomEvent);
    };
  }, [syncProfile]);

  // Google OAuth Login
  const loginWithGoogle = async (credential?: string): Promise<any> => {
    setLoading(true);
    try {
      const loggedUser = await authService.loginWithGoogle(credential);
      syncProfile(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  // Standard Email & Password Login
  const login = async (email: string, password?: string): Promise<any> => {
    setLoading(true);
    try {
      const loggedUser = await authService.login(email, password);
      syncProfile(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  // Sign up
  const signup = async (data: SignUpData): Promise<any> => {
    setLoading(true);
    try {
      const newUser = await authService.register(data.fullName, data.email, data.password, data.phone);
      syncProfile(newUser);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password?: string): Promise<any> => {
    return signup({ fullName: name, email, password: password || 'Azhan1234' });
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setUserProfile(null);
  };

  const resendVerification = async () => {
    // Firebase auth handles verification if enabled
  };

  const checkVerification = async () => {
    return true;
  };

  const resetPassword = async (email: string) => {
    console.log('Password reset requested for', email);
  };

  const loginWithVipPasscode = async (passcode: string): Promise<any> => {
    setLoading(true);
    try {
      const vipUser = await authService.loginWithVipPasscode(passcode);
      syncProfile(vipUser);
      return vipUser;
    } finally {
      setLoading(false);
    }
  };

  const role = (user?.role || userProfile?.role || 'user').toLowerCase();
  const pkg = (user?.package || userProfile?.package || 'FREE').toUpperCase();
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin' || isOwner;
  const isVIP = pkg === 'VIP' || isAdmin;
  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isAuthenticated,
    isEmailVerified: true,
    isLoggedIn: isAuthenticated,
    isVIP,
    isAdmin,
    isOwner,
    login,
    loginWithGoogle,
    signup,
    register,
    logout,
    resendVerification,
    checkVerification,
    resetPassword,
    loginWithVipPasscode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
