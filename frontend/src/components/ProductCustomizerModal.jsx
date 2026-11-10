import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ProductCustomizerModal = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [notes, setNotes] = useState('');

  // Initialize default options when product changes
  useEffect(() => {
    if (product && product.option_groups) {
      const defaults = {};
      product.option_groups.forEach((group) => {
        if (group.is_required && group.options && group.options.length > 0) {
          defaults[group.id] = [group.options[0]];
        } else {
          defaults[group.id] = [];
        }
      });
      setSelectedOptions(defaults);
      setQuantity(1);
      setNotes('');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSingleSelect = (groupId, option) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupId]: [option],
    }));
  };

  const handleMultiSelect = (groupId, option, maxSelection) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      const exists = current.some((o) => o.id === option.id);
      let updated;
      if (exists) {
        updated = current.filter((o) => o.id !== option.id);
      } else {
        if (maxSelection && current.length >= maxSelection) {
          updated = [...current.slice(1), option];
        } else {
          updated = [...current, option];
        }
      }
      return { ...prev, [groupId]: updated };
    });
  };

  // Calculate total unit price
  let currentUnitPrice = Number(product.price || product.base_price || 0);
  const flatSelectedList = [];
  Object.values(selectedOptions).forEach((opts) => {
    opts.forEach((o) => {
      currentUnitPrice += Number(o.price_adjustment || 0);
      flatSelectedList.push(o);
    });
  });

  const totalPrice = currentUnitPrice * quantity;

  const handleAdd = () => {
    addToCart(product, flatSelectedList, quantity, notes);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 8, 5, 0.85)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
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
          maxWidth: '540px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          color: 'var(--parchment)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with Product Image */}
        <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
          <img
            src={product.image || '/assets/img/gula_aren.jpg'}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(27,22,14,1) 0%, rgba(27,22,14,0.3) 100%)',
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'var(--parchment)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
          <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                color: 'var(--brass)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {product.category_name || 'Menu'}
            </span>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: '24px', margin: '2px 0 0 0' }}>
              {product.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Options Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {product.description && (
            <p style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: '1.5', margin: 0 }}>
              {product.description}
            </p>
          )}

          {/* Option Groups */}
          {product.option_groups && product.option_groups.map((group) => {
            const isSingle = group.max_selection === 1;
            const currentSelected = selectedOptions[group.id] || [];

            return (
              <div key={group.id} style={{ borderBottom: '1px solid rgba(232,224,204,0.08)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{group.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--brass)', fontFamily: 'var(--mono)' }}>
                    {group.is_required ? 'Wajib' : 'Opsional'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                  {group.options && group.options.map((opt) => {
                    const isSelected = currentSelected.some((o) => o.id === opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (isSingle) {
                            handleSingleSelect(group.id, opt);
                          } else {
                            handleMultiSelect(group.id, opt, group.max_selection);
                          }
                        }}
                        style={{
                          background: isSelected ? 'rgba(160, 124, 62, 0.2)' : 'rgba(232, 224, 204, 0.04)',
                          border: `1px solid ${isSelected ? 'var(--brass)' : 'rgba(232, 224, 204, 0.12)'}`,
                          borderRadius: '6px',
                          padding: '8px 10px',
                          color: isSelected ? 'var(--parchment)' : 'var(--gray)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          textAlign: 'left',
                          gap: '2px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: isSelected ? '600' : '400' }}>{opt.name}</span>
                          {isSelected && <Check size={13} color="var(--brass)" />}
                        </div>
                        {opt.price_adjustment > 0 ? (
                          <span style={{ fontSize: '11px', color: 'var(--brass)', fontFamily: 'var(--mono)' }}>
                            +Rp {Number(opt.price_adjustment).toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'rgba(232,224,204,0.4)', fontFamily: 'var(--mono)' }}>
                            Free
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Special Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Catatan untuk Barista / Dapur
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pisahkan es, jangan terlalu manis..."
              rows={2}
              style={{
                width: '100%',
                background: 'rgba(232, 224, 204, 0.05)',
                border: '1px solid rgba(232, 224, 204, 0.15)',
                borderRadius: '6px',
                padding: '10px',
                color: 'var(--parchment)',
                fontSize: '13px',
                resize: 'none',
              }}
            />
          </div>
        </div>

        {/* Modal Footer with Quantity & Add Button */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--line-light)',
            background: 'rgba(18, 14, 10, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Quantity Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              style={{
                background: 'rgba(232,224,204,0.1)',
                border: '1px solid rgba(232,224,204,0.2)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: 'var(--parchment)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Minus size={14} />
            </button>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              style={{
                background: 'rgba(232,224,204,0.1)',
                border: '1px solid rgba(232,224,204,0.2)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: 'var(--parchment)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            style={{
              flex: 1,
              background: 'var(--brass)',
              color: 'var(--ink)',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 18px',
              fontFamily: 'var(--mono)',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Tambahkan</span>
            <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

