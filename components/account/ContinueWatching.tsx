import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useWatchProgress } from '../../hooks/useWatchProgress';

export const ContinueWatching: React.FC = () => {
  const { getContinueWatchingWithMovies, formatTime } = useWatchProgress();
  const navigate = useNavigate();

  const list = getContinueWatchingWithMovies();

  if (list.length === 0) return null;

  return (
    <section style={{ marginBottom: '40px', textAlign: 'right' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Play size={18} color="var(--text-silver)" fill="var(--text-silver)" />
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>بەردەوام بە لە سەیرکردن</h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
          gap: '16px'
        }}
      >
        {list.map(({ item, movie }) => {
          const progressPercent = Math.min(
            100,
            Math.max(0, (item.currentTime / item.duration) * 100)
          );

          return (
            <div
              key={movie.id}
              onClick={() => navigate(`/watch/${movie.id}`)}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-silver)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Image Preview */}
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                <img
                  src={movie.backdrop || movie.poster}
                  alt={movie.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(8, 9, 12, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
                    }}
                  >
                    <Play size={20} fill="#08090C" color="#08090C" style={{ marginRight: '2px' }} />
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      backgroundColor: 'var(--accent-cyan)',
                      boxShadow: '0 0 8px var(--accent-cyan)'
                    }}
                  />
                </div>
              </div>

              {/* Title & Progress Time Display */}
              <div style={{ padding: '14px 16px' }}>
                <h4
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {movie.title}
                </h4>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: 'var(--text-muted)'
                  }}
                >
                  <span style={{ color: 'var(--text-silver)', direction: 'ltr' }}>
                    {formatTime(item.currentTime)} / {formatTime(item.duration)}
                  </span>
                  <span>%{Math.round(progressPercent)} تەواوبووە</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
