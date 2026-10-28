# Roadmap — NOIR ÉLIXIR cinematic perfume storefront

Reference: 14s webmotion_studio barbershop site video — dark cinematic full-viewport
slideshow, gold/cream editorial typography, transparent header, dots navigation,
scroll indicator, service cards, glowing gold ring CTA, dark footer.

## Done
- Analyzed reference video (frames extracted, all sections identified)
- Supabase backend provisioned

## In progress
- [ ] Design system (styles.css) — noir/gold tokens, Playfair Display + Jost
- [ ] Brand config (src/config/brand.ts) — placeholder, easily replaceable
- [ ] DB migration: collections, products, product_variants, orders, order_items + RLS + seed (PKR, paisa)
- [ ] Images: hero, signature collage, story ingredients, CTA ring, 4 product shots, 5 collections
- [ ] Cart context + drawer (localStorage, paisa math, live count)
- [ ] Home page: cinematic slideshow (5 slides), collections, signature fragrance, story, CTA, footer
- [ ] Header: transparent→dark, search, cart bag, mobile menu
- [ ] Shop /shop with collection filter, quick view
- [ ] Product page /perfume/$slug with size variants
- [ ] Checkout /checkout → server-validated order creation → confirmation
- [ ] Story /story, Contact /contact pages
- [ ] Animations (motion), prefers-reduced-motion
- [ ] Visual QA vs reference (Playwright), mobile check
- [ ] End-to-end order flow test

## Notes
- Prices stored in paisa (integer minor units), displayed as PKR.
- COD only; no online payment integration until user provides a provider.
- Brand = placeholder NOIR ÉLIXIR; all copy/prices are demo until user replaces.
