import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  RotateCw,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Film,
  Search,
  User,
  Shield,
  CreditCard,
  Layers,
  Sparkles,
  Wifi,
  ChevronRight
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

interface DevicePreset {
  id: string;
  name: string;
  type: 'phone' | 'tablet';
  width: number;
  height: number;
  icon: 'phone' | 'tablet';
  tag: string;
}

const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'iphone15',
    name: 'iPhone 15 Pro',
    type: 'phone',
    width: 393,
    height: 852,
    icon: 'phone',
    tag: 'مۆبایلی ستاندارد'
  },
  {
    id: 'small_phone',
    name: 'Small Phone (iPhone SE)',
    type: 'phone',
    width: 320,
    height: 640,
    icon: 'phone',
    tag: 'مۆبایلی بچووک (320px)'
  },
  {
    id: 'galaxy_s24',
    name: 'Galaxy S24 / Android',
    type: 'phone',
    width: 360,
    height: 780,
    icon: 'phone',
    tag: 'ئەندرۆید 360px'
  },
  {
    id: 'ipad_mini',
    name: 'iPad Mini / Tablet',
    type: 'tablet',
    width: 768,
    height: 1024,
    icon: 'tablet',
    tag: 'تابلێتی ئاسایی (768px)'
  },
  {
    id: 'ipad_pro',
    name: 'iPad Pro / Big Tablet',
    type: 'tablet',
    width: 834,
    height: 1194,
    icon: 'tablet',
    tag: 'تابلێتی گەورە (834px)'
  }
];

const PAGES = [
  { path: '/', label: 'سەرەکی (Home)', icon: <Film size={15} /> },
  { path: '/movies', label: 'کەتەلۆگ (Movies)', icon: <Layers size={15} /> },
  { path: '/search', label: 'گەڕان (Search & Filters)', icon: <Search size={15} /> },
  { path: '/movie/m_demo_1', label: 'پەڕەی فیلم (Details + CTA)', icon: <Film size={15} color="#38bdf8" /> },
  { path: '/watch/m_demo_1', label: 'پلەیەر (Video Player)', icon: <Sparkles size={15} color="#eab308" /> },
  { path: '/account', label: 'پرۆفایل (Account)', icon: <User size={15} /> },
  { path: '/payment', label: 'پارەدان (VIP Payment)', icon: <CreditCard size={15} color="#E2B755" /> },
  { path: '/admin', label: 'بەڕێوەبەرایەتی (Admin Drawer)', icon: <Shield size={15} color="#ef4444" /> }
];

