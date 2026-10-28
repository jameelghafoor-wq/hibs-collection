import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { getProductBySlug, catalogQueryOptions } from "@/lib/catalog.functions";
import { useCart } from "@/lib/cart";
import { formatPkr } from "@/lib/format";
import { shipping } from "@/config/brand";
import { ProductCard } from "@/components/shop/product-card";
import { Reveal } from "@/components/reveal";

const productQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/perfume/$slug")({
  loader: async ({ params, context }) => {
    const product = await context.queryClient.ensureQueryData(productQueryOptions(params.slug));
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — NOIR ÉLIXIR` : "Fragrance — NOIR ÉLIXIR" },
      {
        name: "description",
        content: loaderData?.shortDescription ?? "A cinematic luxury fragrance by NOIR ÉLIXIR.",
      },
      {
        property: "og:title",
        content: loaderData ? `${loaderData.name} — NOIR ÉLIXIR` : "Fragrance — NOIR ÉLIXIR",
      },
      {
        property: "og:description",
        content: loaderData?.shortDescription ?? "A cinematic luxury fragrance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: productMaybe } = useSuspenseQuery(productQueryOptions(slug));
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions);
  if (!productMaybe) throw notFound();
  const product = productMaybe;
  const { addLine } = useCart();

  const firstInStock = product.variants.find((v) => v.stockQuantity > 0);
  const [variantId, setVariantId] = useState((firstInStock ?? product.variants[0])?.id ?? "");
  const [qty, setQty] = useState(1);

  const variant = product.variants.find((v) => v.id === variantId);
  const totalStock = product.variants.reduce((s, v) => s + v.stockQuantity, 0);

  const related = catalog.products.filter((p) => p.id !== product.id).slice(0, 4);

  const addToBag = () => {
    if (!variant || variant.stockQuantity === 0) return;
    addLine(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        sizeMl: variant.sizeMl,
        priceMinor: variant.priceMinor,
        stockQuantity: variant.stockQuantity,
        imageUrl: product.imageUrl,
      },
      qty,
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-28 sm:pt-36">
      <nav
        aria-label="Breadcrumb"
        className="micro-label flex items-center gap-2 text-[0.5625rem] text-smoke"
      >
        <Link to="/shop" className="transition-colors hover:text-gold">
          Shop
        </Link>
        <span>/</span>
        {product.collectionSlug && (
          <>
            <Link
              to="/shop"
              search={{ collection: product.collectionSlug }}
              className="transition-colors hover:text-gold"
            >
              {product.collectionName}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gold">{product.name}</span>
      </nav>

      <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div className="relative aspect-square overflow-hidden border border-border bg-charcoal">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={`${product.name} perfume bottle`}
                width={900}
                height={900}
                className="size-full object-cover"
              />
            )}
            {product.featured && (
              <span className="absolute left-4 top-4 border border-gold/50 bg-noir/70 px-3 py-1.5 text-[0.5625rem] font-semibold uppercase tracking-[0.25em] text-gold backdrop-blur-sm">
                House Signature
              </span>
            )}
          </div>
          <p className="mt-4 text-center text-xs text-smoke/60">
            Demo product photography — will be replaced with the owner's real product shots.
          </p>
        </Reveal>

        <div>
          <p className="micro-label text-gold">
            {product.collectionName ?? product.fragranceFamily ?? "Fragrance"}
          </p>
          <h1 className="headline mt-3 text-4xl text-ivory sm:text-5xl">{product.name}</h1>
          <p className="mt-5 text-sm leading-relaxed text-smoke sm:text-base">
            {product.description ?? product.shortDescription}
          </p>

          <div className="mt-8 flex items-baseline gap-4">
            <p className="font-display text-3xl text-gold">
              {variant ? formatPkr(variant.priceMinor) : ""}
            </p>
            <span
              className={`micro-label text-[0.5625rem] ${
                totalStock > 0 ? "text-ivory/80" : "text-destructive"
              }`}
            >
              {totalStock > 0
                ? totalStock <= 9
                  ? `Only ${totalStock} left`
                  : "In stock"
                : "Sold out"}
            </span>
          </div>

          <div className="mt-8">
            <p className="micro-label text-[0.625rem] text-smoke">Bottle size</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                  disabled={v.stockQuantity === 0}
                  aria-pressed={v.id === variantId}
                  className={`border px-5 py-3 text-xs uppercase tracking-[0.15em] transition-colors ${
                    v.id === variantId
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-smoke hover:border-gold/50 hover:text-ivory"
                  } ${v.stockQuantity === 0 ? "cursor-not-allowed opacity-35 line-through" : ""}`}
                >
                  {v.sizeMl} ml
                  {v.stockQuantity > 0 && v.stockQuantity <= 5 && (
                    <span className="ml-2 text-[0.5625rem] text-gold/80">
                      {v.stockQuantity} left
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="px-3.5 py-3 text-smoke transition-colors hover:text-gold"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-9 text-center text-ivory">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(variant?.stockQuantity ?? 1, q + 1))}
                disabled={!variant || qty >= variant.stockQuantity}
                aria-label="Increase quantity"
                className="px-3.5 py-3 text-smoke transition-colors hover:text-gold disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <button
              onClick={addToBag}
              disabled={!variant || variant.stockQuantity === 0}
              className="flex flex-1 items-center justify-center gap-2.5 bg-gold px-8 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              <ShoppingBag className="size-4" />
              {variant && variant.stockQuantity === 0 ? "Sold out" : "Add to Bag"}
            </button>
          </div>

          <dl className="mt-10 divide-y divide-border border-y border-border">
            {[
              { label: "Fragrance Family", value: product.fragranceFamily },
              { label: "Top Notes", value: product.topNotes },
              { label: "Heart Notes", value: product.heartNotes },
              { label: "Base Notes", value: product.baseNotes },
              { label: "SKU", value: variant?.sku },
            ]
              .filter((r) => r.value)
              .map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-6 py-3.5">
                  <dt className="micro-label shrink-0 text-[0.625rem] text-smoke">{row.label}</dt>
                  <dd className="text-right font-display text-sm tracking-wide text-ivory">
                    {row.value}
                  </dd>
                </div>
              ))}
          </dl>

          <div className="mt-8 flex items-start gap-4 border border-border bg-card p-5">
            <Truck className="mt-0.5 size-5 shrink-0 text-gold" />
            <div className="text-sm text-smoke">
              <p className="text-ivory">Delivery & payment</p>
              <p className="mt-1.5 leading-relaxed">
                {shipping.estimate}.{" "}
                {shipping.codEnabled ? "Cash on Delivery available across Pakistan." : ""} Free
                delivery over {formatPkr(shipping.freeOverMinor)}.
              </p>
              <p className="mt-1 text-xs text-smoke/70">
                Prices are demo placeholders until the owner updates the store.
              </p>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24 sm:mt-32" aria-label="Related fragrances">
          <Reveal>
            <h2 className="headline text-2xl text-ivory sm:text-3xl">
              You may also <span className="gold-gradient-text">love</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i, 3) * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
