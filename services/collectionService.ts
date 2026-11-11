import { UserCustomCollection, Movie } from '../types/movie';
import { movieService } from './movieService';

const COLLECTIONS_STORAGE_KEY = 'rwanin_user_custom_collections';

class CollectionService {
  private collections: UserCustomCollection[] = [];
  private listeners = new Set<(collections: UserCustomCollection[]) => void>();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
      if (stored) {
        this.collections = JSON.parse(stored);
        return;
      }
    } catch (e) {
      console.warn('Error reading collections:', e);
    }

    // Default pre-populated popular user collections
    this.collections = [
      {
        id: 'col-night-movies',
        name: '🎬 فیلمەکانی شەو',
        icon: '🌙',
        color: '#38bdf8',
        movieIds: ['interstellar-2014', 'dark-knight-2008'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'col-comedy',
        name: '😂 پێکەنین و کۆمیدی',
        icon: '😂',
        color: '#f59e0b',
        movieIds: ['kung-fu-panda-dubbed', 'bekas-2012'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'col-watch-later',
        name: '🔥 سەیرکردن بۆ دواتر',
        icon: '⏳',
        color: '#a855f7',
        movieIds: ['oppenheimer-2023', 'spider-man-dubbed'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'col-horror',
        name: '👻 هەستبزوێن و ترسناک',
        icon: '👻',
        color: '#ef4444',
        movieIds: ['stranger-things'],
        createdAt: new Date().toISOString()
      }
    ];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(this.collections));
    } catch (e) {
      console.warn('Error saving collections:', e);
    }
  }

  private notify(): void {
    this.saveToStorage();
    this.listeners.forEach((cb) => cb(this.getCollections()));
  }

  public subscribe(callback: (collections: UserCustomCollection[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getCollections());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getCollections(): UserCustomCollection[] {
    return this.collections;
  }

  public getUserCollections(_userId?: string): UserCustomCollection[] {
    return this.collections;
  }

  public createCollection(
    arg1: string,
    arg2?: string,
    arg3 = '🎬',
    arg4 = '#38bdf8'
  ): UserCustomCollection {
    // Check if called as (userId, name, icon) or (name, icon, color)
    const name = (arg2 && arg2.length > 0) ? arg2 : arg1;
    const icon = (arg2 && arg2.length > 0) ? (arg3 || '📁') : (arg2 || '📁');
    const color = arg4 || '#38bdf8';

    const newCol: UserCustomCollection = {
      id: `col_${Date.now()}`,
      name: name.trim(),
      icon,
      color,
      movieIds: [],
      createdAt: new Date().toISOString()
    };
    this.collections = [newCol, ...this.collections];
    this.notify();
    return newCol;
  }

  public deleteCollection(id: string): void {
    this.collections = this.collections.filter((c) => c.id !== id);
    this.notify();
  }

  public toggleMovieInCollection(collectionId: string, movieId: string): boolean {
    const col = this.collections.find((c) => c.id === collectionId);
    if (!col) return false;

    let added = false;
    if (col.movieIds.includes(movieId)) {
      col.movieIds = col.movieIds.filter((id) => id !== movieId);
    } else {
      col.movieIds = [movieId, ...col.movieIds];
      added = true;
    }
    col.updatedAt = new Date().toISOString();
    this.notify();
    return added;
  }

  public isMovieInCollection(collectionId: string, movieId: string): boolean {
    const col = this.collections.find((c) => c.id === collectionId);
    return col ? col.movieIds.includes(movieId) : false;
  }

  public getMoviesForCollection(collectionId: string): Movie[] {
    const col = this.collections.find((c) => c.id === collectionId);
    if (!col || col.movieIds.length === 0) return [];
    const all = movieService.getMovies();
    return col.movieIds
      .map((id) => all.find((m) => m.id === id))
      .filter((m): m is Movie => Boolean(m));
  }
}

export const collectionService = new CollectionService();
