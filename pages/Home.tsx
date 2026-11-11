import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { movieService } from '../services/movieService';
import { recommendationService } from '../services/recommendationService';
import { notificationService } from '../services/notificationService';
import { Movie, AppNotification } from '../types/movie';
import { useAuth } from '../auth/AuthContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { useToast } from '../components/ui/Toast';
import { ContinueWatching } from '../components/account/ContinueWatching';
import '../styles/stitchHome.css';

type FilterTab = 'all' | 'movies' | 'series' | 'anime' | 'dubbed' | 'trending' | 'awarded';
type HomeLang = 'ckb' | 'bad' | 'en';

const KURDISH_DIGITS = ['١', '٢', '٣', '٤', '٥'];

export const Home: React.FC = () => {
  const { user, isVIP, isAdmin, isOwner, logout } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Language State (Kurdish Sorani / Badini / English)
  const [lang, setLang] = useState<HomeLang>(() => {
    try {
      const saved = localStorage.getItem('rwanin_language');
      if (saved === 'en' || saved === 'ckb' || saved === 'bad') return saved;
    } catch {
      // ignore
    }
    return 'ckb';
  });

  // Catalog Movies Real-Time State
  const [allMovies, setAllMovies] = useState<Movie[]>(() => movieService.getMovies());
  const [isRestoring, setIsRestoring] = useState(false);

  // Filter & Hero State
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [heroIndex, setHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [recentOffset, setRecentOffset] = useState(0);

  // Header Interactive States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [brightMode, setBrightMode] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const notifBoxRef = useRef<HTMLDivElement>(null);
  const langBoxRef = useRef<HTMLDivElement>(null);
  const profileBoxRef = useRef<HTMLDivElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);

  // Real-time Firestore catalog subscription
  useEffect(() => {
    const unsubscribe = movieService.subscribeToMovies((updated) => {
      setAllMovies(updated);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Notifications subscription
  useEffect(() => {
    const unsub = notificationService.subscribe((notifs) => {
      setNotifications(notifs);
    });
    return () => unsub();
  }, []);

  // ⌘K / Ctrl+K keyboard shortcut for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setNotifOpen(false);
        setLangMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setSearchFocused(false);
      }
      if (notifBoxRef.current && !notifBoxRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (langBoxRef.current && !langBoxRef.current.contains(target)) {
        setLangMenuOpen(false);
      }
      if (profileBoxRef.current && !profileBoxRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Hero Parallax on Scroll (Exact Stitch Script)
  useEffect(() => {
    const handleScroll = () => {
      if (!heroBgRef.current) return;
      const scrolled = window.scrollY;
      if (scrolled < 700) {
        heroBgRef.current.style.transform = `scale(${1 + scrolled * 0.00015}) translateY(${scrolled * 0.1}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Derived Movie Collections
  const featuredMovies = useMemo(
    () => allMovies.filter((m) => m.isFeatured),
    [allMovies]
  );

  const heroSlides = useMemo(() => {
    let list: Movie[] = [];
    if (activeTab === 'series') {
      list = allMovies.filter((m) => m.type === 'tv' || (m.seasons !== undefined && m.seasons > 0));
    } else if (activeTab === 'anime') {
      list = allMovies.filter((m) => m.type === 'anime');
    } else if (activeTab === 'dubbed') {
      list = allMovies.filter((m) => m.isDubbed || m.language?.some((l) => l.toLowerCase().includes('dubbed')));
    } else if (activeTab === 'movies') {
      list = allMovies.filter((m) => m.type === 'movie' || (!m.type && !m.seasons));
    } else {
      const topPicks = allMovies.filter((m) => m.isFeatured || m.isTrending || m.rating >= 8.2);
      list = topPicks.length >= 3 ? topPicks : allMovies;
    }
    return list.slice(0, 6);
  }, [allMovies, activeTab]);

  // Auto-advance Hero Carousel
  useEffect(() => {
    if (heroSlides.length <= 1 || isHeroPaused) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length, isHeroPaused]);

  // Reset hero index when tab changes
  useEffect(() => {
    setHeroIndex(0);
    setRecentOffset(0);
  }, [activeTab]);

  const currentHero = heroSlides[heroIndex] || allMovies[0];

  // Filtered Recently Added / Main Showcase Grid
  const filteredShelfMovies = useMemo(() => {
    let list = movieService.getRecentlyAdded(24);
    if (list.length === 0) list = allMovies;

    if (activeTab === 'movies') {
      return allMovies.filter((m) => m.type === 'movie' || (!m.type && !m.seasons));
    }
    if (activeTab === 'series') {
      return allMovies.filter((m) => m.type === 'tv' || (m.seasons !== undefined && m.seasons > 0));
    }
    if (activeTab === 'anime') {
      return allMovies.filter((m) => m.type === 'anime');
    }
    if (activeTab === 'dubbed') {
      return allMovies.filter((m) => m.isDubbed || m.language?.some((l) => l.toLowerCase().includes('dubbed')));
    }
    if (activeTab === 'trending') {
      return movieService.getTrendingMovies(18);
    }
    if (activeTab === 'awarded') {
      return allMovies.filter((m) => m.rating >= 8.4 || m.genre?.some((g) => g.toLowerCase() === 'kurdish'));
    }
    return list;
  }, [allMovies, activeTab]);

  const visibleShelfMovies = useMemo(() => {
    if (filteredShelfMovies.length <= 6) return filteredShelfMovies;
    const start = recentOffset % filteredShelfMovies.length;
    const result: Movie[] = [];
    for (let i = 0; i < 6; i++) {
      result.push(filteredShelfMovies[(start + i) % filteredShelfMovies.length]);
    }
    return result;
  }, [filteredShelfMovies, recentOffset]);

  // Bento Featured Showcase Picks (3 items: 1 wide + 2 vertical)
  const bentoPicks = useMemo(() => {
    const feat = featuredMovies.length >= 3 ? featuredMovies : allMovies;
    const main = feat[0];
    const second = feat[1] || allMovies[1];
    const animePick =
      allMovies.find((m) => m.type === 'anime') || feat[2] || allMovies[2];
    return { main, second, animePick };
  }, [featuredMovies, allMovies]);

  // Top 5 Most Watched
  const top5Movies = useMemo(
    () => [...allMovies].sort((a, b) => b.views - a.views).slice(0, 5),
    [allMovies]
  );

  // AI Recommendations
  const userId = user?.uid || user?.id || 'guest';
  const smartRecommendations = useMemo(
    () => recommendationService.getPersonalizedRecommendations(userId, 4),
    [userId, allMovies]
  );

  // TV Series Shelf
  const tvSeries = useMemo(
    () => allMovies.filter((m) => m.type === 'tv' || (m.seasons !== undefined && m.seasons > 0)).slice(0, 6),
    [allMovies]
  );

  // Live Search Results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allMovies
      .filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
          m.genre?.some((g) => g.toLowerCase().includes(q)) ||
          m.director?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchQuery, allMovies]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  // Handlers
  const handleRestoreCatalog = async () => {
    setIsRestoring(true);
    try {
      const restored = await movieService.seedOrRestoreCatalog();
      setAllMovies(restored);
      showToast('سەرجەم فیلم و بەرهەمەکان بە سەرکەوتوویی گەڕێنرانەوە کەتەلۆگ!', 'success');
    } catch {
      showToast('کێشەیەک ڕوویدا لە گەڕاندنەوەی کەتەلۆگ', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleHeroWatchlist = () => {
    if (!currentHero) return;
    const currentlySaved = isInWatchlist(currentHero.id);
    toggleWatchlist(currentHero.id);
    showToast(
      currentlySaved
        ? `${currentHero.title} لە لیستی سەیرکردن لابرا`
        : `${currentHero.title} زیادکرا بۆ لیستی سەیرکردن`,
      currentlySaved ? 'info' : 'success'
    );
  };

  const handleLanguageChange = (newLang: HomeLang) => {
    setLang(newLang);
    setLangMenuOpen(false);
    try {
      localStorage.setItem('rwanin_language', newLang);
    } catch {
      // ignore
    }
    const labels: Record<HomeLang, string> = {
      ckb: 'زمان گۆڕدرا بۆ کوردی (سۆرانی)',
      bad: 'زمان هاتە گۆڕین بۆ کوردی (بادینی)',
      en: 'Language switched to English'
    };
    showToast(labels[newLang], 'success');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchFocused(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    showToast('بە سەرکەوتوویی چوونەدەرەوە ئەنجامدرا', 'info');
  };

  const isSavedHero = currentHero ? isInWatchlist(currentHero.id) : false;

  return (
    <div
      className={`stitch-home-root bg-surface-base font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container ${
        brightMode ? 'cinema-bright-mode' : ''
      }`}
      dir={lang === 'en' ? 'ltr' : 'rtl'}
    >
      {/* =====================================================================
          TOP GLASSMORPHIC HEADER
         ===================================================================== */}
      <header className="fixed top-0 w-full z-50 bg-surface-base/80 backdrop-blur-2xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 w-full px-gutter flex items-center justify-between gap-space-md">
          {/* Left/Right Brand & Navigation */}
          <div className="flex items-center gap-space-lg">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-space-sm group no-underline">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary via-primary-container to-secondary flex items-center justify-center shadow-[0_0_24px_rgba(192,193,255,0.35)] group-hover:scale-105 transition-transform duration-300">
                <span className="material-symbols-outlined text-surface-base font-bold text-[24px]">
                  play_arrow
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-md text-headline-md tracking-wider text-metallic-silver font-bold group-hover:text-primary transition-colors">
                    RWANIN
                  </span>
                  <span className="px-space-xs py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm uppercase font-semibold">
                    CINEMA
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium tracking-normal">
                  {lang === 'en' ? 'RWANIN STREAM' : 'ڕوانین ستریم'}
                </span>
              </div>
            </Link>

            {/* Primary Navigation Links */}
            <nav className="hidden xl:flex items-center gap-space-xs bg-surface-raised/90 p-space-xs rounded-full shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              <Link
                to="/"
                onClick={() => setActiveTab('all')}
                className="px-space-md py-space-sm font-label-md transition-all bg-surface-container-high text-primary rounded-full shadow-inner no-underline"
              >
                {lang === 'en' ? 'Home' : lang === 'bad' ? 'سەرەکی' : 'ماڵەوە'}
              </Link>
              <Link
                to="/movies"
                className="px-space-md py-space-sm rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all no-underline"
              >
                {lang === 'en' ? 'Movies' : lang === 'bad' ? 'فلم' : 'فیلمەکان'}
              </Link>
              <Link
                to="/series"
                className="px-space-md py-space-sm rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all no-underline"
              >
                {lang === 'en' ? 'Series' : lang === 'bad' ? 'زنجیرە' : 'زنجیرەکان'}
              </Link>
              <Link
                to="/anime"
                className="px-space-md py-space-sm rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all no-underline"
              >
                {lang === 'en' ? 'Anime' : 'ئەنیمێ'}
              </Link>
              <Link
                to="/dubbed"
                className="px-space-md py-space-sm rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all no-underline"
              >
                {lang === 'en' ? 'Dubbed' : lang === 'bad' ? 'دۆبلاژکری' : 'دۆبلاژکراو'}
              </Link>
              <Link
                to="/explore"
                className="px-space-md py-space-sm rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all no-underline"
              >
                {lang === 'en' ? 'Explore' : lang === 'bad' ? 'کەتەلۆگ' : 'پۆلەکان'}
              </Link>
              <Link
                to="/vip"
                className="px-space-md py-space-sm rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all no-underline"
              >
                {lang === 'en' ? 'VIP Pass' : 'VIP بەشداریکردن'}
              </Link>
            </nav>
          </div>

          {/* Search, VIP Badge & Action Icons */}
          <div className="flex items-center gap-space-md">
            {/* Interactive Search Bar (⌘K) */}
            <div className="hidden md:flex items-center relative w-64 lg:w-72" ref={searchBoxRef}>
              <form
                onSubmit={handleSearchSubmit}
                className="w-full flex items-center bg-surface-container-low/90 rounded-full px-space-md py-space-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:bg-surface-container transition-all"
              >
                <span className="material-symbols-outlined text-metallic-muted text-[18px] ml-space-sm">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  className="w-full bg-transparent border-0 outline-none text-metallic-silver placeholder:text-metallic-muted font-body-md text-body-md"
                  placeholder={
                    lang === 'en'
                      ? 'Search movies & series...'
                      : lang === 'bad'
                      ? 'گەڕیان ل دووڤ فلم و زنجیران...'
                      : 'گەڕان بەدوای فیلم و زنجیرە...'
                  }
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                />
                <kbd className="hidden sm:inline-flex items-center px-space-xs py-0.5 rounded bg-surface-container-high text-metallic-muted font-label-sm text-label-sm shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
                  ⌘K
                </kbd>
              </form>

              {/* Live Search Dropdown */}
              {searchFocused && searchQuery.trim() && (
                <div className="stitch-popover-panel left-0 right-0 p-2 max-h-96 overflow-y-auto no-scrollbar">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-metallic-muted text-sm">
                      هیچ بەرهەمێک بەم ناوە نەدۆزرایەوە
                    </div>
                  ) : (
                    searchResults.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSearchFocused(false);
                          navigate(`/movie/${m.id}`);
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-high transition-colors text-right border-0 bg-transparent cursor-pointer"
                      >
                        <img
                          src={m.poster}
                          alt={m.title}
                          className="w-10 h-14 object-cover rounded-lg shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-metallic-silver truncate">
                            {m.title}
                          </div>
                          <div className="text-xs text-metallic-muted">
                            {m.year} • ★ {m.rating}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* VIP Diamond Badge */}
            <Link
              to="/vip"
              className="hidden lg:flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:bg-surface-container transition-all no-underline"
              title={isVIP ? 'ئەندامێتی VIP چالاکە' : 'ببە بە ئەندامی VIP'}
            >
              <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
              <span className="font-label-sm text-label-sm font-semibold text-tertiary">
                {isVIP ? 'VIP ACTIVE' : 'VIP DIAMOND'}
              </span>
            </Link>

            {/* Interactive Controls */}
            <div className="flex items-center gap-space-sm">
              {/* Notifications Bell */}
              <div className="relative" ref={notifBoxRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all relative border-0 cursor-pointer"
                  aria-label="ئاگادارکردنەوەکان"
                >
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-accent-electric-blue animate-pulse" />
                  )}
                </button>

                {notifOpen && (
                  <div className="stitch-popover-panel left-0 w-80 p-3">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                      <span className="text-sm font-bold text-metallic-silver">ئاگادارکردنەوەکان</span>
                      <button
                        type="button"
                        onClick={() => notificationService.markAllAsRead()}
                        className="text-xs text-primary hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        خوێندنەوەی هەمووی
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto no-scrollbar">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-metallic-muted py-4 text-center">
                          هیچ ئاگادارکردنەوەیەک نییە
                        </p>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              notificationService.markAsRead(n.id);
                              setNotifOpen(false);
                              if (n.link) navigate(n.link);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                              n.unread ? 'bg-primary/10' : 'hover:bg-surface-container'
                            }`}
                          >
                            <div className="text-xs font-bold text-metallic-silver">{n.title}</div>
                            <div className="text-[11px] text-metallic-muted mt-0.5 line-clamp-2">
                              {n.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Language Switcher (Sorani / Badini / English) */}
              <div className="relative" ref={langBoxRef}>
                <button
                  type="button"
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="hidden sm:flex w-10 h-10 rounded-full bg-surface-container-low items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all border-0 cursor-pointer"
                  title="گۆڕینی زمان (سۆرانی / بادینی / English)"
                >
                  <span className="material-symbols-outlined text-[20px]">translate</span>
                </button>

                {langMenuOpen && (
                  <div className="stitch-popover-panel left-0 w-48 p-2 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('ckb')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border-0 cursor-pointer transition-colors ${
                        lang === 'ckb'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-transparent text-metallic-silver hover:bg-surface-container'
                      }`}
                    >
                      <span>☀️ کوردی (سۆرانی)</span>
                      {lang === 'ckb' && <span className="material-symbols-outlined text-[15px]">check</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('bad')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border-0 cursor-pointer transition-colors ${
                        lang === 'bad'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-transparent text-metallic-silver hover:bg-surface-container'
                      }`}
                    >
                      <span>☀️ کوردی (بادینی)</span>
                      {lang === 'bad' && <span className="material-symbols-outlined text-[15px]">check</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('en')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border-0 cursor-pointer transition-colors ${
                        lang === 'en'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-transparent text-metallic-silver hover:bg-surface-container'
                      }`}
                    >
                      <span>🇬🇧 English</span>
                      {lang === 'en' && <span className="material-symbols-outlined text-[15px]">check</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* Ambient Cinema Contrast Toggle */}
              <button
                type="button"
                onClick={() => {
                  setBrightMode(!brightMode);
                  showToast(
                    !brightMode ? 'دۆخی ڕووناکی سینەمایی چالاککرا' : 'دۆخی تاریکی سینەمایی گەڕێنرایەوە',
                    'info'
                  );
                }}
                className="hidden sm:flex w-10 h-10 rounded-full bg-surface-container-low items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all border-0 cursor-pointer"
                title="گۆڕینی دۆخی ڕووناکی"
              >
                <span className="material-symbols-outlined text-[20px]">dark_mode</span>
              </button>

              {/* Profile Avatar / Login Menu */}
              <div className="relative pl-space-xs" ref={profileBoxRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                    } else {
                      setProfileMenuOpen(!profileMenuOpen);
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden border-0 cursor-pointer hover:scale-105 transition-transform"
                  title={user ? user.name : 'چوونەژوورەوە'}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                  )}
                </button>

                {profileMenuOpen && user && (
                  <div className="stitch-popover-panel left-0 w-60 p-3 flex flex-col gap-1">
                    <div className="pb-2 mb-2 border-b border-white/10">
                      <div className="text-sm font-bold text-metallic-silver truncate">{user.name}</div>
                      <div className="text-xs text-metallic-muted truncate">{user.email}</div>
                      {isVIP && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-tertiary/20 text-tertiary text-[10px] font-bold">
                          VIP MEMBER
                        </span>
                      )}
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-metallic-silver hover:bg-surface-container no-underline"
                    >
                      <span className="material-symbols-outlined text-[16px]">account_circle</span>
                      <span>هەژمارەکەم</span>
                    </Link>
                    <Link
                      to="/watchlist"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-metallic-silver hover:bg-surface-container no-underline"
                    >
                      <span className="material-symbols-outlined text-[16px]">bookmark</span>
                      <span>لیستی سەیرکردن</span>
                    </Link>
                    {(isAdmin || isOwner) && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-accent-electric-blue hover:bg-surface-container no-underline"
                      >
                        <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                        <span>پانێڵی بەڕێوەبردن</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error/10 bg-transparent border-0 cursor-pointer text-right w-full"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>چوونەدەرەوە</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="xl:hidden w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface border-0 cursor-pointer"
                aria-label="مینیۆ"
              >
                <span className="material-symbols-outlined text-[22px]">
                  {mobileNavOpen ? 'close' : 'menu'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="xl:hidden bg-surface-raised/95 backdrop-blur-2xl border-t border-white/10 p-4 flex flex-col gap-2">
            <Link
              to="/"
              onClick={() => setMobileNavOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high text-primary font-semibold text-sm no-underline"
            >
              ماڵەوە
            </Link>
            <Link
              to="/movies"
              onClick={() => setMobileNavOpen(false)}
              className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container text-sm no-underline"
            >
              فیلمەکان
            </Link>
            <Link
              to="/series"
              onClick={() => setMobileNavOpen(false)}
              className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container text-sm no-underline"
            >
              زنجیرەکان
            </Link>
            <Link
              to="/anime"
              onClick={() => setMobileNavOpen(false)}
              className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container text-sm no-underline"
            >
              ئەنیمێ
            </Link>
            <Link
              to="/dubbed"
              onClick={() => setMobileNavOpen(false)}
              className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container text-sm no-underline"
            >
              دۆبلاژکراو
            </Link>
            <Link
              to="/search"
              onClick={() => setMobileNavOpen(false)}
              className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container text-sm no-underline"
            >
              گەڕان
            </Link>
            <Link
              to="/vip"
              onClick={() => setMobileNavOpen(false)}
              className="px-4 py-2.5 rounded-xl text-tertiary font-semibold hover:bg-surface-container text-sm no-underline"
            >
              VIP بەشداریکردن
            </Link>
          </div>
        )}
      </header>

      {/* =====================================================================
          MAIN HOME FEED
         ===================================================================== */}
      <main className="w-full pt-20 bg-surface-base">
        <div className="flex flex-col w-full text-on-surface overflow-x-hidden selection:bg-primary selection:text-on-primary">
          {/* Catalog Empty Fallback */}
          {allMovies.length === 0 && (
            <div className="max-w-3xl mx-auto my-8 p-6 rounded-2xl bg-error/10 border border-error/30 text-center flex flex-col items-center gap-3 z-30">
              <span className="material-symbols-outlined text-error text-[36px]">error</span>
              <h3 className="text-lg font-bold text-white">کەتەلۆگی فیلمەکان لەم ساتەدا بەتاڵە</h3>
              <button
                type="button"
                onClick={handleRestoreCatalog}
                disabled={isRestoring}
                className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold text-sm border-0 cursor-pointer"
              >
                {isRestoring ? 'خەریکی گەڕاندنەوەیە...' : 'گەڕاندنەوەی سەرجەم فیلمە بنەڕەتییەکان'}
              </button>
            </div>
          )}

          {/* =================================================================
              1. HERO MASTERPIECE SHOWCASE
             ================================================================= */}
          <section
            className="relative w-full min-h-[92vh] flex items-end -mt-20 overflow-hidden"
            id="hero-carousel"
            onMouseEnter={() => setIsHeroPaused(true)}
            onMouseLeave={() => setIsHeroPaused(false)}
          >
            {/* Dynamic Background Artwork with Multi-Vignette Gradients */}
            <div
              id="hero-bg"
              ref={heroBgRef}
              className="absolute inset-0 z-0 bg-gradient-to-tr from-surface-base via-surface-card to-surface-container-high transition-all duration-700"
            >
              {currentHero?.backdrop || currentHero?.poster ? (
                <img
                  src={currentHero.backdrop || currentHero.poster}
                  alt={currentHero.title}
                  className="w-full h-full object-cover opacity-55 transition-opacity duration-700"
                />
              ) : null}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
                style={{
                  background:
                    'radial-gradient(circle at 75% 35%, rgba(192, 193, 255, 0.25) 0%, rgba(56, 189, 248, 0.15) 30%, transparent 70%)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/70 to-surface-base/20" />
              <div className="absolute inset-0 bg-gradient-to-l from-surface-base/90 via-surface-base/50 to-transparent" />
            </div>

            {/* Hero Content Container */}
            {currentHero && (
              <div className="relative z-10 w-full max-w-7xl mx-auto px-gutter pt-36 pb-space-xl flex flex-col justify-end gap-space-lg">
                {/* Metadata Badges */}
                <div className="flex flex-wrap items-center gap-space-sm animate-fade-in">
                  <div className="flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-tertiary-container/30 backdrop-blur-md">
                    <span
                      className="material-symbols-outlined text-tertiary text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-label-md text-label-md font-bold text-tertiary">
                      IMDb {currentHero.rating}
                    </span>
                  </div>
                  <span className="px-space-sm py-1 rounded-full bg-surface-container-high/80 text-metallic-silver font-label-sm text-label-sm backdrop-blur-md">
                    {currentHero.duration || '٢ کاتژمێر'}
                  </span>
                  <span className="px-space-sm py-1 rounded-full bg-surface-container-high/80 text-metallic-silver font-label-sm text-label-sm backdrop-blur-md">
                    {currentHero.year}
                  </span>
                  <div className="flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container-high/80 text-accent-electric-blue font-label-sm text-label-sm backdrop-blur-md">
                    <span className="material-symbols-outlined text-[15px]">movie</span>
                    <span>{currentHero.genre?.slice(0, 3).join(' • ') || 'دراما • سینەمایی'}</span>
                  </div>
                  <span className="px-space-xs py-0.5 rounded bg-primary-container/30 text-primary-fixed font-label-sm text-label-sm uppercase font-semibold">
                    4K ULTRA HD
                  </span>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-metallic-muted font-label-sm text-label-sm uppercase">
                    {currentHero.isDubbed ? 'دۆبلاژ • ژێرنووس' : 'ژێرنووسی کوردی'}
                  </span>
                </div>

                {/* Titles */}
                <div className="flex flex-col gap-space-xs max-w-3xl">
                  <span className="font-headline-md text-headline-md font-bold tracking-tight text-primary-fixed drop-shadow-md">
                    {currentHero.originalTitle || currentHero.badge || 'شاکاری هەڵبژێردراوی ڕوانین'}
                  </span>
                  <h1 className="font-display-xl text-display-xl tracking-tight text-metallic-silver font-extrabold drop-shadow-2xl">
                    {currentHero.title}
                  </h1>
                </div>

                {/* Description */}
                <p className="font-body-lg text-body-lg text-metallic-muted max-w-2xl line-clamp-3 leading-relaxed drop-shadow">
                  {currentHero.description}
                </p>

                {/* Primary Hero Actions & Slide Switcher Pill */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg pt-space-xs">
                  <div className="flex flex-wrap items-center gap-space-md">
                    <button
                      type="button"
                      onClick={() => navigate(`/watch/${currentHero.id}`)}
                      className="group flex items-center gap-space-sm px-space-lg py-space-sm rounded-full bg-primary text-on-primary font-headline-md text-title-sm font-semibold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300 border-0 cursor-pointer"
                    >
                      <span
                        className="material-symbols-outlined text-[26px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                      <span>{lang === 'en' ? 'Watch Now' : lang === 'bad' ? 'دەستپێبکە' : 'دەستپێکردن'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleHeroWatchlist}
                      className="flex items-center gap-space-sm px-space-md py-space-sm rounded-full bg-surface-card/80 text-metallic-silver hover:bg-surface-container-highest hover:text-white font-label-md text-label-md backdrop-blur-xl shadow-lg transition-all duration-300 border-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isSavedHero ? 'bookmark_added' : 'bookmark_add'}
                      </span>
                      <span>
                        {isSavedHero
                          ? 'لە لیستەکەدایە'
                          : lang === 'en'
                          ? 'Watchlist'
                          : 'لیستی سەیرکردن'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/movie/${currentHero.id}`)}
                      className="flex items-center gap-space-sm px-space-md py-space-sm rounded-full bg-surface-card/60 text-metallic-muted hover:text-metallic-silver hover:bg-surface-container font-label-md text-label-md backdrop-blur-xl transition-all duration-300 border-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">info</span>
                      <span>{lang === 'en' ? 'More Info' : 'زانیاری زیاتر'}</span>
                    </button>
                  </div>

                  {/* Floating Slide Switcher Pill */}
                  <div className="flex items-center gap-space-md bg-surface-raised/80 backdrop-blur-2xl p-space-xs rounded-full shadow-2xl self-start lg:self-auto">
                    <div className="flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-surface-container-high">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[18px]">movie</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="font-label-sm text-label-sm font-semibold text-metallic-silver">
                          بەرهەمی پێشنیارکراو
                        </span>
                        <span className="font-label-sm text-label-sm text-tertiary">
                          ★ {currentHero.rating} / 10
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-space-sm px-space-md py-1.5 rounded-full hover:bg-surface-container-high/60">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-accent-electric-blue shrink-0">
                        <span className="material-symbols-outlined text-[18px]">hd</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="font-label-sm text-label-sm font-semibold text-metallic-muted">
                          کوالیتی 4K
                        </span>
                        <span className="font-label-sm text-label-sm text-primary">
                          {currentHero.isVIP ? 'VIP بەردەستە' : 'خۆڕایی بەردەستە'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pl-space-xs">
                      <button
                        type="button"
                        aria-label="پێشوو"
                        onClick={() =>
                          setHeroIndex((prev) => (prev - 1 + heroSlides.length) % Math.max(heroSlides.length, 1))
                        }
                        className="w-8 h-8 rounded-full flex items-center justify-center text-metallic-muted hover:text-white hover:bg-surface-container transition-all border-0 bg-transparent cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                      <button
                        type="button"
                        aria-label="دواتر"
                        onClick={() =>
                          setHeroIndex((prev) => (prev + 1) % Math.max(heroSlides.length, 1))
                        }
                        className="w-8 h-8 rounded-full flex items-center justify-center text-metallic-muted hover:text-white hover:bg-surface-container transition-all border-0 bg-transparent cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* =================================================================
              2. CINEMATIC FILTER PILL BAR (Sticky Quick Access)
             ================================================================= */}
          <section className="w-full px-gutter max-w-7xl mx-auto -mt-4 relative z-20">
            <div className="w-full overflow-x-auto py-space-sm no-scrollbar">
              <div className="flex items-center gap-space-xs min-w-max p-1.5 bg-surface-card/90 backdrop-blur-2xl rounded-full shadow-2xl">
                {[
                  { id: 'all', label: lang === 'en' ? 'All' : 'هەمووان' },
                  { id: 'movies', label: lang === 'en' ? 'Movies' : 'فیلمەکان' },
                  { id: 'series', label: lang === 'en' ? 'Series' : 'زنجیرەکان' },
                  { id: 'anime', label: lang === 'en' ? 'Anime' : 'ئەنیمێ' },
                  { id: 'dubbed', label: lang === 'en' ? 'Kurdish Dubbed' : 'دۆبلاژکراوی کوردی', dot: true },
                  { id: 'trending', label: lang === 'en' ? 'Most Watched' : 'پڕبینەرترین' },
                  { id: 'awarded', label: lang === 'en' ? 'Awarded' : 'خەڵاتکراوەکان', icon: 'workspace_premium' }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as FilterTab)}
                      className={`px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 border-0 cursor-pointer ${
                        isActive
                          ? 'bg-primary text-on-primary font-semibold'
                          : 'bg-transparent text-metallic-muted hover:text-metallic-silver hover:bg-surface-container'
                      }`}
                    >
                      {tab.dot && <span className="w-2 h-2 rounded-full bg-secondary" />}
                      {tab.icon && (
                        <span className="material-symbols-outlined text-[15px] text-tertiary">
                          {tab.icon}
                        </span>
                      )}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('ai-recommendations')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-space-md py-space-xs rounded-full text-accent-electric-blue hover:bg-surface-container font-label-md text-label-md transition-all flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                  <span>{lang === 'en' ? 'AI Picks' : 'پێشنیاری ژیری دەستکرد'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Continue Watching Bar (Appears seamlessly if user has watch progress) */}
          <div className="w-full px-gutter max-w-7xl mx-auto pt-4">
            <ContinueWatching />
          </div>

          {/* =================================================================
              3. RECENTLY ADDED / FILTERED SHELF (تازە زیادکراوەکان)
             ================================================================= */}
          <section className="w-full px-gutter max-w-7xl mx-auto pt-space-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shadow-md">
                  <span className="material-symbols-outlined text-[22px]">new_releases</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <h2 className="font-headline-md text-headline-md font-bold text-metallic-silver">
                      {activeTab === 'all' ? 'تازە زیادکراوەکان' : 'بەرهەمە هەڵبژێردراوەکان'}
                    </h2>
                    <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-metallic-muted font-label-sm text-label-sm">
                      نوێترین
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-metallic-muted">
                    نوێترین فیلم و بەرهەمە زیادکراوەکانی پلاتفۆرمی ڕوانین
                  </span>
                </div>
              </div>

              {/* Action & Carousel Controls */}
              <div className="flex items-center gap-space-sm">
                <Link
                  className="hidden sm:flex items-center gap-1 text-primary hover:text-primary-fixed font-label-md text-label-md transition-colors no-underline"
                  to="/explore"
                >
                  <span>بینینی هەمووی</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="گەڕانەوە"
                    onClick={() => setRecentOffset((prev) => Math.max(0, prev - 1))}
                    className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-metallic-muted hover:text-white hover:bg-surface-container transition-all border-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    aria-label="پێشەوە"
                    onClick={() => setRecentOffset((prev) => prev + 1)}
                    className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-metallic-muted hover:text-white hover:bg-surface-container transition-all border-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-space-md">
              {visibleShelfMovies.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  className="group relative flex flex-col gap-space-xs cursor-pointer"
                >
                  <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-b from-surface-container-high to-surface-card shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary/20 flex flex-col justify-between p-space-sm">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-base/95 via-transparent to-surface-base/40" />

                    <div className="flex items-center justify-between z-10">
                      <span className="px-1.5 py-0.5 rounded bg-surface-base/75 backdrop-blur-md text-metallic-silver font-label-sm text-label-sm uppercase font-semibold">
                        {movie.qualities?.['4K'] ? '4K' : 'HD'}
                      </span>
                      <span className="px-space-xs py-0.5 rounded-full bg-surface-base/80 backdrop-blur-md text-tertiary font-label-sm text-label-sm font-bold flex items-center gap-0.5">
                        <span
                          className="material-symbols-outlined text-[13px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        {movie.rating}
                      </span>
                    </div>

                    <div className="flex items-center justify-between z-10 mt-auto">
                      {movie.isVIP ? (
                        <span className="px-space-xs py-0.5 rounded bg-tertiary-container/80 text-white font-label-sm text-label-sm font-bold">
                          VIP
                        </span>
                      ) : (
                        <span className="px-space-xs py-0.5 rounded bg-primary-container/60 text-primary-fixed font-label-sm text-label-sm">
                          {movie.isDubbed ? 'دۆبلاژ' : 'نوێ'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/watch/${movie.id}`);
                        }}
                        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border-0 cursor-pointer"
                        title="سەیرکردن"
                      >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 pt-1">
                    <span className="font-title-sm text-title-sm font-semibold text-metallic-silver truncate group-hover:text-primary transition-colors">
                      {movie.title}
                    </span>
                    <div className="flex items-center justify-between text-metallic-muted font-label-sm text-label-sm">
                      <span className="truncate">{movie.genre?.slice(0, 2).join(' / ') || 'سینەمایی'}</span>
                      <span>{movie.year}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =================================================================
              4. FEATURED EXCLUSIVES & BENTO SHOWCASE (فیلمە تایبەتکراوەکان)
             ================================================================= */}
          <section className="w-full px-gutter max-w-7xl mx-auto pt-space-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary shadow-md">
                  <span className="material-symbols-outlined text-[22px]">stars</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <h2 className="font-headline-md text-headline-md font-bold text-metallic-silver">
                      فیلمە تایبەتکراوەکان
                    </h2>
                    <span className="px-space-xs py-0.5 rounded bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm">
                      هەڵبژاردەی ڕوانین
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-metallic-muted">
                    شاکارە هەرە نایابەکانی سینەما بە کوالێتی 4K Ultra HD لەگەڵ دۆڵبی ئەتمۆس
                  </span>
                </div>
              </div>
              <Link
                className="flex items-center gap-1 text-primary hover:text-primary-fixed font-label-md text-label-md transition-colors no-underline"
                to="/featured"
              >
                <span>بینینی هەمووی</span>
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </Link>
            </div>

            {/* Asymmetric Bento Showcase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-space-md">
              {/* Feature Bento Card 1 (Wide Span 2) */}
              {bentoPicks.main && (
                <div
                  onClick={() => navigate(`/movie/${bentoPicks.main.id}`)}
                  className="md:col-span-2 lg:col-span-2 relative h-80 rounded-2xl overflow-hidden bg-gradient-to-r from-surface-card via-surface-container-high to-surface-card group cursor-pointer shadow-xl border-0"
                >
                  <img
                    src={bentoPicks.main.backdrop || bentoPicks.main.poster}
                    alt={bentoPicks.main.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-55 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/60 to-transparent" />
                  <div className="absolute inset-0 p-space-lg flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="px-space-sm py-1 rounded-full bg-surface-base/70 backdrop-blur-md text-tertiary font-label-sm text-label-sm font-semibold flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-[15px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        {bentoPicks.main.rating} پڕبینەرترین
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-metallic-silver font-label-sm text-label-sm uppercase">
                          Dolby Atmos
                        </span>
                        <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">
                          تایبەت
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-space-xs">
                      <span className="font-headline-md text-headline-md font-bold text-white drop-shadow">
                        {bentoPicks.main.title}
                      </span>
                      <p className="font-body-md text-body-md text-metallic-muted line-clamp-2 max-w-lg">
                        {bentoPicks.main.description}
                      </p>
                      <div className="flex items-center gap-space-md pt-space-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/watch/${bentoPicks.main.id}`);
                          }}
                          className="flex items-center gap-1.5 px-space-md py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-fixed transition-all border-0 cursor-pointer"
                        >
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            play_arrow
                          </span>
                          <span>سەیرکردنی خێرا</span>
                        </button>
                        <span className="font-label-sm text-label-sm text-metallic-muted">
                          {bentoPicks.main.isDubbed ? 'دۆبلاژکراوی کوردی ستاندارد' : 'ژێرنووسی کوردی 4K'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feature Bento Card 2 */}
              {bentoPicks.second && (
                <div
                  onClick={() => navigate(`/movie/${bentoPicks.second.id}`)}
                  className="relative h-80 rounded-2xl overflow-hidden bg-gradient-to-b from-surface-container-high to-surface-card group cursor-pointer shadow-xl"
                >
                  <img
                    src={bentoPicks.second.poster}
                    alt={bentoPicks.second.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/40 to-transparent" />
                  <div className="absolute inset-0 p-space-md flex flex-col justify-between">
                    <span className="self-start px-space-xs py-0.5 rounded-full bg-surface-base/80 backdrop-blur-md text-tertiary font-label-sm text-label-sm font-bold">
                      ★ {bentoPicks.second.rating} هەڵبژێردراو
                    </span>
                    <div className="flex flex-col gap-1 mt-auto">
                      <span className="font-title-sm text-title-sm font-bold text-white truncate">
                        {bentoPicks.second.title}
                      </span>
                      <span className="font-label-sm text-label-sm text-metallic-muted truncate">
                        {bentoPicks.second.genre?.slice(0, 2).join(' • ') || 'گەشتێکی سینەمایی'}
                      </span>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/watch/${bentoPicks.second.id}`);
                          }}
                          className="w-8 h-8 rounded-full bg-surface-base/80 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all border-0 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feature Bento Card 3 */}
              {bentoPicks.animePick && (
                <div
                  onClick={() => navigate(`/movie/${bentoPicks.animePick.id}`)}
                  className="relative h-80 rounded-2xl overflow-hidden bg-gradient-to-b from-surface-container-high to-surface-card group cursor-pointer shadow-xl"
                >
                  <img
                    src={bentoPicks.animePick.poster}
                    alt={bentoPicks.animePick.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/40 to-transparent" />
                  <div className="absolute inset-0 p-space-md flex flex-col justify-between">
                    <span className="self-start px-space-xs py-0.5 rounded-full bg-secondary-container/80 backdrop-blur-md text-secondary-fixed font-label-sm text-label-sm font-bold">
                      {bentoPicks.animePick.type === 'anime' ? 'ئەنیمێی هەڵبژێردراو' : 'تایبەتی ڕوانین'}
                    </span>
                    <div className="flex flex-col gap-1 mt-auto">
                      <span className="font-title-sm text-title-sm font-bold text-white truncate">
                        {bentoPicks.animePick.title}
                      </span>
                      <span className="font-label-sm text-label-sm text-metallic-muted truncate">
                        دۆبلاژ و ژێرنووسی تایبەت
                      </span>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/watch/${bentoPicks.animePick.id}`);
                          }}
                          className="w-8 h-8 rounded-full bg-surface-base/80 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all border-0 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* =================================================================
              5. TOP 5 RANKED THIS WEEK (زۆرترین بینراوی ئەم هەفتەیە)
             ================================================================= */}
          <section className="w-full px-gutter max-w-7xl mx-auto pt-space-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-error shadow-md">
                  <span className="material-symbols-outlined text-[22px]">local_fire_department</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <h2 className="font-headline-md text-headline-md font-bold text-metallic-silver">
                      زۆرترین بینراو
                    </h2>
                    <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-error font-label-sm text-label-sm font-bold">
                      TOP 5 RANKED
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-metallic-muted">
                    ٥ پڕبینەرترین بەرهەمی ئەم هەفتەیە لەسەر پلاتفۆرمی ڕوانین
                  </span>
                </div>
              </div>
              <Link
                to="/trending"
                className="flex items-center gap-1 text-primary hover:text-primary-fixed font-label-md text-label-md transition-colors no-underline"
              >
                <span>بینینی هەمووی</span>
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </Link>
            </div>

            {/* Ranked Cards with Huge Typographic Numerals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-lg">
              {top5Movies.map((movie, idx) => (
                <div
                  key={movie.id}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  className="relative flex items-end group cursor-pointer pt-6"
                >
                  <div className="absolute -right-4 bottom-2 z-0 font-display-xl text-[110px] leading-none font-black text-surface-container-high/60 select-none group-hover:text-primary/30 transition-colors">
                    {KURDISH_DIGITS[idx] || idx + 1}
                  </div>
                  <div className="relative z-10 w-full aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-b from-surface-container-high to-surface-card shadow-xl group-hover:scale-105 transition-all p-space-sm flex flex-col justify-between">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-base/95 via-transparent to-surface-base/30" />

                    <div className="flex justify-end z-10">
                      <span className="font-label-sm text-label-sm text-tertiary font-bold bg-surface-base/80 px-1.5 py-0.5 rounded-full">
                        ★ {movie.rating}
                      </span>
                    </div>

                    <div className="flex flex-col z-10 mt-auto">
                      <span className="font-title-sm text-title-sm font-bold text-metallic-silver truncate">
                        {movie.title}
                      </span>
                      <span className="font-label-sm text-label-sm text-metallic-muted">
                        {movie.genre?.slice(0, 2).join(' • ') || 'شاکاری بینراو'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =================================================================
              6. AI-POWERED RECOMMENDED FOR YOU (پێشنیارکراو بۆ تۆ)
             ================================================================= */}
          <section id="ai-recommendations" className="w-full px-gutter max-w-7xl mx-auto pt-space-xl">
            <div className="w-full p-space-lg rounded-3xl bg-surface-card/60 backdrop-blur-2xl shadow-xl flex flex-col gap-space-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-accent-electric-blue/20 flex items-center justify-center text-accent-electric-blue shadow-md">
                    <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs">
                      <h2 className="font-headline-md text-headline-md font-bold text-metallic-silver">
                        پێشنیارکراو بۆ تۆ
                      </h2>
                      <span className="px-space-xs py-0.5 rounded bg-accent-electric-blue/20 text-accent-electric-blue font-label-sm text-label-sm font-bold">
                        ژیری دەستکرد AI
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-metallic-muted">
                      بەپێی ژوان و دەنگدانەکانت، ئەم بەرهەمانە گونجاوترینن بۆ سەیرکردنی تۆ
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-space-sm py-1 rounded-full bg-surface-container text-metallic-silver font-label-sm text-label-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span>بەردەوام نوێ دەبێتەوە</span>
                  </span>
                </div>
              </div>

              {/* Recommendation Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
                {smartRecommendations.map((movie, idx) => {
                  const matchScore = [98, 95, 92, 89][idx] || 90;
                  return (
                    <div
                      key={movie.id}
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="group relative flex flex-col gap-1.5 cursor-pointer"
                    >
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-tr from-surface-container-high to-surface-card shadow-md group-hover:scale-105 transition-all flex items-center justify-center">
                        <img
                          src={movie.backdrop || movie.poster}
                          alt={movie.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-base/70 via-transparent to-transparent" />
                        <span className="absolute top-2 right-2 px-space-xs py-0.5 rounded bg-surface-base/85 backdrop-blur-md text-tertiary font-label-sm text-label-sm font-bold">
                          {matchScore}% گونجاوە
                        </span>
                      </div>
                      <span className="font-label-md text-label-md font-semibold text-metallic-silver truncate group-hover:text-primary transition-colors">
                        {movie.title}
                      </span>
                      <span className="font-label-sm text-label-sm text-metallic-muted">
                        {movie.genre?.slice(0, 2).join(' • ') || 'پۆلێنی ژیری دەستکرد AI'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* =================================================================
              7. GLOBAL TV SERIES & AUDIO SPEC DISPLAY (زنجیرە دراما جیهانییەکان)
             ================================================================= */}
          <section className="w-full px-gutter max-w-7xl mx-auto pt-space-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-md">
                  <span className="material-symbols-outlined text-[22px]">tv_gen</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <h2 className="font-headline-md text-headline-md font-bold text-metallic-silver">
                      زنجیرە دراما جیهانییەکان
                    </h2>
                    <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-metallic-silver font-label-sm text-label-sm">
                      TV Series
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-metallic-muted">
                    وەرزی نوێ و تەواوی ئەڵقەکانی زنجیرە بەناوبانگەکان بە کوالێتی بەرز
                  </span>
                </div>
              </div>
              <Link
                className="flex items-center gap-1 text-primary hover:text-primary-fixed font-label-md text-label-md transition-colors no-underline"
                to="/series"
              >
                <span>بینینی هەمووی</span>
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </Link>
            </div>

            {/* Series Interactive Shelf */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
              {tvSeries.slice(0, 3).map((series) => (
                <div
                  key={series.id}
                  onClick={() => navigate(`/movie/${series.id}`)}
                  className="flex gap-space-md p-space-sm rounded-2xl bg-surface-card hover:bg-surface-container transition-all group cursor-pointer shadow-lg"
                >
                  <div className="relative w-28 sm:w-36 aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-b from-surface-container-high to-surface-card shrink-0">
                    <img
                      src={series.poster}
                      alt={series.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-2 right-2 px-1 rounded bg-surface-base/80 text-tertiary font-label-sm text-label-sm font-bold">
                      {series.rating}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-space-xs py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold">
                          وەرزی {series.seasons || 1}
                        </span>
                        <span className="font-label-sm text-label-sm text-metallic-muted">
                          {series.episodes || 10} ئەڵقە
                        </span>
                      </div>
                      <span className="font-title-sm text-title-sm font-bold text-metallic-silver truncate group-hover:text-primary transition-colors">
                        {series.title}
                      </span>
                      <p className="font-body-md text-body-md text-metallic-muted line-clamp-2">
                        {series.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-label-sm text-label-sm text-primary font-semibold">
                        {series.isDubbed ? 'دۆبلاژ و ژێرنووس' : 'ژێرنووسی کوردی ئامادەیە'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/watch/${series.id}`);
                        }}
                        className="w-8 h-8 rounded-full bg-surface-container-high group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center text-metallic-silver transition-all border-0 cursor-pointer"
                        title="سەیرکردن"
                      >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =================================================================
              8. VIP MEMBERSHIP PROMOTION BANNER
             ================================================================= */}
          <section className="w-full px-gutter max-w-7xl mx-auto pt-space-xl pb-space-lg">
            <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-secondary-container via-surface-card to-surface-raised p-space-lg sm:p-space-xl flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-2xl">
              <div className="flex flex-col gap-space-xs z-10 text-right">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary text-[26px]">
                    workspace_premium
                  </span>
                  <span className="font-label-md text-label-md text-tertiary font-bold tracking-wider uppercase">
                    ئابوونەی RWANIN VIP پریمیۆم
                  </span>
                </div>
                <h3 className="font-headline-lg text-headline-lg font-extrabold text-metallic-silver">
                  بەبێ ڕیکلام و بە ڕوونی 4K لەگەڵ تەواوی خێزانەکەت
                </h3>
                <p className="font-body-md text-body-md text-metallic-muted max-w-xl">
                  دەستڕاگەیشتن بە تەواوی ئەرشیفی فیلم، زنجیرە جیهانییەکان و دۆبلاژە کوردییە نایابەکان بە دەنگی Dolby Atmos و لەسەر ٥ ئامێری جیاواز لە یەک کاتدا.
                </p>
              </div>
              <div className="flex items-center gap-space-md shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => navigate('/payment')}
                  className="px-space-lg py-space-sm rounded-full bg-tertiary text-on-tertiary font-headline-md text-title-sm font-bold shadow-xl shadow-tertiary/20 hover:scale-105 transition-all border-0 cursor-pointer"
                >
                  بەشداریکردن لە VIP
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/vip')}
                  className="px-space-md py-space-sm rounded-full bg-surface-container-high/80 text-metallic-silver font-label-md text-label-md hover:bg-surface-variant transition-all border-0 cursor-pointer"
                >
                  وردەکاری پلانەکان
                </button>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            </div>
          </section>
        </div>
      </main>

      {/* =====================================================================
          FOOTER
         ===================================================================== */}
      <footer className="w-full bg-surface-raised mt-space-xl pt-space-xl pb-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="w-full px-gutter max-w-7xl mx-auto flex flex-col gap-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-lg">
            {/* Brand Column */}
            <div className="lg:col-span-2 flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_0_18px_rgba(192,193,255,0.3)]">
                  <span className="material-symbols-outlined text-surface-base font-bold text-[20px]">
                    play_arrow
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-headline-md tracking-wider text-metallic-silver font-bold">
                    RWANIN
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    شانۆی دەنگی و سینەمایی کوردی
                  </span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-metallic-muted max-w-md">
                گەورەترین و پێشکەوتووترین سەکۆی ستریمینگی کوردی بۆ سەیرکردنی تابلۆی سینەمایی جیهانی و خۆماڵی بە بەرزترین کوالێتی 4K HDR و دەنگی دۆڵبی ئەتمۆس.
              </p>
              <div className="flex items-center gap-space-sm pt-space-xs">
                <Link
                  to="/movies"
                  className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all no-underline"
                >
                  <span className="material-symbols-outlined text-[18px]">smart_display</span>
                </Link>
                <Link
                  to="/series"
                  className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all no-underline"
                >
                  <span className="material-symbols-outlined text-[18px]">podcasts</span>
                </Link>
                <Link
                  to="/explore"
                  className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all no-underline"
                >
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                </Link>
                <Link
                  to="/vip"
                  className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all no-underline"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                </Link>
              </div>
            </div>

            {/* Categories Column */}
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md text-metallic-silver uppercase font-semibold tracking-wider">
                پۆلە سەرەکییەکان
              </span>
              <Link className="font-body-md text-body-md text-metallic-muted hover:text-on-surface transition-colors no-underline" to="/trending">
                فیلمە پڕبینەرەکان
              </Link>
              <Link className="font-body-md text-body-md text-metallic-muted hover:text-on-surface transition-colors no-underline" to="/series">
                زنجیرە نوێیەکان
              </Link>
              <Link className="font-body-md text-body-md text-metallic-muted hover:text-on-surface transition-colors no-underline" to="/dubbed">
                دۆبلاژی کوردی سەربەخۆ
              </Link>
              <Link className="font-body-md text-body-md text-metallic-muted hover:text-on-surface transition-colors no-underline" to="/anime">
                ئەنیمێی وەرگێڕدراو
              </Link>
              <Link className="font-body-md text-body-md text-metallic-muted hover:text-on-surface transition-colors no-underline" to="/explore">
                بەڵگەنامەیی و مێژوو
              </Link>
            </div>

            {/* Features Column */}
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md text-metallic-silver uppercase font-semibold tracking-wider">
                تایبەتمەندییەکان
              </span>
              <Link className="font-body-md text-body-md text-metallic-muted hover:text-on-surface transition-colors no-underline" to="/vip">
                ئابوونەی VIP پریمیۆم
              </Link>
              <Link className="font-body-md text-body-md text-metallic-muted hover:text-on-surface transition-colors no-underline" to="/movies">
                کوالیتی 4K Ultra HD
              </Link>
              <Link className="font-body-md text-body-md text-metallic-muted hover:text-on-surface transition-colors no-underline" to="/watchlist">
                لیستی دڵخوازەکان
              </Link>
              <Link className="font-body-md text-body-md text-metallic-muted hover:text-on-surface transition-colors no-underline" to="/account">
                هەژمار و پرۆفایل
              </Link>
              <Link className="font-body-md text-body-md text-metallic-muted hover:text-on-surface transition-colors no-underline" to="/staff">
                ستافی ڕوانین
              </Link>
            </div>

            {/* Apps Column */}
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md text-metallic-silver uppercase font-semibold tracking-wider">
                ئەپڵیکەیشنەکان
              </span>
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-sm p-space-sm rounded bg-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
                  <span className="material-symbols-outlined text-metallic-silver text-[24px]">tv</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-metallic-muted">ڕوانین بۆ</span>
                    <span className="font-label-md text-label-md text-metallic-silver font-semibold">
                      Android TV &amp; Apple TV
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm p-space-sm rounded bg-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
                  <span className="material-symbols-outlined text-metallic-silver text-[24px]">
                    phone_iphone
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-metallic-muted">دابەزێنە لەسەر</span>
                    <span className="font-label-md text-label-md text-metallic-silver font-semibold">
                      iOS &amp; Android Store
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-lg text-metallic-muted font-label-md text-label-md">
            <div className="flex items-center gap-space-sm">
              <span>© ٢٠٢٥ ڕوانین ستریم (RWANIN Cinema). سەرجەم مافەکان پارێزراون.</span>
            </div>
            <div className="flex items-center gap-space-md">
              <Link className="hover:text-on-surface transition-colors no-underline text-inherit" to="/">
                یاسای پاراستنی نهێنی
              </Link>
              <Link className="hover:text-on-surface transition-colors no-underline text-inherit" to="/">
                مەرجەکانی بەکارهێنان
              </Link>
              <Link className="hover:text-on-surface transition-colors no-underline text-inherit" to="/vip">
                پەیوەندی
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
