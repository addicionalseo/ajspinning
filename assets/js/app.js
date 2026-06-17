// assets/js/app.js — AJSpinning

// ─── Nav móvil ─────────────────────────────────────
const toggle = document.querySelector(".nav-toggle");
const nav    = document.querySelector(".main-nav");
if (toggle && nav) {
  const navId = nav.id || "site-nav";
  nav.id = navId;
  toggle.setAttribute("aria-controls", navId);
  toggle.setAttribute("aria-expanded", "false");

  function closeNav() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  }

  function openNav() {
    nav.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
  }

  toggle.addEventListener("click", () => {
    if (nav.classList.contains("open")) {
      closeNav();
    } else {
      openNav();
    }
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("open")) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    closeNav();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeNav());
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      closeNav();
    }
  });
}

const backToTopButton = document.querySelector("[data-back-to-top]");

function syncBackToTopOffset() {
  if (!backToTopButton) return;
  const banner = document.querySelector(".cookie-banner");
  const bannerVisible = banner && !banner.hasAttribute("hidden") && banner.offsetParent !== null;
  const baseOffset = window.innerWidth <= 560 ? 14 : 18;
  const nextOffset = bannerVisible
    ? Math.ceil(banner.getBoundingClientRect().height + baseOffset + 12)
    : baseOffset;
  backToTopButton.style.setProperty("--back-to-top-offset", `${nextOffset}px`);
}

function initBackToTop() {
  if (!backToTopButton) return;

  function toggleBackToTopVisibility() {
    backToTopButton.classList.toggle("is-visible", window.scrollY > 520);
  }

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", toggleBackToTopVisibility, { passive: true });
  window.addEventListener("resize", syncBackToTopOffset);
  toggleBackToTopVisibility();
  syncBackToTopOffset();
}

initBackToTop();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPrice(value) {
  const number = Number(value) || 0;
  return `${number.toFixed(2)} €`;
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function renderStandardProductCard(p) {
  const title = p.display_title || "Producto de pesca";
  return `
    <article class="product-card">
      <a href="/producto/${escapeHtml(p.slug)}/" class="card-link">
        <div class="card-img-wrap">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(title)}" loading="lazy" width="300" height="300">
          ${(p.discount || 0) >= 5 ? `<span class="badge">-${escapeHtml(p.discount)}%</span>` : ""}
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(String(title).substring(0, 80))}</h3>
          <div class="card-price">
            ${(p.price_original || 0) > (p.price || 0) ? `<span class="price-original">${formatPrice(p.price_original)}</span>` : ""}
            <span class="price-sale">${formatPrice(p.price)}</span>
          </div>
        </div>
      </a>
      <a href="/producto/${escapeHtml(p.slug)}/" class="btn-buy">
        Ver ficha y análisis →
      </a>
    </article>
  `;
}

function renderCatalogProductCard(p) {
  const title = p.display_title || "Producto de pesca";
  const ratingLabel = String(p.rating || "").replace(".0%", "%");
  const signals = [];
  if ((p.discount || 0) >= 20) signals.push(`-${p.discount}%`);
  if ((p.sales || 0) >= 300) signals.push(`${p.sales} compras`);
  else if (p.sales) signals.push(`${p.sales} vendidos`);
  if (ratingLabel) signals.push(`${ratingLabel} positivas`);

  return `
    <article class="product-card product-card-catalog">
      <a href="/producto/${escapeHtml(p.slug)}/" class="card-link">
        <div class="card-img-wrap">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(title)}" loading="lazy" width="300" height="300">
          ${(p.discount || 0) >= 5 ? `<span class="badge">-${escapeHtml(p.discount)}%</span>` : ""}
        </div>
        <div class="card-body">
          <div class="card-meta-row">
            <span class="product-card-cat">${escapeHtml(p.category_name || "Producto")}</span>
          </div>
          <h3 class="card-title">${escapeHtml(String(title).substring(0, 110))}</h3>
          <div class="card-signal-row">
            ${signals.map((signal) => `<span class="card-signal">${escapeHtml(signal)}</span>`).join("")}
          </div>
          <div class="card-price">
            ${(p.price_original || 0) > (p.price || 0) ? `<span class="price-original">${formatPrice(p.price_original)}</span>` : ""}
            <span class="price-sale">${formatPrice(p.price)}</span>
          </div>
        </div>
      </a>
      <a href="/producto/${escapeHtml(p.slug)}/" class="btn-buy">
        Ver ficha y análisis →
      </a>
    </article>
  `;
}

// ─── Sorting en páginas de categoría ───────────────
const categorySortSelect = document.getElementById("sortSelect");
const categoryGrid       = document.getElementById("productGrid");

if (categorySortSelect && categoryGrid && window.CATEGORY_PRODUCTS) {
  categorySortSelect.addEventListener("change", () => {
    const mode = categorySortSelect.value;
    const products = [...window.CATEGORY_PRODUCTS];

    products.sort((a, b) => {
      switch (mode) {
        case "price-asc":  return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "discount":   return (b.discount || 0) - (a.discount || 0);
        case "sales":      return (b.sales || 0) - (a.sales || 0);
        default: return 0;
      }
    });

    categoryGrid.innerHTML = products.map(renderStandardProductCard).join("");
  });
}

// ─── Catálogo / tienda con filtros ─────────────────
function hydrateShopCatalog() {
  const root = document.querySelector("[data-shop-root]");
  if (!root || !window.SHOP_PRODUCTS) return;

  const searchInput = root.querySelector("#shopSearch");
  const categoryInput = root.querySelector("#shopCategory");
  const sortInput = root.querySelector("#shopSort");
  const priceInput = root.querySelector("#shopPrice");
  const priceValue = root.querySelector("#shopPriceValue");
  const discountInput = root.querySelector("#shopDiscount");
  const popularInput = root.querySelector("#shopPopular");
  const resetButton = root.querySelector("#shopReset");
  const grid = root.querySelector("#shopGrid");
  const empty = root.querySelector("#shopEmpty");
  const count = root.querySelector("#shopResultsCount");
  const activeFilters = root.querySelector("#shopActiveFilters");
  if (!searchInput || !categoryInput || !sortInput || !priceInput || !priceValue || !discountInput || !popularInput || !resetButton || !grid || !empty || !count || !activeFilters) {
    return;
  }

  const defaults = {
    q: "",
    categoria: "",
    orden: "featured",
    precioMax: Number(window.SHOP_DEFAULTS?.maxPrice || priceInput.max || 0),
    descuento: 0,
    popular: false
  };

  function readParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      q: params.get("q") || defaults.q,
      categoria: params.get("categoria") || defaults.categoria,
      orden: params.get("orden") || defaults.orden,
      precioMax: Math.min(defaults.precioMax, Number(params.get("precioMax")) || defaults.precioMax),
      descuento: Number(params.get("descuento")) || defaults.descuento,
      popular: params.get("popular") === "1"
    };
  }

  function writeControls(state) {
    searchInput.value = state.q;
    categoryInput.value = state.categoria;
    sortInput.value = state.orden;
    priceInput.value = String(state.precioMax);
    discountInput.value = String(state.descuento);
    popularInput.checked = state.popular;
    priceValue.textContent = `${state.precioMax} €`;
  }

  function readControls() {
    return {
      q: searchInput.value.trim(),
      categoria: categoryInput.value,
      orden: sortInput.value,
      precioMax: Number(priceInput.value) || defaults.precioMax,
      descuento: Number(discountInput.value) || 0,
      popular: popularInput.checked
    };
  }

  function syncUrl(state) {
    const params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    if (state.categoria) params.set("categoria", state.categoria);
    if (state.orden && state.orden !== defaults.orden) params.set("orden", state.orden);
    if (state.precioMax < defaults.precioMax) params.set("precioMax", String(state.precioMax));
    if (state.descuento > 0) params.set("descuento", String(state.descuento));
    if (state.popular) params.set("popular", "1");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }

  function sortProducts(products, mode) {
    products.sort((a, b) => {
      switch (mode) {
        case "price-asc":
          return (a.price || 0) - (b.price || 0);
        case "price-desc":
          return (b.price || 0) - (a.price || 0);
        case "discount":
          return (b.discount || 0) - (a.discount || 0);
        case "sales":
          return (b.sales || 0) - (a.sales || 0);
        case "featured":
        default:
          if ((b.sales || 0) !== (a.sales || 0)) return (b.sales || 0) - (a.sales || 0);
          if ((b.discount || 0) !== (a.discount || 0)) return (b.discount || 0) - (a.discount || 0);
          return (a.price || 0) - (b.price || 0);
      }
    });
    return products;
  }

  function updateActiveFilters(state) {
    const chips = [];
    if (state.q) chips.push(`Búsqueda: ${state.q}`);
    if (state.categoria) {
      const label = categoryInput.options[categoryInput.selectedIndex]?.textContent || state.categoria;
      chips.push(label.replace(/\s*\(\d+\)$/, ""));
    }
    if (state.precioMax < defaults.precioMax) chips.push(`Hasta ${state.precioMax} €`);
    if (state.descuento > 0) chips.push(`Descuento ${state.descuento}%+`);
    if (state.popular) chips.push("300+ compras");
    activeFilters.hidden = chips.length === 0;
    activeFilters.innerHTML = chips.map((chip) => `<span class="shop-active-filter">${escapeHtml(chip)}</span>`).join("");
  }

  function render(state) {
    priceValue.textContent = `${state.precioMax} €`;
    const query = normalizeText(state.q);
    const filtered = sortProducts(
      window.SHOP_PRODUCTS.filter((product) => {
        if (state.categoria && product.category_slug !== state.categoria) return false;
        if ((Number(product.price) || 0) > state.precioMax) return false;
        if ((Number(product.discount) || 0) < state.descuento) return false;
        if (state.popular && (Number(product.sales) || 0) < Number(window.SHOP_DEFAULTS?.popularSales || 300)) return false;
        if (!query) return true;
        const haystack = normalizeText(`${product.display_title || product.title || ""} ${product.category_name} ${product.category_slug}`);
        return haystack.includes(query);
      }),
      state.orden
    );

    count.textContent = String(filtered.length);
    updateActiveFilters(state);
    if (!filtered.length) {
      grid.innerHTML = "";
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    grid.innerHTML = filtered.map(renderCatalogProductCard).join("");
  }

  const initialState = readParams();
  writeControls(initialState);
  render(initialState);

  [searchInput, categoryInput, sortInput, priceInput, discountInput, popularInput].forEach((element) => {
    const eventName = element === popularInput ? "change" : (element === searchInput ? "input" : "change");
    element.addEventListener(eventName, () => {
      const state = readControls();
      syncUrl(state);
      render(state);
    });
  });

  resetButton.addEventListener("click", () => {
    writeControls(defaults);
    syncUrl(defaults);
    render(defaults);
  });
}

hydrateShopCatalog();

// ─── FAQ accordion ──────────────────────────────────
document.querySelectorAll(".faq-q").forEach(btn => {
  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    const answer = btn.nextElementSibling;
    if (answer) answer.hidden = expanded;
  });
});

