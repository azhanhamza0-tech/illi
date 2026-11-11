import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  UploadCloud,
  FileText,
  AlertCircle,
  Copy,
  ChevronRight,
  ShieldCheck,
  Crown,
  Check,
  Send,
  ArrowRight
} from 'lucide-react';
import { paymentService, PaymentConfig, defaultPaymentConfig } from '../services/paymentService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [method, setMethod] = useState<'FIB' | 'Qi Card' | 'QR Payment'>('FIB');
  const [fullName, setFullName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [config, setConfig] = useState<PaymentConfig>(defaultPaymentConfig);

  useEffect(() => {
    paymentService.getPaymentConfig().then(setConfig);
    const handler = (e: any) => {
      if (e.detail) setConfig(e.detail);
    };
    window.addEventListener('rwanin_payment_config_changed', handler);
    return () => window.removeEventListener('rwanin_payment_config_changed', handler);
  }, []);

  useEffect(() => {
    if (user?.name && !fullName) {
      setFullName(user.name);
    }
  }, [user]);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} کۆپی کرا!`, 'info');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptName(e.target.files[0].name);
      showToast('وێنەی پسوولە دیاریکرا', 'info');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('تکایە سەرەتا بچۆ ژوورەوە یان هەژمار دروست بکە تا VIP بۆ هەژمارەکەت چالاک بێت.', 'error');
      navigate('/login');
      return;
    }

    if (!fullName.trim() || !phoneNumber.trim() || !transactionId.trim()) {
      showToast('تکایە هەموو خانە پێویستەکان پڕبکەرەوە.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payment = await paymentService.submitPayment({
        userId: user.id || user.uid || 'usr_guest',
        userName: fullName.trim(),
        userPhone: phoneNumber.trim(),
        method,
        amount: '5,000 IQD',
        transactionId: transactionId.trim(),
        receiptImage: receiptName || 'receipt_sample.png'
      });

      setIsSubmitting(false);
      setSubmittedId(payment.id);
      showToast('داواکاری پارەدانەکە بە سەرکەوتوویی نێردرا! بەڕێوەبەر لە ماوەیەکی کەمدا پشتڕاستی دەکاتەوە.', 'success');
    } catch (err) {
      setIsSubmitting(false);
      showToast('کێشەیەک لە ناردنی داواکاری پارەدان ڕوویدا', 'error');
    }
  };

  const currentMethodConfig = {
    FIB: {
      name: 'First Iraqi Bank (FIB)',
      number: config.fibNumber,
      color: '#38bdf8',
      desc: 'حەواڵەی ڕاستەوخۆ لە ڕێگەی ئەپی فەرمی بانکی یەکەمی عێراقی.'
    },
    'Qi Card': {
      name: 'کی کارت (Qi Card)',
      number: config.qiCardNumber,
      color: '#f59e0b',
      desc: 'ناردنی باڵانس لە ئەپی فەرمی کی کارت (سویس).'
    },
    'QR Payment': {
      name: 'سکانی بارکۆد (QR Pay)',
      number: config.qrCodeText,
      color: '#34d399',
      desc: 'سکانی بارکۆدی فەرمی پلاتفۆرمی ڕوانین لە ڕێگەی ئەپی بانکی.'
    }
  }[method];

  return (
    <PageContainer>
      <div
        style={{
          padding: 'clamp(16px, 3.5vw, 32px) var(--page-padding-x) 80px',
          maxWidth: '480px',
          margin: '0 auto',
          direction: 'rtl'
        }}
      >
        {/* Top Navigation Row (Back / Skip) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#E2B755',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              RWANIN CHECKOUT
            </span>
          </div>

          <button
            onClick={() => navigate('/vip')}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>گەڕانەوە</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Large Header Title */}
        <h1
          style={{
            fontSize: 'clamp(32px, 6vw, 38px)',
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: '20px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display)'
          }}
        >
          پارەدان و چالاککردن
        </h1>

        {/* Guest Warning Banner if not logged in */}
        {!user && !submittedId && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '20px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>
                تکایە سەرەتا بچۆ ژوورەوە یان هەژمار دروست بکە
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                color: '#08090C',
                border: 'none',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              چوونەژوورەوە
            </button>
          </div>
        )}

        {submittedId ? (
          /* Success Screen (Revolut Confirmation Style) */
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '24px',
              padding: '36px 24px',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              textAlign: 'center',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)'
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
                margin: '0 auto 18px',
                color: '#34d399'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '10px', color: '#ffffff' }}>
              داواکاری پارەدان بە سەرکەوتوویی نێردرا!
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: '0 auto 24px',
                lineHeight: 1.6
              }}
            >
              ناسنامەی مامەڵەکەت: <strong style={{ color: '#E2B755' }}>{transactionId}</strong>
              <br />
              تیمی بەڕێوەبەرایەتی پاش وردبینیکردنی پسوولەکە، بەشداریکردنی VIP ـەکەت لە کەمترین ماوەدا چالاک دەکەن.
            </p>

            <button
              onClick={() => navigate('/account')}
              style={{
                width: '100%',
                height: '52px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: '#ffffff',
                color: '#08090C',
                fontSize: '15px',
                fontWeight: 900,
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              بینینی هەژمارەکەم
            </button>

            <button
              onClick={() => setSubmittedId(null)}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '9999px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ناردنی داواکارییەکی تر
            </button>
          </div>
        ) : (
          <>
            {/* Segmented Control / Pill Tabs (Payment Methods) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '4px',
                borderRadius: '9999px',
                marginBottom: '22px',
                gap: '4px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {[
                { id: 'FIB', label: 'FIB' },
                { id: 'Qi Card', label: 'Qi Card' },
                { id: 'QR Payment', label: 'QR Pay' }
              ].map((item) => {
                const isActive = method === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setMethod(item.id as any)}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '9999px',
                      border: 'none',
                      fontSize: '13.5px',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      backgroundColor: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#0a0b10' : 'var(--text-secondary)',
                      boxShadow: isActive ? '0 4px 14px rgba(0, 0, 0, 0.18)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      textAlign: 'center'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Active Payment Card (Revolut Aesthetic) */}
            <div
              style={{
                position: 'relative',
                borderRadius: '24px',
                padding: 'clamp(22px, 4vw, 28px)',
                backgroundColor: '#0d0e14',
                backgroundImage: `
                  radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.25) 0%, transparent 55%),
                  radial-gradient(circle at 15% 85%, rgba(226, 183, 85, 0.22) 0%, transparent 50%)
                `,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
                marginBottom: '26px',
                overflow: 'hidden'
              }}
            >
              {/* Card Header: Method Name & Active Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px'
                }}
              >
                <h2
                  style={{
                    fontSize: 'clamp(22px, 5vw, 26px)',
                    fontWeight: 900,
                    color: '#ffffff',
                    margin: 0,
                    letterSpacing: '-0.02em'
                  }}
                >
                  {currentMethodConfig.name}
                </h2>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: '#ffffff',
                    color: '#08090C',
                    fontSize: '12px',
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)'
                  }}
                >
                  <Check size={13} strokeWidth={3} />
                  <span>پێشنیارکراو</span>
                </span>
              </div>

              {/* Price Tag */}
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#E2B755',
                  marginBottom: '14px'
                }}
              >
                بڕی پارە: 5,000 دیناری عێراقی (IQD)
              </div>

              {/* Account Box with Quick Copy */}
              {method !== 'QR Payment' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    direction: 'ltr'
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em' }}>
                    {currentMethodConfig.number}
                  </span>
                  <button
                    onClick={() => copyToClipboard(currentMethodConfig.number.replace(/\s+/g, ''), 'ژمارەی هەژمار')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    <Copy size={13} />
                    <span>کۆپی</span>
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}
                  >
                    <QrCode size={95} color="#08090C" />
                  </div>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    سکانی بارکۆد بکە بۆ ناردنی راستەوخۆی 5,000 IQD
                  </span>
                </div>
              )}
            </div>

            {/* Section: Top steps */}
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 800,
                marginBottom: '14px',
                color: 'var(--text-primary)'
              }}
            >
              هەنگاوەکانی تەواوکردن (Top steps)
            </h3>

            {/* Steps Container Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid var(--border-subtle)',
                padding: '6px 20px',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '26px'
              }}
            >
              {[
                {
                  icon: <Send size={18} />,
                  title: '١. ناردنی پارە بۆ ژمارەی سەرەوە',
                  desc: 'بڕی 5,000 دیناری عێراقی لە ڕێگەی ئەپی بانکییەکەتەوە ڕەوانە بکە.'
                },
                {
                  icon: <FileText size={18} />,
                  title: '٢. تۆمارکردنی Transaction ID',
                  desc: 'ژمارەی مامەڵە یاخود وێنەی پسوولەکەت لە فۆڕمەکەی خوارەوە دابنێ.'
                },
                {
                  icon: <ShieldCheck size={18} />,
                  title: '٣. چالاکبوونی خێرای VIP',
                  desc: 'بەڕێوەبەر لە کەمترین ماوەدا هەژمارەکەت بەرزدەکاتەوە بۆ VIP.'
                }
              ].map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px 0',
                    borderBottom: idx < 2 ? '1px solid var(--border-subtle)' : 'none'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8',
                      flexShrink: 0
                    }}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text-primary)' }}>
                      {step.title}
                    </h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Submission Form (Revolut Minimalist Card) */}
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 800,
                marginBottom: '14px',
                color: 'var(--text-primary)'
              }}
            >
              فۆڕمی پشتڕاستکردنەوە (Submit Details)
            </h3>

            <form
              onSubmit={handleSubmit}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid var(--border-subtle)',
                padding: '22px 20px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '20px'
              }}
            >
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  ناوی تەواو
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ناوی سیانی بنووسە"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '14px',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  ژمارەی مۆبایل
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0750 xxx xxxx"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '14px',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    direction: 'ltr',
                    textAlign: 'right',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Transaction ID */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  کۆدی حەواڵە (Transaction ID)
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="نموونە: FIB-892301 یان ژمارەی وەصڵ"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '14px',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    direction: 'ltr',
                    textAlign: 'right',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Receipt Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  وێنەی پسوولە (دڵخوازی)
                </label>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '18px 14px',
                    borderRadius: '14px',
                    border: '2px dashed var(--border-subtle)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    minHeight: '80px'
                  }}
                >
                  {receiptName ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600 }}>
                        📄 {receiptName}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setReceiptName('');
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        لابردن
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={24} color="#38bdf8" />
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        بارکردنی وێنەی پسوولە (JPG, PNG)
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Submit Pill Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  height: '56px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#ffffff',
                  color: '#08090C',
                  fontSize: '16px',
                  fontWeight: 900,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(255, 255, 255, 0.16)',
                  marginTop: '8px',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span>{isSubmitting ? 'خەریکی ناردنە...' : 'ناردنی داواکاری و چالاککردنی VIP'}</span>
              </button>
            </form>

            {/* Footer Branding */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 6px',
                fontSize: '12px',
                color: 'var(--text-muted)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crown size={14} color="#E2B755" />
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Rwanin Secure Pay</span>
              </div>
              <div>
                <span>پارێزراوە لەگەڵ سیستمەکانی FIB و Qi Card</span>
              </div>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
};
