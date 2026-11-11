import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  Crown,
  Star,
  Calendar,
  Clock,
  Globe,
  Tv,
  Bookmark,
  Check,
  Share2,
  AlertTriangle,
  Play,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { movieService } from '../services/movieService';
import { recommendationService } from '../services/recommendationService';
import { reportService, REPORT_REASONS_KU } from '../services/reportService';
import { Movie, ReportReason } from '../types/movie';
import { useAuth } from '../hooks/useAuth';
import { useWatchlist } from '../hooks/useWatchlist';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { MovieCard } from '../components/movie/MovieCard';
import { CastCard } from '../components/movie/CastCard';
import { RwaninVideoPlayer } from '../components/video/RwaninVideoPlayer';
import { tmdbService } from '../services/tmdbService';

export const Watch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isVIP, isAdmin, isOwner, user } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { showToast } = useToast();

  // Dynamic Movie State from Service + Subscription
  const [movie, setMovie] = useState<Movie | undefined>(() => (id ? movieService.getMovieById(id) : undefined));

  useEffect(() => {
    if (!id) return;
    const initial = movieService.getMovieById(id);
    if (initial) setMovie(initial);

    const unsub = movieService.subscribeToMovies((movies) => {
      const found = movies.find((m) => m.id === id || m.id.toLowerCase() === id.toLowerCase());
      if (found) setMovie(found);
    });
    return () => unsub();
  }, [id]);

  // Dynamically resolve real character photos from TMDB/IMDb if not already stored
  useEffect(() => {
    if (!movie) return;
    if ((!movie.castMembers || movie.castMembers.length === 0) && (movie.originalTitle || movie.title)) {
      const searchTitle = movie.originalTitle || movie.title;
      tmdbService.fetchCreditsByTitle(searchTitle, movie.type === 'tv' ? 'tv' : 'movie').then((credits) => {
        if (credits && credits.length > 0) {
          setMovie((prev) => (prev ? { ...prev, castMembers: credits } : prev));
        }
      });
    }
  }, [movie?.id]);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlEpParam = searchParams.get('ep');
  const initialEp = urlEpParam ? parseInt(urlEpParam, 10) : 1;
  const [selectedEpisode, setSelectedEpisode] = useState<number>(() => {
    return !isNaN(initialEp) && initialEp > 0 ? initialEp : 1;
  });

  // Sync selectedEpisode if URL ?ep= changes
  useEffect(() => {
    const epFromUrl = searchParams.get('ep');
    if (epFromUrl) {
      const parsed = parseInt(epFromUrl, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed !== selectedEpisode) {
        setSelectedEpisode(parsed);
      }
    }
  }, [searchParams, selectedEpisode]);

  const [showVIPModal, setShowVIPModal] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<ReportReason>('video_broken');
  const [reportDetails, setReportDetails] = useState<string>('');

  // Daily Free Timer Logic (50 minutes daily)
  const todayKey = `rwanin_daily_seconds_${new Date().toISOString().slice(0, 10)}`;
  const [watchedSecondsToday, setWatchedSecondsToday] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(todayKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const dailyMinutesRemaining = Math.max(0, Math.floor((50 * 60 - watchedSecondsToday) / 60));

  // Smart Related Movies
  const relatedMovies = useMemo(() => {
    if (!movie) return [];
    return recommendationService.getSimilarMovies(movie, 6);
  }, [movie]);

  const inWatchlist = movie ? isInWatchlist(movie.id) : false;

  const handleShare = async () => {
    if (!movie) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `سەیری فیلمی ${movie.title} بکە لە ڕوانین`,
          url: shareUrl
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(shareUrl);
    showToast('بەستەری فیلمەکە کۆپیکرا بۆ کلیپبۆرد', 'success');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movie) return;
    try {
      await reportService.submitReport({
        movieId: movie.id,
        movieTitle: movie.title,
        moviePoster: movie.poster,
        userId: user?.id || user?.uid,
        userEmail: user?.email,
        reason: reportReason,
        details: reportDetails
      });
      setReportModalOpen(false);
      setReportDetails('');
      showToast('ڕاپۆرتەکەت بە سەرکەوتوویی نێردرا، سوپاس بۆ هاوکاریت!', 'success');
    } catch {
      showToast('هەڵەیەک لە ناردنی ڕاپۆرت ڕوویدا', 'error');
    }
  };

  if (!movie) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          color: '#fff'
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>
          فیلمەکە نەدۆزرایەوە
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          ببورە، ئەم فیلمە یاخود زنجیرەیە لە بنکەدراوەی ڕوانین بەردەست نییە.
        </p>
        <Button variant="silver" onClick={() => navigate('/')}>
          گەڕانەوە بۆ پەڕەی سەرەکی
        </Button>
      </div>
    );
  }

  const isSeries = Boolean(
    movie.type === 'tv' ||
    movie.type === 'anime' ||
    (movie.seasons && movie.seasons > 0) ||
    (movie.episodes && movie.episodes > 1) ||
    (movie.episodeList && movie.episodeList.length > 1)
  );

  const totalEpisodesCount = Math.max(movie.episodes || 1, movie.episodeList?.length || 1);
  const totalSeasons = Math.max(movie.seasons || 1, 1);
  const epsPerSeason = Math.max(1, Math.ceil(totalEpisodesCount / totalSeasons));

  const [activeSeason, setActiveSeason] = useState<number>(() => {
    return Math.min(totalSeasons, Math.max(1, Math.ceil(selectedEpisode / epsPerSeason)));
  });

  useEffect(() => {
    const computedSeason = Math.min(totalSeasons, Math.max(1, Math.ceil(selectedEpisode / epsPerSeason)));
    setActiveSeason(computedSeason);
  }, [selectedEpisode, totalSeasons, epsPerSeason]);

  const handleEpisodeSelect = (epNum: number) => {
    if (epNum < 1 || epNum > totalEpisodesCount) return;
    setSelectedEpisode(epNum);
    setSearchParams({ ep: epNum.toString() });
    showToast(`دەستپێکردنی ئەڵقەی ${epNum}`, 'info');

    // On mobile, scroll smoothly to player so user immediately sees video playing
    const playerWrapper = document.querySelector('.rwanin-watch-player-wrapper');
    if (playerWrapper) {
      playerWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        direction: 'rtl',
        overflowX: 'hidden'
      }}
    >
      {/* 1. TOP CINEMATIC HEADER BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px var(--page-padding-x)',
          backgroundColor: 'rgba(10, 11, 15, 0.85)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(`/movie/${movie.id}`)}
            aria-label="Back to movie details"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)'
            }}
          >
            <ChevronRight size={22} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {movie.title}
              </h1>
              {movie.type === 'tv' && (
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  ئەڵقەی {selectedEpisode}
                </span>
              )}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {movie.year} • {Array.isArray(movie.genre) ? movie.genre.join('، ') : 'فیلم'}
            </div>
          </div>
        </div>

        {/* Free User Watch Limit Badge */}
        {!isVIP && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              color: '#E2B755',
              backgroundColor: 'rgba(226, 183, 85, 0.1)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(226, 183, 85, 0.3)'
            }}
          >
            <Clock size={13} />
            <span>کاتی ماوە: {dailyMinutesRemaining} خولەک</span>
          </div>
        )}
      </div>

      {/* 2. CINEMATIC VIDEO PLAYER AREA (Centered, 16:9, max-width 1600px, 100% edge-to-edge on mobile) */}
      <div className="rwanin-watch-player-wrapper">
        <RwaninVideoPlayer
          key={`${movie.id}-ep-${selectedEpisode}`}
          movie={movie}
          selectedEpisode={selectedEpisode}
          onEpisodeChange={handleEpisodeSelect}
          onBack={() => navigate(-1)}
          isVIPUser={isVIP}
          isAdminUser={isAdmin || isOwner}
          onOpenVIPModal={() => setShowVIPModal(true)}
          dailyMinutesRemaining={dailyMinutesRemaining}
          autoPlay={true}
        />
      </div>

      {/* 3. MOVIE DETAILS & ACTIONS (Below Player per UX requirement 35) */}
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 var(--page-padding-x) 60px'
        }}
      >
        {/* Title, Badges, and Action Buttons Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '20px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {movie.isVIP ? (
                <span className="badge-vip" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Crown size={13} /> پەخشی تایبەتی VIP
                </span>
              ) : (
                <span className="badge-hd" style={{ color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                  بێبەرامبەر (FREE)
                </span>
              )}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FACC15',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(250, 204, 21, 0.3)'
                }}
              >
                <Star size={12} fill="#FACC15" strokeWidth={0} />
                IMDb {movie.rating.toFixed(1)}
              </span>
              <span className="badge-hd">4K ULTRA HD</span>
              {movie.badge && <span className="badge-hd">{movie.badge}</span>}
            </div>

            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 900, margin: '0 0 6px 0' }}>
              {movie.title}
            </h2>

            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <div style={{ fontSize: '14px', color: 'var(--text-silver)', direction: 'ltr', textAlign: 'right', marginBottom: '8px' }}>
                {movie.originalTitle}
              </div>
            )}

            {/* Quick Specs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                fontSize: '13px',
                color: 'var(--text-silver)',
                flexWrap: 'wrap',
                marginTop: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} color="var(--text-muted)" />
                <span>{movie.year}</span>
              </div>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={14} color="var(--text-muted)" />
                <span>{movie.duration}</span>
              </div>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Globe size={14} color="var(--text-muted)" />
                <span>{movie.country}</span>
              </div>
              <span>•</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                {Array.isArray(movie.genre) ? movie.genre.join('، ') : 'کوردی'}
              </span>
            </div>
          </div>

          {/* Action Buttons: Watchlist, Share, Report */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="md"
              icon={inWatchlist ? <Check size={16} /> : <Bookmark size={16} />}
              onClick={() => {
                toggleWatchlist(movie.id);
                showToast(
                  inWatchlist ? 'لە لیستی سەیرکردن لابرا' : 'زیادکرا بۆ لیستی سەیرکردن',
                  inWatchlist ? 'info' : 'success'
                );
              }}
            >
              {inWatchlist ? 'لە لیستدایە' : 'پاشەکەوت'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              icon={<Share2 size={16} />}
              onClick={handleShare}
            >
              هاوبەشکردن
            </Button>

            <Button
              variant="secondary"
              size="md"
              icon={<AlertTriangle size={16} color="#f59e0b" />}
              onClick={() => setReportModalOpen(true)}
            >
              کێشە هەیە؟
            </Button>
          </div>
        </div>

        {/* 4. TV SERIES / ANIME EPISODES GRID (With Seasons & Fast Switching) */}
        {isSeries && (
          <section
            style={{
              marginBottom: '36px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tv size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                  سەرجەم ئەڵقەکان ({totalEpisodesCount} ئەڵقە)
                </h3>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontWeight: 600
                }}
              >
                ئێستا پەخشدەکرێت: ئەڵقەی {selectedEpisode}
              </span>
            </div>

            {/* Season Selector Tabs */}
            {totalSeasons > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {Array.from({ length: totalSeasons }).map((_, sIdx) => {
                  const sNum = sIdx + 1;
                  const isCurrentSeason = sNum === activeSeason;
                  return (
                    <button
                      key={sNum}
                      type="button"
                      onClick={() => setActiveSeason(sNum)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-full)',
                        border: isCurrentSeason ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                        backgroundColor: isCurrentSeason ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                        color: isCurrentSeason ? '#38bdf8' : 'var(--text-silver)',
                        fontSize: '13px',
                        fontWeight: isCurrentSeason ? 800 : 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        touchAction: 'manipulation'
                      }}
                    >
                      وەرز {sNum}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Episode Grid for Active Season */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 130px), 1fr))',
                gap: '10px'
              }}
            >
              {(() => {
                const sStart = (activeSeason - 1) * epsPerSeason + 1;
                const sEnd = Math.min(totalEpisodesCount, activeSeason * epsPerSeason);
                const epNumbers = Array.from({ length: Math.max(1, sEnd - sStart + 1) }).map((_, i) => sStart + i);

                return epNumbers.map((epNum) => {
                  const isSelected = epNum === selectedEpisode;
                  const epData = movie.episodeList?.find((e) => e.episodeNumber === epNum);

                  return (
                    <button
                      key={epNum}
                      type="button"
                      onClick={() => handleEpisodeSelect(epNum)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 8px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1.5px solid #38bdf8' : '1px solid var(--border-subtle)',
                        boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.25)' : 'none',
                        color: isSelected ? '#38bdf8' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        minHeight: '56px',
                        touchAction: 'manipulation'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Play size={14} fill={isSelected ? '#38bdf8' : 'none'} color={isSelected ? '#38bdf8' : '#fff'} />
                        <span style={{ fontSize: '13.5px', fontWeight: isSelected ? 800 : 600 }}>
                          ئەڵقەی {epNum}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '10.5px',
                          color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                          marginTop: '3px',
                          fontWeight: isSelected ? 700 : 400
                        }}
                      >
                        {isSelected ? 'لە پەخشدایە ▶' : (epData?.title || 'پەخشکردن')}
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          </section>
        )}

        {/* 5. MOVIE DESCRIPTION */}
        <section style={{ marginBottom: '36px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px' }}>
            کورتەی چیرۆک
          </h3>
          <p
            style={{
              fontSize: '14.5px',
              color: 'var(--text-silver)',
              lineHeight: 1.8,
              maxWidth: '900px',
              margin: 0
            }}
          >
            {movie.description || 'هیچ کورتەیەک بۆ ئەم بەرهەمە تۆمار نەکراوە.'}
          </p>
        </section>

        {/* 6. CAST MEMBERS */}
        {((movie.castMembers && movie.castMembers.length > 0) || (movie.cast && movie.cast.length > 0)) && (
          <section style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
              ئەکتەرەکان و ڕۆڵەکان
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))',
                gap: '12px'
              }}
            >
              {movie.castMembers && movie.castMembers.length > 0
                ? movie.castMembers.map((actor) => (
                    <CastCard
                      key={actor.name}
                      name={actor.name}
                      role={actor.role}
                      avatar={actor.avatar}
                    />
                  ))
                : (movie.cast || []).map((actorName) => (
                    <CastCard key={actorName} name={actorName} role="ئەکتەری سەرەکی" />
                  ))}
            </div>
          </section>
        )}

        {/* 7. RELATED MOVIES (.movie-grid with strict 2-column mobile layout) */}
        {relatedMovies.length > 0 && (
          <section style={{ marginTop: '36px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
              فیلمە پێشنیارکراوە پەیوەندیدارەکان
            </h3>
            <div className="movie-grid">
              {relatedMovies.map((rel) => (
                <MovieCard key={rel.id} movie={rel} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* VIP Access Modal */}
      <Modal
        isOpen={showVIPModal}
        onClose={() => setShowVIPModal(false)}
        title="👑 ئەندامێتی VIP پێویستە"
        maxWidth="520px"
      >
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(226, 183, 85, 0.15)',
              border: '2px solid #E2B755',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#E2B755'
            }}
          >
            <Crown size={32} />
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
            پەخشی تایبەت بە ئەندامانی VIP
          </h3>
          <p style={{ color: 'var(--text-silver)', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '24px' }}>
            فیلمی «{movie.title}» تایبەتە بە ئەندامانی ڕوانین VIP. بە تەنها 5,000 دیناری مانگانە دەتوانیت سەیری هەموو فیلم و زنجیرەکان بکەیت بە کوالێتی 4K Ultra HD بەبێ سنوور.
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="vip"
              size="lg"
              style={{ flex: 1 }}
              onClick={() => {
                setShowVIPModal(false);
                navigate('/vip');
              }}
            >
              ببە بە ئەندامی VIP
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setShowVIPModal(false)}>
              دواتر
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Issue Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="🚨 ڕاپۆرتکردنی کێشەی فیلم"
        maxWidth="500px"
      >
        <form onSubmit={handleSubmitReport} style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              هۆکاری کێشەکە دیاری بکە:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {REPORT_REASONS_KU.map((r) => (
                <label
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: reportReason === r.id ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.03)',
                    border: reportReason === r.id ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={reportReason === r.id}
                    onChange={() => setReportReason(r.id)}
                    style={{ accentColor: '#38bdf8' }}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              ڕوونکردنەوەی زیاتر (ئارەزوومەندانە):
            </label>
            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="نموونە: لە خولەکی 12 ڤیدیۆ دەوەستێت یاخود ژێرنووس ناکۆکە..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="submit" variant="silver" style={{ flex: 1 }}>
              ناردنی ڕاپۆرت
            </Button>
            <Button variant="secondary" onClick={() => setReportModalOpen(false)}>
              پاشگەزبوونەوە
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
