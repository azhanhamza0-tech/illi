import React from 'react';
import { Crown, Calendar, Mail, CheckCircle, ShieldCheck } from 'lucide-react';
import { User } from '../../types/movie';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

export const ProfileCard: React.FC<{ user: User }> = ({ user }) => {
  const isVIP = user.package === 'VIP';
  const isSuperAdmin = user.email?.toLowerCase().trim() === 'azhanako1999@gmail.com';

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: 'clamp(16px, 4vw, 30px)',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'clamp(14px, 3vw, 24px)',
        textAlign: 'right'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={user.avatar}
            alt={user.name}
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: isVIP ? '2px solid #E2B755' : '2px solid var(--border-subtle)',
              boxShadow: isVIP ? '0 0 20px rgba(226, 183, 85, 0.3)' : 'none'
            }}
          />
          {isVIP && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 'auto',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--accent-vip-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
              }}
            >
              <Crown size={14} color="#08090C" strokeWidth={2.5} />
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{user.name}</h2>
            {isSuperAdmin ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                بەڕێوەبەری سەرەکی (Admin)
              </span>
            ) : isVIP ? (
              <span className="badge-vip">ئەندامی VIP</span>
            ) : (
              <span className="badge-hd">ئەندامی بێبەرامبەر</span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} color="var(--text-muted)" />
              <span>{user.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="var(--text-muted)" />
              <span>بەرواری بەشداربوون: {user.joinDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {isSuperAdmin && (
          <Link to="/admin">
            <Button
              variant="primary"
              size="md"
              icon={<ShieldCheck size={16} />}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                boxShadow: '0 2px 12px rgba(239, 68, 68, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              چوونەژوورەوەی ئەدمین
            </Button>
          </Link>
        )}

        {!isVIP ? (
          <Link to="/vip">
            <Button variant="vip" size="md" icon={<Crown size={16} />}>
              بەشداری لە VIP (٥,٠٠٠ دینار)
            </Button>
          </Link>
        ) : (
          <div
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(226, 183, 85, 0.1)',
              border: '1px solid rgba(226, 183, 85, 0.3)',
              color: '#E2B755',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle size={16} />
            <span>VIP چالاکە تا بەرواری {user.vipExpiresAt || '2027-01-01'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
