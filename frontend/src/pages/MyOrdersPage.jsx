import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clock, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

export const MyOrdersPage = ({ onSelectOrder, onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCustomerOrders()
      .then((data) => setOrders(data || []))
      .catch((err) => console.error('Error fetching customer orders:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '40px auto 100px auto', padding: '0 20px', color: 'var(--parchment)' }}>
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

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: '26px', margin: '0 0 6px 0' }}>
          Riwayat Pesanan Saya
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--gray)', margin: 0 }}>
          Daftar seluruh pesanan dine-in Anda di seluruh cabang INCOME Coffee &amp; Bakery.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--mono)', color: 'var(--brass)' }}>
          Memuat riwayat pesanan...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background: 'var(--ink)', border: '1px solid var(--line-light)', borderRadius: '10px', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--gray)', fontSize: '15px' }}>Anda belum memiliki riwayat pesanan.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((o) => (
            <div
              key={o.id}
              onClick={() => onSelectOrder(o.order_number)}
              style={{
                background: 'var(--ink)',
                border: '1px solid var(--line-light)',
                borderRadius: '10px',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brass)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line-light)')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <strong style={{ fontFamily: 'var(--mono)', fontSize: '16px', color: 'var(--brass)' }}>
                    {o.order_number}
                  </strong>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontFamily: 'var(--mono)',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      background:
                        o.order_status === 'ready'
                          ? 'rgba(74, 222, 128, 0.2)'
                          : o.order_status === 'preparing'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(232, 224, 204, 0.1)',
                      color:
                        o.order_status === 'ready'
                          ? '#4ade80'
                          : o.order_status === 'preparing'
                          ? '#f59e0b'
                          : 'var(--parchment)',
                    }}
                  >
                    {o.order_status}
                  </span>
                </div>

                <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>
                  Cabang: <strong>{o.branch_name}</strong> • Meja: <strong>{o.table_code}</strong>
                </p>

                <span style={{ fontSize: '11px', color: 'var(--gray)', fontFamily: 'var(--mono)' }}>
                  {new Date(o.created_at).toLocaleString('id-ID')}
                </span>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: '700', color: 'var(--brass)' }}>
                    Rp {Number(o.total_amount).toLocaleString('id-ID')}
                  </div>
                  <span style={{ fontSize: '11px', color: o.payment_status === 'paid' ? '#4ade80' : '#f59e0b', fontFamily: 'var(--mono)' }}>
                    {o.payment_status === 'paid' ? 'LUNAS' : 'PENDING'}
                  </span>
                </div>
                <ArrowRight size={18} color="var(--gray)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

