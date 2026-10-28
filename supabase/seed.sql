-- Catalog seed for NOIR ELIXIR.
--
-- Run this AFTER 20261026231200_admin_product_management.sql, which creates
-- the tables this file fills. Safe to re-run: rows are matched on their slug
-- and updated in place, so it will not duplicate anything.
--
-- Image paths point at /images/<file>, which ships in public/images. Photos
-- uploaded later through /admin get absolute Supabase Storage URLs instead.

begin;

insert into public.collections (slug, name, description, image_url, sort_order) values
  ('signature', 'Signature Collection', 'The house''s defining compositions — bold, unmistakable, created to be worn as a signature.', '/images/hero-bottle.jpg', 1),
  ('oud', 'Oud Collection', 'Rare Cambodian oud aged and blended with resins, rose and spice for deep, meditative warmth.', '/images/product-golden-oud.jpg', 2),
  ('amber', 'Amber Collection', 'Golden amber, labdanum and warm resins that glow on the skin through every season.', '/images/product-amber-noir.jpg', 3),
  ('floral', 'Floral Collection', 'Damask rose and luminous white petals — romantic without sweetness.', '/images/product-velvet-rose.jpg', 4),
  ('fresh', 'Fresh Collection', 'Bergamot, fig leaf and green citrus — light, elegant and effortlessly modern.', '/images/collection-fresh.jpg', 5)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;

insert into public.products (
  slug, name, short_description, description, fragrance_family,
  top_notes, heart_notes, base_notes, image_url, featured, is_active,
  sort_order, collection_id
) values
  ('noir-elixir', 'Noir Élixir', 'The house signature — saffron and bergamot opening into rose and amber over a foundation of oud.', 'Noir Élixir is the fragrance that named the house. It opens with a striking duet of sparkling bergamot and leathered saffron, before a heart of rose and amber draws it inward. Hours later it rests on oud, musk and sandalwood — a dark, velvet trail that lingers close to the skin. Built at extrait strength for exceptional depth.', 'Woody Oriental', 'Bergamot, Saffron', 'Rose, Amber', 'Oud, Musk, Sandalwood', '/images/product-noir-elixir.jpg', true, true, 1, (select id from public.collections where slug = 'signature')),
  ('golden-oud', 'Golden Oud', 'Aged Cambodian oud wrapped in golden amber, rose and warm spice.', 'Golden Oud centers on genuine aged oud, polished rather than rough — framed by saffron and cardamom, deepened by rose and amber, and grounded in sandalwood and musk. It wears like quiet power: resinous, warm and unmistakably rich.', 'Oud / Amber', 'Saffron, Cardamom', 'Oud, Rose', 'Amber, Sandalwood, Musk', '/images/product-golden-oud.jpg', true, true, 2, (select id from public.collections where slug = 'oud')),
  ('velvet-rose', 'Velvet Rose', 'Damask rose in full bloom, softened with peony, musk and vanilla.', 'Velvet Rose captures the Taif damask rose at its most opulent — bright lychee and bergamot lead into a heart of rose and peony, settling onto clean musk and a whisper of vanilla. Romantic, velvety and modern, never sweet.', 'Floral', 'Lychee, Bergamot', 'Damask Rose, Peony', 'Musk, Vanilla', '/images/product-velvet-rose.jpg', false, true, 3, (select id from public.collections where slug = 'floral')),
  ('amber-noir', 'Amber Noir', 'Smoked amber and labdanum over tonka bean and dark leather.', 'Amber Noir is an evening composition — bitter orange flickers over molten amber and labdanum, resting on tonka bean and supple leather. Intimate, magnetic and built for the hours after dark.', 'Amber', 'Bitter Orange', 'Amber, Labdanum', 'Tonka Bean, Leather', '/images/product-amber-noir.jpg', true, true, 4, (select id from public.collections where slug = 'amber'))
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  fragrance_family = excluded.fragrance_family,
  top_notes = excluded.top_notes,
  heart_notes = excluded.heart_notes,
  base_notes = excluded.base_notes,
  image_url = excluded.image_url,
  featured = excluded.featured,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  collection_id = excluded.collection_id;

insert into public.product_variants (product_id, size_ml, sku, price_minor, stock_quantity, is_active) values
  ((select id from public.products where slug = 'noir-elixir'), 30, 'NE-NOI-30', 850000, 12, true),
  ((select id from public.products where slug = 'noir-elixir'), 50, 'NE-NOI-50', 1250000, 7, true),
  ((select id from public.products where slug = 'noir-elixir'), 100, 'NE-NOI-100', 1850000, 5, true),
  ((select id from public.products where slug = 'golden-oud'), 30, 'NE-GOL-30', 950000, 10, true),
  ((select id from public.products where slug = 'golden-oud'), 50, 'NE-GOL-50', 1450000, 6, true),
  ((select id from public.products where slug = 'golden-oud'), 100, 'NE-GOL-100', 2150000, 4, true),
  ((select id from public.products where slug = 'velvet-rose'), 30, 'NE-VEL-30', 750000, 15, true),
  ((select id from public.products where slug = 'velvet-rose'), 50, 'NE-VEL-50', 1150000, 9, true),
  ((select id from public.products where slug = 'velvet-rose'), 100, 'NE-VEL-100', 1650000, 7, true),
  ((select id from public.products where slug = 'amber-noir'), 30, 'NE-AMB-30', 800000, 11, true),
  ((select id from public.products where slug = 'amber-noir'), 50, 'NE-AMB-50', 1200000, 7, true),
  ((select id from public.products where slug = 'amber-noir'), 100, 'NE-AMB-100', 1750000, 5, true)
on conflict (product_id, size_ml) do update set
  sku = excluded.sku,
  price_minor = excluded.price_minor,
  stock_quantity = excluded.stock_quantity,
  is_active = excluded.is_active;

commit;
