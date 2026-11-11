import { doc, setDoc, getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { ContinueWatchingItem, Movie } from '../types/movie';
import { movieService } from './movieService';

const LOCAL_STORAGE_KEY = 'rwanin_continue_watching';

class WatchProgressService {
  private memoryCache: ContinueWatchingItem[] = [];
  private listeners = new Set<(items: ContinueWatchingItem[]) => void>();

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        this.memoryCache = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading local continue watching cache:', e);
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.memoryCache));
    } catch (e) {
      console.warn('Error saving local continue watching cache:', e);
    }
  }

  private notify(): void {
    this.saveToLocalStorage();
    this.listeners.forEach((cb) => {
      try {
        cb(this.getItems());
      } catch (err) {
        console.warn('Watch progress subscriber error:', err);
      }
    });
  }

  public subscribe(callback: (items: ContinueWatchingItem[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getItems());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getItems(): ContinueWatchingItem[] {
    return [...this.memoryCache].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getMovieProgress(movieId: string): ContinueWatchingItem | undefined {
    return this.memoryCache.find((i) => i.movieId === movieId);
  }

  /**
   * Saves watch progress locally and syncs to Firestore if user is authenticated
   */
  public async saveProgress(
    movieId: string,
    currentTime: number,
    duration: number,
    userId?: string
  ): Promise<void> {
    if (!movieId || duration <= 0) return;

    // Filter out previous entry and insert updated
    const cleanSeconds = Math.floor(currentTime);
    const totalSeconds = Math.floor(duration);

    // If near end (> 95%), remove from continue watching
    if (cleanSeconds >= totalSeconds * 0.95) {
      this.memoryCache = this.memoryCache.filter((i) => i.movieId !== movieId);
      this.notify();
      return;
    }

    const updatedItem: ContinueWatchingItem = {
      movieId,
      currentTime: cleanSeconds,
      duration: totalSeconds,
      updatedAt: Date.now()
    };

    this.memoryCache = [updatedItem, ...this.memoryCache.filter((i) => i.movieId !== movieId)].slice(0, 20);
    this.notify();

    // Cross-device Firestore Sync
    if (userId) {
      try {
        const docRef = doc(db, 'watch_progress', `${userId}_${movieId}`);
        await setDoc(
          docRef,
          {
            userId,
            movieId,
            currentTime: cleanSeconds,
            duration: totalSeconds,
            updatedAt: Date.now()
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore watch_progress sync note:', err);
      }
    }
  }

  /**
   * Sync user progress from Firestore when logging in on any device
   */
  public async syncUserProgress(userId: string): Promise<void> {
    if (!userId) return;

    try {
      const q = query(
        collection(db, 'watch_progress'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const remoteItems: ContinueWatchingItem[] = snapshot.docs.map((d: any) => {
          const data = d.data();
          return {
            movieId: data.movieId,
            currentTime: data.currentTime,
            duration: data.duration,
            updatedAt: data.updatedAt || Date.now()
          };
        });

        // Merge remote items with local cache taking newer updatedAt
        const map = new Map<string, ContinueWatchingItem>();
        for (const item of this.memoryCache) {
          map.set(item.movieId, item);
        }
        for (const item of remoteItems) {
          const existing = map.get(item.movieId);
          if (!existing || item.updatedAt > existing.updatedAt) {
            map.set(item.movieId, item);
          }
        }

        this.memoryCache = Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
        this.notify();
      }
    } catch (err) {
      console.warn('Could not sync remote watch progress (using local):', err);
    }
  }

  public getContinueWatchingWithMovies(): { item: ContinueWatchingItem; movie: Movie }[] {
    const all = movieService.getMovies();
    return this.getItems()
      .map((item) => {
        const movie = all.find((m) => m.id === item.movieId);
        return movie ? { item, movie } : null;
      })
      .filter((x): x is { item: ContinueWatchingItem; movie: Movie } => x !== null);
  }

  public formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  }
}

export const watchProgressService = new WatchProgressService();
