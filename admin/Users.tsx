import React, { useState, useEffect, useMemo } from 'react';
import { userService } from '../services/userService';
import { adminService } from '../services/adminService';
import { useAuth } from '../hooks/useAuth';
import { User, UserRole, UserPackage } from '../types/movie';
import { Search, Ban, CheckCircle, Shield, UserX, Crown, Eye, UserPlus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Add Member modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newPackage, setNewPackage] = useState<UserPackage>('FREE');
  const [submitting, setSubmitting] = useState(false);

  const { user: currentUser, isOwner } = useAuth();
  const { showToast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
      showToast('کێشەیەک لە هێنانی بەکارهێنەران ڕوویدا', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = userService.subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.package.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    setSubmitting(true);
    try {
      const newUser = await userService.addUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        package: newPackage,
        status: 'active',
        joinDate: new Date().toISOString().slice(0, 10),
        vipExpiresAt: newPackage === 'VIP' ? '2027-01-01' : undefined
      });

      setUsers((prev) => [newUser, ...prev]);
      setAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewRole('user');
      setNewPackage('FREE');

      await adminService.logAction({
        adminId: currentUser?.id || currentUser?.uid || 'admin',
        adminEmail: currentUser?.email || 'admin@rwanin.stream',
        role: isOwner ? 'owner' : 'admin',
        action: 'زیادکردنی ئەندامی نوێ',
        targetType: 'بەکارهێنەر',
        targetId: newUser.id,
        description: `ئەندامی نوێ (${newUser.email}) لەلایەن بەڕێوەبەرایەتی پاشەکەوتکرا.`
      });

      showToast('ئەندامی نوێ بە سەرکەوتوویی لە داتابەیس پاشەکەوتکرا!', 'success');
    } catch (err: any) {
      showToast(err.message || 'هەڵەیەک لە زیادکردنی ئەندام ڕوویدا', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.role === 'owner' || u.email === 'rwanin1@gmail.com') {
      showToast('سڕینەوەی خاوەنی سەرەکی بە تەواوی قەدەغەیە!', 'error');
      return;
    }

    if (window.confirm(`دڵنیایت لە سڕینەوەی بەکارهێنەر ${u.name} (${u.email})؟`)) {
      try {
        const targetId = u.id || u.uid || '';
        await userService.deleteUser(targetId);
        setUsers((prev) => prev.filter((item) => (item.id !== targetId && item.uid !== targetId)));

        await adminService.logAction({
          adminId: currentUser?.id || currentUser?.uid || 'admin',
          adminEmail: currentUser?.email || 'admin@rwanin.stream',
          role: isOwner ? 'owner' : 'admin',
          action: 'سڕینەوەی بەکارهێنەر',
          targetType: 'بەکارهێنەر',
          targetId: targetId,
          description: `بەکارهێنەر ${u.email} سڕایەوە.`
        });

        showToast('بەکارهێنەر لە داتابەیس سڕایەوە', 'success');
      } catch (err: any) {
        showToast(err.message || 'سڕینەوە سەرکەوتوو نەبوو', 'error');
      }
    }
  };

  const handleToggleBlock = async (user: User) => {
    if (user.role === 'owner' || user.email === 'rwanin1@gmail.com') {
      showToast('ناتوانیت خاوەنی سەرەکی ڕابگریت!', 'error');
      return;
    }

    const nextStatus = user.status === 'active' ? 'blocked' : 'active';
    const targetId = user.id || user.uid || '';
    await userService.toggleUserStatus(targetId, nextStatus);

    await adminService.logAction({
      adminId: currentUser?.id || currentUser?.uid || 'admin',
      adminEmail: currentUser?.email || 'admin@rwanin.stream',
      role: isOwner ? 'owner' : 'admin',
      action: nextStatus === 'blocked' ? 'بلۆککردنی بەکارهێنەر' : 'لابردنی بلۆکی بەکارهێنەر',
      targetType: 'بەکارهێنەر',
      targetId: targetId,
      description: `بەکارهێنەر ${user.email} (${user.name}) کرا بە ${nextStatus}.`
    });

    setUsers(
      users.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
    );
    showToast(`بەکارهێنەر ${nextStatus === 'blocked' ? 'بلۆککرا' : 'چالاککرایەوە'}`, 'info');
  };

  const handleChangeRole = async (targetUser: User, newRole: UserRole) => {
    if (!isOwner) {
      showToast('تەنها خاوەن دەتوانێت ڕۆڵ بگۆڕێت!', 'error');
      return;
    }

    if (targetUser.role === 'owner' && newRole !== 'owner') {
      showToast('ناتوانیت ڕۆڵی خاوەنی سەرەکی بگۆڕیت!', 'error');
      return;
    }

    const tId = targetUser.id || targetUser.uid || '';
    await userService.updateUserRole(tId, newRole);

    await adminService.logAction({
      adminId: currentUser?.id || currentUser?.uid || 'admin',
      adminEmail: currentUser?.email || 'admin@rwanin.stream',
      role: 'owner',
      action: 'گۆڕینی ڕۆڵی بەکارهێنەر',
      targetType: 'بەکارهێنەر',
      targetId: tId,
      description: `ڕۆڵی ${targetUser.email} گۆڕدرا بۆ ${newRole}.`
    });

    setUsers(users.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)));
    showToast(`ڕۆڵی ${targetUser.name} گۆڕدرا بۆ ${newRole}`, 'success');
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
          <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
            بەڕێوەبردنی ئەندامان و بەکارهێنەران (Users & Members)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            زیادکردن، بینین، گەڕان، بلۆککردن و دیاریکردنی پاکێجی بەکارهێنەرانی ڕوانین لە داتابەیس.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={loadUsers}
          >
            نوێکردنەوە
          </Button>
          <Button
            variant="silver"
            icon={<UserPlus size={18} />}
            onClick={() => setAddModalOpen(true)}
          >
            زیادکردنی ئەندامی نوێ
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px', maxWidth: '440px' }}>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەپێی ناو، ئیمەیڵ یاخود پاکێج..."
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

      {/* Users Table */}
      <div
        className="admin-table-container"
      >
        <table style={{ minWidth: '740px', width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ناو و پرۆفایل</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ئیمەیڵ</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ڕۆڵ</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>پاکێج</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>دۆخ</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>بەشداریکردن</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>بەرواری بەشداربوون</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>کردارەکان</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={u.name}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontWeight: 700 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-silver)', direction: 'ltr', textAlign: 'right' }}>
                  {u.email}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {isOwner && u.role !== 'owner' ? (
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u, e.target.value as any)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border-subtle)',
                        color: u.role === 'admin' ? '#38bdf8' : '#fff',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="user" style={{ background: '#15161C' }}>USER</option>
                      <option value="admin" style={{ background: '#15161C' }}>ADMIN</option>
                    </select>
                  ) : (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: u.role === 'owner' ? '#E2B755' : u.role === 'admin' ? '#38bdf8' : '#94a3b8'
                      }}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {u.package === 'VIP' ? (
                    <span className="badge-vip" style={{ fontSize: '10.5px' }}>VIP</span>
                  ) : (
                    <span className="badge-hd" style={{ fontSize: '10.5px' }}>FREE</span>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: u.status === 'active' ? '#34d399' : '#ef4444'
                    }}
                  >
                    {u.status === 'active' ? 'چالاکە' : 'بلۆککراوە'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-silver)', fontSize: '12.5px' }}>
                  {u.subscriptionStatus || 'کارا'}
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {u.joinDate || '2024'}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setViewModalOpen(true);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-silver)',
                        cursor: 'pointer'
                      }}
                      title="بینین"
                    >
                      <Eye size={15} />
                    </button>
                    {u.role !== 'owner' && (
                      <>
                        <button
                          onClick={() => handleToggleBlock(u)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor:
                              u.status === 'active' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(52, 211, 153, 0.12)',
                            border:
                              u.status === 'active'
                                ? '1px solid rgba(239, 68, 68, 0.3)'
                                : '1px solid rgba(52, 211, 153, 0.3)',
                            color: u.status === 'active' ? '#ef4444' : '#34d399',
                            cursor: 'pointer'
                          }}
                          title={u.status === 'active' ? 'بلۆککردن' : 'لابردنی بلۆک'}
                        >
                          {u.status === 'active' ? <Ban size={15} /> : <CheckCircle size={15} />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
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
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="زیادکردنی ئەندامی نوێ لە داتابەیس"
        maxWidth="500px"
      >
        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              ناوی تەواو
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
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
              ئیمەیڵ
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@gmail.com"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                پاکێجی بەشداریکردن
              </label>
              <select
                value={newPackage}
                onChange={(e) => setNewPackage(e.target.value as UserPackage)}
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
                <option value="FREE">بێبەرامبەر (FREE)</option>
                <option value="VIP">تایبەت (VIP)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                ڕۆڵ
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
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
                <option value="user">بەکارهێنەری ئاسایی (User)</option>
                {isOwner && <option value="admin">بەڕێوەبەر (Admin)</option>}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button type="submit" variant="silver" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? 'خەریکی پاشەکەوتکردنە...' : 'پاشەکەوتکردنی ئەندام'}
            </Button>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              پاشگەزبوونەوە
            </Button>
          </div>
        </form>
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="زانیاری تەواوی بەکارهێنەر"
        maxWidth="500px"
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
              <img
                src={selectedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={selectedUser.name}
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{selectedUser.name}</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-silver)', direction: 'ltr', textAlign: 'right' }}>
                  {selectedUser.email}
                </div>
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>UID ـی داتابەیس</div>
              <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#38bdf8' }}>{selectedUser.uid || selectedUser.id}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>پاکێج</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{selectedUser.package}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>دۆخ</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: selectedUser.status === 'active' ? '#34d399' : '#ef4444' }}>
                  {selectedUser.status === 'active' ? 'چالاک' : 'بلۆککراو'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => setViewModalOpen(false)}>
                داخستن
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
