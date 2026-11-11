import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Film,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  ExternalLink,
  Crown,
  UploadCloud,
  Eye,
  Star,
  Sparkles,
  Loader2,
  Tv,
  CheckCircle2,
  Link2
} from 'lucide-react';
import { movieService } from '../services/movieService';
import { storageService } from '../services/storageService';
import { adminService } from '../services/adminService';
import { tmdbService, TMDBSearchResult } from '../services/tmdbService';
import { useAuth } from '../hooks/useAuth';
import { Movie } from '../types/movie';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { genresListKurdish } from '../data/movies';
import { normalizeGoogleDriveUrl, parseStreamUrl, parseMuxPlaybackId } from '../utils/videoPlayer';
import { MovieVideoSection } from '../components/admin/MovieVideoSection';

export const AdminMovies: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>(() => movieService.getMovies());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeTab, setTypeTab] = useState<'all' | 'movie' | 'tv' | 'anime' | 'dubbed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [deleteStorageFiles, setDeleteStorageFiles] = useState(true);

  // TMDB / IMDb Auto-Fill State
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbSearching, setTmdbSearching] = useState(false);
  const [tmdbResults, setTmdbResults] = useState<TMDBSearchResult[]>([]);
  const [tmdbDropdownOpen, setTmdbDropdownOpen] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = movieService.subscribeToMovies((data) => {
      setMovies(data);
    });
    return () => unsub();
  }, []);

  const handleTmdbSearch = async (q: string) => {
    setTmdbQuery(q);
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) {
      setTmdbResults([]);
      setTmdbDropdownOpen(false);
      return;
    }
    setTmdbSearching(true);
    setTmdbDropdownOpen(true);
    try {
      const results = await tmdbService.search(trimmed);
      setTmdbResults(results);
    } catch (err) {
      console.warn('TMDB search error', err);
    } finally {
      setTmdbSearching(false);
    }
  };

  const handleSelectTmdbItem = async (item: TMDBSearchResult) => {
    setIsAutoFilling(true);
    setTmdbDropdownOpen(false);
    try {
      const details = await tmdbService.getMediaDetails(item.id, item.media_type);
      if (details) {
        setFormData((prev) => ({
          ...prev,
          ...details,
          cast: details.cast || prev.cast || [],
          castMembers: details.castMembers || prev.castMembers || [],
          // If video was already entered, keep it; otherwise default
          video: prev.video || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
        }));
        showToast(
          `زانیارییەکان و وێنەی کەسایەتییەکانی "${details.title || item.title}" لە TMDB و IMDb هێنران! ئێستا تەنها بەستەری ڤیدیۆکە دابنێ.`,
          'success'
        );
        setTimeout(() => {
          if (videoInputRef.current) {
            videoInputRef.current.focus();
            videoInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      } else {
        showToast('نەتوانرا زانیارییە وردەکان لە TMDB بهێنرێن', 'error');
      }
    } catch {
      showToast('کێشەیەک لە هێنانی زانیاری لە TMDB ڕوویدا', 'error');
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Form fields
  const [formData, setFormData] = useState<Partial<Movie>>({
    title: '',
    originalTitle: '',
    type: 'movie',
    seasons: 1,
    episodes: 1,
    isDubbed: false,
    description: '',
    poster: '',
    backdrop: '',
    trailer: '',
    video: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    year: 2024,
    rating: 8.5,
    duration: '2h 10m',
    country: 'کوردستان',
    director: '',
    genre: ['کوردی', 'دراما'],
    language: ['کوردی'],
    cast: [],
    castMembers: [],
    isVIP: false,
    isFeatured: true,
    isTrending: true,
    isRecommended: true,
    views: 10000
  });

  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      if (typeTab === 'dubbed') {
        const isDub = Boolean(
          m.isDubbed ||
          (Array.isArray(m.language) && m.language.some((l) => l.toLowerCase().includes('dubbed') || l.includes('دۆبلاژ'))) ||
          (Array.isArray(m.genre) && m.genre.some((g) => g.toLowerCase().includes('dubbed') || g.includes('دۆبلاژ')))
        );
        if (!isDub) return false;
      } else if (typeTab !== 'all') {
        const isSeries = m.type === 'tv' || (m.seasons !== undefined && m.seasons > 0);
        const isAnime = m.type === 'anime';
        const isMovie = (m.type === 'movie' || (!m.type && !m.seasons)) && !isSeries && !isAnime;

        if (typeTab === 'movie' && !isMovie) return false;
        if (typeTab === 'tv' && !isSeries) return false;
        if (typeTab === 'anime' && !isAnime) return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (m.title?.toLowerCase() || '').includes(q) ||
        (m.originalTitle?.toLowerCase() || '').includes(q) ||
        (m.director?.toLowerCase() || '').includes(q) ||
        (m.dubbedBy?.toLowerCase() || '').includes(q)
      );
    });
  }, [movies, searchQuery, typeTab]);

  const openAddModal = () => {
    setEditingMovie(null);
    setTmdbQuery('');
    setTmdbResults([]);
    setTmdbDropdownOpen(false);
    const isDubbedSelected = typeTab === 'dubbed';
    setFormData({
      id: `m_${Date.now()}`,
      title: '',
      originalTitle: '',
      type: typeTab === 'tv' ? 'tv' : typeTab === 'anime' ? 'anime' : 'movie',
      seasons: 1,
      episodes: 1,
      isDubbed: isDubbedSelected,
      dubbedBy: '',
      originalLanguage: 'ئینگلیزی',
      description: '',
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
      backdrop: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600',
      trailer: 'https://www.youtube.com/embed/tgbNymZ7vqY',
      video: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      year: 2024,
      rating: 8.5,
      duration: '2h 00m',
      country: 'کوردستان',
      director: '',
      genre: isDubbedSelected ? ['دۆبلاژکراو', 'کۆمیدی', 'ئەکشن'] : ['کوردی', 'ئاکشن'],
      language: isDubbedSelected ? ['کوردی', 'Kurdish Dubbed'] : ['کوردی'],
      cast: [],
      castMembers: [],
      isVIP: false,
      isFeatured: false,
      isTrending: true,
      isRecommended: true,
      introStart: undefined,
      introEnd: undefined,
      views: 5000
    });
    setIsModalOpen(true);
  };

  const openEditModal = (movie: Movie) => {
    setEditingMovie(movie);
    setTmdbQuery(movie.originalTitle || movie.title || '');
    setTmdbResults([]);
    setTmdbDropdownOpen(false);
    const isDub = Boolean(
      movie.isDubbed ||
      (Array.isArray(movie.language) && movie.language.some((l) => l.toLowerCase().includes('dubbed') || l.includes('دۆبلاژ'))) ||
      (Array.isArray(movie.genre) && movie.genre.some((g) => g.toLowerCase().includes('dubbed') || g.includes('دۆبلاژ')))
    );
    setFormData({
      type: 'movie',
      seasons: 1,
      episodes: 1,
      ...movie,
      cast: movie.cast || [],
      castMembers: movie.castMembers || [],
      isDubbed: isDub,
      dubbedBy: movie.dubbedBy || '',
      originalLanguage: movie.originalLanguage || 'ئینگلیزی',
      introStart: movie.introStart,
      introEnd: movie.introEnd
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'poster' | 'backdrop') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const folder = targetField === 'poster' ? 'movies/posters' : 'movies/backdrops';
      setUploadProgress(10);
      const url = await storageService.uploadFile(file, folder, (progress) => {
        setUploadProgress(progress);
      });
      setFormData((prev) => ({ ...prev, [targetField]: url }));
      setUploadProgress(null);
      showToast(`فایل بە سەرکەوتوویی بارکرا (${targetField})`, 'success');
    } catch (err) {
      setUploadProgress(null);
      showToast('هەڵەیەک لە بارکردنی فایل ڕوویدا', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.poster?.trim()) {
      showToast('تکایە ناوی فیلم و وێنەی Poster دیاریبکە', 'error');
      return;
    }

    try {
      // 1. Detect if Mux Playback ID or Mux stream URL is provided anywhere in formData
      const muxId =
        formData.mux?.playbackId ||
        parseMuxPlaybackId(formData.videoUrl) ||
        parseMuxPlaybackId(formData.video);

      let finalVideoUrl = formData.videoUrl;
      let finalVideoProvider = formData.videoProvider || (muxId ? 'mux' : 'google-drive');
      let finalMux = formData.mux;

      if (muxId) {
        finalVideoProvider = 'mux';
        finalVideoUrl = `https://stream.mux.com/${muxId}.m3u8`;
        finalMux = {
          assetId: formData.mux?.assetId || '',
          playbackId: muxId,
          playbackPolicy: formData.mux?.playbackPolicy || 'public',
          status: 'ready',
          duration: formData.mux?.duration,
          width: formData.mux?.width,
          height: formData.mux?.height,
          aspectRatio: formData.mux?.aspectRatio || '16:9',
          updatedAt: new Date().toISOString()
        };
      } else {
        const rawStream =
          formData.videoUrl?.trim() ||
          formData.video?.trim() ||
          formData.trailer?.trim() ||
          'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
        finalVideoUrl = normalizeGoogleDriveUrl(rawStream);
      }

      const cleanEpisodes = formData.episodeList?.map((ep) => ({
        ...ep,
        videoUrl: ep.videoUrl ? normalizeGoogleDriveUrl(ep.videoUrl) : ep.videoUrl
      }));

      const payload = {
        ...formData,
        videoProvider: finalVideoProvider,
        video: finalVideoUrl,
        videoUrl: finalVideoUrl,
        mux: finalMux,
        episodeList: cleanEpisodes
      };

      if (editingMovie) {
        await movieService.updateMovie(editingMovie.id, payload);
        try {
          await adminService.logAction({
            adminId: user?.id || user?.uid || 'admin',
            adminEmail: user?.email || 'admin@rwanin.stream',
            role: user?.role === 'owner' ? 'owner' : 'admin',
            action: 'دەستکاریکردنی فیلم',
            targetType: 'فیلم',
            targetId: editingMovie.id,
            description: `فیلمی "${formData.title}" دەستکاری کرا.`
          });
        } catch (logErr) {
          console.warn('Logging note:', logErr);
        }
        showToast('زانیارییەکانی فیلم نوێکرانەوە', 'success');
      } else {
        const newMovie = {
          ...payload,
          id: formData.id || `m_${Date.now()}`
        } as Movie;
        await movieService.addMovie(newMovie);
        try {
          await adminService.logAction({
            adminId: user?.id || user?.uid || 'admin',
            adminEmail: user?.email || 'admin@rwanin.stream',
            role: user?.role === 'owner' ? 'owner' : 'admin',
            action: 'زیادکردنی فیلمی نوێ',
            targetType: 'فیلم',
            targetId: newMovie.id,
            description: `فیلمی نوێی "${newMovie.title}" زیادکرا بۆ کەتەلۆگ.`
          });
        } catch (logErr) {
          console.warn('Logging note:', logErr);
        }
        showToast('فیلمی نوێ بە سەرکەوتوویی زیادکرا بۆ کەتەلۆگ', 'success');
      }

      setMovies(movieService.getMovies());
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save movie error:', err);
      showToast('کێشەیەک لە پاشەکەوتکردنی فیلم ڕوویدا', 'error');
    }
  };

  const confirmDeleteMovie = async () => {
    if (!movieToDelete) return;

    try {
      if (deleteStorageFiles) {
        if (movieToDelete.poster) await storageService.deleteFile(movieToDelete.poster);
        if (movieToDelete.backdrop) await storageService.deleteFile(movieToDelete.backdrop);
      }

      await movieService.deleteMovie(movieToDelete.id);
      await adminService.logAction({
        adminId: user?.id || user?.uid || 'admin',
        adminEmail: user?.email || 'admin@rwanin.stream',
        role: user?.role === 'owner' ? 'owner' : 'admin',
        action: 'سڕینەوەی فیلم',
        targetType: 'فیلم',
        targetId: movieToDelete.id,
        description: `فیلمی "${movieToDelete.title}" سڕایەوە (سڕینەوەی فایلی ستۆریج: ${deleteStorageFiles ? 'بەڵێ' : 'نەخێر'}).`
      });

      setMovies(movieService.getMovies());
      setDeleteModalOpen(false);
      setMovieToDelete(null);
      showToast(`فیلمی "${movieToDelete.title}" لە کەتەلۆگ سڕایەوە و لە هەموو براوسەرەکاندا نوێکرایەوە`, 'info');
    } catch (err) {
      showToast('کێشەیەک لە سڕینەوە ڕوویدا', 'error');
    }
  };

  const handleDeleteDemoMovies = async () => {
    const confirm = window.confirm(
      'ئایا دڵنیایت دەتەوێت سەرجەم فیلمە پێشوەختەکان (Demo Movies) بسڕیتەوە تاکو تەنها ئەو فیلمانە بمێننەوە کە خۆت داتناون؟ ئەم سڕینەوەیە دەستبەجێ لە نێو هەموو براوسەرەکانی تردا (Chrome, Edge, مۆبایل) فیلمە دێمۆکان لادەبات.'
    );
    if (!confirm) return;

    try {
      await movieService.deleteDemoMovies();
      setMovies(movieService.getMovies());
      showToast('سەرجەم فیلمە پێشوەختەکان سڕانەوە و تەنها فیلمە تایبەتەکانی خۆت مانەوە', 'success');
    } catch {
      showToast('کێشەیەک لە سڕینەوەی فیلمە پێشوەختەکان ڕوویدا', 'error');
    }
  };

  return (
    <div className="admin-content-pad" style={{ padding: 'clamp(14px, 3.5vw, 32px)' }}>
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
            بەڕێوەبردنی کەتەلۆگی فیلمەکان
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            زیادکردن، دەستکاریکردن، سڕینەوە و بەستنەوەی فایلی ڤیدیۆ و وێنە لە Storage.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button
            variant="danger"
            icon={<Trash2 size={16} />}
            onClick={handleDeleteDemoMovies}
            title="سڕینەوەی سەرجەم فیلمە نموونەییەکان بە یەک کلیک بۆ ئەوەی تەنها ئەو فیلمانە بمێننەوە کە خۆت زیادیان دەکەیت"
          >
            سڕینەوەی فیلمە دێمۆکان
          </Button>
          <Button variant="silver" icon={<Plus size={18} />} onClick={openAddModal}>
            زیادکردنی فیلمی نوێ
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar & Media Type Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              minWidth: 'min(100%, 280px)',
              maxWidth: '440px',
              flex: 1
            }}
          >
          <Search size={18} color="var(--text-muted)" style={{ marginLeft: '10px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەپێی ناوی فیلم، ئەنیمێ، زنجیرە..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '13.5px',
              width: '100%'
            }}
          />
        </div>

        {/* Media Type Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'هەمووان', count: movies.length },
            { id: 'movie', label: 'فیلمەکان', count: movies.filter((m) => m.type === 'movie' || (!m.type && !m.seasons)).length },
            { id: 'tv', label: 'زنجیرەکان', count: movies.filter((m) => m.type === 'tv' || (m.seasons !== undefined && m.seasons > 0)).length },
            { id: 'anime', label: 'ئەنیمێ', count: movies.filter((m) => m.type === 'anime').length },
            {
              id: 'dubbed',
              label: '🎙️ دۆبلاژکراوی کوردی',
              count: movies.filter((m) =>
                Boolean(
                  m.isDubbed ||
                  m.language?.some((l) => l.toLowerCase().includes('dubbed') || l.includes('دۆبلاژ')) ||
                  m.genre?.some((g) => g.toLowerCase().includes('dubbed') || g.includes('دۆبلاژ'))
                )
              ).length
            }
          ].map((tab) => {
            const isActive = typeTab === tab.id;
            const isDubbedTab = tab.id === 'dubbed';
            const activeBg = isDubbedTab ? 'rgba(52, 211, 153, 0.18)' : 'rgba(56, 189, 248, 0.15)';
            const activeColor = isDubbedTab ? '#34d399' : '#38bdf8';
            const activeBorder = isDubbedTab ? '1px solid #34d399' : '1px solid #38bdf8';

            return (
              <button
                key={tab.id}
                onClick={() => setTypeTab(tab.id as any)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: isActive ? activeBg : 'var(--bg-card)',
                  color: isActive ? activeColor : 'var(--text-silver)',
                  border: isActive ? activeBorder : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    color: isActive ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Movies Table */}
      <div
        className="admin-table-container"
      >
        <table style={{ minWidth: '780px', width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ناونیشان و جۆر</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ساڵ و ماوە</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ژانەر</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>پلە (Rating)</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>پاکێج</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>دۆخ و نیشانەکان</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>کردارەکان</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovies.map((movie) => (
              <tr key={movie.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      style={{ width: '40px', height: '58px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#fff' }}>{movie.title}</span>
                        {movie.type === 'anime' && (
                          <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                            ئەنیمێ {movie.episodes ? `(${movie.episodes} ئەڵقە)` : ''}
                          </span>
                        )}
                        {movie.type === 'tv' && (
                          <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                            زنجیرە {movie.seasons ? `(${movie.seasons} وەرز)` : ''}
                          </span>
                        )}
                        {(movie.isDubbed ||
                          movie.language?.some((l) => l.toLowerCase().includes('dubbed') || l.includes('دۆبلاژ')) ||
                          movie.genre?.some((g) => g.toLowerCase().includes('dubbed') || g.includes('دۆبلاژ'))) && (
                          <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)' }}>
                            🎙️ دۆبلاژ {movie.dubbedBy ? `(${movie.dubbedBy})` : ''}
                          </span>
                        )}
                      </div>
                      {movie.originalTitle && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', direction: 'ltr', textAlign: 'right' }}>
                          {movie.originalTitle}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-silver)' }}>
                  {movie.year} • {movie.duration}
                </td>
                <td style={{ padding: '16px 20px', color: '#38bdf8' }}>
                  {movie.genre.slice(0, 2).join('، ')}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#FACC15', fontWeight: 700 }}>
                    <Star size={13} fill="#FACC15" />
                    {movie.rating.toFixed(1)}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {movie.isVIP ? (
                    <span className="badge-vip" style={{ fontSize: '10px' }}>VIP</span>
                  ) : (
                    <span className="badge-hd" style={{ fontSize: '10px' }}>FREE</span>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {movie.isFeatured && (
                      <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                        تایبەت
                      </span>
                    )}
                    {movie.isTrending && (
                      <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        ترێند
                      </span>
                    )}
                    {movie.isRecommended && (
                      <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                        پێشنیار
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => openEditModal(movie)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-silver)',
                        cursor: 'pointer'
                      }}
                      title="دەستکاریکردن"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setMovieToDelete(movie);
                        setDeleteModalOpen(true);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                      title="سڕینەوە"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Movie Modal: Requirement 17 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMovie ? 'دەستکاریکردنی فیلم' : 'زیادکردنی فیلمی نوێ'}
        maxWidth="780px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', paddingLeft: '6px' }}>
          {/* TMDB & IMDb Instant Auto-Fill Banner */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(168, 85, 247, 0.12))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              marginBottom: '4px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#38bdf8" />
                <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#fff' }}>
                  پڕکردنەوەی خودکار لە TMDB و IMDb (Auto-Fill)
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, backgroundColor: 'rgba(56, 189, 248, 0.18)', padding: '2px 8px', borderRadius: '999px' }}>
                ⚡ زانیاری خۆکار
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
              ناوی فیلم یان زنجیرەکە بنووسە یان کۆدی IMDb (وەک Inception یان Breaking Bad یان tt1375666) بنووسە تا هەموو زانیاری و وێنەکان پڕببنەوە و تۆ تەنها بەستەری ڤیدیۆ دابنێیت.
            </p>

            <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={tmdbQuery}
                  onChange={(e) => handleTmdbSearch(e.target.value)}
                  onFocus={() => {
                    if (tmdbResults.length > 0) setTmdbDropdownOpen(true);
                  }}
                  placeholder="گەڕان بە ناوی فیلم / زنجیرە یان کۆدی IMDb..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    paddingLeft: tmdbSearching ? '36px' : '14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#0F1015',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
                {tmdbSearching && (
                  <Loader2
                    size={16}
                    color="#38bdf8"
                    className="animate-spin"
                    style={{ position: 'absolute', left: '12px', top: '12px' }}
                  />
                )}
              </div>

              <Button
                type="button"
                variant="silver"
                size="sm"
                onClick={() => handleTmdbSearch(tmdbQuery)}
                disabled={tmdbSearching || isAutoFilling || !tmdbQuery.trim()}
              >
                {isAutoFilling ? 'پڕکردنەوە...' : 'گەڕان لە TMDB'}
              </Button>
            </div>

            {/* Live Search Suggestions Dropdown */}
            {tmdbDropdownOpen && tmdbResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '16px',
                  left: '16px',
                  backgroundColor: '#12131A',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
                  zIndex: 50,
                  maxHeight: '290px',
                  overflowY: 'auto',
                  marginTop: '6px'
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    ئەنجامەکانی دۆزراوە لە TMDB ({tmdbResults.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setTmdbDropdownOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                {tmdbResults.map((item) => (
                  <div
                    key={`${item.media_type}-${item.id}`}
                    onClick={() => handleSelectTmdbItem(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {item.poster_path ? (
                      <img
                        src={item.poster_path}
                        alt={item.title}
                        style={{ width: '36px', height: '52px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '36px',
                          height: '52px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Film size={16} color="var(--text-muted)" />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: item.media_type === 'tv' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                            color: item.media_type === 'tv' ? '#38bdf8' : '#c084fc'
                          }}
                        >
                          {item.media_type === 'tv' ? '📺 زنجیرە' : '🎬 فیلم'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {item.release_date && <span>{item.release_date.slice(0, 4)}</span>}
                        {item.vote_average > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#FACC15' }}>
                            <Star size={11} fill="#FACC15" /> {item.vote_average.toFixed(1)}
                          </span>
                        )}
                        {item.original_title && item.original_title !== item.title && (
                          <span style={{ direction: 'ltr', color: 'var(--text-muted)' }}>({item.original_title})</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      پڕکردنەوە
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 1: Title & Original Title */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                ناونیشان (Title)*
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="نموونە: هێرش بۆ سەر زەبەلاحەکان"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                ناوی ئەسڵی (Original Title)
              </label>
              <input
                type="text"
                value={formData.originalTitle}
                onChange={(e) => setFormData({ ...formData, originalTitle: e.target.value })}
                placeholder="Shingeki no Kyojin"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff', direction: 'ltr', textAlign: 'right' }}
              />
            </div>
          </div>

          {/* Row 1.5: Media Type & Seasons/Episodes */}
          <div style={{ display: 'grid', gridTemplateColumns: (formData.type === 'tv' || formData.type === 'anime') ? '1fr 1fr 1fr' : '1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                جۆری ناوەڕۆک (Media Type)
              </label>
              <select
                value={formData.type || 'movie'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: '#15161C', border: '1px solid var(--border-subtle)', color: '#fff', cursor: 'pointer' }}
              >
                <option value="movie">فیلم (Movie)</option>
                <option value="tv">زنجیرە (TV Series)</option>
                <option value="anime">ئەنیمێ (Anime)</option>
              </select>
            </div>

            {(formData.type === 'tv' || formData.type === 'anime') && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    ژمارەی وەرزەکان (Seasons)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.seasons || 1}
                    onChange={(e) => setFormData({ ...formData, seasons: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    ژمارەی ئەڵقەکان (Episodes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.episodes || 1}
                    onChange={(e) => setFormData({ ...formData, episodes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Kurdish Dubbed Special Section */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: formData.isDubbed ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              border: formData.isDubbed ? '1px solid #34d399' : '1px solid var(--border-subtle)',
              transition: 'all 0.2s ease'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean(formData.isDubbed)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    isDubbed: checked,
                    language: checked
                      ? Array.from(new Set([...(formData.language || ['کوردی']), 'Kurdish Dubbed', 'دۆبلاژی کوردی']))
                      : (formData.language || []).filter((l) => !l.toLowerCase().includes('dubbed') && !l.includes('دۆبلاژ')),
                    genre: checked
                      ? Array.from(new Set([...(formData.genre || ['کوردی']), 'دۆبلاژکراو']))
                      : formData.genre
                  });
                }}
                style={{ width: '18px', height: '18px', accentColor: '#34d399' }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ color: formData.isDubbed ? '#34d399' : '#fff', fontWeight: 800, fontSize: '14px' }}>
                  🎙️ ئەم بەرهەمە دۆبلاژکراوی کوردییە (Kurdish Dubbed)
                </span>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  لەکاتی کاراکردندا، بەرهەمەکە نیشانەی تایبەتی "🎙️ دۆبلاژ" وەردەگرێت و لە بەشی دۆبلاژکراوەکانی ماڵپەڕ دەردەکەوێت.
                </p>
              </div>
            </label>

            {formData.isDubbed && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(52, 211, 153, 0.3)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                    تیپی دۆبلاژ / ستۆدیۆ (Dubbed By)
                  </label>
                  <input
                    type="text"
                    value={formData.dubbedBy || ''}
                    onChange={(e) => setFormData({ ...formData, dubbedBy: e.target.value })}
                    placeholder="نموونە: دۆبلاژی ڕوانین، کوردسینەما، ..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#fff', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                    زمانی بنەڕەتی (Original Language)
                  </label>
                  <input
                    type="text"
                    value={formData.originalLanguage || 'ئینگلیزی'}
                    onChange={(e) => setFormData({ ...formData, originalLanguage: e.target.value })}
                    placeholder="ئینگلیزی، ژاپۆنی، تورکی..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#fff', fontSize: '12.5px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
              وەسف و چیڕۆک (Description)
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="چیڕۆکی فیلمەکە بنووسە..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff', resize: 'vertical' }}
            />
          </div>

          {/* Row 3: Poster & Backdrop with Storage Upload (Requirement 18) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                وێنەی Poster
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={formData.poster}
                  onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                  placeholder="URL یاخود بارکردنی فایل"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '12px' }}
                />
                <label style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <UploadCloud size={16} />
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'poster')} style={{ display: 'none' }} />
                </label>
              </div>
              {formData.poster && (
                <div style={{ marginTop: '6px' }}>
                  <img src={formData.poster} alt="Preview" style={{ width: '48px', height: '68px', objectFit: 'cover', borderRadius: '4px' }} />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                وێنەی Backdrop (پشتەوە)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={formData.backdrop}
                  onChange={(e) => setFormData({ ...formData, backdrop: e.target.value })}
                  placeholder="URL یاخود بارکردنی فایل"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '12px' }}
                />
                <label style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <UploadCloud size={16} />
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'backdrop')} style={{ display: 'none' }} />
                </label>
              </div>
              {formData.backdrop && (
                <div style={{ marginTop: '6px' }}>
                  <img src={formData.backdrop} alt="Preview" style={{ width: '100px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
                </div>
              )}
            </div>
          </div>

          {uploadProgress !== null && (
            <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', color: '#38bdf8' }}>
              خەریکی بارکردنی فایل بۆ Storage: {uploadProgress}%
            </div>
          )}

          {/* Row 4: Trailer & Video Streams */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                بەستەری ترەیلەر (Trailer URL)
              </label>
              <input
                type="text"
                value={formData.trailer}
                onChange={(e) => setFormData({ ...formData, trailer: e.target.value })}
                placeholder="https://www.youtube.com/embed/..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Integrated Mux & Access Video Management Section */}
          <MovieVideoSection
            movie={formData}
            onChange={(updatedFields) => {
              setFormData((prev) => ({
                ...prev,
                ...updatedFields,
                // keep video string updated if videoUrl changed
                video: updatedFields.videoUrl !== undefined ? updatedFields.videoUrl : prev.video
              }));
            }}
          />

          {/* TV Episodes Multi-link section */}
          {(formData.type === 'tv' || formData.type === 'anime') && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(56, 189, 248, 0.04)',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tv size={15} /> بەستەری ئەڵقەکانی زنجیرە (Episodes Links)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  کۆی ئەڵقەکان: {formData.episodes || 1}
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                گەر تەنها یەک لینکت هەیە، بەستەری سەرەوە بەسە بۆ هەموو زنجیرەکە. گەر دەتەوێت بۆ هەر ئەڵقەیەک لینکی جیاواز دابنێیت:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {Array.from({ length: Math.min(formData.episodes || 1, 24) }).map((_, idx) => {
                  const epNum = idx + 1;
                  const currentEp = formData.episodeList?.find((e) => e.episodeNumber === epNum);
                  return (
                    <div key={epNum} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, minWidth: '46px', color: 'var(--text-silver)' }}>
                        ئەڵقەی {epNum}:
                      </span>
                      <input
                        type="text"
                        placeholder={`بەستەری ئەڵقەی ${epNum}`}
                        value={currentEp?.videoUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const existing = [...(formData.episodeList || [])];
                          const epIndex = existing.findIndex((item) => item.episodeNumber === epNum);
                          if (epIndex >= 0) {
                            existing[epIndex] = { ...existing[epIndex], videoUrl: val };
                          } else {
                            existing.push({
                              id: `ep_${epNum}_${Date.now()}`,
                              episodeNumber: epNum,
                              seasonNumber: 1,
                              title: `ئەڵقەی ${epNum}`,
                              videoUrl: val
                            });
                          }
                          setFormData({ ...formData, episodeList: existing });
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '11.5px'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 5: Year, Rating, Duration, Country */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>ساڵ</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>ماوە</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="2h 10m"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>وڵات</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="کوردستان / ئەمریکا"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
          </div>

          {/* Row 6: Director & Genre */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                دەرهێنەر (Director)
              </label>
              <input
                type="text"
                value={formData.director}
                onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                placeholder="نموونە: بەهمەن قوبادی"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                ژانەرەکان (جیاکردنەوە بە فاریزە)
              </label>
              <input
                type="text"
                value={formData.genre?.join('، ')}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value.split('،').map((g) => g.trim()) })}
                placeholder="کوردی، ئاکشن، دراما"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
          </div>

          {/* Row 6.5: Characters & Cast Members with Real Headshots */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                  کەسایەتییەکان و ئەکتەرەکان (Characters & Cast)
                </span>
                {formData.castMembers && formData.castMembers.length > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                    {formData.castMembers.length} کەسایەتی بە وێنەی ڕاستەقینەی IMDb / TMDB
                  </span>
                )}
              </div>
            </div>

            {formData.castMembers && formData.castMembers.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  scrollbarWidth: 'none'
                }}
              >
                {formData.castMembers.map((member, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      flexShrink: 0,
                      maxWidth: '220px'
                    }}
                  >
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          backgroundColor: '#0F1015'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      >
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#38bdf8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.role || 'ئەکتەر'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...(formData.castMembers || [])];
                        updated.splice(idx, 1);
                        setFormData({
                          ...formData,
                          castMembers: updated,
                          cast: updated.map((m) => m.name)
                        });
                      }}
                      style={{
                        marginRight: 'auto',
                        color: 'var(--text-muted)',
                        padding: '2px',
                        cursor: 'pointer'
                      }}
                      title="سڕینەوە"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                کاتێک ناوی فیلم لە بەشی سەرەوەی فۆڕمەکە (Auto-Fill) دەنووسیت، وێنەی سەرجەم کەسایەتییەکان و ڕۆڵەکانیان ڕاستەوخۆ لە IMDb و TMDB لێرە پڕدەبێتەوە.
              </div>
            )}
          </div>

          {/* Row 7: Skip Intro Config */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(56, 189, 248, 0.04)', border: '1px dashed rgba(56, 189, 248, 0.2)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                ⏭️ دەستپێکی ئینترۆ بە چرکە (Intro Start)
              </label>
              <input
                type="number"
                min="0"
                value={formData.introStart ?? ''}
                onChange={(e) => setFormData({ ...formData, introStart: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="نموونە: 15 (چرکە)"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '12.5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                ⏭️ کۆتایی ئینترۆ بە چرکە (Intro End)
              </label>
              <input
                type="number"
                min="0"
                value={formData.introEnd ?? ''}
                onChange={(e) => setFormData({ ...formData, introEnd: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="نموونە: 95 (چرکە)"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {/* Toggles: VIP, Featured, Trending, Recommended */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={formData.isVIP}
                onChange={(e) => setFormData({ ...formData, isVIP: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#E2B755' }}
              />
              <span style={{ color: '#E2B755', fontWeight: 700 }}>تایبەت بە VIP</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#38bdf8' }}
              />
              <span>تایبەتکراوەکان (Featured)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={formData.isTrending}
                onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
              />
              <span>لە ترێنددا (Trending)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={formData.isRecommended}
                onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#a855f7' }}
              />
              <span>پێشنیارکراو (Recommended)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={Boolean(formData.isDubbed)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    isDubbed: checked,
                    language: checked
                      ? Array.from(new Set([...(formData.language || ['کوردی']), 'Kurdish Dubbed', 'دۆبلاژی کوردی']))
                      : (formData.language || []).filter((l) => !l.toLowerCase().includes('dubbed') && !l.includes('دۆبلاژ')),
                    genre: checked
                      ? Array.from(new Set([...(formData.genre || ['کوردی']), 'دۆبلاژکراو']))
                      : formData.genre
                  });
                }}
                style={{ width: '16px', height: '16px', accentColor: '#34d399' }}
              />
              <span style={{ color: '#34d399', fontWeight: 700 }}>🎙️ دۆبلاژکراوی کوردی</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
            <Button type="submit" variant="silver" style={{ flex: 1 }}>
              {editingMovie ? 'نوێکردنەوەی فیلم' : 'پاشەکەوتکردنی فیلم'}
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              پاشگەزبوونەوە
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (with Storage cleanup option: Requirement 18) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="دڵنیابوونەوە لە سڕینەوەی فیلم"
        maxWidth="480px"
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-silver)', lineHeight: 1.6, marginBottom: '18px' }}>
            ئایا دڵنیایت لە سڕینەوەی فیلمی <strong style={{ color: '#fff' }}>"{movieToDelete?.title}"</strong>؟
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <input
              type="checkbox"
              id="del-storage"
              checked={deleteStorageFiles}
              onChange={(e) => setDeleteStorageFiles(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
            />
            <label htmlFor="del-storage" style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              سڕینەوەی وێنە و فایلە پەیوەندیدارەکانی ئەم فیلمە لە Firebase Storage
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="danger" style={{ flex: 1 }} onClick={confirmDeleteMovie}>
              بەڵێ، فیلمەکە بسڕەوە
            </Button>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              پاشگەزبوونەوە
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
