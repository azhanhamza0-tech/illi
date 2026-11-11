import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { adminService } from '../services/adminService';
import { userService } from '../services/userService';
import { ShieldCheck, UserPlus, Trash2, Ban, CheckCircle, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { AdminAccount } from '../types/movie';

export const AdminAdmins: React.FC = () => {
  const { user, isOwner } = useAuth();
  const { showToast } = useToast();

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await userService.getAdmins();
      setAdmins(data);
    } catch (e) {
      console.error(e);
      showToast('کێشەیەک لە هێنانی بەڕێوەبەران ڕوویدا', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  if (!isOwner) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#ef4444'
          }}
        >
          <AlertTriangle size={32} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>دەسەڵاتی سنووردار (تەنها خاوەن)</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          تەنها خاوەنی سەرەکی پلاتفۆرم (Owner) دەتوانێت بەڕێوەبەرانی تر زیاد یان کەم بکات.
        </p>
      </div>
    );
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    setSubmitting(true);
    try {
      const created = await userService.addAdmin({
        name: newName.trim(),
        email: newEmail.trim(),
        role: 'admin',
        status: 'active'
      });

      setAdmins((prev) => [...prev.filter((a) => a.email !== created.email), created]);
      setAddModalOpen(false);
      setNewEmail('');
      setNewName('');

      await adminService.logAction({
        adminId: user?.id || user?.uid || 'owner',
        adminEmail: user?.email || 'owner@rwanin.stream',
        role: 'owner',
        action: 'زیادکردنی بەڕێوەبەری نوێ',
        targetType: 'بەڕێوەبەر',
        targetId: created.id,
        description: `بەڕێوەبەری نوێ (${created.email}) لە داتابەیس پاشەکەوتکرا.`
      });

      showToast('بەڕێوەبەری نوێ لە داتابەیس تۆمارکرا و پاشەکەوت بوو!', 'success');
    } catch (err: any) {
      showToast(err.message || 'هەڵەیەک لە پاشەکەوتکردن ڕوویدا', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (adm: AdminAccount) => {
    if (adm.role === 'owner' || adm.email === 'rwanin1@gmail.com') {
      showToast('ناتوانیت هەژماری خاوەن ناچالاک بکەیت!', 'error');
      return;
    }

    const nextStatus = adm.status === 'active' ? 'disabled' : 'active';
    try {
      await userService.toggleAdminStatus(adm.id, nextStatus);
      setAdmins((prev) =>
        prev.map((a) => (a.id === adm.id ? { ...a, status: nextStatus } : a))
      );
      showToast(`دۆخی ئەدمین گۆڕدرا بۆ ${nextStatus === 'active' ? 'چالاک' : 'ناچالاک'}`, 'info');
    } catch (err: any) {
      showToast('گۆڕینی دۆخ سەرکەوتوو نەبوو', 'error');
    }
  };

  const handleDelete = async (id: string, email: string) => {
    const target = admins.find((a) => a.id === id);
    if (target?.role === 'owner' || email.toLowerCase() === 'rwanin1@gmail.com') {
      showToast('سڕینەوەی خاوەنی سەرەکی بە تەواوی قەدەغەیە!', 'error');
      return;
    }

    if (window.confirm(`دڵنیایت لە سڕینەوەی یەکجارەکی بەڕێوەبەر ${email} لە داتابەیس؟`)) {
      try {
        await userService.deleteAdmin(id, email);
        setAdmins((prev) => prev.filter((a) => a.id !== id));
        await adminService.logAction({
          adminId: user?.id || user?.uid || 'owner',
          adminEmail: user?.email || 'owner@rwanin.stream',
          role: 'owner',
          action: 'سڕینەوەی بەڕێوەبەر',
          targetType: 'بەڕێوەبەر',
          targetId: id,
          description: `ئەدمین ${email} لە داتابەیس سڕایەوە.`
        });
        showToast('بەڕێوەبەر بە تەواوی سڕایەوە و داتابەیس نوێکرایەوە', 'success');
      } catch (err: any) {
        showToast(err.message || 'سڕینەوە سەرکەوتوو نەبوو', 'error');
      }
    }
  };

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#E2B755', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
            <ShieldCheck size={16} />
            <span>بەشی تایبەت بە خاوەن (OWNER ONLY) — بەستراو بە داتابەیس</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
            بەڕێوەبردنی بەڕێوەبەرەکان (Admins Management)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            دیاریکردنی دەسەڵات، دروستکردنی ئەدمینی نوێ، و پاشەکەوتکردنی هەمیشەیی لە داتابەیس.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={loadAdmins}
          >
            نوێکردنەوە
          </Button>
          <Button
            variant="silver"
            icon={<UserPlus size={18} />}
            onClick={() => setAddModalOpen(true)}
          >
            زیادکردنی بەڕێوەبەری نوێ
          </Button>
        </div>
      </div>

      <div
        className="admin-table-container"
      >
        <table style={{ minWidth: '760px', width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ناو</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ئیمەیڵ</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>دەسەڵات / ڕۆڵ</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>دۆخ</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>بەرواری زیادکردن</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>کردارەکان</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((adm) => (
              <tr key={adm.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={adm.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={adm.name}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span>{adm.name}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-silver)', direction: 'ltr', textAlign: 'right' }}>
                  {adm.email}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor:
                        adm.role === 'owner' ? 'rgba(226, 183, 85, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: adm.role === 'owner' ? '#E2B755' : '#38bdf8',
                      border: adm.role === 'owner' ? '1px solid rgba(226, 183, 85, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)'
                    }}
                  >
                    {adm.role === 'owner' ? '👑 OWNER (خاوەن)' : '🛡️ ADMIN (بەڕێوەبەر)'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      color: adm.status === 'active' ? '#34d399' : '#ef4444',
                      fontWeight: 700,
                      fontSize: '12.5px'
                    }}
                  >
                    {adm.status === 'active' ? 'چالاکە' : 'ناچالاکە'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>
                  {adm.createdAt}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'left' }}>
                  {adm.role !== 'owner' && adm.email !== 'rwanin1@gmail.com' ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => toggleStatus(adm)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {adm.status === 'active' ? 'ناچالاککردن' : 'چالاککردن'}
                      </button>
                      <button
                        onClick={() => handleDelete(adm.id, adm.email)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        سڕینەوە
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>خاوەنی بێ گۆڕانکاری</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Admin Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="زیادکردنی بەڕێوەبەری نوێ (پاشەکەوت دەبێت لە داتابەیس)"
        maxWidth="500px"
      >
        <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              ناوی تەواوی بەڕێوەبەر
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="نموونە: هێمن محەمەد"
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
              ئیمەیڵی بەڕێوەبەر
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="admin@gmail.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                direction: 'ltr',
                textAlign: 'right'
              }}
            />
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '12px', color: 'var(--text-silver)' }}>
            ئەم بەڕێوەبەرە بە شێوەی خۆکار لە Firestore و داتابەیسی ناوخۆیی پاشەکەوت دەکرێت و دەتوانێت بەم ئیمەیڵە بچێتە ژوورەوە.
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button type="submit" variant="silver" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? 'خەریکی پاشەکەوتکردنە...' : 'پاشەکەوتکردنی بەڕێوەبەر لە داتابەیس'}
            </Button>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              پاشگەزبوونەوە
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
