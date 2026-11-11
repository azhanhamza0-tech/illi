import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { adminService } from '../services/adminService';
import { AlertTriangle, Trash2, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

const REQUIRED_CONFIRMATION_TEXT = 'ئەم کارە هەموو داتا و فایلە کۆنەکان دەسڕێتەوە.';

export const AdminCleanup: React.FC = () => {
  const { user, isOwner } = useAuth();
  const { showToast } = useToast();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [secondConfirmation, setSecondConfirmation] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanedSuccess, setCleanedSuccess] = useState(false);

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
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>دەسەڵاتی سنووردار (تەنها خاوەن)</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          تەنها خاوەنی سەرەکی پلاتفۆرم (Owner: rwanin1@gmail.com) ڕێگەپێدراوە بۆ خاوێنکردنەوەی داتابەیس.
        </p>
      </div>
    );
  }

  const handleStartCleanup = async () => {
    if (typedConfirmation.trim() !== REQUIRED_CONFIRMATION_TEXT) {
      showToast('ڕستەی دڵنیابوونەوە بە تەواوی هاوتا نییە!', 'error');
      return;
    }

    if (!secondConfirmation) {
      showToast('تکایە هێمای دڵنیابوونەوەی دووەم دیاریبکە!', 'error');
      return;
    }

    setIsCleaning(true);
    try {
      await adminService.performDatabaseReset(user?.email || 'owner@rwanin.stream');

      await adminService.logAction({
        adminId: user?.id || user?.uid || 'owner',
        adminEmail: user?.email || 'owner@rwanin.stream',
        role: 'owner',
        action: 'خاوێنکردنەوەی گشتی داتابەیس (Database Reset)',
        targetType: 'داتابەیس و فایەربەیس',
        description: 'سڕینەوەی سەرجەم داتا و فایلە مۆکەکانی کۆن و دەستپێکردنەوەی پاکێجی ڕوانین.'
      });

      setIsCleaning(false);
      setConfirmModalOpen(false);
      setCleanedSuccess(true);
      showToast('داتابەیس و فایلە کۆنەکان بە سەرکەوتوویی خاوێنکرانەوە!', 'success');
    } catch (err: any) {
      setIsCleaning(false);
      showToast(err.message || 'هەڵەیەک لە خاوێنکردنەوە ڕوویدا', 'error');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '880px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
          <ShieldAlert size={16} />
          <span>ناوچەی مەترسیدار — تەنها خاوەن (OWNER ONLY)</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>
          خاوێنکردنەوە و ڕیسێتکردنی داتابەیس (Database Reset & Cleanup)
        </h1>
        <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          ئەم بەشە بۆ سڕینەوەی تەواوی داتا مۆک، تێست، بەکارهێنەرانی تاقیکاری و فایلی زیادەیە تاوەکو پلاتفۆرمی ڕوانین بە شێوەیەکی فەرمی و نوێ لەسەر Firebase چالاک بێت.
        </p>
      </div>

      {cleanedSuccess ? (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '40px',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#34d399'
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
            خاوێنکردنەوە بە سەرکەوتوویی تەواو بوو
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            داتابەیسی Firestore و ڕێکخستنەکان نوێکرانەوە بە کەتەلۆگ و پێکهاتەی نوێی پلاتفۆرمی ڕوانین.
          </p>
          <Button variant="silver" onClick={() => window.location.reload()}>
            نوێکردنەوەی پەیج
          </Button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.04)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#ef4444' }}>
            <AlertTriangle size={24} />
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>ئاگاداری گرنگ بۆ خاوەنی پلاتفۆرم</h3>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--text-silver)', lineHeight: 1.7, marginBottom: '20px' }}>
            ئەم کردارە گەڕانەوەی نییە! تەواوی کۆکراوەکانی خوارەوە لە فایەربەیس و لۆکاڵ دەسڕێنەوە:
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
              gap: '12px',
              marginBottom: '28px'
            }}
          >
            {[
              'کۆکراوەی users',
              'کۆکراوەی movies',
              'کۆکراوەی reviews',
              'کۆکراوەی watchlists',
              'کۆکراوەی watchHistory',
              'کۆکراوەی payments',
              'کۆکراوەی notifications',
              'کۆکراوەی settings',
              'فایلە کۆنەکانی Storage',
              'هەژمارە تاقیکارییەکان'
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '13px',
                  color: 'var(--text-silver)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Trash2 size={14} color="#ef4444" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Button
            variant="danger"
            size="lg"
            icon={<Trash2 size={18} />}
            onClick={() => {
              setTypedConfirmation('');
              setSecondConfirmation(false);
              setConfirmModalOpen(true);
            }}
          >
            دەستپێکردنی خاوێنکردنەوەی داتابەیس
          </Button>
        </div>
      )}

      {/* Strict 2-Step Confirmation Modal: Requirement 10 */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="دڵنیابوونەوەی تووندی خاوەن (Owner Confirmation)"
        maxWidth="540px"
      >
        <div style={{ padding: '10px 0' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '20px'
            }}
          >
            <p style={{ fontSize: '14px', color: '#fca5a5', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
              تکایە ئەم ڕستەیەی خوارەوە بە تەواوی بنووسەرەوە بۆ ئەوەی دڵنیابینەوە لە ئەنجامدانی ئەم کردارە:
            </p>
            <div
              style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 800,
                textAlign: 'center',
                userSelect: 'all'
              }}
            >
              {REQUIRED_CONFIRMATION_TEXT}
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              دەقی دڵنیابوونەوە بنووسەوە:
            </label>
            <input
              type="text"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              placeholder="دەقی سەرەوە لێرە بنووسەوە..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <input
              type="checkbox"
              id="sec-conf"
              checked={secondConfirmation}
              onChange={(e) => setSecondConfirmation(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ef4444' }}
            />
            <label htmlFor="sec-conf" style={{ fontSize: '13px', color: 'var(--text-silver)', cursor: 'pointer' }}>
              من وەک خاوەنی سەرەکی پلاتفۆرم (rwanin1@gmail.com) بەرپرسیارم و پەسەندی دەکەم.
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="danger"
              size="lg"
              style={{ flex: 1 }}
              disabled={typedConfirmation.trim() !== REQUIRED_CONFIRMATION_TEXT || !secondConfirmation || isCleaning}
              onClick={handleStartCleanup}
            >
              {isCleaning ? 'خەریکی خاوێنکردنەوەیە...' : 'سڕینەوەی هەمیشەیی'}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setConfirmModalOpen(false)}>
              پاشگەزبوونەوە
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
