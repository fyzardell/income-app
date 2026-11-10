import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { BarChart3, Store, QrCode, DollarSign, Plus, Printer, RefreshCw, Check, ArrowRight, Trash2, X } from 'lucide-react';

export const AdminDashboard = ({ onOpenQRPrint }) => {
  const [reports, setReports] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(1);
  const [branchTables, setBranchTables] = useState([]);
  const [branchMenu, setBranchMenu] = useState([]);
  const [newTableCode, setNewTableCode] = useState('');
  const [loading, setLoading] = useState(true);

  // Price edit state
  const [editingProduct, setEditingProduct] = useState(null); // { id, name, price }
  const [newPrice, setNewPrice] = useState('');

  // Add product state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCatId, setNewProdCatId] = useState(1);
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState('/assets/img/gula_aren.jpg');
  const [newProdDesc, setNewProdDesc] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getReports(),
      api.getBranches(),
      api.getBranchTables(selectedBranchId),
      api.getBranchMenu(selectedBranchId),
    ])
      .then(([rep, br, tb, mn]) => {
        setReports(rep || []);
        setBranches(br || []);
        setBranchTables(tb || []);
        setBranchMenu(mn || []);
      })
      .catch((err) => console.error('Error loading admin data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedBranchId]);

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    if (!editingProduct || !newPrice) return;
    try {
      await api.updateBranchPrice(selectedBranchId, editingProduct.id, parseFloat(newPrice));
      alert(`Harga ${editingProduct.name} di cabang ini berhasil diperbarui!`);
      setEditingProduct(null);
      setNewPrice('');
      loadData();
    } catch (err) {
      alert('Gagal update harga: ' + err.message);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;
    try {
      await api.createProduct({
        name: newProdName,
        category_id: Number(newProdCatId),
        base_price: parseFloat(newProdPrice),
        image: newProdImage || '/assets/img/gula_aren.jpg',
        description: newProdDesc,
        sort_order: branchMenu.length + 1,
      });
      alert(`Menu "${newProdName}" berhasil ditambahkan!`);
      setIsAddProductOpen(false);
      setNewProdName('');
      setNewProdPrice('');
      setNewProdDesc('');
      loadData();
    } catch (err) {
      alert('Gagal menambahkan menu: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    const confirm = window.confirm(`Yakin ingin menghapus menu "${productName}" dari database?`);
    if (!confirm) return;
    try {
      await api.deleteProduct(productId);
      alert(`Menu "${productName}" berhasil dihapus.`);
      loadData();
    } catch (err) {
      alert('Gagal menghapus menu: ' + err.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '30px auto 100px auto', padding: '0 20px', color: 'var(--parchment)' }}>
      {/* Header */}
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
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--wine)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', fontWeight: '700' }}>
            Portal Eksekutif &amp; Admin Pusat
          </span>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '26px', margin: '4px 0' }}>
            INCOME Management Center
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray)', margin: 0 }}>
            Laporan pesanan, pengelolaan cabang, pengaturan harga, kelola menu, dan generator QR Meja.
          </p>
        </div>

        <button
          onClick={loadData}
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
          <RefreshCw size={15} /> Refresh Laporan
        </button>
      </div>

      {/* Reports Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {reports.map((rep) => (
          <div
            key={rep.branch_id}
            style={{
              background: 'var(--ink)',
              border: '1px solid var(--line-light)',
              borderRadius: '10px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{rep.branch_name}</span>
              <Store size={18} color="var(--brass)" />
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '24px', fontWeight: '700', color: 'var(--brass)', marginBottom: '8px' }}>
              Rp {Number(rep.total_amount).toLocaleString('id-ID')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Pesanan: <strong>{rep.total_orders}</strong></span>
              <span>Terbayar: <strong>{rep.paid_orders}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Branch Selection Bar */}
      <div style={{ background: 'rgba(232,224,204,0.03)', padding: '14px 20px', borderRadius: '8px', border: '1px solid var(--line-light)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600' }}>Kelola Konfigurasi Cabang:</span>
        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(Number(e.target.value))}
          style={{
            background: 'var(--ink)',
            border: '1px solid var(--line-light)',
            borderRadius: '6px',
            padding: '8px 14px',
            color: 'var(--parchment)',
            fontFamily: 'var(--mono)',
            fontSize: '13px',
          }}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.address})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Dining Tables & QR Token List */}
        <div style={{ background: 'var(--ink)', border: '1px solid var(--line-light)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: '18px', margin: 0 }}>
              Daftar Meja &amp; QR Token Cabang
            </h3>
            <button
              onClick={() => onOpenQRPrint && onOpenQRPrint(branchTables, selectedBranchId)}
              style={{
                background: 'rgba(160, 124, 62, 0.15)',
                border: '1px solid var(--brass)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: 'var(--brass)',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Printer size={14} /> Cetak QR Meja
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {branchTables.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'rgba(232, 224, 204, 0.04)',
                  border: '1px solid rgba(232, 224, 204, 0.1)',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <QrCode size={16} color="var(--brass)" />
                    <strong style={{ fontSize: '14px' }}>{t.table_code}</strong>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--gray)', fontFamily: 'var(--mono)' }}>
                    Token: {t.qr_token}
                  </span>
                </div>

                <a
                  href={`/?token=${t.qr_token}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '11px',
                    color: 'var(--brass)',
                    fontFamily: 'var(--mono)',
                    textDecoration: 'underline',
                  }}
                >
                  Buka Link Pesan Meja
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Menu Prices & Product Management */}
        <div style={{ background: 'var(--ink)', border: '1px solid var(--line-light)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: '18px', margin: 0 }}>
              Katalog Menu &amp; Harga Cabang
            </h3>
            <button
              onClick={() => setIsAddProductOpen(true)}
              style={{
                background: 'var(--brass)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                color: 'var(--ink)',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={14} /> Tambah Menu Baru
            </button>
          </div>

          <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {branchMenu.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'rgba(232, 224, 204, 0.04)',
                  border: '1px solid rgba(232, 224, 204, 0.1)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{m.name}</span>
                  <div style={{ fontSize: '11px', color: 'var(--gray)' }}>{m.category_name}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--brass)' }}>
                    Rp {Number(m.price).toLocaleString('id-ID')}
                  </strong>
                  <button
                    onClick={() => {
                      setEditingProduct(m);
                      setNewPrice(m.price.toString());
                    }}
                    style={{
                      background: 'rgba(232, 224, 204, 0.08)',
                      border: '1px solid rgba(232, 224, 204, 0.2)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      color: 'var(--parchment)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Ubah
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(m.id, m.name)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      color: '#f87171',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Hapus Menu"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Price Modal */}
      {editingProduct && (
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
              maxWidth: '380px',
              width: '100%',
              padding: '20px',
              color: 'var(--parchment)',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontFamily: 'var(--display)', fontSize: '18px' }}>
              Ubah Harga: {editingProduct.name}
            </h3>
            <form onSubmit={handleUpdatePrice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Harga Baru (Rp)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(232, 224, 204, 0.05)',
                    border: '1px solid rgba(232, 224, 204, 0.2)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--parchment)',
                    fontFamily: 'var(--mono)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ background: 'none', border: '1px solid rgba(232,224,204,0.2)', padding: '6px 12px', color: 'var(--parchment)', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ background: 'var(--brass)', border: 'none', padding: '6px 14px', color: 'var(--ink)', fontWeight: '700', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Simpan Harga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
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
              borderRadius: '12px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              color: 'var(--parchment)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: '20px' }}>
                Tambah Menu Baru
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--parchment)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Nama Menu
                </label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Contoh: Hazelnut Latte"
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(232, 224, 204, 0.05)',
                    border: '1px solid rgba(232, 224, 204, 0.2)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--parchment)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                    Kategori
                  </label>
                  <select
                    value={newProdCatId}
                    onChange={(e) => setNewProdCatId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#1B160E',
                      border: '1px solid rgba(232, 224, 204, 0.2)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'var(--parchment)',
                      fontSize: '13px',
                    }}
                  >
                    <option value={1}>Coffee</option>
                    <option value={2}>Bakery</option>
                    <option value={3}>Non-Coffee</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                    Harga Dasar (Rp)
                  </label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="35000"
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(232, 224, 204, 0.05)',
                      border: '1px solid rgba(232, 224, 204, 0.2)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'var(--parchment)',
                      fontFamily: 'var(--mono)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Path Gambar / Foto
                </label>
                <input
                  type="text"
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  placeholder="/assets/img/gula_aren.jpg"
                  style={{
                    width: '100%',
                    background: 'rgba(232, 224, 204, 0.05)',
                    border: '1px solid rgba(232, 224, 204, 0.2)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--parchment)',
                    fontSize: '13px',
                    fontFamily: 'var(--mono)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Deskripsi Menu
                </label>
                <textarea
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Cerita rasa singkat mengenai menu ini..."
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'rgba(232, 224, 204, 0.05)',
                    border: '1px solid rgba(232, 224, 204, 0.2)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--parchment)',
                    fontSize: '13px',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(232, 224, 204, 0.2)',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    color: 'var(--parchment)',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--brass)',
                    color: 'var(--ink)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 18px',
                    fontFamily: 'var(--mono)',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
