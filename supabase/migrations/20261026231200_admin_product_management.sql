create schema if not exists private;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
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

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_ml int not null,
  sku text not null unique,
  price_minor bigint not null check (price_minor >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true
);

alter table public.product_variants
  add column if not exists sale_price_minor bigint;

alter table public.product_variants
  drop constraint if exists product_variants_sale_price_check;

alter table public.product_variants
  add constraint product_variants_sale_price_check
  check (sale_price_minor is null or (sale_price_minor > 0 and sale_price_minor < price_minor));

create unique index if not exists product_variants_product_size_unique
  on public.product_variants (product_id, size_ml);

create table if not exists private.store_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

revoke all on schema private from public, anon, authenticated;
revoke all on table private.store_admins from public, anon, authenticated;

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.store_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_store_admin() from public, anon;
grant execute on function public.is_store_admin() to anon, authenticated;

grant select on public.collections, public.products, public.product_variants to anon, authenticated;
grant insert, update, delete on public.collections, public.products, public.product_variants to authenticated;

alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;

drop policy if exists "Public read collections" on public.collections;
create policy "Public read collections"
  on public.collections for select to anon, authenticated using (true);
drop policy if exists "Admins manage collections" on public.collections;
create policy "Admins manage collections"
  on public.collections for all to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

drop policy if exists "Public read products" on public.products;
create policy "Public read products"
  on public.products for select to anon, authenticated
  using (is_active or (select public.is_store_admin()));
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

drop policy if exists "Public read product variants" on public.product_variants;
create policy "Public read product variants"
  on public.product_variants for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.products
      where products.id = product_variants.product_id and products.is_active
    )
    or (select public.is_store_admin())
  );
drop policy if exists "Admins manage product variants" on public.product_variants;
create policy "Admins manage product variants"
  on public.product_variants for all to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

create or replace function public.admin_save_product(_product jsonb, _variants jsonb)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_product_id uuid;
  v_variant jsonb;
  v_slug text;
  v_size int;
  v_price bigint;
  v_sale bigint;
  v_stock int;
begin
  if not public.is_store_admin() then
    raise exception 'Administrator permission required.';
  end if;

  v_slug := _product->>'slug';
  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or length(_product->>'name') not between 2 and 120
     or length(_product->>'description') not between 1 and 2000
     or _product->>'image_url' is null then
    raise exception 'Invalid product details.';
  end if;
  if jsonb_typeof(_variants) <> 'array' or jsonb_array_length(_variants) <> 3 then
    raise exception 'Exactly three bottle sizes are required.';
  end if;

  insert into public.products (
    slug, name, short_description, description, fragrance_family,
    top_notes, heart_notes, base_notes, image_url, featured,
    collection_id, is_active
  )
  values (
    v_slug, _product->>'name', _product->>'short_description',
    _product->>'description', _product->>'fragrance_family',
    _product->>'top_notes', _product->>'heart_notes', _product->>'base_notes',
    _product->>'image_url', coalesce((_product->>'featured')::boolean, false),
    (_product->>'collection_id')::uuid, coalesce((_product->>'is_active')::boolean, true)
  )
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
    collection_id = excluded.collection_id,
    is_active = excluded.is_active
  returning id into v_product_id;

  for v_variant in select * from jsonb_array_elements(_variants) loop
    v_size := (v_variant->>'size_ml')::int;
    v_price := (v_variant->>'price_minor')::bigint;
    v_sale := nullif(v_variant->>'sale_price_minor', '')::bigint;
    v_stock := (v_variant->>'stock_quantity')::int;
    if v_size not in (30, 50, 100)
       or v_price < 100 or v_price > 1000000000
       or (v_sale is not null and (v_sale < 100 or v_sale >= v_price))
       or v_stock < 0 or v_stock > 100000 then
      raise exception 'Invalid size, price, sale price, or stock quantity.';
    end if;

    insert into public.product_variants (
      product_id, size_ml, sku, price_minor, sale_price_minor,
      stock_quantity, is_active
    )
    values (
      v_product_id, v_size, v_slug || '-' || v_size || 'ml',
      v_price, v_sale, v_stock,
      coalesce((v_variant->>'is_active')::boolean, true)
    )
    on conflict (product_id, size_ml) do update set
      sku = excluded.sku,
      price_minor = excluded.price_minor,
      sale_price_minor = excluded.sale_price_minor,
      stock_quantity = excluded.stock_quantity,
      is_active = excluded.is_active;
  end loop;

  return v_product_id;
