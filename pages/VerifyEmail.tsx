import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/ui/Logo';
import { VerificationNotice } from '../components/auth/VerificationNotice';

export const VerifyEmail: React.FC = () => {
  const { user, isEmailVerified, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If already verified, immediately redirect to account or home
  useEffect(() => {
    if (!loading && user && isEmailVerified) {
      navigate('/account', { replace: true });
    }
  }, [user, isEmailVerified, loading, navigate]);

  const emailFromState = (location.state as any)?.email || user?.email || '';

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100dvh',
        backgroundColor: '#08090C',
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(215, 217, 223, 0.08), transparent)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 32px)',
        position: 'relative'
      }}
    >
      {/* Top Logo */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
          <Logo size="lg" showText={true} />
        </Link>
        <div
          style={{
            fontSize: '12.5px',
            color: 'var(--text-silver, #D7D9DF)',
            marginTop: '6px',
            fontWeight: 700,
            letterSpacing: '0.02em'
          }}
        >
          ڕوانین — پەخشی سینەمایی پێشکەوتوو
        </div>
      </div>

      {/* Verification Notice Card */}
      <VerificationNotice
        email={emailFromState}
        onVerifiedSuccess={() => navigate('/account', { replace: true })}
        showLogoutButton={true}
      />
    </div>
  );
};

export default VerifyEmail;
