import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { adminService } from '../services/adminService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { AppNotification } from '../types/movie';
import { Bell, Send, Trash2, CheckCircle2, Film, Crown, Info } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

export const AdminNotifications: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New notification form
  const [title, setTitle] = useState('فیلمێکی نوێ بەردەستە');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'vip' | 'movie' | 'system'>('movie');

  const loadNotifications = async () => {
    setLoading(true);
    const data = await notificationService.getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast('تکایە ناونیشان و دەقی ئاگاداری بنووسە', 'error');
      return;
    }

    const created = await notificationService.createNotification({
      title: title.trim(),
      message: message.trim(),
      type
    });

    await adminService.logAction({
      adminId: user?.id || user?.uid || 'admin',
      adminEmail: user?.email || 'admin@rwanin.stream',
      role: user?.role === 'owner' ? 'owner' : 'admin',
      action: 'ناردنی ئاگاداری گشتی',
      targetType: 'ئاگاداری',
      targetId: created.id,
      description: `ئاگاداری (${created.title}) بۆ هەموو بەکارهێنەران نێردرا.`
    });

    setNotifications([created, ...notifications]);
    setModalOpen(false);
    setMessage('');
    showToast('ئاگادارییەکە بە سەرکەوتوویی بۆ بەکارهێنەران نێردرا!', 'success');
  };

  const handleDelete = async (id: string) => {
    await notificationService.deleteNotification(id);
    setNotifications(notifications.filter((n) => n.id !== id));
    showToast('ئاگاداری سڕایەوە', 'info');
  };

  const setSampleTemplate = (sampleTitle: string, sampleMsg: string, sampleType: any) => {
    setTitle(sampleTitle);
    setMessage(sampleMsg);
    setType(sampleType);
  };

  return (
    <div style={{ padding: '32px' }}>
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
            ئاگادارییەکان و پەخشی هەواڵ (Notifications)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            دروستکردن و ناردنی ئاگاداری بۆ سەرجەم بەکارهێنەرانی پلاتفۆرمی ڕوانین.
          </p>
        </div>

        <Button variant="silver" icon={<Send size={16} />} onClick={() => setModalOpen(true)}>
          ناردنی ئاگاداری نوێ
        </Button>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '800px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            خەریکی بارکردنی ئاگادارییەکانە...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            هیچ ئاگادارییەک نەنێردراوە.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor:
                      notif.type === 'vip'
                        ? 'rgba(226, 183, 85, 0.15)'
                        : notif.type === 'movie'
                        ? 'rgba(56, 189, 248, 0.15)'
                        : 'rgba(255, 255, 255, 0.08)',
                    color:
                      notif.type === 'vip' ? '#E2B755' : notif.type === 'movie' ? '#38bdf8' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {notif.type === 'vip' ? (
                    <Crown size={20} />
                  ) : notif.type === 'movie' ? (
                    <Film size={20} />
                  ) : (
                    <Bell size={20} />
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                    {notif.title}
                  </h4>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-silver)', lineHeight: 1.5, margin: 0 }}>
                    {notif.message}
                  </p>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {notif.time}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(notif.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px'
                }}
                title="سڕینەوە"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create Notification Modal: Requirement 30 */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="ناردنی ئاگاداری نوێ بۆ بینەران"
        maxWidth="540px"
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            نموونە ئامادەکراوەکان (کلیک بکە بۆ هەڵبژاردن):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              onClick={() =>
                setSampleTemplate(
                  'فیلمێکی نوێی Action زیادکرا',
                  'فیلمی نوێی ئاکشن لە پلاتفۆرمی ڕوانین بە کوالێتی 4K بەردەست کرا.',
                  'movie'
                )
              }
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              فیلمێکی نوێی Action زیادکرا
            </button>
            <button
              type="button"
              onClick={() =>
                setSampleTemplate(
                  'فیلمێکی نوێ بەردەستە',
                  'بینەری نوێترین بەرهەمی سینەمایی بن لەگەڵ ژێرنووسی کوردی.',
                  'movie'
                )
              }
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              فیلمێکی نوێ بەردەستە
            </button>
            <button
              type="button"
              onClick={() =>
                setSampleTemplate(
                  'VIP ـەکەت سبەی کۆتایی دێت',
                  'تکایە بەشداریکردنی VIP ـەکەت نوێ بکەرەوە بۆ ئەوەی بێ پچڕان لە سەیرکردن بەردەوام بیت.',
                  'vip'
                )
              }
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(226, 183, 85, 0.12)',
                border: '1px solid rgba(226, 183, 85, 0.3)',
                color: '#E2B755',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              VIP ـەکەت سبەی کۆتایی دێت
            </button>
          </div>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              ناونیشانی ئاگاداری
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              دەقی ئاگاداری
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="دەقی ئاگاداری لێرە بنووسە..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              جۆری ئاگاداری
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff'
              }}
            >
              <option value="movie" style={{ background: '#15161C' }}>فیلم یان زنجیرەی نوێ (Movie)</option>
              <option value="vip" style={{ background: '#15161C' }}>تایبەت بە VIP (VIP Notification)</option>
              <option value="info" style={{ background: '#15161C' }}>زانیاری گشتی (General Info)</option>
              <option value="system" style={{ background: '#15161C' }}>ئاگاداری سیستەم (System)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button type="submit" variant="silver" style={{ flex: 1 }}>
              ناردنی ئاگاداری
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              پاشگەزبوونەوە
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
