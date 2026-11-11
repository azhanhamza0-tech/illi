import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import {
  Crown,
  Check,
  ShieldCheck,
  Zap,
  Film,
  Tv,
  ArrowRight,
  Clock,
  Sparkles,
  Smartphone,
  Gift
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type PlanType = 'standard' | 'vip' | 'metal';

export const VIPPage: React.FC = () => {
  const navigate = useNavigate();
  const { isVIP } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('vip');

  const plans = {
    standard: {
      id: 'standard',
      name: 'ستاندارد',
      nameEn: 'Standard',
      badge: '✓ چالاکە',
      subtitle: 'بێبەرامبەر (Complimentary)',
      description: 'ئەزموونی بنەڕەتی بۆ تاقیکردنەوە و بینینی فیلمە گشتییەکان.',
      price: '0',
      period: 'دینار / مانگانە',
      ctaText: isVIP ? 'گەڕانەوە بۆ بینینی فیلمەکان' : 'دەستپێکردنی بێبەرامبەر',
      ctaAction: () => navigate('/'),
      features: [
        {
          icon: <Clock size={20} />,
          title: '٥٠ خولەک کاتی ڕۆژانە',
          desc: 'کاتی دیاریکراو ڕۆژانە بۆ تاقیکردنەوە و بینینی بەرهەمە گشتییەکان.'
        },
        {
          icon: <Film size={20} />,
          title: 'کوالێتی ستاندارد 1080p',
          desc: 'کوالێتی گونجاو و خێرا بۆ هەموو جۆرە خێراییەکی ئینتەرنێت.'
        },
        {
          icon: <Tv size={20} />,
          title: 'ئەرشیفی بەرهەمە گشتییەکان',
          desc: 'دەستگەیشتن بە سەدان فیلم و درامای ژێرنووسکراوی کوردی.'
        }
      ]
    },
    vip: {
      id: 'vip',
      name: 'ڕوانین VIP',
      nameEn: 'VIP Premium',
      badge: '✓ باوترین',
      subtitle: '5,000 دیناری عێراقی / مانگانە',
      description: 'سەیرکردنی سینەمایی بە کوالێتی 4K Ultra HD، تەواو بێ سنوور و بەبێ هیچ ڕیکلامێک.',
      price: '5,000',
      period: 'دینار / مانگانە',
      ctaText: 'بەردەوامبوون بۆ پارەدان (5,000 IQD)',
      ctaAction: () => navigate('/payment'),
      features: [
        {
          icon: <Zap size={20} />,
          title: 'سەیرکردنی تەواو بێ سنوور',
          desc: 'بەبێ سنووردارکردنی 50 خولەکی ڕۆژانە، چەندت بوێت بێ پچڕان تەماشا بکە.'
        },
        {
          icon: <Crown size={20} />,
          title: 'کوالێتی 4K Ultra HD & HDR',
          desc: 'بەرزترین ڕوونی و دەنگی سینەمایی لەگەڵ تایبەتترین ڕەنگەکان.'
        },
        {
          icon: <ShieldCheck size={20} />,
          title: 'تەواو بەبێ ڕیکلام (100% Ad-Free)',
          desc: 'هیچ سپۆنسەر و ڕیکلامێکی بێزارکەر لە کاتی سەیرکردندا نابینیت.'
        },
        {
          icon: <Smartphone size={20} />,
          title: 'پەخشی هاوکات لەسەر هەموو ئامێرەکان',
          desc: 'لەسەر مۆبایل، کۆمپیوتەر، تابلێت و تەلەفزیۆنی زیرەک بە ئاسانی کاردەکات.'
        }
      ]
    },
    metal: {
      id: 'metal',
      name: 'VIP مێتاڵ (ساڵانە)',
      nameEn: 'VIP Metal',
      badge: '✓ ٢٠٪ داشکاندن',
      subtitle: '48,000 دینار / ساڵانە',
      description: 'تەواوی ئیمتیازاتی VIP بۆ ماوەی ساڵێک + ٢ مانگ دیاری بەخۆڕایی.',
      price: '48,000',
      period: 'دینار / ساڵانە',
      ctaText: 'بەردەوامبوون بۆ پارەدانی ساڵانە (48,000 IQD)',
      ctaAction: () => navigate('/payment?plan=yearly'),
      features: [
        {
          icon: <Sparkles size={20} />,
          title: 'تەواوی تایبەتمەندییەکانی VIP',
          desc: 'کوالێتی 4K، بێ ڕیکلام و بێ سنووردارکردنی کات بۆ ماوەی ساڵێکی تەواو.'
        },
        {
          icon: <Gift size={20} />,
          title: '٢ مانگ بە دیاری بێبەرامبەر',
          desc: 'تەنها پارەی ١٠ مانگ دەدەیت و ١٢ مانگی تەواو بەکاردەهێنیت (١٢،٠٠٠ دینار پاشەکەوت).'
        },
        {
          icon: <Crown size={20} />,
          title: 'پشتیوانی خێرا و تایبەتی VIP',
          desc: 'وەڵامدانەوەی خێرا و دەستبەجێ لەلایەن تیمی پشتیوانی پلاتفۆرمەوە.'
        }
      ]
    }
  };

  const current = plans[selectedPlan];

  return (
    <PageContainer>
      <div
        style={{
          padding: 'clamp(16px, 3.5vw, 32px) var(--page-padding-x) 80px',
          maxWidth: '480px',
          margin: '0 auto',
          direction: 'rtl'
        }}
      >
        {/* Top Navigation Row (Skip / Back) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#E2B755',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              RWANIN MEMBERSHIP
            </span>
          </div>

          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 0',
              transition: 'opacity 0.2s ease'
            }}
          >
            پەڕاندن (Skip)
          </button>
        </div>

        {/* Large Header Title */}
        <h1
          style={{
            fontSize: 'clamp(32px, 6vw, 38px)',
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: '20px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display)'
          }}
        >
          هەڵبژاردنی پاکێج
        </h1>

        {/* Segmented Control / Pill Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            padding: '4px',
            borderRadius: '9999px',
            marginBottom: '22px',
            gap: '4px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {(['standard', 'vip', 'metal'] as PlanType[]).map((tabKey) => {
            const isActive = selectedPlan === tabKey;
            const tabName = tabKey === 'standard' ? 'ستاندارد' : tabKey === 'vip' ? 'ڕوانین VIP' : 'VIP مێتاڵ';
            return (
              <button
                key={tabKey}
                onClick={() => setSelectedPlan(tabKey)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0a0b10' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 4px 14px rgba(0, 0, 0, 0.18)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  textAlign: 'center'
                }}
              >
                {tabName}
              </button>
            );
          })}
        </div>

        {/* Active Plan Card (Revolut Aesthetic) */}
        <div
          style={{
            position: 'relative',
            borderRadius: '24px',
            padding: 'clamp(22px, 4vw, 28px)',
            backgroundColor: '#0d0e14',
            backgroundImage: `
              radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.32) 0%, transparent 55%),
              radial-gradient(circle at 15% 85%, rgba(226, 183, 85, 0.22) 0%, transparent 50%)
            `,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
            marginBottom: '28px',
            overflow: 'hidden'
          }}
        >
          {/* Card Top: Title & Active Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(26px, 5vw, 32px)',
                fontWeight: 900,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.02em'
              }}
            >
              {current.name}
            </h2>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 13px',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                color: '#08090C',
                fontSize: '12px',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)'
              }}
            >
              <Check size={13} strokeWidth={3} />
              <span>{current.badge}</span>
            </span>
          </div>

          {/* Subtitle / Price */}
          <div
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: '#E2B755',
              marginBottom: '6px'
            }}
          >
            {current.subtitle}
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '13.5px',
              color: 'rgba(255, 255, 255, 0.72)',
              margin: 0,
              lineHeight: 1.55
            }}
          >
            {current.description}
          </p>
        </div>

        {/* Section Heading: Top features */}
        <h3
          style={{
            fontSize: '19px',
            fontWeight: 800,
            marginBottom: '14px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em'
          }}
        >
          تایبەتمەندییە سەرەکییەکان (Top features)
        </h3>

        {/* Features Container Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            padding: '8px 20px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '26px'
          }}
        >
          {current.features.map((feat, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '16px 0',
                borderBottom: idx < current.features.length - 1 ? '1px solid var(--border-subtle)' : 'none'
              }}
            >
              {/* Icon Capsule */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E2B755',
                  flexShrink: 0
                }}
              >
                {feat.icon}
              </div>

              {/* Text Info */}
              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    margin: '0 0 3px 0',
                    color: 'var(--text-primary)'
                  }}
                >
                  {feat.title}
                </h4>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: 1.45
                  }}
                >
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Prominent Action Button (Pill Button) */}
        <button
          onClick={current.ctaAction}
          style={{
            width: '100%',
            height: '56px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: selectedPlan === 'standard' ? 'var(--bg-card)' : '#ffffff',
            color: selectedPlan === 'standard' ? 'var(--text-primary)' : '#08090C',
            fontSize: '16px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: selectedPlan === 'standard'
              ? '0 4px 14px rgba(0, 0, 0, 0.2)'
              : '0 8px 24px rgba(255, 255, 255, 0.16)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            marginBottom: '20px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span>{current.ctaText}</span>
        </button>

        {/* Footer Branding (Revolut / Mobbin Style) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 6px',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Crown size={14} color="#E2B755" />
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Rwanin VIP</span>
          </div>

          <div>
            <span>پارێزراوە لەگەڵ سیستمی پارەدانی متمانەپێکراو</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
