import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { User, UserRole, UserPackage, AdminAccount } from '../types/movie';

const LOCAL_USERS_KEY = 'rwanin_users_list';
const LOCAL_ADMINS_KEY = 'rwanin_admins_list';

const defaultUsers: User[] = [
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

const defaultAdmins: AdminAccount[] = [
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

export const userService = {
  // ==========================================
  // USERS / MEMBERS PERSISTENCE
  // ==========================================
  getAllUsers: async (): Promise<User[]> => {
    let firestoreUsers: User[] = [];
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        firestoreUsers = snap.docs.map((d: any) => {
          const data = d.data();
          const role = (data.role || 'user').toLowerCase();
          return {
            id: d.id,
            uid: d.id,
            name: data.fullName || data.name || 'بەکارهێنەر',
            email: data.email || '',
            avatar: data.photoURL || data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            role: role === 'owner' ? 'owner' : role === 'admin' ? 'admin' : 'user',
            package: data.package || 'FREE',
            subscriptionStatus: data.subscriptionStatus || 'active',
            vipExpiresAt: data.vipExpiresAt || data.subscriptionEnd,
            joinDate: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt.split('T')[0] : '2024-01-01') : '2024-01-01',
            status: data.status || 'active',
            dailyMinutesRemaining: data.dailyMinutesRemaining ?? (data.package === 'VIP' ? 9999 : 50)
          };
        });
      }
    } catch (e) {
      console.warn('Firestore users read note:', e);
    }

    // Read and clean local cached fallback
    let localUsers: User[] = [];
    const stored = localStorage.getItem(LOCAL_USERS_KEY);
    if (stored) {
      try {
        localUsers = JSON.parse(stored);
      } catch {}
    }

    // Filter out obsolete dummy accounts: darya, zana, aso, onlineguard
    const dummyEmails = ['darya@gmail.com', 'zana@yahoo.com', 'aso@karkuk.com', 'onlineguard515@gmail.com'];
    localUsers = localUsers.filter((u) => !dummyEmails.includes(u.email.toLowerCase().trim()));
    firestoreUsers = firestoreUsers.filter((u) => !dummyEmails.includes(u.email.toLowerCase().trim()));

    // Merge both Firestore and Local storage by email / uid
    const userMap = new Map<string, User>();
    defaultUsers.forEach((u) => userMap.set(u.email.toLowerCase(), u));
    localUsers.forEach((u) => {
      if (u.email) userMap.set(u.email.toLowerCase(), u);
    });
    firestoreUsers.forEach((u) => {
      if (u.email) userMap.set(u.email.toLowerCase(), u);
    });

    const merged = Array.from(userMap.values());
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(merged));
    return merged;
  },

  getUsers: async (): Promise<User[]> => {
    return userService.getAllUsers();
  },

  addUser: async (userData: Partial<User>): Promise<User> => {
    const id = userData.id || userData.uid || `usr_${Date.now()}`;
    const newUser: User = {
      id,
      uid: id,
      name: userData.name || 'ئەندامی نوێ',
      email: userData.email || '',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: userData.role || 'user',
      package: userData.package || 'FREE',
      subscriptionStatus: userData.subscriptionStatus || 'active',
      vipExpiresAt: userData.package === 'VIP' ? (userData.vipExpiresAt || '2027-01-01') : undefined,
      joinDate: userData.joinDate || new Date().toISOString().slice(0, 10),
      status: userData.status || 'active',
      dailyMinutesRemaining: userData.package === 'VIP' ? 9999 : 50,
      createdAt: new Date().toISOString()
    };

    // 1. Save to Firestore
    try {
      await setDoc(doc(db, 'users', id), newUser);
    } catch (e) {
      console.warn('Firestore user write note:', e);
    }

    // 2. Save to localStorage
    const currentUsers = await userService.getAllUsers();
    const updated = [newUser, ...currentUsers.filter((u) => u.id !== id && u.email !== newUser.email)];
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('rwanin_users_changed'));

    return newUser;
  },

  deleteUser: async (userId: string): Promise<void> => {
    const currentUsers = await userService.getAllUsers();
    const target = currentUsers.find((u) => u.id === userId || u.uid === userId);
    if (target?.email === 'rwanin1@gmail.com' || target?.role === 'owner') {
      throw new Error('ناتوانیت خاوەنی سەرەکی بسڕیتەوە!');
    }

    // 1. Remove from Firestore
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.warn('Firestore user delete note:', e);
    }

    // 2. Remove from localStorage
    const updated = currentUsers.filter((u) => u.id !== userId && u.uid !== userId);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('rwanin_users_changed'));
  },

  updateUserStatus: async (userId: string, newStatus: 'active' | 'blocked'): Promise<void> => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore status update note:', e);
    }

    const currentUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || JSON.stringify(defaultUsers));
    const updated = currentUsers.map((u: User) => (u.id === userId || u.uid === userId ? { ...u, status: newStatus } : u));
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('rwanin_users_changed'));
  },

  toggleUserStatus: async (userId: string, newStatus: 'active' | 'blocked'): Promise<void> => {
    return userService.updateUserStatus(userId, newStatus);
  },

  updateUserRole: async (userId: string, newRole: UserRole): Promise<void> => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore role update note:', e);
    }

    const currentUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || JSON.stringify(defaultUsers));
    const updated = currentUsers.map((u: User) => (u.id === userId || u.uid === userId ? { ...u, role: newRole } : u));
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('rwanin_users_changed'));
  },

  updateUserPackage: async (userId: string, newPackage: UserPackage): Promise<void> => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        package: newPackage,
        vipExpiresAt: newPackage === 'VIP' ? '2027-01-01' : null,
        dailyMinutesRemaining: newPackage === 'VIP' ? 9999 : 50,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore package update note:', e);
    }

    const currentUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || JSON.stringify(defaultUsers));
    const updated = currentUsers.map((u: User) =>
      u.id === userId || u.uid === userId
        ? {
            ...u,
            package: newPackage,
            vipExpiresAt: newPackage === 'VIP' ? '2027-01-01' : undefined,
            dailyMinutesRemaining: newPackage === 'VIP' ? 9999 : 50
          }
        : u
    );
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('rwanin_users_changed'));
  },

  subscribeToUsers: (callback: (users: User[]) => void) => {
    userService.getAllUsers().then(callback);
    const handler = () => {
      userService.getAllUsers().then(callback);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('rwanin_users_changed', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('rwanin_users_changed', handler);
      }
    };
  },

  // ==========================================
  // ADMINS PERSISTENCE
  // ==========================================
  getAdmins: async (): Promise<AdminAccount[]> => {
    try {
      const snap = await getDocs(collection(db, 'admins'));
      if (!snap.empty) {
        const firestoreAdmins: AdminAccount[] = snap.docs.map((d: any) => {
          const data = d.data();
          return {
            id: d.id,
            email: data.email || '',
            name: data.name || '',
            role: data.role || 'admin',
            status: data.status || 'active',
            avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            createdAt: data.createdAt ? data.createdAt.slice(0, 10) : '2024-01-01'
          };
        });
        localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(firestoreAdmins));
        return firestoreAdmins;
      }
    } catch (e) {
      console.warn('Firestore admins read note:', e);
    }

    const stored = localStorage.getItem(LOCAL_ADMINS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.filter((a: any) => a.email !== 'onlineguard515@gmail.com');
      } catch {}
    }
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(defaultAdmins));
    return defaultAdmins;
  },

  addAdmin: async (adminData: { name: string; email: string; role?: 'owner' | 'admin'; status?: 'active' | 'disabled' }): Promise<AdminAccount> => {
    const id = `adm_${Date.now()}`;
    const newAdmin: AdminAccount = {
      id,
      name: adminData.name.trim(),
      email: adminData.email.trim().toLowerCase(),
      role: adminData.role || 'admin',
      status: adminData.status || 'active',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      createdAt: new Date().toISOString().slice(0, 10)
    };

    // 1. Save to Firestore admins collection
    try {
      await setDoc(doc(db, 'admins', id), newAdmin);
    } catch (e) {
      console.warn('Firestore admin write note:', e);
    }

    // 2. Also ensure user document exists with admin role
    try {
      await setDoc(
        doc(db, 'users', id),
        {
          id,
          uid: id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          package: 'VIP',
          status: 'active',
          avatar: newAdmin.avatar,
          createdAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore user admin sync note:', e);
    }

    // 3. Update localStorage
    const currentAdmins = await userService.getAdmins();
    const updated = [...currentAdmins.filter((a) => a.email !== newAdmin.email), newAdmin];
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(updated));

    return newAdmin;
  },

  deleteAdmin: async (adminId: string, email: string): Promise<void> => {
    if (email.toLowerCase() === 'rwanin1@gmail.com') {
      throw new Error('ناتوانیت خاوەنی سەرەکی بسڕیتەوە!');
    }

    // 1. Delete from Firestore admins
    try {
      await deleteDoc(doc(db, 'admins', adminId));
    } catch (e) {
      console.warn('Firestore admin delete note:', e);
    }

    // 2. Update localStorage
    const currentAdmins = await userService.getAdmins();
    const updated = currentAdmins.filter((a) => a.id !== adminId && a.email !== email);
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(updated));
  },

  toggleAdminStatus: async (adminId: string, nextStatus: 'active' | 'disabled'): Promise<void> => {
    try {
      await updateDoc(doc(db, 'admins', adminId), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore admin status update note:', e);
    }

    const currentAdmins = await userService.getAdmins();
    const updated = currentAdmins.map((a) => (a.id === adminId ? { ...a, status: nextStatus } : a));
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(updated));
  }
};
