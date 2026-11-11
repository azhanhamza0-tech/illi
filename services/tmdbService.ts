import { Movie, CastMember } from '../types/movie';

const DEFAULT_TMDB_API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TMDBSearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

const GENRE_MAP_KU: Record<string, string> = {
  Action: 'ئاکشن',
  'Action & Adventure': 'ئاکشن و سەرکێشی',
  Adventure: 'سەرکێشی',
  Animation: 'ئەنیمەیشن',
  Comedy: 'کۆمیدی',
  Crime: 'تاوانکاری',
  Documentary: 'دۆکیۆمێنتاری',
  Drama: 'دراما',
  Family: 'خێزانی',
  Fantasy: 'خەیاڵی',
  History: 'مێژوویی',
  Horror: 'ترسناک',
  Music: 'میوزیک',
  Mystery: 'نهێنیئامێز',
  Romance: 'ڕۆمانسی',
  'Science Fiction': 'زانستی خەیاڵی',
  'Sci-Fi & Fantasy': 'زانستی خەیاڵی',
  'TV Movie': 'تەلەفزیۆنی',
  Thriller: 'هەستبزوێن',
  War: 'جەنگ',
  'War & Politics': 'جەنگ و سیاسی',
  Western: 'ڕۆژئاوایی'
};

const COUNTRY_MAP_KU: Record<string, string> = {
  US: 'ئەمریکا',
  'United States of America': 'ئەمریکا',
  'United States': 'ئەمریکا',
  GB: 'بەریتانیا',
  'United Kingdom': 'بەریتانیا',
  FR: 'فەرەنسا',
  France: 'فەرەنسا',
  DE: 'ئەڵمانیا',
  Germany: 'ئەڵمانیا',
  IT: 'ئیتاڵیا',
  Italy: 'ئیتاڵیا',
  ES: 'ئیسپانیا',
  Spain: 'ئیسپانیا',
  JP: 'ژاپۆن',
  Japan: 'ژاپۆن',
  KR: 'کۆریای باشوور',
  'South Korea': 'کۆریای باشوور',
  Korea: 'کۆریا',
  TR: 'تورکیا',
  Turkey: 'تورکیا',
  IR: 'ئێران',
  Iran: 'ئێران',
  IQ: 'کوردستان / عێراق',
  Kurdistan: 'کوردستان',
  CA: 'کەنەدا',
  Canada: 'کەنەدا',
  IN: 'هیندستان',
  India: 'هیندستان',
  CN: 'چین',
  China: 'چین',
  AU: 'ئوسترالیا',
  Australia: 'ئوسترالیا'
};

