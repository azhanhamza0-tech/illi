import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { Movie, SortFilterOption } from '../types/movie';
import { initialMovies } from '../data/movies';
import { normalizeGoogleDriveUrl } from '../utils/videoPlayer';

const STORAGE_KEY = 'rwanin_movies_catalog';
const CUSTOM_STORAGE_KEY = 'rwanin_custom_movies';
const DELETED_KEY = 'rwanin_deleted_movie_ids';
const DEMO_CLEARED_KEY = 'rwanin_demo_movies_cleared';

const isDemoCleared = (): boolean => {
  try {
    return localStorage.getItem(DEMO_CLEARED_KEY) === 'true';
  } catch {
    return false;
  }
};

const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean;
  }
  return obj;
};

const getDeletedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch (e) {
    console.warn('Error reading deleted ids', e);
  }
  return new Set();
};

const saveDeletedIds = (set: Set<string>) => {
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Error saving deleted ids', e);
  }
};

const getCustomMovies = (): Movie[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const saveCustomMovie = (movie: Movie) => {
  try {
    const list = getCustomMovies().filter((m) => m.id !== movie.id);
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify([movie, ...list]));
  } catch (e) {}
};

const removeCustomMovie = (id: string) => {
  try {
    const list = getCustomMovies().filter((m) => m.id !== id);
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
};

const localSubscribers = new Set<(movies: Movie[]) => void>();

const notifySubscribers = (movies: Movie[]) => {
  localSubscribers.forEach((cb) => {
    try {
      cb(movies);
    } catch (e) {
      console.warn('Subscriber notification error', e);
    }
  });
};

export const movieService = {
  getDeletedMovieIds: (): Set<string> => getDeletedIds(),

  normalizeMovie: (m: any): Movie => {
    const isMux = Boolean(m.mux?.playbackId || m.videoProvider === 'mux');
    let rawStream =
      isMux && m.mux?.playbackId
        ? `https://stream.mux.com/${m.mux.playbackId}.m3u8`
        : m.video || m.videoUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

    // Auto-heal broken legacy Google Cloud sample bucket links that return 403 Forbidden
    if (rawStream.includes('commondatastorage.googleapis.com')) {
      rawStream = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
    }

    const stream = isMux ? rawStream : normalizeGoogleDriveUrl(rawStream);

    const cleanedQualities = m.qualities ? { ...m.qualities } : undefined;
    if (cleanedQualities) {
      Object.keys(cleanedQualities).forEach((k) => {
        if (cleanedQualities[k]?.includes('commondatastorage.googleapis.com')) {
          cleanedQualities[k] = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
        }
      });
    }

    return {
      ...m,
      id: m.id || `m_${Date.now()}`,
      title: m.title || '',
      originalTitle: m.originalTitle || '',
      type: m.type || (m.seasons ? 'tv' : 'movie'),
      seasons: m.seasons ?? (m.type === 'tv' ? 1 : undefined),
      episodes: m.episodes ?? (m.type === 'tv' ? 1 : undefined),
      episodeList: Array.isArray(m.episodeList)
        ? m.episodeList.map((ep: any) => {
            let epUrl = ep.videoUrl;
            if (epUrl && epUrl.includes('commondatastorage.googleapis.com')) {
              epUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
            }
            if (!epUrl) {
              epUrl = stream || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
            }
            return {
              ...ep,
              videoUrl: normalizeGoogleDriveUrl(epUrl)
            };
          })
        : undefined,
      qualities: cleanedQualities,
      year: m.year || 2024,
      rating: typeof m.rating === 'number' ? m.rating : 8.0,
      genre: Array.isArray(m.genre) && m.genre.length > 0 ? m.genre : ['کوردی'],
      country: m.country || 'کوردستان',
      language: Array.isArray(m.language) && m.language.length > 0 ? m.language : ['کوردی'],
      duration: m.duration || '2h 00m',
      director: m.director || '',
      cast: Array.isArray(m.cast) ? m.cast : [],
      poster: m.poster || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
      backdrop: m.backdrop || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600',
      video: stream,
      videoUrl: stream,
      videoProvider: m.videoProvider || (isMux ? 'mux' : 'google-drive'),
      mux: m.mux,
      access: m.access || {
        type: m.isVIP ? 'vip' : 'free',
        freeDailyLimitMinutes: 50,
        freePreviewMinutes: 10
      },
      description: m.description || '',
      isVIP: Boolean(m.isVIP || m.access?.type === 'vip'),
      isFeatured: Boolean(m.isFeatured),
      isTrending: Boolean(m.isTrending),
      isRecommended: Boolean(m.isRecommended),
      views: typeof m.views === 'number' ? m.views : 1000
    };
  },

  getMovies: (): Movie[] => {
    const deletedIds = getDeletedIds();
    const custom = getCustomMovies().filter((m) => !deletedIds.has(m.id));
    const customIds = new Set(custom.map((m) => m.id));

    let baseMovies: Movie[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Movie[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          baseMovies = parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading cached movies', e);
    }

    if (baseMovies.length === 0 && !isDemoCleared()) {
      baseMovies = initialMovies;
    }

    const filteredBase = baseMovies.filter((m) => !deletedIds.has(m.id) && !customIds.has(m.id));
    const merged = [...custom, ...filteredBase].map(movieService.normalizeMovie);

    // Keep cache fresh
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {}

    return merged;
  },

  /**
   * Real-time Firestore sync listener + local state subscriber
   */
  subscribeToMovies: (callback: (movies: Movie[]) => void) => {
    localSubscribers.add(callback);
    // Send immediate local snapshot
    callback(movieService.getMovies());

    let firestoreUnsub = () => {};
    let deletedUnsub = () => {};

    // 1. Cross-Browser Cloud Sync for Deleted Movies
    try {
      deletedUnsub = onSnapshot(
        doc(db, 'settings', 'deleted_movies'),
        (delSnap: any) => {
          if (delSnap.exists()) {
            const data = delSnap.data();
            if (Array.isArray(data?.ids) && data.ids.length > 0) {
              const local = getDeletedIds();
              let hasNew = false;
              data.ids.forEach((dId: string) => {
                if (!local.has(dId)) {
                  local.add(dId);
                  hasNew = true;
                }
              });
              if (hasNew) {
                saveDeletedIds(local);
                notifySubscribers(movieService.getMovies());
              }
            }
          }
        },
        (delErr: any) => {
          console.warn('Firestore deleted_movies listener note:', delErr?.message);
        }
      );
    } catch (e) {
      console.warn('Could not establish deleted_movies listener:', e);
    }

    // 2. Real-time sync for Movies collection
    try {
      const q = query(collection(db, 'movies'));
      firestoreUnsub = onSnapshot(
        q,
        (snap: any) => {
          const deletedIds = getDeletedIds();
          if (!snap.empty) {
            const firestoreMovies: Movie[] = snap.docs
              .map((d: any) => ({
                id: d.id,
                ...d.data()
              } as Movie))
              .filter((m: Movie) => !deletedIds.has(m.id));

            // Merge custom movies so they NEVER get deleted by Firestore snapshot
            const custom = getCustomMovies().filter((m) => !deletedIds.has(m.id));
            const customIds = new Set(custom.map((m) => m.id));
            const nonCustomFirestore = firestoreMovies.filter((m) => !customIds.has(m.id));
            const merged = [...custom, ...nonCustomFirestore].map(movieService.normalizeMovie);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            notifySubscribers(merged);
          } else {
            notifySubscribers(movieService.getMovies());
          }
        },
        (err: any) => {
          console.warn('Firestore movies snapshot note (using cache):', err?.message);
          notifySubscribers(movieService.getMovies());
        }
      );
    } catch (e) {
      console.warn('Could not establish Firestore listener:', e);
      notifySubscribers(movieService.getMovies());
    }

    // 3. Real-time sync for Catalog Meta (Demo movies cleared global state)
    let metaUnsub = () => {};
    try {
      metaUnsub = onSnapshot(doc(db, 'settings', 'catalog_meta'), (metaSnap: any) => {
        if (metaSnap.exists()) {
          const data = metaSnap.data();
          if (data?.demoMoviesCleared) {
            try {
              localStorage.setItem(DEMO_CLEARED_KEY, 'true');
            } catch {}
            notifySubscribers(movieService.getMovies());
          }
        }
      });
    } catch (e) {}

    return () => {
      localSubscribers.delete(callback);
      firestoreUnsub();
      deletedUnsub();
      metaUnsub();
    };
  },

  getMovieById: (id: string): Movie | undefined => {
    const movies = movieService.getMovies();
    return movies.find((m) => m.id === id || m.id.toLowerCase() === id.toLowerCase());
  },

  getFeaturedMovies: (): Movie[] => {
    return movieService.getMovies().filter((m) => m.isFeatured);
  },

  /**
   * Dynamic Real Trending calculation based on Views, Rating & Recency
   */
  getTrendingMovies: (limitCount = 10): Movie[] => {
    const movies = movieService.getMovies();
    if (movies.length === 0) return [];
    return [...movies]
      .sort((a, b) => {
        const scoreA = (a.views || 0) * 0.4 + (a.rating || 0) * 15000 + (a.isTrending ? 20000 : 0);
        const scoreB = (b.views || 0) * 0.4 + (b.rating || 0) * 15000 + (b.isTrending ? 20000 : 0);
        return scoreB - scoreA;
      })
      .slice(0, limitCount);
  },

  /**
   * Recently added movies auto-sorted by creation date or year
   */
  getRecentlyAdded: (limitCount = 10): Movie[] => {
    const movies = movieService.getMovies();
    if (movies.length === 0) return [];
    return [...movies]
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.year || 2024) * 10000;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.year || 2024) * 10000;
        return timeB - timeA;
      })
      .slice(0, limitCount);
  },

  getMostWatchedMovies: (): Movie[] => {
    return [...movieService.getMovies()]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  },

  getMoviesByGenre: (genre: string): Movie[] => {
    return movieService.getMovies().filter((m) =>
      Array.isArray(m.genre) && m.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
  },

  getRecommendations: (basedOnMovieId?: string): { sourceMovie?: Movie; recommendations: Movie[] } => {
    const movies = movieService.getMovies();
    if (movies.length === 0) return { recommendations: [] };

    let source = movies.find((m) => m.id === basedOnMovieId);
    if (!source) source = movies[0];

    const recs = movies
      .filter((m) => m.id !== source!.id)
      .map((m) => {
        let score = 0;
        if (m.director && m.director === source!.director) score += 5;
        const sharedGenres = (m.genre || []).filter((g) => (source!.genre || []).includes(g));
        score += sharedGenres.length * 2;
        if (m.rating >= 8.0) score += 1;
        return { movie: m, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.movie)
      .slice(0, 6);

    return { sourceMovie: source, recommendations: recs };
  },

  /**
   * Smart Multi-field Search (Title, Actor, Director, Genre, Country, Studio)
   */
  searchMovies: (
    queryText: string,
    filters?: {
      genre?: string;
      country?: string;
      language?: string;
      year?: number;
      isVIP?: boolean;
      sortBy?: SortFilterOption;
      mediaType?: 'all' | 'movie' | 'tv' | 'anime';
    }
  ): Movie[] => {
    let results = movieService.getMovies();

    // Explicit media type separation
    if (filters?.mediaType && filters.mediaType !== 'all') {
      if (filters.mediaType === 'movie') {
        results = results.filter((m) => m.type === 'movie' || (!m.type && !m.seasons));
      } else if (filters.mediaType === 'tv') {
        results = results.filter((m) => m.type === 'tv' || (m.seasons !== undefined && m.seasons > 0));
      } else if (filters.mediaType === 'anime') {
        results = results.filter((m) => m.type === 'anime');
      }
    }

    if (queryText && queryText.trim() !== '') {
      const q = queryText.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);

      results = results.filter((m) => {
        const titleMatch = (m.title?.toLowerCase() || '').includes(q) || (m.originalTitle?.toLowerCase() || '').includes(q);
        const directorMatch = (m.director?.toLowerCase() || '').includes(q);
        const castMatch = Array.isArray(m.cast) && m.cast.some((c) => (c?.toLowerCase() || '').includes(q));
        const genreMatch = Array.isArray(m.genre) && m.genre.some((g) => (g?.toLowerCase() || '').includes(q));
        const countryMatch = (m.country?.toLowerCase() || '').includes(q);
        const dubbedMatch = (m.dubbedBy?.toLowerCase() || '').includes(q);

        if (titleMatch || directorMatch || castMatch || genreMatch || countryMatch || dubbedMatch) {
          return true;
        }

        // Fuzzy token matching
        return tokens.every((tok) =>
          (m.title?.toLowerCase() || '').includes(tok) ||
          (m.originalTitle?.toLowerCase() || '').includes(tok) ||
          (Array.isArray(m.cast) && m.cast.some((c) => (c?.toLowerCase() || '').includes(tok))) ||
          (Array.isArray(m.genre) && m.genre.some((g) => (g?.toLowerCase() || '').includes(tok)))
        );
      });
    }

    if (filters?.genre && filters.genre !== 'All' && filters.genre !== 'هەموو چەشنەکان') {
      results = results.filter((m) =>
        Array.isArray(m.genre) && m.genre.some((g) => g.toLowerCase() === filters.genre!.toLowerCase())
      );
    }

    if (filters?.language && filters.language !== 'All' && filters.language !== 'هەموو زمانەکان') {
      results = results.filter((m) =>
        Array.isArray(m.language) && m.language.some((l) => l.toLowerCase().includes(filters.language!.toLowerCase()))
      );
    }

    if (filters?.isVIP !== undefined) {
      results = results.filter((m) => m.isVIP === filters.isVIP);
    }

    if (filters?.sortBy) {
      if (filters.sortBy === 'newest') {
        results.sort((a, b) => (b.year || 0) - (a.year || 0));
      } else if (filters.sortBy === 'popular') {
        results.sort((a, b) => (b.views || 0) - (a.views || 0));
      } else if (filters.sortBy === 'rating') {
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (filters.sortBy === 'az') {
        results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      }
    }

    return results;
  },

  getOnlyMovies: (): Movie[] => {
    return movieService.getMovies().filter((m) => m.type === 'movie' || (!m.type && !m.seasons));
  },

  getAnime: (): Movie[] => {
    return movieService.getMovies().filter((m) => m.type === 'anime');
  },

  getSeries: (): Movie[] => {
    return movieService.getMovies().filter((m) => m.type === 'tv' || (m.seasons !== undefined && m.seasons > 0));
  },

  getDubbed: (): Movie[] => {
    return movieService.getMovies().filter(
      (m) =>
        m.isDubbed ||
        (Array.isArray(m.language) && m.language.some((l) => l.toLowerCase().includes('dubbed') || l.includes('دۆبلاژ'))) ||
        (Array.isArray(m.genre) && m.genre.some((g) => g.toLowerCase().includes('dubbed') || g.includes('دۆبلاژ')))
    );
  },

  /* Admin Management & Firestore writes */
  addMovie: async (movieInput: Movie): Promise<Movie> => {
    const movie = movieService.normalizeMovie({
      ...movieInput,
      createdAt: movieInput.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const deletedIds = getDeletedIds();
    if (deletedIds.has(movie.id)) {
      deletedIds.delete(movie.id);
      saveDeletedIds(deletedIds);
    }

    // 1. Save in custom persistent store
    saveCustomMovie(movie);

    // 2. Update catalog in local storage
    const current = movieService.getMovies();
    const updated = [movie, ...current.filter((m) => m.id !== movie.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 3. Notify all active UI subscribers immediately
    notifySubscribers(updated);

    // 4. Clean undefined fields and persist to Firestore
    try {
      const sanitized = sanitizeForFirestore(movie);
      await setDoc(doc(db, 'movies', movie.id), sanitized);
    } catch (e) {
      console.warn('Firestore addMovie note:', e);
    }

    return movie;
  },

  updateMovie: async (id: string, updatedMovie: Partial<Movie>): Promise<Movie | null> => {
    const movies = movieService.getMovies();
    const index = movies.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const merged = movieService.normalizeMovie({
      ...movies[index],
      ...updatedMovie,
      updatedAt: new Date().toISOString()
    });

    movies[index] = merged;
    saveCustomMovie(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
    notifySubscribers(movies);

    try {
      const sanitized = sanitizeForFirestore({
        ...updatedMovie,
        updatedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'movies', id), sanitized);
    } catch (e) {
      console.warn('Firestore updateMovie note:', e);
    }

    return merged;
  },

  deleteMovie: async (id: string): Promise<boolean> => {
    // 1. Permanently track deleted ID locally
    const deletedIds = getDeletedIds();
    deletedIds.add(id);
    saveDeletedIds(deletedIds);

    // 2. Remove from custom persistent store
    removeCustomMovie(id);

    // 3. Remove immediately from local catalog
    const current = movieService.getMovies();
    const filtered = current.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // 4. Immediately notify all active UI subscribers
    notifySubscribers(filtered);

    // 5. Delete from Firestore movies collection
    try {
      await deleteDoc(doc(db, 'movies', id));
    } catch (e) {
      console.warn('Firestore deleteMovie note:', e);
    }

    // 6. SYNC TO CLOUD: Save deleted ID in Firestore settings/deleted_movies so ALL other browsers know it was deleted!
    try {
      await setDoc(
        doc(db, 'settings', 'deleted_movies'),
        {
          ids: Array.from(deletedIds),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore deleted_movies sync note:', e);
    }

    return true;
  },

  deleteMultipleMovies: async (ids: string[]): Promise<boolean> => {
    if (!ids || ids.length === 0) return true;

    // 1. Local storage tracking
    const deletedIds = getDeletedIds();
    ids.forEach((id) => {
      deletedIds.add(id);
      removeCustomMovie(id);
    });
    saveDeletedIds(deletedIds);

    // 2. Local catalog update
    const current = movieService.getMovies();
    const filtered = current.filter((m) => !deletedIds.has(m.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    notifySubscribers(filtered);

    // 3. Delete docs from Firestore
    for (const id of ids) {
      try {
        await deleteDoc(doc(db, 'movies', id));
      } catch (e) {}
    }

    // 4. Update cloud deleted_movies setting for all browsers
    try {
      await setDoc(
        doc(db, 'settings', 'deleted_movies'),
        {
          ids: Array.from(deletedIds),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore bulk delete sync note:', e);
    }

    return true;
  },

  deleteDemoMovies: async (): Promise<boolean> => {
    try {
      localStorage.setItem(DEMO_CLEARED_KEY, 'true');
    } catch {}

    const demoIds = initialMovies.map((m) => m.id);
    await movieService.deleteMultipleMovies(demoIds);

    try {
      await setDoc(
        doc(db, 'settings', 'catalog_meta'),
        { demoMoviesCleared: true, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore catalog_meta sync note:', e);
    }

    return true;
  },

  resetCatalog: () => {
    try {
      localStorage.removeItem(DELETED_KEY);
      localStorage.removeItem(CUSTOM_STORAGE_KEY);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMovies));
    notifySubscribers(initialMovies);
  },

  seedOrRestoreCatalog: (): Movie[] => {
    try {
      localStorage.removeItem(DELETED_KEY);
      localStorage.removeItem(CUSTOM_STORAGE_KEY);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMovies));
    notifySubscribers(initialMovies);
    return initialMovies;
  }
};
