import React, { useState, useEffect } from 'react';
import { useBranch } from '../context/BranchContext';
import { MarqueeTicker } from '../components/MarqueeTicker';
import { ProductCustomizerModal } from '../components/ProductCustomizerModal';
import { api } from '../services/api';
import { Coffee, ArrowUpRight, Sparkles, MapPin, Clock, Phone, UtensilsCrossed } from 'lucide-react';

export const LandingPage = () => {
  const { selectedBranch } = useBranch();
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState(['Semua', 'Coffee', 'Bakery', 'Non-Coffee']);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeCustomizerProduct, setActiveCustomizerProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch branch catalog (cached in Redis on backend)
  useEffect(() => {
    if (selectedBranch) {
      setLoading(true);
      api.getBranchMenu(selectedBranch.id)
        .then((data) => {
          setMenu(data || []);
        })
        .catch((err) => {
          console.error('Failed to load menu for branch:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedBranch]);

  const filteredMenu = menu.filter((item) => {
    if (selectedCategory === 'Semua') return true;
    return item.category_name?.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Find signatures
  const signatureCoffee = menu.find((m) => m.id === 1) || {
    id: 1,
    name: 'Gula Aren Latte',
    price: 45000,
    image: '/assets/img/gula_aren.jpg',
    description: 'Palm sugar meets slow espresso. A little sweet, a little bold — the entry that opened the book.',
    is_available: true,
  };

  const signatureBakery = menu.find((m) => m.id === 9) || {
    id: 9,
    name: 'Butter Croissant',
    price: 35000,
    image: '/assets/img/caramel.jpg',
    description: 'Laminated, baked, and gone before noon. Every batch closed out while the oven is still warm.',
    is_available: true,
  };

  return (
    <main id="main">
      {/* ============ HERO ============ */}
      <section className="hero" id="top">
        <div className="hero__bg" aria-hidden="true">
          <span className="hero__accent" />
        </div>

        <div className="container hero__grid">
          <div className="hero__left">
            <div className="hero__brand hero-anim" style={{ '--d': '.05s' }}>
              <span className="hero__eyebrow">
                <i className="fa-solid fa-arrow-trend-up" aria-hidden="true" /> Coffee &amp; Bakery — Ledger No. 001
              </span>
            </div>

            <h1 className="hero__title hero-anim" style={{ '--d': '.15s' }}>
              INCOME
            </h1>

            <p className="hero__tagline hero-anim" style={{ '--d': '.3s' }}>
              Every cup, every loaf — logged, dated, and <em>worth showing up for.</em>
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '24px' }}>
              <a className="hero__cta hero-anim" style={{ '--d': '.45s' }} href="#menu">
                Open the ledger <i className="fa-solid fa-arrow-trend-up" aria-hidden="true" />
              </a>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--brass)' }}>
                📍 {selectedBranch ? selectedBranch.name : 'Serang'}
              </span>
            </div>
          </div>

          <div className="hero__right">
            <figure className="hero__polaroid hero-anim" style={{ '--d': '.25s', '--r': '-2.5deg' }}>
              <span className="hero__tape" aria-hidden="true" />
              <div className="hero__media">
                <img src="/assets/img/gula_aren.jpg" alt="Signature Gula Aren Latte" loading="eager" />
              </div>
              <figcaption className="hero__chip">
                <span>Gula Aren Latte</span>
                <strong>45K</strong>
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="container hero__meta hero-anim" style={{ '--d': '.55s' }}>
          <span>Est. 2026</span>
          <span className="hero__meta-center">Serang &amp; Cilegon — Banten, Indonesia</span>
          <span className="hero__scroll">
            Scroll <i className="fa-solid fa-arrow-down" aria-hidden="true" />
          </span>
        </div>
      </section>

      {/* ============ MARQUEE TICKER ============ */}
      <MarqueeTicker />

      {/* ============ SIGNATURE COFFEE (LIGHT THEME) ============ */}
      <section className="product product--light" id="signature">
        <div className="container">
          <div className="product__head">
            <div className="ledger-tag">
              <span className="ledger-tag__no">No. 01</span>
              <span className="ledger-tag__rule" aria-hidden="true" />
              <span className="ledger-tag__type">Asset</span>
            </div>
            <div className="product__head-main">
              <p className="label">Signature Coffee</p>
              <h2 className="product__title">
                Gula Aren <em>Latte</em>
              </h2>
              <ul className="chips">
                <li>Sweet</li>
                <li>Creamy</li>
                <li>Bold</li>
              </ul>
            </div>
            <div className="product__price">
              <span className="product__price-cur">IDR</span>
              <strong>45K</strong>
            </div>
          </div>

          <div className="product__grid">
            <div className="product__media">
              <img src="/assets/img/gula_aren.jpg" alt="Gula Aren Latte" loading="lazy" />
              <span className="product__tag">
                <i className="fa-solid fa-mug-hot" aria-hidden="true" /> Coffee
              </span>
            </div>
            <div className="product__aside">
              <p className="product__blurb">
                Palm sugar meets slow espresso. A little sweet, a little bold — the entry that opened the book.
              </p>
              <button
                type="button"
                onClick={() => setActiveCustomizerProduct(signatureCoffee)}
                className="arrow-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                Pesan Sekarang (Dine-in) <i className="fa-solid fa-arrow-up-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SIGNATURE BAKERY (DARK THEME) ============ */}
      <section className="product product--dark">
        <div className="container">
          <div className="product__head">
            <div className="ledger-tag">
              <span className="ledger-tag__no">No. 02</span>
              <span className="ledger-tag__rule" aria-hidden="true" />
              <span className="ledger-tag__type">Asset</span>
            </div>
            <div className="product__head-main">
              <p className="label">Signature Bakery</p>
              <h2 className="product__title">
                Butter <em>Croissant</em>
              </h2>
              <ul className="chips">
                <li>Flaky</li>
                <li>Warm</li>
                <li>Buttery</li>
              </ul>
            </div>
            <div className="product__price">
              <span className="product__price-cur">IDR</span>
              <strong>35K</strong>
            </div>
          </div>

          <div className="product__grid product__grid--reverse">
            <div className="product__aside">
              <p className="product__blurb">
                Laminated, baked, and gone before noon. Every batch is closed out while the oven is still warm.
              </p>
              <button
                type="button"
                onClick={() => setActiveCustomizerProduct(signatureBakery)}
                className="arrow-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                Pesan Sekarang (Dine-in) <i className="fa-solid fa-arrow-up-right" aria-hidden="true" />
              </button>
            </div>
            <div className="product__media">
              <img src="/assets/img/caramel.jpg" alt="Butter Croissant" loading="lazy" />
              <span className="product__tag">
                <i className="fa-solid fa-bread-slice" aria-hidden="true" /> Bakery
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FULL MENU LEDGER ============ */}
      <section className="fullmenu" id="menu" style={{ scrollMarginTop: '80px', padding: '80px 0' }}>
        <div className="container">
          <header className="fullmenu__head" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <p className="label">Full Ledger Menu</p>
                <h2 className="fullmenu__title">
                  Katalog <em>{selectedBranch ? selectedBranch.name : 'INCOME'}</em>
                </h2>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: selectedCategory === cat ? 'var(--brass)' : 'rgba(232, 224, 204, 0.06)',
                      color: selectedCategory === cat ? 'var(--ink)' : 'var(--parchment)',
                      border: `1px solid ${selectedCategory === cat ? 'var(--brass)' : 'rgba(232, 224, 204, 0.15)'}`,
                      borderRadius: '20px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Menu Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--mono)', color: 'var(--brass)' }}>
              Memuat data menu cabang dari Redis cache...
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {filteredMenu.map((item) => {
                const isOutOfStock = !item.is_available;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(232, 224, 204, 0.04)',
                      border: '1px solid rgba(232, 224, 204, 0.12)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      opacity: isOutOfStock ? 0.65 : 1,
                    }}
                  >
                    <div style={{ height: '170px', position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={item.image || '/assets/img/gula_aren.jpg'}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {isOutOfStock && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              padding: '4px 12px',
                              borderRadius: '4px',
                              fontFamily: 'var(--mono)',
                              fontWeight: '700',
                              fontSize: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                            }}
                          >
                            Habis di Cabang Ini
                          </span>
                        </div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: 'rgba(27, 22, 14, 0.85)',
                          color: 'var(--brass)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontFamily: 'var(--mono)',
                        }}
                      >
                        {item.category_name}
                      </span>
                    </div>

                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                          <h3 style={{ fontSize: '17px', margin: 0, fontFamily: 'var(--display)' }}>{item.name}</h3>
                          <strong style={{ fontFamily: 'var(--mono)', fontSize: '15px', color: 'var(--brass)' }}>
                            Rp {Number(item.price).toLocaleString('id-ID')}
                          </strong>
                        </div>
                        {item.description && (
                          <p style={{ fontSize: '12px', color: 'var(--gray)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => setActiveCustomizerProduct(item)}
                        style={{
                          width: '100%',
                          background: isOutOfStock ? 'rgba(232, 224, 204, 0.1)' : 'rgba(160, 124, 62, 0.15)',
                          border: `1px solid ${isOutOfStock ? 'rgba(232, 224, 204, 0.2)' : 'var(--brass)'}`,
                          borderRadius: '6px',
                          padding: '10px',
                          color: isOutOfStock ? 'var(--gray)' : 'var(--parchment)',
                          fontFamily: 'var(--mono)',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{isOutOfStock ? 'Stok Habis' : 'Pesan & Kustomisasi'}</span>
                        {!isOutOfStock && <ArrowUpRight size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="fullmenu__foot" style={{ marginTop: '40px' }}>
            <span>Buka Setiap Hari — 07.00–22.00 WIB</span>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--brass)' }}>
              Dine-in &amp; Pesan dari Meja via QR Meja
            </span>
          </div>
        </div>
      </section>

      {/* ============ BRAND STORY ============ */}
      <section className="story" id="story">
        <div className="container">
          <p className="label story__label">Our Story</p>

          <h2 className="story__headline">
            <span className="mask"><span>We believe</span></span>
            <span className="mask"><span>the best returns</span></span>
            <span className="mask"><span>come from</span></span>
            <span className="mask"><span>something <em>simple.</em></span></span>
          </h2>

          <div className="story__foot">
            <p className="story__items">
              <span>Coffee.</span>
              <span>Fresh bread.</span>
              <span>Compound daily.</span>
            </p>
            <div className="story__mark">
              <img src="/assets/img/logo_income.png" alt="INCOME logo" />
              <i className="fa-solid fa-arrow-trend-up" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ LOCATION ============ */}
      <section className="location" id="location" style={{ padding: '80px 0' }}>
        <div className="container">
          <h2 className="location__title">
            <span className="mask"><span>Come</span></span>
            <span className="mask"><span>say <em>hello.</em></span></span>
          </h2>

          <div className="location__grid">
            <div className="location__info">
              <div className="location__card">
                <span className="location__name">INCOME</span>
                <span className="location__sub">Coffee &amp; Bakery Multi-Branch</span>
              </div>
              <ul className="location__facts">
                <li>
                  <i className="fa-solid fa-location-dot" aria-hidden="true" />
                  <div>
                    <strong>Cabang Serang Pusat</strong>
                    <span>Jl. Veteran No. 42, Serang, Banten</span>
                  </div>
                </li>
                <li>
                  <i className="fa-solid fa-location-dot" aria-hidden="true" />
                  <div>
                    <strong>Cabang Cilegon</strong>
                    <span>Jl. Ahmad Yani No. 18, Cilegon, Banten</span>
                  </div>
                </li>
                <li>
                  <i className="fa-solid fa-clock" aria-hidden="true" />
                  <div>
                    <strong>Jam Operasional</strong>
                    <span>Setiap Hari 07.00 — 22.00 WIB</span>
                  </div>
                </li>
                <li>
                  <i className="fa-solid fa-phone" aria-hidden="true" />
                  <div>
                    <strong>Customer Support / WhatsApp</strong>
                    <span>+62 812-3456-7890</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Product Customizer Modal */}
      <ProductCustomizerModal
        product={activeCustomizerProduct}
        isOpen={!!activeCustomizerProduct}
        onClose={() => setActiveCustomizerProduct(null)}
      />
    </main>
  );
};
