import React, { useState, useEffect } from 'react';
import {
  Users,
  Film,
  Crown,
  CreditCard,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  Database,
  RefreshCw
} from 'lucide-react';
import { movieService } from '../services/movieService';
import { paymentService } from '../services/paymentService';
import { userService } from '../services/userService';
import { adminService } from '../services/adminService';
import { dbSeeder } from '../services/dbSeeder';
import { Movie, User, PaymentRequest, AdminLog } from '../types/movie';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const m = movieService.getMovies();
      const u = await userService.getUsers();
      const p = await paymentService.getPayments();
      const l = await adminService.getLogs();

      setMovies(m);
      setUsers(u);
      setPayments(p);
      setLogs(l);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Compute stat card metrics
  const totalUsers = users.length;
  const vipUsers = users.filter((u) => u.package === 'VIP').length;
  const freeUsers = totalUsers - vipUsers;
  const totalMovies = movies.length;
  const totalViews = movies.reduce((acc, m) => acc + (m.views || 0), 0);
  const pendingPayments = payments.filter((p) => p.status === 'Pending').length;
  const approvedPayments = payments.filter((p) => p.status === 'Approved').length;
  const totalRevenueIQD = approvedPayments * 5000;

  const statCards = [
    {
      title: 'کۆی بەکارهێنەران',
      value: totalUsers,
      change: '+14%',
      icon: <Users size={22} color="#38bdf8" />,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.1)'
    },
    {
      title: 'بەکارهێنەرانی VIP',
      value: vipUsers,
      change: '+22%',
      icon: <Crown size={22} color="#E2B755" />,
      color: '#E2B755',
      bg: 'rgba(226, 183, 85, 0.1)'
    },
    {
      title: 'بەکارهێنەرانی Free',
      value: freeUsers,
      change: '+8%',
      icon: <Clock size={22} color="#94a3b8" />,
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.1)'
    },
    {
      title: 'کۆی فیلمەکان',
      value: totalMovies,
      change: '100% کارا',
      icon: <Film size={22} color="#a855f7" />,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.1)'
    },
    {
      title: 'کۆی بینینەکان',
      value: `${(totalViews / 1000).toFixed(1)}k`,
      change: '+31%',
      icon: <Eye size={22} color="#34d399" />,
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.1)'
    },
    {
      title: 'پارەدانە چاوەڕوانکراوەکان',
      value: pendingPayments,
      change: pendingPayments > 0 ? 'پێویستی بە وردبینییە' : 'پشکنراوە',
      icon: <CreditCard size={22} color="#f59e0b" />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)'
    },
    {
      title: 'داهات (IQD)',
      value: `${totalRevenueIQD.toLocaleString()} د.ع`,
      change: 'مانگی ئێستا',
      icon: <DollarSign size={22} color="#10b981" />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)'
    }
  ];

  const [syncing, setSyncing] = useState(false);
  const { showToast } = useToast();

  const handleSyncDatabase = async () => {
    setSyncing(true);
    showToast('دەستکرا بە سینک و پڕکردنەوەی داتابەیسی فایەربەیس...', 'info');
    try {
      const res = await dbSeeder.forceSyncAllCollections();
      showToast(`داتابەیس سینک کرا! ${res.count} بەڵگەنامە نوێکرانەوە`, 'success');
      const m = movieService.getMovies();
      const u = await userService.getUsers();
      const p = await paymentService.getPayments();
      setMovies(m);
      setUsers(u);
      setPayments(p);
    } catch (e: any) {
      showToast('هەڵە لە سینککردنی داتابەیس', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="admin-content-pad" style={{ padding: 'clamp(16px, 3vw, 32px)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '6px' }}>
            داشبۆردی بەڕێوەبەرایەتی ڕوانین
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            کورتەی ئامار، بەکارهێنەران، فیلمەکان و داهاتی پلاتفۆرمی ڕوانین.
          </p>
        </div>

        <div>
          <Button
            variant="secondary"
            onClick={handleSyncDatabase}
            disabled={syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              borderColor: 'rgba(56, 189, 248, 0.3)',
              color: '#38bdf8'
            }}
          >
            <RefreshCw size={16} className={syncing ? 'spin-animation' : ''} />
            <span>{syncing ? 'خەریکی سینککردنە...' : 'سینک و نوێکردنەوەی داتابەیس'}</span>
          </Button>
        </div>
      </div>

      {/* 7 Stat Cards matching Requirement 24 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
          gap: 'clamp(12px, 2vw, 18px)',
          marginBottom: '36px'
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.title}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 20px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {card.title}
              </span>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {card.icon}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '11.5px', color: card.color, fontWeight: 700 }}>
                {card.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Chart Simulation & Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
          gap: 'clamp(16px, 2.5vw, 24px)',
          marginBottom: '36px'
        }}
      >
        {/* Visual Chart Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>ئاماری بینەران و فرۆش (مانگانە)</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>گۆڕانکاری بەکارهێنەران و VIP</p>
            </div>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>2024</span>
          </div>

          {/* Bar Chart Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '16px', padding: '10px 0' }}>
            {[
              { month: 'کانوونی دووەم', h: '45%' },
              { month: 'شوبات', h: '60%' },
              { month: 'ئازار', h: '55%' },
              { month: 'نیسان', h: '75%' },
              { month: 'ئایار', h: '85%' },
              { month: 'حوزەیران', h: '95%' }
            ].map((bar) => (
              <div key={bar.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: bar.h,
                    background: 'linear-gradient(180deg, #38bdf8 0%, rgba(56, 189, 248, 0.2) 100%)',
                    borderRadius: '4px 4px 0 0'
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin Logs */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>تۆماری نوێترین چالاکییەکان</h3>
            <Link to="/admin/logs" style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
              بینینی هەمووی
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {logs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{log.action}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{log.adminEmail} • {log.targetType}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Tables: Recent Payments & Latest Movies */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 'clamp(16px, 2.5vw, 24px)'
        }}
      >
        {/* Recent Payments */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>نوێترین داواکارییەکانی پارەدان</h3>
            <Link to="/admin/payments" style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
              بەڕێوەبردن
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {payments.slice(0, 4).map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{p.userName}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {p.method} • {p.amount} • {p.userPhone}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor:
                      p.status === 'Approved'
                        ? 'rgba(52, 211, 153, 0.15)'
                        : p.status === 'Pending'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color:
                      p.status === 'Approved' ? '#34d399' : p.status === 'Pending' ? '#f59e0b' : '#ef4444'
                  }}
                >
                  {p.status === 'Approved' ? 'پەسەندکراو' : p.status === 'Pending' ? 'چاوەڕوانکراو' : 'ڕەتکراوە'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Movies */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>نوێترین فیلمە زیادکراوەکان</h3>
            <Link to="/admin/movies" style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
              کەتەلۆگ
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {movies.slice(0, 4).map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={m.poster}
                    alt={m.title}
                    style={{ width: '36px', height: '52px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{m.title}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {m.year} • {m.genre.slice(0, 2).join('، ')} • ⭐ {m.rating}
                    </div>
                  </div>
                </div>

                {m.isVIP ? (
                  <span className="badge-vip" style={{ fontSize: '10px', padding: '2px 8px' }}>
                    VIP
                  </span>
                ) : (
                  <span className="badge-hd" style={{ fontSize: '10px', padding: '2px 8px' }}>
                    FREE
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
