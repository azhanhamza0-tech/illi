import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useWatchlist } from '../hooks/useWatchlist';
import { MovieCard } from '../components/movie/MovieCard';
import { EmptyState } from '../components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';

export const WatchlistPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'favorites'>('watchlist');
  const { getWatchlistMovies, getFavoriteMovies } = useWatchlist();
  const navigate = useNavigate();

  const watchlistMovies = getWatchlistMovies();
  const favoriteMovies = getFavoriteMovies();

  const currentMovies = activeTab === 'watchlist' ? watchlistMovies : favoriteMovies;

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-gutter py-space-xl flex flex-col gap-space-lg">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-lg rounded-3xl bg-gradient-to-tr from-surface-card via-surface-raised to-surface-container-high shadow-2xl relative overflow-hidden">
          <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="flex items-start gap-space-md z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-[30px]">bookmark</span>
            </div>
            <div>
              <h1 className="font-headline-lg text-headline-lg font-extrabold text-metallic-silver mb-1">
                کتێبخانە و لیستی سەیرکردنی من
              </h1>
              <p className="font-body-md text-body-md text-metallic-muted">
                دەستگەیشتنی خێرا بەو فیلم و زنجیرانەی کە پاشەکەوتت کردوون یان دڵخوازی تۆن.
              </p>
            </div>
          </div>

          {/* Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1.5 bg-surface-base/70 backdrop-blur-xl rounded-full shadow-lg z-10 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('watchlist')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-label-md text-label-md font-bold transition-all border-0 cursor-pointer ${
                activeTab === 'watchlist'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-transparent text-metallic-muted hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">bookmark</span>
              <span>لیستی سەیرکردن ({watchlistMovies.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-label-md text-label-md font-bold transition-all border-0 cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-transparent text-metallic-muted hover:text-white'
              }`}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={activeTab === 'favorites' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                favorite
              </span>
              <span>دڵخوازەکان ({favoriteMovies.length})</span>
            </button>
          </div>
        </div>

        {/* Grid or Empty State */}
        {currentMovies.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'watchlist'
                ? 'لیستی سەیرکردنەکەت بەتاڵە'
                : 'هیچ فیلمێکی دڵخواز زیاد نەکراوە'
            }
            description={
              activeTab === 'watchlist'
                ? 'دەتوانیت هەر فیلمێک بە کلیککردن لەسەر دوگمەی + زیاد بکەیت بۆ ئەم لیستە تاوەکو لە کاتێکی تردا سەیری بکەیت.'
                : 'کلیک لەسەر ئایکۆنی دڵ بکە لەسەر هەر فیلمێک بۆ ئەوەی بخرێتە ڕیزی دڵخوازەکانت.'
            }
            actionText="گەڕان بەناو فیلمەکاندا"
            onAction={() => navigate('/search')}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-space-md">
            {currentMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
