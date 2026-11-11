import { UserAchievement, UserWatchAnalytics } from '../types/movie';
import { watchProgressService } from './watchProgressService';
import { movieService } from './movieService';

const STREAK_STORAGE_KEY = 'rwanin_user_streak_data';

export const INITIAL_ACHIEVEMENTS: UserAchievement[] = [
  {
    id: 'ach-first-movie',
    title: 'یەکەم بینین (First Movie)',
    description: 'بینینی یەکەمین فیلم لە پلاتفۆرمی ڕوانین',
    icon: '🎬',
    target: 1,
    progress: 1,
    unlocked: true,
    unlockedAt: 'ئەمڕۆ'
  },
  {
    id: 'ach-10-movies',
    title: 'حەزکەری سینەما (10 Movies)',
    description: 'تەواوکردنی سەیرکردنی ١٠ فیلم یان ئەڵقە',
    icon: '🍿',
    target: 10,
    progress: 4,
    unlocked: false
  },
  {
    id: 'ach-50-movies',
    title: 'شارەزای فیلمەکان (50 Movies)',
    description: 'تەواوکردنی سەیرکردنی ٥٠ بەرهەمی سینەمایی',
    icon: '🌟',
    target: 50,
    progress: 4,
    unlocked: false
  },
  {
    id: 'ach-100-movies',
    title: 'ئەفسانەی ڕوانین (100 Movies)',
    description: 'گەیشتن بە لوتکەی ١٠٠ فیلم لە ڕوانین',
    icon: '👑',
    target: 100,
    progress: 4,
    unlocked: false
  }
];

class StreakService {
  private analytics: UserWatchAnalytics = {
    totalSeconds: 14200, // ~ 3.9 hours default demo
    moviesWatchedCount: 4,
    genreBreakdown: {
      'دراما': 5,
      'ئاکشن': 4,
      'دۆبلاژکراو': 3,
      'زانستی خەیاڵی': 2,
      'کۆمیدی': 2
    },
    ratingBreakdown: {
      '9.0 - 10': 3,
      '8.0 - 8.9': 4,
      '7.0 - 7.9': 1
    },
    currentStreakDays: 7,
    longestStreakDays: 14,
    lastActiveDate: new Date().toISOString().slice(0, 10)
  };

  private achievements: UserAchievement[] = INITIAL_ACHIEVEMENTS;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STREAK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.analytics) this.analytics = parsed.analytics;
        if (parsed.achievements) this.achievements = parsed.achievements;
      }
    } catch (e) {
      console.warn('Error reading streak/analytics data:', e);
    }
    this.recomputeFromWatchHistory();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        STREAK_STORAGE_KEY,
        JSON.stringify({
          analytics: this.analytics,
          achievements: this.achievements
        })
      );
    } catch (e) {
      console.warn('Error saving streak/analytics data:', e);
    }
  }

  public getAnalytics(): UserWatchAnalytics {
    return this.analytics;
  }

  public getAchievements(): UserAchievement[] {
    return this.achievements;
  }

  public getUserStreak(_userId?: string) {
    return {
      currentStreak: this.analytics.currentStreakDays,
      longestStreak: this.analytics.longestStreakDays,
      lastActiveDate: this.analytics.lastActiveDate
    };
  }

  public getUserAchievements(_userId?: string): UserAchievement[] {
    return this.achievements.map((ach) => ({
      ...ach,
      currentProgress: ach.progress,
      targetProgress: ach.target
    }));
  }

  public getUserAnalytics(_userId?: string) {
    const totalWatchMinutes = Math.round(this.analytics.totalSeconds / 60);
    const topGenres = Object.entries(this.analytics.genreBreakdown)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);
    return {
      totalWatchMinutes,
      totalMoviesWatched: this.analytics.moviesWatchedCount,
      averageRating: 9.1,
      topGenres
    };
  }

  /**
   * Recompute stats whenever user watches movies
   */
  public recomputeFromWatchHistory(): void {
    const history = watchProgressService.getItems();
    const allMovies = movieService.getMovies();

    const watchedMoviesCount = Math.max(this.analytics.moviesWatchedCount, history.length);
    let totalSec = history.reduce((acc, item) => acc + (item.currentTime || 0), 0);
    if (totalSec < this.analytics.totalSeconds) {
      totalSec = this.analytics.totalSeconds;
    }

    const genreCount: { [genre: string]: number } = { ...this.analytics.genreBreakdown };
    history.forEach((h) => {
      const m = allMovies.find((x) => x.id === h.movieId);
      if (m) {
        m.genre.forEach((g) => {
          genreCount[g] = (genreCount[g] || 0) + 1;
        });
      }
    });

    this.analytics = {
      ...this.analytics,
      totalSeconds: totalSec,
      moviesWatchedCount: watchedMoviesCount,
      genreBreakdown: genreCount
    };

    // Update achievement progresses
    this.achievements = this.achievements.map((ach) => {
      const progress = Math.min(watchedMoviesCount, ach.target);
      const unlocked = progress >= ach.target;
      return {
        ...ach,
        progress,
        unlocked,
        unlockedAt: unlocked && !ach.unlocked ? 'ئەمڕۆ' : ach.unlockedAt
      };
    });

    this.saveToStorage();
  }

  public recordWatchSession(secondsWatched: number): void {
    this.analytics.totalSeconds += secondsWatched;
    this.recomputeFromWatchHistory();
  }
}

export const streakService = new StreakService();
