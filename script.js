import { supabase } from "./supabase.js";
import { IMAGES, resolveImage } from "./images.js";
import {
  handleAdminAuthChange,
  handleAdminClick,
  handleAdminInput,
  handleAdminPreview,
  handleAdminSubmit,
  initializeAdmin,
  renderAdmin,
} from "./admin.js";

let PRODUCTS = [];
let catalogLoaded = false;
let catalogError = "";

let COLLECTIONS = [];

const FREE_SHIPPING_MINOR = 800000;
const SHIPPING_MINOR = 25000;
const STORAGE_KEY = "noir-elixir-static-cart-v1";
const main = document.querySelector("#main-content");
const overlays = document.querySelector("#overlay-root");
const toast = document.querySelector("#toast");
let activeSlide = 0;
let activeSize = 50;
let quantity = 1;
let renderedLocation = "";
let toastTimer;
let searchQuery = "";
let cart = loadCart();

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

function loadCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored)
      ? stored.filter(
          (line) =>
            typeof line?.id === "string" &&
            [30, 50, 100].includes(Number(line.size)) &&
            Number.isInteger(line.qty) &&
            line.qty > 0,
        )
      : [];
  } catch {
    return [];
  }
}

async function loadCatalog() {
  if (!supabase) {
    catalogError =
      "The product catalog is not configured. Set the public Supabase URL and publishable key.";
    catalogLoaded = true;
    render();
    return;
  }

  const [collectionResult, productResult] = await Promise.all([
    supabase
      .from("collections")
      .select("id, slug, name, description, image_url")
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select(
        "id, slug, name, short_description, description, fragrance_family, top_notes, heart_notes, base_notes, image_url, featured, is_active, collection_id, collections(id, slug, name), product_variants(id, size_ml, sku, price_minor, sale_price_minor, stock_quantity, is_active)",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (collectionResult.error) throw collectionResult.error;
  if (productResult.error) throw productResult.error;

  COLLECTIONS = (collectionResult.data ?? []).map((collection) => ({
    id: collection.slug,
    databaseId: collection.id,
    name: collection.name,
    description: collection.description ?? "",
    image: collection.image_url ?? "",
  }));
  PRODUCTS = (productResult.data ?? []).map((row) => {
    const variants = (row.product_variants ?? []).filter(
      (variant) => variant.is_active && [30, 50, 100].includes(variant.size_ml),
    );
    const prices = {};
    const regularPrices = {};
    const salePrices = {};
    const stocks = {};
    for (const variant of variants) {
      regularPrices[variant.size_ml] = Number(variant.price_minor);
      salePrices[variant.size_ml] = variant.sale_price_minor
        ? Number(variant.sale_price_minor)
        : null;
      prices[variant.size_ml] = Number(variant.sale_price_minor ?? variant.price_minor);
      stocks[variant.size_ml] = Number(variant.stock_quantity);
    }
    return {
      recordId: row.id,
      id: row.slug,
      name: row.name,
      family: row.fragrance_family || row.collections?.name || "",
      collection: row.collections?.slug ?? "",
      description: row.description ?? row.short_description ?? "",
      top: row.top_notes ?? "",
      heart: row.heart_notes ?? "",
      base: row.base_notes ?? "",
      image: row.image_url ?? "",
      prices,
      regularPrices,
      salePrices,
      stocks,
      featured: row.featured,
      available: row.is_active && variants.length > 0,
    };
  });
  cart = cart
    .filter(
      (line) =>
        productById(line.id)?.prices[line.size] && productById(line.id)?.stocks[line.size] > 0,
    )
    .map((line) => ({
      ...line,
      qty: Math.min(line.qty, productById(line.id).stocks[line.size]),
    }));
  const cartIsOpen = Boolean(overlays.querySelector(".drawer"));
  saveCart();
  catalogError = "";
  catalogLoaded = true;
  render();
  if (cartIsOpen) openCart();
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    showToast("Your cart is available until you close this tab.");
  }
  updateCartCount();
}

function money(minor) {
  return `Rs ${Math.round(Number(minor || 0) / 100).toLocaleString("en-PK")}`;
}

function productById(id) {
  return PRODUCTS.find((product) => product.id === id);
}

function productPrice(product) {
  const prices = Object.values(product.prices);
  return prices.length ? Math.min(...prices) : 0;
}

function cartSubtotal() {
  return cart.reduce((sum, line) => {
    const product = productById(line.id);
    return sum + (product?.prices[line.size] || 0) * line.qty;
  }, 0);
}

function shippingCost(subtotal) {
  return subtotal === 0 || subtotal >= FREE_SHIPPING_MINOR ? 0 : SHIPPING_MINOR;
}

function updateCartCount() {
  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count > 99 ? "99+" : String(count);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function safeImage(src, alt, className = "") {
  const resolved = resolveImage(src);
  if (!resolved) return "";
  return `<img class="${className}" src="${escapeHtml(resolved)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.hidden=true">`;
}

function routeInfo() {
  if (location.pathname.replace(/\/+$/, "") === "/admin") {
    return { page: "admin", id: "", query: new URLSearchParams() };
  }
  const hash = location.hash.replace(/^#\/?/, "");
  const [path, query = ""] = hash.split("?");
  const parts = path.split("/").filter(Boolean);
  return { page: parts[0] || "home", id: parts[1] || "", query: new URLSearchParams(query) };
}

function linkTo(page, label, className = "") {
  return `<a class="${className}" href="#/${page}">${label}</a>`;
}

function productCard(product) {
  return `
    <article class="product-card">
      <div class="product-photo">
        <a href="#/perfume/${product.id}" aria-label="View ${escapeHtml(product.name)}">${safeImage(product.image, product.name)}</a>
        ${product.featured ? '<span class="product-badge">House Signature</span>' : ""}
        <div class="product-tools">
          <button type="button" data-action="quick-view" data-id="${product.id}">Quick view</button>
          <button type="button" data-action="quick-add" data-id="${product.id}" aria-label="Add ${escapeHtml(product.name)} to bag">Add to bag</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-family">${escapeHtml(product.family)}</div>
        <div class="product-title-line">
          <a class="product-title" href="#/perfume/${product.id}">${escapeHtml(product.name)}</a>
          <span class="product-price">${Object.values(product.salePrices ?? {}).some(Boolean) ? `<del>${money(Math.min(...Object.values(product.regularPrices ?? product.prices)))} </del> ` : ""}From ${money(productPrice(product))}</span>
        </div>
        <div class="product-size">30 · 50 · 100 ml — Eau de Parfum</div>
      </div>
    </article>`;
}

function collectionCard(collection) {
  return `<a class="collection-card" href="#/shop?collection=${encodeURIComponent(collection.id)}">
    ${safeImage(collection.image, collection.name)}
    <div class="collection-card-copy">
      <h3>${escapeHtml(collection.name)}</h3>
      <p>${escapeHtml(collection.description)}</p>
      <span class="text-link">Discover <span>→</span></span>
    </div>
  </a>`;
}

function homePage() {
  const slides = [
    {
      eyebrow: "The Art of Fine Fragrance",
      first: "Scent That",
      second: "Defines You.",
      copy: "Discover distinctive fragrances created to express individuality, elegance, and confidence.",
      image: IMAGES.hero,
      cta: "Explore Collection",
      href: "#/shop",
    },
    {
      eyebrow: "The House Signature",
      first: "Signature",
      second: "Experience",
      copy: "Rare raw materials — oud, Taif rose and saffron — composed in small batches.",
      image: IMAGES.collage,
      cta: "Discover Noir Élixir",
      href: "#/perfume/noir-elixir",
    },
    {
      eyebrow: "The Craft",
      first: "The Craft",
      second: "",
      copy: "Each composition macerates for weeks before bottling. No shortcuts, no compromises.",
      image: IMAGES.story,
      cta: "Our Philosophy",
      href: "#/story",
    },
    {
      eyebrow: "The Collection",
      first: "An Olfactory",
      second: "Wardrobe",
      copy: "From the depth of oud to the light of bergamot — a fragrance for every mood.",
      image: IMAGES.amber,
      cta: "Shop the Collection",
      href: "#/shop",
    },
    {
      eyebrow: "Find Your Signature",
      first: "Your Signature",
      second: "Awaits.",
      copy: "A fragrance is the most intimate thing you wear. Find the one that defines you.",
      image: IMAGES.ring,
      cta: "Find Your Fragrance",
      href: "#/shop",
    },
  ];
  const slide = slides[activeSlide];
  const signature = productById("noir-elixir") || PRODUCTS[0];
  return `
    <section class="hero">
      ${safeImage(slide.image, "NOIR ÉLIXIR fragrance under golden light", "hero-image")}
      <div class="hero-content">
        <p class="eyebrow">${slide.eyebrow}</p>
        <h1>${slide.first}${slide.second ? `<br><span class="${activeSlide === 0 || activeSlide === 4 ? "gold-text" : ""}">${slide.second}</span>` : ""}</h1>
        <p class="hero-copy">${slide.copy}</p>
        <div class="button-row">
          <a class="button" href="${slide.href}">${slide.cta}<span>→</span></a>
          ${activeSlide === 0 ? '<a class="button button-outline" href="#/story">Discover Our Story</a>' : ""}
        </div>
      </div>
      <div class="hero-bottom">
        <div class="hero-dots" aria-label="Choose hero slide">
          ${slides.map((_, index) => `<button type="button" class="hero-dot ${index === activeSlide ? "active" : ""}" aria-label="Show slide ${index + 1}" data-action="slide" data-index="${index}"></button>`).join("")}
        </div>
        <span class="scroll-note">Scroll to discover ↓</span>
      </div>
    </section>
    ${
      signature
        ? `<section class="section signature-section">
      <div class="signature-visual">
        <div class="signature-image-wrap">${safeImage(signature.image, "Noir Élixir signature perfume bottle")}
          <div class="image-note"><span class="note-label">Eau de Parfum</span>50 ml<span class="note-price">${money(signature.prices[50] || productPrice(signature))}</span></div>
        </div>
      </div>
      <div>
        <p class="eyebrow">The Signature</p>
        <h2 class="section-title">The Signature of <span class="gold-text">Luxury</span></h2>
        <p class="section-copy">${escapeHtml(signature.description)} Built around rare raw materials and matured with patience, Noir Élixir is the fragrance that named the house.</p>
        <dl class="notes-list">
          ${notesRows(signature)}
        </dl>
        <a class="button" href="#/perfume/${signature.id}">Explore ${escapeHtml(signature.name)} <span>→</span></a>
      </div>
    </section>`
        : ""
    }
    <section class="section">
      <div class="section-heading">
        <p class="eyebrow">Shop by Collection</p>
        <h2 class="section-title">Five Worlds, <span class="gold-text">One House</span></h2>
        <p class="section-copy">Each collection is built around a single olfactory idea — explore the world that matches yours.</p>
      </div>
      <div class="collection-grid">${COLLECTIONS.slice(0, 3).map(collectionCard).join("")}</div>
      <p style="margin-top:24px"><a class="text-link" href="#/collections">Explore all collections <span>→</span></a></p>
    </section>
    <section class="section">
      <div class="section-heading center">
        <p class="eyebrow">The Collection</p>
        <h2 class="section-title">The Fragrance <span class="gold-text">Wardrobe</span></h2>
        <p class="section-copy">Compositions in rare raw materials, bottled in small batches.</p>
      </div>
      <div class="product-grid">${PRODUCTS.slice(0, 4).map(productCard).join("") || '<p class="empty-state">The collection is being prepared. Please check back soon.</p>'}</div>
      <div style="margin-top:34px;text-align:center"><a class="button button-outline" href="#/shop">Shop All Fragrances</a></div>
    </section>
    <section class="story-band">
      <div class="story-band-image">${safeImage(IMAGES.story, "Oud, rose and saffron on dark stone")}</div>
      <div class="story-band-content">
        <p class="eyebrow">Our Philosophy</p>
        <h2 class="section-title">More Than a <span class="gold-text">Fragrance</span></h2>
        <p class="section-copy">A scent is memory made invisible. We build each composition around a single emotion — quiet confidence, magnetic warmth, the calm of dusk.</p>
        <a class="button button-outline" href="#/story">Our Story <span>→</span></a>
      </div>
    </section>
    `;
}

function notesRows(product) {
  return [
    ["Top Notes", product.top],
    ["Heart Notes", product.heart],
    ["Base Notes", product.base],
    ["Fragrance Family", product.family],
  ]
    .map(
      ([label, value]) =>
        `<div class="notes-row"><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`,
    )
    .join("");
}

function shopPage(collectionId = "") {
  const selected = COLLECTIONS.find((collection) => collection.id === collectionId);
  const products = selected
    ? PRODUCTS.filter((product) => product.collection === collectionId)
    : PRODUCTS;
  return `
    <section class="page-intro">
      <p class="eyebrow">${selected ? "Collection" : "The House"}</p>
      <h1 class="page-heading">${escapeHtml(selected?.name || "All Fragrances")}</h1>
      ${selected ? `<p class="section-copy">${escapeHtml(selected.description)}</p>` : '<p class="section-copy">Explore distinctive compositions from the NOIR ÉLIXIR fragrance house.</p>'}
      <div class="filter-row">
        <a class="filter-chip ${!selected ? "active" : ""}" href="#/shop">All Fragrances</a>
        ${COLLECTIONS.map((collection) => `<a class="filter-chip ${selected?.id === collection.id ? "active" : ""}" href="#/shop?collection=${collection.id}">${escapeHtml(collection.name)}</a>`).join("")}
      </div>
    </section>
    <section class="section shop-body">
      ${products.length ? `<div class="product-grid">${products.map(productCard).join("")}</div>` : '<p class="empty-state">No fragrances in this collection yet.</p>'}
      <p class="demo-note">Product details, prices, and inventory are loaded from the live catalog.</p>
    </section>`;
}

function collectionsPage() {
  return `<section class="page-intro"><p class="eyebrow">Shop by Collection</p><h1 class="page-heading">Five Worlds, <span class="gold-text">One House</span></h1><p class="section-copy">Each collection is built around a single olfactory idea — explore the world that matches yours.</p></section>
    <section class="section"><div class="collection-grid">${COLLECTIONS.map(collectionCard).join("")}</div></section>`;
}

function productPage(id) {
  const product = productById(id);
  if (!product)
    return `<section class="section page-intro"><p class="eyebrow">Not found</p><h1 class="page-heading">Fragrance not found</h1><a class="button" href="#/shop">Back to the collection</a></section>`;
  if (!product.prices[activeSize]) {
    activeSize = Number(Object.keys(product.prices)[0] || 50);
  }
  const variantPrice = product.prices[activeSize] ?? productPrice(product);
  const regularPrice = product.regularPrices?.[activeSize];
  const totalStock = Object.values(product.stocks ?? {}).reduce((sum, stock) => sum + stock, 0);
  return `<section class="section product-detail">
    <div class="detail-image">${safeImage(product.image, `${product.name} perfume bottle`)}</div>
    <div class="detail-copy">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/shop">Shop</a><span>/</span><a href="#/shop?collection=${product.collection}">${escapeHtml(product.family)}</a><span>/</span><span>${escapeHtml(product.name)}</span></nav>
      <p class="eyebrow">${escapeHtml(product.family)}</p>
      <h1 class="detail-heading">${escapeHtml(product.name)}</h1>
      <p class="detail-description">${escapeHtml(product.description)}</p>
      <p class="detail-price">${product.salePrices?.[activeSize] ? `<del>${money(regularPrice)}</del> ` : ""}${money(variantPrice)}</p>
      <p class="size-label">Bottle size</p>
      <div class="size-options">${[30, 50, 100]
        .filter((size) => product.prices[size])
        .map(
          (size) =>
            `<button type="button" class="size-option ${size === activeSize ? "active" : ""}" data-action="size" data-size="${size}" ${product.stocks?.[size] < 1 ? "disabled" : ""}>${size} ml${product.stocks?.[size] < 1 ? " · Sold out" : ""}</button>`,
        )
        .join("")}</div>
      <p class="admin-store-stock">${totalStock > 0 ? `${totalStock} in stock` : "Currently out of stock"}</p>
      <div class="detail-buy">
        <div class="qty-control"><button type="button" aria-label="Decrease quantity" data-action="qty-down">−</button><output>${quantity}</output><button type="button" aria-label="Increase quantity" data-action="qty-up">+</button></div>
        <button type="button" class="button" data-action="add-detail" data-id="${product.id}" ${product.stocks?.[activeSize] < 1 ? "disabled" : ""}>Add to Bag</button>
      </div>
      <dl class="notes-list">${notesRows(product)}</dl>
      <div class="shipping-callout"><strong>Delivery & payment</strong><br>2–4 working days nationwide (Pakistan). Cash on Delivery is shown for demo only. Free delivery over ${money(FREE_SHIPPING_MINOR)}.</div>
      <p class="demo-note">Prices and availability are updated from the live product catalog. Checkout is currently a preview.</p>
    </div>
  </section>
  <section class="section"><div class="section-heading"><p class="eyebrow">Explore More</p><h2 class="section-title">You May Also <span class="gold-text">Love</span></h2></div><div class="product-grid">${PRODUCTS.filter(
    (item) => item.id !== id,
  )
    .slice(0, 4)
    .map(productCard)
    .join("")}</div></section>`;
}

function storyPage() {
  return `<section class="story-hero">${safeImage(IMAGES.hero, "Perfume bottle under golden light", "story-hero-image")}<div class="story-hero-content"><p class="eyebrow">Our Story</p><h1 class="page-heading">More Than a <span class="gold-text">Fragrance</span></h1></div></section>
    <section class="section"><div class="story-content"><p>NOIR ÉLIXIR is an independent luxury perfume house crafting distinctive fragrances in small batches. Each composition is built around rare raw materials — Cambodian oud, Taif rose and saffron — and designed to express individuality, elegance and confidence.</p><p>We believe a fragrance is the most intimate thing you wear. It cannot be seen, yet it announces you before you speak and lingers after you leave. That is why we treat perfumery as couture — composed by hand, tasted drop by drop, and never compromised.</p><p>The collection is deliberately small. Each fragrance must earn its place: distinctive enough to be recognised across a room, elegant enough to be worn every day.</p><p class="gold-text" style="font:italic 20px var(--serif)">“SCENT THAT DEFINES YOU.”</p></div>
    <div class="story-image-wrap">${safeImage(IMAGES.story, "Raw fragrance ingredients on dark stone")}</div>
    <div class="pillar-grid"><article><h3>Rare Raw Materials</h3><p>We choose each material the way a jeweller chooses a stone — aged woods, hand-picked petals, spices weighed in small portions.</p></article><article><h3>Small Batches</h3><p>Every composition is blended in limited runs, so each bottle leaves the studio as carefully as it entered.</p></article><article><h3>Patience</h3><p>Fragrances are given weeks to macerate and marry before they are judged ready. Nothing is rushed.</p></article></div>
    <div style="margin-top:64px;text-align:center"><p class="eyebrow">The collection</p><h2 class="section-title">Find the scent that defines you</h2><a class="button" style="margin-top:24px" href="#/shop">Explore Collection</a></div></section>`;
}

function contactPage() {
  const email = "care@noirelixir.example";
  return `<section class="page-intro"><p class="eyebrow">Contact</p><h1 class="page-heading">Get in <span class="gold-text">Touch</span></h1><p class="section-copy">Questions about a fragrance or collaboration — we read every message.</p></section>
    <section class="section contact-grid"><div class="contact-details"><div class="contact-item"><small>Email</small><p><a href="mailto:${email}">${email}</a></p></div><div class="contact-item"><small>Phone</small><p>+92 300 0000000</p></div><div class="contact-item"><small>Studio</small><p>Gulberg III, Lahore, Pakistan<br>Mon–Sat, 10:00–19:00 (PKT)</p></div><p class="demo-note" style="text-align:left;margin:0">Contact details are demo placeholders.</p></div>
    <form class="form-card" data-form="contact"><div class="form-grid">
      <div class="form-field"><label for="contact-name">Your name</label><input id="contact-name" name="name" required maxlength="100" autocomplete="name"></div>
      <div class="form-field"><label for="contact-email">Your email</label><input id="contact-email" name="email" type="email" required maxlength="255" autocomplete="email"></div>
      <div class="form-field full"><label for="contact-message">Message</label><textarea id="contact-message" name="message" required rows="6" maxlength="1500"></textarea></div>
    </div><button class="button" type="submit">Send Message <span>→</span></button><p class="demo-note">This opens your email app with the message ready to send.</p></form></section>`;
}

function checkoutPage() {
  const subtotal = cartSubtotal();
  const shipping = shippingCost(subtotal);
  const rows = cart
    .map((line) => {
      const product = productById(line.id);
      if (!product) return "";
      return `<div class="summary-line"><span>${escapeHtml(product.name)} — ${line.size} ml × ${line.qty}</span><strong>${money(product.prices[line.size] * line.qty)}</strong></div>`;
    })
    .join("");
  return `<section class="page-intro"><p class="eyebrow">Demo Checkout</p><h1 class="page-heading">Review Your <span class="gold-text">Bag</span></h1><p class="section-copy">This static preview cannot send or record an order.</p></section>
    <section class="section checkout-grid"><form class="form-card" data-form="demo-checkout"><div class="form-grid">
      <div class="form-field full"><label for="checkout-name">Full name</label><input id="checkout-name" name="name" required autocomplete="name"></div>
      <div class="form-field"><label for="checkout-phone">Phone number</label><input id="checkout-phone" name="phone" required autocomplete="tel"></div>
      <div class="form-field"><label for="checkout-email">Email address</label><input id="checkout-email" name="email" type="email" required autocomplete="email"></div>
      <div class="form-field"><label for="checkout-city">City</label><input id="checkout-city" name="city" required autocomplete="address-level2"></div>
      <div class="form-field full"><label for="checkout-address">Delivery address</label><textarea id="checkout-address" name="address" required rows="3" autocomplete="street-address"></textarea></div>
    </div><p class="demo-warning">Demo only: submitting this form will not place an order or send your information anywhere.</p><button class="button" type="submit">Preview Demo Checkout</button></form>
    <aside class="summary-card"><h2 class="summary-title">Order Summary</h2>${rows || '<p class="empty-state">Your bag is empty.</p>'}<div class="summary-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="summary-line"><span>Delivery</span><strong>${shipping ? money(shipping) : "Free"}</strong></div><div class="summary-total"><span>Demo total</span><strong>${money(subtotal + shipping)}</strong></div><a class="button button-outline" style="width:100%;margin-top:15px" href="#/shop">Continue Shopping</a></aside></section>`;
}

function footerMarkup() {
  return `<div class="footer-main">
    <div><a class="brand-mark" href="#/"><span class="brand-monogram">N<span>E</span></span><span class="brand-wordmark">NOIR <i>ÉLIXIR</i></span></a><p class="footer-tagline">An independent luxury perfume house crafting distinctive fragrances in small batches.</p></div>
    <div><h2 class="footer-heading">Explore</h2><nav class="footer-links" aria-label="Footer navigation"><a href="#/shop">All Fragrances</a><a href="#/collections">Collections</a><a href="#/story">Our Story</a><a href="#/contact">Contact</a><a href="/admin">Admin</a></nav></div>
    <div><h2 class="footer-heading">The House</h2><div class="footer-links"><a href="mailto:care@noirelixir.example">care@noirelixir.example</a><span>Lahore, Pakistan</span><span>2–4 working days nationwide</span></div></div>
  </div><div class="footer-bottom"><span>© ${new Date().getFullYear()} NOIR ÉLIXIR. All rights reserved.</span><span>Static demo storefront — not connected to an order service.</span></div>`;
}

function render() {
  const locationKey = `${location.pathname}${location.hash}`;
  const routeChanged = locationKey !== renderedLocation;
  if (routeChanged) {
    activeSize = 50;
    quantity = 1;
    renderedLocation = locationKey;
  }
  const { page, id, query } = routeInfo();
  const isAdmin = page === "admin";
  document.body.classList.toggle("admin-mode", isAdmin);
  document.querySelector(".site-header").hidden = isAdmin;
  document.querySelector("#site-footer").hidden = isAdmin;
  if (isAdmin) {
    closeOverlay();
    main.innerHTML = renderAdmin();
    document.title = "Admin — NOIR ÉLIXIR";
    handleAdminAuthChange(render);
    void initializeAdmin(render, () =>
      loadCatalog().catch((error) => {
        catalogError =
          error instanceof Error ? error.message : "The catalog could not be refreshed.";
        render();
      }),
    );
    return;
  }

  document.querySelectorAll(".main-nav a").forEach((link) => {
    const linkPage = link.getAttribute("href").replace("#/", "").split("?")[0];
    link.toggleAttribute(
      "aria-current",
      linkPage === page || (page === "perfume" && linkPage === "shop"),
    );
  });
  document.querySelector(".main-nav").classList.remove("open");
  document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
  const pages = {
    home: homePage,
    shop: () => shopPage(query.get("collection") || ""),
    collections: collectionsPage,
    perfume: () => productPage(id),
    story: storyPage,
    contact: contactPage,
    checkout: checkoutPage,
  };
  main.innerHTML = !catalogLoaded
    ? `<section class="section page-intro"><p class="eyebrow">Loading</p><h1 class="page-heading">Loading the collection…</h1></section>`
    : catalogError
      ? `<section class="section page-intro"><p class="eyebrow">Catalog unavailable</p><h1 class="page-heading">We couldn’t load the collection</h1><p class="section-copy">${escapeHtml(catalogError)}</p><button class="button" type="button" data-action="retry-catalog">Try again</button></section>`
      : (
          pages[page] ||
          (() =>
            `<section class="section page-intro"><p class="eyebrow">Not found</p><h1 class="page-heading">Page not found</h1><a class="button" href="#/">Return home</a></section>`)
        )();
  document.querySelector("#site-footer").innerHTML = footerMarkup();
  document.title =
    page === "home"
      ? "NOIR ÉLIXIR — Scent That Defines You"
      : `${page === "perfume" ? productById(id)?.name || "Fragrance" : page[0].toUpperCase() + page.slice(1)} — NOIR ÉLIXIR`;
  updateCartCount();
  if (routeChanged) window.scrollTo({ top: 0, behavior: "instant" });
}

/** Preferred bottle size for one-click adds: 50 ml when it is in stock. */
function defaultSize(product) {
  return (
    [50, 30, 100].find((size) => product.prices[size] && product.stocks?.[size] > 0) ??
    [50, 30, 100].find((size) => product.prices[size]) ??
    50
  );
}

function addToCart(id, size = 50, qty = 1) {
  const product = productById(id);
  if (!product || !product.prices[size] || product.stocks?.[size] < 1) {
    showToast("This fragrance size is currently unavailable.");
    return;
  }
  const existing = cart.find((line) => line.id === id && line.size === size);
  if ((existing?.qty ?? 0) + qty > product.stocks[size]) {
    showToast(`Only ${product.stocks[size]} available for this size.`);
    return;
  }
  if (existing) existing.qty += qty;
  else cart.push({ id, size, qty });
  saveCart();
  showToast(`${product.name} added to your bag.`);
}

function closeOverlay() {
  overlays.innerHTML = "";
  document.body.classList.remove("modal-open");
}

function openCart() {
  const subtotal = cartSubtotal();
  const shipping = shippingCost(subtotal);
  const lines = cart
    .map((line) => {
      const product = productById(line.id);
      if (!product) return "";
      return `<article class="cart-line">${safeImage(product.image, "")}<div><h3>${escapeHtml(product.name)}</h3><p>${line.size} ml · Qty ${line.qty}</p><button class="remove-line" type="button" data-action="remove-line" data-id="${line.id}" data-size="${line.size}">Remove</button></div><span class="cart-line-price">${money(product.prices[line.size] * line.qty)}</span></article>`;
    })
    .join("");
  overlays.innerHTML = `<div class="overlay" data-action="overlay-close"><aside class="drawer" role="dialog" aria-modal="true" aria-label="Shopping bag">
    <div class="overlay-head"><h2>Your Bag <span style="color:var(--gold)">(${cart.reduce((sum, line) => sum + line.qty, 0)})</span></h2><button class="overlay-close" type="button" aria-label="Close bag" data-action="close-overlay">×</button></div>
    ${cart.length ? `<div class="cart-lines">${lines}</div><div class="cart-totals"><div class="cart-total-row"><span>Subtotal</span><span>${money(subtotal)}</span></div><div class="cart-total-row"><span>Delivery</span><span>${shipping ? money(shipping) : "Free"}</span></div><div class="cart-total-row grand"><span>Demo total</span><strong>${money(subtotal + shipping)}</strong></div></div><p class="demo-warning">Demo bag only. No real order will be placed.</p><a class="button" href="#/checkout" data-action="go-checkout">Review Demo Checkout</a>` : `<p class="empty-state">Your bag is empty.</p><a class="button" href="#/shop" data-action="close-overlay">Explore Fragrances</a>`}
  </aside></div>`;
  document.body.classList.add("modal-open");
}

function renderSearchResults(input) {
  const query = input.trim().toLowerCase();
  const results = query
    ? PRODUCTS.filter((product) =>
        `${product.name} ${product.family} ${product.description}`.toLowerCase().includes(query),
      )
    : PRODUCTS.slice(0, 3);
  const container = overlays.querySelector(".search-results");
  if (!container) return;
  container.innerHTML = results.length
    ? results
        .map(
          (product) =>
            `<a class="search-result" href="#/perfume/${product.id}">${safeImage(product.image, "")}<span>${escapeHtml(product.name)}<small>${escapeHtml(product.family)} · From ${money(productPrice(product))}</small></span></a>`,
        )
        .join("")
    : '<p class="empty-state">No fragrances found.</p>';
}

function openSearch() {
  overlays.innerHTML = `<div class="overlay overlay-center" data-action="overlay-close"><section class="search-box" role="dialog" aria-modal="true" aria-label="Search fragrances"><div class="overlay-head"><h2>Find Your Fragrance</h2><button class="overlay-close" type="button" aria-label="Close search" data-action="close-overlay">×</button></div><input type="search" placeholder="Search fragrances, notes, families…" aria-label="Search fragrances" value="${escapeHtml(searchQuery)}"><div class="search-results"></div></section></div>`;
  document.body.classList.add("modal-open");
  const input = overlays.querySelector('input[type="search"]');
  input.addEventListener("input", () => {
    searchQuery = input.value;
    renderSearchResults(searchQuery);
  });
  renderSearchResults(searchQuery);
  input.focus();
}

function openQuickView(id) {
  const product = productById(id);
  if (!product) return;
  const quickSize =
    [50, 30, 100].find((size) => product.stocks[size] > 0) ??
    [50, 30, 100].find((size) => product.prices[size]);
  overlays.innerHTML = `<div class="overlay overlay-center" data-action="overlay-close"><section class="modal quick-view" role="dialog" aria-modal="true" aria-label="Quick view ${escapeHtml(product.name)}">
    <button class="modal-close" type="button" aria-label="Close" data-action="close-overlay">×</button>
    ${safeImage(product.image, product.name)}
    <div class="quick-view-copy"><p class="eyebrow">${escapeHtml(product.family)}</p><h2>${escapeHtml(product.name)}</h2><p>${escapeHtml(product.description)}</p><p class="detail-price">From ${money(productPrice(product))}</p><div class="size-options">${[
      30, 50, 100,
    ]
      .filter((size) => product.prices[size])
      .map(
        (size) =>
          `<button class="size-option ${size === quickSize ? "active" : ""}" type="button" data-action="quick-size" data-size="${size}" ${product.stocks[size] < 1 ? "disabled" : ""}>${size} ml</button>`,
      )
      .join(
        "",
      )}</div><button class="button" style="margin-top:22px" type="button" data-action="quick-add-size" data-id="${product.id}" data-size="${quickSize ?? ""}" ${!quickSize || product.stocks[quickSize] < 1 ? "disabled" : ""}>Add to Bag</button><a class="text-link" style="margin-top:18px" href="#/perfume/${product.id}">View full details <span>→</span></a></div>
  </section></div>`;
  document.body.classList.add("modal-open");
}

document.addEventListener("click", async (event) => {
  if (await handleAdminClick(event, render)) return;
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  const { action, id } = actionTarget.dataset;
  if (action === "cart") openCart();
  else if (action === "search") openSearch();
  else if (action === "menu") {
    const nav = document.querySelector(".main-nav");
    nav.classList.toggle("open");
    actionTarget.setAttribute("aria-expanded", String(nav.classList.contains("open")));
  } else if (action === "slide") {
    activeSlide = Number(actionTarget.dataset.index);
    render();
  } else if (action === "quick-view") openQuickView(id);
  else if (action === "quick-add") {
    const product = productById(id);
    if (product) addToCart(id, defaultSize(product));
  } else if (action === "add-detail") addToCart(id, activeSize, quantity);
  else if (action === "qty-down") {
    quantity = Math.max(1, quantity - 1);
    render();
  } else if (action === "qty-up") {
    quantity = Math.min(10, quantity + 1);
    render();
  } else if (action === "size") {
    activeSize = Number(actionTarget.dataset.size);
    render();
  } else if (action === "quick-size") {
    const modal = actionTarget.closest(".modal");
    modal
      .querySelectorAll("[data-action='quick-size']")
      .forEach((button) => button.classList.toggle("active", button === actionTarget));
    modal.querySelector("[data-action='quick-add-size']").dataset.size = actionTarget.dataset.size;
  } else if (action === "quick-add-size") {
    addToCart(id, Number(actionTarget.dataset.size));
    closeOverlay();
  } else if (action === "remove-line") {
    cart = cart.filter(
      (line) => !(line.id === id && line.size === Number(actionTarget.dataset.size)),
    );
    saveCart();
    openCart();
  } else if (action === "retry-catalog") {
    catalogLoaded = false;
    catalogError = "";
    render();
    void loadCatalog().catch((error) => {
      catalogError = error instanceof Error ? error.message : "The catalog could not be loaded.";
      catalogLoaded = true;
      render();
    });
  } else if (action === "close-overlay") closeOverlay();
  else if (action === "overlay-close" && event.target === actionTarget) closeOverlay();
  else if (action === "go-checkout") closeOverlay();
});

document.addEventListener("submit", async (event) => {
  if (await handleAdminSubmit(event, render)) return;
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  if (form.dataset.form === "contact") {
    const data = new FormData(form);
    const subject = encodeURIComponent(`Enquiry from ${data.get("name") || "the website"}`);
    const body = encodeURIComponent(
      `${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})`,
    );
    location.href = `mailto:care@noirelixir.example?subject=${subject}&body=${body}`;
  } else if (form.dataset.form === "demo-checkout") {
    showToast("Demo only: no order was sent or recorded.");
  }
});

document.addEventListener("input", (event) => {
  handleAdminInput(event);
});
document.addEventListener("change", (event) => {
  handleAdminInput(event);
  handleAdminPreview(event);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeOverlay();
});

window.addEventListener("hashchange", () => {
  closeOverlay();
  render();
});
window.addEventListener("popstate", () => {
  closeOverlay();
  render();
});

window.addEventListener("store:catalog-updated", () => {
  void loadCatalog().catch((error) => {
    catalogError = error instanceof Error ? error.message : "The catalog could not be refreshed.";
    catalogLoaded = true;
    render();
  });
});
window.addEventListener("storage", (event) => {
  if (event.key === "store-catalog-revision") {
    void loadCatalog().catch((error) => {
      catalogError = error instanceof Error ? error.message : "The catalog could not be refreshed.";
      catalogLoaded = true;
      render();
    });
  }
});
window.addEventListener("focus", () => {
  if (catalogLoaded && !document.body.classList.contains("admin-mode")) {
    void loadCatalog().catch((error) => {
      catalogError = error instanceof Error ? error.message : "The catalog could not be refreshed.";
      render();
    });
  }
});

document.addEventListener(
  "error",
  (event) => {
    if (event.target instanceof HTMLImageElement) event.target.hidden = true;
  },
  true,
);

document.querySelector("#site-footer").innerHTML = footerMarkup();
render();
void loadCatalog().catch((error) => {
  catalogError = error instanceof Error ? error.message : "The catalog could not be loaded.";
  catalogLoaded = true;
  render();
});
