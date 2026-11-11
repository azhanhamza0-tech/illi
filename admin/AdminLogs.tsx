import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { AdminLog } from '../types/movie';
import { ShieldCheck, Clock, FileText, Search, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    const data = await adminService.getLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-content-pad" style={{ padding: 'clamp(14px, 3.5vw, 32px)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
            تۆماری چالاکییەکانی بەڕێوەبەرایەتی (Admin Logs)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            تۆمارکردنی هەموو کردارەکانی ئەدمین و خاوەن لە داتابەیسی Firestore بە کات و سات.
          </p>
        </div>

        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={loadLogs}>
          نوێکردنەوەی لیست
        </Button>
      </div>

      {/* Search Filter */}
      <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <Search size={18} color="var(--text-muted)" style={{ marginLeft: '10px' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="گەڕان بەپێی کردار، ئیمەیڵ یان وەسف..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '13.5px',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div
        className="admin-table-container"
      >
        <table style={{ minWidth: '760px', width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ئیمەیڵی ئەدمین</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ڕۆڵ</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>کردار</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>جۆری ئامانج</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>وەسف و وردەکاری</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>کات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  خەریکی بارکردنی تۆمارەکانە...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  هیچ چالاکییەک نەدۆزرایەوە.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                    {log.adminEmail}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor:
                          log.role === 'owner' ? 'rgba(226, 183, 85, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: log.role === 'owner' ? '#E2B755' : '#38bdf8'
                      }}
                    >
                      {log.role === 'owner' ? 'خاوەن (Owner)' : 'بەڕێوەبەر (Admin)'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#38bdf8' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-silver)' }}>
                    {log.targetType}
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-silver)', maxWidth: '300px' }}>
                    {log.description}
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {log.timestamp}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
