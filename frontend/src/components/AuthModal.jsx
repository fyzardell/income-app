import React, { useState } from 'react';
import { X, Smartphone, KeyRound, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithToken } = useAuth();
  const [activeTab, setActiveTab] = useState('customer'); // customer | staff
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError('Masukkan nomor WhatsApp');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.requestOTP(phone);
      setOtpSent(true);
      if (res.debug_otp) {
        setDebugOtp(res.debug_otp);
        setOtp(res.debug_otp); // auto-fill for developer convenience
      }
    } catch (err) {
      setError(err.message || 'Gagal mengirim OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Masukkan kode OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.verifyOTP(phone, otp, name);
      loginWithToken(res.token, res.user);
      onClose();
      if (onSuccess) onSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Kode OTP salah atau kedaluwarsa');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setError('Nomor WhatsApp dan password wajib diisi');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.staffLogin(phone, password);
      loginWithToken(res.token, res.user);
      onClose();
      if (onSuccess) onSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login staf gagal');
    } finally {
      setLoading(false);
    }
  };

  const quickFillStaff = (staffPhone, staffPass) => {
    setPhone(staffPhone);
    setPassword(staffPass);
    setError('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 8, 5, 0.85)',
        backdropFilter: 'blur(5px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--ink)',
          border: '1px solid var(--line-light)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
          color: 'var(--parchment)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--brass)', fontFamily: 'var(--mono)' }}>
              Identitas Pengunjung &amp; Staf
            </span>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: '20px', margin: 0 }}>
              Masuk ke INCOME
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--parchment)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line-light)' }}>
          <button
            onClick={() => { setActiveTab('customer'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'customer' ? 'rgba(160, 124, 62, 0.15)' : 'none',
              border: 'none',
              borderBottom: activeTab === 'customer' ? '2px solid var(--brass)' : 'none',
              color: activeTab === 'customer' ? 'var(--brass)' : 'var(--gray)',
              fontFamily: 'var(--mono)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Customer (WhatsApp OTP)
          </button>
          <button
            onClick={() => { setActiveTab('staff'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'staff' ? 'rgba(160, 124, 62, 0.15)' : 'none',
              border: 'none',
              borderBottom: activeTab === 'staff' ? '2px solid var(--brass)' : 'none',
              color: activeTab === 'staff' ? 'var(--brass)' : 'var(--gray)',
              fontFamily: 'var(--mono)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Kasir &amp; Admin
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '20px' }}>
          {error && (
            <div
              style={{
                marginBottom: '14px',
                padding: '10px 12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                color: '#fca5a5',
                fontSize: '12px',
              }}
            >
              {error}
            </div>
          )}

          {activeTab === 'customer' ? (
            !otpSent ? (
              // Step 1: Request OTP
              <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: 'var(--gray)', margin: 0 }}>
                  Masukkan nomor WhatsApp aktif Anda untuk menerima kode OTP 6 digit demi keamanan pesanan dine-in.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                    Nomor WhatsApp
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Smartphone size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--brass)' }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        background: 'rgba(232, 224, 204, 0.05)',
                        border: '1px solid rgba(232, 224, 204, 0.15)',
                        borderRadius: '6px',
                        color: 'var(--parchment)',
                        fontSize: '14px',
                        fontFamily: 'var(--mono)',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'var(--brass)',
                    color: 'var(--ink)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px',
                    fontFamily: 'var(--mono)',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{loading ? 'Mengirim...' : 'Kirim Kode OTP'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              // Step 2: Verify OTP
              <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
                    OTP dikirim ke <strong>{phone}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--brass)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Ubah Nomor
                  </button>
                </div>

                {debugOtp && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(160, 124, 62, 0.2)',
                      border: '1px dashed var(--brass)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'var(--brass)',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    💡 Mode Simulasi: Kode OTP Anda adalah <strong>{debugOtp}</strong>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                    Nama Lengkap / Panggilan
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Rizky Ramadhan"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(232, 224, 204, 0.05)',
                      border: '1px solid rgba(232, 224, 204, 0.15)',
                      borderRadius: '6px',
                      color: 'var(--parchment)',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                    Kode OTP (6 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(232, 224, 204, 0.05)',
                      border: '1px solid rgba(232, 224, 204, 0.2)',
                      borderRadius: '6px',
                      color: 'var(--brass)',
                      fontSize: '18px',
                      textAlign: 'center',
                      letterSpacing: '0.3em',
                      fontFamily: 'var(--mono)',
                      fontWeight: '700',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'var(--brass)',
                    color: 'var(--ink)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px',
                    fontFamily: 'var(--mono)',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Memverifikasi...' : 'Verifikasi & Lanjutkan'}
                </button>
              </form>
            )
          ) : (
            // Staff Login Tab
            <form onSubmit={handleStaffLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Nomor WhatsApp Staf
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="082222222222"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(232, 224, 204, 0.05)',
                    border: '1px solid rgba(232, 224, 204, 0.15)',
                    borderRadius: '6px',
                    color: 'var(--parchment)',
                    fontSize: '14px',
                    fontFamily: 'var(--mono)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(232, 224, 204, 0.05)',
                    border: '1px solid rgba(232, 224, 204, 0.15)',
                    borderRadius: '6px',
                    color: 'var(--parchment)',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Quick Fill Test Accounts */}
              <div style={{ background: 'rgba(232, 224, 204, 0.03)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                  Akses Demo Cepat:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => quickFillStaff('082222222222', 'kasir123')}
                    style={{
                      background: 'rgba(160, 124, 62, 0.15)',
                      border: '1px solid var(--brass)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: 'var(--brass)',
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    Kasir Serang (Budi)
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFillStaff('083333333333', 'kasir123')}
                    style={{
                      background: 'rgba(160, 124, 62, 0.15)',
                      border: '1px solid var(--brass)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: 'var(--brass)',
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    Kasir Cilegon (Siti)
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFillStaff('081111111111', 'admin123')}
                    style={{
                      background: 'rgba(122, 42, 42, 0.25)',
                      border: '1px solid var(--wine)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: '#fca5a5',
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    Admin Pusat
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'var(--brass)',
                  color: 'var(--ink)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px',
                  fontFamily: 'var(--mono)',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Memvalidasi...' : 'Masuk Dashboard Staf'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

