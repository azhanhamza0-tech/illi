import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { MovieCard } from '../components/movie/MovieCard';
import { movieService } from '../services/movieService';
import { genresListKurdish } from '../data/movies';
import { Movie } from '../types/movie';

interface CatalogProps {
  type: 'explore' | 'movies' | 'tv' | 'featured' | 'trending' | 'anime' | 'dubbed';
}

export const Catalog: React.FC<CatalogProps> = ({ type }) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vipFilter, setVipFilter] = useState<'all' | 'free' | 'vip'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest'>('popular');

  const [allMovies, setAllMovies] = useState<Movie[]>(() => movieService.getMovies());

  useEffect(() => {
    const unsub = movieService.subscribeToMovies((data) => {
      setAllMovies(data);
    });
    return () => unsub();
  }, []);

  const pageInfo = useMemo(() => {
    switch (type) {
      case 'dubbed':
        return {
          title: 'فیلم و ئەنیمەیشنی دۆبلاژکراو',
          badge: 'Kurdish Dubbed',
          subtitle: 'بەناوبانگترین فیلم، ئەنیمەیشن و دراماکانی جیهان بە دەنگ و دۆبلاژی کوردی پاراو',
          icon: 'translate'
        };
      case 'anime':
        return {
          title: 'ئەنیمێ و کارتوونی ژێرنووسکراو',
          badge: 'Anime & Animation',
          subtitle: 'نوێترین و بەناوبانگترین زنجیرە و فیلمە ئەنیمێیە ژاپۆنییەکان بە ژێرنووسی کوردی و کوالیتی بێ وێنە',
          icon: 'auto_awesome'
        };
      case 'movies':
        return {
          title: 'فیلمە سینەماییەکان',
          badge: '4K Ultra HD Movies',
          subtitle: 'سەرجەم شاکارە سینەماییە کوردی و جیهانییەکان بە کوالێتی 4K Ultra HD',
          icon: 'movie'
        };
      case 'tv':
        return {
          title: 'زنجیرە دراما جیهانییەکان',
          badge: 'TV Shows & Series',
          subtitle: 'بینەری نوێترین ئەڵقە و زنجیرە کوردی و بیانییە وەرگێڕدراوەکان بن',
          icon: 'tv_gen'
        };
      case 'featured':
        return {
          title: 'فیلمە تایبەتکراوەکان',
          badge: 'Featured Releases',
          subtitle: 'هەڵبژێردراوترین بەرهەمە ناوازەکانی سینەما بە پەخشی بێ بەرامبەر و VIP',
          icon: 'stars'
        };
      case 'trending':
        return {
          title: 'پڕبینەرترین و ترێندەکان',
          badge: 'Trending Now',
          subtitle: 'ئەو بەرهەم و فیلمانەی لە ئێستادا زۆرترین بینەریان هەیە لەسەر ڕوانین',
          icon: 'local_fire_department'
        };
      case 'explore':
      default:
        return {
          title: 'گەڕان و دۆزینەوە لە کەتەلۆگ',
          badge: 'Explore Cinema',
          subtitle: 'لە بەرفراوانترین کەتەلۆگی کوردی و جیهانی بەپێی ژانەر و کوالێتی بگەڕێ',
          icon: 'explore'
        };
    }
  }, [type]);

  const filteredMovies = useMemo(() => {
    let result = [...allMovies];

    if (type === 'dubbed') {
      result = result.filter(
        (m) =>
          m.isDubbed ||
          (Array.isArray(m.language) && m.language.some((l) => l.toLowerCase().includes('dubbed') || l.includes('دۆبلاژ'))) ||
          (Array.isArray(m.genre) && m.genre.some((g) => g.toLowerCase().includes('dubbed') || g.includes('دۆبلاژ')))
      );
    } else if (type === 'anime') {
      result = result.filter(
        (m) => m.type === 'anime' || (Array.isArray(m.genre) && m.genre.some((g) => g.toLowerCase() === 'animation'))
      );
    } else if (type === 'featured') {
      result = result.filter((m) => m.isFeatured);
    } else if (type === 'trending') {
      result = result.filter((m) => m.isTrending);
    } else if (type === 'tv') {
      result = result.filter((m) => m.type === 'tv' || (m.seasons !== undefined && m.seasons > 0));
    } else if (type === 'movies') {
      result = result.filter((m) => m.type === 'movie' || (!m.type && !m.seasons));
    }

    if (selectedGenre !== 'All') {
      result = result.filter(
        (m) => Array.isArray(m.genre) && m.genre.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
      );
    }

    if (vipFilter === 'free') {
      result = result.filter((m) => !m.isVIP);
    } else if (vipFilter === 'vip') {
      result = result.filter((m) => m.isVIP);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          (m.title?.toLowerCase() || '').includes(q) ||
          (m.originalTitle?.toLowerCase() || '').includes(q) ||
          (m.director?.toLowerCase() || '').includes(q)
      );
    }

    if (sortBy === 'popular') {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    return result;
  }, [allMovies, type, selectedGenre, vipFilter, searchQuery, sortBy]);

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-gutter py-space-xl flex flex-col gap-space-lg">
        {/* Luxury Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md p-space-lg rounded-3xl bg-gradient-to-tr from-surface-card via-surface-raised to-surface-container-high shadow-2xl relative overflow-hidden">
          <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="flex items-start gap-space-md z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-[30px]">{pageInfo.icon}</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-headline-lg text-headline-lg font-extrabold text-metallic-silver">
                  {pageInfo.title}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm font-bold">
                  {pageInfo.badge}
                </span>
              </div>
              <p className="font-body-md text-body-md text-metallic-muted max-w-2xl">
                {pageInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 z-10">
            <span className="px-4 py-1.5 rounded-full bg-surface-base/70 backdrop-blur-md text-primary font-label-md text-label-md font-bold">
              {filteredMovies.length} بەرهەم
            </span>
          </div>
        </div>

        {/* Media Type Pill Switcher */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-space-xs min-w-max p-1.5 bg-surface-card/90 backdrop-blur-2xl rounded-full shadow-xl">
            {[
              { id: 'explore', label: 'هەموو بەرهەمەکان', path: '/explore', icon: 'explore' },
              { id: 'movies', label: 'فیلمە سینەماییەکان', path: '/movies', icon: 'movie' },
              { id: 'tv', label: 'زنجیرە دراماکان', path: '/tv-shows', icon: 'tv_gen' },
              { id: 'anime', label: 'زنجیرەی ئەنیمێ', path: '/anime', icon: 'auto_awesome' },
              { id: 'dubbed', label: 'دۆبلاژکراوی کوردی', path: '/dubbed', icon: 'translate' }
            ].map((tab) => {
              const isCurrent = type === tab.id;
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 no-underline ${
                    isCurrent
                      ? 'bg-primary text-on-primary font-bold shadow-md'
                      : 'text-metallic-muted hover:text-metallic-silver hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search, VIP Filter & Sort Bar */}
        <div className="flex flex-wrap gap-space-md items-center justify-between p-space-md rounded-2xl bg-surface-card/80 backdrop-blur-2xl shadow-lg">
          {/* Search Input */}
          <div className="flex items-center bg-surface-container-low rounded-full px-space-md py-space-sm flex-1 min-w-[220px] max-w-md focus-within:ring-2 focus-within:ring-primary/40">
            <span className="material-symbols-outlined text-metallic-muted text-[18px] ml-space-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان لەم کەتەلۆگەدا..."
              className="w-full bg-transparent border-0 outline-none text-metallic-silver placeholder:text-metallic-muted font-body-md text-body-md"
            />
          </div>

          {/* VIP Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'all', label: 'هەموو' },
              { id: 'free', label: 'بێبەرامبەر (Free)' },
              { id: 'vip', label: 'تایبەت بە VIP' }
            ].map((vf) => {
              const active = vipFilter === vf.id;
              return (
                <button
                  key={vf.id}
                  type="button"
                  onClick={() => setVipFilter(vf.id as any)}
                  className={`px-4 py-1.5 rounded-full font-label-md text-label-md font-bold transition-all border-0 cursor-pointer ${
                    active
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-surface-container-low text-metallic-muted hover:text-white hover:bg-surface-container'
                  }`}
                >
                  {vf.label}
                </button>
              );
            })}
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-metallic-muted">ڕیزکردن بەپێی:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-1.5 rounded-full bg-surface-container-low text-metallic-silver font-label-md text-label-md border-0 outline-none cursor-pointer"
            >
              <option value="popular" className="bg-surface-card text-white">زۆرترین بینین</option>
              <option value="rating" className="bg-surface-card text-white">بەرزترین نمرەی IMDb</option>
              <option value="newest" className="bg-surface-card text-white">نوێترین بەرهەمەکان</option>
            </select>
          </div>
        </div>

        {/* Kurdish Genre Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            type="button"
            onClick={() => setSelectedGenre('All')}
            className={`px-4 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all border-0 cursor-pointer shrink-0 ${
              selectedGenre === 'All'
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-surface-card text-metallic-muted hover:text-white hover:bg-surface-container'
            }`}
          >
            سەرجەم چەشنەکان
          </button>
          {genresListKurdish.map((genre) => {
            const active = selectedGenre === genre.id;
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => setSelectedGenre(genre.id)}
                className={`px-4 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all border-0 cursor-pointer shrink-0 ${
                  active
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'bg-surface-card text-metallic-muted hover:text-white hover:bg-surface-container'
                }`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>

        {/* Movies Grid */}
        {filteredMovies.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-surface-card/70 backdrop-blur-xl shadow-xl flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-metallic-muted text-[48px]">movie</span>
            <h3 className="font-headline-md text-headline-md font-bold text-metallic-silver">
              هیچ فیلمێک نەدۆزرایەوە
            </h3>
            <p className="font-body-md text-body-md text-metallic-muted">
              تکایە فلتەرەکان بگۆڕە یاخود ناوی فیلمێکی تر بنووسە.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-space-md">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
