import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Users,
  CreditCard,
  Layers,
  Sliders,
  MessageSquare,
  Settings,
  ShieldCheck,
  Bell,
  AlertTriangle,
  FileText,
  UserCheck,
  Trash2,
  LogOut,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/ui/Logo';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isOwner, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAdminLogout = async () => {
    await logout();
    navigate('/');
  };

  // Automatically close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Route protection: Only azhanako1999@gmail.com is allowed into Admin
  const isSuperAdmin = user?.email?.toLowerCase().trim() === 'azhanako1999@gmail.com';
  if (!user || !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const standardNavItems = [
    { label: 'داشبۆرد', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'بەڕێوەبردنی فیلمەکان', path: '/admin/movies', icon: <Film size={18} /> },
    { label: 'ڕاپۆرتەکانی فیلم (Reports)', path: '/admin/reports', icon: <AlertTriangle size={18} /> },
    { label: 'بەکارهێنەران و ئەندامان', path: '/admin/users', icon: <Users size={18} /> },
    { label: 'ستاف و بەڕێوەبەران', path: '/admin/staff', icon: <ShieldCheck size={18} /> },
    { label: 'پارەدان و VIP', path: '/admin/payments', icon: <CreditCard size={18} /> },
    { label: 'هاوپۆلەکان / ژانەرەکان', path: '/admin/categories', icon: <Layers size={18} /> },
    { label: 'ڕێکخستنی سەرەکی', path: '/admin/homepage', icon: <Sliders size={18} /> },
    { label: 'هەڵسەنگاندنەکان', path: '/admin/reviews', icon: <MessageSquare size={18} /> },
    { label: 'ئاگادارییەکان', path: '/admin/notifications', icon: <Bell size={18} /> },
    { label: 'تۆماری چالاکییەکان', path: '/admin/logs', icon: <FileText size={18} /> },
    { label: 'ڕێکخستنەکانی سیستەم', path: '/admin/settings', icon: <Settings size={18} /> }
  ];

  const ownerNavItems = [
    { label: 'بەڕێوەبەرەکان (Admins)', path: '/admin/admins', icon: <UserCheck size={18} /> },
    { label: 'خاوێنکردنەوەی داتابەیس', path: '/admin/cleanup', icon: <Trash2 size={18} /> }
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#08090C', color: '#fff', direction: 'rtl' }}>
      {/* Mobile Top Header (< 1024px) */}
      <header className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              cursor: 'pointer'
            }}
            aria-label="Toggle admin drawer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Logo size={28} showText={false} />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>پانێڵی بەڕێوەبەرایەتی</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            style={{
              height: '36px',
              padding: '0 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-silver)',
              fontSize: '11px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>ماڵپەڕ</span>
            <ExternalLink size={12} />
          </a>
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={user?.name || 'Admin'}
            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
          />
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      <div
        className={`admin-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Admin Sidebar (Docked on desktop, off-canvas drawer on mobile/tablet) */}
        <aside
          className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}
          style={{
            backgroundColor: '#0F1015',
            borderLeft: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Brand Header */}
          <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Logo size={32} showText={true} />
              <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, marginTop: '8px', paddingRight: '4px' }}>
                سەنتەری کۆنترۆڵ و بەڕێوەبەرایەتی
              </div>
            </div>
            <button
              className="admin-sidebar-close"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                width: '40px',
                height: '40px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Links Navigation */}
          <div style={{ padding: '16px 12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px 12px' }}>
              بەشی سەرەکی
            </div>
            {standardNavItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    minHeight: '44px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    fontWeight: active ? 700 : 500,
                    backgroundColor: active ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    color: active ? '#38bdf8' : 'var(--text-silver)',
                    borderRight: active ? '3px solid #38bdf8' : '3px solid transparent'
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Owner-Only Section */}
            {isOwner && (
              <>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#E2B755', padding: '16px 12px 6px' }}>
                  دەسەڵاتی تایبەت بە خاوەن (OWNER)
                </div>
                {ownerNavItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        minHeight: '44px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        fontWeight: active ? 700 : 500,
                        backgroundColor: active ? 'rgba(226, 183, 85, 0.12)' : 'transparent',
                        color: active ? '#E2B755' : 'var(--text-silver)',
                        borderRight: active ? '3px solid #E2B755' : '3px solid transparent'
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* User Card & Sign Out */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={user?.name || 'Admin'}
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {user?.name || 'بەڕێوەبەر'}
                </div>
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: isOwner ? '#E2B755' : '#38bdf8'
                  }}
                >
                  {isOwner ? '👑 خاوەن (Owner)' : '🛡️ بەڕێوەبەر (Admin)'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  minHeight: '44px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-silver)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <span>سەیرکردنی ماڵپەڕ</span>
                <ExternalLink size={13} />
              </a>
              <button
                onClick={handleAdminLogout}
                style={{
                  padding: '8px 14px',
                  minHeight: '44px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="چوونەدەرەوە"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Admin Content Area (Auto responsive width and margin) */}
        <main
          className="admin-main"
          style={{
            flex: 1,
            minHeight: '100vh',
            backgroundColor: '#08090C'
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

