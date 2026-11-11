import { doc, getDoc, setDoc, getDocs, collection, query, where, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { watchProgressService } from './watchProgressService';

export interface WatchHistoryItem {
  id?: string;
  userId: string;
  movieId: string;
  currentTime: number;
  duration: number;
  percentage: number;
  lastWatchedAt: number;
}

export class WatchHistoryService {
  /**
   * Updates or saves user watch progress for a movie
   */
  public static async updateProgress(
    userId: string,
    movieId: string,
    currentTime: number,
    duration: number
  ): Promise<void> {
    if (!movieId || duration <= 0) return;

    const cleanSeconds = Math.floor(currentTime);
    const totalSeconds = Math.floor(duration);
    const percentage = Math.min(100, Math.round((cleanSeconds / totalSeconds) * 100));

    // Also update local cache for instant UI rendering
    watchProgressService.saveProgress(movieId, cleanSeconds, totalSeconds, userId);

    if (!userId) return;

    try {
      const docId = `${userId}_${movieId}`;
      const docRef = doc(db, 'watchHistory', docId);

      // If user finished watching (>95%), remove or mark completed
      if (percentage >= 95) {
        await deleteDoc(docRef).catch(() => {});
        return;
      }

      await setDoc(
        docRef,
        {
          userId,
          movieId,
          currentTime: cleanSeconds,
          duration: totalSeconds,
          percentage,
          lastWatchedAt: Date.now()
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[watchHistoryService] Error saving watch history to Firestore:', err);
    }
  }

  /**
   * Gets watch progress for a specific movie
   */
  public static async getMovieProgress(userId: string, movieId: string): Promise<WatchHistoryItem | null> {
    if (!userId || !movieId) return null;

    try {
      const docId = `${userId}_${movieId}`;
      const docRef = doc(db, 'watchHistory', docId);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          id: snapshot.id,
          userId: data.userId,
          movieId: data.movieId,
          currentTime: Number(data.currentTime) || 0,
          duration: Number(data.duration) || 0,
          percentage: Number(data.percentage) || 0,
          lastWatchedAt: data.lastWatchedAt?.toMillis?.() || data.lastWatchedAt || Date.now()
        };
      }
    } catch (err) {
      console.warn('[watchHistoryService] Error getting movie progress:', err);
    }
    return null;
  }

  /**
   * Retrieves the continue watching list for a user
   */
  public static async getUserHistory(userId: string, maxItems: number = 10): Promise<WatchHistoryItem[]> {
    if (!userId) return [];

    try {
      const q = query(
        collection(db, 'watchHistory'),
        where('userId', '==', userId),
        orderBy('lastWatchedAt', 'desc'),
        limit(maxItems)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap: any) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId,
          movieId: data.movieId,
          currentTime: Number(data.currentTime) || 0,
          duration: Number(data.duration) || 0,
          percentage: Number(data.percentage) || 0,
          lastWatchedAt: data.lastWatchedAt?.toMillis?.() || data.lastWatchedAt || Date.now()
        };
      });
    } catch (err) {
      console.warn('[watchHistoryService] Error fetching user history:', err);
      return [];
    }
  }
}

export const watchHistoryService = WatchHistoryService;
