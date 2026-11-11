import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/variables.css';
import './styles/global.css';
import './styles/responsive.css';
import './styles/player.css';
import { dbSeeder } from './services/dbSeeder';

// Automated sanitization of obsolete dummy/test records from localStorage
try {
  const dummyEmails = ['darya@gmail.com', 'zana@yahoo.com', 'aso@karkuk.com', 'onlineguard515@gmail.com'];
  const dummyPayIds = ['pay_101', 'pay_102', 'pay_103'];

  // Clean users cache
  const storedUsers = localStorage.getItem('rwanin_users_list');
  if (storedUsers) {
    try {
      const users = JSON.parse(storedUsers);
      if (Array.isArray(users)) {
        const filtered = users.filter((u: any) => !dummyEmails.includes(u.email?.toLowerCase().trim()));
        localStorage.setItem('rwanin_users_list', JSON.stringify(filtered));
      }
    } catch (_) {}
  }

  // Clean payments cache
  const storedPays = localStorage.getItem('rwanin_payments_list');
  if (storedPays) {
    try {
      const pays = JSON.parse(storedPays);
      if (Array.isArray(pays)) {
        const filteredPays = pays.filter((p: any) => !dummyPayIds.includes(p.id));
        localStorage.setItem('rwanin_payments_list', JSON.stringify(filteredPays));
      }
    } catch (_) {}
  }

  // Clean admins cache
  const storedAdmins = localStorage.getItem('rwanin_admins_list');
  if (storedAdmins) {
    try {
      const admins = JSON.parse(storedAdmins);
      if (Array.isArray(admins)) {
        const filteredAdmins = admins.filter((a: any) => !dummyEmails.includes(a.email?.toLowerCase().trim()));
        localStorage.setItem('rwanin_admins_list', JSON.stringify(filteredAdmins));
      }
    } catch (_) {}
  }

  // Clean staff cache
  const storedStaff = localStorage.getItem('rwanin_staff_list');
  if (storedStaff) {
    try {
      const staff = JSON.parse(storedStaff);
      if (Array.isArray(staff)) {
        const filteredStaff = staff.filter((s: any) => s.id !== 'stf_2' && s.email?.toLowerCase().trim() !== 'onlineguard515@gmail.com');
        localStorage.setItem('rwanin_staff_list', JSON.stringify(filteredStaff));
      }
    } catch (_) {}
  }
} catch (e) {
  console.warn('Startup storage sanitization note:', e);
}

// Automated Firestore verification & seeding in background
dbSeeder.seedFirestoreIfEmpty().catch((err) => console.warn('Background seed note:', err));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
