import React, { useState, useEffect, useMemo } from 'react';
import { paymentService } from '../services/paymentService';
import { adminService } from '../services/adminService';
import { useAuth } from '../hooks/useAuth';
import { PaymentRequest } from '../types/movie';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  FileText,
  DollarSign,
  Eye,
  PlusCircle,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [fibNumber, setFibNumber] = useState('');
  const [qiCardNumber, setQiCardNumber] = useState('');
  const [vipPrice, setVipPrice] = useState('5,000 IQD');
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    paymentService.getPaymentConfig().then((cfg) => {
      if (cfg.fibNumber) setFibNumber(cfg.fibNumber);
      if (cfg.qiCardNumber) setQiCardNumber(cfg.qiCardNumber);
      if (cfg.vipPriceText) setVipPrice(cfg.vipPriceText);
    });
  }, []);

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await paymentService.updatePaymentConfig({
        fibNumber: fibNumber.trim(),
        qiCardNumber: qiCardNumber.trim(),
        vipPriceText: vipPrice.trim()
      }, user?.email || 'rwanin1@gmail.com');
      showToast('ژمارەی هەژماری FIB و ڕێکخستنی پارەدان نوێکرایەوە', 'success');
      setConfigModalOpen(false);
    } catch {
      showToast('هەڵەیەک ڕوویدا', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = paymentService.subscribeToPayments((data) => {
      setPayments(data);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        (p.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.transactionId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.userPhone || '').includes(searchQuery);

      if (statusFilter === 'All') return matchSearch;

      const pStatus = (p.status || '').toLowerCase();
      const fStatus = statusFilter.toLowerCase();
      return matchSearch && pStatus === fStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  const handleUpdateStatus = async (paymentId: string, status: 'Approved' | 'Rejected') => {
    try {
      const updated = await paymentService.updatePaymentStatus(
        paymentId,
        status,
        user?.email || 'rwanin1@gmail.com'
      );
      setPayments(updated);

      showToast(
        status === 'Approved'
          ? 'پارەدانەکە بە سەرکەوتوویی پەسەندکرا و بەشداریکردنی VIP ی بەکارهێنەر چالاککرا!'
          : 'داواکاری پارەدانەکە ڕەتکرایەوە',
        status === 'Approved' ? 'success' : 'info'
      );
    } catch (err) {
      showToast('کێشەیەک لە نوێکردنەوەی دۆخی پارەدان ڕوویدا', 'error');
    }
  };

  const handleAddTestPayment = async () => {
    try {
      const randomTx = `FIB-${Math.floor(10000000 + Math.random() * 90000000)}`;
      await paymentService.submitPayment({
        userId: 'usr_4',
        userName: 'زانا سلێمانی (داواکاری نوێی VIP)',
        userPhone: '0770 987 6543',
        method: 'FIB',
        amount: '5,000 IQD',
        transactionId: randomTx,
        receiptImage: 'receipt_fib_sample.png'
      });
      showToast('داواکاری پارەدانی تاقیکاری بە سەرکەوتوویی زیادکرا!', 'success');
    } catch (e) {
      showToast('هەڵە لە زیادکردنی پارەدانی تاقیکاری', 'error');
    }
  };

  const pendingCount = payments.filter((p) => (p.status || '').toLowerCase() === 'pending').length;
  const approvedCount = payments.filter((p) => (p.status || '').toLowerCase() === 'approved').length;

  return (
    <div className="admin-content-pad" style={{ padding: 'clamp(14px, 3.5vw, 32px)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
            بەڕێوەبردنی پارەدانەکان (Payments & Subscriptions)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            وردبینیکردن و پەسەندکردنی پارەدانەکانی FIB، Qi Card و QR بۆ بەشداربووانی VIP.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={() => setConfigModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)', color: '#fff' }}
          >
            <CreditCard size={16} />
            <span>دەستکاری ژمارەی FIB و باڵانس</span>
          </Button>

          <Button
            variant="secondary"
            onClick={handleAddTestPayment}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <PlusCircle size={16} />
            <span>ناردنی داواکاری تاقیکاری</span>
          </Button>
        </div>
      </div>

      {/* Stats Quick Badges */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b'
            }}
          >
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>چاوەڕوانکراوی پەسەندکردن</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>{pendingCount} داواکاری</div>
          </div>
        </div>

        <div
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}
          >
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>پەسەندکراوەکان</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>{approvedCount} مامەڵە</div>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            minWidth: '320px'
          }}
        >
          <Search size={18} color="var(--text-muted)" style={{ marginLeft: '10px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەپێی ناوی بەکارهێنەر، ژمارەی مۆبایل، Transaction ID..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '13px',
              width: '100%'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'All', label: 'هەمووی' },
            { id: 'Pending', label: `چاوەڕوانکراو (${pendingCount})` },
            { id: 'Approved', label: 'پەسەندکراو' },
            { id: 'Rejected', label: 'ڕەتکراوە' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12.5px',
                fontWeight: 700,
                backgroundColor:
                  statusFilter === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
                color: statusFilter === tab.id ? '#38bdf8' : 'var(--text-silver)',
                border: statusFilter === tab.id ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div
        className="admin-table-container"
      >
        <table style={{ minWidth: '760px', width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>ناوی بەکارهێنەر</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>مۆبایل</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>شێوازی پارەدان</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Transaction ID</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>بڕی پارە</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>دۆخ</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>کات</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>کردارەکانی پەسەندکردن</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  هیچ داواکارییەکی پارەدان نەدۆزرایەوە
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => {
                const isPending = (p.status || '').toLowerCase() === 'pending';
                const isApproved = (p.status || '').toLowerCase() === 'approved';
                const isRejected = (p.status || '').toLowerCase() === 'rejected';

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{p.userName}</span>
                        {isApproved && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              color: '#E2B755',
                              backgroundColor: 'rgba(226, 183, 85, 0.15)',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            VIP
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-silver)', direction: 'ltr', textAlign: 'right' }}>
                      {p.userPhone}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor:
                            p.method === 'FIB'
                              ? 'rgba(56, 189, 248, 0.15)'
                              : p.method === 'Qi Card'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(52, 211, 153, 0.15)',
                          color:
                            p.method === 'FIB' ? '#38bdf8' : p.method === 'Qi Card' ? '#f59e0b' : '#34d399'
                        }}
                      >
                        {p.method}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '13px', color: '#fff' }}>
                      {p.transactionId}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 800, color: '#E2B755' }}>
                      {p.amount}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor:
                            isApproved
                              ? 'rgba(52, 211, 153, 0.15)'
                              : isPending
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            isApproved ? '#34d399' : isPending ? '#f59e0b' : '#ef4444'
                        }}
                      >
                        {isApproved ? 'پەسەندکراو' : isPending ? 'چاوەڕوانکراو' : 'ڕەتکراوە'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {p.date || p.createdAt}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedPayment(p);
                            setViewModalOpen(true);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-silver)',
                            cursor: 'pointer'
                          }}
                          title="بینینی وەصڵ"
                        >
                          <Eye size={15} />
                        </button>

                        {isPending && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'Approved')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 14px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: '#10b981',
                                border: 'none',
                                color: '#08090C',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              <CheckCircle2 size={14} />
                              <span>پەسەندکردن</span>
                            </button>

                            <button
                              onClick={() => handleUpdateStatus(p.id, 'Rejected')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <XCircle size={14} />
                              <span>ڕەتکردنەوە</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <span style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 700 }}>
                            ✓ VIP چالاکە
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Details / Receipt Preview Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="وردەکاری پارەدان و پسوولە"
        maxWidth="520px"
      >
        {selectedPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ناوی بەکارهێنەر</span>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{selectedPayment.userName}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ژمارەی مۆبایل</span>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{selectedPayment.userPhone}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>شێوازی پارەدان</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>{selectedPayment.method}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>بڕی پارە</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#E2B755' }}>{selectedPayment.amount}</div>
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Transaction ID</span>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#fff', fontWeight: 700 }}>
                {selectedPayment.transactionId}
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                وێنەی پسوولە (Receipt Image)
              </span>
              <div
                style={{
                  height: '140px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '13px'
                }}
              >
                {selectedPayment.receiptImage ? (
                  <span>پسوولە: {selectedPayment.receiptImage}</span>
                ) : (
                  <span>وێنەی وەصڵ بارنەکراوە</span>
                )}
              </div>
            </div>

            {(selectedPayment.status || '').toLowerCase() === 'pending' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <Button
                  variant="silver"
                  style={{ flex: 1, backgroundColor: '#10b981', color: '#08090C', fontWeight: 800 }}
                  onClick={() => {
                    handleUpdateStatus(selectedPayment.id, 'Approved');
                    setViewModalOpen(false);
                  }}
                >
                  پەسەندکردن و چالاککردنی VIP
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    handleUpdateStatus(selectedPayment.id, 'Rejected');
                    setViewModalOpen(false);
                  }}
                >
                  ڕەتکردنەوە
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Payment Settings Modal */}
      <Modal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        title="دەستکاریکردنی ژمارەکانی هەژماری پارەدان (FIB & Qi Card)"
        maxWidth="540px"
      >
        <form onSubmit={handleSavePaymentConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px', direction: 'rtl' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            ئەم ژمارەیە ڕاستەوخۆ لە لاپەڕەی پارەدانی بەکارهێنەران پشان دەدرێت بۆ وەرگرتنی پارەی بەشداریکردنی VIP.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#38bdf8' }}>
              ژمارەی هەژماری First Iraqi Bank (FIB)
            </label>
            <input
              type="text"
              required
              value={fibNumber}
              onChange={(e) => setFibNumber(e.target.value)}
              placeholder="نموونە: 0750 999 8888"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#fff',
                direction: 'ltr',
                textAlign: 'right',
                fontFamily: 'monospace',
                fontSize: '15px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#f59e0b' }}>
              ژمارەی کارتی Qi Card
            </label>
            <input
              type="text"
              required
              value={qiCardNumber}
              onChange={(e) => setQiCardNumber(e.target.value)}
              placeholder="نموونە: 9845 1204 9921 5410"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fff',
                direction: 'ltr',
                textAlign: 'right',
                fontFamily: 'monospace',
                fontSize: '15px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#E2B755' }}>
              نرخی پاکێجی VIP (مانگانە)
            </label>
            <input
              type="text"
              required
              value={vipPrice}
              onChange={(e) => setVipPrice(e.target.value)}
              placeholder="5,000 IQD"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <Button
              type="submit"
              variant="silver"
              disabled={savingConfig}
              style={{ flex: 1, backgroundColor: '#38bdf8', color: '#08090C', fontWeight: 800 }}
            >
              {savingConfig ? 'خەریکی پاشەکەوتکردنە...' : 'پاشەکەوتکردنی گۆڕانکارییەکان'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfigModalOpen(false)}
            >
              داخستن
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
