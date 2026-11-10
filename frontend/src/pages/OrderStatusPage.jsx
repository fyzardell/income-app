import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { Clock, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, XCircle, CreditCard, Copy, Check } from 'lucide-react';

export const OrderStatusPage = ({ orderNumber, onBack }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  const fetchOrder = () => {
    if (!orderNumber) return;
    api.trackOrder(orderNumber)
      .then((data) => {
        setOrder(data);
        setError('');
      })
      .catch((err) => {
        setError(err.message || 'Gagal memuat status pesanan');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    // Auto refresh status every 4 seconds
    const interval = setInterval(fetchOrder, 4000);
    return () => clearInterval(interval);
  }, [orderNumber]);

  const handleSimulatePaymentSuccess = async () => {
    if (!order) return;
    setSimulatingPayment(true);
    try {
      // Simulate payment gateway webhook callback
      const mockEventId = `evt_sim_${Date.now()}`;
      // Compute mock signature on backend or send payload
      await api.simulateWebhook({
        event_id: mockEventId,
        transaction_id: order.payment?.provider_transaction_id || `txn_${Date.now()}`,
        order_number: order.order_number,
        amount: order.total_amount,
        currency: 'IDR',
        payment_status: 'paid',
        signature: 'simulated_signature',
        raw_payload_json: JSON.stringify({ simulated: true, time: new Date() }),
      });
      fetchOrder();
    } catch (err) {
      // If signature fails, update directly or notify
      alert('Simulasi webhook: ' + err.message);
    } finally {
      setSimulatingPayment(false);
    }
  };

  const handleRequestCancel = async (e) => {
    e.preventDefault();
    if (!order) return;
    setCancelling(true);
    try {
      await api.requestCancellation(order.id, cancelReason);
      setCancelModalOpen(false);
      alert('Permintaan pembatalan berhasil dikirim ke kasir. Menunggu persetujuan kasir.');
      fetchOrder();
    } catch (err) {
      alert('Gagal mengajukan pembatalan: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

  const copyVA = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--brass)', fontFamily: 'var(--mono)' }}>
        Memuat status pesanan...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '30px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error || 'Pesanan tidak ditemukan'}</p>
        <button
          onClick={onBack}
          style={{
            background: 'var(--brass)',
            color: 'var(--ink)',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontWeight: '600',
          }}
        >
          Kembali ke Menu
        </button>
      </div>
    );
  }

  const steps = [
    { key: 'placed', label: 'Pesanan Diterima', desc: 'Menunggu konfirmasi barista' },
    { key: 'preparing', label: 'Sedang Disiapkan', desc: 'Barista meracik pesanan' },
    { key: 'ready', label: 'Siap Diambil', desc: 'Silakan ambil di kasir' },
    { key: 'completed', label: 'Selesai', desc: 'Terima kasih telah berkunjung' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === order.order_status);
  const isCancelled = order.order_status === 'cancelled';

  return (
    <div className="container" style={{ maxWidth: '780px', margin: '40px auto 100px auto', padding: '0 20px' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--parchment)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontFamily: 'var(--mono)',
          fontSize: '13px',
        }}
      >
        <ArrowLeft size={16} /> Kembali ke Menu
      </button>

      {/* Main Order Card */}
      <div
        style={{
          background: 'var(--ink)',
          border: '1px solid var(--line-light)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          color: 'var(--parchment)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--line-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(232, 224, 204, 0.03)',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--brass)', fontFamily: 'var(--mono)' }}>
              Dine-in Tracking — {order.branch_name}
            </span>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: '26px', margin: '4px 0' }}>
              {order.order_number}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--gray)', margin: 0 }}>
              Meja: <strong>{order.table_code}</strong> • Atas Nama: <strong>{order.customer_name_snapshot}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={fetchOrder}
              style={{
                background: 'rgba(232, 224, 204, 0.08)',
                border: '1px solid rgba(232, 224, 204, 0.2)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--parchment)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontFamily: 'var(--mono)',
              }}
              title="Perbarui Status"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Status Stepper */}
        <div style={{ padding: '30px 24px', borderBottom: '1px solid var(--line-light)' }}>
          {isCancelled ? (
            <div
              style={{
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#fca5a5',
              }}
            >
              <XCircle size={24} />
              <div>
                <strong>Pesanan Dibatalkan</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px' }}>Pesanan ini telah dibatalkan melalui persetujuan kasir.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', position: 'relative' }}>
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.key} style={{ textAlign: 'center', position: 'relative' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        margin: '0 auto 8px auto',
                        background: isPassed ? 'var(--brass)' : 'rgba(232, 224, 204, 0.1)',
                        color: isPassed ? 'var(--ink)' : 'var(--gray)',
                        border: `2px solid ${isCurrent ? '#4ade80' : 'transparent'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '14px',
                        fontFamily: 'var(--mono)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isPassed ? <CheckCircle2 size={18} /> : idx + 1}
                    </div>
                    <span style={{ display: 'block', fontSize: '13px', fontWeight: isCurrent ? '700' : '500', color: isPassed ? 'var(--parchment)' : 'var(--gray)' }}>
                      {step.label}
                    </span>
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--gray)', marginTop: '2px' }}>
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Details Section */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--line-light)', background: 'rgba(160, 124, 62, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', margin: 0, fontWeight: '600' }}>
              Status Pembayaran
            </h3>
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '12px',
                background: order.payment_status === 'paid' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: order.payment_status === 'paid' ? '#4ade80' : '#f59e0b',
                textTransform: 'uppercase',
              }}
            >
              {order.payment_status === 'paid' ? 'LUNAS (PAID)' : 'MENUNGGU PEMBAYARAN'}
            </span>
          </div>

          {order.payment_status !== 'paid' && (
            <div>
              {order.payment?.method === 'cash' ? (
                <div style={{ background: 'rgba(232, 224, 204, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(232, 224, 204, 0.1)' }}>
                  <p style={{ margin: '0 0 6px 0', fontWeight: '600' }}>Pembayaran Cash di Kasir</p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--gray)' }}>
                    Silakan siapkan uang pas sebesar <strong>Rp {order.total_amount.toLocaleString('id-ID')}</strong>. Pembayaran dilakukan langsung di meja kasir saat nama/nomor meja Anda dipanggil.
                  </p>
                </div>
              ) : order.payment?.method === 'qris' ? (
                <div style={{ textAlign: 'center', padding: '20px', background: '#fff', borderRadius: '8px', color: '#1B160E' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontFamily: 'var(--mono)' }}>QRIS PEMBAYARAN INSTANT</h4>
                  <div style={{ display: 'inline-block', padding: '10px', background: '#fff' }}>
                    <QRCodeSVG
                      value={order.payment?.qr_string || `https://income.test/pay/${order.order_number}`}
                      size={180}
                    />
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                    Scan QRIS dengan GoPay, BCA, OVO, ShopeePay, atau Mobile Banking apa pun.
                  </p>
                </div>
              ) : (
                <div style={{ background: 'rgba(232, 224, 204, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(232, 224, 204, 0.1)' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--gray)' }}>Nomor Virtual Account:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontFamily: 'var(--mono)', fontSize: '20px', color: 'var(--brass)' }}>
                      {order.payment?.va_number || '88012839210291'}
                    </strong>
                    <button
                      onClick={() => copyVA(order.payment?.va_number || '88012839210291')}
                      style={{
                        background: 'rgba(232, 224, 204, 0.1)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        color: 'var(--parchment)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                      {copied ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                </div>
              )}

              {/* Developer Test Webhook Simulator */}
              {order.payment?.method !== 'cash' && (
                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                  <button
                    disabled={simulatingPayment}
                    onClick={handleSimulatePaymentSuccess}
                    style={{
                      background: 'rgba(74, 222, 128, 0.15)',
                      border: '1px solid #4ade80',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      color: '#4ade80',
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    {simulatingPayment ? 'Memproses Webhook...' : '⚡ Simulasikan Notifikasi Bayar Berhasil (Webhook Gateway)'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Items Breakdown */}
        <div style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', fontWeight: '600' }}>
            Rincian Item Pesanan
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {order.items && order.items.map((it, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px dashed rgba(232, 224, 204, 0.1)',
                  paddingBottom: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>
                    {it.quantity}x {it.product_name_snapshot}
                  </div>
                  {it.options && it.options.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--gray)', fontFamily: 'var(--mono)' }}>
                      {it.options.map((o) => o.option_name_snapshot).join(', ')}
                    </div>
                  )}
                  {it.notes && (
                    <div style={{ fontSize: '11px', color: 'var(--brass)', fontStyle: 'italic' }}>
                      “{it.notes}”
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: '600', color: 'var(--parchment)' }}>
                  Rp {Number(it.subtotal).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '16px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '14px', textTransform: 'uppercase', color: 'var(--gray)' }}>
              Total Pembayaran
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '22px', fontWeight: '700', color: 'var(--brass)' }}>
              Rp {Number(order.total_amount).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        {!isCancelled && order.order_status !== 'completed' && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--line-light)',
              background: 'rgba(232, 224, 204, 0.02)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => setCancelModalOpen(true)}
              style={{
                background: 'none',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                padding: '8px 14px',
                color: '#ef4444',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
              }}
            >
              Ajukan Pembatalan Pesanan
            </button>
          </div>
        )}
      </div>

      {/* Cancellation Request Modal */}
      {cancelModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--ink)',
              border: '1px solid var(--line-light)',
              borderRadius: '10px',
              maxWidth: '440px',
              width: '100%',
              padding: '20px',
              color: 'var(--parchment)',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontFamily: 'var(--display)', fontSize: '18px' }}>
              Ajukan Pembatalan Pesanan
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: '1.4' }}>
              Berdasarkan kebijakan, pembatalan pesanan dine-in memerlukan persetujuan kasir di cabang bersangkutan.
            </p>
            <form onSubmit={handleRequestCancel} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Alasan pembatalan (misal: ingin mengubah pesanan / salah pilih meja)..."
                required
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(232, 224, 204, 0.05)',
                  border: '1px solid rgba(232, 224, 204, 0.2)',
                  borderRadius: '6px',
                  padding: '10px',
                  color: 'var(--parchment)',
                  fontSize: '13px',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(232, 224, 204, 0.2)',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    color: 'var(--parchment)',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  style={{
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: cancelling ? 'not-allowed' : 'pointer',
                  }}
                >
                  {cancelling ? 'Mengirim...' : 'Kirim Permintaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

