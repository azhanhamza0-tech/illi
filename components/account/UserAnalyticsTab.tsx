import React, { useMemo } from 'react';
import { Clock, Film, Star, Flame, BarChart3, TrendingUp } from 'lucide-react';
import { streakService } from '../../services/streakService';

export const UserAnalyticsTab: React.FC<{ userId: string }> = ({ userId }) => {
  const analytics = useMemo(() => streakService.getUserAnalytics(userId), [userId]);
  const streak = useMemo(() => streakService.getUserStreak(userId), [userId]);

  const hours = Math.floor(analytics.totalWatchMinutes / 60);
  const minutes = analytics.totalWatchMinutes % 60;
  const timeFormatted = hours > 0 ? `${hours} کاتژمێر و ${minutes} خولەک` : `${minutes} خولەک`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 4 Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: '16px'
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
              کۆی کاتی سەیرکردن
            </span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
              {timeFormatted}
            </span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Film size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
              ژمارەی فیلمە بینراوەکان
            </span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
              {analytics.totalMoviesWatched} فیلم
            </span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(250, 204, 21, 0.12)',
              color: '#FACC15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Star size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
              تێکڕای نمرە و هەڵسەنگاندن
            </span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#FACC15' }}>
              {analytics.averageRating.toFixed(1)} / 10
            </span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              color: '#fb923c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Flame size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
              ستڕیکی سەیرکردن
            </span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#fb923c' }}>
              🔥 {streak.currentStreak} ڕۆژی لەسەریەک
            </span>
          </div>
        </div>
      </div>

      {/* Top Genres Breakdown */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <BarChart3 size={20} color="#38bdf8" />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
            ژانەرە دڵخواز و زۆر سەیرکراوەکان
          </h3>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          بەپێی مێژووی سەیرکردن و هەڵسەنگاندنەکانت لە پلاتفۆرمی ڕوانین:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {analytics.topGenres.map((g: { genre: string; count: number }, idx: number) => {
            const max = analytics.topGenres[0]?.count || 1;
            const pct = Math.round((g.count / max) * 100);
            const colors = ['#38bdf8', '#a855f7', '#f59e0b', '#34d399', '#ec4899'];
            const barColor = colors[idx % colors.length];

            return (
              <div key={g.genre} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{g.genre}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{g.count} فیلم ({pct}%)</span>
                </div>
                <div
                  style={{
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: barColor,
                      borderRadius: '4px',
                      transition: 'width 0.8s ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
