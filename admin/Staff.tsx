import React, { useState, useEffect } from 'react';
import { staffService } from '../services/staffService';
import { adminService } from '../services/adminService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { StaffMember } from '../types/movie';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Users, UserPlus, Edit, Trash2, ExternalLink, RefreshCw, Send, ShieldCheck, Award, Upload, Image as ImageIcon } from 'lucide-react';

export const AdminStaff: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [category, setCategory] = useState<StaffMember['category']>('admin');
  const [badge, setBadge] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('قەبارەی وێنە نابێت لە ٢ مێگابایت زیاتر بێت', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
          showToast('وێنەکە بە سەرکەوتوویی بارکرا', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const [instagram, setInstagram] = useState('');
  const [order, setOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const { user: currentUser, isOwner } = useAuth();
  const { showToast } = useToast();

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await staffService.getStaff();
      setStaff(data);
    } catch (e) {
      console.error(e);
      showToast('کێشەیەک لە هێنانی ستاف ڕوویدا', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const openAddModal = () => {
    setEditingMember(null);
    setName('');
    setRoleTitle('');
    setCategory('admin');
    setBadge('ADMIN');
    setAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400');
    setBio('');
    setEmail('');
    setTelegram('');
    setInstagram('');
    setOrder(staff.length + 1);
    setModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingMember(member);
    setName(member.name);
    setRoleTitle(member.roleTitle);
    setCategory(member.category);
    setBadge(member.badge || '');
    setAvatar(member.avatar);
    setBio(member.bio);
    setEmail(member.email || '');
    setTelegram(member.telegram || '');
    setInstagram(member.instagram || '');
    setOrder(member.order);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roleTitle.trim()) return;

    setSubmitting(true);
    try {
      if (editingMember) {
        // Update existing
        await staffService.updateStaff(editingMember.id, {
          name: name.trim(),
          roleTitle: roleTitle.trim(),
          category,
          badge: badge.trim(),
          avatar: avatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
          bio: bio.trim(),
          email: email.trim(),
          telegram: telegram.trim(),
          instagram: instagram.trim(),
          order: Number(order)
        });

        await adminService.logAction({
          adminId: currentUser?.id || currentUser?.uid || 'admin',
          adminEmail: currentUser?.email || 'admin@rwanin.stream',
          role: isOwner ? 'owner' : 'admin',
          action: 'دەستکاری ئەندامی ستاف',
          targetType: 'ستاف',
          targetId: editingMember.id,
          description: `زانیاری ستاف (${name}) دەستکاری کرا.`
        });

        showToast('زانیاری ئەندامی ستاف نوێکرایەوە', 'success');
      } else {
        // Create new
        const created = await staffService.addStaff({
          name: name.trim(),
          roleTitle: roleTitle.trim(),
          category,
          badge: badge.trim(),
          avatar: avatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
          bio: bio.trim(),
          email: email.trim(),
          telegram: telegram.trim(),
          instagram: instagram.trim(),
          order: Number(order)
        });

        await adminService.logAction({
          adminId: currentUser?.id || currentUser?.uid || 'admin',
          adminEmail: currentUser?.email || 'admin@rwanin.stream',
          role: isOwner ? 'owner' : 'admin',
          action: 'زیادکردنی ئەندامی نوێی ستاف',
          targetType: 'ستاف',
          targetId: created.id,
          description: `ئەندامی نوێی ستاف (${name} - ${roleTitle}) زیادکرا.`
        });

        showToast('ئەندامی نوێی ستاف لە داتابەیس پاشەکەوتکرا!', 'success');
      }

      setModalOpen(false);
      await loadStaff();
    } catch (err: any) {
      showToast(err.message || 'هەڵەیەک ڕوویدا', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (member: StaffMember) => {
    if (member.category === 'owner') {
      showToast('ناتوانیت خاوەنی ماڵپەڕ لە ستاف بسڕیتەوە!', 'error');
      return;
    }

    if (window.confirm(`دڵنیایت لە سڕینەوەی ${member.name} لە ستاف؟`)) {
      try {
        await staffService.deleteStaff(member.id);
        setStaff((prev) => prev.filter((s) => s.id !== member.id));

        await adminService.logAction({
          adminId: currentUser?.id || currentUser?.uid || 'admin',
          adminEmail: currentUser?.email || 'admin@rwanin.stream',
          role: isOwner ? 'owner' : 'admin',
          action: 'سڕینەوەی ئەندامی ستاف',
          targetType: 'ستاف',
          targetId: member.id,
          description: `ئەندامی ستاف (${member.name}) سڕایەوە.`
        });

        showToast('ئەندامی ستاف سڕایەوە', 'success');
      } catch (err: any) {
        showToast('سڕینەوە سەرکەوتوو نەبوو', 'error');
      }
    }
  };

  const getCategoryColor = (cat: StaffMember['category']) => {
    switch (cat) {
      case 'owner':
        return '#E2B755';
      case 'admin':
        return '#38bdf8';
      case 'translator':
        return '#a855f7';
      case 'developer':
        return '#34d399';
      case 'moderator':
        return '#f97316';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="admin-content-pad" style={{ padding: 'clamp(14px, 3.5vw, 32px)' }}>
      {/* Header */}
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
            <Users size={16} />
            <span>بەڕێوەبەرایەتی ستاف (STAFF & ADMINS MANAGEMENT)</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
            بەڕێوەبردنی ستاف و بەڕێوەبەران
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            دیاریکردنی ناو، وێنە، ڕۆڵ، کورتە و دەسەڵاتی ئەندامانی ستاف کە لە لاپەڕەی فەرمی ستافی ماڵپەڕ پیشاندەدرێن.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={loadStaff}
          >
            نوێکردنەوە
          </Button>
          <Button
            variant="silver"
            icon={<UserPlus size={18} />}
            onClick={openAddModal}
          >
            زیادکردنی ئەندامی ستاف
          </Button>
        </div>
      </div>

      {/* Staff Table */}
      <div
        className="admin-table-container"
      >
        <table style={{ minWidth: '760px', width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ئەندام</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ڕۆڵ و پۆست</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>هاوپۆل</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>نیشانە (Badge)</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>پەیوەندی</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ڕیزبەندی</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>کردارەکان</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((m) => {
              const catColor = getCategoryColor(m.category);
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={m.avatar}
                        alt={m.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${catColor}` }}
                      />
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff' }}>{m.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.bio}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-silver)' }}>
                    {m.roleTitle}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px',
                        fontWeight: 800,
                        backgroundColor: `${catColor}20`,
                        color: catColor,
                        border: `1px solid ${catColor}40`
                      }}
                    >
                      {m.category.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {m.badge ? (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        {m.badge}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-silver)', direction: 'ltr', textAlign: 'right' }}>
                    {m.telegram || m.email || m.instagram || '-'}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                    #{m.order}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEditModal(m)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-silver)',
                          cursor: 'pointer'
                        }}
                        title="دەستکاری"
                      >
                        <Edit size={15} />
                      </button>
                      {m.category !== 'owner' && (
                        <button
                          onClick={() => handleDelete(m)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            cursor: 'pointer'
                          }}
                          title="سڕینەوە"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMember ? 'دەستکاریکردنی ئەندامی ستاف' : 'زیادکردنی ئەندامی نوێ بۆ ستاف'}
        maxWidth="600px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                ناوی ئەندام
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نموونە: ئارام ئەحمەد"
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
                ناوی ڕۆڵ / پۆست
              </label>
              <input
                type="text"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="نموونە: سەرپەرشتیاری بەڕێوەبەران"
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                هاوپۆل (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#15161C',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="owner">خاوەن (Owner)</option>
                <option value="admin">بەڕێوەبەر (Admin)</option>
                <option value="translator">وەرگێڕ (Translator)</option>
                <option value="developer">پەرەپێدەر (Developer)</option>
                <option value="moderator">چاودێر (Moderator)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                نیشانەی تایبەت (Badge)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="HEAD ADMIN, TECH LEAD..."
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
                ڕیزبەندی (Order)
              </label>
              <input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              وێنەی کەسی (Avatar / Photo)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              {/* Preview */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#1E2029',
                  border: '2px solid #E2B755',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.currentTarget as any).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
                    }}
                  />
                ) : (
                  <ImageIcon size={28} color="#9CA3AF" />
                )}
              </div>

              {/* Upload & URL Input */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={14} />
                    <span>هەڵبژاردنی وێنە لە مۆبایل / کۆمپیوتەر</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>یان دانانی بەستەر:</span>
                </div>

                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://... لینکی وێنە"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    direction: 'ltr',
                    textAlign: 'right',
                    fontSize: '12.5px'
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              کورتەیەک دەربارەی ئەندام (Bio)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="کورتەیەک لە کار و بەرپرسیارێتی ئەم ئەندامە لە پلاتفۆرم بنووسە..."
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                ئیمەیڵ
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@rwanin.stream"
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

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                تێلیگرام (Telegram)
              </label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="https://t.me/username"
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

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                ئینستاگرام (Instagram)
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/username"
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
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button type="submit" variant="silver" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? 'خەریکی پاشەکەوتکردنە...' : editingMember ? 'نوێکردنەوەی ئەندام' : 'پاشەکەوتکردن لە داتابەیس'}
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
