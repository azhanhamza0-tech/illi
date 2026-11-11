import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';

// Client Pages
import { Home } from './pages/Home';
import { MovieDetails } from './pages/MovieDetails';
import { Watch } from './pages/Watch';
import { Search } from './pages/Search';
import { WatchlistPage } from './pages/Watchlist';
import { VIPPage } from './pages/VIP';
import { PaymentPage } from './pages/Payment';
import { AccountPage } from './pages/Account';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Catalog } from './pages/Catalog';
import { Staff } from './pages/Staff';

import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';

// Admin Suite (Decoupled Module)
import { AdminRoutes } from './admin/AdminRoutes';
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <PWAInstallPrompt />
          <Routes>
            {/* Public Stream Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Catalog type="explore" />} />
            <Route path="/movies" element={<Catalog type="movies" />} />
            <Route path="/tv-shows" element={<Catalog type="tv" />} />
            <Route path="/series" element={<Catalog type="tv" />} />
            <Route path="/anime" element={<Catalog type="anime" />} />
            <Route path="/dubbed" element={<Catalog type="dubbed" />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/featured" element={<Catalog type="featured" />} />
            <Route path="/trending" element={<Catalog type="trending" />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/search" element={<Search />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/vip" element={<VIPPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Admin Suite Routes (Isolated in src/admin) */}
            <Route path="/admin/*" element={<AdminRoutes />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
