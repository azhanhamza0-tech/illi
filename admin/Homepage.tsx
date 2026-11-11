import React, { useState, useEffect } from 'react';
import { movieService } from '../services/movieService';
import { adminService } from '../services/adminService';
import { useAuth } from '../hooks/useAuth';
import { Movie } from '../types/movie';
import { Sliders, Star, Crown, Check, Sparkles, Film, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export const AdminHomepage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedHeroId, setSelectedHeroId] = useState<string>('m1');
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [trendingIds, setTrendingIds] = useState<string[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);

  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const list = movieService.getMovies();
    setMovies(list);
    if (list.length > 0) {
      setSelectedHeroId(list[0].id);
      setFeaturedIds(list.filter((m) => m.isFeatured).map((m) => m.id));
      setTrendingIds(list.filter((m) => m.isTrending).map((m) => m.id));
      setRecommendedIds(list.filter((m) => m.isRecommended).map((m) => m.id));
    }
  }, []);

  const handleSaveHero = async (movieId: string) => {
    setSelectedHeroId(movieId);
    await adminService.logAction({
      adminId: user?.id || user?.uid || 'admin',
      adminEmail: user?.email || 'admin@rwanin.stream',
      role: user?.role === 'owner' ? 'owner' : 'admin',
      action: 'گۆڕینی فیلمی Hero',
      targetType: 'پەڕەی سەرەکی',
      targetId: movieId,
      description: `فیلمی سەرەکی (Hero Banner) گۆڕدرا بۆ ${movieId}.`
    });
    showToast('فیلمی Hero بە سەرکەوتوویی نوێکرایەوە!', 'success');
  };

  const toggleStatus = async (movieId: string, field: 'isFeatured' | 'isTrending' | 'isRecommended') => {
    const movie = movies.find((m) => m.id === movieId);
    if (!movie) return;

    const nextVal = !movie[field];
    await movieService.updateMovie(movieId, { [field]: nextVal });

    setMovies(
      movies.map((m) => (m.id === movieId ? { ...m, [field]: nextVal } : m))
    );

    showToast(`دۆخی فیلم (${field}) نوێکرایەوە`, 'info');
  };

  const heroMovie = movies.find((m) => m.id === selectedHeroId) || movies[0];

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
          ڕێکخستنەکانی پەڕەی سەرەکی (Homepage Management)
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          دیاریکردنی فیلمی Hero و ڕێکخستنی لیستەکانی Featured، Trending و پۆلێنکردنەکان لە کاتی ڕاستەقینەدا.
        </p>
      </div>

      {/* Hero Banner Manager */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '36px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles size={20} color="#38bdf8" />
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>فیلمی بەشی سەرەکی (Hero Section)</h2>
        </div>

        {heroMovie && (
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              height: '240px',
              marginBottom: '20px'
            }}
          >
            <img
              src={heroMovie.backdrop || heroMovie.poster}
              alt={heroMovie.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(270deg, rgba(8, 9, 12, 0.9) 0%, transparent 80%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '32px'
              }}
            >
              <span className="badge-vip" style={{ width: 'fit-content', marginBottom: '8px' }}>
                فیلمی دیاریکراوی ئێستا
              </span>
              <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>{heroMovie.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-silver)', maxWidth: '500px', marginTop: '6px' }}>
                {heroMovie.description?.slice(0, 120)}...
              </p>
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
            فیلمێکی تر هەڵبژێرە بۆ دانان لە Hero Banner:
          </label>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            {movies.map((m) => (
              <div
                key={m.id}
                onClick={() => handleSaveHero(m.id)}
                style={{
                  width: '130px',
                  flexShrink: 0,
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedHeroId === m.id ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <img src={m.poster} alt={m.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                <div style={{ padding: '6px 8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Sections: Featured, Trending, Recommended */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>
          بەڕێوەبردنی بەشەکانی پەڕەی سەرەکی (Featured & Trending)
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {movies.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={m.poster}
                  alt={m.title}
                  style={{ width: '36px', height: '52px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{m.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {m.year} • {m.genre.slice(0, 2).join('، ')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => toggleStatus(m.id, 'isFeatured')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: m.isFeatured ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)',
                    border: m.isFeatured ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    color: m.isFeatured ? '#38bdf8' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  تایبەتکراو (Featured)
                </button>

                <button
                  onClick={() => toggleStatus(m.id, 'isTrending')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: m.isTrending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
                    border: m.isTrending ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                    color: m.isTrending ? '#f59e0b' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  ترێند (Trending)
                </button>

                <button
                  onClick={() => toggleStatus(m.id, 'isRecommended')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: m.isRecommended ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.05)',
                    border: m.isRecommended ? '1px solid #a855f7' : '1px solid var(--border-subtle)',
                    color: m.isRecommended ? '#c084fc' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  پێشنیارکراو (Recommended)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
