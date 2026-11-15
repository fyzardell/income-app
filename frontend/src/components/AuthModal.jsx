import React, { useState } from 'react';
import { X, KeyRound, User, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithToken } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e, customUser, customPass) => {
    if (e) e.preventDefault();
    const loginUser = customUser || username;
    const loginPass = customPass || password;

    if (!loginUser || !loginPass) {
      setError('Username dan kata sandi wajib diisi');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await api.login(loginUser, loginPass);
      loginWithToken(res.token, res.user);
      onClose();
      if (onSuccess) onSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa username dan password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (userVal, passVal) => {
    setUsername(userVal);
    setPassword(passVal);
    setError('');
    // Direct login on click for maximum convenience
    handleLogin(null, userVal, passVal);
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
              Sistem Otentikasi Demo
            </span>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: '20px', margin: 0 }}>
              Masuk ke INCOME
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--parchment)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 20px' }}>
          {error && (
            <div
              style={{
                marginBottom: '16px',
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
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Username Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--brass)', marginBottom: '6px' }}>
                USERNAME / NAMA PENGGUNA
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--gray)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="admin1 atau kasir"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(232, 224, 204, 0.05)',
                    border: '1px solid var(--line-light)',
                    borderRadius: '6px',
                    color: 'var(--parchment)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--brass)', marginBottom: '6px' }}>
                KATA SANDI / PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} color="var(--gray)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(232, 224, 204, 0.05)',
                    border: '1px solid var(--line-light)',
                    borderRadius: '6px',
                    color: 'var(--parchment)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--brass)',
                border: 'none',
                borderRadius: '6px',
                color: 'var(--ink)',
                fontWeight: '700',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Shortcuts */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed var(--line-light)' }}>
            <p style={{ fontSize: '11px', color: 'var(--gray)', fontFamily: 'var(--mono)', marginBottom: '10px' }}>
              AKUN DEMO SIAP PAKAI (KLIK 1 KALI UNTUK MASUK):
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin1', 'admin123')}
                style={{
                  padding: '8px 10px',
                  background: 'rgba(122, 42, 42, 0.25)',
                  border: '1px solid var(--wine)',
                  borderRadius: '6px',
                  color: 'var(--parchment)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#f87171' }}>Admin Pusat</div>
                <div style={{ fontSize: '10px', color: 'var(--gray)', fontFamily: 'var(--mono)' }}>admin1 / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('kasir', 'kasir123')}
                style={{
                  padding: '8px 10px',
                  background: 'rgba(160, 124, 62, 0.2)',
                  border: '1px solid var(--brass)',
                  borderRadius: '6px',
                  color: 'var(--parchment)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--brass)' }}>Kasir Serang</div>
                <div style={{ fontSize: '10px', color: 'var(--gray)', fontFamily: 'var(--mono)' }}>kasir / kasir123</div>
              </button>
            </div>

            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickDemo('customer', 'customer123')}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'rgba(232, 224, 204, 0.08)',
                  border: '1px solid var(--line-light)',
                  borderRadius: '6px',
                  color: 'var(--parchment)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--parchment)' }}>Customer Demo (Pengunjung)</div>
                  <div style={{ fontSize: '10px', color: 'var(--gray)', fontFamily: 'var(--mono)' }}>customer / customer123</div>
                </div>
                <CheckCircle2 size={14} color="var(--brass)" />
              </button>
            </div>

            <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--gray)', fontStyle: 'italic', textAlign: 'center' }}>
              Nomor WhatsApp & profil lengkap dapat diatur kapan saja di menu Akun setelah masuk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
