## Storefront architecture
- Catalog flows through TanStack Query options in `src/lib/catalog.functions.ts` (`catalogQueryOptions` shared key); route loaders `ensureQueryData`, components `useSuspenseQuery`. Product prices/stock always come from the server functions, never hardcoded.
- Orders: cart lines live in `src/lib/cart.tsx` (localStorage `noir-elixir-cart-v1`); checkout calls `createOrder` server fn, which revalidates prices/stock via the `create_order` DB function before persisting. Never trust client totals.
- Brand copy, prices, shipping and contact details are demo placeholders centralized in `src/config/brand.ts`; replace there (and in the DB seed) when the owner supplies real data.
