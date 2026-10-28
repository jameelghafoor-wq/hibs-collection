import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Eye, ShoppingBag, X } from "lucide-react";
import type { Product } from "@/types/commerce";
import { useCart } from "@/lib/cart";
import { formatPkr } from "@/lib/format";

function defaultVariantId(product: Product): string {
  const variants = product.variants ?? [];
  const inStock = variants.filter((v) => v.stockQuantity > 0);
  const pool = inStock.length > 0 ? inStock : variants;
  const preferred = pool.find((v) => v.sizeMl === 50) ?? pool[0];
  return preferred?.id ?? "";
}

export function ProductCard({ product }: { product: Product }) {
  const { addLine } = useCart();
  const [quickView, setQuickView] = useState(false);
  const variants = product.variants ?? [];
  const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.priceMinor)) : 0;
  const totalStock = variants.reduce((s, v) => s + v.stockQuantity, 0);

  const quickAdd = () => {
    const variant = product.variants.find((v) => v.id === defaultVariantId(product));
    if (!variant || variant.stockQuantity === 0) return;
    addLine({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sizeMl: variant.sizeMl,
      priceMinor: variant.priceMinor,
      stockQuantity: variant.stockQuantity,
      imageUrl: product.imageUrl,
    });
  };

  return (
    <>
      <article className="group relative">
        <div className="relative aspect-[4/5] overflow-hidden border border-border bg-charcoal">
          <button
            onClick={() => setQuickView(true)}
            className="block size-full cursor-pointer"
            aria-label={`Quick view ${product.name}`}
          >
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                width={600}
                height={750}
                loading="lazy"
                className="size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              />
            )}
          </button>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-noir/85 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {product.featured && (
            <span className="absolute left-4 top-4 border border-gold/50 bg-noir/70 px-2.5 py-1 text-[0.5625rem] font-semibold uppercase tracking-[0.25em] text-gold backdrop-blur-sm">
              Signature
            </span>
          )}
          {totalStock === 0 && (
            <span className="absolute right-4 top-4 border border-border bg-noir/70 px-2.5 py-1 text-[0.5625rem] uppercase tracking-[0.25em] text-smoke backdrop-blur-sm">
              Sold out
            </span>
          )}

          <div className="absolute inset-x-4 bottom-4 flex translate-y-3 gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={() => setQuickView(true)}
              className="flex flex-1 items-center justify-center gap-2 border border-gold/50 bg-noir/80 px-3 py-3 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-gold backdrop-blur-sm transition-colors hover:bg-gold hover:text-charcoal"
            >
              <Eye className="size-3.5" />
              Quick View
            </button>
            <button
              onClick={quickAdd}
              disabled={totalStock === 0}
              aria-label={`Add ${product.name} to bag`}
              className="flex items-center justify-center border border-gold/50 bg-gold px-4 text-charcoal transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingBag className="size-4" />
            </button>
          </div>
        </div>

        <div className="pt-5">
          <p className="micro-label text-[0.5625rem] text-gold/80">
            {product.collectionName ?? product.fragranceFamily ?? "Fragrance"}
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <Link
              to="/perfume/$slug"
              params={{ slug: product.slug }}
              className="font-display text-lg tracking-wide text-ivory transition-colors hover:text-gold"
            >
              {product.name}
            </Link>
            <p className="text-sm font-medium text-gold">{formatPkr(minPrice)}</p>
          </div>
          <p className="mt-1.5 text-xs text-smoke/80">
            {product.variants.map((v) => v.sizeMl).join(" · ")} ml — Eau de Parfum
          </p>
        </div>
      </article>

      <QuickViewModal product={product} open={quickView} onClose={() => setQuickView(false)} />
    </>
  );
}

export function QuickViewModal({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  const { addLine } = useCart();
  const [variantId, setVariantId] = useState(defaultVariantId(product));

  useEffect(() => {
    if (open) setVariantId(defaultVariantId(product));
  }, [open, product]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const variant = product.variants.find((v) => v.id === variantId);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-noir/85 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view ${product.name}`}
            className="relative grid max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-border bg-charcoal sm:grid-cols-2"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={onClose}
              aria-label="Close quick view"
              className="absolute right-3 top-3 z-10 rounded-sm bg-noir/60 p-2 text-ivory transition-colors hover:text-gold"
            >
              <X className="size-5" />
            </button>
            <div className="relative aspect-square bg-noir sm:aspect-auto">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  width={600}
                  height={600}
                  loading="lazy"
                  className="size-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-col p-7 sm:p-9">
              <p className="micro-label text-gold">
                {product.collectionName ?? product.fragranceFamily ?? "Fragrance"}
              </p>
              <h3 className="headline mt-3 text-2xl text-ivory">{product.name}</h3>
              <p className="mt-4 text-sm leading-relaxed text-smoke">{product.shortDescription}</p>

              <div className="mt-6">
                <p className="micro-label text-[0.5625rem] text-smoke">Bottle size</p>
                <div className="mt-3 flex gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      disabled={v.stockQuantity === 0}
                      className={`border px-4 py-2.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                        v.id === variantId
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border text-smoke hover:border-gold/50 hover:text-ivory"
                      } ${v.stockQuantity === 0 ? "cursor-not-allowed opacity-35 line-through" : ""}`}
                    >
                      {v.sizeMl} ml
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-6 font-display text-2xl text-gold">
                {variant ? formatPkr(variant.priceMinor) : ""}
              </p>
              {variant && (
                <p className="mt-1 text-xs text-smoke">
                  {variant.stockQuantity > 0
                    ? variant.stockQuantity <= 5
                      ? `Only ${variant.stockQuantity} left`
                      : "In stock, ready to ship"
                    : "Sold out"}
                </p>
              )}

              <button
                onClick={() => {
                  if (!variant || variant.stockQuantity === 0) return;
                  addLine({
                    variantId: variant.id,
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    sizeMl: variant.sizeMl,
                    priceMinor: variant.priceMinor,
                    stockQuantity: variant.stockQuantity,
                    imageUrl: product.imageUrl,
                  });
                  onClose();
                }}
                disabled={!variant || variant.stockQuantity === 0}
                className="mt-6 flex items-center justify-center gap-2 bg-gold py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShoppingBag className="size-4" />
                Add to Bag
              </button>
              <Link
                to="/perfume/$slug"
                params={{ slug: product.slug }}
                onClick={onClose}
                className="mt-4 text-center text-xs uppercase tracking-[0.18em] text-smoke transition-colors hover:text-gold"
              >
                View full details
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
