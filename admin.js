import { supabase } from "./supabase.js";
import { resolveImage } from "./images.js";

const SIZES = [30, 50, 100];

// Supabase Auth identifies users by email address, so the short username typed
// on the login screen is expanded to a full address. Keep this in step with
// ADMIN_USERNAME in .env and v_email in the admin migration.
const ADMIN_EMAIL_DOMAIN = "noirelixir.com";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

let status = "checking";
let adminEmail = "";
let products = [];
let collections = [];
let search = "";
let category = "";
let view = "dashboard";
let errorMessage = "";
let initialized = false;
let authListenerRegistered = false;
let refreshCatalog = () => {};

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

/** "admin" -> "admin@noirelixir.com"; a full address is passed through. */
function toAdminEmail(value) {
  const entered = String(value ?? "").trim();
  if (!entered) return "";
  return entered.includes("@") ? entered : `${entered}@${ADMIN_EMAIL_DOMAIN}`;
}

/** Show the bare username for the house domain, the full address otherwise. */
function displayName(email) {
  const value = String(email ?? "");
  return value.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)
    ? value.slice(0, -(ADMIN_EMAIL_DOMAIN.length + 1))
    : value;
}

function messageFrom(error) {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

function notifyCatalogChanged() {
  window.dispatchEvent(new CustomEvent("store:catalog-updated"));
  try {
    window.localStorage.setItem("store-catalog-revision", String(Date.now()));
  } catch {
    // Database writes have already succeeded; this only improves cross-tab freshness.
  }
}

async function checkAdminAccess() {
  if (!supabase) {
    status = "error";
    errorMessage =
      "Admin services are not configured. Set the VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY variables.";
    return false;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) {
    status = "signed-out";
    adminEmail = "";
    return false;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) {
    status = "signed-out";
    adminEmail = "";
    return false;
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_store_admin");
  if (roleError) throw roleError;
  if (!isAdmin) {
    await supabase.auth.signOut();
    status = "signed-out";
    adminEmail = "";
    errorMessage = "This account does not have administrator access.";
    return false;
  }

  adminEmail = data.user.email ?? "";
  status = "ready";
  return true;
}

async function loadDashboard() {
  const [collectionResult, productResult] = await Promise.all([
    supabase.from("collections").select("id, slug, name, description").order("sort_order"),
    supabase
      .from("products")
      .select(
        "id, slug, name, short_description, description, fragrance_family, top_notes, heart_notes, base_notes, image_url, featured, is_active, collection_id, collections(id, slug, name), product_variants(id, size_ml, sku, price_minor, sale_price_minor, stock_quantity, is_active)",
      )
      .order("sort_order"),
  ]);
  if (collectionResult.error) throw collectionResult.error;
  if (productResult.error) throw productResult.error;
  collections = collectionResult.data ?? [];
  products = (productResult.data ?? []).map((product) => ({
    ...product,
    variants: [...(product.product_variants ?? [])].sort(
      (left, right) => left.size_ml - right.size_ml,
    ),
  }));
}

export async function initializeAdmin(onChange, onCatalogRefresh) {
  refreshCatalog = onCatalogRefresh;
  if (initialized) return;
  initialized = true;

  try {
    if (await checkAdminAccess()) await loadDashboard();
  } catch (error) {
    status = "error";
    errorMessage = messageFrom(error);
  }
  onChange();
}

function loginPage() {
  return `<main class="admin-login-screen">
    <form class="admin-login-card" data-admin-form="login">
      <a class="admin-login-brand" href="#/">NOIR <span>ÉLIXIR</span></a>
      <p class="admin-eyebrow">Secure administration</p>
      <h1>Welcome back</h1>
      <p class="admin-subtitle">Sign in with your administrator username and password.</p>
      ${errorMessage ? `<p class="admin-alert" role="alert">${escapeHtml(errorMessage)}</p>` : ""}
      <label>Username<input name="username" type="text" autocomplete="username" required maxlength="255" spellcheck="false" autocapitalize="none"></label>
      <label>Password<input name="password" type="password" autocomplete="current-password" required maxlength="128"></label>
      <button class="admin-primary" type="submit">Sign in</button>
      <a class="admin-back-link" href="#/">Return to storefront</a>
    </form>
  </main>`;
}

function filteredProducts() {
  const query = search.trim().toLowerCase();
  return products.filter((product) => {
    const categoryMatches = !category || product.collections?.id === category;
    const queryMatches =
      !query ||
      `${product.name} ${product.slug} ${product.collections?.name ?? ""}`
        .toLowerCase()
        .includes(query);
    return categoryMatches && queryMatches;
  });
}

function stockTotal(product) {
  return (product.variants ?? []).reduce(
    (total, variant) => total + Number(variant.stock_quantity || 0),
    0,
  );
}

function productRows(list) {
  return list.length
    ? list
        .map((product) => {
          const available =
            product.is_active &&
            product.variants.some((variant) => variant.is_active && variant.stock_quantity > 0);
          const prices = product.variants.map((variant) =>
            Number(variant.sale_price_minor ?? variant.price_minor),
          );
          const from = prices.length ? Math.min(...prices) : 0;
          return `<tr>
            <td><div class="admin-product-cell"><img src="${escapeHtml(resolveImage(product.image_url))}" alt="" loading="lazy"><div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.collections?.name ?? "Uncategorized")}</small></div></div></td>
            <td>${money(from)}</td>
            <td>${stockTotal(product)}</td>
            <td><span class="admin-status ${available ? "is-available" : "is-unavailable"}">${available ? "Available" : "Out of stock"}</span></td>
            <td><div class="admin-row-actions"><button type="button" data-admin-action="edit" data-id="${escapeHtml(product.id)}">Edit</button><button class="is-delete" type="button" data-admin-action="delete" data-id="${escapeHtml(product.id)}">Delete</button></div></td>
          </tr>`;
        })
        .join("")
    : `<tr><td class="admin-empty-cell" colspan="5">No products match your search.</td></tr>`;
}

function dashboardPage() {
  const available = products.filter(
    (product) =>
      product.is_active &&
      product.variants.some((variant) => variant.is_active && variant.stock_quantity > 0),
  ).length;
  const outOfStock = products.length - available;
  return `<section class="admin-page-heading"><div><p class="admin-eyebrow">Overview</p><h1>Dashboard</h1><p>Manage the products and inventory shown in your storefront.</p></div><button class="admin-primary" type="button" data-admin-action="add">Add product</button></section>
    <div class="admin-stat-grid">
      <article><span>Total products</span><strong>${products.length}</strong><small>In your catalog</small></article>
      <article><span>Available products</span><strong>${available}</strong><small>Visible to customers</small></article>
      <article><span>Out of stock</span><strong>${outOfStock}</strong><small>Unavailable inventory</small></article>
    </div>
    <section class="admin-panel">
      <div class="admin-panel-heading"><div><h2>Products</h2><p>Search, filter, and update your catalog.</p></div><button type="button" class="admin-link-button" data-admin-action="products">View all products</button></div>
      ${productFilters()}
      <div class="admin-table-scroll"><table class="admin-table"><thead><tr><th>Product</th><th>Price from</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>${productRows(filteredProducts())}</tbody></table></div>
    </section>`;
}

function productFilters() {
  return `<div class="admin-filters"><label class="admin-search"><span class="sr-only">Search products</span><input type="search" data-admin-search placeholder="Search by name…" value="${escapeHtml(search)}"></label>
    <label class="admin-filter-category"><span class="sr-only">Filter by category</span><select data-admin-category><option value="">All categories</option>${collections
      .map(
        (item) =>
          `<option value="${escapeHtml(item.id)}" ${item.id === category ? "selected" : ""}>${escapeHtml(item.name)}</option>`,
      )
      .join("")}</select></label></div>`;
}

function productListPage() {
  return `<section class="admin-page-heading"><div><p class="admin-eyebrow">Catalog</p><h1>Products</h1><p>Search, filter, and manage your product inventory.</p></div><button class="admin-primary" type="button" data-admin-action="add">Add product</button></section>
    <section class="admin-panel">${productFilters()}<div class="admin-table-scroll"><table class="admin-table"><thead><tr><th>Product</th><th>Price from</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>${productRows(filteredProducts())}</tbody></table></div></section>`;
}

function productEditor(product = null) {
  const variants = new Map((product?.variants ?? []).map((variant) => [variant.size_ml, variant]));
  return `<section class="admin-page-heading"><div><p class="admin-eyebrow">Catalog</p><h1>${product ? "Edit product" : "Add product"}</h1><p>Product details and inventory are saved to your catalog database.</p></div><button class="admin-secondary" type="button" data-admin-action="products">Cancel</button></section>
    <form class="admin-editor" data-admin-form="product" data-product-id="${escapeHtml(product?.id ?? "")}">
      <p class="admin-alert admin-editor-message" role="alert">${escapeHtml(errorMessage)}</p>
      <section class="admin-panel"><h2>Product details</h2><div class="admin-editor-grid">
        <label>Product name<input name="name" required maxlength="120" value="${escapeHtml(product?.name ?? "")}"></label>
        <label>Product URL slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxlength="80" ${product ? "readonly" : ""} value="${escapeHtml(product?.slug ?? "")}" placeholder="e.g. rose-oud"></label>
        <label>Category<input name="category" list="admin-categories" required maxlength="80" value="${escapeHtml(product?.collections?.name ?? "")}" placeholder="Choose or enter a category"><datalist id="admin-categories">${collections.map((item) => `<option value="${escapeHtml(item.name)}"></option>`).join("")}</datalist></label>
        <label>Fragrance family<input name="family" maxlength="120" value="${escapeHtml(product?.fragrance_family ?? "")}"></label>
        <label class="admin-field-wide">Description<textarea name="description" required maxlength="2000" rows="4">${escapeHtml(product?.description ?? "")}</textarea></label>
        <label>Top notes<input name="top" maxlength="250" value="${escapeHtml(product?.top_notes ?? "")}"></label>
        <label>Heart notes<input name="heart" maxlength="250" value="${escapeHtml(product?.heart_notes ?? "")}"></label>
        <label>Base notes<input name="base" maxlength="250" value="${escapeHtml(product?.base_notes ?? "")}"></label>
        <label class="admin-field-wide">Product image<input name="image" type="file" accept="image/jpeg,image/png,image/webp" ${product?.image_url ? "" : "required"}><small>JPEG, PNG, or WebP. Maximum file size: 5 MB.</small><span class="admin-inline-error" data-admin-image-error></span></label>
        <div class="admin-image-preview">${product?.image_url ? `<img src="${escapeHtml(resolveImage(product.image_url))}" alt="Current product image" data-image-preview>` : '<div class="admin-image-placeholder" data-image-placeholder>Image preview will appear here</div>'}</div>
        <label class="admin-checkbox"><input name="featured" type="checkbox" ${product?.featured ? "checked" : ""}> Featured product</label>
        <label class="admin-checkbox"><input name="available" type="checkbox" ${product ? (product.is_active ? "checked" : "") : "checked"}> Available for sale</label>
      </div></section>
      <section class="admin-panel"><h2>Pricing and stock</h2><div class="admin-variant-grid"><div class="admin-variant-labels"><span>Size</span><span>Price (Rs)</span><span>Sale price (Rs)</span><span>Stock quantity</span></div>
        ${SIZES.map((size) => {
          const variant = variants.get(size);
          return `<div class="admin-variant-row"><strong>${size} ml</strong><label><span class="sr-only">${size} ml regular price</span><input type="number" name="price-${size}" min="1" max="10000000" step="1" required value="${variant ? variant.price_minor / 100 : ""}" placeholder="Price"></label><label><span class="sr-only">${size} ml sale price</span><input type="number" name="sale-${size}" min="0" max="10000000" step="1" value="${variant?.sale_price_minor ? variant.sale_price_minor / 100 : ""}" placeholder="Optional"></label><label><span class="sr-only">${size} ml stock quantity</span><input type="number" name="stock-${size}" min="0" max="100000" step="1" required value="${variant?.stock_quantity ?? 0}"></label></div>`;
        }).join("")}
      </div><p class="admin-form-note">Leave sale price blank when there is no sale. Sale prices must be lower than regular prices.</p></section>
      <div class="admin-editor-actions"><button class="admin-primary" type="submit">${product ? "Save changes" : "Create product"}</button><button class="admin-secondary" type="button" data-admin-action="products">Cancel</button></div>
    </form>`;
}

function money(minor) {
  return `Rs ${Math.round(Number(minor || 0) / 100).toLocaleString("en-PK")}`;
}

export function renderAdmin() {
  if (status === "checking") {
    return `<main class="admin-login-screen"><p class="admin-loading">Checking administrator access…</p></main>`;
  }
  if (status !== "ready") return loginPage();

  const currentPage =
    view === "add"
      ? productEditor()
      : view.startsWith("edit:")
        ? productEditor(products.find((item) => item.id === view.slice(5)) ?? null)
        : view === "products"
          ? productListPage()
          : dashboardPage();
  return `<div class="admin-shell">
    <aside class="admin-sidebar">
      <a class="admin-sidebar-brand" href="#/">NOIR <span>ÉLIXIR</span><small>ADMIN</small></a>
      <nav aria-label="Admin navigation">
        <button type="button" data-admin-action="dashboard" class="${view === "dashboard" ? "is-current" : ""}">Dashboard</button>
        <button type="button" data-admin-action="products" class="${view === "products" ? "is-current" : ""}">Products</button>
        <button type="button" data-admin-action="add" class="${view === "add" ? "is-current" : ""}">Add product</button>
      </nav>
      <div class="admin-sidebar-bottom"><span>${escapeHtml(displayName(adminEmail))}</span><button type="button" data-admin-action="logout">Log out</button></div>
    </aside>
    <main class="admin-content">${currentPage}</main>
  </div>`;
}

async function reload(onChange) {
  errorMessage = "";
  try {
    await loadDashboard();
    refreshCatalog();
  } catch (error) {
    errorMessage = messageFrom(error);
  }
  onChange();
}

export async function handleAdminClick(event, onChange) {
  const button = event.target.closest("[data-admin-action]");
  if (!button) return false;
  event.preventDefault();
  const action = button.dataset.adminAction;
  if (action === "logout") {
    const { error } = await supabase.auth.signOut();
    if (error) {
      errorMessage = messageFrom(error);
    } else {
      status = "signed-out";
      adminEmail = "";
      initialized = true;
    }
    onChange();
  } else if (action === "dashboard" || action === "products" || action === "add") {
    view = action;
    errorMessage = "";
    onChange();
  } else if (action === "edit") {
    view = `edit:${button.dataset.id}`;
    errorMessage = "";
    onChange();
  } else if (action === "delete") {
    const product = products.find((item) => item.id === button.dataset.id);
    if (
      product &&
      window.confirm(`Delete “${product.name}”? This permanently removes it from the storefront.`)
    ) {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) errorMessage = messageFrom(error);
      else {
        await reload(onChange);
        notifyCatalogChanged();
      }
    }
    onChange();
  }
  return true;
}

export function handleAdminInput(event) {
  if (event.target.matches("[data-admin-search]")) {
    search = event.target.value;
    const body = document.querySelector(".admin-table tbody");
    if (body) body.innerHTML = productRows(filteredProducts());
  } else if (event.target.matches("[data-admin-category]")) {
    category = event.target.value;
    const body = document.querySelector(".admin-table tbody");
    if (body) body.innerHTML = productRows(filteredProducts());
  }
}

export function handleAdminPreview(event) {
  const file = event.target.files?.[0];
  if (!file || !event.target.matches('input[name="image"]')) return;
  const preview = document.querySelector("[data-image-preview]");
  const placeholder = document.querySelector("[data-image-placeholder]");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
    const message = document.querySelector("[data-admin-image-error]");
    if (message) message.textContent = "Choose a JPEG, PNG, or WebP image smaller than 5 MB.";
    event.target.value = "";
    return;
  }
  const message = document.querySelector("[data-admin-image-error]");
  if (message) message.textContent = "";
  const source = URL.createObjectURL(file);
  if (preview) preview.src = source;
  else if (placeholder) {
    const image = document.createElement("img");
    image.src = source;
    image.alt = "Product image preview";
    image.dataset.imagePreview = "";
    placeholder.replaceWith(image);
  }
}

