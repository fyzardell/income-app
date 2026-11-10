import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, User, Store, LogOut, ChevronDown, QrCode } from 'lucide-react';

export const Navbar = ({ onOpenAuth, onNavigate, activeTab }) => {
  const { user, isAuthenticated, isCashier, isAdmin, logout } = useAuth();
  const { branches, selectedBranch, selectBranch, tableInfo } = useBranch();
  const { totalItemCount, setIsCartOpen } = useCart();
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="navbar" id="navbar">
      <div className="container navbar__inner">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="navbar__logo"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <img src="/assets/img/logo_income.png" alt="INCOME logo" style={{ height: '42px', width: 'auto' }} />
        </button>

        {/* Branch Selector & Table Badge */}
        <div className="navbar__branch-pill" style={{ position: 'relative' }}>
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="branch-selector-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(232, 224, 204, 0.08)',
              border: '1px solid rgba(232, 224, 204, 0.2)',
              borderRadius: '20px',
              color: 'var(--parchment)',
              fontFamily: 'var(--mono)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Store size={14} color="var(--brass)" />
            <span>{selectedBranch ? selectedBranch.name : 'Pilih Cabang'}</span>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: selectedBranch?.is_open ? '#4ade80' : '#ef4444',
                display: 'inline-block',
              }}
            />
            <ChevronDown size={13} />
          </button>

          {/* Branch Dropdown */}
          {branchDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                width: '260px',
                background: 'var(--ink)',
                border: '1px solid var(--line-light)',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--line-light)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--gray)', fontFamily: 'var(--mono)' }}>
                Pilih Cabang Dine-in
              </div>
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    selectBranch(b);
                    setBranchDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: selectedBranch?.id === b.id ? 'rgba(160, 124, 62, 0.15)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(232, 224, 204, 0.06)',
                    color: 'var(--parchment)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: selectedBranch?.id === b.id ? '600' : '400', fontSize: '14px' }}>{b.name}</span>
                    <span style={{ fontSize: '10px', color: b.is_open ? '#4ade80' : '#ef4444', fontFamily: 'var(--mono)' }}>
                      {b.is_open ? 'BUKA' : 'TUTUP'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--gray)' }}>{b.address}</span>
                </button>
              ))}
            </div>
          )}

          {/* Scanned Table Badge */}
          {tableInfo && (
            <span
              style={{
                marginLeft: '10px',
                padding: '4px 10px',
                background: 'var(--brass)',
                color: 'var(--ink)',
                borderRadius: '12px',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <QrCode size={12} />
              {tableInfo.table_code}
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="navbar__nav" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={() => onNavigate('home')}
            style={{ background: 'none', border: 'none', color: activeTab === 'home' ? 'var(--brass)' : 'var(--parchment)', cursor: 'pointer', fontSize: '15px' }}
          >
            Menu &amp; Cerita
          </button>

          {isAuthenticated && (
            <button
              onClick={() => onNavigate('my-orders')}
              style={{ background: 'none', border: 'none', color: activeTab === 'my-orders' ? 'var(--brass)' : 'var(--parchment)', cursor: 'pointer', fontSize: '15px' }}
            >
              Pesanan Saya
            </button>
          )}

          {isCashier && (
            <button
              onClick={() => onNavigate('cashier')}
              style={{
                background: activeTab === 'cashier' ? 'var(--brass)' : 'rgba(160, 124, 62, 0.2)',
                color: activeTab === 'cashier' ? 'var(--ink)' : 'var(--brass)',
                border: '1px solid var(--brass)',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              Kasir Portal
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              style={{
                background: activeTab === 'admin' ? 'var(--wine)' : 'rgba(122, 42, 42, 0.2)',
                color: 'var(--parchment)',
                border: '1px solid var(--wine)',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              Admin Pusat
            </button>
          )}

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              color: 'var(--parchment)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
            }}
            title="Buka Keranjang"
          >
            <ShoppingBag size={22} />
            {totalItemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '0px',
                  right: '0px',
                  background: 'var(--brass)',
                  color: 'var(--ink)',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--mono)',
                }}
              >
                {totalItemCount}
              </span>
            )}
          </button>

          {/* User Auth Button */}
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  background: 'rgba(232, 224, 204, 0.1)',
                  border: '1px solid var(--line-light)',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  color: 'var(--parchment)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                }}
              >
                <User size={15} color="var(--brass)" />
                <span>{user?.name || 'Customer'}</span>
                <ChevronDown size={13} />
              </button>

              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    width: '200px',
                    background: 'var(--ink)',
                    border: '1px solid var(--line-light)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-light)' }}>
                    <p style={{ fontWeight: '600', fontSize: '13px' }}>{user?.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--gray)', fontFamily: 'var(--mono)' }}>{user?.whatsapp_number}</p>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--brass)' }}>{user?.role}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                      onNavigate('home');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                    }}
                  >
                    <LogOut size={14} /> Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{
                background: 'var(--brass)',
                color: 'var(--ink)',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: '13px',
                letterSpacing: '0.05em',
              }}
            >
              Masuk / OTP
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