export const tmdbService = {
  getApiKey: (): string => {
    try {
      const stored = localStorage.getItem('rwanin_tmdb_api_key');
      if (stored && stored.trim()) return stored.trim();
    } catch {}
    return (import.meta as any).env?.VITE_TMDB_API_KEY || DEFAULT_TMDB_API_KEY;
  },

  setApiKey: (key: string) => {
    try {
      if (key && key.trim()) {
        localStorage.setItem('rwanin_tmdb_api_key', key.trim());
      } else {
        localStorage.removeItem('rwanin_tmdb_api_key');
      }
    } catch {}
  },

  /**
   * Extract IMDb ID (e.g. tt1375666) if string contains it
   */
  extractImdbId: (input: string): string | null => {
    const match = input.match(/tt\d{6,10}/i);
    return match ? match[0] : null;
  },

  /**
   * Search for movies & series on TMDB or by IMDb ID
   */
  search: async (query: string): Promise<TMDBSearchResult[]> => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const apiKey = tmdbService.getApiKey();

    // Check if query is IMDb ID / URL
    const imdbId = tmdbService.extractImdbId(trimmed);
    if (imdbId) {
      const findResults = await tmdbService.findByImdbId(imdbId);
      if (findResults.length > 0) return findResults;
    }

    try {
      const url = `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
        trimmed
      )}&include_adult=false&language=en-US`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`TMDB HTTP error ${res.status}`);
      const data = await res.json();

      if (!data.results || !Array.isArray(data.results)) return [];

      return data.results
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => ({
          id: item.id,
          media_type: item.media_type as 'movie' | 'tv',
          title: item.title || item.name || '',
          original_title: item.original_title || item.original_name || '',
          overview: item.overview || '',
          poster_path: item.poster_path ? `${IMAGE_BASE_URL}/w500${item.poster_path}` : null,
          backdrop_path: item.backdrop_path ? `${IMAGE_BASE_URL}/original${item.backdrop_path}` : null,
          release_date: item.release_date || item.first_air_date || '',
          vote_average: Math.round((item.vote_average || 0) * 10) / 10,
          vote_count: item.vote_count || 0
        }));
    } catch (err) {
      console.warn('TMDB search error:', err);
      return [];
    }
  },

  /**
   * Find movie or TV show by IMDb ID (e.g. tt1375666)
   */
  findByImdbId: async (imdbId: string): Promise<TMDBSearchResult[]> => {
    const apiKey = tmdbService.getApiKey();
    try {
      const url = `${TMDB_BASE_URL}/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();

      const results: TMDBSearchResult[] = [];

      if (data.movie_results && Array.isArray(data.movie_results)) {
        for (const item of data.movie_results) {
          results.push({
            id: item.id,
            media_type: 'movie',
            title: item.title,
            original_title: item.original_title,
            overview: item.overview || '',
            poster_path: item.poster_path ? `${IMAGE_BASE_URL}/w500${item.poster_path}` : null,
            backdrop_path: item.backdrop_path ? `${IMAGE_BASE_URL}/original${item.backdrop_path}` : null,
            release_date: item.release_date || '',
            vote_average: Math.round((item.vote_average || 0) * 10) / 10,
            vote_count: item.vote_count || 0
          });
        }
      }

      if (data.tv_results && Array.isArray(data.tv_results)) {
        for (const item of data.tv_results) {
          results.push({
            id: item.id,
            media_type: 'tv',
            title: item.name,
            original_title: item.original_name,
            overview: item.overview || '',
            poster_path: item.poster_path ? `${IMAGE_BASE_URL}/w500${item.poster_path}` : null,
            backdrop_path: item.backdrop_path ? `${IMAGE_BASE_URL}/original${item.backdrop_path}` : null,
            release_date: item.first_air_date || '',
            vote_average: Math.round((item.vote_average || 0) * 10) / 10,
            vote_count: item.vote_count || 0
          });
        }
      }

      return results;
    } catch (err) {
      console.warn('TMDB findByImdbId error:', err);
      return [];
    }
  },

  /**
   * Fetch complete movie or TV details and format into Partial<Movie>
   */
  getMediaDetails: async (id: number, mediaType: 'movie' | 'tv'): Promise<Partial<Movie> | null> => {
    const apiKey = tmdbService.getApiKey();
    try {
      const url = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${apiKey}&append_to_response=credits,videos,external_ids&language=en-US`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`TMDB HTTP error ${res.status}`);
      const data = await res.json();

      const isTV = mediaType === 'tv';
      const releaseDate = data.release_date || data.first_air_date || '';
      const year = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : new Date().getFullYear();

      // Duration formatting
      let durationStr = '2h 00m';
      if (!isTV && data.runtime) {
        const hours = Math.floor(data.runtime / 60);
        const mins = data.runtime % 60;
        durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      } else if (isTV) {
        const epTime = data.episode_run_time?.[0] || 45;
        durationStr = `${epTime}m / ئەڵقە`;
      }

      // Kurdish genre mapping
      const rawGenres: string[] = (data.genres || []).map((g: any) => g.name);
      const mappedGenres: string[] = rawGenres.map((g) => GENRE_MAP_KU[g] || g);
      if (mappedGenres.length === 0) {
        mappedGenres.push(isTV ? 'دراما' : 'ئاکشن');
      }

      // Kurdish country mapping
      let countryStr = 'کوردستان';
      const originCountry = data.origin_country?.[0] || data.production_countries?.[0]?.iso_3166_1 || data.production_countries?.[0]?.name;
      if (originCountry && COUNTRY_MAP_KU[originCountry]) {
        countryStr = COUNTRY_MAP_KU[originCountry];
      } else if (originCountry) {
        countryStr = originCountry;
      }

      // Director & Cast
      let director = '';
      if (!isTV && data.credits?.crew) {
        const dirObj = data.credits.crew.find((c: any) => c.job === 'Director');
        if (dirObj) director = dirObj.name;
      } else if (isTV && data.created_by && data.created_by.length > 0) {
        director = data.created_by.map((c: any) => c.name).join('، ');
      } else if (isTV && data.credits?.crew) {
        const creatorObj = data.credits.crew.find((c: any) => c.job === 'Executive Producer' || c.job === 'Director');
        if (creatorObj) director = creatorObj.name;
      }

      const rawCast: any[] = Array.isArray(data.credits?.cast) ? data.credits.cast : [];

      // Extract up to 16 main actors and characters with their real IMDb/TMDB portrait photos
      const castMembers: CastMember[] = rawCast
        .slice(0, 16)
        .map((c: any) => ({
          name: c.name || '',
          role: c.character ? c.character : 'ئەکتەری سەرەکی',
          avatar: c.profile_path ? `${IMAGE_BASE_URL}/w185${c.profile_path}` : undefined
        }))
        .filter((c: CastMember) => Boolean(c.name));

      const cast: string[] = rawCast
        .slice(0, 16)
        .map((c: any) => c.name)
        .filter(Boolean);

      // YouTube trailer
      let trailerUrl = '';
      if (data.videos?.results && Array.isArray(data.videos.results)) {
        const ytTrailer = data.videos.results.find(
          (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        ) || data.videos.results.find((v: any) => v.site === 'YouTube');

        if (ytTrailer?.key) {
          trailerUrl = `https://www.youtube.com/embed/${ytTrailer.key}`;
        }
      }

      const imdbId = data.external_ids?.imdb_id || '';

      const movieData: Partial<Movie> = {
        title: data.title || data.name || '',
        originalTitle: data.original_title || data.original_name || '',
        imdbId: imdbId || undefined,
        tmdbId: data.id,
        type: isTV ? 'tv' : 'movie',
        seasons: isTV ? data.number_of_seasons || 1 : 1,
        episodes: isTV ? data.number_of_episodes || 1 : 1,
        year: isNaN(year) ? 2024 : year,
        rating: Math.round((data.vote_average || 8.0) * 10) / 10,
        duration: durationStr,
        country: countryStr,
        director: director || 'نادیار',
        genre: mappedGenres,
        cast: cast.length > 0 ? cast : ['ئەکتەرانی فیلم'],
        castMembers: castMembers.length > 0 ? castMembers : undefined,
        language: ['کوردی'],
        description: data.overview || '',
        poster: data.poster_path ? `${IMAGE_BASE_URL}/w500${data.poster_path}` : '',
        backdrop: data.backdrop_path ? `${IMAGE_BASE_URL}/original${data.backdrop_path}` : '',
        trailer: trailerUrl || 'https://www.youtube.com/embed/tgbNymZ7vqY'
      };

      return movieData;
    } catch (err) {
      console.warn('TMDB getMediaDetails error:', err);
      return null;
    }
  },

  /**
   * Fetch individual actor/person real headshot photo from TMDB
   * Caches results in localStorage to avoid redundant network calls
   */
  getPersonPhoto: async (actorName: string): Promise<string | null> => {
    if (!actorName || !actorName.trim()) return null;
    const cleanName = actorName.trim();
    const cacheKey = `rwanin_actor_img_${cleanName.toLowerCase()}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return cached;
    } catch {}

    const apiKey = tmdbService.getApiKey();
    try {
      const url = `${TMDB_BASE_URL}/search/person?api_key=${apiKey}&query=${encodeURIComponent(cleanName)}&language=en-US`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const match = data.results.find((p: any) => p.profile_path) || data.results[0];
        if (match?.profile_path) {
          const photoUrl = `${IMAGE_BASE_URL}/w185${match.profile_path}`;
          try {
            localStorage.setItem(cacheKey, photoUrl);
          } catch {}
          return photoUrl;
        }
      }
    } catch (e) {
      console.warn('Error fetching person photo for:', actorName, e);
    }
    return null;
  },

  /**
   * Fetch credits and cast characters with photos for an existing movie by title or ID
   */
  fetchCreditsByTitle: async (title: string, mediaType?: 'movie' | 'tv'): Promise<CastMember[]> => {
    if (!title || !title.trim()) return [];
    try {
      const searchRes = await tmdbService.search(title);
      if (searchRes && searchRes.length > 0) {
        const best = mediaType
          ? searchRes.find((s) => s.media_type === mediaType) || searchRes[0]
          : searchRes[0];
        if (best) {
          const details = await tmdbService.getMediaDetails(best.id, best.media_type);
          if (details?.castMembers && details.castMembers.length > 0) {
            return details.castMembers;
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching credits by title:', title, e);
    }
    return [];
  }
};
