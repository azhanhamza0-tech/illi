import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { SearchBar } from '../components/search/SearchBar';
import { SearchFilters, FilterState } from '../components/search/SearchFilters';
import { SearchResults } from '../components/search/SearchResults';
import { movieService } from '../services/movieService';

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || 'All';

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<FilterState>({
    genre: initialGenre,
    language: 'All',
    sortBy: 'popular',
    isVIP: null
  });

  useEffect(() => {
    const q = searchParams.get('q');
    const g = searchParams.get('genre');
    if (q !== null) setQuery(q);
    if (g !== null) setFilters((prev) => ({ ...prev, genre: g }));
  }, [searchParams]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      searchParams.delete('q');
      setSearchParams(searchParams);
    }
  };

  const filteredMovies = useMemo(() => {
    return movieService.searchMovies(query, {
      genre: filters.genre,
      language: filters.language,
      isVIP: filters.isVIP !== null ? filters.isVIP : undefined,
      sortBy: filters.sortBy,
      mediaType: filters.mediaType
    });
  }, [query, filters]);

  const resetFilters = () => {
    setQuery('');
    setFilters({
      genre: 'All',
      language: 'All',
      sortBy: 'popular',
      isVIP: null,
      mediaType: 'all'
    });
    setSearchParams({});
  };

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-gutter py-space-xl flex flex-col gap-space-lg">
        {/* Luxury Search Hero Header */}
        <div className="p-space-lg rounded-3xl bg-gradient-to-tr from-surface-card via-surface-raised to-surface-container-high shadow-2xl relative overflow-hidden">
          <div className="absolute -left-16 -top-16 w-72 h-72 rounded-full bg-accent-electric-blue/15 blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10 flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-md">
                <span className="material-symbols-outlined text-[26px]">search</span>
              </div>
              <div>
                <h1 className="font-headline-lg text-headline-lg font-extrabold text-metallic-silver">
                  گەڕان بەناو فیلم و زنجیرەکاندا
                </h1>
                <p className="font-body-md text-body-md text-metallic-muted">
                  لە تەواوی بەرهەمە سینەماییە کوردی و جیهانییەکان و پەخشە ناوازەکانی 4K ـی ڕوانین بگەڕێ.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <SearchBar
                value={query}
                onChange={handleQueryChange}
                onClear={() => handleQueryChange('')}
              />
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <SearchFilters
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
        />

        {/* Live Search Results */}
        <SearchResults
          movies={filteredMovies}
          query={query}
          onClear={resetFilters}
        />
      </div>
    </PageContainer>
  );
};
