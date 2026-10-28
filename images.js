/**
 * Image URL resolution shared by the storefront and the admin panel.
 *
 * Site artwork ships in this repository (`public/images`), so the site has no
 * runtime dependency on any external asset host.
 */

const LOCAL_IMAGE_BASE = "/images/";

const BUNDLED_IMAGES = new Set([
  "collection-fresh.jpg",
  "cta-ring.jpg",
  "hero-bottle.jpg",
  "product-amber-noir.jpg",
  "product-golden-oud.jpg",
  "product-noir-elixir.jpg",
  "product-velvet-rose.jpg",
  "signature-collage.jpg",
  "story-ingredients.jpg",
]);

export const IMAGES = {
  hero: `${LOCAL_IMAGE_BASE}hero-bottle.jpg`,
  collage: `${LOCAL_IMAGE_BASE}signature-collage.jpg`,
  story: `${LOCAL_IMAGE_BASE}story-ingredients.jpg`,
  amber: `${LOCAL_IMAGE_BASE}product-amber-noir.jpg`,
  golden: `${LOCAL_IMAGE_BASE}product-golden-oud.jpg`,
  rose: `${LOCAL_IMAGE_BASE}product-velvet-rose.jpg`,
  fresh: `${LOCAL_IMAGE_BASE}collection-fresh.jpg`,
  ring: `${LOCAL_IMAGE_BASE}cta-ring.jpg`,
  noir: `${LOCAL_IMAGE_BASE}product-noir-elixir.jpg`,
};

/**
 * The seeded catalog rows store artwork as root-relative
 * `/__l5e/assets-v1/<id>/<file>` paths left over from the original hosting,
 * which 404 on any other domain. Map those onto the copy in `public/images`.
 *
 * Absolute URLs pass through untouched - notably product photos uploaded
 * through /admin, which live in the Supabase `product-images` bucket. An
 * unrecognised relative path returns empty so the caller omits the image
 * rather than emitting a link that is known to 404.
 */
export function resolveImage(src) {
  const value = String(src ?? "").trim();
  if (!value) return "";
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/__l5e/")) {
    const file = value.split("/").pop() ?? "";
    return BUNDLED_IMAGES.has(file) ? `${LOCAL_IMAGE_BASE}${file}` : "";
  }
  return value;
}
