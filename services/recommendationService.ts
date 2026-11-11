import { Movie } from '../types/movie';
import { movieService } from './movieService';
import { watchProgressService } from './watchProgressService';

export const recommendationService = {
  /**
   * Smart Personalized Recommendations for the current user
   * Combines user's watched genres, favorites, ratings, and watch history
   */
  getPersonalizedRecommendations: (userIdOrFavs?: string | string[], limit = 10): Movie[] => {
    const allMovies = movieService.getMovies();
    if (allMovies.length === 0) return [];

    const favoriteMovieIds = Array.isArray(userIdOrFavs) ? userIdOrFavs : [];
    const watchHistory = watchProgressService.getItems();
    const watchedIds = new Set(watchHistory.map((w) => w.movieId));
    const favSet = new Set(favoriteMovieIds);

    // Collect preferred genres from watched movies and favorites
    const genreScoreMap: { [genre: string]: number } = {};

    // 1. Weight from favorites (3 points each)
    favoriteMovieIds.forEach((favId) => {
      const m = allMovies.find((item) => item.id === favId);
      if (m) {
        m.genre.forEach((g) => {
          genreScoreMap[g] = (genreScoreMap[g] || 0) + 3;
        });
      }
    });

    // 2. Weight from watched history (2 points each)
    watchHistory.forEach((item) => {
      const m = allMovies.find((x) => x.id === item.movieId);
      if (m) {
        m.genre.forEach((g) => {
          genreScoreMap[g] = (genreScoreMap[g] || 0) + 2;
        });
      }
    });

    // If user has no history yet, fallback to highest rated and featured movies
    const hasHistory = Object.keys(genreScoreMap).length > 0;

    const scored = allMovies
      .filter((m) => !watchedIds.has(m.id) || favSet.has(m.id)) // Prioritize un-watched or favorites
      .map((m) => {
        let score = (m.rating || 7.0) * 1.5; // Base rating score

        if (hasHistory) {
          m.genre.forEach((g) => {
            if (genreScoreMap[g]) {
              score += genreScoreMap[g] * 2.5;
            }
          });
        }

        if (m.isFeatured) score += 3;
        if (m.isTrending) score += 2;
        if (m.isDubbed) score += 1.5;

        return { movie: m, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((s) => s.movie);

    return scored.slice(0, limit);
  },

  /**
   * Smart Similar Movies based on Genre + Cast + Language + Rating
   */
  getSimilarMovies: (targetMovie: Movie, limitCount = 6): Movie[] => {
    const allMovies = movieService.getMovies();
    if (!targetMovie || allMovies.length === 0) return [];

    const targetGenres = new Set(targetMovie.genre.map((g) => g.toLowerCase()));
    const targetCast = new Set(targetMovie.cast.map((c) => c.toLowerCase()));
    const targetLanguages = new Set((targetMovie.language || []).map((l) => l.toLowerCase()));

    return allMovies
      .filter((m) => m.id !== targetMovie.id)
      .map((m) => {
        let score = 0;

        // 1. Genre match (heavy weight: 4 points per shared genre)
        m.genre.forEach((g) => {
          if (targetGenres.has(g.toLowerCase())) {
            score += 4;
          }
        });

        // 2. Cast match (3 points per shared actor)
        m.cast.forEach((c) => {
          if (targetCast.has(c.toLowerCase())) {
            score += 3;
          }
        });

        // 3. Director match (5 points)
        if (m.director && targetMovie.director && m.director.toLowerCase() === targetMovie.director.toLowerCase()) {
          score += 5;
        }

        // 4. Dubbed / Language affinity
        if (targetMovie.isDubbed && m.isDubbed) {
          score += 3;
        }
        (m.language || []).forEach((l) => {
          if (targetLanguages.has(l.toLowerCase())) {
            score += 1.5;
          }
        });

        // 5. Rating proximity
        const ratingDiff = Math.abs((m.rating || 0) - (targetMovie.rating || 0));
        if (ratingDiff < 1.0) score += 2;

        return { movie: m, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.movie)
      .slice(0, limitCount);
  }
};
