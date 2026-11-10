import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { api } from '../services/api';
import { Volume2, CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle, ArrowRight, ShieldAlert, Sparkles, Filter } from 'lucide-react';

export const CashierDashboard = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();

  // Branch assigned to this cashier
  const branchId = user?.branch_id || selectedBranch?.id || 1;

  const [activeTab, setActiveTab] = useState('orders'); // orders | stock | cancellations | speaker_logs
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [speakerLogs, setSpeakerLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [decideModal, setDecideModal] = useState(null); // { reqId, approve }
  const [decideNotes, setDecideNotes] = useState('');

  const loadAllData = () => {
    setLoading(true);
    Promise.all([
      api.getCashierOrders(branchId, statusFilter),
      api.getBranchMenu(branchId),
      api.getCancellations(),
      api.getSpeakerLogs(),
    ])
      .then(([ordersData, menuData, cancelData, speakerData]) => {
        setOrders(ordersData || []);
        setStockItems(menuData || []);
        setCancellations(cancelData || []);
        setSpeakerLogs(speakerData || []);
      })
      .catch((err) => console.error('Error fetching cashier data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAllData();
    // Poll active orders every 5 seconds
    const interval = setInterval(loadAllData, 5000);
    return () => clearInterval(interval);
  }, [branchId, statusFilter]);

  // Audio & Speech Synthesis Speaker Trigger
  const playChimeAndSpeak = (announcementText) => {
    try {
      // 1. Play audio chime tone via Web Audio API
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn('Audio chime note failed:', e);
    }

    // 2. Synthesize speech in Indonesian
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(announcementText);
        utterance.lang = 'id-ID';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }, 500);
    }
  };

  const handleSpeakerCall = async (orderId) => {
    setActionLoading(true);
    try {
      const res = await api.triggerSpeaker(orderId);
      playChimeAndSpeak(res.message);
      loadAllData();
    } catch (err) {
      alert('Gagal memanggil speaker: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setActionLoading(true);
    try {
      await api.updateOrderStatus(orderId, newStatus, `Diperbarui oleh kasir ${user?.name || ''}`);
      loadAllData();
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCash = async (orderId) => {
    const confirm = window.confirm('Konfirmasi bahwa customer telah membayar cash di meja kasir?');
    if (!confirm) return;
    setActionLoading(true);
    try {
      await api.confirmCashPayment(orderId);
      loadAllData();
    } catch (err) {
      alert('Gagal mengonfirmasi cash: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStock = async (productId, currentAvailable) => {
    try {
      await api.toggleProductAvailability(productId, !currentAvailable, branchId);
      setStockItems((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, is_available: !currentAvailable } : item))
      );
    } catch (err) {
      alert('Gagal mengubah stok: ' + err.message);
    }
  };

  const handleDecideCancellation = async (e) => {
    e.preventDefault();
    if (!decideModal) return;
    try {
      await api.decideCancellation(decideModal.reqId, decideModal.approve, decideNotes);
      setDecideModal(null);
      setDecideNotes('');
      loadAllData();
    } catch (err) {
      alert('Gagal memproses pembatalan: ' + err.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '30px auto 100px auto', padding: '0 20px', color: 'var(--parchment)' }}>
      {/* Dashboard Header */}
      <div
        style={{
          background: 'var(--ink)',
          border: '1px solid var(--line-light)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--brass)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
            Portal Operasional Kasir
          </span>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '26px', margin: '4px 0' }}>
            Kasir Cabang #{branchId}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray)', margin: 0 }}>
            Petugas Aktif: <strong>{user?.name}</strong> • Nomor: <strong>{user?.whatsapp_number}</strong>
          </p>
        </div>

        <button
          onClick={loadAllData}
          style={{
            background: 'rgba(232, 224, 204, 0.08)',
            border: '1px solid rgba(232, 224, 204, 0.2)',
            borderRadius: '6px',
            padding: '10px 16px',
            color: 'var(--parchment)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--mono)',
            fontSize: '13px',
          }}
        >
          <RefreshCw size={15} /> Muat Ulang Antrean
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--line-light)', paddingBottom: '12px', marginBottom: '24px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            background: activeTab === 'orders' ? 'var(--brass)' : 'rgba(232,224,204,0.05)',
            color: activeTab === 'orders' ? 'var(--ink)' : 'var(--parchment)',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 18px',
            fontFamily: 'var(--mono)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Antrean Pesanan ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          style={{
            background: activeTab === 'stock' ? 'var(--brass)' : 'rgba(232,224,204,0.05)',
            color: activeTab === 'stock' ? 'var(--ink)' : 'var(--parchment)',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 18px',
            fontFamily: 'var(--mono)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Kelola Stok Cabang
        </button>
        <button
          onClick={() => setActiveTab('cancellations')}
          style={{
            background: activeTab === 'cancellations' ? 'var(--brass)' : 'rgba(232,224,204,0.05)',
            color: activeTab === 'cancellations' ? 'var(--ink)' : 'var(--parchment)',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 18px',
            fontFamily: 'var(--mono)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          Permintaan Pembatalan
          {cancellations.filter((c) => c.status === 'requested').length > 0 && (
            <span
              style={{
                marginLeft: '8px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '10px',
              }}
            >
              {cancellations.filter((c) => c.status === 'requested').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('speaker_logs')}
          style={{
            background: activeTab === 'speaker_logs' ? 'var(--brass)' : 'rgba(232,224,204,0.05)',
            color: activeTab === 'speaker_logs' ? 'var(--ink)' : 'var(--parchment)',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 18px',
            fontFamily: 'var(--mono)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Riwayat Speaker Panggilan
        </button>
      </div>

      {/* ============ TAB 1: ORDERS BOARD ============ */}
      {activeTab === 'orders' && (
        <div>
          {/* Status Filter Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {['all', 'placed', 'preparing', 'ready', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'rgba(160, 124, 62, 0.25)' : 'rgba(232, 224, 204, 0.04)',
                  border: `1px solid ${statusFilter === st ? 'var(--brass)' : 'rgba(232, 224, 204, 0.12)'}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  color: statusFilter === st ? 'var(--brass)' : 'var(--gray)',
                  fontSize: '12px',
                  fontFamily: 'var(--mono)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {st === 'all' ? 'Semua Status' : st}
              </button>
            ))}
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--ink)', borderRadius: '10px', border: '1px solid var(--line-light)' }}>
              <p style={{ fontFamily: 'var(--display)', fontSize: '20px', color: 'var(--gray)' }}>Belum ada pesanan aktif</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {orders.map((o) => {
                const isPaid = o.payment_status === 'paid';
                return (
                  <div
                    key={o.id}
                    style={{
                      background: 'var(--ink)',
                      border: `1px solid ${o.order_status === 'ready' ? '#4ade80' : 'var(--line-light)'}`,
                      borderRadius: '10px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: o.order_status === 'ready' ? '0 0 20px rgba(74, 222, 128, 0.15)' : 'none',
                    }}
                  >
                    <div>
                      {/* Top Meta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '15px', fontWeight: '700', color: 'var(--brass)' }}>
                            {o.order_number}
                          </span>
                          <span
                            style={{
                              marginLeft: '8px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(160, 124, 62, 0.15)',
                              color: 'var(--parchment)',
                              fontSize: '12px',
                              fontFamily: 'var(--mono)',
                              fontWeight: '600',
                            }}
                          >
                            {o.table_code}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--mono)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            fontWeight: '700',
                            background:
                              o.order_status === 'ready'
                                ? 'rgba(74, 222, 128, 0.2)'
                                : o.order_status === 'preparing'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : o.order_status === 'completed'
                                ? 'rgba(232, 224, 204, 0.1)'
                                : 'rgba(59, 130, 246, 0.2)',
                            color:
                              o.order_status === 'ready'
                                ? '#4ade80'
                                : o.order_status === 'preparing'
                                ? '#f59e0b'
                                : o.order_status === 'completed'
                                ? 'var(--gray)'
                                : '#60a5fa',
                          }}
                        >
                          {o.order_status}
                        </span>
                      </div>

                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--parchment)' }}>
                        Pemesan: <strong>{o.customer_name_snapshot}</strong>
                      </p>

                      {/* Items */}
                      <div style={{ borderTop: '1px dashed rgba(232, 224, 204, 0.1)', borderBottom: '1px dashed rgba(232, 224, 204, 0.1)', padding: '10px 0', margin: '8px 0' }}>
                        {o.items && o.items.map((it, idx) => (
                          <div key={idx} style={{ marginBottom: '6px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span><strong>{it.quantity}x</strong> {it.product_name_snapshot}</span>
                              <span style={{ fontFamily: 'var(--mono)', color: 'var(--gray)' }}>
                                Rp {Number(it.subtotal).toLocaleString('id-ID')}
                              </span>
                            </div>
                            {it.options && it.options.length > 0 && (
                              <div style={{ fontSize: '11px', color: 'var(--gray)', fontFamily: 'var(--mono)' }}>
                                + {it.options.map((opt) => opt.option_name_snapshot).join(', ')}
                              </div>
                            )}
                            {it.notes && (
                              <div style={{ fontSize: '11px', color: 'var(--brass)', fontStyle: 'italic' }}>
                                “{it.notes}”
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Payment Status Pill */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 16px 0' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase' }}>Metode: </span>
                          <strong style={{ fontSize: '12px', fontFamily: 'var(--mono)' }}>{o.payment?.method?.toUpperCase() || 'CASH'}</strong>
                        </div>
                        <div>
                          <span
                            style={{
                              fontSize: '11px',
                              fontFamily: 'var(--mono)',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: isPaid ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: isPaid ? '#4ade80' : '#f87171',
                            }}
                          >
                            {isPaid ? 'LUNAS' : 'BELUM DIBAYAR'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--line-light)', paddingTop: '14px' }}>
                      {/* Cash confirmation button */}
                      {!isPaid && (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleConfirmCash(o.id)}
                          style={{
                            background: 'rgba(74, 222, 128, 0.15)',
                            border: '1px solid #4ade80',
                            borderRadius: '6px',
                            padding: '8px',
                            color: '#4ade80',
                            fontFamily: 'var(--mono)',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <CheckCircle2 size={14} /> Konfirmasi Pembayaran Cash
                        </button>
                      )}

                      {/* Advance workflow status buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {o.order_status === 'placed' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusChange(o.id, 'preparing')}
                            style={{
                              flex: 1,
                              background: 'var(--brass)',
                              color: 'var(--ink)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px',
                              fontFamily: 'var(--mono)',
                              fontWeight: '700',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Mulai Siapkan (Preparing)
                          </button>
                        )}

                        {o.order_status === 'preparing' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusChange(o.id, 'ready')}
                            style={{
                              flex: 1,
                              background: '#22c55e',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px',
                              fontFamily: 'var(--mono)',
                              fontWeight: '700',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Pesanan Siap (Ready)
                          </button>
                        )}

                        {o.order_status === 'ready' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusChange(o.id, 'completed')}
                            style={{
                              flex: 1,
                              background: 'rgba(232, 224, 204, 0.15)',
                              border: '1px solid rgba(232, 224, 204, 0.3)',
                              color: 'var(--parchment)',
                              borderRadius: '6px',
                              padding: '8px',
                              fontFamily: 'var(--mono)',
                              fontWeight: '700',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Selesaikan (Completed)
                          </button>
                        )}

                        {/* Speaker Announcement Button */}
                        {o.order_status === 'ready' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleSpeakerCall(o.id)}
                            style={{
                              background: 'var(--brass)',
                              color: 'var(--ink)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 14px',
                              fontFamily: 'var(--mono)',
                              fontWeight: '700',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                            title="Bunyikan Chime dan Panggil Nama Pemesan"
                          >
                            <Volume2 size={16} /> Panggil Speaker
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============ TAB 2: STOCK / AVAILABILITY ============ */}
      {activeTab === 'stock' && (
        <div style={{ background: 'var(--ink)', border: '1px solid var(--line-light)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: '20px', margin: '0 0 6px 0' }}>
              Ketersediaan Menu Cabang #{branchId}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--gray)', margin: 0 }}>
              Kasir dapat menandai menu yang habis khusus untuk cabangnya. Sistem secara otomatis membatalkan/membersihkan Redis cache untuk cabang ini.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {stockItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(232, 224, 204, 0.04)',
                  border: '1px solid rgba(232, 224, 204, 0.12)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{item.name}</h4>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--brass)' }}>
                    Rp {Number(item.price).toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStock(item.id, item.is_available)}
                  style={{
                    background: item.is_available ? '#22c55e' : '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.is_available ? 'Tersedia' : 'Habis'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ TAB 3: CANCELLATIONS ============ */}
      {activeTab === 'cancellations' && (
        <div style={{ background: 'var(--ink)', border: '1px solid var(--line-light)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: '20px', margin: '0 0 16px 0' }}>
            Permintaan Pembatalan Pesanan
          </h2>

          {cancellations.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: '13px' }}>Tidak ada permohonan pembatalan saat ini.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cancellations.map((cr) => (
                <div
                  key={cr.id}
                  style={{
                    background: 'rgba(232, 224, 204, 0.04)',
                    border: '1px solid rgba(232, 224, 204, 0.12)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontFamily: 'var(--mono)', fontSize: '15px', color: 'var(--brass)' }}>
                        {cr.order_number}
                      </strong>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background:
                            cr.status === 'approved'
                              ? 'rgba(74, 222, 128, 0.2)'
                              : cr.status === 'rejected'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                          color:
                            cr.status === 'approved'
                              ? '#4ade80'
                              : cr.status === 'rejected'
                              ? '#ef4444'
                              : '#f59e0b',
                          fontFamily: 'var(--mono)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {cr.status}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '13px' }}>
                      Pemohon: <strong>{cr.requester_name}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--gray)' }}>
                      Alasan: “{cr.reason}”
                    </p>
                  </div>

                  {cr.status === 'requested' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setDecideModal({ reqId: cr.id, approve: true })}
                        style={{
                          background: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Setujui Pembatalan
                      </button>
                      <button
                        onClick={() => setDecideModal({ reqId: cr.id, approve: false })}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ TAB 4: SPEAKER LOGS ============ */}
      {activeTab === 'speaker_logs' && (
        <div style={{ background: 'var(--ink)', border: '1px solid var(--line-light)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: '20px', margin: '0 0 16px 0' }}>
            Jejak Audit Panggilan Speaker
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {speakerLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  background: 'rgba(232, 224, 204, 0.04)',
                  border: '1px solid rgba(232, 224, 204, 0.1)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Volume2 size={16} color="var(--brass)" />
                    <strong style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>
                      {log.order_number} ({log.customer_name} - {log.table_code})
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--gray)', fontFamily: 'var(--mono)' }}>
                      Percobaan #{log.attempt_count}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 26px', fontSize: '12px', color: 'var(--gray)' }}>
                    “{log.message}”
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => playChimeAndSpeak(log.message)}
                  style={{
                    background: 'rgba(160, 124, 62, 0.15)',
                    border: '1px solid var(--brass)',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    color: 'var(--brass)',
                    fontSize: '11px',
                    fontFamily: 'var(--mono)',
                    cursor: 'pointer',
                  }}
                >
                  Putar Ulang Suara
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {decideModal && (
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
              {decideModal.approve ? 'Setujui Pembatalan Pesanan' : 'Tolak Pembatalan Pesanan'}
            </h3>
            <form onSubmit={handleDecideCancellation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                value={decideNotes}
                onChange={(e) => setDecideNotes(e.target.value)}
                placeholder="Catatan kasir untuk customer..."
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
                  onClick={() => setDecideModal(null)}
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
                  style={{
                    background: decideModal.approve ? '#22c55e' : '#ef4444',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Simpan Keputusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

