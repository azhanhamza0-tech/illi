import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleGoogleAdminLogin = async (credential: string) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const loggedUser = await authService.loginWithGoogle(credential);

      if (loggedUser.role !== 'owner' && loggedUser.role !== 'admin') {
        setErrorMsg('ئەم هەژمارەی گووگڵ دەسەڵاتی بەڕێوەبەری (Admin/Owner)ی نییە.');
        showToast('دەسەڵاتی چوونەژوورەوەت نییە', 'error');
        setLoading(false);
        return;
      }

      showToast(`بەخێربێیت بەڕێز ${loggedUser.name} (${loggedUser.role.toUpperCase()})`, 'success');
      navigate('/admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'چوونەژوورەوەی گووگڵ سەرکەوتوو نەبوو');
      showToast('چوونەژوورەوە سەرکەوتوو نەبوو', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('تکایە ناونیشانی ئیمەیڵ بنووسە');
      return;
    }

    if (!password) {
      setErrorMsg('تکایە تێپەڕەوشە بنووسە');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await authService.login(email.trim(), password);

      if (loggedUser.role !== 'owner' && loggedUser.role !== 'admin') {
        setErrorMsg('ئەم هەژمارە دەسەڵاتی بەڕێوەبەری یاخود خاوەندارێتی نییە.');
        showToast('دەسەڵاتی چوونەژوورەوەت نییە', 'error');
        setLoading(false);
        return;
      }

      showToast(`بەخێربێیت بەڕێز ${loggedUser.name} (${loggedUser.role.toUpperCase()})`, 'success');
      navigate('/admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'هەڵەیەک لە چوونەژوورەوەی ئەدمین ڕوویدا');
      showToast('چوونەژوورەوە سەرکەوتوو نەبوو', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#07080B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        direction: 'rtl'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#111319',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Logo size="lg" showText={false} />
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '12px'
            }}
          >
            <ShieldCheck size={14} />
            <span>سیستەمی بەڕێوەبەرایەتی ڕوانین</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            چوونەژوورەوەی ئەدمین
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
            تەنها خاوەندار (Owner) و بەڕێوەبەران (Admin) ڕێگەپێدراون
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '13px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Admin Sign In */}
        <div style={{ marginBottom: '18px' }}>
          <GoogleSignInButton
            onSuccess={handleGoogleAdminLogin}
            onError={(err) => setErrorMsg(err?.message || 'کێشەیەک لە چوونەژوورەوەی گووگڵ ڕوویدا')}
            text="چوونەژوورەوە بە Google (ئەدمین)"
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle, rgba(255, 255, 255, 0.1))' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #9CA3AF)', fontWeight: 600 }}>یان بە هەژماری دەستی</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle, rgba(255, 255, 255, 0.1))' }} />
        </div>

        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-silver)', marginBottom: '6px' }}>
              ئیمەیڵی بەڕێوەبەرایەتی
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <Mail size={18} color="#38bdf8" style={{ marginLeft: '10px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rwanin1@gmail.com"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  width: '100%',
                  direction: 'ltr',
                  textAlign: 'right'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-silver)', marginBottom: '6px' }}>
              تێپەڕەوشەی بەڕێوەبەرایەتی
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <Lock size={18} color="#38bdf8" style={{ marginLeft: '10px' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="تێپەڕەوشەکەت بنووسە..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  width: '100%',
                  direction: 'ltr',
                  textAlign: 'right'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '8px' }}>
            <Button
              type="submit"
              variant="silver"
              size="lg"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #38bdf8 0%, #1e40af 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: 700
              }}
              disabled={loading}
            >
              {loading ? 'خەریکی پشتڕاستکردنەوەیە...' : 'چوونەژوورەوەی پارێزراو'}
            </Button>
          </div>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} />
            <span>گەڕانەوە بۆ پەڕەی سەرەکی</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
