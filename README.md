# NOIR ÉLIXIR Storefront and Admin

The storefront remains a Vite-powered HTML, CSS, and JavaScript application:

- `index.html` contains the storefront shell.
- `style.css` contains the storefront styles and isolated admin styles.
- `script.js` contains storefront routing, cart display, and live catalog reads.
- `admin.js` contains the protected catalog dashboard and product editor.
- `supabase.js` creates a browser client using only the public publishable key.

Product, collection, price, sale, and inventory records are read from Supabase.
The admin panel at `/admin` uses Supabase Auth, Postgres Row Level Security,
and the public `product-images` Storage bucket. No admin password or service
role key is included in the browser bundle. The storefront cart and checkout
continue to calculate their preview totals from the current catalog; checkout
is still a preview and does not place or persist orders.

## Configure Supabase

Full, verified deployment instructions — including the two dashboard steps only
the project owner can perform — are in [DEPLOY.md](DEPLOY.md). In short:

1. Enable the **Email** provider in the project's Auth settings. It is disabled
   by default, and while it is off every admin sign-in fails with
   "Email logins are disabled". Turn off public sign-ups at the same time.

2. In the Supabase SQL Editor, run
   `supabase/migrations/20261026231200_admin_product_management.sql`.
   The migration is idempotent. It creates the catalog tables if missing,
   enables public catalog reads and administrator-only writes, adds sale
   prices, creates the secure administrator allowlist, configures image storage
   policies, and creates the administrator login user described below.

3. Set the public frontend environment variables in `.env` (see
   [.env.example](.env.example)), and the same `VITE_` variables in the Vercel
   project settings:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

   These are public client configuration; authorization is enforced by Supabase
   Auth and Row Level Security. Never put a service-role key in `.env`.

4. Restart Vite after changing environment variables:

   ```sh
   npm install
   npm run dev
   ```

   Open `/admin` and sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`.
   Products created there are immediately read by the storefront from the same
   catalog.

## Deployment

`vercel.json` pins the build command and output directory and rewrites `/admin`
to `index.html`. That rewrite is required: the build emits a single
`index.html`, and the admin screen is rendered client-side, so a static host
would otherwise return 404 for `/admin`.

The legacy five-product catalog was placeholder data embedded in `script.js`
and optional browser local storage; it was not a persistent product database.
It is intentionally not inserted as production data by this migration. Add
your real products and prices through `/admin` after completing Supabase setup.

## Build and tests

```sh
npm run build
npm test
npm run lint
```