async function getOrCreateCollection(name) {
  const existing = collections.find(
    (item) => item.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  if (existing) return existing;

  const slug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  if (!slug) throw new Error("Enter a valid category name.");
  const { data, error } = await supabase
    .from("collections")
    .insert({ slug, name: name.trim(), sort_order: collections.length })
    .select("id, slug, name, description")
    .single();
  if (error) throw error;
  return data;
}

async function saveProduct(form) {
  const data = new FormData(form);
  const id = form.dataset.productId;
  const current = products.find((item) => item.id === id);
  const slug = String(data.get("slug") ?? "").trim();
  const name = String(data.get("name") ?? "").trim();
  const categoryName = String(data.get("category") ?? "").trim();
  const upload = data.get("image");
  const imageFile = upload instanceof File && upload.size ? upload : null;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Use a URL slug with lowercase letters, numbers, and hyphens.");
  }
  if (name.length < 2 || !categoryName) {
    throw new Error("Enter a product name and category.");
  }
  if (!current && !imageFile) {
    throw new Error("Upload a product image before creating the product.");
  }
  if (
    imageFile &&
    (!ALLOWED_IMAGE_TYPES.includes(imageFile.type) || imageFile.size > MAX_IMAGE_BYTES)
  ) {
    throw new Error("Choose a JPEG, PNG, or WebP image smaller than 5 MB.");
  }

  const variants = SIZES.map((size) => {
    const priceMinor = Math.round(Number(data.get(`price-${size}`)) * 100);
    const saleRaw = String(data.get(`sale-${size}`) ?? "").trim();
    const salePriceMinor = saleRaw ? Math.round(Number(saleRaw) * 100) : null;
    const stockQuantity = Number(data.get(`stock-${size}`));
    if (!Number.isSafeInteger(priceMinor) || priceMinor < 100 || priceMinor > 1_000_000_000) {
      throw new Error(`Enter a valid ${size} ml regular price.`);
    }
    if (
      salePriceMinor !== null &&
      (!Number.isSafeInteger(salePriceMinor) ||
        salePriceMinor < 100 ||
        salePriceMinor >= priceMinor)
    ) {
      throw new Error(`${size} ml sale price must be lower than its regular price.`);
    }
    if (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 100_000) {
      throw new Error(`Enter a valid ${size} ml stock quantity.`);
    }
    return {
      size_ml: size,
      price_minor: priceMinor,
      sale_price_minor: salePriceMinor,
      stock_quantity: stockQuantity,
    };
  });

  let imageUrl = current?.image_url ?? null;
  if (imageFile) {
    const extension = imageFile.type === "image/jpeg" ? "jpg" : imageFile.type.slice(6);
    const path = `${slug}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, imageFile, {
        contentType: imageFile.type,
        cacheControl: "31536000",
        upsert: false,
      });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
    imageUrl = publicUrl.publicUrl;
  }

  const collection = await getOrCreateCollection(categoryName);
  const { error } = await supabase.rpc("admin_save_product", {
    _product: {
      slug,
      name,
      short_description: String(data.get("description") ?? "")
        .trim()
        .slice(0, 240),
      description: String(data.get("description") ?? "").trim(),
      fragrance_family: String(data.get("family") ?? "").trim() || collection.name,
      top_notes: String(data.get("top") ?? "").trim(),
      heart_notes: String(data.get("heart") ?? "").trim(),
      base_notes: String(data.get("base") ?? "").trim(),
      image_url: imageUrl,
      featured: data.has("featured"),
      is_active: data.has("available"),
      collection_id: collection.id,
    },
    _variants: variants.map((variant) => ({
      ...variant,
      is_active: data.has("available"),
    })),
  });
  if (error) throw error;
}

export async function handleAdminSubmit(event, onChange) {
  const form = event.target.closest("form[data-admin-form]");
  if (!form) return false;
  event.preventDefault();
  errorMessage = "";

  try {
    if (form.dataset.adminForm === "login") {
      const data = new FormData(form);
      const { error } = await supabase.auth.signInWithPassword({
        email: toAdminEmail(data.get("username")),
        password: String(data.get("password") ?? ""),
      });
      if (error) throw error;
      if (!(await checkAdminAccess())) {
        onChange();
        return true;
      }
      await loadDashboard();
      view = "dashboard";
    } else {
      await saveProduct(form);
      view = "products";
      await reload(onChange);
      notifyCatalogChanged();
    }
  } catch (error) {
    errorMessage = messageFrom(error);
    if (form.dataset.adminForm === "product") {
      const message = form.querySelector(".admin-editor-message");
      if (message) message.textContent = errorMessage;
      return true;
    }
  }
  onChange();
  return true;
}

export function handleAdminAuthChange(onChange) {
  if (!supabase || authListenerRegistered) return;
  authListenerRegistered = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      status = "signed-out";
      adminEmail = "";
      initialized = true;
      onChange();
    }
  });
}
