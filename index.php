<?php
/**
 * INCOME — Coffee & Bakery
 * PHP Native — Dynamic Database Integration
 */
require_once __DIR__ . '/config/database.php';

// Ambil data dinamis dari database (dengan fallback otomatis jika DB belum aktif)
$storeSettings   = getStoreSettings($pdo);
$tickerItems     = getTickerItems($pdo);
$signatures      = getSignatures($pdo);
$menuCategories  = getMenuCategoriesWithItems($pdo);
$testimonials    = getTestimonials($pdo);

// Signatures No. 1 & No. 2
$sig1 = $signatures[0] ?? null;
$sig2 = $signatures[1] ?? null;
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title><?= htmlspecialchars($storeSettings['store_name']) ?> — Coffee &amp; Bakery</title>
  <meta name="description"
    content="<?= htmlspecialchars($storeSettings['tagline']) ?>">
  <meta name="theme-color" content="#1B160E">

  <meta property="og:type" content="website">
  <meta property="og:title" content="<?= htmlspecialchars($storeSettings['store_name']) ?> — Coffee &amp; Bakery">
  <meta property="og:description" content="<?= htmlspecialchars($storeSettings['tagline']) ?>">
  <meta property="og:image" content="assets/img/logo_income.png">

  <link rel="icon" type="image/png" href="assets/img/favicon.png">
  <link rel="preload" as="image" href="assets/img/gula_aren.jpg">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,900;1,500;1,600;1,900&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
  <link rel="stylesheet" href="css/style.css">

  <script>document.documentElement.classList.add('js');</script>
</head>

