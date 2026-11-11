import React, { useMemo } from 'react';
import { Flame, Trophy, Award, CheckCircle2, Lock } from 'lucide-react';
import { streakService } from '../../services/streakService';

export const StreakAchievementsTab: React.FC<{ userId: string }> = ({ userId }) => {
  const streak = useMemo(() => streakService.getUserStreak(userId), [userId]);
  const achievements = useMemo(() => streakService.getUserAchievements(userId), [userId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Big Streak Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(249, 115, 22, 0.5)',
              color: '#fff'
            }}
          >
            <Flame size={40} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#fb923c', fontWeight: 700, marginBottom: '4px' }}>
              ستڕیکی چالاکی ڕۆژانەی بینین
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fff' }}>
              🔥 {streak.currentStreak} ڕۆژ بەردەوام فیلمت بینیوە!
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              ڕۆژانە لانیکەم فیلمێک یان ئەڵقەیەک ببینە تاوەکو ستڕیکەکەت نەشکێت.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>باشترین ریکۆرد</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#FACC15' }}>
              {streak.longestStreak} ڕۆژ
            </span>
          </div>

          <div
            style={{
              padding: '12px 20px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>دوایین چالاکی</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              {streak.lastActiveDate || 'ئەمڕۆ'}
            </span>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <Trophy size={22} color="#FACC15" />
          <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#fff' }}>
            دەستکەوتەکان و خەڵاتەکانی سەیرکردن (Achievements)
          </h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '16px'
          }}
        >
          {achievements.map((ach: any) => {
            const current = ach.currentProgress ?? ach.progress ?? 0;
            const target = ach.targetProgress ?? ach.target ?? 1;
            const pct = Math.min(100, Math.round((current / target) * 100));

            return (
              <div
                key={ach.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  border: `1px solid ${ach.unlocked ? 'rgba(250, 204, 21, 0.3)' : 'var(--border-subtle)'}`,
                  background: ach.unlocked
                    ? 'linear-gradient(180deg, rgba(250, 204, 21, 0.05) 0%, var(--bg-card) 100%)'
                    : 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '32px' }}>{ach.icon}</span>
                  {ach.unlocked ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(52, 211, 153, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(52, 211, 153, 0.3)'
                      }}
                    >
                      <CheckCircle2 size={12} /> بەدەستهاتووە
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <Lock size={12} /> قوفڵکراوە
                    </span>
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: ach.unlocked ? '#FACC15' : '#fff', marginBottom: '4px' }}>
                    {ach.title}
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {ach.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ئاستی بەرەوپێشچوون</span>
                    <span style={{ fontWeight: 700, color: ach.unlocked ? '#34d399' : 'var(--text-silver)' }}>
                      {current} / {target} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: ach.unlocked ? '#FACC15' : '#38bdf8',
                        borderRadius: '3px',
                        transition: 'width 0.6s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
