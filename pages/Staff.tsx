import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { staffService } from '../services/staffService';
import { StaffMember } from '../types/movie';
import { ArrowRight, ShieldCheck, Users, Award, Send, Instagram, Mail, Crown, Code2, Languages, Sparkles } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

export const Staff: React.FC = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'owner_admin' | 'translator' | 'developer'>('all');

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      const data = await staffService.getStaff();
      setStaff(data);
      setLoading(false);
    };
    fetchStaff();
  }, []);

  const filteredStaff = staff.filter((m) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'owner_admin') return m.category === 'owner' || m.category === 'admin';
    if (activeTab === 'translator') return m.category === 'translator';
    if (activeTab === 'developer') return m.category === 'developer';
    return true;
  });

  const getBadgeStyle = (category: StaffMember['category']) => {
    switch (category) {
      case 'owner':
        return {
          bg: 'rgba(226, 183, 85, 0.15)',
          border: '1px solid rgba(226, 183, 85, 0.4)',
          color: '#E2B755',
          icon: <Crown size={14} />
        };
      case 'admin':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          color: '#38bdf8',
          icon: <ShieldCheck size={14} />
        };
      case 'translator':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          color: '#c084fc',
          icon: <Languages size={14} />
        };
      case 'developer':
        return {
          bg: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          color: '#34d399',
          icon: <Code2 size={14} />
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid var(--border-subtle)',
          color: '#fff',
          icon: <Award size={14} />
        };
    }
  };

  return (
    <PageContainer>
    <div style={{ minHeight: '80vh', padding: 'clamp(16px, 3.5vw, 32px) clamp(12px, 3.5vw, 24px) 80px', maxWidth: '1280px', margin: '0 auto', direction: 'rtl' }}>
      {/* Top Header Row with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-subtle)',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation'
          }}
          className="touch-target"
          title="گەڕانەوە بۆ لاپەڕەی پێشوو"
        >
          <ArrowRight size={17} />
          <span>گەڕانەوە</span>
        </button>

        <Logo size="sm" />
      </div>

      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(215, 217, 223, 0.08)', border: '1px solid rgba(215, 217, 223, 0.2)', marginBottom: '16px' }}>
          <Sparkles size={15} color="#D7D9DF" />
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-silver)' }}>ستاف و بەڕێوەبەرایەتی فەرمی</span>
        </div>

        <h1 style={{ fontSize: 'clamp(22px, 5.5vw, 36px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '10px', background: 'var(--silver-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.25 }}>
          تیمی بەڕێوەبەرایەتی و ستافی ڕوانین
        </h1>
        <p style={{ fontSize: 'clamp(13px, 2.5vw, 15px)', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto', lineHeight: 1.65 }}>
          ئەو کەسانەی بە شەو و ڕۆژ کاردەکەن بۆ پێشکەشکردنی باشترین فیلم، زنجیرە و ئەنیمێ بە ژێرنووسی کوردی و بەرزترین کوالیتی.
        </p>

        {/* Filter Pills */}
        <div
          className="staff-tabs-ribbon"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '24px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            paddingBottom: '8px'
          }}
        >
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'all' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'all' ? '#08090C' : 'var(--text-silver)',
              border: activeTab === 'all' ? '1px solid #FFFFFF' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            هەموو ئەندامان ({staff.length})
          </button>
          <button
            onClick={() => setActiveTab('owner_admin')}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'owner_admin' ? '#E2B755' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'owner_admin' ? '#08090C' : 'var(--text-silver)',
              border: activeTab === 'owner_admin' ? '1px solid #E2B755' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            خاوەن و بەڕێوەبەران
          </button>
          <button
            onClick={() => setActiveTab('translator')}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'translator' ? '#c084fc' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'translator' ? '#08090C' : 'var(--text-silver)',
              border: activeTab === 'translator' ? '1px solid #c084fc' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            وەرگێڕان
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'developer' ? '#34d399' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'developer' ? '#08090C' : 'var(--text-silver)',
              border: activeTab === 'developer' ? '1px solid #34d399' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            بەشی تەکنیکی و سیستم
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          خەریکی هێنانی زانیاری ستافە...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: '20px'
          }}
        >
          {filteredStaff.map((member) => {
            const badgeStyle = getBadgeStyle(member.category);
            return (
              <div
                key={member.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'transform 0.25s ease, border-color 0.25s ease'
                }}
              >
                {/* Glow Background Indicator */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: badgeStyle.color,
                    filter: 'blur(70px)',
                    opacity: 0.12,
                    pointerEvents: 'none'
                  }}
                />

                {/* Avatar with Ring */}
                <div
                  style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    marginBottom: '18px'
                  }}
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `3px solid ${badgeStyle.color}`,
                      boxShadow: `0 0 20px ${badgeStyle.color}30`
                    }}
                  />
                  {member.category === 'owner' && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#E2B755',
                        color: '#08090C',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                      }}
                    >
                      <Crown size={14} />
                    </div>
                  )}
                </div>

                {/* Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: badgeStyle.bg,
                    border: badgeStyle.border,
                    color: badgeStyle.color,
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    marginBottom: '10px'
                  }}
                >
                  {badgeStyle.icon}
                  <span>{member.badge || member.category.toUpperCase()}</span>
                </div>

                {/* Name & Role Title */}
                <h3 style={{ fontSize: '19px', fontWeight: 900, marginBottom: '4px', color: '#fff' }}>
                  {member.name}
                </h3>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-silver)', marginBottom: '14px' }}>
                  {member.roleTitle}
                </div>

                {/* Bio */}
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px', flex: 1 }}>
                  {member.bio}
                </p>

                {/* Social / Contact Links */}
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', width: '100%', justifyContent: 'center' }}>
                  {member.telegram && (
                    <a
                      href={member.telegram.startsWith('http') ? member.telegram : `https://t.me/${member.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        color: '#38bdf8',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="تێلیگرام"
                    >
                      <Send size={13} />
                      <span>تێلیگرام</span>
                    </a>
                  )}

                  {member.instagram && (
                    <a
                      href={member.instagram.startsWith('http') ? member.instagram : `https://instagram.com/${member.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        border: '1px solid rgba(236, 72, 153, 0.25)',
                        color: '#f472b6',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="ئینستاگرام"
                    >
                      <Instagram size={13} />
                      <span>ئینستا</span>
                    </a>
                  )}

                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-silver)',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="ئیمەیڵ"
                    >
                      <Mail size={13} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join Staff Call to action */}
      <div
        style={{
          marginTop: '60px',
          padding: '36px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, rgba(215, 217, 223, 0.08) 0%, rgba(15, 16, 21, 0.8) 100%)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff' }}>
          <Users size={24} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
          دەتەوێت ببیتە بەشێک لە تیمی ڕوانین؟
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.6 }}>
          ئەگەر شارەزایت لە وەرگێڕانی زمانی ئینگلیزی، کۆری یان ژاپۆنی، یاخود دیزاین و پەرەپێدان، دەرگای پلاتفۆرمی ڕوانین کراوەیە!
        </p>
        <a
          href="https://t.me/rwanin_stream"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 28px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--silver-gradient)',
            color: '#08090C',
            fontWeight: 800,
            fontSize: '14px',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-silver)'
          }}
        >
          <Send size={16} />
          <span>پەیوەندیکردن لەگەڵ بەڕێوەبەرایەتی</span>
        </a>
      </div>
    </div>
    </PageContainer>
  );
};
