import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, isEmailVerified, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Show premium dark cinematic loader while auth state is resolving
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: '#08090C',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          color: 'var(--text-silver)'
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#D7D9DF',
            animation: 'rwanin-spin 0.8s linear infinite'
          }}
        />
        <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
          چاوەڕوان بە...
        </span>
        <style>{`
          @keyframes rwanin-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 1. Rule: No Firebase user -> /login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Rule: Firebase user but email NOT verified -> /verify-email
  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // 3. Optional Admin check if requested
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 4. Rule: Firebase user + email verified -> Allow page
  return <>{children}</>;
};
