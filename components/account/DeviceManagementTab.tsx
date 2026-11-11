import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, LogOut, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { deviceService } from '../../services/deviceService';
import { UserDeviceSession } from '../../types/movie';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

export const DeviceManagementTab: React.FC<{ userId: string }> = ({ userId }) => {
  const [sessions, setSessions] = useState<UserDeviceSession[]>([]);
  const { showToast } = useToast();

  const loadSessions = () => {
    setSessions(deviceService.getUserSessions(userId));
  };

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const handleTerminate = (sessionId: string, isCurrent: boolean) => {
    if (isCurrent) {
      if (!confirm('ئایا دڵنیایت دەتەوێت لەم ئامێرەی ئێستات دەربچیت؟')) return;
    }
    deviceService.terminateSession(sessionId);
    loadSessions();
    showToast('ئامێرەکە بە سەرکەوتوویی لە هەژمار دەرکرا', 'success');
  };

  const handleTerminateOthers = () => {
    const current = sessions.find((s) => s.isCurrent);
    if (!current) return;
    deviceService.terminateOtherSessions(userId, current.id);
    loadSessions();
    showToast('لە هەموو ئامێرەکانی تر چوویتە دەرەوە بە سەرکەوتوویی', 'success');
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone size={24} color="#38bdf8" />;
      case 'tablet':
        return <Tablet size={24} color="#a855f7" />;
      default:
        return <Monitor size={24} color="#34d399" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="#38bdf8" /> ئامێرە چالاکەکان و بەڕێوەبردنی دەستپێگەیشتن
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            ئەو ئامێرانەی لە ئێستادا چوونەتە ناو هەژماری ڕوانینەکەت. دەتوانیت هەر ئامێرێکی نەناسراو دەربکەیت.
          </p>
        </div>

        {sessions.filter((s) => !s.isCurrent).length > 0 && (
          <Button variant="secondary" size="sm" onClick={handleTerminateOthers}>
            دەرچوون لە هەموو ئامێرەکانی تر
          </Button>
        )}
      </div>

      {/* Device List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {sessions.map((session) => (
          <div
            key={session.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              border: `1px solid ${session.isCurrent ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-subtle)'}`,
              background: session.isCurrent
                ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.06) 0%, var(--bg-card) 100%)'
                : 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {getDeviceIcon(session.deviceType)}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                    {session.deviceName}
                  </span>
                  {session.isCurrent && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)'
                      }}
                    >
                      <CheckCircle size={12} /> ئەم ئامێرە (چالاک)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '14px', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span>براوسەر: {session.browser}</span>
                  <span>•</span>
                  <span>سیستەم: {session.os}</span>
                  <span>•</span>
                  <span>شوێن: {session.location}</span>
                  <span>•</span>
                  <span>دوایین چالاکی: {session.lastActive}</span>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={() => handleTerminate(session.id, session.isCurrent)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <LogOut size={14} />
                <span>{session.isCurrent ? 'دەرچوون لەم ئامێرە' : 'دەرکردنی ئامێر'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
