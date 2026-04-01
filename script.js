/**
 * BAD DECISIONS - Main JavaScript
 * Snipcart version
 */

document.addEventListener("DOMContentLoaded", () => {
  initCookieBanner();
  initNewsletterForm();
  initContactForm();
  initSmoothScroll();
  initHeaderScroll();

  if (typeof initLanguageSwitcher === "function") {
    initLanguageSwitcher();
  }

  initMobileMenu();
  updateFooterYear();
});

/* ======================
   TRANSLATION HELPER
====================== */
function tr(key, fallback, vars = {}) {
  if (typeof t === "function") {
    return t(key, vars);
  }

  let text = fallback;
  Object.keys(vars).forEach((varKey) => {
    text = text.replace(`{${varKey}}`, vars[varKey]);
  });
  return text;
}

/* ======================
   HEADER SCROLL
====================== */
function initHeaderScroll() {
  const header = document.querySelector(".header");
  if (!header) return;

  function setHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }

  setHeader();
  window.addEventListener("scroll", setHeader, { passive: true });
  window.addEventListener("load", setHeader);
}

/* ======================
   MOBILE MENU
====================== */
function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const header = document.querySelector(".header");

  if (!menuToggle || !mobileMenu || !header) return;

  const root = document.documentElement;

  function setHeaderHeightVar() {
    const h = header.getBoundingClientRect().height;
    root.style.setProperty("--header-h", `${Math.round(h)}px`);
  }

  function openMenu() {
    setHeaderHeightVar();
    root.classList.add("menu-open");
    menuToggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    root.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = root.classList.contains("menu-open");
    if (isOpen) closeMenu();
    else openMenu();
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (e) => {
    if (!root.classList.contains("menu-open")) return;
    if (mobileMenu.contains(e.target) || menuToggle.contains(e.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener(
    "resize",
    () => {
      if (root.classList.contains("menu-open")) setHeaderHeightVar();
    },
    { passive: true }
  );
}

/* ======================
   COOKIE BANNER
====================== */
function initCookieBanner() {
  const banner = document.getElementById("cookieBanner");
  if (!banner) return;

  const consent = localStorage.getItem("cookieConsent");

  if (consent === "accepted" || consent === "declined") {
    banner.hidden = true;
    banner.classList.remove("show");
    return;
  }

  banner.hidden = false;

  setTimeout(() => {
    banner.classList.add("show");
  }, 200);

  const acceptBtn = document.getElementById("cookieAccept");
  const declineBtn = document.getElementById("cookieDecline");

  acceptBtn?.addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "accepted");
    hideCookieBanner();
  });

  declineBtn?.addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "declined");
    hideCookieBanner();
  });
}

function hideCookieBanner() {
  const banner = document.getElementById("cookieBanner");
  if (!banner) return;

  banner.classList.remove("show");
  banner.hidden = true;
}

/* ======================
   NEWSLETTER FORM
====================== */
function initNewsletterForm() {
  const form = document.getElementById("newsletterForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]')?.value || "";
    alert(`${tr("newsletterThanks", "Thanks for subscribing with:")} ${email}`);
    form.reset();
  });
}

/* ======================
   CONTACT FORM
====================== */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.querySelector("#name")?.value || "";
    alert(
      tr(
        "contactThanks",
        "Thanks for your message, {name}! We'll get back to you soon.",
        { name }
      )
    );
    form.reset();
  });
}

/* ======================
   SMOOTH SCROLL
====================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const headerOffset = 90;
      const top =
        target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

      window.scrollTo({
        top,
        behavior: "smooth"
      });
    });
  });
}

/* ======================
   MISC
====================== */
function updateFooterYear() {
  const yearEl = document.getElementById("bdFooterYear");
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
}

/* ======================
   OPTIONAL HELPER
====================== */
function getDisplayColor(color) {
  const value = String(color || "").trim();

  if (
    value === "Navy" ||
    value === "Navy Blue" ||
    value === "Temno modra"
  ) {
    return tr("navyBlue", "Navy Blue");
  }

  return value;
}


