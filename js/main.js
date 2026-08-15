/* INCOME — Coffee & Bakery
   Vanilla JS: Lenis smooth scroll, reveal, parallax, navbar, mobile menu
   Principle: subtle, intentional, fast. */

(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lenis = null;

  /* ---------- Smooth scrolling (Lenis) ---------- */
  if (!prefersReduced && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  var onScroll = function (cb) {
    if (lenis) {
      lenis.on("scroll", cb);
    } else {
      window.addEventListener("scroll", cb, { passive: true });
    }
  };

  var scrollTo = function (target, offset) {
    if (lenis) {
      lenis.scrollTo(target, { offset: offset || 0, duration: 1.3 });
    } else {
      var top = 0;
      if (typeof target === "string") {
        var el = document.querySelector(target);
        if (el) top = el.getBoundingClientRect().top + window.scrollY - (offset || 0);
      } else if (target !== null && typeof target !== "undefined") {
        top = target - (offset || 0);
      }
      window.scrollTo({ top: top, behavior: "smooth" });
    }
  };

  /* ---------- Anchor navigation ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (href === "#" || href.length < 2) return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (mobileMenu.classList.contains("is-open")) closeMenu();
      scrollTo(href, -70);
    });
  });

  /* ---------- Navbar state ---------- */
  var navbar = document.getElementById("navbar");

  var onNavScroll = function () {
    if (window.scrollY > 24) {
      navbar.classList.add("is-scrolled");
    } else {
      navbar.classList.remove("is-scrolled");
    }
  };

  onScroll(onNavScroll);
  onNavScroll();

  /* ---------- Scroll progress bar ---------- */
  var progressBar = document.getElementById("scrollProgress");

  if (progressBar) {
    var updateProgress = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      progressBar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    };

    onScroll(updateProgress);
    window.addEventListener("resize", updateProgress, { passive: true });
    updateProgress();
  }

  /* ---------- Scrollspy (active nav link) ---------- */
  var spySections = document.querySelectorAll("main section[id]");
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll(".navbar__nav .nav-link"));

  if ("IntersectionObserver" in window && spySections.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          spyLinks.forEach(function (link) {
            var match = link.getAttribute("href") === "#" + entry.target.id;
            link.classList.toggle("active", match);
            if (match) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    spySections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- Back to top ---------- */
  var toTop = document.getElementById("toTop");

  if (toTop) {
    var onToTopScroll = function () {
      toTop.classList.toggle("is-visible", window.scrollY > 700);
    };
    onScroll(onToTopScroll);
    onToTopScroll();

    toTop.addEventListener("click", function () {
      scrollTo(0, 0);
    });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("navBurger");
  var mobileMenu = document.getElementById("mobileMenu");
  var closeBtn = document.getElementById("mobileMenuClose");

  var openMenu = function () {
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Close menu");
    if (lenis) lenis.stop();
    else document.body.style.overflow = "hidden";
  };

  var closeMenu = function () {
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
    if (lenis) lenis.start();
    else document.body.style.overflow = "";
  };

  burger.addEventListener("click", function () {
    if (mobileMenu.classList.contains("is-open")) closeMenu();
    else openMenu();
  });
  closeBtn.addEventListener("click", closeMenu);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) closeMenu();
  });

  /* ---------- Menu item product preview ---------- */
  var menuCols = Array.prototype.slice.call(document.querySelectorAll(".fullmenu__col"));

  if (menuCols.length) {
    var canHover = window.matchMedia("(hover: hover)").matches;

    menuCols.forEach(function (col) {
      var items = Array.prototype.slice.call(col.querySelectorAll(".fullmenu__list li"));

      var close = function (item) {
        var preview = item.querySelector(".fullmenu__preview");
        if (preview) preview.classList.remove("is-open");
        item.classList.remove("is-open");
        item.setAttribute("aria-expanded", "false");
      };

      var open = function (item) {
        items.forEach(function (other) {
          if (other !== item) close(other);
        });
        var preview = item.querySelector(".fullmenu__preview");
        var previewImg = preview ? preview.querySelector("img") : null;
        if (!preview || !previewImg) return;
        var src = item.getAttribute("data-img");
        if (previewImg.getAttribute("src") !== src) {
          previewImg.src = src;
          var nameEl = item.querySelector(".fullmenu__row span");
          previewImg.alt = (nameEl ? nameEl.textContent.trim() : "Product") + " — INCOME";
        }
        preview.classList.add("is-open");
        item.classList.add("is-open");
        item.setAttribute("aria-expanded", "true");
      };

      items.forEach(function (item) {
        item.addEventListener("click", function () {
          if (item.classList.contains("is-open")) close(item);
          else open(item);
        });

        item.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            item.click();
          }
        });

        if (canHover) {
          item.addEventListener("mouseenter", function () {
            open(item);
          });
          item.addEventListener("mouseleave", function () {
            close(item);
          });
        }
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll("[data-reveal], [data-reveal-line]");

  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Subtle parallax ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var ticking = false;

  if (!prefersReduced && parallaxEls.length) {
    var updateParallax = function () {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        var center = rect.top + rect.height / 2 - vh / 2;
        var speed = parseFloat(el.getAttribute("data-speed")) || 0.08;
        var rotate = el.getAttribute("data-rotate");
        var y = -center * speed;
        var transform = "translate3d(0, " + y.toFixed(1) + "px, 0)";
        if (rotate) transform += " rotate(" + rotate + ")";
        el.style.transform = transform;
      });
      ticking = false;
    };

    var requestTick = function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    };

    onScroll(requestTick);
    window.addEventListener("resize", requestTick, { passive: true });
    updateParallax();
  }
})();