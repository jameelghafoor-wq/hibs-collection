create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  description text,
  fragrance_family text,
  top_notes text,
  heart_notes text,
  base_notes text,
  image_url text,
  featured boolean not null default false,
  collection_id uuid references public.collections(id) on delete set null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_ml int not null,
  sku text not null unique,
  price_minor bigint not null check (price_minor >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  email text not null,
  city text not null,
  address text not null,
  notes text,
  subtotal_minor bigint not null,
  shipping_minor bigint not null,
  total_minor bigint not null,
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  payment_method text not null default 'cod',
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  size_ml int not null,
  quantity int not null,
  unit_price_minor bigint not null
);

-- Public catalog: anonymous + authenticated may read only.
grant select on public.collections to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_variants to anon, authenticated;
-- Orders hold customer data: service role only (order creation runs server-side).
grant all on public.orders to service_role;
grant all on public.order_items to service_role;
grant all on public.collections to service_role;
grant all on public.products to service_role;
grant all on public.product_variants to service_role;

alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Public read collections" on public.collections for select to anon, authenticated using (true);
create policy "Public read products" on public.products for select to anon, authenticated using (true);
create policy "Public read product variants" on public.product_variants for select to anon, authenticated using (true);
-- No policies on orders / order_items: anon and authenticated are locked out.

create or replace function public.create_order(_customer jsonb, _items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal bigint := 0;
  v_shipping bigint;
  v_item jsonb;
  v_variant record;
  v_qty int;
  v_line_total bigint;
  v_lines jsonb := '[]'::jsonb;
begin
  if _items is null or jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Your cart is empty.');
  end if;

  for v_item in select * from jsonb_array_elements(_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      return jsonb_build_object('ok', false, 'error', 'Invalid quantity.');
    end if;

    select pv.id, pv.price_minor, pv.stock_quantity, pv.is_active,
           pv.size_ml, p.name, p.is_active as product_active
      into v_variant
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
      where pv.id = (v_item->>'variant_id')::uuid;

    if not found or not v_variant.is_active or not v_variant.product_active then
      return jsonb_build_object('ok', false, 'error', 'Some items in your cart are no longer available.');
    end if;
    if v_variant.stock_quantity < v_qty then
      return jsonb_build_object('ok', false, 'error', 'Only ' || v_variant.stock_quantity || ' left of ' || v_variant.name || ' ' || v_variant.size_ml || 'ml.');
    end if;

    v_line_total := v_variant.price_minor * v_qty;
    v_subtotal := v_subtotal + v_line_total;
    v_lines := v_lines || jsonb_build_object(
      'variant_id', v_variant.id,
      'name', v_variant.name,
      'size_ml', v_variant.size_ml,
      'qty', v_qty,
      'unit_price_minor', v_variant.price_minor
    );
  end loop;

  if v_subtotal >= 800000 then
    v_shipping := 0;
  else
    v_shipping := 25000;
  end if;

  v_order_number := 'NE-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders
    (order_number, customer_name, phone, email, city, address, notes,
     subtotal_minor, shipping_minor, total_minor, status, payment_method)
  values
    (v_order_number, _customer->>'full_name', _customer->>'phone', _customer->>'email',
     _customer->>'city', _customer->>'address', _customer->>'notes',
     v_subtotal, v_shipping, v_subtotal + v_shipping, 'pending', 'cod')
  returning id into v_order_id;

  insert into public.order_items (order_id, variant_id, product_name, size_ml, quantity, unit_price_minor)
  select v_order_id, (l->>'variant_id')::uuid, l->>'name', (l->>'size_ml')::int,
         (l->>'qty')::int, (l->>'unit_price_minor')::bigint
  from jsonb_array_elements(v_lines) l;

  update public.product_variants pv
    set stock_quantity = pv.stock_quantity - (l->>'qty')::int
  from jsonb_array_elements(v_lines) l
  where pv.id = (l->>'variant_id')::uuid
    and pv.stock_quantity >= (l->>'qty')::int;

  return jsonb_build_object(
    'ok', true,
    'order_number', v_order_number,
    'subtotal_minor', v_subtotal,
    'shipping_minor', v_shipping,
    'total_minor', v_subtotal + v_shipping,
    'items', v_lines
  );
end;
$$;

revoke execute on function public.create_order(jsonb, jsonb) from anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;