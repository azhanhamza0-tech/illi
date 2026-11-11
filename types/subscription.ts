/**
 * RWANIN — Subscription & Daily Watch Usage Types
 */

export type SubscriptionPlan = 'free' | 'vip';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt?: string | number;
  expiresAt?: string | number;
  updatedAt?: string | number;
}

export interface WatchUsage {
  date: string; // YYYY-MM-DD
  usedSeconds: number;
  updatedAt: string | number;
}
