import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { catalogQueryOptions } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/shop/product-card";
import { Reveal } from "@/components/reveal";

type ShopSearch = { collection?: string | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    const raw = search["collection"];
    return {
      collection: typeof raw === "string" && raw.length > 0 ? raw : undefined,
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  head: () => ({
    meta: [
      { title: "Shop Fragrances — NOIR ÉLIXIR" },
      {
        name: "description",
        content:
          "Browse the full NOIR ÉLIXIR collection — signature, oud, amber, floral and fresh fragrances in 30, 50 and 100 ml bottles.",
      },
      { property: "og:title", content: "Shop Fragrances — NOIR ÉLIXIR" },
      {
        property: "og:description",
        content: "Browse the full collection — signature, oud, amber, floral and fresh fragrances.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { collection } = Route.useSearch();
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions);

  const activeCollection = catalog.collections.find((c) => c.slug === collection);
  const products = activeCollection
    ? catalog.products.filter((p) => p.collectionSlug === activeCollection.slug)
    : catalog.products;

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:pt-40">
      <Reveal>
        <p className="micro-label text-gold">{activeCollection ? "Collection" : "The House"}</p>
        <h1 className="headline mt-4 text-4xl text-ivory sm:text-5xl">
          {activeCollection ? activeCollection.name : "All Fragrances"}
        </h1>
        {activeCollection?.description && (
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-smoke sm:text-base">
            {activeCollection.description}
          </p>
        )}
      </Reveal>

      <div className="mt-10 flex flex-wrap gap-2.5">
        <Link
          to="/shop"
          search={{}}
          className={`border px-4 py-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.2em] transition-colors ${
            !activeCollection
              ? "border-gold bg-gold/10 text-gold"
              : "border-border text-smoke hover:border-gold/50 hover:text-ivory"
          }`}
        >
          All
        </Link>
        {catalog.collections.map((c) => (
          <Link
            key={c.id}
            to="/shop"
            search={{ collection: c.slug }}
            className={`border px-4 py-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.2em] transition-colors ${
              activeCollection?.slug === c.slug
                ? "border-gold bg-gold/10 text-gold"
                : "border-border text-smoke hover:border-gold/50 hover:text-ivory"
            }`}
          >
            {c.name.replace(" Collection", "")}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="py-24 text-center text-smoke">No fragrances in this collection yet.</p>
      ) : (
        <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={Math.min(i, 3) * 0.08}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      )}

      <p className="mt-16 text-center text-xs text-smoke/60">
        Demo storefront — products, prices and stock are placeholders until the owner adds real
        inventory.
      </p>
    </div>
  );
}
