import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { WatchUsage } from '../types/subscription';

export const DAILY_FREE_LIMIT_MINUTES = 50;
export const DAILY_FREE_LIMIT_SECONDS = DAILY_FREE_LIMIT_MINUTES * 60; // 3000 seconds

export class WatchUsageService {
  public static getTodayString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // "YYYY-MM-DD"
  }

  /**
   * Retrieves today's watch usage for a user.
   */
  public static async getDailyUsage(userId: string): Promise<WatchUsage> {
    if (!userId) {
      return {
        date: this.getTodayString(),
        usedSeconds: 0,
        updatedAt: Date.now()
      };
    }

    try {
      const today = this.getTodayString();
      const usageDocRef = doc(db, 'watchUsage', userId);
      const snapshot = await getDoc(usageDocRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        // If the record is from a previous day, reset to 0 for today
        if (data.date !== today) {
          return {
            date: today,
            usedSeconds: 0,
            updatedAt: Date.now()
          };
        }
        return {
          date: data.date,
          usedSeconds: Number(data.usedSeconds) || 0,
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now()
        };
      }

      return {
        date: today,
        usedSeconds: 0,
        updatedAt: Date.now()
      };
    } catch (err) {
      console.warn('[watchUsageService] Error fetching usage:', err);
      return {
        date: this.getTodayString(),
        usedSeconds: 0,
        updatedAt: Date.now()
      };
    }
  }

  /**
   * Adds watched seconds to the user's daily usage record.
   */
  public static async recordUsage(userId: string, secondsToAdd: number): Promise<number> {
    if (!userId || secondsToAdd <= 0) return 0;

    const today = this.getTodayString();
    const usageDocRef = doc(db, 'watchUsage', userId);

    try {
      const snapshot = await getDoc(usageDocRef);
      if (!snapshot.exists() || snapshot.data()?.date !== today) {
        // Create fresh record for today
        const newSeconds = Math.min(secondsToAdd, DAILY_FREE_LIMIT_SECONDS);
        await setDoc(usageDocRef, {
          userId,
          date: today,
          usedSeconds: newSeconds,
          updatedAt: Date.now()
        });
        return newSeconds;
      } else {
        // Increment today's record
        const currentUsed = Number(snapshot.data()?.usedSeconds) || 0;
        const updatedSeconds = currentUsed + secondsToAdd;
        await updateDoc(usageDocRef, {
          usedSeconds: updatedSeconds,
          updatedAt: Date.now()
        });
        return updatedSeconds;
      }
    } catch (err) {
      console.warn('[watchUsageService] Error recording usage:', err);
      return 0;
    }
  }

  /**
   * Checks if user has exceeded the 50-minute daily free limit.
   */
  public static async isDailyLimitReached(userId: string): Promise<boolean> {
    const usage = await this.getDailyUsage(userId);
    return usage.usedSeconds >= DAILY_FREE_LIMIT_SECONDS;
  }

  /**
   * Returns remaining seconds left today for a free user.
   */
  public static async getRemainingSeconds(userId: string): Promise<number> {
    const usage = await this.getDailyUsage(userId);
    return Math.max(0, DAILY_FREE_LIMIT_SECONDS - usage.usedSeconds);
  }
}

export const watchUsageService = WatchUsageService;
