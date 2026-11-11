import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import { AdminLayout } from './AdminLayout';
import { Dashboard } from './Dashboard';
import { AdminMovies } from './Movies';
import { AdminUsers } from './Users';
import { AdminPayments } from './Payments';
import { AdminCategories } from './Categories';
import { AdminHomepage } from './Homepage';
import { AdminReviews } from './Reviews';
import { AdminNotifications } from './AdminNotifications';
import { AdminLogs } from './AdminLogs';
import { AdminSettings } from './Settings';
import { AdminAdmins } from './AdminAdmins';
import { AdminCleanup } from './AdminCleanup';
import { AdminStaff } from './Staff';
import { AdminReports } from './Reports';

export const SUPER_ADMIN_EMAIL = 'azhanako1999@gmail.com';

/**
 * Isolated Admin Suite Routing Module
 * Protected strictly: Only accessible when logged in as azhanako1999@gmail.com.
 * If anyone else types /admin in the URL bar, it shows nothing and redirects to home.
 */
export const AdminRoutes: React.FC = () => {
  const { user } = useAuth();

  const isSuperAdmin = user?.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase();

  // If not logged in as azhanako1999@gmail.com, do not open admin and redirect immediately to /
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      {/* Protected Admin Suite Layout & Sub-pages */}
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="movies" element={<AdminMovies />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="staff" element={<AdminStaff />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="homepage" element={<AdminHomepage />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="admins" element={<AdminAdmins />} />
        <Route path="cleanup" element={<AdminCleanup />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
