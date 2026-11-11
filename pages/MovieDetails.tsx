import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Plus,
  Check,
  Heart,
  Star,
  Film,
  Calendar,
  Clock,
  Globe,
  Share2,
  ChevronRight,
  Crown,
  AlertTriangle,
  FolderPlus,
  Sparkles,
  Tv
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { movieService } from '../services/movieService';
import { tmdbService } from '../services/tmdbService';
import { recommendationService } from '../services/recommendationService';
import { reportService } from '../services/reportService';
import { collectionService } from '../services/collectionService';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../hooks/useAuth';
import { useVideoAccess } from '../hooks/useVideoAccess';
import { useToast } from '../components/ui/Toast';
import { CastCard } from '../components/movie/CastCard';
import { ReviewCard } from '../components/movie/ReviewCard';
import { MovieCard } from '../components/movie/MovieCard';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Review, ReportReason } from '../types/movie';

export const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist, isFavorite, toggleFavorite } = useWatchlist();
  const { isVIP, user } = useAuth();
  const { showToast } = useToast();

  const [trailerOpen, setTrailerOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(9);

  // Report Form State
  const [reportReason, setReportReason] = useState<ReportReason>("Video doesn't work");
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Custom Collections State
  const userId = user?.uid || user?.id || 'guest';
  const [collections, setCollections] = useState(() => collectionService.getUserCollections(userId));
  const [newCollectionName, setNewCollectionName] = useState('');
  const [movie, setMovie] = useState<any>(() => (id ? movieService.getMovieById(id) : undefined));
  const videoAccess = useVideoAccess(movie);

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
          setMovie((prev: any) => (prev ? { ...prev, castMembers: credits } : prev));
        }
      });
    }
  }, [movie?.id]);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [detailsSeason, setDetailsSeason] = useState<number>(1);

  // Smart Similar Movies (Genre + Cast + Language + Rating)
  const relatedMovies = useMemo(() => {
    if (!movie) return [];
    return recommendationService.getSimilarMovies(movie, 6);
  }, [movie]);

  if (!movie) {
    return (
      <PageContainer>
        <div style={{ padding: '80px 36px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>فیلمەکە نەدۆزرایەوە</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            ببورە، ئەم فیلمە لە کەتەلۆگی ڕوانین بەردەست نییە یاخود سڕاوەتەوە.
          </p>
          <Button variant="silver" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>
            گەڕانەوە بۆ پەڕەی سەرەکی
          </Button>
        </div>
      </PageContainer>
    );
  }

  const inWatchlist = isInWatchlist(movie.id);
  const inFavorite = isFavorite(movie.id);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    if (!user) {
      showToast('تکایە سەرەتا بچۆ ژوورەوە بۆ دانانی هەڵسەنگاندن', 'error');
      navigate('/login');
      return;
    }

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      movieId: movie.id,
      userId: user.id || user.uid || 'usr_guest',
      userName: user.name || 'بەکارهێنەر',
      userAvatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      rating: newRating,
      comment: newReviewText.trim(),
      date: 'ئێستا',
      likes: 0,
      isVIP: !!isVIP
    };

    setReviews([newRev, ...reviews]);
    setNewReviewText('');
    showToast('هەڵسەنگاندنەکەت بە سەرکەوتوویی تۆمارکرا!', 'success');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('بەستەری فیلمەکە کۆپی کرا بۆ کلیپبۆرد!', 'info');
    }
  };

  return (
    <PageContainer>
      {/* Top Backdrop Header */}
      <div
        className="movie-details-banner"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '440px',
          height: '52vh',
          overflow: 'hidden'
        }}
      >
        <img
          src={movie.backdrop || movie.poster}
          alt={movie.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              linear-gradient(180deg, rgba(8, 9, 12, 0.4) 0%, rgba(8, 9, 12, 0.8) 60%, var(--bg-main) 100%),
              linear-gradient(270deg, rgba(8, 9, 12, 0.85) 0%, transparent 60%)
            `
          }}
        />

        {/* Back navigation button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '24px',
            right: 'var(--page-padding-x)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(8, 9, 12, 0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-silver)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <ChevronRight size={16} />
          <span>گەڕانەوە</span>
        </button>
      </div>

      {/* Main Info Section (Poster + Details) */}
      <div
        className="movie-details-content"
        style={{
          padding: '0 var(--page-padding-x) 60px',
          marginTop: '-100px',
          position: 'relative',
          zIndex: 10,
          maxWidth: 'var(--content-max-width)',
          marginInline: 'auto'
        }}
      >
        <div
          className="movie-details-grid"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 'clamp(18px, 3vw, 36px)',
            alignItems: 'flex-start',
            flexWrap: 'wrap'
          }}
        >
          {/* Poster Card */}
          <div
            className="movie-details-poster-card"
            style={{
              width: 'clamp(170px, 24vw, 240px)',
              flexShrink: 0,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              aspectRatio: '2 / 3'
            }}
          >
            <img
              src={movie.poster}
              alt={movie.title}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Details Column */}
          <div className="movie-details-info-col" style={{ flex: 1, minWidth: 0 }}>
            <div className="movie-details-badges" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
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

            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 900,
                lineHeight: 1.15,
                marginBottom: '6px'
              }}
            >
              {movie.title}
            </h1>

            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <div style={{ fontSize: '15px', color: 'var(--text-silver)', marginBottom: '16px', direction: 'ltr', textAlign: 'right' }}>
                {movie.originalTitle}
              </div>
            )}

            {/* Quick Specs */}
            <div
              className="movie-details-specs"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '13.5px',
                color: 'var(--text-silver)',
                marginBottom: '24px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={15} color="var(--text-muted)" />
                <span>{movie.year}</span>
              </div>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {movie.type === 'tv' || (movie.seasons && movie.seasons > 0) ? (
                  <>
                    <Tv size={15} color="#38bdf8" />
                    <span>{movie.seasons ? `${movie.seasons} وەرز` : 'زنجیرە'} {movie.episodes ? `(${movie.episodes} ئەڵقە)` : ''}</span>
                  </>
                ) : (
                  <>
                    <Clock size={15} color="var(--text-muted)" />
                    <span>{movie.duration}</span>
                  </>
                )}
              </div>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Globe size={15} color="var(--text-muted)" />
                <span>{movie.country}</span>
              </div>
              <span>•</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                {Array.isArray(movie.genre) ? movie.genre.join('، ') : 'کوردی'}
              </span>
            </div>

            {/* Main Action Buttons: requirement 19 */}
            <div
              className="movie-details-buttons"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '28px',
                flexWrap: 'wrap'
              }}
            >
              <Button
                className="movie-details-primary-action"
                variant={videoAccess.isVipRequired || videoAccess.isExpiredVip ? 'vip' : 'silver'}
                size="lg"
                icon={<Play size={20} fill="#08090C" strokeWidth={0} />}
                onClick={() => navigate(`/watch/${movie.id}`)}
              >
                {videoAccess.buttonLabel}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                icon={inWatchlist ? <Check size={18} /> : <Plus size={18} />}
                onClick={() => {
                  toggleWatchlist(movie.id);
                  showToast(
                    inWatchlist ? 'لە لیستی سەیرکردن لابرا' : 'زیادکرا بۆ لیستی سەیرکردن',
                    inWatchlist ? 'info' : 'success'
                  );
                }}
              >
                {inWatchlist ? 'لە ناو لیستدایە' : 'زیادی بکە بۆ لیستی سەیرکردن'}
              </Button>

              <button
                onClick={() => {
                  toggleFavorite(movie.id);
                  showToast(
                    inFavorite ? 'لە دڵخوازەکان لابرا' : 'وەک دڵخواز دیاریکرا',
                    inFavorite ? 'info' : 'success'
                  );
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 16px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-subtle)',
                  color: inFavorite ? '#ef4444' : 'var(--text-silver)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="دڵخواز"
              >
                <Heart size={18} fill={inFavorite ? '#ef4444' : 'none'} />
                <span>دڵخواز</span>
              </button>

              {movie.trailer && (
                <Button
                  variant="glass"
                  size="lg"
                  icon={<Film size={18} />}
                  onClick={() => setTrailerOpen(true)}
                >
                  ترەیلەر
                </Button>
              )}

              <button
                onClick={() => {
                  setCollections(collectionService.getUserCollections(userId));
                  setCollectionModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 16px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-silver)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="زیادکردن بۆ کۆکراوەی تایبەت"
              >
                <FolderPlus size={18} color="#38bdf8" />
                <span>کۆکراوەکان</span>
              </button>

              <button
                onClick={() => setReportModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 16px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="ڕاپۆرتکردنی کێشە لەم فیلمە"
              >
                <AlertTriangle size={17} />
                <span>ڕاپۆرت</span>
              </button>

              <button
                onClick={handleShare}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-silver)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="بەشکردن"
              >
                <Share2 size={19} />
              </button>
            </div>

            {/* Synopsis */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                کورتە و چیڕۆکی فیلم
              </h3>
              <p
                style={{
                  fontSize: '14.5px',
                  lineHeight: 1.8,
                  color: 'var(--text-secondary)',
                  maxWidth: '850px'
                }}
              >
                {movie.description}
              </p>
            </div>

            {/* Director & Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                padding: '16px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                maxWidth: '850px'
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  دەرهێنەر
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {movie.director}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  زمانە بەردەستەکان و دۆبلاژ
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {movie.language.join('، ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TV Series / Anime Episodes & Seasons Section */}
        {/* TV Series / Anime Episodes & Seasons Section */}
        {(movie.type === 'tv' || movie.type === 'anime' || (movie.seasons && movie.seasons > 0)) && (
          <section
            style={{
              marginTop: '40px',
              padding: '24px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {(() => {
              const totalSeasons = Math.max(movie.seasons || 1, 1);
              const totalEps = Math.max(movie.episodes || 1, movie.episodeList?.length || 1);
              const epsPerSeason = Math.max(1, Math.ceil(totalEps / totalSeasons));

              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '18px',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Tv size={22} color="#38bdf8" />
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                          وەرز و ئەڵقەکانی زنجیرەکە
                        </h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {totalSeasons} وەرز • {totalEps} ئەڵقەی بەردەست بە ژێرنووسی کوردی
                        </p>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid rgba(56, 189, 248, 0.25)'
                      }}
                    >
                      📺 زنجیرەی تەواو
                    </span>
                  </div>

                  {/* Season switcher tabs if multiple seasons */}
                  {totalSeasons > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        paddingBottom: '12px',
                        marginBottom: '18px',
                        WebkitOverflowScrolling: 'touch'
                      }}
                    >
                      {Array.from({ length: totalSeasons }).map((_, sIdx) => {
                        const sNum = sIdx + 1;
                        const isCurrentSeason = sNum === detailsSeason;
                        return (
                          <button
                            key={sNum}
                            type="button"
                            onClick={() => setDetailsSeason(sNum)}
                            style={{
                              padding: '8px 18px',
                              borderRadius: 'var(--radius-full)',
                              border: isCurrentSeason ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                              backgroundColor: isCurrentSeason ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
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

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 130px), 1fr))',
                      gap: '10px'
                    }}
                  >
                    {(() => {
                      const sStart = (detailsSeason - 1) * epsPerSeason + 1;
                      const sEnd = Math.min(totalEps, detailsSeason * epsPerSeason);
                      const epList = Array.from({ length: Math.max(1, sEnd - sStart + 1) }).map((_, i) => sStart + i);

                      return epList.map((epNum) => {
                        return (
                          <button
                            key={epNum}
                            type="button"
                            onClick={() => navigate(`/watch/${movie.id}?ep=${epNum}`)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '14px 10px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid var(--border-subtle)',
                              color: '#fff',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)',
                              minHeight: '56px',
                              touchAction: 'manipulation'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#38bdf8';
                              e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Play size={13} fill="#38bdf8" color="#38bdf8" />
                              <span style={{ fontSize: '13.5px', fontWeight: 700 }}>
                                ئەڵقەی {epNum}
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              پەخشکردن
                            </span>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </>
              );
            })()}
          </section>
        )}

        {/* Cast & Crew Section */}
        <section style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '18px' }}>
            ئەکتەرەکان و ڕۆڵەکان
          </h2>
          <div
            className="cast-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))',
              gap: '12px'
            }}
          >
            {movie.castMembers && movie.castMembers.length > 0
              ? movie.castMembers.map((actor: any) => (
                  <CastCard
                    key={actor.name}
                    name={actor.name}
                    role={actor.role}
                    avatar={actor.avatar}
                  />
                ))
              : (movie.cast || []).map((actorName: any) => (
                  <CastCard key={actorName} name={actorName} role="ئەکتەری سەرەکی" />
                ))}
          </div>
        </section>

        {/* User Reviews Section */}
        <section style={{ marginTop: '54px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}
          >
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>هەڵسەنگاندن و سەرنجی بینەران</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                بۆچوون و تێڕوانینی بەکارهێنەرانی پلاتفۆرمی ڕوانین
              </p>
            </div>
          </div>

          {/* Add Review Form */}
          <form
            onSubmit={handleAddReview}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '28px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>نمرەی تۆ بۆ ئەم فیلمە:</span>
              <select
                value={newRating}
                onChange={(e) => setNewRating(Number(e.target.value))}
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FACC15',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r} style={{ background: '#15161C', color: '#fff' }}>
                    ⭐ {r}/10
                  </option>
                ))}
              </select>
            </div>

            <textarea
              rows={3}
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              placeholder="ڕا و بۆچوونی خۆت بنووسە بۆ بینەرانی ڕوانین..."
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                resize: 'vertical',
                marginBottom: '14px',
                lineHeight: 1.6
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button type="submit" variant="silver" size="sm">
                ناردنی هەڵسەنگاندن
              </Button>
            </div>
          </form>

          {/* Reviews List */}
          <div>
            {reviews.map((rev) => (
              <ReviewCard key={rev.id} review={rev} />
            ))}
          </div>
        </section>

        {/* Related Movies */}
        {relatedMovies.length > 0 && (
          <section style={{ marginTop: '54px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
              فیلمە پەیوەندیدارەکان و پێشنیارەکان
            </h2>
            <div className="movie-grid">
              {relatedMovies.map((rel) => (
                <MovieCard key={rel.id} movie={rel} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Trailer Modal */}
      <Modal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        title={`${movie.title} — ترەیلەری فەرمی`}
        maxWidth="850px"
      >
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
          {movie.trailer ? (
            <iframe
              src={`${movie.trailer}?autoplay=1`}
              title="ترەیلەر"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              ترەیلەر لەم کاتەدا بەردەست نییە
            </div>
          )}
        </div>
      </Modal>

      {/* Report Issue Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="🚨 ڕاپۆرتکردنی کێشەی فیلم بۆ بەڕێوەبەران"
        maxWidth="520px"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setReportSubmitting(true);
            try {
              await reportService.submitReport({
                movieId: movie.id,
                movieTitle: movie.title,
                userId: user?.uid || user?.id || 'guest',
                userName: user?.name || 'بەکارهێنەر',
                reason: reportReason,
                details: reportDetails.trim()
              });
              showToast('سوپاس، ڕاپۆرتەکەت گەیشتە بەڕێوەبەرانی ڕوانین بۆ پێداچوونەوە', 'success');
              setReportDetails('');
              setReportModalOpen(false);
            } catch {
              showToast('کێشەیەک ڕوویدا لە ناردنی ڕاپۆرت', 'error');
            } finally {
              setReportSubmitting(false);
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-silver)' }}>
              جۆری کێشەکە دیاری بکە:
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as ReportReason)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '13.5px'
              }}
            >
              <option value="Video doesn't work" style={{ background: '#181920', color: '#fff' }}>
                🔴 ڤیدیۆکە کار ناکات (Video doesn't work)
              </option>
              <option value="Wrong subtitle" style={{ background: '#181920', color: '#fff' }}>
                📝 ژێرنووس هەڵەیە یاخود نییە (Wrong subtitle)
              </option>
              <option value="Wrong information" style={{ background: '#181920', color: '#fff' }}>
                ℹ️ زانیاری هەڵەیە (Wrong information)
              </option>
              <option value="Bad quality" style={{ background: '#181920', color: '#fff' }}>
                📉 کوالێتی کەمە / خراپە (Bad quality)
              </option>
              <option value="Other" style={{ background: '#181920', color: '#fff' }}>
                ⚠️ کێشەی تر (Other)
              </option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-silver)' }}>
              وردەکاری زیاتر (ئارەزوومەندانە):
            </label>
            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="ڕوونکردنەوە لەسەر شوێن یا دەقیقەی کێشەکە بنووسە..."
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" size="sm" onClick={() => setReportModalOpen(false)}>
              پاشگەزبوونەوە
            </Button>
            <Button type="submit" variant="silver" size="sm" disabled={reportSubmitting}>
              {reportSubmitting ? 'خەریکی ناردنە...' : 'ناردنی ڕاپۆرت'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Personal Watchlist Collections Modal */}
      <Modal
        isOpen={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        title="❤️ کۆکراوە تایبەتەکانی من"
        maxWidth="540px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            فیلمی «{movie.title}» زیاد بکە بۆ کۆکراوە و فۆڵدەرە تایبەتەکانت:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {collections.map((col: any) => {
              const isIncluded = col.movieIds.includes(movie.id);
              return (
                <div
                  key={col.id}
                  onClick={() => {
                    const updated = collectionService.toggleMovieInCollection(col.id, movie.id);
                    if (updated) {
                      setCollections(collectionService.getUserCollections(userId));
                      showToast(
                        isIncluded
                          ? `لە «${col.name}» لابرا`
                          : `زیادکرا بۆ «${col.name}»`,
                        isIncluded ? 'info' : 'success'
                      );
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isIncluded ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isIncluded ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{col.icon || '📁'}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{col.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({col.movieIds.length} فیلم)</span>
                  </div>
                  {isIncluded ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontSize: '12px', fontWeight: 700 }}>
                      <Check size={16} /> زیادکراوە
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <Plus size={16} /> زیادکردن
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create new collection input */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="ناوی کۆکراوەی نوێ (وەک: فیلمی شەوانە، ئەنیمێ)..."
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '13px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newCollectionName.trim()) {
                    collectionService.createCollection(userId, newCollectionName.trim(), '🎬');
                    setCollections(collectionService.getUserCollections(userId));
                    setNewCollectionName('');
                    showToast('کۆکراوەی نوێ دروستکرا', 'success');
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="silver"
              size="sm"
              onClick={() => {
                if (newCollectionName.trim()) {
                  collectionService.createCollection(userId, newCollectionName.trim(), '🎬');
                  setCollections(collectionService.getUserCollections(userId));
                  setNewCollectionName('');
                  showToast('کۆکراوەی نوێ دروستکرا', 'success');
                }
              }}
            >
              دروستکردن
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mobile Sticky Watch Bar (shows on screens < 768px above bottom navigation) */}
      <div className="mobile-sticky-watch-bar">
        <div className="mobile-sticky-inner">
          <div className="mobile-sticky-info">
            <span className="mobile-sticky-title">{movie.title}</span>
            <div className="mobile-sticky-meta">
              <span className="mobile-sticky-rating">★ {movie.rating?.toFixed(1) || '9.0'}</span>
              {movie.isVIP && <span className="vip-badge-mini">VIP</span>}
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span>{movie.duration}</span>
            </div>
          </div>
          <div className="mobile-sticky-actions">
            <button
              className="touch-target-icon-btn"
              onClick={() => {
                toggleWatchlist(movie.id);
                showToast(
                  inWatchlist ? 'لە لیستی سەیرکردن لابرا' : 'زیادکرا بۆ لیستی سەیرکردن',
                  inWatchlist ? 'info' : 'success'
                );
              }}
              aria-label="Watchlist"
            >
              {inWatchlist ? <Check size={18} color="#38bdf8" /> : <Plus size={18} />}
            </button>
            <Button
              variant={movie.isVIP && !isVIP ? 'vip' : 'silver'}
              size="sm"
              icon={<Play size={16} fill="#08090C" strokeWidth={0} />}
              onClick={() => navigate(`/watch/${movie.id}`)}
              style={{ minHeight: '44px', padding: '0 18px', fontWeight: 800 }}
            >
              {movie.isVIP && !isVIP ? 'VIP' : 'سەیرکردن'}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
