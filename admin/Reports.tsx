import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Trash2, ExternalLink, Filter, Search, Clock } from 'lucide-react';
import { reportService } from '../services/reportService';
import { MovieReport } from '../types/movie';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Link } from 'react-router-dom';

export const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<MovieReport[]>(() => reportService.getReports());
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = reportService.subscribe((updated) => {
      setReports(updated);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'pending' | 'resolved' | 'dismissed') => {
    try {
      await reportService.updateReportStatus(id, status);
      showToast(status === 'resolved' ? 'ڕاپۆرت وەک چارەسەرکراو دیاریکرا' : 'ڕاپۆرت ڕەتکرایەوە', 'success');
    } catch {
      showToast('کێشەیەک ڕوویدا', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('دڵنیایت لە سڕینەوەی ئەم ڕاپۆرتە؟')) {
      try {
        await reportService.deleteReport(id);
        showToast('ڕاپۆرت بە سەرکەوتوویی سڕایەوە', 'info');
      } catch {
        showToast('کێشەیەک لە سڕینەوە ڕوویدا', 'error');
      }
    }
  };

  const filteredReports = reports.filter((r) => {
    if (activeFilter !== 'all' && r.status !== activeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.movieTitle.toLowerCase().includes(q) ||
      (r.reasonText && r.reasonText.toLowerCase().includes(q)) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
      (r.details && r.details.toLowerCase().includes(q))
    );
  });

  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  return (
    <div className="admin-content-pad" style={{ padding: 'clamp(14px, 3.5vw, 32px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
          <AlertTriangle size={18} />
          <span>سەنتەری ڕاپۆرتەکانی بینەران</span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
          بەڕێوەبردنی کێشە و ڕاپۆرتەکانی فیلم (Movie Reports)
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          پشکنین و چارەسەرکردنی ئەو کێشانەی بینەران لە کاتی سەیرکردنی فیلم و زنجیرەکان تۆماریان کردووە.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ padding: '18px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>کۆی ڕاپۆرتەکان</span>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', marginTop: '6px' }}>{totalCount}</div>
        </div>
        <div style={{ padding: '18px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 700 }}>چاوەڕوانکراو (پێویستی بە چاککردن)</span>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#f59e0b', marginTop: '6px' }}>{pendingCount}</div>
        </div>
        <div style={{ padding: '18px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
          <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 700 }}>چارەسەرکراوەکان</span>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#34d399', marginTop: '6px' }}>{resolvedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', minWidth: '300px', flex: 1 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەپێی ناوی فیلم، هۆکار، ئیمەیڵ..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'هەمووان', count: totalCount },
            { id: 'pending', label: 'چاوەڕوانکراو', count: pendingCount },
            { id: 'resolved', label: 'چارەسەرکراو', count: resolvedCount }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: activeFilter === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
                color: activeFilter === tab.id ? '#38bdf8' : 'var(--text-silver)',
                border: activeFilter === tab.id ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{tab.label}</span>
              <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="admin-table-container">
        {filteredReports.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={40} color="#34d399" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>هیچ ڕاپۆرتێک نەدۆزرایەوە</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>هەموو فیلم و پەخشەکان بە بێ کێشە کار دەکەن.</div>
          </div>
        ) : (
          <table style={{ minWidth: '760px', width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>فیلم</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>هۆکاری کێشە</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>وردەکاری بینەر</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>نێرەر و کات</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>دۆخ</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>کردارەکان</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {report.moviePoster ? (
                        <img src={report.moviePoster} alt="" style={{ width: '36px', height: '52px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '36px', height: '52px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '14px' }}>{report.movieTitle}</div>
                        <Link
                          to={`/movie/${report.movieId}`}
                          target="_blank"
                          style={{ fontSize: '11.5px', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                        >
                          بینینی پەڕەی فیلم <ExternalLink size={11} />
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor:
                          report.reason === 'video_broken'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : report.reason === 'audio_sub_issue'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(56, 189, 248, 0.15)',
                        color:
                          report.reason === 'video_broken'
                            ? '#ef4444'
                            : report.reason === 'audio_sub_issue'
                            ? '#f59e0b'
                            : '#38bdf8'
                      }}
                    >
                      {report.reasonText}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', maxWidth: '280px', color: 'var(--text-silver)', fontSize: '12.5px' }}>
                    {report.details || 'هیچ ڕوونکردنەوەیەک نەنووسراوە'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '13px', color: '#fff' }}>{report.userEmail}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      {new Date(report.createdAt).toLocaleDateString('ku')}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {report.status === 'resolved' ? (
                      <span style={{ fontSize: '11.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                        ✓ چارەسەرکراو
                      </span>
                    ) : (
                      <span style={{ fontSize: '11.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        ⏳ چاوەڕوانکراو
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {report.status === 'pending' ? (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'resolved')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(52, 211, 153, 0.15)',
                            border: '1px solid rgba(52, 211, 153, 0.4)',
                            color: '#34d399',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <CheckCircle2 size={14} /> چارەسەرکرا
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'pending')}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          گەڕاندنەوە بۆ چاوەڕوان
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(report.id)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          cursor: 'pointer'
                        }}
                        title="سڕینەوەی ڕاپۆرت"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
