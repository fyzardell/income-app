import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Printer } from 'lucide-react';

export const TableQRPrint = ({ tables, branchId, onBack }) => {
  const origin = window.location.origin;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ background: '#fff', color: '#1B160E', minHeight: '100vh', padding: '30px' }}>
      {/* Screen toolbar (hidden during printing) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '16px',
          borderBottom: '1px solid #ddd',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#1B160E',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'var(--mono)',
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Admin
        </button>

        <button
          onClick={handlePrint}
          style={{
            background: '#1B160E',
            color: '#E8E0CC',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 18px',
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Printer size={16} /> Cetak / Print Kartu Meja (PDF)
        </button>
      </div>

      {/* Grid of Printable Table Tent Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '24px',
        }}
      >
        {tables.map((table) => {
          const qrUrl = `${origin}/?token=${table.qr_token}`;
          return (
            <div
              key={table.id}
              style={{
                border: '2px solid #1B160E',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                background: '#F7F3EB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                pageBreakInside: 'avoid',
              }}
            >
              <img src="/assets/img/logo_income.png" alt="INCOME" style={{ height: '36px', marginBottom: '8px' }} />
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', color: '#A07C3E' }}>
                Coffee &amp; Bakery — Dine-in
              </span>

              <h2 style={{ fontFamily: 'var(--display)', fontSize: '28px', margin: '8px 0 16px 0', color: '#1B160E' }}>
                {table.table_code}
              </h2>

              <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #1B160E', marginBottom: '14px' }}>
                <QRCodeSVG value={qrUrl} size={150} level="M" />
              </div>

              <p style={{ fontSize: '13px', margin: '0 0 6px 0', fontWeight: '600' }}>
                Pindai QR untuk Melihat Menu &amp; Pesan
              </p>
              <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: '#666' }}>
                Token: {table.qr_token}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

