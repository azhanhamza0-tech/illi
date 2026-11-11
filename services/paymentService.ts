import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { PaymentRequest } from '../types/movie';
import { authService } from './authService';
import { userService } from './userService';
import { adminService } from './adminService';

export interface PaymentConfig {
  fibNumber: string;
  qiCardNumber: string;
  qrCodeText: string;
  vipPriceText: string;
  priceDinars: number;
}

export const PAYMENT_CONFIG_STORAGE_KEY = 'rwanin_payment_config';

export const defaultPaymentConfig: PaymentConfig = {
  fibNumber: '0750 999 8888',
  qiCardNumber: '9845 1204 9921 5410',
  qrCodeText: 'RWANIN-VIP-PAY-9812',
  vipPriceText: '5,000 IQD',
  priceDinars: 5000
};

const PAYMENTS_STORAGE_KEY = 'rwanin_payments_list';

const initialPayments: PaymentRequest[] = [];

export const paymentService = {
  getPayments: async (): Promise<PaymentRequest[]> => {
    try {
      const snap = await getDocs(collection(db, 'payments'));
      if (!snap.empty) {
        const list = snap.docs.map((d: any) => {
          const data = d.data();
          // Normalize status casing to Title Case ('Pending', 'Approved', 'Rejected')
          let normalizedStatus: any = data.status || 'Pending';
          if (typeof normalizedStatus === 'string') {
            const lower = normalizedStatus.toLowerCase();
            if (lower === 'approved') normalizedStatus = 'Approved';
            else if (lower === 'rejected') normalizedStatus = 'Rejected';
            else if (lower === 'pending') normalizedStatus = 'Pending';
          }
          return { id: d.id, ...data, status: normalizedStatus } as PaymentRequest;
        }).filter((p: any) => !['pay_101', 'pay_102', 'pay_103'].includes(p.id));
        localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(list));
        return list;
      }
    } catch (e) {
      console.warn('Firestore payments read note:', e);
    }

    try {
      const stored = localStorage.getItem(PAYMENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed
            .filter((p: any) => !['pay_101', 'pay_102', 'pay_103'].includes(p.id))
            .map((p) => {
              const lower = (p.status || '').toLowerCase();
              const status = lower === 'approved' ? 'Approved' : lower === 'rejected' ? 'Rejected' : 'Pending';
              return { ...p, status };
            });
          localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(filtered));
          return filtered;
        }
      }
    } catch {}

    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify([]));
    return [];
  },

  subscribeToPayments: (callback: (payments: PaymentRequest[]) => void) => {
    let unsubscribeFirestore = () => {};

    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, 'payments'),
        (snap: any) => {
          if (!snap.empty) {
            const list: PaymentRequest[] = snap.docs
              .map((d: any) => {
                const data = d.data();
                const lower = (data.status || 'pending').toLowerCase();
                const status = lower === 'approved' ? 'Approved' : lower === 'rejected' ? 'Rejected' : 'Pending';
                return { id: d.id, ...data, status } as PaymentRequest;
              })
              .filter((p: any) => !['pay_101', 'pay_102', 'pay_103'].includes(p.id));
            localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(list));
            callback(list);
          } else {
            paymentService.getPayments().then(callback);
          }
        },
        (err: any) => {
          console.warn('Firestore payments snapshot note (using cache):', err?.message);
          paymentService.getPayments().then(callback);
        }
      );
    } catch (e) {
      console.warn('Could not establish Firestore payments listener:', e);
      paymentService.getPayments().then(callback);
    }

    const handleLocalEvent = () => {
      paymentService.getPayments().then(callback);
    };

    window.addEventListener('rwanin_payment_changed', handleLocalEvent);
    window.addEventListener('storage', handleLocalEvent);

    return () => {
      unsubscribeFirestore();
      window.removeEventListener('rwanin_payment_changed', handleLocalEvent);
      window.removeEventListener('storage', handleLocalEvent);
    };
  },

  submitPayment: async (data: Omit<PaymentRequest, 'id' | 'status' | 'date'>): Promise<PaymentRequest> => {
    const formattedDate = new Date().toLocaleString('ku-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newPayment: PaymentRequest = {
      ...data,
      id: `pay_${Date.now()}`,
      status: 'Pending',
      date: formattedDate,
      createdAt: formattedDate
    };

    try {
      await setDoc(doc(db, 'payments', newPayment.id), {
        ...newPayment,
        serverTimestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore submitPayment note:', e);
    }

    const currentList = await paymentService.getPayments();
    const updated = [newPayment, ...currentList.filter((p) => p.id !== newPayment.id)];
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rwanin_payment_changed', { detail: updated }));
    }

    return newPayment;
  },

  updatePaymentStatus: async (
    paymentId: string,
    status: 'Approved' | 'Rejected' | 'pending' | 'approved' | 'rejected',
    adminEmail: string = 'admin'
  ): Promise<PaymentRequest[]> => {
    const s = status.toLowerCase();
    if (s === 'approved') {
      return paymentService.approvePayment(paymentId, adminEmail);
    } else {
      return paymentService.rejectPayment(paymentId, adminEmail);
    }
  },

  approvePayment: async (paymentId: string, adminEmail: string = 'admin'): Promise<PaymentRequest[]> => {
    const currentList = await paymentService.getPayments();

    let targetUserId = '';
    let targetUserName = '';

    const updated = currentList.map((p) => {
      if (p.id === paymentId) {
        targetUserId = p.userId;
        targetUserName = p.userName;
        return { ...p, status: 'Approved' as const };
      }
      return p;
    });

    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        status: 'Approved',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore approvePayment note:', e);
    }

    // Upgrade target user to VIP in both userService and authService
    if (targetUserId) {
      try {
        await userService.updateUserPackage(targetUserId, 'VIP');
      } catch (err) {
        console.warn('userService upgrade note:', err);
      }
      try {
        await authService.upgradeToVIP(targetUserId);
      } catch (err) {
        console.warn('authService upgrade note:', err);
      }
    }

    await adminService.logAction({
      adminId: 'admin',
      adminEmail,
      role: 'owner',
      action: 'پەسەندکردنی پارەدان',
      targetType: 'پارەدان',
      targetId: paymentId,
      description: `پەسەندکردنی پارەدانی ٥,٠٠٠ دینار بۆ ${targetUserName || targetUserId} و بەرزکردنەوەی هەژمار بۆ VIP`
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rwanin_payment_changed', { detail: updated }));
    }

    return updated;
  },

  rejectPayment: async (paymentId: string, adminEmail: string = 'admin'): Promise<PaymentRequest[]> => {
    const currentList = await paymentService.getPayments();

    let targetUserName = '';
    const updated = currentList.map((p) => {
      if (p.id === paymentId) {
        targetUserName = p.userName;
        return { ...p, status: 'Rejected' as const };
      }
      return p;
    });

    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        status: 'Rejected',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore rejectPayment note:', e);
    }

    await adminService.logAction({
      adminId: 'admin',
      adminEmail,
      role: 'owner',
      action: 'ڕەتکردنەوەی پارەدان',
      targetType: 'پارەدان',
      targetId: paymentId,
      description: `ڕەتکردنەوەی داواکاری پارەدانی ${targetUserName || paymentId}`
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rwanin_payment_changed', { detail: updated }));
    }

    return updated;
  },

  getPaymentConfig: async (): Promise<PaymentConfig> => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'payment'));
      if (snap.exists()) {
        const data = snap.data() as PaymentConfig;
        localStorage.setItem(PAYMENT_CONFIG_STORAGE_KEY, JSON.stringify(data));
        return { ...defaultPaymentConfig, ...data };
      }
    } catch (e) {
      console.warn('Firestore payment config read note:', e);
    }
    const stored = localStorage.getItem(PAYMENT_CONFIG_STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultPaymentConfig, ...JSON.parse(stored) };
      } catch {}
    }
    return defaultPaymentConfig;
  },

  updatePaymentConfig: async (newConfig: Partial<PaymentConfig>, adminEmail: string = 'rwanin1@gmail.com'): Promise<PaymentConfig> => {
    const current = await paymentService.getPaymentConfig();
    const updated: PaymentConfig = { ...current, ...newConfig };
    localStorage.setItem(PAYMENT_CONFIG_STORAGE_KEY, JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'settings', 'payment'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore payment config save note:', e);
    }
    await adminService.logAction({
      adminId: 'rwanin_owner_1',
      adminEmail,
      role: 'owner',
      action: 'نوێکردنەوەی ژمارەکانی پارەدان',
      targetType: 'ڕێکخستن',
      description: `نوێکردنەوەی ژمارەی FIB بۆ (${updated.fibNumber}) و وردەکارییەکانی پارەدان`
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rwanin_payment_config_changed', { detail: updated }));
    }
    return updated;
  }
};
