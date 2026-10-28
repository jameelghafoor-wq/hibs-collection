# Deploying NOIR ÉLIXIR to Vercel

Three things have to be done in order. Steps 1 and 2 are in the Supabase
dashboard and only you can do them — they need privileges that the publishable
key in `.env` does not have.

Backend: Supabase project `dpxptwbuvpzoeafrngdo` (Singapore).
Current state, verified on 2026-10-28:

| Check                                    | Result                          |
| ---------------------------------------- | ------------------------------- |
| Project reachable, anon key valid        | Working                         |
| Catalog tables                           | **Missing** — run step 2        |
| Catalog rows (4 products, 5 collections) | **Missing** — run step 3        |
| Email/password sign-in                   | Already enabled                 |
| Public sign-ups                          | **Open** — turn off, see step 1 |
| `/admin` route in production             | Handled by `vercel.json`        |

---

## 1. Enable email/password sign-in

The admin login signs in with Supabase Auth. Right now the backend reports
`email_provider_disabled`, so every sign-in attempt fails with "Email logins
are disabled" regardless of the password.

In the Supabase dashboard: Authentication → Sign In / Providers → **Email** →
enable. Leave "Confirm email" as it is; the migration marks the admin user as
already confirmed.

While you are there, turn **off** public sign-ups ("Allow new users to sign up").
Nothing on the storefront creates accounts, and leaving it on lets strangers
register. They would still see nothing — every write is gated on the
`private.store_admins` allowlist — but there is no reason to allow it.

## 2. Run the migration

Open the Supabase **SQL Editor**, paste the whole of
`supabase/migrations/20261026231200_admin_product_management.sql`, and run it.

It is idempotent — safe to run again. In one pass it:

- creates the catalog tables if they are missing,
- adds `product_variants.sale_price_minor` and its "sale must be below regular
  price" constraint,
- creates `private.store_admins` and `public.is_store_admin()`,
- enables Row Level Security: anonymous visitors can read only active products,
  and only allowlisted admins can write,
- creates the `admin_save_product` function that validates every price, sale
  price and stock value in the database rather than trusting the browser,
- creates the public `product-images` storage bucket (5 MB, JPEG/PNG/WebP) with
  admin-only upload policies,
- creates the administrator login user and adds it to the allowlist.

You should see a notice like `Administrator ready: admin@noirelixir.com (…)`.

### Verifying it worked

```sh
U="https://dpxptwbuvpzoeafrngdo.supabase.co"
K="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweHB0d2J1dnB6b2VhZnJuZ2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNzAzNzEsImV4cCI6MjEwODc0NjM3MX0.h-rn20AcALL-t1Cw-LqlImuBbgd-w8ciB1Eev6wem6k"

# Should return rows, not "column does not exist"
curl -s "$U/rest/v1/product_variants?select=sku,price_minor,sale_price_minor&limit=1" -H "apikey: $K"

# Should return false (you are anonymous), not a 404
curl -s -X POST "$U/rest/v1/rpc/is_store_admin" -H "apikey: $K" -H 'content-type: application/json' -d '{}'

# Should return an access_token
curl -s -X POST "$U/auth/v1/token?grant_type=password" -H "apikey: $K" \
  -H 'content-type: application/json' \
  -d '{"email":"admin@noirelixir.com","password":"admin1234"}'
```

## 3. Deploy to Vercel

1. Import the project. Vercel detects Vite; `vercel.json` already pins the
   build command (`npm run build`) and output directory (`dist`).
2. Add these two environment variables under **Settings → Environment Variables**,
   for Production, Preview and Development. These are the only two the site
   reads:

   | Name                            | Value                                                                                                                                                                                                              |
   | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | `VITE_SUPABASE_URL`             | `https://dpxptwbuvpzoeafrngdo.supabase.co`                                                                                                                                                                         |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweHB0d2J1dnB6b2VhZnJuZ2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNzAzNzEsImV4cCI6MjEwODc0NjM3MX0.h-rn20AcALL-t1Cw-LqlImuBbgd-w8ciB1Eev6wem6k` |

   Set them in the dashboard rather than relying on a committed `.env`. Do not
   add `ADMIN_USERNAME` or `ADMIN_PASSWORD` to Vercel — nothing in the build reads
   them; they live in `.env` purely as your own record of the login.

3. Deploy, then open `https://<your-domain>/admin`.

`vercel.json` rewrites `/admin` to `index.html`. Without that rewrite a static
host returns 404 for `/admin`, because the build emits a single `index.html`
and the admin screen is rendered client-side by `script.js`.

---

## Admin login

|          |                               |
| -------- | ----------------------------- |
| URL      | `https://<your-domain>/admin` |
| Username | `admin`                       |
| Password | `admin1234`                   |