export const DevicePreview: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [customPath, setCustomPath] = useState('/');
  const [zoomScale, setZoomScale] = useState(0.78);
  const [viewMode, setViewMode] = useState<'single' | 'dual'>('single');
  const [reloadKey, setReloadKey] = useState(0);
  const [showNetworkInfo, setShowNetworkInfo] = useState(false);

  const activeWidth = isLandscape ? selectedDevice.height : selectedDevice.width;
  const activeHeight = isLandscape ? selectedDevice.width : selectedDevice.height;

  const handlePageSelect = (path: string) => {
    setCurrentPath(path);
    setCustomPath(path);
    setReloadKey((prev) => prev + 1);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPath.trim()) {
      const normalized = customPath.startsWith('/') ? customPath : `/${customPath}`;
      setCurrentPath(normalized);
      setReloadKey((prev) => prev + 1);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#050608',
        color: '#fff',
        direction: 'rtl',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* Top Header Controls */}
      <header
        style={{
          backgroundColor: '#0C0E14',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        {/* Brand & Studio Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <Logo size={28} showText={true} />
          </a>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>ستۆدیۆی پشکنینی مۆبایل و تابلێت</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.15)' }}>
                LIVE PREVIEW
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              پشکنینی هەردوو دیزاینی Mobile و Tablet بە کاتی ڕاستەقینە
            </div>
          </div>
        </div>

        {/* Device Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
            <button
              onClick={() => setViewMode('single')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: viewMode === 'single' ? '#38bdf8' : 'transparent',
                color: viewMode === 'single' ? '#08090C' : 'var(--text-silver)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              یەک ئامێر (Single)
            </button>
            <button
              onClick={() => setViewMode('dual')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: viewMode === 'dual' ? '#38bdf8' : 'transparent',
                color: viewMode === 'dual' ? '#08090C' : 'var(--text-silver)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              هەردووکی پێکەوە (Mobile + Tablet)
            </button>
          </div>

          {viewMode === 'single' && (
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
              {DEVICE_PRESETS.map((dev) => {
                const isSelected = selectedDevice.id === dev.id;
                return (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedDevice(dev)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      color: isSelected ? '#fff' : 'var(--text-silver)',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer'
                    }}
                    title={`${dev.name} (${dev.width}×${dev.height})`}
                  >
                    {dev.icon === 'phone' ? <Smartphone size={14} /> : <Tablet size={14} />}
                    <span>{dev.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Rotate Button */}
          {viewMode === 'single' && (
            <button
              onClick={() => setIsLandscape((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isLandscape ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                color: isLandscape ? '#f59e0b' : 'var(--text-silver)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="سوڕاندنی ئامێر (Portrait / Landscape)"
            >
              <RotateCw size={14} />
              <span>{isLandscape ? 'Landscape (ئاسۆیی)' : 'Portrait (ستوونی)'}</span>
            </button>
          )}

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
            <button
              onClick={() => setZoomScale((s) => Math.max(0.4, Number((s - 0.08).toFixed(2))))}
              style={{ padding: '6px 8px', border: 'none', background: 'none', color: '#fff', cursor: 'pointer' }}
              title="بچووککردنەوە"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '11px', fontWeight: 700, minWidth: '38px', textAlign: 'center', color: '#38bdf8' }}>
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((s) => Math.min(1.0, Number((s + 0.08).toFixed(2))))}
              style={{ padding: '6px 8px', border: 'none', background: 'none', color: '#fff', cursor: 'pointer' }}
              title="گەورەکردنەوە"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Refresh Iframe */}
          <button
            onClick={() => setReloadKey((prev) => prev + 1)}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#fff',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
            title="نوێکردنەوەی ناوەڕۆک"
          >
            <RefreshCw size={14} />
          </button>

          {/* Wi-Fi Real Phone Link Info */}
          <button
            onClick={() => setShowNetworkInfo((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Wifi size={14} />
            <span>مۆبایلی ڕاستەقینە (Wi-Fi)</span>
          </button>
        </div>
      </header>

      {/* Real Phone Wi-Fi Helper Banner (Dropdown) */}
      {showNetworkInfo && (
        <div
          style={{
            backgroundColor: '#0F131C',
            borderBottom: '1px solid rgba(52, 211, 153, 0.3)',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(52, 211, 153, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399'
              }}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                دەتوانیت لەسەر مۆبایل یان ئایپادی ڕاستەقینەی خۆت ڕاستەوخۆ بیکەیتەوە!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-silver)', marginTop: '2px' }}>
                تەنها مۆبایلەکەت و کۆمپیوتەرەکەت بخەرە سەر هەمان تۆڕی Wi-Fi، پاشان لە مۆبایلەکەتەوە بڕۆ بۆ:
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <code
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                color: '#34d399',
                fontSize: '14px',
                fontWeight: 700,
                direction: 'ltr',
                fontFamily: 'monospace'
              }}
            >
              http://192.168.150.101:5173
            </code>
            <a
              href="http://192.168.150.101:5173"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '12px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>کردنەوە</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}

      {/* Quick Page Jump Navigation Bar */}
      <div
        style={{
          backgroundColor: '#090B10',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto'
        }}
        className="touch-scroll-x no-scrollbar"
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          پەڕەکان:
        </span>
        {PAGES.map((page) => {
          const isActive = currentPath === page.path;
          return (
            <button
              key={page.path}
              onClick={() => handlePageSelect(page.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                backgroundColor: isActive ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                color: isActive ? '#38bdf8' : 'var(--text-silver)',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {page.icon}
              <span>{page.label}</span>
            </button>
          );
        })}

        {/* Direct URL input */}
        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <input
            type="text"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="/movie/m_demo_1"
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '12px',
              width: '150px',
              direction: 'ltr'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: '#38bdf8',
              color: '#08090C',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            بڕۆ
          </button>
        </form>
      </div>

      {/* Main Interactive Stage Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px 20px',
          overflow: 'auto',
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.04) 0%, transparent 60%),
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 28px 28px, 28px 28px'
        }}
      >
        {viewMode === 'single' ? (
          /* Single Device Stage */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {/* Device Info Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '6px 14px',
                borderRadius: '999px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px'
              }}
            >
              <span style={{ fontWeight: 800, color: '#fff' }}>{selectedDevice.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
                {activeWidth}px × {activeHeight}px
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-silver)' }}>{selectedDevice.tag}</span>
            </div>

            {/* Simulated Device Frame */}
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div
                style={{
                  width: `${activeWidth}px`,
                  height: `${activeHeight}px`,
                  borderRadius: selectedDevice.type === 'phone' ? '46px' : '28px',
                  border: '12px solid #1c1f2b',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  backgroundColor: '#000',
                  overflow: 'hidden'
                }}
              >
                {/* Simulated Notch / Dynamic Island for Phones */}
                {selectedDevice.type === 'phone' && !isLandscape && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '105px',
                      height: '24px',
                      backgroundColor: '#000',
                      borderRadius: '20px',
                      zIndex: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      padding: '0 10px',
                      gap: '6px'
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0a0d18' }} />
                  </div>
                )}

                {/* The Embedded RWANIN Web Application */}
                <iframe
                  key={`${reloadKey}-${selectedDevice.id}-${currentPath}-${isLandscape}`}
                  src={currentPath}
                  title="RWANIN Mobile Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#08090C'
                  }}
                />

                {/* Simulated Home Indicator Bar for iPhone */}
                {selectedDevice.type === 'phone' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '130px',
                      height: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '4px',
                      zIndex: 9999,
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Dual Side-by-Side View (Mobile + Tablet Simultaneously) */
          <div style={{ display: 'flex', gap: '36px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Phone Column (375px) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontSize: '12px',
                  color: '#38bdf8',
                  fontWeight: 700
                }}
              >
                📱 مۆبایل (Phone - 375px × 760px)
              </div>

              <div
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top center'
                }}
              >
                <div
                  style={{
                    width: '375px',
                    height: '760px',
                    borderRadius: '40px',
                    border: '10px solid #1c1f2b',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
                    backgroundColor: '#000',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <iframe
                    key={`dual-phone-${reloadKey}-${currentPath}`}
                    src={currentPath}
                    title="Mobile View"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Tablet Column (768px) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(226, 183, 85, 0.12)',
                  border: '1px solid rgba(226, 183, 85, 0.3)',
                  fontSize: '12px',
                  color: '#E2B755',
                  fontWeight: 700
                }}
              >
                📟 تابلێت (Tablet - 768px × 1024px)
              </div>

              <div
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top center'
                }}
              >
                <div
                  style={{
                    width: '768px',
                    height: '1024px',
                    borderRadius: '26px',
                    border: '12px solid #1c1f2b',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
                    backgroundColor: '#000',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <iframe
                    key={`dual-tablet-${reloadKey}-${currentPath}`}
                    src={currentPath}
                    title="Tablet View"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
