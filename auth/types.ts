export type UserRole = 'USER' | 'ADMIN' | 'OWNER' | 'user' | 'admin' | 'owner';
export type UserPackage = 'FREE' | 'VIP';
export type VipStatus = 'inactive' | 'active' | 'expired';

export interface AuthUser {
  uid: string;
  id: string;
  email: string | null;
  displayName?: string | null;
  name?: string;
  photoURL?: string | null;
  avatar?: string;
  emailVerified: boolean;
  role: UserRole;
  package: UserPackage;
  status?: string;
  dailyMinutesRemaining?: number;
}

export interface UserProfile {
  uid: string;
  id?: string;
  fullName: string;
  name?: string;
  email: string;
  phone?: string;
  role: UserRole;
  emailVerified: boolean;
  package: UserPackage;
  vipStatus: VipStatus;
  vipExpiresAt?: any | null;
  photoURL: string | null;
  avatar?: string;
  status: 'active' | 'blocked';
  dailyMinutesRemaining?: number;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any | null;
}

export interface SignUpData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
  termsAccepted?: boolean;
}

export interface AuthContextType {
  user: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoggedIn: boolean;
  isVIP: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: (credential?: string) => Promise<any>;
  signup: (data: SignUpData) => Promise<any>;
  register: (name: string, email: string, password?: string) => Promise<any>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
  checkVerification: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  loginWithVipPasscode?: (passcode: string) => Promise<any>;
  upgradeToVIP?: (userId: string) => Promise<void>;
}