// ─── Formulario de contacto visual ──────────────────
document.querySelectorAll("[data-contact-form]").forEach((form) => {
  const status = form.querySelector("[data-contact-status]");
  const submitButton = form.querySelector("button[type='submit']");

  function setStatus(message, isError) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
    status.classList.toggle("is-success", Boolean(message) && !isError);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const reason = String(data.get("reason") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!name || !email || !reason || !message) {
      setStatus("Completa nombre, email, motivo y mensaje para preparar la consulta.", true);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("Revisa el email antes de abrir la consulta.", true);
      return;
    }

    const subject = `Consulta AJSpinning · ${reason} · ${name}`;
    const body = [
      `Nombre: ${name}`,
      `Email: ${email}`,
      `Motivo: ${reason}`,
      "",
      "Mensaje:",
      message
    ].join("\n");

    if (submitButton) {
      submitButton.disabled = true;
    }
    setStatus("Abrimos tu cliente de correo con la consulta preparada para enviar a AJSpinning.", false);
    window.location.href = `mailto:info@ajspinning.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.setTimeout(() => {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }, 1200);
  });
});

// ─── Banner de cookies ─────────────────────────────
const COOKIE_CONSENT_KEY = "ajspinning_cookie_consent_v1";
const ADSENSE_SCRIPT_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8807692365779886";
let adSenseScriptRequested = false;

function loadAdSenseScript() {
  if (adSenseScriptRequested) return;
  if (document.querySelector('script[data-adsense-loader], script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
    adSenseScriptRequested = true;
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = ADSENSE_SCRIPT_SRC;
  script.dataset.adsenseLoader = "true";
  document.head.appendChild(script);
  adSenseScriptRequested = true;
}

function applyCookiePreference(value) {
  document.documentElement.dataset.cookieConsent = value || "unset";
  if (value === "accepted" || value === "rejected") {
    window.adsbygoogle = window.adsbygoogle || [];
    if (value === "rejected") {
      window.adsbygoogle.requestNonPersonalizedAds = 1;
      window.google_ad_personalization = 0;
      window.google_ad_personalization_signals = 0;
    } else {
      delete window.adsbygoogle.requestNonPersonalizedAds;
      delete window.google_ad_personalization;
      delete window.google_ad_personalization_signals;
    }
    loadAdSenseScript();
  }
}

function saveCookiePreference(value, banner) {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch (error) {
    console.warn("No se pudo guardar la preferencia de cookies", error);
  }
  applyCookiePreference(value);
  if (banner) banner.remove();
  syncBackToTopOffset();
}

function createCookieBanner() {
  const banner = document.createElement("aside");
  banner.className = "cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-live", "polite");
  banner.setAttribute("aria-label", "Aviso de cookies");
  banner.innerHTML = `
    <div class="cookie-banner-inner">
      <p class="cookie-banner-kicker">Cookies y privacidad</p>
      <p class="cookie-banner-text">
        Usamos cookies propias y de terceros para medición y publicidad. Puedes aceptar todas, rechazarlas o revisar cómo afecta a tu experiencia en AJSpinning.
      </p>
      <div class="cookie-banner-actions">
        <button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="reject">Rechazar</button>
        <button type="button" class="cookie-btn cookie-btn-ghost" data-cookie-action="options">Configurar</button>
        <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="accept">Aceptar todas</button>
      </div>
      <div class="cookie-banner-details" hidden>
        <p>
          Las cookies necesarias siguen activas para que la web funcione. La analítica y la publicidad se activan
          solo cuando ya existe una decisión guardada en este navegador. Puedes revisar más detalles en nuestra
          <a href="/politica-privacidad/">Política de Privacidad</a> y en la <a href="/politica-cookies/">Política de Cookies</a>.
        </p>
      </div>
    </div>
  `;

  banner.addEventListener("click", (event) => {
    const target = event.target.closest("[data-cookie-action]");
    if (!target) return;
    const action = target.dataset.cookieAction;

    if (action === "accept") {
      saveCookiePreference("accepted", banner);
    } else if (action === "reject") {
      saveCookiePreference("rejected", banner);
    } else if (action === "options") {
      const details = banner.querySelector(".cookie-banner-details");
      const isHidden = details.hasAttribute("hidden");
      if (isHidden) {
        details.removeAttribute("hidden");
      } else {
        details.setAttribute("hidden", "");
      }
    }
  });

  document.body.appendChild(banner);
  syncBackToTopOffset();
}

function hasExternalCmp() {
  return (
    typeof window.__tcfapi === "function" ||
    !!window.googlefc ||
    !!document.querySelector('iframe[name="googlefcPresent"]')
  );
}

function removeCookieBannerIfPresent() {
  const banner = document.querySelector(".cookie-banner");
  if (banner) {
    banner.remove();
    syncBackToTopOffset();
  }
}

try {
  const savedCookiePreference = localStorage.getItem(COOKIE_CONSENT_KEY);
  applyCookiePreference(savedCookiePreference);
  if (hasExternalCmp()) {
    removeCookieBannerIfPresent();
  } else if (!savedCookiePreference) {
    createCookieBanner();
  }
} catch (error) {
  if (hasExternalCmp()) {
    removeCookieBannerIfPresent();
  } else {
    applyCookiePreference("");
    createCookieBanner();
  }
}

window.setTimeout(() => {
  if (hasExternalCmp()) {
    removeCookieBannerIfPresent();
  }
}, 1800);

// ─── Guía interactiva ─────────────────────────────
const PLANNER_STATE_KEY = "ajspinning_planner_v1";
const plannerProfiles = {
  lucio: {
    label: "Lucio",
    lure: "jerkbait suspending o shad de 12-16 cm",
    setup: "caña MH/H, bajo resistente y pausas largas cerca de estructura",
    category: { label: "Ver señuelos para depredadores", href: "/categoria/senuelos/" },
    guides: [
      { label: "Mejores señuelos para lucio", href: "/guia/mejores-senueulos-lucio/" },
      { label: "Leer embalse para lucio y perca", href: "/guia/leer-embalse-lucio-perca/" }
    ]
  },
  lucioperca: {
    label: "Lucioperca",
    lure: "vinilo tipo shad 8-12 cm con cabeza plomada o minnow profundo",
    setup: "caña M sensible, trenzado fino y contacto continuo con fondo",
    category: { label: "Ver señuelos de profundidad", href: "/categoria/senuelos/" },
    guides: [
      { label: "Cómo elegir señuelo según el agua y el clima", href: "/guia/como-elegir-senuelo-segun-agua-y-clima/" },
      { label: "Leer embalse para lucio y perca", href: "/guia/leer-embalse-lucio-perca/" }
    ]
  },
  perca: {
    label: "Perca",
    lure: "vinilo pequeño, crankbait compacto o cucharilla media",
    setup: "caña ligera/ML, línea fina y recogidas con microparadas",
    category: { label: "Ver señuelos ligeros", href: "/categoria/senuelos/" },
    guides: [
      { label: "Leer embalse para lucio y perca", href: "/guia/leer-embalse-lucio-perca/" },
      { label: "Spinning para principiantes", href: "/guia/spinning-para-principiantes/" }
    ]
  },
  blackbass: {
    label: "Black bass",
    lure: "vinilo tipo creature, jerkbait minnow o spinnerbait ligero",
    setup: "caña M/MH rápida, precisión a cobertura y pausas cortas",
    category: { label: "Ver señuelos para bass", href: "/categoria/senuelos/" },
    guides: [
      { label: "Técnicas de spinning avanzadas", href: "/guia/tecnicas-spinning-avanzadas/" },
      { label: "Errores de spinning que frenan tus capturas", href: "/guia/errores-spinning-principiantes/" }
    ]
  },
  barbo: {
    label: "Barbo",
    lure: "cucharilla, minnow pequeño o vinilo natural en corriente",
    setup: "caña ML, hilo fino y presentación discreta cerca del fondo",
    category: { label: "Ver señuelos naturales", href: "/categoria/senuelos/" },
    guides: [
      { label: "Spinning para principiantes", href: "/guia/spinning-para-principiantes/" },
      { label: "Cómo elegir señuelo según el agua y el clima", href: "/guia/como-elegir-senuelo-segun-agua-y-clima/" }
    ]
  },
  lubina: {
    label: "Lubina",
    lure: "minnow hundido o jig de 10-28 g",
    setup: "caña 2,40-2,70 m, trenzado fino y lectura de espuma o corriente",
    category: { label: "Ver señuelos para costa", href: "/categoria/senuelos/" },
    guides: [
      { label: "Mejores señuelos para lubina", href: "/guia/mejores-senueulos-lubina/" },
      { label: "Cómo elegir señuelo según el agua y el clima", href: "/guia/como-elegir-senuelo-segun-agua-y-clima/" }
    ]
  },
  trucha: {
    label: "Trucha",
    lure: "minnow pequeño, cucharilla o vinilo ligero",
    setup: "caña ligera, hilo fino y lances discretos aguas arriba o cruzados",
    category: { label: "Ver equipo ligero", href: "/categoria/canas/" },
    guides: [
      { label: "Señuelos para trucha en spinning", href: "/guia/senuelos-para-trucha-spinning/" },
      { label: "Cómo elegir señuelo según el agua y el clima", href: "/guia/como-elegir-senuelo-segun-agua-y-clima/" }
    ]
  },
  siluro: {
    label: "Siluro",
    lure: "swimbait grande, vinilo pesado o crankbait profundo",
    setup: "equipo potente, línea trenzada robusta y trabajo cerca de estructura",
    category: { label: "Ver combos y líneas", href: "/categoria/combos/" },
    guides: [
      { label: "Calendario de spinning en España", href: "/guia/calendario-spinning-espana/" },
      { label: "Errores de spinning que frenan tus capturas", href: "/guia/errores-spinning-principiantes/" }
    ]
  },
  anjova: {
    label: "Anjova",
    lure: "paseante, popper o jig casting de 20-40 g",
    setup: "caña 2,40-2,70 m, trenzado 0.14-0.18 y recogida con aceleraciones",
    category: { label: "Ver señuelos para mar", href: "/categoria/senuelos/" },
    guides: [
      { label: "Spinning en costa: espuma, viento y mareas", href: "/guia/spinning-costa-espuma-mareas/" },
      { label: "Peces de spinning en mar en España", href: "/guia/peces-spinning-mar-espana/" }
    ]
  },
  palometon: {
    label: "Palometón",
    lure: "jig metálico de lance, minnow largo o stickbait",
    setup: "equipo potente, freno fino y trabajo en canales o pajareras",
    category: { label: "Ver equipo para mar potente", href: "/categoria/combos/" },
    guides: [
      { label: "Spinning en costa: espuma, viento y mareas", href: "/guia/spinning-costa-espuma-mareas/" },
      { label: "Peces de spinning en mar en España", href: "/guia/peces-spinning-mar-espana/" }
    ]
  },
  jurel: {
    label: "Jurel",
    lure: "microjig, vinilo slim o metal jig pequeño",
    setup: "caña ML, línea fina y ritmo constante con pequeños toques",
    category: { label: "Ver señuelos ligeros de mar", href: "/categoria/senuelos/" },
    guides: [
      { label: "Peces de spinning en mar en España", href: "/guia/peces-spinning-mar-espana/" },
      { label: "Spinning en costa: espuma, viento y mareas", href: "/guia/spinning-costa-espuma-mareas/" }
    ]
  },
  caballa: {
    label: "Caballa",
    lure: "jig casting, cucharilla ondulante o minnow estrecho",
    setup: "caña M, lances largos y velocidad alta cuando hay banco activo",
    category: { label: "Ver señuelos de lance largo", href: "/categoria/senuelos/" },
    guides: [
      { label: "Peces de spinning en mar en España", href: "/guia/peces-spinning-mar-espana/" },
      { label: "Spinning en costa: espuma, viento y mareas", href: "/guia/spinning-costa-espuma-mareas/" }
    ]
  },
  dorada: {
    label: "Dorada",
    lure: "vinilo tipo cangrejo, pequeño jig o minnow natural pegado al fondo",
    setup: "caña M ligera, bajo largo de fluorocarbono y presentación lenta",
    category: { label: "Ver señuelos y accesorios de costa", href: "/categoria/senuelos/" },
    guides: [
      { label: "Peces de spinning en mar en España", href: "/guia/peces-spinning-mar-espana/" },
      { label: "Cómo elegir señuelo según el agua y el clima", href: "/guia/como-elegir-senuelo-segun-agua-y-clima/" }
    ]
  }
};

const freshwaterSpecies = new Set(["lucio", "lucioperca", "perca", "blackbass", "trucha", "barbo", "siluro"]);
const saltwaterSpecies = new Set(["lubina", "anjova", "palometon", "jurel", "caballa", "dorada"]);

const plannerScenarios = {
  embalse: {
    label: "embalse",
    layer: "media agua y cambios de profundidad",
    retrieve: "cubre agua, localiza estructura y alterna tirones con pausas",
    note: "En embalse suele compensar leer puntas, cortados y entradas de agua antes de cambiar de señuelo."
  },
  rio: {
    label: "río",
    layer: "corrientes principales, remansos y orillas con sombra",
    retrieve: "lanza en diagonal y deja que la corriente dé vida al señuelo",
    note: "En río manda la colocación del lance: ajusta el ángulo antes de acelerar la recogida."
  },
  costa: {
    label: "costa",
    layer: "primeras capas y canales con espuma",
    retrieve: "recogida lineal con cambios de ritmo y pausas cerca de las olas",
    note: "En costa, el viento y la espuma suelen importar tanto como el color del señuelo."
  },
  desembocadura: {
    label: "desembocadura",
    layer: "bordes de corriente y cambios de salinidad",
    retrieve: "trabaja paralelo al flujo y repite en los cortes de corriente",
    note: "Las desembocaduras suelen premiar perfiles naturales y lances repetidos en la misma vena."
  }
};

const plannerSeasons = {
  primavera: {
    label: "Primavera",
    movement: "actividad creciente y peces más dispuestos a seguir señuelos móviles",
    tweak: "empieza cubriendo agua y acelera si ves persecuciones."
  },
  verano: {
    label: "Verano",
    movement: "ventanas cortas al amanecer, anochecer y zonas sombreadas",
    tweak: "prioriza primeras y últimas horas o profundidades con algo de oxígeno."
  },
  otono: {
    label: "Otoño",
    movement: "peces comiendo con más decisión antes del frío duro",
    tweak: "aprovecha tamaños algo mayores y ritmos algo más constantes."
  },
  invierno: {
    label: "Invierno",
    movement: "actividad más lenta y ataques menos impulsivos",
    tweak: "baja ritmo, alarga pausas y insiste más en profundidad."
  }
};

const plannerClarity = {
  clara: {
    label: "Clara",
    color: "colores naturales, destellos discretos y líneas finas",
    tweak: "prioriza una presentación limpia y distancia de lance."
  },
  media: {
    label: "Con algo de color",
    color: "contraste medio, algo de vibración y perfiles visibles",
    tweak: "combina tonos naturales con un pequeño punto de brillo."
  },
  turbia: {
    label: "Turbia",
    color: "colores sólidos, vibración marcada y silueta clara",
    tweak: "elige perfiles que hagan ruido o desplacen agua."
  }
};

const plannerLight = {
  amanecer: {
    label: "primeras o últimas luces",
    presentation: "capas altas y medias con ritmo vivo al empezar",
    tweak: "busca actividad rápida antes de bajar profundidad."
  },
  sol: {
    label: "plena luz",
    presentation: "más control, lectura fina y capas medias o profundas",
    tweak: "alarga lances y pausa más cerca de sombra o estructura."
  },
  nublado: {
    label: "cielo cubierto",
    presentation: "escenario ideal para cubrir agua con confianza",
    tweak: "mantén un ritmo estable y cambia color antes que tamaño."
  },
  noche: {
    label: "noche",
    presentation: "silueta, vibración y recogida más lenta",
    tweak: "simplifica: perfil claro, poca velocidad y referencias fijas."
  }
};

function normalizePlannerState(state) {
  if (!state || typeof state !== "object") return state;
  return {
    ...state,
    clarity: state.clarity === "tomada" ? "media" : state.clarity
  };
}

function getPlannerState() {
  try {
    const raw = localStorage.getItem(PLANNER_STATE_KEY);
    return raw ? normalizePlannerState(JSON.parse(raw)) : null;
  } catch (error) {
    return null;
  }
}

function setPlannerState(state) {
  try {
    localStorage.setItem(PLANNER_STATE_KEY, JSON.stringify(normalizePlannerState(state)));
  } catch (error) {
    console.warn("No se pudo guardar el estado del planificador", error);
  }
}

function clearPlannerState() {
  try {
    localStorage.removeItem(PLANNER_STATE_KEY);
  } catch (error) {
    console.warn("No se pudo borrar el estado del planificador", error);
  }
}

function plannerMismatchMessage(species, scenario) {
  if (saltwaterSpecies.has(species) && (scenario === "embalse" || scenario === "rio")) {
    return "Ese escenario es menos habitual para esta especie marina en spinning; suele encajar mejor costa o desembocadura.";
  }
  if (freshwaterSpecies.has(species) && (scenario === "costa" || scenario === "desembocadura")) {
    return "Ese escenario es menos habitual para esta especie en spinning; usa la recomendación como base y ajústala a agua dulce si aplica.";
  }
  return "";
}

function plannerActivityScore(state, mismatch) {
  const seasonScore = { primavera: 12, verano: 5, otono: 14, invierno: 4 };
  const lightScore = { amanecer: 14, sol: 6, nublado: 10, noche: 9 };
  const clarityScore = { clara: 8, media: 6, turbia: 5 };
  const scenarioScore = { embalse: 6, rio: 7, costa: 8, desembocadura: 9 };
  let score = 52;
  score += seasonScore[state.season] || 0;
  score += lightScore[state.light] || 0;
  score += clarityScore[state.clarity] || 0;
  score += scenarioScore[state.scenario] || 0;
  if (mismatch) score -= 14;
  return Math.max(42, Math.min(96, score));
}

function plannerActivityTone(score) {
  if (score >= 84) return "Alta";
  if (score >= 72) return "Buena";
  if (score >= 60) return "Media";
  return "Selectiva";
}

function plannerWindowLabel(season, light) {
  if (light === "amanecer") return "Primeras luces y último repunte del día.";
  if (light === "noche") return "Ventana corta, más de silueta y vibración.";
  if (season === "verano" && light === "sol") return "Hora dura: busca profundidad, sombra y agua viva.";
  if (season === "invierno") return "Ventana más fina: pausa, repetición y precisión.";
  if (season === "otono") return "Buen momento para cubrir agua con confianza.";
  return "Ventana razonable si hay comida y estructura.";
}

function plannerTempoLabel(season, light) {
  if (season === "invierno") return "Lento y con pausas largas";
  if (season === "verano" && light === "sol") return "Controlado y más profundo";
  if (light === "amanecer" || light === "nublado") return "Dinámico al principio";
  return "Constante con cambios de ritmo";
}

function buildPlannerResult(state) {
  const normalizedState = normalizePlannerState(state);
  const { species, scenario, season, clarity, light } = normalizedState;
  if (!species || !scenario || !season || !clarity || !light) {
    return `
      <div class="planner-result-card planner-result-error">
      <p class="planner-result-kicker">Faltan datos</p>
      <h3>Completa los cinco campos para generar una recomendación</h3>
      <p>La idea es cruzar especie, escenario, estación, estado del agua y momento del día para darte una primera orientación útil.</p>
      </div>
    `;
  }

  const speciesProfile = plannerProfiles[species];
  const scenarioProfile = plannerScenarios[scenario];
  const seasonProfile = plannerSeasons[season];
  const clarityProfile = plannerClarity[clarity];
  const lightProfile = plannerLight[light];
  if (!speciesProfile || !scenarioProfile || !seasonProfile || !clarityProfile || !lightProfile) {
    return `
      <div class="planner-result-card planner-result-error">
      <p class="planner-result-kicker">Datos no válidos</p>
      <h3>Reinicia el planificador y vuelve a seleccionar especie y condiciones</h3>
      <p>Hemos detectado una combinación incompleta o antigua guardada en tu navegador.</p>
      </div>
    `;
  }
  const mismatch = plannerMismatchMessage(species, scenario);
  const activityScore = plannerActivityScore(normalizedState, mismatch);
  const activityTone = plannerActivityTone(activityScore);
  const activityWindow = plannerWindowLabel(season, light);
  const cadence = plannerTempoLabel(season, light);
  const checklist = [
    `Empieza por ${scenarioProfile.layer} antes de tocar otros metros de agua.`,
    `Usa ${clarityProfile.color} y cambia tamaño antes que familia de señuelo.`,
    `Mantén una recuperación ${cadence.toLowerCase()} mientras confirmas actividad.`
  ];
  const links = [
    `<a href="${speciesProfile.guides[0].href}" class="planner-link planner-link-primary">${speciesProfile.guides[0].label}</a>`,
    `<a href="${speciesProfile.guides[1].href}" class="planner-link">${speciesProfile.guides[1].label}</a>`,
    `<a href="${speciesProfile.category.href}" class="planner-link">${speciesProfile.category.label}</a>`
  ].join("");

  return `
    <article class="planner-result-card">
      <p class="planner-result-kicker">Propuesta inicial para ${speciesProfile.label}</p>
      <h3>${speciesProfile.label} en ${scenarioProfile.label}: empieza con ${speciesProfile.lure}</h3>
      <div class="planner-signal-grid">
        <div class="planner-signal-card">
          <span>Actividad probable</span>
          <strong>${activityScore}/100</strong>
          <small>${activityTone}</small>
        </div>
        <div class="planner-signal-card">
          <span>Mejor tramo del día</span>
          <strong>${lightProfile.label}</strong>
          <small>${activityWindow}</small>
        </div>
        <div class="planner-signal-card">
          <span>Ritmo recomendado</span>
          <strong>${cadence}</strong>
          <small>${seasonProfile.tweak}</small>
        </div>
      </div>
      <div class="planner-pill-row">
        <span class="planner-pill">${seasonProfile.label}</span>
        <span class="planner-pill">${clarityProfile.label}</span>
        <span class="planner-pill">${lightProfile.label}</span>
      </div>
      <ul class="planner-advice">
        <li><strong>Señuelo base:</strong> ${speciesProfile.lure}</li>
        <li><strong>Capa a explorar primero:</strong> ${scenarioProfile.layer} con ${lightProfile.presentation}</li>
        <li><strong>Color y presencia:</strong> ${clarityProfile.color}</li>
        <li><strong>Recogida:</strong> ${scenarioProfile.retrieve}</li>
        <li><strong>Lectura de la jornada:</strong> ${seasonProfile.movement}; ${seasonProfile.tweak}</li>
        <li><strong>Montaje orientativo:</strong> ${speciesProfile.setup}</li>
      </ul>
      <div class="planner-checklist">
        <p class="planner-checklist-title">Por dónde empezar</p>
        <ul class="mini-checklist">
          ${checklist.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
      <p class="planner-result-note">${scenarioProfile.note} ${clarityProfile.tweak} ${lightProfile.tweak}</p>
      ${mismatch ? `<p class="planner-result-warning">${mismatch}</p>` : ""}
      <div class="planner-links">${links}</div>
    </article>
  `;
}

function hydratePlanner(root) {
  const inputs = [...root.querySelectorAll("[data-planner-input]")];
  const result = root.querySelector("[data-planner-result]");
  const submit = root.querySelector("[data-planner-submit]");
  const reset = root.querySelector("[data-planner-reset]");
  if (!inputs.length || !result || !submit || !reset) return;

  const emptyMarkup = result.innerHTML;

  function readState() {
    return inputs.reduce((acc, input) => {
      acc[input.dataset.plannerInput] = input.value;
      return acc;
    }, {});
  }

  function writeState(state) {
    inputs.forEach((input) => {
      input.value = state?.[input.dataset.plannerInput] || "";
    });
  }

  function renderFromState(state) {
    result.innerHTML = buildPlannerResult(state);
  }

  submit.addEventListener("click", () => {
    const state = readState();
    setPlannerState(state);
    renderFromState(state);
  });

  reset.addEventListener("click", () => {
    writeState(null);
    clearPlannerState();
    result.innerHTML = emptyMarkup;
  });

  const savedState = getPlannerState();
  if (savedState) {
    writeState(savedState);
    if (Object.values(savedState).some(Boolean)) {
      renderFromState(savedState);
    }
  }
}

document.querySelectorAll("[data-planner-root]").forEach(hydratePlanner);

// ─── Minijuego de espera ──────────────────────────
const WAIT_GAME_KEY = "ajspinning_wait_game_v1";
const waitGameFish = [
  "Lubina curiosa",
  "Lucio desconfiado",
  "Perca rápida",
  "Trucha eléctrica",
  "Ataque sorpresa"
];
const waitGameWaitingLines = [
  "La línea cae limpia. Espera el momento.",
  "Nada ocurre... y justo por eso tienes que estar atento.",
  "Mantén la calma. La picada casi nunca avisa dos veces.",
  "Observa, respira y no te adelantes."
];

function getWaitGameStats() {
  try {
    const saved = localStorage.getItem(WAIT_GAME_KEY);
    return saved
      ? JSON.parse(saved)
      : { casts: 0, catches: 0, streak: 0, bestReaction: null };
  } catch (error) {
    return { casts: 0, catches: 0, streak: 0, bestReaction: null };
  }
}

function saveWaitGameStats(stats) {
  try {
    localStorage.setItem(WAIT_GAME_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn("No se pudieron guardar las estadisticas del minijuego", error);
  }
}

function hydrateWaitGame(root) {
  const castButton = root.querySelector("[data-fish-game-cast]");
  const hookButton = root.querySelector("[data-fish-game-hook]");
  const status = root.querySelector("[data-fish-game-status]");
  const progress = root.querySelector("[data-fish-game-progress]");
  const float = root.querySelector("[data-fish-game-float]");
  const ripple = root.querySelector("[data-fish-game-ripple]");
  const castsNode = root.querySelector("[data-fish-game-casts]");
  const catchesNode = root.querySelector("[data-fish-game-catches]");
  const streakNode = root.querySelector("[data-fish-game-streak]");
  const bestNode = root.querySelector("[data-fish-game-best]");
  if (!castButton || !hookButton || !status || !progress) return;

  const state = {
    phase: "idle",
    biteTimer: null,
    missTimer: null,
    progressTimer: null,
    biteAt: 0
  };

  function renderStats() {
    const stats = getWaitGameStats();
    if (castsNode) castsNode.textContent = String(stats.casts || 0);
    if (catchesNode) catchesNode.textContent = String(stats.catches || 0);
    if (streakNode) streakNode.textContent = String(stats.streak || 0);
    if (bestNode) {
      bestNode.textContent = stats.bestReaction ? `${stats.bestReaction} ms` : "--";
    }
  }

  function clearTimers() {
    clearTimeout(state.biteTimer);
    clearTimeout(state.missTimer);
    clearInterval(state.progressTimer);
    state.biteTimer = null;
    state.missTimer = null;
    state.progressTimer = null;
  }

  function setRootState(nextPhase) {
    root.classList.remove("is-waiting", "is-biting", "is-caught", "is-missed");
    if (nextPhase && nextPhase !== "idle") {
      root.classList.add(`is-${nextPhase}`);
    }
  }

  function resetRound(message) {
    clearTimers();
    state.phase = "idle";
    progress.style.width = "0%";
    castButton.disabled = false;
    hookButton.disabled = true;
    setRootState("idle");
    if (message) status.textContent = message;
    if (float) float.style.removeProperty("transform");
    if (ripple) ripple.classList.remove("is-visible");
  }

  function animateBiteWindow(duration) {
    const startedAt = performance.now();
    progress.style.width = "100%";
    state.progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      progress.style.width = `${remaining}%`;
      if (remaining <= 0) {
        clearInterval(state.progressTimer);
        state.progressTimer = null;
      }
    }, 30);
  }

  function updateMiss(message) {
    const stats = getWaitGameStats();
    stats.streak = 0;
    saveWaitGameStats(stats);
    renderStats();
    state.phase = "missed";
    setRootState("missed");
    status.textContent = message;
    castButton.disabled = true;
    hookButton.disabled = true;
    state.missTimer = window.setTimeout(() => {
      resetRound("Respira, vuelve a empezar y espera mejor la siguiente picada.");
    }, 1400);
  }

  function updateCatch(reaction) {
    const stats = getWaitGameStats();
    const fish = waitGameFish[Math.floor(Math.random() * waitGameFish.length)];
    const grade = reaction <= 220
      ? "Recogida perfecta"
      : reaction <= 360
        ? "Muy buen reflejo"
        : "Llegaste justo a tiempo";
    stats.catches += 1;
    stats.streak += 1;
    stats.bestReaction = stats.bestReaction === null
      ? reaction
      : Math.min(stats.bestReaction, reaction);
    saveWaitGameStats(stats);
    renderStats();
    state.phase = "caught";
    setRootState("caught");
    status.textContent = `${grade}: ${fish}. Reacción ${reaction} ms.`;
    castButton.disabled = true;
    hookButton.disabled = true;
    state.missTimer = window.setTimeout(() => {
      resetRound("Buena recogida. Empieza otra espera cuando quieras.");
    }, 1600);
  }

  castButton.addEventListener("click", () => {
    clearTimers();
    const stats = getWaitGameStats();
    stats.casts += 1;
    saveWaitGameStats(stats);
    renderStats();
    state.phase = "waiting";
    setRootState("waiting");
    castButton.disabled = true;
    hookButton.disabled = false;
    progress.style.width = "0%";
    status.textContent = waitGameWaitingLines[Math.floor(Math.random() * waitGameWaitingLines.length)];
    if (ripple) ripple.classList.remove("is-visible");
    state.biteTimer = window.setTimeout(() => {
      state.phase = "biting";
      state.biteAt = performance.now();
      setRootState("biting");
      status.textContent = "Hay toque. Recoge antes de que se vaya.";
      if (ripple) ripple.classList.add("is-visible");
      animateBiteWindow(950);
      state.missTimer = window.setTimeout(() => {
        updateMiss("Llegaste tarde. El pez soltó el señuelo.");
      }, 950);
    }, 1500 + Math.random() * 3200);
  });

  hookButton.addEventListener("click", () => {
    if (state.phase === "idle") {
      status.textContent = "Primero empieza la espera. Luego recoge al toque.";
      return;
    }
    if (state.phase === "waiting") {
      updateMiss("Te adelantaste y espantaste la picada.");
      return;
    }
    if (state.phase !== "biting") return;

    const reaction = Math.max(90, Math.round(performance.now() - state.biteAt));
    clearTimers();
    progress.style.width = "0%";
    if (ripple) ripple.classList.remove("is-visible");
    updateCatch(reaction);
  });

  renderStats();
  resetRound("Haz un lance y mantén la calma hasta que pique.");
}

document.querySelectorAll("[data-fish-game-root]").forEach(hydrateWaitGame);

// ─── Minijuego: aventura pixel de pesca ────────────
const PIXEL_FISH_GAME_KEY = "ajspinning_pixel_fishing_v2";

function getPixelFishStats() {
  try {
    const saved = localStorage.getItem(PIXEL_FISH_GAME_KEY);
    const parsed = saved
      ? JSON.parse(saved)
      : { steps: 0, casts: 0, catches: 0, streak: 0, bestStreak: 0, fishLog: [], speciesSeen: {} };
    if (!Array.isArray(parsed.fishLog)) parsed.fishLog = [];
    if (!parsed.speciesSeen || typeof parsed.speciesSeen !== "object") parsed.speciesSeen = {};
    return parsed;
  } catch (error) {
    return { steps: 0, casts: 0, catches: 0, streak: 0, bestStreak: 0, fishLog: [], speciesSeen: {} };
  }
}

function savePixelFishStats(stats) {
  try {
    localStorage.setItem(PIXEL_FISH_GAME_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn("No se pudieron guardar las estadisticas del minijuego pixel", error);
  }
}

function hydratePixelFishingGame(root) {
  const canvas = root.querySelector("[data-pixel-fishing-canvas]");
  const statusNode = root.querySelector("[data-pixel-fishing-status]");
  const castButton = root.querySelector("[data-pixel-fishing-cast]");
  const hookButton = root.querySelector("[data-pixel-fishing-hook]");
  const moveButtons = [...root.querySelectorAll("[data-pixel-move]")];
  const stepsNode = root.querySelector("[data-pixel-fishing-steps]");
  const castsNode = root.querySelector("[data-pixel-fishing-casts]");
  const catchesNode = root.querySelector("[data-pixel-fishing-catches]");
  const bestNode = root.querySelector("[data-pixel-fishing-best]");
  if (!canvas || !statusNode || !castButton || !hookButton) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const world = {
    cols: 20,
    rows: 12,
    tile: 16,
    shoreRow: 6,
    waterRow: 7
  };

  const keyToDir = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    KeyW: "up",
    KeyS: "down",
    KeyA: "left",
    KeyD: "right"
  };

  const state = {
    player: { x: 9, y: 5, dir: "down" },
    pressedDirs: [],
    moveTicker: null,
    casting: false,
    biteReady: false,
    bobber: null,
    biteAt: 0,
    biteTimer: null,
    missTimer: null,
    frameId: null
  };

  function renderStats() {
    const stats = getPixelFishStats();
    if (stepsNode) stepsNode.textContent = String(stats.steps || 0);
    if (castsNode) castsNode.textContent = String(stats.casts || 0);
    if (catchesNode) catchesNode.textContent = String(stats.catches || 0);
    if (bestNode) bestNode.textContent = String(stats.bestStreak || 0);
  }

  function atCastSpot() {
    return state.player.y === world.shoreRow && state.player.dir === "down";
  }

  function syncButtons() {
    castButton.disabled = state.casting || !atCastSpot();
    hookButton.disabled = !state.casting;
  }

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function clearCastTimers() {
    if (state.biteTimer) {
      clearTimeout(state.biteTimer);
      state.biteTimer = null;
    }
    if (state.missTimer) {
      clearTimeout(state.missTimer);
      state.missTimer = null;
    }
  }

  function getPlayerCenter() {
    return {
      x: state.player.x * world.tile + world.tile / 2,
      y: state.player.y * world.tile + world.tile / 2
    };
  }

  function startCast() {
    if (state.casting) return;
    if (!atCastSpot()) {
      if (state.player.y < world.shoreRow) {
        setStatus("Acércate a la orilla para poder lanzar.");
      } else {
        setStatus("Mira hacia el agua (abajo) para lanzar.");
      }
      return;
    }

    const stats = getPixelFishStats();
    stats.casts += 1;
    savePixelFishStats(stats);
    renderStats();

    state.casting = true;
    state.biteReady = false;
    state.bobber = {
      x: Math.min(world.cols - 2, Math.max(1, state.player.x + (Math.random() > 0.5 ? 1 : 0))),
      y: world.waterRow + 1 + Math.floor(Math.random() * 3)
    };
    clearCastTimers();
    setStatus("Lance al agua. Espera la picada y recoge con timing.");
    syncButtons();

    state.biteTimer = window.setTimeout(() => {
      state.biteReady = true;
      state.biteAt = performance.now();
      setStatus("¡Picada! Pulsa recoger ahora.");
      state.missTimer = window.setTimeout(() => {
        finishCast(false, "Llegaste tarde. El pez soltó el señuelo.");
      }, 950);
    }, 900 + Math.random() * 1800);
  }

  function finishCast(caught, message) {
    clearCastTimers();

    const stats = getPixelFishStats();
    if (caught) {
      stats.catches += 1;
      stats.streak += 1;
      stats.bestStreak = Math.max(stats.bestStreak || 0, stats.streak);
    } else {
      stats.streak = 0;
    }
    savePixelFishStats(stats);
    renderStats();

    state.casting = false;
    state.biteReady = false;
    setStatus(message);
    syncButtons();

    window.setTimeout(() => {
      state.bobber = null;
    }, 320);
  }

  function hookCast() {
    if (!state.casting) {
      setStatus("Primero lanza la caña.");
      return;
    }
    if (!state.biteReady) {
      finishCast(false, "Te adelantaste. Espera la picada para recoger.");
      return;
    }

    const reaction = Math.max(90, Math.round(performance.now() - state.biteAt));
    const quality = reaction <= 240
      ? "Clavada perfecta"
      : reaction <= 430
        ? "Buena clavada"
        : "Captura al límite";
    finishCast(true, `${quality}. Reacción ${reaction} ms.`);
  }

  function tryMove(dir) {
    if (state.casting) return;

    const delta = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0]
    }[dir];
    if (!delta) return;

    state.player.dir = dir;
    const nextX = Math.max(0, Math.min(world.cols - 1, state.player.x + delta[0]));
    const nextY = Math.max(0, Math.min(world.shoreRow, state.player.y + delta[1]));
    const moved = nextX !== state.player.x || nextY !== state.player.y;
    state.player.x = nextX;
    state.player.y = nextY;

    if (moved) {
      const stats = getPixelFishStats();
      stats.steps += 1;
      savePixelFishStats(stats);
      renderStats();
    }

    if (atCastSpot()) {
      setStatus("Buena posición. Ya puedes lanzar.");
    } else {
      setStatus("Camina por la orilla y mira al agua para lanzar.");
    }

    syncButtons();
  }

  function stepMovement() {
    const dir = state.pressedDirs[state.pressedDirs.length - 1];
    if (!dir) return;
    tryMove(dir);
  }

  function startMove(dir) {
    if (!state.pressedDirs.includes(dir)) {
      state.pressedDirs.push(dir);
    }
    if (!state.moveTicker) {
      stepMovement();
      state.moveTicker = window.setInterval(stepMovement, 115);
    }
  }

  function stopMove(dir) {
    state.pressedDirs = state.pressedDirs.filter((value) => value !== dir);
    if (!state.pressedDirs.length && state.moveTicker) {
      clearInterval(state.moveTicker);
      state.moveTicker = null;
    }
  }

  moveButtons.forEach((button) => {
    const dir = button.dataset.pixelMove;
    if (!dir) return;

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      startMove(dir);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
      button.addEventListener(type, () => stopMove(dir));
    });
  });

  function onKeyDown(event) {
    const dir = keyToDir[event.code];
    if (dir) {
      event.preventDefault();
      startMove(dir);
      return;
    }

    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      if (state.casting) hookCast();
      else startCast();
    }
  }

  function onKeyUp(event) {
    const dir = keyToDir[event.code];
    if (!dir) return;
    event.preventDefault();
    stopMove(dir);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  castButton.addEventListener("click", startCast);
  hookButton.addEventListener("click", hookCast);

  function drawTile(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * world.tile, y * world.tile, world.tile, world.tile);
  }

  function drawWorld(ts) {
    const waveOffset = Math.floor(ts / 180) % 2;
    for (let y = 0; y < world.rows; y += 1) {
      for (let x = 0; x < world.cols; x += 1) {
        if (y <= world.shoreRow - 2) {
          drawTile(x, y, (x + y) % 2 ? "#6cab4f" : "#5b9a43");
        } else if (y === world.shoreRow - 1) {
          drawTile(x, y, (x + y) % 2 ? "#90bb5e" : "#7ead4f");
        } else if (y === world.shoreRow) {
          drawTile(x, y, (x + y) % 2 ? "#cfb377" : "#c4a56a");
        } else {
          const wave = (x + waveOffset) % 2;
          drawTile(x, y, wave ? "#5a95c0" : "#4a84b1");
        }
      }
    }

    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fillRect(0, world.waterRow * world.tile, canvas.width, 2);
  }

  function drawPlayer() {
    const px = state.player.x * world.tile;
    const py = state.player.y * world.tile;
    const facing = state.player.dir;

    ctx.fillStyle = "#1f3550";
    ctx.fillRect(px + 4, py + 2, 8, 3);
    ctx.fillStyle = "#f4cc9f";
    ctx.fillRect(px + 5, py + 5, 6, 4);
    ctx.fillStyle = "#3a74a5";
    ctx.fillRect(px + 4, py + 9, 8, 5);
    ctx.fillStyle = "#2a4f6c";
    ctx.fillRect(px + 4, py + 14, 3, 2);
    ctx.fillRect(px + 9, py + 14, 3, 2);

    ctx.fillStyle = "#ffffff";
    if (facing === "left") {
      ctx.fillRect(px + 5, py + 6, 1, 1);
    } else if (facing === "right") {
      ctx.fillRect(px + 10, py + 6, 1, 1);
    } else if (facing === "up") {
      ctx.fillRect(px + 7, py + 6, 2, 1);
    } else {
      ctx.fillRect(px + 7, py + 7, 2, 1);
    }
  }

  function drawCast(ts) {
    if (!state.bobber) return;
    const playerCenter = getPlayerCenter();
    const bobX = state.bobber.x * world.tile + world.tile / 2;
    const bobY = state.bobber.y * world.tile + world.tile / 2;

    ctx.strokeStyle = "rgba(245,245,240,.85)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(playerCenter.x, playerCenter.y - 2);
    ctx.lineTo(bobX, bobY - 2);
    ctx.stroke();

    const pulse = Math.floor(ts / 140) % 2;
    ctx.fillStyle = pulse ? "#f2b24f" : "#f6c470";
    ctx.fillRect(bobX - 3, bobY - 4, 6, 4);
    ctx.fillStyle = "#fffaf2";
    ctx.fillRect(bobX - 3, bobY, 6, 4);
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(bobX - 5, bobY + 4, 10, 1);

    if (state.biteReady) {
      ctx.fillStyle = "#f75454";
      ctx.fillRect(bobX - 1, bobY - 12, 2, 6);
      ctx.fillRect(bobX - 1, bobY - 13, 2, 1);
    }
  }

  function frame(ts) {
    drawWorld(ts);
    drawCast(ts);
    drawPlayer();
    state.frameId = window.requestAnimationFrame(frame);
  }

  renderStats();
  syncButtons();
  setStatus("Camina hasta la orilla, mira al agua y lanza.");
  state.frameId = window.requestAnimationFrame(frame);
}

const pixelFishPoolAdvanced = [
  { name: "Perca", rarity: "común", difficulty: 0.82, weight: 24 },
  { name: "Trucha común", rarity: "común", difficulty: 0.9, weight: 19 },
  { name: "Black bass", rarity: "común", difficulty: 0.95, weight: 19 },
  { name: "Sargo", rarity: "común", difficulty: 0.98, weight: 16 },
  { name: "Jurel", rarity: "común", difficulty: 0.92, weight: 14 },
  { name: "Lucioperca", rarity: "rara", difficulty: 1.15, weight: 13 },
  { name: "Lubina costera", rarity: "rara", difficulty: 1.26, weight: 12 },
  { name: "Orada", rarity: "rara", difficulty: 1.24, weight: 11 },
  { name: "Anjova", rarity: "rara", difficulty: 1.33, weight: 9 },
  { name: "Palometón", rarity: "épica", difficulty: 1.42, weight: 7 },
  { name: "Lucio grande", rarity: "épica", difficulty: 1.52, weight: 6 },
  { name: "Siluro desconfiado", rarity: "épica", difficulty: 1.68, weight: 4 }
];

const pixelWeatherAdvanced = [
  { name: "Despejado", bite: 1, rare: 1, water: ["#5b95c2", "#4d84b1"] },
  { name: "Nublado", bite: 1.1, rare: 1.08, water: ["#4d86b0", "#3f729a"] },
  { name: "Viento", bite: 0.94, rare: 1.04, water: ["#4f8ebb", "#3e75a2"] },
  { name: "Llovizna", bite: 1.2, rare: 1.15, water: ["#4d7ea7", "#3d6388"] }
];

function hydratePixelFishingGameAdvancedV2(root) {
  const canvas = root.querySelector("[data-pixel-fishing-canvas]");
  const statusNode = root.querySelector("[data-pixel-fishing-status]");
  const castButton = root.querySelector("[data-pixel-fishing-cast]");
  const hookButton = root.querySelector("[data-pixel-fishing-hook]");
  const moveButtons = [...root.querySelectorAll("[data-pixel-move]")];
  const stepsNode = root.querySelector("[data-pixel-fishing-steps]");
  const castsNode = root.querySelector("[data-pixel-fishing-casts]");
  const catchesNode = root.querySelector("[data-pixel-fishing-catches]");
  const bestNode = root.querySelector("[data-pixel-fishing-best]");
  const powerMeter = root.querySelector("[data-pixel-fishing-power]");
  const fightMeter = root.querySelector("[data-pixel-fishing-fight]");
  const lastCatchNode = root.querySelector("[data-pixel-fishing-last]");
  const logNode = root.querySelector("[data-pixel-fishing-log]");
  const fightPanel = root.querySelector("[data-pixel-fight-panel]");
  const fightCatchBar = root.querySelector("[data-pixel-fight-catchbar]");
  const fightFish = root.querySelector("[data-pixel-fight-fish]");
  const fightProgress = root.querySelector("[data-pixel-fight-progress]");
  const catchReveal = root.querySelector("[data-pixel-catch-reveal]");
  const catchSprite = root.querySelector("[data-pixel-catch-sprite]");
  const catchName = root.querySelector("[data-pixel-catch-name]");
  const catchStars = root.querySelector("[data-pixel-catch-stars]");
  const catchMeta = root.querySelector("[data-pixel-catch-meta]");
  const catchClose = root.querySelector("[data-pixel-catch-close]");
  const touchCastButton = root.querySelector("[data-pixel-touch-cast]");
  const touchHookButton = root.querySelector("[data-pixel-touch-hook]");
  const joystick = root.querySelector("[data-pixel-joystick]");
  const joystickKnob = root.querySelector("[data-pixel-joystick-knob]");
  if (!canvas || !statusNode || !castButton || !hookButton) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const world = {
    cols: 40,
    rows: 22,
    tile: 16,
    landLimitY: 9,
    waterStartY: 10,
    dockRects: [
      { x: 17, y: 5, w: 4, h: 13 },
      { x: 20, y: 10, w: 10, h: 3 }
    ],
    rocks: [
      { x: 13.5, y: 12.8, r: 1.4 },
      { x: 8.4, y: 15.4, r: 1.1 },
      { x: 30.8, y: 14.8, r: 1.2 }
    ],
    hotspots: [
      { x: 12, y: 14, r: 3.4 },
      { x: 21, y: 16, r: 3.7 },
      { x: 28, y: 14, r: 3.1 },
      { x: 34, y: 16, r: 2.9 }
    ]
  };

  const viewCols = canvas.width / world.tile;
  const viewRows = canvas.height / world.tile;
  const keyToDir = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    KeyW: "up",
    KeyS: "down",
    KeyA: "left",
    KeyD: "right"
  };
  const dirDelta = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };
  const assistMode = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  const stats = getPixelFishStats();
  stats.steps = Number(stats.steps) || 0;
  stats.casts = Number(stats.casts) || 0;
  stats.catches = Number(stats.catches) || 0;
  stats.streak = Number(stats.streak) || 0;
  stats.bestStreak = Number(stats.bestStreak) || 0;
  if (!Array.isArray(stats.fishLog)) stats.fishLog = [];
  if (!stats.speciesSeen || typeof stats.speciesSeen !== "object") stats.speciesSeen = {};

  const state = {
    phase: "explore",
    player: { x: 19, y: 9, dir: "left", stepAnim: 0 },
    camera: { x: 0, y: 0 },
    pressedDirs: [],
    chargeActive: false,
    chargeValue: 0.2,
    chargeDir: 1,
    reelHeld: false,
    stepAccumulator: 0,
    bobber: null,
    castPower: 0,
    currentFish: null,
    biteTimer: null,
    phaseTimer: null,
    biteAt: 0,
    fight: null,
    tapTarget: null,
    assistMode,
    dayClock: Math.random(),
    weatherIndex: Math.floor(Math.random() * pixelWeatherAdvanced.length),
    weatherTimer: 0,
    catchRevealTimer: null,
    splashBursts: [],
    joystick: {
      active: false,
      pointerId: null,
      x: 0,
      y: 0,
      strength: 0
    },
    lastTs: 0,
    frameId: null
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function setMeter(node, value, color) {
    if (!node) return;
    node.style.width = `${clamp(value, 0, 100)}%`;
    if (color) node.style.background = color;
  }

  function setFightPanelVisible(visible) {
    if (!fightPanel) return;
    if (visible) {
      fightPanel.hidden = false;
      fightPanel.classList.add("is-visible");
      return;
    }
    fightPanel.classList.remove("is-visible");
    fightPanel.hidden = true;
  }

  function renderFightHud() {
    if (!fightCatchBar || !fightFish || !fightProgress) return;
    if (!state.fight) {
      fightCatchBar.style.bottom = "0%";
      fightCatchBar.style.height = "0%";
      fightFish.style.bottom = "0%";
      fightProgress.style.width = "0%";
      return;
    }
    const half = state.fight.barHeight / 2;
    const barBottom = clamp(state.fight.barCenter - half, 0, 100);
    const fishBottom = clamp(state.fight.fishY, 0, 100);
    fightCatchBar.style.bottom = `${barBottom}%`;
    fightCatchBar.style.height = `${clamp(state.fight.barHeight, 8, 60)}%`;
    fightFish.style.bottom = `${fishBottom}%`;
    fightProgress.style.width = `${clamp(state.fight.progress, 0, 100)}%`;
  }

  function clearCatchRevealTimer() {
    if (state.catchRevealTimer) {
      clearTimeout(state.catchRevealTimer);
      state.catchRevealTimer = null;
    }
  }

  function hideCatchReveal() {
    clearCatchRevealTimer();
    if (!catchReveal) return;
    catchReveal.classList.remove("is-visible");
    catchReveal.hidden = true;
  }

  function drawCaughtFishSprite(fish) {
    if (!catchSprite) return;
    const spriteCtx = catchSprite.getContext("2d");
    if (!spriteCtx) return;
    spriteCtx.clearRect(0, 0, catchSprite.width, catchSprite.height);
    spriteCtx.imageSmoothingEnabled = false;

    const rarityPalette = {
      "común": { body: "#58b0df", shade: "#2d7ba7", fin: "#9de0ff" },
      "rara": { body: "#58cf9b", shade: "#2a8e6a", fin: "#b9f4d9" },
      "épica": { body: "#f3bf57", shade: "#b67624", fin: "#ffe6a1" }
    };
    const palette = rarityPalette[fish?.rarity] || rarityPalette["común"];
    const species = String(fish?.name || "").toLowerCase();

    const scale = 3;
    const ox = 18;
    const oy = 12;
    const px = (x, y, w, h, color) => {
      spriteCtx.fillStyle = color;
      spriteCtx.fillRect(ox + x * scale, oy + y * scale, w * scale, h * scale);
    };

    let length = 12;
    let height = 5;
    if (species.includes("lucio")) {
      length = 14;
      height = 4;
    } else if (species.includes("siluro")) {
      length = 15;
      height = 6;
    } else if (species.includes("trucha")) {
      length = 11;
      height = 4;
    } else if (species.includes("orada") || species.includes("sargo")) {
      length = 10;
      height = 6;
    } else if (species.includes("bass") || species.includes("lubina")) {
      length = 11;
      height = 6;
    }

    px(0, 2, 2, 1, palette.fin);
    px(2, 1, length - 4, height, palette.body);
    px(3, 2, length - 6, height - 2, palette.shade);
    px(length - 2, 2, 2, 1, palette.fin);
    px(length, 1, 2, 2, palette.body);
    px(length + 1, 0, 1, 4, palette.shade);
    px(length - 4, 0, 2, 1, palette.fin);
    px(length - 7, 0, 2, 1, palette.fin);
    px(length - 1, 2, 1, 1, "#1f2a35");

    if (species.includes("siluro")) {
      px(1, height + 1, 4, 1, palette.fin);
      px(0, height + 2, 3, 1, palette.fin);
    } else if (species.includes("trucha")) {
      px(5, 0, 1, 1, "#f4cf86");
      px(7, 1, 1, 1, "#f4cf86");
      px(9, 2, 1, 1, "#f4cf86");
    } else if (species.includes("orada")) {
      px(5, 0, 1, height, "#f4cf86");
      px(7, 1, 1, 1, "#fef6dc");
    }

    spriteCtx.fillStyle = "rgba(255,255,255,.18)";
    spriteCtx.fillRect(0, catchSprite.height - 8, catchSprite.width, 2);
  }

  function showCatchReveal(fish, reactionMs) {
    if (!catchReveal || !catchName || !catchMeta) return;
    drawCaughtFishSprite(fish);
    catchName.textContent = fish ? fish.name : "Captura";
    const r = fish?.rarity || "común";
    const starsByRarity = {
      "común": "★☆☆",
      "rara": "★★☆",
      "épica": "★★★"
    };
    const ms = Math.max(80, Math.round(reactionMs || 0));
    if (catchStars) catchStars.textContent = starsByRarity[r] || "★☆☆";
    catchMeta.textContent = `${r.toUpperCase()} · ${ms} ms`;
    catchReveal.hidden = false;
    catchReveal.classList.add("is-visible");
    clearCatchRevealTimer();
    state.catchRevealTimer = window.setTimeout(() => {
      hideCatchReveal();
    }, 3300);
  }

  function renderStats() {
    if (stepsNode) stepsNode.textContent = String(stats.steps || 0);
    if (castsNode) castsNode.textContent = String(stats.casts || 0);
    if (catchesNode) catchesNode.textContent = String(stats.catches || 0);
    if (bestNode) bestNode.textContent = String(stats.bestStreak || 0);
  }

  function persistStats() {
    savePixelFishStats(stats);
    renderStats();
    updateCollectionLog();
  }

  function updateLastCatch(message) {
    if (lastCatchNode) lastCatchNode.textContent = message;
  }

  function updateCollectionLog() {
    if (!logNode) return;
    const entries = Object.entries(stats.speciesSeen || {})
      .filter(([, count]) => Number(count) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 4)
      .map(([name, count]) => `${name} ×${count}`);
    logNode.textContent = entries.length
      ? `Colección: ${entries.join(" · ")}`
      : "Colección: todavía vacía.";
  }

  function pushSplashBurst(worldX, worldY, amount, color) {
    const count = Math.max(4, amount || 7);
    const tint = color || "rgba(222, 247, 255, .8)";
    for (let i = 0; i < count; i += 1) {
      state.splashBursts.push({
        x: worldX + (Math.random() * 2 - 1) * 0.26,
        y: worldY + (Math.random() * 2 - 1) * 0.2,
        vx: (Math.random() * 2 - 1) * 0.007,
        vy: -0.01 - Math.random() * 0.015,
        life: 260 + Math.random() * 260,
        maxLife: 520,
        size: 1 + Math.random() * 2,
        color: tint
      });
    }
    if (state.splashBursts.length > 120) {
      state.splashBursts.splice(0, state.splashBursts.length - 120);
    }
  }

  function clearFishingTimers() {
    if (state.biteTimer) {
      clearTimeout(state.biteTimer);
      state.biteTimer = null;
    }
    if (state.phaseTimer) {
      clearTimeout(state.phaseTimer);
      state.phaseTimer = null;
    }
  }

  function isDockCell(ix, iy) {
    return world.dockRects.some((rect) =>
      ix >= rect.x &&
      ix < rect.x + rect.w &&
      iy >= rect.y &&
      iy < rect.y + rect.h
    );
  }

  function isWaterCell(ix, iy) {
    if (ix < 0 || ix >= world.cols || iy < 0 || iy >= world.rows) return false;
    return iy >= world.waterStartY && !isDockCell(ix, iy);
  }

  function isWalkable(ix, iy) {
    if (ix < 0 || ix >= world.cols || iy < 0 || iy >= world.rows) return false;
    return iy <= world.landLimitY || isDockCell(ix, iy);
  }

  function isBlockedFloat(x, y) {
    return !isWalkable(Math.round(x), Math.round(y));
  }

  function nearestHotspotBonus(x, y) {
    let best = 0;
    for (const spot of world.hotspots) {
      const dist = Math.hypot(x - spot.x, y - spot.y);
      const local = clamp(1 - dist / spot.r, 0, 1);
      if (local > best) best = local;
    }
    return best;
  }

  function getTimeSegment() {
    const t = state.dayClock;
    if (t < 0.24) return { label: "Amanecer", bite: 1.14, rare: 1.08, sky: "rgba(255,192,120,.16)" };
    if (t < 0.57) return { label: "Día", bite: 1, rare: 1, sky: "rgba(180,220,255,.10)" };
    if (t < 0.8) return { label: "Tarde", bite: 1.17, rare: 1.12, sky: "rgba(255,166,108,.14)" };
    return { label: "Noche", bite: 0.92, rare: 1.2, sky: "rgba(18,42,70,.2)" };
  }

  function getEnvironment() {
    const weather = pixelWeatherAdvanced[state.weatherIndex];
    const segment = getTimeSegment();
    return {
      label: `${segment.label} · ${weather.name}`,
      biteBonus: weather.bite * segment.bite,
      rareBonus: weather.rare * segment.rare,
      water: weather.water,
      sky: segment.sky
    };
  }

  function worldToScreen(wx, wy) {
    return {
      x: (wx - state.camera.x) * world.tile,
      y: (wy - state.camera.y) * world.tile
    };
  }

  function updateCamera() {
    state.camera.x = clamp(state.player.x - viewCols / 2, 0, world.cols - viewCols);
    state.camera.y = clamp(state.player.y - viewRows / 2, 0, world.rows - viewRows);
  }

  function setFacingFromVector(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      state.player.dir = dx >= 0 ? "right" : "left";
      return;
    }
    state.player.dir = dy >= 0 ? "down" : "up";
  }

  function getPointerWorldPosition(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const localX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const localY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    return {
      x: state.camera.x + localX * viewCols,
      y: state.camera.y + localY * viewRows
    };
  }

  function canCastFromPlayer() {
    const dir = dirDelta[state.player.dir];
    if (!dir) return false;
    const baseX = Math.round(state.player.x);
    const baseY = Math.round(state.player.y);
    for (let step = 1; step <= 7; step += 1) {
      if (isWaterCell(baseX + dir.x * step, baseY + dir.y * step)) return true;
    }
    return false;
  }

  function syncButtons() {
    let castDisabled = true;
    let castLabel = "Lanzar";
    let hookDisabled = true;
    let hookLabel = "Recoger";

    if (state.phase === "explore") {
      castDisabled = !canCastFromPlayer();
      castLabel = state.chargeActive ? "Cargando..." : "Lanzar";
      hookDisabled = true;
      hookLabel = "Recoger";
    } else if (state.phase === "casted") {
      castDisabled = true;
      castLabel = "Lanzado";
      hookDisabled = false;
      hookLabel = "Recoger";
    } else if (state.phase === "bite") {
      castDisabled = true;
      castLabel = "Lanzado";
      hookDisabled = false;
      hookLabel = "¡Recoger!";
    } else if (state.phase === "fight") {
      castDisabled = true;
      castLabel = "Combate";
      hookDisabled = false;
      hookLabel = state.reelHeld ? "Recogiendo..." : "Recoger";
    }

    castButton.disabled = castDisabled;
    castButton.textContent = castLabel;
    hookButton.disabled = hookDisabled;
    hookButton.textContent = hookLabel;

    if (touchCastButton) {
      touchCastButton.disabled = castDisabled;
      touchCastButton.textContent = castLabel;
    }
    if (touchHookButton) {
      touchHookButton.disabled = hookDisabled;
      touchHookButton.textContent = hookLabel;
    }
  }

  function beginExploreState(message) {
    clearFishingTimers();
    resetJoystick();
    state.phase = "explore";
    state.chargeActive = false;
    state.castPower = 0;
    state.reelHeld = false;
    state.tapTarget = null;
    state.bobber = null;
    state.currentFish = null;
    state.fight = null;
    setFightPanelVisible(false);
    renderFightHud();
    setMeter(powerMeter, 0, "linear-gradient(90deg,#7ac6f4 0%, #4f9ed8 100%)");
    setMeter(fightMeter, 0, "linear-gradient(90deg,#65d06f 0%, #2eab5a 100%)");
    if (message) setStatus(message);
    syncButtons();
  }

  function pickFish(castPower, hotspotBonus, env) {
    const rarityBoost = castPower * 0.7 + hotspotBonus * 0.95 + (env.rareBonus - 1) * 0.85;
    const weighted = pixelFishPoolAdvanced.map((fish) => {
      let factor = 1;
      if (fish.rarity === "rara") factor = 0.72 + rarityBoost;
      if (fish.rarity === "épica") factor = 0.45 + rarityBoost * 0.9;
      return { fish, weight: Math.max(0.2, fish.weight * factor) };
    });
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.fish;
    }
    return weighted[0].fish;
  }

  function failCurrentFish(message) {
    const fishName = state.currentFish?.name;
    const bobber = state.bobber;
    clearFishingTimers();
    hideCatchReveal();
    state.reelHeld = false;
    if (bobber) {
      pushSplashBurst(bobber.x, bobber.y, 7, "rgba(205, 236, 252, .76)");
    }
    stats.streak = 0;
    persistStats();
    updateCollectionLog();
    if (fishName) {
      updateLastCatch(`Último intento: ${fishName} se escapó.`);
    }
    beginExploreState(message || "El pez se escapó. Ajusta ritmo y vuelve a intentarlo.");
  }

  function catchCurrentFish(reactionMs) {
    const fish = state.currentFish;
    const bobber = state.bobber;
    clearFishingTimers();
    state.reelHeld = false;
    stats.catches += 1;
    stats.streak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
    if (fish?.name) {
      const name = fish.name;
      stats.speciesSeen[name] = (Number(stats.speciesSeen[name]) || 0) + 1;
      stats.fishLog.unshift({
        name,
        rarity: fish.rarity,
        at: Date.now()
      });
      stats.fishLog = stats.fishLog.slice(0, 16);
    }
    persistStats();
    updateCollectionLog();
    if (bobber) {
      pushSplashBurst(bobber.x, bobber.y, 12, "rgba(246, 253, 255, .9)");
    }

    if (fish) {
      updateLastCatch(`Última captura: ${fish.name} (${fish.rarity}) en ${Math.max(80, Math.round(reactionMs || 0))} ms.`);
    }
    showCatchReveal(fish, reactionMs);
    beginExploreState(`¡Captura conseguida! ${fish?.name || "Pieza"} asegurada.`);
  }

  function beginFight(reactionMs) {
    if (!state.currentFish) {
      failCurrentFish("Se perdió la tensión del combate.");
      return;
    }
    clearFishingTimers();
    state.phase = "fight";

    const reactionQuality = clamp(((state.assistMode ? 760 : 500) - reactionMs) / 420, -0.25, 0.75);
    const barHeight = state.assistMode
      ? clamp(31 - state.currentFish.difficulty * 5, 20, 33)
      : clamp(26 - state.currentFish.difficulty * 4.8, 15, 27);
    state.fight = {
      barCenter: 48,
      barVelocity: 0,
      barHeight,
      fishY: clamp(46 + Math.random() * 10, 15, 88),
      fishVelocity: 0,
      fishTarget: 52,
      fishRetargetAt: 0,
      progress: clamp(28 + reactionQuality * 30, 14, 62),
      pressure: 0
    };

    setFightPanelVisible(true);
    renderFightHud();
    setMeter(powerMeter, 36, "linear-gradient(90deg,#5ec8ff 0%, #2a9ddd 100%)");
    setMeter(fightMeter, state.fight.progress, "linear-gradient(90deg,#6dda7a 0%, #38b75f 100%)");
    setStatus(`${state.currentFish.name} en tensión. Mantén Recoger dentro de la zona segura.`);
    syncButtons();

    state.phaseTimer = window.setTimeout(() => {
      failCurrentFish("El combate se alargó y el pez escapó.");
    }, (state.assistMode ? 19000 : 14000) - state.currentFish.difficulty * (state.assistMode ? 1200 : 1800));
  }

  function scheduleBite(hotspotBonus, env) {
    const baseChance = (0.48 + state.castPower * 0.34 + hotspotBonus * 0.32) * env.biteBonus;
    const minChance = state.assistMode ? 0.58 : 0.24;
    const biteChance = clamp(baseChance, minChance, 0.96);
    const waitMs = (state.assistMode ? 600 : 800) + Math.random() * (state.assistMode ? 2300 : 3000);
    state.currentFish = {
      ...pickFish(state.castPower, hotspotBonus, env),
      envLabel: env.label
    };

    if (state.phaseTimer) {
      clearTimeout(state.phaseTimer);
      state.phaseTimer = null;
    }

    state.biteTimer = window.setTimeout(() => {
      state.biteTimer = null;
      if (state.phase !== "casted") return;
      if (Math.random() > biteChance) {
        beginExploreState("No hubo picada. Muévete, cambia ángulo y vuelve a lanzar.");
        return;
      }

      state.phase = "bite";
      state.biteAt = performance.now();
      if (state.bobber) {
        pushSplashBurst(state.bobber.x, state.bobber.y, 10, "rgba(231, 250, 255, .88)");
      }
      const biteWindow = Math.round((state.assistMode ? 1400 : 850) - state.castPower * (state.assistMode ? 240 : 180));
      setStatus(`¡Picada de ${state.currentFish.name}! Pulsa Recoger en el momento justo.`);
      syncButtons();

      if (state.assistMode) {
        window.setTimeout(() => {
          if (state.phase === "bite") {
            beginFight(340);
          }
        }, Math.round(biteWindow * 0.72));
      }

      state.phaseTimer = window.setTimeout(() => {
        failCurrentFish("Llegaste tarde y el pez soltó el señuelo.");
      }, biteWindow);
    }, waitMs);

    state.phaseTimer = window.setTimeout(() => {
      if (state.phase === "casted") {
        beginExploreState("Sin actividad aquí. Prueba otra posición.");
      }
    }, (state.assistMode ? 12000 : 9500) + Math.random() * 2200);
  }

  function executeCast(powerValue) {
    if (state.phase !== "explore") return;
    hideCatchReveal();
    if (!canCastFromPlayer()) {
      setStatus("Ponte mirando al agua y con espacio delante para lanzar.");
      syncButtons();
      return;
    }

    const castPower = clamp(powerValue, 0.12, 1);
    const dir = dirDelta[state.player.dir];
    const baseX = Math.round(state.player.x);
    const baseY = Math.round(state.player.y);
    const maxReach = Math.round(2 + castPower * 6.2);
    let target = null;

    for (let step = 1; step <= maxReach; step += 1) {
      const tx = baseX + dir.x * step;
      const ty = baseY + dir.y * step;
      if (isWaterCell(tx, ty)) target = { x: tx, y: ty };
    }

    if (!target) {
      setStatus("Ese lance cae en tierra. Ajusta posición y vuelve a probar.");
      syncButtons();
      return;
    }

    stats.casts += 1;
    persistStats();

    state.phase = "casted";
    state.castPower = castPower;
    state.chargeActive = false;
    state.chargeValue = 0;
    state.chargeDir = 1;
    state.reelHeld = false;
    state.tapTarget = null;
    state.bobber = {
      x: target.x + (Math.random() - 0.5) * 0.26,
      y: target.y + (Math.random() - 0.5) * 0.22
    };
    pushSplashBurst(state.bobber.x, state.bobber.y, 6, "rgba(220, 242, 255, .74)");

    const env = getEnvironment();
    const hotspotBonus = nearestHotspotBonus(state.bobber.x, state.bobber.y);
    const castQuality = castPower > 0.74 ? "largo" : castPower > 0.46 ? "medio" : "corto";
    setStatus(`Lance ${castQuality}. ${env.label}. Espera la picada y usa Recoger cuando toque.`);
    setMeter(powerMeter, castPower * 100, "linear-gradient(90deg,#7ac6f4 0%, #458dd0 100%)");
    setMeter(fightMeter, 8, "linear-gradient(90deg,#f5c15f 0%, #e19235 100%)");
    syncButtons();
    scheduleBite(hotspotBonus, env);
  }

  function beginChargeCast() {
    if (state.phase === "fight") {
      state.reelHeld = true;
      syncButtons();
      return;
    }
    if (state.phase !== "explore") return;
    if (!canCastFromPlayer()) {
      setStatus("Busca una celda de agua delante para poder lanzar.");
      syncButtons();
      return;
    }
    state.chargeActive = true;
    state.chargeDir = 1;
    if (state.chargeValue <= 0) state.chargeValue = 0.22;
    setStatus("Cargando potencia... suelta para lanzar.");
    syncButtons();
  }

  function releaseChargeCast() {
    if (state.phase === "fight") {
      state.reelHeld = false;
      syncButtons();
      return;
    }
    if (state.phase !== "explore" || !state.chargeActive) return;
    executeCast(Math.max(0.18, state.chargeValue));
  }

  function handleHookTap() {
    if (state.phase === "explore") {
      setStatus("Primero camina a la orilla y lanza.");
      return;
    }

    if (state.phase === "casted") {
      setStatus("Todavía no hay picada. Espera el aviso y luego recoge.");
      return;
    }

    if (state.phase === "bite") {
      const reaction = Math.max(80, Math.round(performance.now() - state.biteAt));
      beginFight(reaction);
      return;
    }

    if (state.phase === "fight") {
      state.reelHeld = true;
      syncButtons();
    }
  }

  function updateFight(deltaMs, ts) {
    if (state.phase !== "fight" || !state.fight || !state.currentFish) return;
    const fight = state.fight;
    const fishDifficulty = state.currentFish.difficulty;
    const assist = state.assistMode;
    const dt = deltaMs / 1000;
    const gravity = assist ? 86 : 104;
    const reelForce = assist ? 178 : 196;

    fight.barVelocity += (state.reelHeld ? reelForce : -gravity) * dt;
    fight.barVelocity *= assist ? 0.92 : 0.9;
    fight.barCenter += fight.barVelocity * dt;

    const halfBar = fight.barHeight / 2;
    if (fight.barCenter < halfBar) {
      fight.barCenter = halfBar;
      fight.barVelocity *= -0.26;
    } else if (fight.barCenter > 100 - halfBar) {
      fight.barCenter = 100 - halfBar;
      fight.barVelocity *= -0.2;
    }

    fight.fishRetargetAt -= deltaMs;
    if (fight.fishRetargetAt <= 0) {
      const jitter = 14 + fishDifficulty * 18;
      const targetBase = 50 + Math.sin(ts * (assist ? 0.0016 : 0.0022)) * 26;
      fight.fishTarget = clamp(targetBase + (Math.random() * 2 - 1) * jitter, 8, 92);
      fight.fishRetargetAt = (assist ? 540 : 430) + Math.random() * (assist ? 560 : 410);
    }

    const fishAccel = (fight.fishTarget - fight.fishY) * (assist ? 4.2 : 5.2);
    fight.fishVelocity += fishAccel * dt;
    fight.fishVelocity *= assist ? 0.87 : 0.83;
    fight.fishY += fight.fishVelocity * dt;
    fight.fishY = clamp(fight.fishY, 4, 96);

    const insideZone = fight.fishY >= fight.barCenter - halfBar && fight.fishY <= fight.barCenter + halfBar;
    if (insideZone) {
      fight.progress += (assist ? 24 : 18) * dt;
    } else {
      fight.progress -= (assist ? 14 : 20) * dt;
    }

    fight.progress = clamp(fight.progress, 0, 100);
    fight.pressure = insideZone ? Math.max(0, fight.pressure - 28 * dt) : fight.pressure + 24 * dt;
    renderFightHud();
    setMeter(powerMeter, fight.barCenter, "linear-gradient(90deg,#8ad9ff 0%, #2a9ddd 100%)");
    setMeter(fightMeter, fight.progress, "linear-gradient(90deg,#6dda7a 0%, #38b75f 100%)");

    if (fight.pressure > (assist ? 250 : 170)) {
      failCurrentFish("Perdiste tensión constante y el pez se soltó.");
      return;
    }

    if (fight.progress <= 0) {
      failCurrentFish("La captura se escapó. Inténtalo de nuevo con más calma.");
      return;
    }

    if (fight.progress >= 100) {
      catchCurrentFish(Math.max(80, Math.round(performance.now() - state.biteAt)));
    }
  }

  function updateEnvironment(deltaMs) {
    state.dayClock = (state.dayClock + deltaMs * 0.000015) % 1;
    state.weatherTimer += deltaMs;
    if (state.weatherTimer > 26000 + Math.random() * 10000) {
      state.weatherTimer = 0;
      state.weatherIndex = Math.floor(Math.random() * pixelWeatherAdvanced.length);
      if (state.phase === "explore") {
        setStatus(`Cambio de condiciones: ${getEnvironment().label}.`);
      }
    }
  }

  function pushDirection(dir) {
    if (!dir) return;
    state.tapTarget = null;
    if (!state.pressedDirs.includes(dir)) {
      state.pressedDirs.push(dir);
    }
  }

  function dropDirection(dir) {
    if (!dir) return;
    state.pressedDirs = state.pressedDirs.filter((item) => item !== dir);
  }

  function resetJoystick() {
    state.joystick.active = false;
    state.joystick.pointerId = null;
    state.joystick.x = 0;
    state.joystick.y = 0;
    state.joystick.strength = 0;
    if (joystickKnob) {
      joystickKnob.style.transform = "translate(-50%, -50%)";
    }
  }

  function updateJoystickFromPointer(event) {
    if (!joystick || !joystickKnob) return;
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = Math.max(18, rect.width * 0.36);
    let dx = event.clientX - cx;
    let dy = event.clientY - cy;
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      const ratio = radius / distance;
      dx *= ratio;
      dy *= ratio;
    }
    const nx = radius ? dx / radius : 0;
    const ny = radius ? dy / radius : 0;
    state.joystick.x = clamp(nx, -1, 1);
    state.joystick.y = clamp(ny, -1, 1);
    state.joystick.strength = clamp(Math.hypot(state.joystick.x, state.joystick.y), 0, 1);
    joystickKnob.style.transform = `translate(calc(-50% + ${Math.round(dx)}px), calc(-50% + ${Math.round(dy)}px))`;
  }

  function updateMovement(deltaMs) {
    if (state.phase !== "explore") return;
    const dir = state.pressedDirs[state.pressedDirs.length - 1];
    let moveX = 0;
    let moveY = 0;
    let speedBoost = 1;

    if (state.joystick.strength > 0.06) {
      moveX = state.joystick.x;
      moveY = state.joystick.y;
      speedBoost = 0.66 + state.joystick.strength * 0.5;
      setFacingFromVector(moveX, moveY);
      state.tapTarget = null;
    } else if (dir) {
      const delta = dirDelta[dir];
      if (!delta) return;
      state.player.dir = dir;
      moveX = delta.x;
      moveY = delta.y;
    } else if (state.tapTarget) {
      const dx = state.tapTarget.x - state.player.x;
      const dy = state.tapTarget.y - state.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 0.16) {
        state.tapTarget = null;
        return;
      }
      moveX = dx / distance;
      moveY = dy / distance;
      setFacingFromVector(dx, dy);
    } else {
      return;
    }

    const speedTiles = 4.25 * speedBoost;
    const moveStep = (deltaMs / 1000) * speedTiles;
    let nextX = state.player.x + moveX * moveStep;
    let nextY = state.player.y + moveY * moveStep;
    nextX = clamp(nextX, 0.45, world.cols - 1.45);
    nextY = clamp(nextY, 0.45, world.rows - 1.45);

    if (!isBlockedFloat(nextX, nextY)) {
      const dist = Math.hypot(nextX - state.player.x, nextY - state.player.y);
      state.player.x = nextX;
      state.player.y = nextY;
      state.player.stepAnim += deltaMs * 0.02;

      state.stepAccumulator += dist;
      let touched = false;
      while (state.stepAccumulator >= 0.55) {
        state.stepAccumulator -= 0.55;
        stats.steps += 1;
        touched = true;
      }
      if (touched) persistStats();
    } else if (state.tapTarget) {
      state.tapTarget = null;
    }
  }

  function drawTileCell(x, y, color) {
    const screen = worldToScreen(x, y);
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(screen.x), Math.floor(screen.y), world.tile + 1, world.tile + 1);
  }

  function drawWorld(ts) {
    const env = getEnvironment();
    const wave = Math.floor(ts / 220) % 2;
    const startX = Math.max(0, Math.floor(state.camera.x) - 1);
    const endX = Math.min(world.cols, Math.ceil(state.camera.x + viewCols) + 1);
    const startY = Math.max(0, Math.floor(state.camera.y) - 1);
    const endY = Math.min(world.rows, Math.ceil(state.camera.y + viewRows) + 1);

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        if (isDockCell(x, y)) {
          drawTileCell(x, y, (x + y) % 2 ? "#9f6a2f" : "#7f4d21");
        } else if (y >= world.waterStartY) {
          drawTileCell(x, y, (x + y + wave) % 2 ? env.water[0] : env.water[1]);
        } else if (y === world.landLimitY) {
          drawTileCell(x, y, (x + y) % 2 ? "#d9bb84" : "#cfab72");
        } else {
          drawTileCell(x, y, (x + y) % 2 ? "#7eb058" : "#6aa04f");
        }
      }
    }

    for (const rock of world.rocks) {
      const center = worldToScreen(rock.x, rock.y);
      const rockRadius = rock.r * world.tile;
      ctx.fillStyle = "rgba(73, 86, 99, .9)";
      ctx.beginPath();
      ctx.arc(center.x, center.y, rockRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(176, 194, 209, .3)";
      ctx.beginPath();
      ctx.arc(center.x - rockRadius * 0.3, center.y - rockRadius * 0.2, rockRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const spot of world.hotspots) {
      const sx = (spot.x - state.camera.x) * world.tile;
      const sy = (spot.y - state.camera.y) * world.tile;
      const radius = spot.r * world.tile * 0.56;
      ctx.fillStyle = "rgba(255,255,255,.08)";
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = env.sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(13, 31, 46, .58)";
    ctx.fillRect(6, 6, canvas.width - 12, 15);
    ctx.fillStyle = "#ecf8ff";
    ctx.font = '10px "Pixelify Sans", "Barlow Condensed", sans-serif';
    ctx.fillText(env.label, 12, 17);

    const phaseLabel = state.phase === "fight"
      ? "Combate"
      : state.phase === "bite"
        ? "Picada"
        : state.phase === "casted"
          ? "Espera"
          : "Explora";
    const textWidth = ctx.measureText(phaseLabel).width;
    ctx.fillText(phaseLabel, canvas.width - textWidth - 12, 17);
  }

  function drawPlayer() {
    const screen = worldToScreen(state.player.x, state.player.y);
    const px = Math.floor(screen.x);
    const py = Math.floor(screen.y);
    const legAnim = Math.floor(state.player.stepAnim) % 2;

    ctx.fillStyle = "#263a4d";
    ctx.fillRect(px + 4, py + 2, 8, 3);
    ctx.fillStyle = "#f2c49a";
    ctx.fillRect(px + 5, py + 5, 6, 4);
    ctx.fillStyle = "#4587bd";
    ctx.fillRect(px + 4, py + 9, 8, 5);
    ctx.fillStyle = "#2f5f8b";
    ctx.fillRect(px + 4, py + 14, 3, 2);
    ctx.fillRect(px + 9, py + 14, 3, 2);
    if (legAnim) {
      ctx.fillRect(px + 4, py + 15, 2, 1);
      ctx.fillRect(px + 10, py + 15, 2, 1);
    }

    ctx.fillStyle = "#fffaf2";
    if (state.player.dir === "left") {
      ctx.fillRect(px + 5, py + 6, 1, 1);
    } else if (state.player.dir === "right") {
      ctx.fillRect(px + 10, py + 6, 1, 1);
    } else if (state.player.dir === "up") {
      ctx.fillRect(px + 7, py + 6, 2, 1);
    } else {
      ctx.fillRect(px + 7, py + 7, 2, 1);
    }
  }

  function drawCast(ts) {
    if (!state.bobber) return;
    const playerCenterWorld = {
      x: state.player.x * world.tile + world.tile / 2,
      y: state.player.y * world.tile + world.tile / 2
    };
    const bobXWorld = state.bobber.x * world.tile + world.tile / 2;
    const bobYWorld = state.bobber.y * world.tile + world.tile / 2;
    const p = worldToScreen(playerCenterWorld.x / world.tile, playerCenterWorld.y / world.tile);
    const b = worldToScreen(bobXWorld / world.tile, bobYWorld / world.tile);
    const bobFloat = Math.sin(ts * 0.0075) * 1.2;

    ctx.strokeStyle = "rgba(248,248,236,.88)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 2);
    ctx.lineTo(b.x, b.y - 2 + bobFloat);
    ctx.stroke();

    const pulse = Math.floor(ts / 120) % 2;
    ctx.fillStyle = pulse ? "#f4b257" : "#f6c574";
    ctx.fillRect(Math.floor(b.x - 3), Math.floor(b.y - 4 + bobFloat), 6, 4);
    ctx.fillStyle = "#fffaf2";
    ctx.fillRect(Math.floor(b.x - 3), Math.floor(b.y + bobFloat), 6, 4);
    ctx.fillStyle = "rgba(255,255,255,.26)";
    ctx.fillRect(Math.floor(b.x - 6), Math.floor(b.y + 5 + bobFloat), 12, 1);

    if (state.phase === "casted" || state.phase === "bite") {
      const orbit = 6 + Math.sin(ts * 0.0042) * 2.2;
      const chaseSpeed = ts * (state.phase === "bite" ? 0.013 : 0.009);
      const fx = b.x + Math.cos(chaseSpeed) * orbit;
      const fy = b.y + bobFloat + Math.sin(chaseSpeed * 1.6) * (2.8 + (state.phase === "bite" ? 0.8 : 0));
      ctx.fillStyle = state.phase === "bite" ? "rgba(13, 37, 57, .58)" : "rgba(12, 33, 48, .42)";
      ctx.beginPath();
      ctx.ellipse(Math.floor(fx), Math.floor(fy), state.phase === "bite" ? 6 : 5, state.phase === "bite" ? 3 : 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(250, 255, 255, .14)";
      ctx.fillRect(Math.floor(fx + 1), Math.floor(fy - 1), 2, 1);
    }

    if (state.phase === "bite") {
      ctx.fillStyle = "#ff5f4f";
      ctx.fillRect(Math.floor(b.x - 1), Math.floor(b.y - 13), 2, 7);
      ctx.fillRect(Math.floor(b.x - 2), Math.floor(b.y - 14), 4, 1);
    } else if (state.phase === "fight" && state.fight) {
      const pulse = 3 + Math.sin(ts * 0.012) * 2;
      ctx.strokeStyle = "rgba(160, 238, 255, .7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Math.floor(b.x), Math.floor(b.y + bobFloat), pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function updateSplashBursts(deltaMs) {
    if (!state.splashBursts.length) return;
    for (let i = state.splashBursts.length - 1; i >= 0; i -= 1) {
      const burst = state.splashBursts[i];
      burst.life -= deltaMs;
      burst.x += burst.vx * deltaMs;
      burst.y += burst.vy * deltaMs;
      burst.vy += 0.00004 * deltaMs;
      if (burst.life <= 0) {
        state.splashBursts.splice(i, 1);
      }
    }
  }

  function drawSplashBursts() {
    if (!state.splashBursts.length) return;
    for (const burst of state.splashBursts) {
      const lifeRatio = clamp(burst.life / burst.maxLife, 0, 1);
      const pos = worldToScreen(burst.x, burst.y);
      ctx.fillStyle = burst.color;
      ctx.globalAlpha = Math.max(0.12, lifeRatio * 0.88);
      ctx.fillRect(
        Math.floor(pos.x - burst.size * 0.5),
        Math.floor(pos.y - burst.size * 0.5),
        Math.max(1, Math.round(burst.size * lifeRatio)),
        Math.max(1, Math.round((burst.size * 0.75) * lifeRatio))
      );
      ctx.globalAlpha = 1;
    }
  }

  function frame(ts) {
    const delta = state.lastTs ? Math.min(40, ts - state.lastTs) : 16;
    state.lastTs = ts;

    updateEnvironment(delta);
    updateSplashBursts(delta);

    if (state.chargeActive && state.phase === "explore") {
      state.chargeValue += state.chargeDir * (delta / 850);
      if (state.chargeValue >= 1) {
        state.chargeValue = 1;
        state.chargeDir = -1;
      } else if (state.chargeValue <= 0.16) {
        state.chargeValue = 0.16;
        state.chargeDir = 1;
      }
      setMeter(powerMeter, state.chargeValue * 100, "linear-gradient(90deg,#7ac6f4 0%, #3f90cf 100%)");
    }

    updateMovement(delta);
    updateFight(delta, ts);
    updateCamera();
    drawWorld(ts);
    drawCast(ts);
    drawSplashBursts();
    drawPlayer();
    state.frameId = window.requestAnimationFrame(frame);
  }

  moveButtons.forEach((button) => {
    const dir = button.dataset.pixelMove;
    if (!dir) return;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      pushDirection(dir);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
      button.addEventListener(type, () => dropDirection(dir));
    });
  });

  if (joystick && joystickKnob) {
    joystick.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      state.joystick.active = true;
      state.joystick.pointerId = event.pointerId;
      state.tapTarget = null;
      updateJoystickFromPointer(event);
      joystick.setPointerCapture(event.pointerId);
    });
    joystick.addEventListener("pointermove", (event) => {
      if (!state.joystick.active || event.pointerId !== state.joystick.pointerId) return;
      event.preventDefault();
      updateJoystickFromPointer(event);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => {
      joystick.addEventListener(type, (event) => {
        if (event.pointerId !== state.joystick.pointerId) return;
        event.preventDefault();
        resetJoystick();
      });
    });
  }

  canvas.addEventListener("pointerdown", (event) => {
    const pointerWorld = getPointerWorldPosition(event);
    if (!pointerWorld) return;

    if (state.phase === "bite") {
      event.preventDefault();
      handleHookTap();
      return;
    }

    if (state.phase === "fight") {
      event.preventDefault();
      state.reelHeld = true;
      syncButtons();
      return;
    }

    if (state.phase !== "explore") return;

    const cellX = Math.round(pointerWorld.x);
    const cellY = Math.round(pointerWorld.y);
    const dx = pointerWorld.x - state.player.x;
    const dy = pointerWorld.y - state.player.y;
    setFacingFromVector(dx, dy);

    if (isWaterCell(cellX, cellY)) {
      event.preventDefault();
      const distance = Math.hypot(dx, dy);
      const tapPower = clamp(distance / 7.5, 0.35, 1);
      executeCast(tapPower);
      return;
    }

    if (isWalkable(cellX, cellY)) {
      event.preventDefault();
      state.tapTarget = { x: clamp(cellX, 0.45, world.cols - 1.45), y: clamp(cellY, 0.45, world.rows - 1.45) };
      setStatus("Ruta marcada. Camina hasta el punto y lanza cuando tengas agua delante.");
      syncButtons();
    }
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
    canvas.addEventListener(type, () => {
      if (state.phase === "fight") {
        state.reelHeld = false;
        syncButtons();
      }
    });
  });

  castButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    beginChargeCast();
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
    castButton.addEventListener(type, (event) => {
      event.preventDefault();
      releaseChargeCast();
    });
  });
  castButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (state.phase === "explore" && !state.chargeActive) {
      executeCast(0.55);
    }
  });
  if (touchCastButton) {
    touchCastButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      beginChargeCast();
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
      touchCastButton.addEventListener(type, (event) => {
        event.preventDefault();
        releaseChargeCast();
      });
    });
    touchCastButton.addEventListener("click", (event) => {
      event.preventDefault();
      if (state.phase === "explore" && !state.chargeActive) {
        executeCast(0.55);
      }
    });
  }

  hookButton.addEventListener("click", (event) => {
    event.preventDefault();
    handleHookTap();
  });
  hookButton.addEventListener("pointerdown", () => {
    if (state.phase === "fight") {
      state.reelHeld = true;
      syncButtons();
    }
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
    hookButton.addEventListener(type, () => {
      if (state.phase === "fight") {
        state.reelHeld = false;
        syncButtons();
      }
    });
  });
  if (touchHookButton) {
    touchHookButton.addEventListener("click", (event) => {
      event.preventDefault();
      handleHookTap();
    });
    touchHookButton.addEventListener("pointerdown", () => {
      if (state.phase === "fight") {
        state.reelHeld = true;
        syncButtons();
      }
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
      touchHookButton.addEventListener(type, () => {
        if (state.phase === "fight") {
          state.reelHeld = false;
          syncButtons();
        }
      });
    });
  }

  if (catchClose) {
    catchClose.addEventListener("click", () => {
      hideCatchReveal();
    });
  }

  function onKeyDown(event) {
    const dir = keyToDir[event.code];
    if (dir) {
      event.preventDefault();
      pushDirection(dir);
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      if (state.phase === "explore" && !state.chargeActive && !event.repeat) {
        beginChargeCast();
      } else if (state.phase === "bite" && !event.repeat) {
        handleHookTap();
      } else if (state.phase === "fight") {
        state.reelHeld = true;
      }
      return;
    }

    if (event.code === "Enter" && !event.repeat) {
      event.preventDefault();
      if (state.phase === "explore") {
        executeCast(0.6);
      } else {
        handleHookTap();
      }
    }
  }

  function onKeyUp(event) {
    const dir = keyToDir[event.code];
    if (dir) {
      event.preventDefault();
      dropDirection(dir);
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      if (state.phase === "explore") {
        releaseChargeCast();
      }
      if (state.phase === "fight") {
        state.reelHeld = false;
      }
      syncButtons();
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("pointerup", () => {
    if (state.joystick.active) resetJoystick();
    if (state.phase === "fight") {
      state.reelHeld = false;
      syncButtons();
    }
  });
  window.addEventListener("blur", () => {
    resetJoystick();
    state.pressedDirs = [];
    if (state.phase === "fight") {
      state.reelHeld = false;
      syncButtons();
    }
  });

  renderStats();
  updateLastCatch("Última captura: todavía ninguna.");
  updateCollectionLog();
  beginExploreState(
    state.assistMode
      ? "Usa el joystick táctil para moverte, Lanza en el agua y mantén Recoger en combate."
      : "Muévete por el muelle, busca agua activa y lanza con potencia."
  );
  updateCamera();
  state.frameId = window.requestAnimationFrame(frame);
}

function hydratePixelFishingGameAdvanced(root) {
  const canvas = root.querySelector("[data-pixel-fishing-canvas]");
  const statusNode = root.querySelector("[data-pixel-fishing-status]");
  const castButton = root.querySelector("[data-pixel-fishing-cast]");
  const hookButton = root.querySelector("[data-pixel-fishing-hook]");
  const moveButtons = [...root.querySelectorAll("[data-pixel-move]")];
  const stepsNode = root.querySelector("[data-pixel-fishing-steps]");
  const castsNode = root.querySelector("[data-pixel-fishing-casts]");
  const catchesNode = root.querySelector("[data-pixel-fishing-catches]");
  const bestNode = root.querySelector("[data-pixel-fishing-best]");
  const powerMeter = root.querySelector("[data-pixel-fishing-power]");
  const fightMeter = root.querySelector("[data-pixel-fishing-fight]");
  const lastCatchNode = root.querySelector("[data-pixel-fishing-last]");
  if (!canvas || !statusNode || !castButton || !hookButton) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const world = {
    cols: 40,
    rows: 22,
    tile: 16,
    landLimitY: 11,
    waterStartY: 12,
    dock: { x: 18, y: 10, w: 3, h: 5 },
    hotspots: [
      { x: 7, y: 16, r: 3.2 },
      { x: 15, y: 18, r: 3.7 },
      { x: 27, y: 15, r: 3.3 },
      { x: 34, y: 17, r: 2.8 }
    ]
  };

  const viewCols = canvas.width / world.tile;
  const viewRows = canvas.height / world.tile;
  const keyToDir = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    KeyW: "up",
    KeyS: "down",
    KeyA: "left",
    KeyD: "right"
  };
  const dirDelta = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  const stats = getPixelFishStats();
  const state = {
    phase: "explore",
    player: { x: 8, y: 8, dir: "down", stepAnim: 0 },
    camera: { x: 0, y: 0 },
    pressedDirs: [],
    controlsArmed: false,
    chargeActive: false,
    chargeValue: 0,
    chargeDir: 1,
    reelHeld: false,
    stepAccumulator: 0,
    bobber: null,
    castPower: 0,
    currentFish: null,
    biteTimer: null,
    biteDeadline: 0,
    phaseTimer: null,
    fight: null,
    dayClock: Math.random(),
    weatherIndex: Math.floor(Math.random() * pixelWeatherAdvanced.length),
    weatherTimer: 0,
    frameId: null,
    lastTs: 0
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function armControls() {
    state.controlsArmed = true;
  }

  function persistStats() {
    savePixelFishStats(stats);
    renderStats();
  }

  function renderStats() {
    if (stepsNode) stepsNode.textContent = String(stats.steps || 0);
    if (castsNode) castsNode.textContent = String(stats.casts || 0);
    if (catchesNode) catchesNode.textContent = String(stats.catches || 0);
    if (bestNode) bestNode.textContent = String(stats.bestStreak || 0);
  }

  function updateLastCatchLabel(message) {
    if (lastCatchNode) lastCatchNode.textContent = message;
  }

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function setMeter(node, value, color) {
    if (!node) return;
    node.style.width = `${clamp(value, 0, 100)}%`;
    if (color) node.style.background = color;
  }

  function isDockCell(ix, iy) {
    return ix >= world.dock.x && ix < world.dock.x + world.dock.w && iy >= world.dock.y && iy < world.dock.y + world.dock.h;
  }

  function isWaterCell(ix, iy) {
    if (ix < 0 || ix >= world.cols || iy < 0 || iy >= world.rows) return false;
    return iy >= world.waterStartY && !isDockCell(ix, iy);
  }

  function isWalkable(ix, iy) {
    if (ix < 0 || ix >= world.cols || iy < 0 || iy >= world.rows) return false;
    return iy <= world.landLimitY || isDockCell(ix, iy);
  }

  function isBlockedFloat(x, y) {
    return !isWalkable(Math.round(x), Math.round(y));
  }

  function nearestHotspotBonus(x, y) {
    let best = 0;
    for (const spot of world.hotspots) {
      const dist = Math.hypot(x - spot.x, y - spot.y);
      const local = clamp(1 - dist / spot.r, 0, 1);
      if (local > best) best = local;
    }
    return best;
  }

  function getTimeSegment() {
    const t = state.dayClock;
    if (t < 0.24) return { label: "Amanecer", bite: 1.14, rare: 1.08, sky: "rgba(255,192,120,.16)" };
    if (t < 0.57) return { label: "Día", bite: 1, rare: 1, sky: "rgba(180,220,255,.10)" };
    if (t < 0.8) return { label: "Tarde", bite: 1.17, rare: 1.12, sky: "rgba(255,166,108,.14)" };
    return { label: "Noche", bite: 0.92, rare: 1.2, sky: "rgba(18,42,70,.2)" };
  }

  function getEnvironment() {
    const weather = pixelWeatherAdvanced[state.weatherIndex];
    const segment = getTimeSegment();
    return {
      label: `${segment.label} · ${weather.name}`,
      biteBonus: weather.bite * segment.bite,
      rareBonus: weather.rare * segment.rare,
      water: weather.water,
      sky: segment.sky
    };
  }

  function clearFishingTimers() {
    if (state.biteTimer) {
      clearTimeout(state.biteTimer);
      state.biteTimer = null;
    }
    if (state.phaseTimer) {
      clearTimeout(state.phaseTimer);
      state.phaseTimer = null;
    }
  }

  function canCastFromPlayer() {
    const dir = dirDelta[state.player.dir];
    if (!dir) return false;
    const baseX = Math.round(state.player.x);
    const baseY = Math.round(state.player.y);
    for (let step = 1; step <= 2; step += 1) {
      if (isWaterCell(baseX + dir.x * step, baseY + dir.y * step)) return true;
    }
    return false;
  }

  function syncButtons() {
    if (state.phase === "explore") {
      castButton.disabled = !canCastFromPlayer();
      castButton.textContent = state.chargeActive ? "Cargando..." : "Lanzar";
      hookButton.disabled = true;
      hookButton.textContent = "Recoger";
    } else if (state.phase === "casted") {
      castButton.disabled = true;
      castButton.textContent = "Lanzado";
      hookButton.disabled = false;
      hookButton.textContent = "Recoger";
    } else if (state.phase === "bite") {
      castButton.disabled = true;
      castButton.textContent = "Lanzado";
      hookButton.disabled = false;
      hookButton.textContent = "¡Recoger!";
    } else if (state.phase === "fight") {
      castButton.disabled = true;
      castButton.textContent = "En combate";
      hookButton.disabled = false;
      hookButton.textContent = state.reelHeld ? "Recogiendo..." : "Recoger";
    } else {
      castButton.disabled = true;
      hookButton.disabled = true;
    }
  }

  function beginExploreState(message) {
    clearFishingTimers();
    state.phase = "explore";
    state.chargeActive = false;
    state.chargeValue = 0;
    state.castPower = 0;
    state.reelHeld = false;
    state.bobber = null;
    state.currentFish = null;
    state.fight = null;
    state.biteDeadline = 0;
    setMeter(powerMeter, 0, "linear-gradient(90deg,#7ac6f4 0%, #4f9ed8 100%)");
    setMeter(fightMeter, 0, "linear-gradient(90deg,#65d06f 0%, #2eab5a 100%)");
    if (message) setStatus(message);
    syncButtons();
  }

  function pickFish(castPower, hotspotBonus, env) {
    const rarityBoost = castPower * 0.7 + hotspotBonus * 0.95 + (env.rareBonus - 1) * 0.85;
    const weighted = pixelFishPoolAdvanced.map((fish) => {
      let factor = 1;
      if (fish.rarity === "rara") factor = 0.72 + rarityBoost;
      if (fish.rarity === "épica") factor = 0.45 + rarityBoost * 0.9;
      return { fish, weight: Math.max(0.2, fish.weight * factor) };
    });
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.fish;
    }
    return weighted[0].fish;
  }
}

document.querySelectorAll("[data-pixel-fishing-root]").forEach(hydratePixelFishingGameAdvancedV2);

// ─── Minijuego: Lance preciso ─────────────────────
const CAST_GAME_KEY = "ajspinning_cast_game_v1";

function getCastGameStats() {
  try {
    const saved = localStorage.getItem(CAST_GAME_KEY);
    return saved
      ? JSON.parse(saved)
      : { attempts: 0, hits: 0, bestPrecision: null };
  } catch (error) {
    return { attempts: 0, hits: 0, bestPrecision: null };
  }
}

function saveCastGameStats(stats) {
  try {
    localStorage.setItem(CAST_GAME_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn("No se pudieron guardar las estadisticas del minijuego de lance", error);
  }
}

function hydrateCastGame(root) {
  const startButton = root.querySelector("[data-cast-game-start]");
  const castButton = root.querySelector("[data-cast-game-cast]");
  const statusNode = root.querySelector("[data-cast-game-status]");
  const targetNode = root.querySelector("[data-cast-game-target]");
  const markerNode = root.querySelector("[data-cast-game-marker]");
  const attemptsNode = root.querySelector("[data-cast-game-attempts]");
  const hitsNode = root.querySelector("[data-cast-game-hits]");
  const bestNode = root.querySelector("[data-cast-game-best]");
  if (!startButton || !castButton || !statusNode || !targetNode || !markerNode) return;

  const state = {
    running: false,
    frameId: null,
    pos: 50,
    velocity: 1,
    direction: 1,
    targetStart: 41,
    targetWidth: 18,
    lastTs: 0
  };

  function renderStats() {
    const stats = getCastGameStats();
    if (attemptsNode) attemptsNode.textContent = String(stats.attempts || 0);
    if (hitsNode) hitsNode.textContent = String(stats.hits || 0);
    if (bestNode) {
      bestNode.textContent = stats.bestPrecision === null ? "--" : `${stats.bestPrecision}%`;
    }
  }

  function setMarkerPosition() {
    markerNode.style.left = `calc(${state.pos}% - 5px)`;
  }

  function setTarget() {
    state.targetWidth = 16 + Math.random() * 8;
    state.targetStart = 8 + Math.random() * (84 - state.targetWidth);
    targetNode.style.left = `${state.targetStart}%`;
    targetNode.style.width = `${state.targetWidth}%`;
  }

  function stopAnimation() {
    state.running = false;
    if (state.frameId) {
      cancelAnimationFrame(state.frameId);
      state.frameId = null;
    }
    state.lastTs = 0;
  }

  function loop(ts) {
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    const delta = Math.min(32, ts - state.lastTs);
    state.lastTs = ts;

    state.pos += state.direction * state.velocity * delta * 0.085;
    if (state.pos >= 100) {
      state.pos = 100;
      state.direction = -1;
    } else if (state.pos <= 0) {
      state.pos = 0;
      state.direction = 1;
    }

    setMarkerPosition();
    state.frameId = requestAnimationFrame(loop);
  }

  function finishRound() {
    stopAnimation();
    castButton.disabled = true;
    startButton.disabled = false;
    startButton.textContent = "Nuevo lance";
  }

  startButton.addEventListener("click", () => {
    stopAnimation();
    setTarget();
    state.pos = 10 + Math.random() * 80;
    state.velocity = 0.65 + Math.random() * 0.95;
    state.direction = Math.random() > 0.5 ? 1 : -1;
    setMarkerPosition();
    state.running = true;
    startButton.disabled = true;
    castButton.disabled = false;
    statusNode.textContent = "Ahora: pulsa lanzar cuando el marcador entre en verde.";
    state.frameId = requestAnimationFrame(loop);
  });

  castButton.addEventListener("click", () => {
    if (!state.running) return;

    const center = state.targetStart + state.targetWidth / 2;
    const distance = Math.abs(state.pos - center);
    const halfWindow = state.targetWidth / 2;
    const insideWindow = state.pos >= state.targetStart && state.pos <= state.targetStart + state.targetWidth;

    const stats = getCastGameStats();
    stats.attempts += 1;

    if (insideWindow) {
      const closeness = Math.max(0, 1 - distance / halfWindow);
      const precision = Math.max(60, Math.round(60 + closeness * 40));
      stats.hits += 1;
      stats.bestPrecision = stats.bestPrecision === null ? precision : Math.max(stats.bestPrecision, precision);
      saveCastGameStats(stats);
      renderStats();
      statusNode.textContent = `Lance dentro de ventana. Precisión ${precision}% · buen timing.`;
    } else {
      saveCastGameStats(stats);
      renderStats();
      statusNode.textContent = "Fuera de ventana. Ajusta el timing y repite el lance.";
    }

    finishRound();
  });

  renderStats();
  finishRound();
  statusNode.textContent = "Prepara el lance y busca la ventana de impacto.";
  setTarget();
  setMarkerPosition();
}

document.querySelectorAll("[data-cast-game-root]").forEach(hydrateCastGame);