<body>

  <div class="grain" aria-hidden="true"></div>
  <div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>

  <a class="skip-link" href="#main">Skip to content</a>

  <!-- ============ NAVBAR ============ -->
  <header class="navbar" id="navbar">
    <div class="container navbar__inner">
      <a class="navbar__logo" href="#top" aria-label="INCOME — back to top">
        <img src="assets/img/logo_income.png" alt="INCOME logo">
      </a>

      <nav class="navbar__nav" aria-label="Main navigation">
        <a href="#menu" class="nav-link">Menu</a>
        <a href="#story" class="nav-link">Story</a>
        <a href="#location" class="nav-link">Location</a>
        <a class="nav-cta" href="<?= htmlspecialchars($storeSettings['whatsapp_url']) ?>" target="_blank"
          rel="noopener">Order <i class="fa-solid fa-arrow-up-right" aria-hidden="true"></i></a>
      </nav>

      <button class="nav-burger" id="navBurger" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
      </button>
    </div>
  </header>

  <!-- ============ MOBILE MENU ============ -->
  <div class="mobile-menu" id="mobileMenu" aria-hidden="true">
    <button class="mobile-menu__close" id="mobileMenuClose" aria-label="Close menu">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
    <nav class="mobile-menu__nav" aria-label="Mobile navigation">
      <a href="#menu">Menu</a>
      <a href="#story">Story</a>
      <a href="#location">Location</a>
      <a href="<?= htmlspecialchars($storeSettings['whatsapp_url']) ?>" target="_blank" rel="noopener"
        class="mobile-menu__cta">Order <i class="fa-solid fa-arrow-up-right" aria-hidden="true"></i></a>
    </nav>
    <div class="mobile-menu__meta">
      <span>Est. <?= htmlspecialchars($storeSettings['est_year']) ?></span>
      <span><?= htmlspecialchars($storeSettings['city']) ?></span>
    </div>
  </div>

  <main id="main">

    <!-- ============ HERO ============ -->
    <section class="hero" id="top">
      <div class="hero__bg" aria-hidden="true">
        <span class="hero__accent"></span>
      </div>

      <div class="container hero__grid">
        <div class="hero__left">
          <div class="hero__brand hero-anim" style="--d:.05s">
            <span class="hero__eyebrow"><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i> Coffee &amp;
              Bakery — Ledger No. 001</span>
          </div>

          <h1 class="hero__title hero-anim" style="--d:.15s">INCOME</h1>

          <p class="hero__tagline hero-anim" style="--d:.3s">
            Every cup, every loaf — logged, dated,
            and <em>worth showing up for.</em>
          </p>

          <a class="hero__cta hero-anim" style="--d:.45s" href="#menu">
            Open the ledger <i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i>
          </a>
        </div>

        <div class="hero__right">
          <figure class="hero__polaroid hero-anim" style="--d:.25s; --r:-2.5deg">
            <span class="hero__tape" aria-hidden="true"></span>
            <div class="hero__media">
              <img src="assets/img/gula_aren.jpg" alt="Signature Gula Aren Latte with rich caramel layers"
                loading="eager">
            </div>
            <figcaption class="hero__chip">
              <span>Gula Aren Latte</span>
              <strong>45K</strong>
            </figcaption>
          </figure>
        </div>
      </div>

      <div class="container hero__meta hero-anim" style="--d:.55s">
        <span>Est. <?= htmlspecialchars($storeSettings['est_year']) ?></span>
        <span class="hero__meta-center"><?= htmlspecialchars($storeSettings['city']) ?></span>
        <span class="hero__scroll">Scroll <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></span>
      </div>
    </section>

    <!-- ============ MARQUEE — PRICE TICKER ============ -->
    <section class="marquee" aria-label="Menu ticker">
      <div class="marquee__row marquee__row--solid">
        <div class="marquee__track">
          <?php foreach ($tickerItems as $t): ?>
            <span class="ticker-item<?= !empty($t['is_down']) ? ' is-down' : '' ?>">
              <i class="fa-solid fa-caret-up" aria-hidden="true"></i><?= htmlspecialchars($t['name']) ?> <b><?= htmlspecialchars($t['price']) ?></b>
            </span>
          <?php endforeach; ?>
          <span aria-hidden="true">
            <?php foreach ($tickerItems as $t): ?>
              <span class="ticker-item<?= !empty($t['is_down']) ? ' is-down' : '' ?>">
                <i class="fa-solid fa-caret-up" aria-hidden="true"></i><?= htmlspecialchars($t['name']) ?> <b><?= htmlspecialchars($t['price']) ?></b>
              </span>
            <?php endforeach; ?>
          </span>
        </div>
      </div>
      <div class="marquee__row marquee__row--outline marquee__row--reverse">
        <div class="marquee__track">
          <span>Est. <?= htmlspecialchars($storeSettings['est_year']) ?> — Serang — Indonesia — Fresh, daily, logged by hand —&nbsp;</span>
          <span aria-hidden="true">Est. <?= htmlspecialchars($storeSettings['est_year']) ?> — Serang — Indonesia — Fresh, daily, logged by hand —&nbsp;</span>
        </div>
      </div>
    </section>

    <!-- ============ SIGNATURE COFFEE ============ -->
    <?php if ($sig1): ?>
    <section class="product product--<?= htmlspecialchars($sig1['theme'] ?? 'light') ?>" id="signature">
      <div class="container">
        <div class="product__head">
          <div class="ledger-tag" data-reveal>
            <span class="ledger-tag__no"><?= htmlspecialchars($sig1['ledger_no']) ?></span>
            <span class="ledger-tag__rule" aria-hidden="true"></span>
            <span class="ledger-tag__type">Asset</span>
          </div>
          <div class="product__head-main">
            <p class="label" data-reveal style="--d:.05s"><?= htmlspecialchars($sig1['label']) ?></p>
            <h2 class="product__title" data-reveal style="--d:.1s"><?= htmlspecialchars($sig1['title_prefix']) ?> <em><?= htmlspecialchars($sig1['title_accent']) ?></em></h2>
            <ul class="chips" data-reveal style="--d:.15s">
              <?php foreach ((array)$sig1['chips'] as $chip): ?>
                <li><?= htmlspecialchars($chip) ?></li>
              <?php endforeach; ?>
            </ul>
          </div>
          <div class="product__price" data-reveal style="--d:.2s">
            <span class="product__price-cur">IDR</span>
            <strong><?= htmlspecialchars($sig1['price']) ?></strong>
          </div>
        </div>

        <div class="product__grid">
          <div class="product__media" data-reveal>
            <img src="<?= htmlspecialchars($sig1['image']) ?>" alt="<?= htmlspecialchars($sig1['title_prefix'] . ' ' . $sig1['title_accent']) ?>" loading="lazy">
            <span class="product__tag"><i class="fa-solid <?= htmlspecialchars($sig1['category_icon']) ?>" aria-hidden="true"></i> <?= htmlspecialchars($sig1['category_name']) ?></span>
          </div>
          <div class="product__aside">
            <p class="product__blurb" data-reveal>
              <?= htmlspecialchars($sig1['blurb']) ?>
            </p>
            <a class="arrow-link"
              href="https://wa.me/6281234567890?text=<?= rawurlencode($sig1['wa_order_text'] ?? 'Halo INCOME! Saya mau pesan.') ?>"
              target="_blank" rel="noopener" data-reveal>
              Order now <i class="fa-solid fa-arrow-up-right" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>
    </section>
    <?php endif; ?>

    <!-- ============ SIGNATURE BAKERY ============ -->
    <?php if ($sig2): ?>
    <section class="product product--<?= htmlspecialchars($sig2['theme'] ?? 'dark') ?>">
      <div class="container">
        <div class="product__head">
          <div class="ledger-tag" data-reveal>
            <span class="ledger-tag__no"><?= htmlspecialchars($sig2['ledger_no']) ?></span>
            <span class="ledger-tag__rule" aria-hidden="true"></span>
            <span class="ledger-tag__type">Asset</span>
          </div>
          <div class="product__head-main">
            <p class="label" data-reveal style="--d:.05s"><?= htmlspecialchars($sig2['label']) ?></p>
            <h2 class="product__title" data-reveal style="--d:.1s"><?= htmlspecialchars($sig2['title_prefix']) ?> <em><?= htmlspecialchars($sig2['title_accent']) ?></em></h2>
            <ul class="chips" data-reveal style="--d:.15s">
              <?php foreach ((array)$sig2['chips'] as $chip): ?>
                <li><?= htmlspecialchars($chip) ?></li>
              <?php endforeach; ?>
            </ul>
          </div>
          <div class="product__price" data-reveal style="--d:.2s">
            <span class="product__price-cur">IDR</span>
            <strong><?= htmlspecialchars($sig2['price']) ?></strong>
          </div>
        </div>

        <div class="product__grid product__grid--reverse">
          <div class="product__aside">
            <p class="product__blurb" data-reveal>
              <?= htmlspecialchars($sig2['blurb']) ?>
            </p>
            <a class="arrow-link"
              href="https://wa.me/6281234567890?text=<?= rawurlencode($sig2['wa_order_text'] ?? 'Halo INCOME! Saya mau pesan.') ?>"
              target="_blank" rel="noopener" data-reveal>
              Order now <i class="fa-solid fa-arrow-up-right" aria-hidden="true"></i>
            </a>
          </div>
          <div class="product__media" data-reveal>
            <img src="<?= htmlspecialchars($sig2['image']) ?>" alt="<?= htmlspecialchars($sig2['title_prefix'] . ' ' . $sig2['title_accent']) ?>" loading="lazy">
            <span class="product__tag"><i class="fa-solid <?= htmlspecialchars($sig2['category_icon']) ?>" aria-hidden="true"></i> <?= htmlspecialchars($sig2['category_name']) ?></span>
          </div>
        </div>
      </div>
    </section>
    <?php endif; ?>

    <!-- ============ COFFEE x BAKERY SHOWCASE ============ -->
    <section class="showcase">
      <div class="container">
        <header class="showcase__head">
          <p class="label" data-reveal>Coffee <span>×</span> Bakery</p>
          <h2 class="showcase__title" data-reveal style="--d:.1s">Two ledgers, <em>one till.</em></h2>
        </header>

        <div class="showcase__grid">
          <a class="showcase__card" href="#menu" data-reveal>
            <div class="showcase__media">
              <img src="assets/img/gula_aren.jpg" alt="INCOME coffee" loading="lazy">
            </div>
            <div class="showcase__info">
              <h3>Coffee</h3>
              <span class="showcase__go">Explore <i class="fa-solid fa-arrow-up-right" aria-hidden="true"></i></span>
            </div>
            <span class="showcase__line" aria-hidden="true"></span>
          </a>

          <a class="showcase__card" href="#menu" data-reveal style="--d:.12s">
            <div class="showcase__media">
              <img src="assets/img/caramel.jpg" alt="INCOME bakery" loading="lazy">
            </div>
            <div class="showcase__info">
              <h3>Bakery</h3>
              <span class="showcase__go">Explore <i class="fa-solid fa-arrow-up-right" aria-hidden="true"></i></span>
            </div>
            <span class="showcase__line" aria-hidden="true"></span>
          </a>
        </div>
      </div>
    </section>

    <!-- ============ FULL MENU ============ -->
    <section class="fullmenu" id="menu">
      <div class="container">
        <header class="fullmenu__head">
          <p class="label" data-reveal>Full Ledger</p>
          <h2 class="fullmenu__title" data-reveal style="--d:.1s">The <em>menu.</em></h2>
        </header>

        <div class="fullmenu__grid">
          <?php foreach ($menuCategories as $idx => $cat): ?>
          <div class="fullmenu__col" data-reveal<?= $idx > 0 ? ' style="--d:.1s"' : '' ?>>
            <h3 class="fullmenu__cat"><i class="fa-solid <?= htmlspecialchars($cat['icon']) ?>" aria-hidden="true"></i> <?= htmlspecialchars($cat['name']) ?></h3>
            <ul class="fullmenu__list">
              <?php if (!empty($cat['items'])): ?>
                <?php foreach ($cat['items'] as $item): ?>
                  <li data-img="<?= htmlspecialchars($item['image']) ?>" tabindex="0" role="button" aria-expanded="false">
                    <div class="fullmenu__row">
                      <span><?= htmlspecialchars($item['name']) ?></span>
                      <i class="fullmenu__dots" aria-hidden="true"></i>
                      <strong><?= htmlspecialchars($item['price']) ?></strong>
                      <i class="fa-solid fa-chevron-down fullmenu__chev" aria-hidden="true"></i>
                    </div>
                    <div class="fullmenu__preview"><img src="" alt=""></div>
                  </li>
                <?php endforeach; ?>
              <?php else: ?>
                <li style="padding: 12px 0; color: var(--gray);"><em>Menu sedang diperbarui...</em></li>
              <?php endif; ?>
            </ul>
          </div>
          <?php endforeach; ?>
        </div>

        <div class="fullmenu__foot" data-reveal>
          <span>Open daily — <?= htmlspecialchars($storeSettings['opening_hours']) ?></span>
          <a class="arrow-link" href="<?= htmlspecialchars($storeSettings['whatsapp_url']) ?>"
            target="_blank" rel="noopener">
            Order via WA <i class="fa-solid fa-arrow-up-right" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </section>

    <!-- ============ BRAND STORY ============ -->
    <section class="story" id="story">
      <div class="container">
        <p class="label story__label" data-reveal>Our Story</p>

        <h2 class="story__headline">
          <span class="mask" data-reveal-line><span>We believe</span></span>
          <span class="mask" data-reveal-line><span>the best returns</span></span>
          <span class="mask" data-reveal-line><span>come from</span></span>
          <span class="mask" data-reveal-line><span>something <em>simple.</em></span></span>
        </h2>

        <div class="story__foot">
          <p class="story__items" data-reveal>
            <span>Coffee.</span>
            <span>Fresh bread.</span>
            <span>Compound daily.</span>
          </p>
          <div class="story__mark" data-reveal style="--d:.1s">
            <img src="assets/img/logo_income.png" alt="INCOME logo">
            <i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ EXPERIENCE / VISUAL ============ -->
    <section class="experience">
      <div class="container">
        <header class="experience__head">
          <p class="label" data-reveal>The Process</p>
          <h2 class="experience__title" data-reveal style="--d:.1s">
            Small batch, <em>every morning.</em><br>
            Logged with <em class="outline">intention.</em>
          </h2>
        </header>

        <div class="experience__grid">
          <div class="experience__text">
            <p data-reveal>
              We measure, we grind, we proof, we bake.
              No shortcuts — just good things, entered daily,
              in small batches that close out before noon.
            </p>
            <a class="arrow-link" href="#location" data-reveal style="--d:.1s">
              Find us <i class="fa-solid fa-arrow-up-right" aria-hidden="true"></i>
            </a>
          </div>

          <div class="experience__visual" aria-label="Coffee and bakery photography">
            <figure class="experience__img experience__img--a" data-parallax data-speed="0.06">
              <img src="assets/img/gula_aren.jpg" alt="Freshly brewed INCOME coffee in a glass" loading="lazy">
            </figure>
            <figure class="experience__img experience__img--b" data-parallax data-speed="-0.09" data-rotate="3deg">
              <img src="assets/img/caramel.jpg" alt="Freshly baked INCOME pastry" loading="lazy">
            </figure>
            <span class="experience__stamp" data-parallax data-speed="0.12" data-rotate="-9deg">
              <i class="fa-solid fa-stamp" aria-hidden="true"></i>
              Fresh<br>daily
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ TESTIMONIALS ============ -->
    <section class="testi">
      <div class="container">
        <p class="label testi__label" data-reveal>Good Words</p>

        <div class="testi__grid">
          <?php foreach ($testimonials as $tIdx => $t): ?>
            <blockquote data-reveal<?= $tIdx > 0 ? ' style="--d:.' . ($tIdx * 1) . 's"' : '' ?>>
              <p><?= htmlspecialchars($t['quote']) ?></p>
              <footer><strong><?= htmlspecialchars($t['author_name']) ?></strong><span><?= htmlspecialchars($t['author_role']) ?></span></footer>
            </blockquote>
          <?php endforeach; ?>
        </div>
      </div>
    </section>

    <!-- ============ VIBE BANNER ============ -->
    <section class="vibe" aria-label="Inside INCOME Coffee &amp; Bakery">
      <img src="assets/img/caramel.jpg" alt="The warm, cozy corner of INCOME Coffee & Bakery" loading="lazy">
      <span class="vibe__caption"><i class="fa-solid fa-camera" aria-hidden="true"></i> Inside — INCOME</span>
    </section>

    <!-- ============ LOCATION / CTA ============ -->
    <section class="location" id="location">
      <div class="container">
        <h2 class="location__title">
          <span class="mask" data-reveal-line><span>Come</span></span>
          <span class="mask" data-reveal-line><span>say <em>hello.</em></span></span>
        </h2>

        <div class="location__grid">
          <div class="location__info">
            <div class="location__card" data-reveal>
              <span class="location__name"><?= htmlspecialchars($storeSettings['store_name']) ?></span>
              <span class="location__sub">Coffee &amp; Bakery</span>
            </div>
            <ul class="location__facts">
              <li data-reveal>
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                <div><strong>Find us</strong><span><?= htmlspecialchars($storeSettings['address']) ?></span></div>
              </li>
              <li data-reveal style="--d:.08s">
                <i class="fa-solid fa-clock" aria-hidden="true"></i>
                <div><strong>Open daily</strong><span><?= htmlspecialchars($storeSettings['opening_hours']) ?></span></div>
              </li>
              <li data-reveal style="--d:.16s">
                <i class="fa-solid fa-phone" aria-hidden="true"></i>
                <div><strong>Call / WA</strong><span><?= htmlspecialchars($storeSettings['phone']) ?></span></div>
              </li>
              <li data-reveal style="--d:.24s">
                <i class="fa-solid fa-mug-hot" aria-hidden="true"></i>
                <div><strong>Good things</strong><span>Brewed &amp; baked every day</span></div>
              </li>
            </ul>
          </div>

          <div class="location__cta" data-reveal style="--d:.1s">
            <a class="btn btn--blue" href="<?= htmlspecialchars($storeSettings['maps_url']) ?>" target="_blank"
              rel="noopener">
              Find us <i class="fa-solid fa-arrow-up-right" aria-hidden="true"></i>
            </a>
            <a class="btn btn--outline" href="<?= htmlspecialchars($storeSettings['whatsapp_url']) ?>"
              target="_blank" rel="noopener">
              Order <i class="fa-solid fa-arrow-up-right" aria-hidden="true"></i>
            </a>
          </div>
        </div>

        <div class="location__map" data-reveal>
          <iframe src="<?= htmlspecialchars($storeSettings['maps_embed']) ?>"
            title="<?= htmlspecialchars($storeSettings['store_name']) ?> Coffee &amp; Bakery — Serang, Banten" loading="lazy" allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>
    </section>

  </main>

  <!-- ============ FOOTER ============ -->
  <footer class="footer">
    <div class="container">
      <div class="footer__top">
        <div class="footer__brand">
          <img src="assets/img/logo_income.png" alt="INCOME logo">
          <p>Coffee &amp; Bakery<br>A daily ledger of<br>good things.</p>
        </div>

        <div class="footer__social">
          <a href="<?= htmlspecialchars($storeSettings['instagram_url']) ?>" target="_blank" rel="noopener">
            <i class="fa-brands fa-instagram" aria-hidden="true"></i> Instagram <i class="fa-solid fa-arrow-up-right"
              aria-hidden="true"></i>
          </a>
          <a href="<?= htmlspecialchars($storeSettings['tiktok_url']) ?>" target="_blank" rel="noopener">
            <i class="fa-brands fa-tiktok" aria-hidden="true"></i> TikTok <i class="fa-solid fa-arrow-up-right"
              aria-hidden="true"></i>
          </a>
          <a href="<?= htmlspecialchars($storeSettings['maps_url']) ?>" target="_blank" rel="noopener">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i> Maps <i class="fa-solid fa-arrow-up-right"
              aria-hidden="true"></i>
          </a>
        </div>
      </div>

      <div class="footer__bottom">
        <span>© <?= date('Y') ?> <?= htmlspecialchars($storeSettings['store_name']) ?></span>
        <span class="footer__watermark" aria-hidden="true"><?= htmlspecialchars($storeSettings['store_name']) ?></span>
        <span>Est. <?= htmlspecialchars($storeSettings['est_year']) ?> — Serang</span>
      </div>
    </div>
  </footer>

  <button class="to-top" id="toTop" aria-label="Back to top">
    <i class="fa-solid fa-arrow-up" aria-hidden="true"></i>
  </button>

  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
  <script src="js/main.js"></script>
</body>

</html>
