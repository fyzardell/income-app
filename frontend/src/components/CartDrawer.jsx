import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, QrCode, CreditCard, Banknote, ShieldCheck, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export const CartDrawer = ({ onOpenAuth, onOrderSuccess }) => {
  const { cartItems, totalAmount, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart } = useCart();
  const { selectedBranch, tableInfo, bindTable } = useBranch();
  const { user, isAuthenticated } = useAuth();

  const [tables, setTables] = useState([]);
  const [selectedTableCode, setSelectedTableCode] = useState('');
  const [selectedQRToken, setSelectedQRToken] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, qris, bank_transfer, ewallet
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch branch dining tables for selection if not scanned from QR
  useEffect(() => {
    if (selectedBranch) {
      api.getBranchTables(selectedBranch.id)
        .then((data) => {
          setTables(data || []);
          if (tableInfo) {
            setSelectedTableCode(tableInfo.table_code);
            setSelectedQRToken(tableInfo.qr_token);
          } else if (data && data.length > 0) {
            setSelectedTableCode(data[0].table_code);
            setSelectedQRToken(data[0].qr_token);
          }
        })
        .catch((err) => console.log('Error loading tables:', err));
    }
  }, [selectedBranch, tableInfo]);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    setErrorMessage('');

    if (!isAuthenticated) {
      setIsCartOpen(false);
      onOpenAuth();
      return;
    }

    if (!selectedBranch) {
      setErrorMessage('Harap pilih cabang terlebih dahulu');
      return;
    }

    if (!selectedQRToken) {
      setErrorMessage('Harap pilih Meja Dine-in Anda');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage('Keranjang masih kosong');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        branch_id: selectedBranch.id,
        table_code: selectedTableCode,
        qr_token: selectedQRToken,
        payment_method: paymentMethod,
        notes: orderNotes,
        items: cartItems.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          notes: item.notes || '',
          options: item.options.map((opt) => ({ option_id: opt.option_id })),
        })),
      };

      const createdOrder = await api.createOrder(orderPayload);
      clearCart();
      setIsCartOpen(false);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#A07C3E', '#E8E0CC', '#7A2A2A'],
      });

      if (onOrderSuccess) {
        onOrderSuccess(createdOrder);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 8, 5, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={() => setIsCartOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: 'var(--ink)',
          borderLeft: '1px solid var(--line-light)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
          color: 'var(--parchment)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--line-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--brass)', fontFamily: 'var(--mono)' }}>
              Ledger Pesanan
            </span>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: '20px', margin: 0 }}>
              Keranjang Dine-in
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--parchment)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Branch & Dine-in Table Warning */}
        <div style={{ padding: '12px 20px', background: 'rgba(160, 124, 62, 0.1)', borderBottom: '1px solid var(--line-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Cabang: <strong>{selectedBranch?.name}</strong></span>
            {tableInfo ? (
              <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'var(--mono)' }}>
                <ShieldCheck size={14} /> QR Terverifikasi
              </span>
            ) : (
              <span style={{ color: 'var(--brass)', fontSize: '12px', fontFamily: 'var(--mono)' }}>
                Pilih Meja
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                color: '#fca5a5',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
              <p style={{ fontFamily: 'var(--display)', fontSize: '20px', marginBottom: '8px' }}>Keranjang Kosong</p>
              <p style={{ fontSize: '13px' }}>Pilih menu kopi atau bakery favorit Anda untuk mulai memesan.</p>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(232, 224, 204, 0.04)',
                  border: '1px solid rgba(232, 224, 204, 0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <img
                  src={item.productImage || '/assets/img/gula_aren.jpg'}
                  alt={item.productName}
                  style={{ width: '64px', height: '64px', borderRadius: '6px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '15px', margin: 0, fontWeight: '600' }}>{item.productName}</h4>
                    <button
                      onClick={() => removeFromCart(index)}
                      style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: '2px' }}
                      title="Hapus"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Options Pill */}
                  {item.options && item.options.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                      {item.options.map((opt, oi) => (
                        <span
                          key={oi}
                          style={{
                            fontSize: '11px',
                            background: 'rgba(232, 224, 204, 0.08)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: 'var(--gray)',
                            fontFamily: 'var(--mono)',
                          }}
                        >
                          {opt.option_name_snapshot}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.notes && (
                    <p style={{ fontSize: '11px', color: 'var(--brass)', fontStyle: 'italic', margin: '2px 0 6px 0' }}>
                      “{item.notes}”
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: '700', color: 'var(--brass)' }}>
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>

                    {/* Quantity Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        style={{
                          background: 'rgba(232,224,204,0.1)',
                          border: 'none',
                          borderRadius: '4px',
                          width: '24px',
                          height: '24px',
                          color: 'var(--parchment)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', minWidth: '16px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        style={{
                          background: 'rgba(232,224,204,0.1)',
                          border: 'none',
                          borderRadius: '4px',
                          width: '24px',
                          height: '24px',
                          color: 'var(--parchment)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {cartItems.length > 0 && (
            <>
              {/* Dining Table Selection */}
              <div style={{ borderTop: '1px solid rgba(232,224,204,0.1)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  <QrCode size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Nomor Meja Dine-in
                </label>
                {tableInfo ? (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(160, 124, 62, 0.15)',
                      border: '1px solid var(--brass)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>Terikat Meja: <strong>{tableInfo.table_code}</strong></span>
                    <span style={{ fontSize: '11px', color: 'var(--brass)', fontFamily: 'var(--mono)' }}>Scan QR Meja</span>
                  </div>
                ) : (
                  <select
                    value={selectedQRToken}
                    onChange={(e) => {
                      const t = tables.find((item) => item.qr_token === e.target.value);
                      if (t) {
                        setSelectedTableCode(t.table_code);
                        setSelectedQRToken(t.qr_token);
                        bindTable(t);
                      }
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(232, 224, 204, 0.05)',
                      border: '1px solid rgba(232, 224, 204, 0.2)',
                      borderRadius: '6px',
                      padding: '10px',
                      color: 'var(--parchment)',
                      fontSize: '13px',
                    }}
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.qr_token} style={{ background: '#1B160E' }}>
                        {t.table_code}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Payment Method Selector */}
              <div style={{ borderTop: '1px solid rgba(232,224,204,0.1)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Metode Pembayaran
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      background: paymentMethod === 'cash' ? 'rgba(160, 124, 62, 0.2)' : 'rgba(232, 224, 204, 0.04)',
                      border: `1px solid ${paymentMethod === 'cash' ? 'var(--brass)' : 'rgba(232, 224, 204, 0.12)'}`,
                      color: 'var(--parchment)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Banknote size={15} color="var(--brass)" />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Cash di Kasir</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--gray)' }}>Bayar saat ambil pesanan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      background: paymentMethod === 'qris' ? 'rgba(160, 124, 62, 0.2)' : 'rgba(232, 224, 204, 0.04)',
                      border: `1px solid ${paymentMethod === 'qris' ? 'var(--brass)' : 'rgba(232, 224, 204, 0.12)'}`,
                      color: 'var(--parchment)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <QrCode size={15} color="var(--brass)" />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>QRIS (Instant)</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--gray)' }}>GoPay, BCA, OVO, Dana</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      background: paymentMethod === 'bank_transfer' ? 'rgba(160, 124, 62, 0.2)' : 'rgba(232, 224, 204, 0.04)',
                      border: `1px solid ${paymentMethod === 'bank_transfer' ? 'var(--brass)' : 'rgba(232, 224, 204, 0.12)'}`,
                      color: 'var(--parchment)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={15} color="var(--brass)" />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Virtual Account</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--gray)' }}>BCA, Mandiri, BRI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ewallet')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      background: paymentMethod === 'ewallet' ? 'rgba(160, 124, 62, 0.2)' : 'rgba(232, 224, 204, 0.04)',
                      border: `1px solid ${paymentMethod === 'ewallet' ? 'var(--brass)' : 'rgba(232, 224, 204, 0.12)'}`,
                      color: 'var(--parchment)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={15} color="var(--brass)" />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>E-Wallet</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--gray)' }}>ShopeePay, OVO</span>
                  </button>
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Catatan Keseluruhan Pesanan
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Contoh: Tolong antarkan langsung ke meja..."
                  style={{
                    width: '100%',
                    background: 'rgba(232, 224, 204, 0.05)',
                    border: '1px solid rgba(232, 224, 204, 0.15)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--parchment)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer & Checkout CTA */}
        {cartItems.length > 0 && (
          <div
            style={{
              padding: '20px',
              borderTop: '1px solid var(--line-light)',
              background: 'rgba(18, 14, 10, 0.98)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Total Ledger Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--gray)', textTransform: 'uppercase' }}>
                Total Transaksi
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '20px', fontWeight: '700', color: 'var(--brass)' }}>
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Authentication status helper */}
            {!isAuthenticated ? (
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onOpenAuth();
                }}
                style={{
                  width: '100%',
                  background: 'var(--brass)',
                  color: 'var(--ink)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '14px',
                  fontFamily: 'var(--mono)',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>Login dengan WhatsApp untuk Checkout</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                disabled={submitting}
                onClick={handleCheckout}
                style={{
                  width: '100%',
                  background: submitting ? 'var(--gray)' : 'var(--brass)',
                  color: 'var(--ink)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '14px',
                  fontFamily: 'var(--mono)',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>{submitting ? 'Memproses Order...' : 'Konfirmasi Pesanan Sekarang'}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

