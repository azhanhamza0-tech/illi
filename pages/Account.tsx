import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { ProfileCard } from '../components/account/ProfileCard';
import { ContinueWatching } from '../components/account/ContinueWatching';
import { WatchHistory } from '../components/account/WatchHistory';
import { AccountWatchlist } from '../components/account/Watchlist';
import { UserAnalyticsTab } from '../components/account/UserAnalyticsTab';
import { StreakAchievementsTab } from '../components/account/StreakAchievementsTab';
import { DeviceManagementTab } from '../components/account/DeviceManagementTab';
import { CollectionsTab } from '../components/account/CollectionsTab';
import { useAuth } from '../hooks/useAuth';
import { Crown, Clock, Bookmark, BarChart3, Flame, Smartphone, FolderHeart, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const AccountPage: React.FC = () => {
  const { user, isVIP, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'continue' | 'analytics' | 'streak' | 'collections' | 'devices' | 'watchlist' | 'history' | 'subscription'
  >('continue');

  if (!user) {
    return (
      <PageContainer>
        <div style={{ padding: '80px 24px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--text-silver)'
            }}
          >
            <UserIcon size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>
            چوونەژوورەوە پێویستە
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
            تکایە سەرەتا بچۆ ژوورەوە یان هەژمارێکی نوێ دروست بکە بۆ بینینی پرۆفایل، مێژووی سەیرکردن و لیستی دڵخوازەکانت.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button variant="silver" onClick={() => navigate('/login')}>
              چوونەژوورەوە
            </Button>
            <Button variant="secondary" onClick={() => navigate('/signup')}>
              دروستکردنی هەژمار
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const userId = user.uid || user.id || 'guest';

  const tabs = [
    { id: 'continue', label: 'بەردەوام بە لە سەیرکردن', icon: <Clock size={16} /> },
    { id: 'analytics', label: 'ئاماری سەیرکردن', icon: <BarChart3 size={16} color="#38bdf8" /> },
    { id: 'streak', label: 'ستڕیک و دەستکەوت', icon: <Flame size={16} color="#fb923c" /> },
    { id: 'collections', label: 'کۆکراوەکانم', icon: <FolderHeart size={16} color="#ec4899" /> },
    { id: 'devices', label: 'ئامێرە چالاکەکان', icon: <Smartphone size={16} color="#34d399" /> },
    { id: 'watchlist', label: 'لیستی پاشەکەوتکراو', icon: <Bookmark size={16} /> },
    { id: 'history', label: 'مێژووی سەیرکردن', icon: <Clock size={16} /> },
    { id: 'subscription', label: 'بەشداریکردنی VIP', icon: <Crown size={16} color="#E2B755" /> },
  ];

  return (
    <PageContainer>
      <div style={{ padding: 'clamp(18px, 4vw, 36px) var(--page-padding-x) 80px', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Profile Card Header */}
        <ProfileCard user={user} />

        {/* Tab Navigation */}
        <div className="w-full overflow-x-auto no-scrollbar mb-8">
          <div className="flex items-center gap-1.5 min-w-max p-1.5 bg-surface-card/90 backdrop-blur-2xl rounded-full shadow-xl">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-label-md transition-all border-0 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary font-bold shadow-md'
                      : 'bg-transparent text-metallic-muted hover:text-white hover:bg-surface-container'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'continue' && <ContinueWatching />}
          {activeTab === 'analytics' && <UserAnalyticsTab userId={userId} />}
          {activeTab === 'streak' && <StreakAchievementsTab userId={userId} />}
          {activeTab === 'collections' && <CollectionsTab userId={userId} />}
          {activeTab === 'devices' && <DeviceManagementTab userId={userId} />}
          {activeTab === 'watchlist' && <AccountWatchlist />}
          {activeTab === 'history' && <WatchHistory />}
          {activeTab === 'subscription' && (
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                padding: '36px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Crown size={24} color="#E2B755" />
                <h3 style={{ fontSize: '20px', fontWeight: 800 }}>وردەکارییەکانی پاکێج و بەشداریکردن</h3>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '20px',
                  marginBottom: '28px'
                }}
              >
                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>پاکێجی ئێستا</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: isVIP ? '#E2B755' : '#fff' }}>
                    {user.package === 'VIP' ? 'ئەندامی VIP (پەخشی بێ سنوور)' : 'پاکێجی بەخۆڕایی (Free - 50 خولەک)'}
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>دۆخی بەشداریکردن</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: user.status === 'active' ? '#34d399' : '#ef4444' }}>
                    {user.status === 'active' ? 'چالاکە (Active)' : 'ڕاگیراوە (Blocked)'}
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>بەرواری بەسەرچوون</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: 'var(--text-silver)' }}>
                    {user.vipExpiresAt || 'بەردەوام (بێبەرامبەر)'}
                  </div>
                </div>
              </div>

              {!isVIP ? (
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.6 }}>
                    بەشداریکردنی VIP بەدەستبهێنە تاوەکو سنووردارکردنی 50 خولەکی ڕۆژانەت نەمێنێت و چێژ لە سەیرکردنی هەموو فیلم و زنجیرەکان بە کوالێتی 4K وەربگریت.
                  </p>
                  <Button variant="vip" size="lg" onClick={() => navigate('/vip')}>
                    بەرزکردنەوە بۆ VIP (5,000 دینار)
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '14px' }}>
                  <Button variant="silver" size="md" onClick={() => navigate('/payment')}>
                    نوێکردنەوە / درێژکردنەوەی بەشداریکردن
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Signout button */}
        <div style={{ marginTop: '54px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
          <Button
            variant="danger"
            size="md"
            icon={<LogOut size={16} />}
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            چوونەدەرەوە لە هەژمار (ڕوانین)
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};
