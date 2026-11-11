import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Database, Bell, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../hooks/useAuth';

export const AdminSettings: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [platformName, setPlatformName] = useState('RWANIN');
  const [platformSlogan, setPlatformSlogan] = useState('پەخشی سینەمایی پێشکەوتوو (Premium Cinematic Streaming)');
  const [vipPrice, setVipPrice] = useState('5,000 IQD');
  const [freeDailyMinutes, setFreeDailyMinutes] = useState('50');
  const [fibAccount, setFibAccount] = useState('0750 999 8888');
  const [qiCardAccount, setQiCardAccount] = useState('9845 1204 9921 5410');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    paymentService.getPaymentConfig().then((cfg) => {
      if (cfg.fibNumber) setFibAccount(cfg.fibNumber);
      if (cfg.qiCardNumber) setQiCardAccount(cfg.qiCardNumber);
      if (cfg.vipPriceText) setVipPrice(cfg.vipPriceText);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await paymentService.updatePaymentConfig(
        {
          fibNumber: fibAccount.trim(),
          qiCardNumber: qiCardAccount.trim(),
          vipPriceText: vipPrice.trim()
        },
        user?.email || 'rwanin1@gmail.com'
      );
      showToast('ڕێکخستنەکانی پارەدان و سیستەمی ڕوانین بە سەرکەوتوویی پاشەکەوت کران', 'success');
    } catch (err) {
      showToast('هەڵەیەک لە پاشەکەوتکردن ڕوویدا', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
          ڕێکخستنەکانی سیستەم (System Settings)
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          ناونیشانی پلاتفۆرم، نرخەکانی VIP، زانیاری هەژمارەکانی پارەدان و دەستکاری پارامەتەرەکان.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Platform Identity */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>ناسنامەی براند و پلاتفۆرم</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                ناوی پلاتفۆرم
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                دروشم و وەسفی سەرەکی
              </label>
              <input
                type="text"
                value={platformSlogan}
                onChange={(e) => setPlatformSlogan(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff'
                }}
              />
            </div>
          </div>
        </div>

        {/* Pricing & Free Limit */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>نرخ و سنووردارکردنی سەیرکردن</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                نرخی مانگانەی VIP
              </label>
              <input
                type="text"
                value={vipPrice}
                onChange={(e) => setVipPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#E2B755',
                  fontWeight: 700
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                کاتی بەخۆڕایی ڕۆژانە (خولەک)
              </label>
              <input
                type="number"
                value={freeDailyMinutes}
                onChange={(e) => setFreeDailyMinutes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff'
                }}
              />
            </div>
          </div>
        </div>

        {/* Payment Gateways Information */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>هەژمارەکانی پارەدانی عێراق</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                ژمارەی هەژماری First Iraqi Bank (FIB)
              </label>
              <input
                type="text"
                value={fibAccount}
                onChange={(e) => setFibAccount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#38bdf8',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                ژمارەی کارتی Qi Card
              </label>
              <input
                type="text"
                value={qiCardAccount}
                onChange={(e) => setQiCardAccount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#f59e0b',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>
        </div>

        {/* Maintenance Toggle */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>دۆخی چاکسازی (Maintenance Mode)</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              ئەگەر چالاک بکرێت، ماڵپەڕی گشتی نامەی چاکسازی پیشان دەدات.
            </div>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
            <input
              type="checkbox"
              checked={isMaintenance}
              onChange={(e) => setIsMaintenance(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                inset: 0,
                backgroundColor: isMaintenance ? '#ef4444' : 'rgba(255,255,255,0.1)',
                borderRadius: '24px',
                transition: '0.3s'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: isMaintenance ? '26px' : '4px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.3s'
                }}
              />
            </span>
          </label>
        </div>

        <div>
          <Button type="submit" variant="silver" size="lg" icon={<Save size={18} />}>
            پاشەکەوتکردنی هەموو گۆڕانکارییەکان
          </Button>
        </div>
      </form>
    </div>
  );
};