Both values are recorded in `.env` as `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

You type the bare username `admin`. Supabase Auth identifies users by email
address, so the login screen appends `@noirelixir.com` before signing in; the
stored user is `admin@noirelixir.com`. The domain is `ADMIN_EMAIL_DOMAIN` in
`admin.js`.

> **Change this password.** `admin` / `admin1234` is the first pair any
> automated scanner tries, and `/admin` is publicly reachable. It is fine for
> handover, not for a live store.

### Changing the password

Change it in two places and re-run the migration:

1. `ADMIN_PASSWORD` in `.env`.
2. `v_password` in the "Administrator login user" block at the bottom of
   `supabase/migrations/20261026231200_admin_product_management.sql`.

Re-running the migration resets the stored password to that value. You can also
change it from the Supabase dashboard (Authentication → Users), but then update
`.env` to match or the file will be misleading.

### How the admin panel is secured

The password is **not** in the browser bundle — `ADMIN_USERNAME` and
`ADMIN_PASSWORD` have no `VITE_` prefix, so Vite never inlines them. The login
form posts the typed credentials to Supabase Auth, which returns a JWT. Every
subsequent write carries that JWT, and Postgres Row Level Security checks
`public.is_store_admin()` against the `private.store_admins` table — a table
that `anon` and `authenticated` cannot read at all.

This means `/admin` being publicly reachable is not a weakness: an unauthorised
visitor gets the login screen, and even a signed-in non-admin account can
neither read the private allowlist nor write a single catalog row.

### Granting a second administrator

Create the user in Authentication → Users, copy its UUID, then:

```sql
insert into private.store_admins (user_id) values ('THE-USER-UUID');
```

---

## Known gap: checkout does not record orders

This is not a regression and not something this deployment work changed, but
you should know before launching: the storefront's checkout at `#/checkout` is
a **preview only**. It validates the form and shows a total, then stops. It
does not write to the `orders` table, email anyone, or take payment — the page
and the footer both say so on screen.

So after deploying you have a working catalog and a working admin panel, but no
way to receive an order. Making checkout real needs an `orders` /`order_items`
write path with server-side re-validation of prices and stock (never trusting
the browser's total), plus a Cash-on-Delivery confirmation flow. Say the word
and I will build it.

---

## Images are served from this repository

The catalog rows store artwork as root-relative
`/__l5e/assets-v1/<id>/<file>` paths, which resolve **only** on the
domain they were originally hosted on. On a Vercel domain every one of them
would 404, and
because `safeImage` hides images that fail to load, the pages would have come
up silently missing all artwork rather than visibly broken.

The nine images now live in `public/images/` and ship with the build.
`images.js` maps those legacy paths onto the local copies, so no database
change is needed. Absolute URLs pass through untouched — which is what product
photos uploaded through `/admin` are, since those go to the Supabase
`product-images` storage bucket.

No action needed from you; this is already fixed. It is recorded here because
it is the kind of thing that only shows up once the domain changes.

---

## Moving to a different Supabase project

The site reads exactly two variables, both in `supabase.js`:
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. So the swap is those two
values plus a database that has the schema and the catalog in it.

A new project starts completely empty, so the order matters.

1. **Create the project.** Note its region; everything else is default.

2. **Copy the credentials.** Project Settings → API:
   - Project URL → `VITE_SUPABASE_URL`
   - the publishable / anon key → `VITE_SUPABASE_PUBLISHABLE_KEY`

   Either key generation works. `supabase.js` detects the new opaque
   `sb_publishable_…` format and sends it only as an `apikey` header, and
   passes a legacy anon JWT through as a bearer token. Never use the
   `service_role` / `sb_secret_…` key here — it bypasses Row Level Security
   and would be readable by anyone who opens the site.

3. **Create the schema.** SQL Editor → run
   `supabase/migrations/20261026231200_admin_product_management.sql`.
   This also creates the admin login user, so the credentials in `.env` carry
   over unchanged.

4. **Load the catalog.** SQL Editor → run `supabase/seed.sql`. That restores
   the 5 collections, 4 products and 12 size variants with their prices and
   stock. Without this step the new project has the tables but no products,
   and the storefront shows "The collection is being prepared."

5. **Enable email sign-in.** Authentication → Sign In / Providers → **Email**
   → on, and public sign-ups off. This is per-project, so a new project needs
   it again.

6. **Update the credentials in both places.** `.env` locally, and the Vercel
   environment variables. Then redeploy — Vite inlines `VITE_*` at build time,
   so the old values stay live until a new build runs.

7. **Update `supabase/config.toml`** with the new `project_id`. Only the
   Supabase CLI reads it; the site does not.

### What does not carry over

- **Product photos uploaded through `/admin`.** Those live in the old
  project's `product-images` storage bucket and are stored as absolute URLs.
  The migration recreates the bucket, but not its contents — re-upload those
  photos through `/admin`. The nine original images are unaffected: they ship
  in `public/images` and are referenced by relative path.
- **Orders**, if an order flow exists by then.
- **Any extra admin users** beyond the one the migration creates.

### Verifying the swap

With `U` and `K` set to the new URL and key:

```sh
curl -s "$U/rest/v1/products?select=slug,name" -H "apikey: $K"          # 4 rows
curl -s "$U/rest/v1/collections?select=slug" -H "apikey: $K"            # 5 rows
curl -s -X POST "$U/rest/v1/rpc/is_store_admin" -H "apikey: $K" \
  -H 'content-type: application/json' -d '{}'                           # false
curl -s -X POST "$U/auth/v1/token?grant_type=password" -H "apikey: $K" \
  -H 'content-type: application/json' \
  -d '{"email":"admin@noirelixir.com","password":"admin1234"}'          # access_token
```

A `false` from `is_store_admin` is correct — you are anonymous. A 404 there
means step 3 did not run.