end;
$$;

revoke all on function public.admin_save_product(jsonb, jsonb) from public, anon;
grant execute on function public.admin_save_product(jsonb, jsonb) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select to public
  using (bucket_id = 'product-images');
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_store_admin()));
drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_store_admin()))
  with check (bucket_id = 'product-images' and (select public.is_store_admin()));
drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_store_admin()));

-- ---------------------------------------------------------------------------
-- Administrator login user
-- ---------------------------------------------------------------------------
-- Creates (or re-syncs the password of) the Supabase Auth user that the /admin
-- login form signs in with, and adds it to the private administrator allowlist.
-- Keep these two values in step with ADMIN_USERNAME / ADMIN_PASSWORD in .env.
-- The login screen accepts the bare username and appends '@noirelixir.com'.
-- Re-running this block is safe: it resets the password to the value below.

set search_path = extensions, public, auth, pg_catalog;

do $admin$
declare
  v_email    text := 'admin@noirelixir.com';
  v_password text := 'admin1234';
  v_user_id  uuid;
  v_column   text;
begin
  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    )
    values (
      '00000000-0000-0000-0000-000000000000', v_user_id,
      'authenticated', 'authenticated', v_email,
      crypt(v_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
    );
  else
    update auth.users
    set encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = v_user_id;
  end if;

  -- GoTrue reads several token columns as non-nullable strings; a NULL there
  -- makes password sign-in fail with "converting NULL to string is unsupported".
  -- Only columns that actually exist in this Supabase version are touched.
  for v_column in
    select column_name
    from information_schema.columns
    where table_schema = 'auth' and table_name = 'users'
      and column_name in (
        'confirmation_token', 'recovery_token', 'email_change',
        'email_change_token_new', 'email_change_token_current',
        'phone_change', 'phone_change_token', 'reauthentication_token'
      )
  loop
    execute format(
      'update auth.users set %1$I = %2$L where id = %3$L and %1$I is null',
      v_column, '', v_user_id
    );
  end loop;

  -- Identity row for the email provider. Column names vary between GoTrue
  -- versions, so build the insert from the columns this project actually has.
  if to_regclass('auth.identities') is not null
     and not exists (
       select 1 from auth.identities
       where user_id = v_user_id and provider = 'email'
     ) then
    begin
      if exists (
        select 1 from information_schema.columns
        where table_schema = 'auth' and table_name = 'identities'
          and column_name = 'provider_id'
      ) then
        insert into auth.identities (
          user_id, provider, provider_id, identity_data, created_at, updated_at
        )
        values (
          v_user_id, 'email', v_user_id::text,
          jsonb_build_object('sub', v_user_id::text, 'email', v_email,
                             'email_verified', true, 'phone_verified', false),
          now(), now()
        );
      else
        insert into auth.identities (
          user_id, provider, identity_data, created_at, updated_at
        )
        values (
          v_user_id, 'email',
          jsonb_build_object('sub', v_user_id::text, 'email', v_email),
          now(), now()
        );
      end if;
    exception when others then
      raise notice 'Skipped auth.identities row: %', sqlerrm;
    end;
  end if;

  insert into private.store_admins (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  raise notice 'Administrator ready: % (%)', v_email, v_user_id;
end
$admin$;

reset search_path;
