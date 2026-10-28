import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPkr } from "@/lib/format";
import { shipping } from "@/config/brand";

export function CartDrawer() {
  const { lines, count, subtotalMinor, isOpen, closeCart, removeLine, setQty, clear } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close the drawer whenever navigation happens (e.g. Proceed to Checkout).
  useEffect(() => {
    if (isOpen) closeCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const shippingMinor =
    subtotalMinor === 0 || subtotalMinor >= shipping.freeOverMinor ? 0 : shipping.flatChargeMinor;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[80]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-noir/70 backdrop-blur-sm" onClick={closeCart} />
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-charcoal"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            aria-label="Shopping bag"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="font-display text-lg uppercase tracking-[0.2em] text-ivory">
                Your Bag <span className="text-sm text-smoke">({count})</span>
              </h2>
              <button
                onClick={closeCart}
                aria-label="Close bag"
                className="rounded-sm p-2 text-smoke transition-colors hover:text-gold"
              >
                <X className="size-5" />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
                <ShoppingBag className="size-10 text-gold/50" strokeWidth={1.2} />
                <p className="font-display text-xl uppercase tracking-[0.15em] text-ivory">
                  Your bag is empty
                </p>
                <p className="max-w-xs text-sm text-smoke">
                  Discover the collection and find the fragrance that defines you.
                </p>
                <Link
                  to="/shop"
                  onClick={closeCart}
                  className="mt-2 bg-gold px-6 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-soft"
                >
                  Explore Collection
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                  {lines.map((line) => (
                    <div key={line.variantId} className="flex gap-4">
                      <Link
                        to="/perfume/$slug"
                        params={{ slug: line.slug }}
                        onClick={closeCart}
                        className="size-20 shrink-0 overflow-hidden rounded-sm border border-border bg-noir"
                      >
                        {line.imageUrl && (
                          <img
                            src={line.imageUrl}
                            alt={line.name}
                            width={80}
                            height={80}
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        )}
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              to="/perfume/$slug"
                              params={{ slug: line.slug }}
                              onClick={closeCart}
                              className="font-display text-base tracking-wide text-ivory hover:text-gold"
                            >
                              {line.name}
                            </Link>
                            <p className="micro-label mt-1 text-[0.625rem] text-smoke">
                              {line.sizeMl} ml
                            </p>
                          </div>
                          <button
                            onClick={() => removeLine(line.variantId)}
                            aria-label={`Remove ${line.name} ${line.sizeMl}ml`}
                            className="rounded-sm p-1 text-smoke transition-colors hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center border border-border">
                            <button
                              onClick={() => setQty(line.variantId, line.qty - 1)}
                              aria-label="Decrease quantity"
                              className="px-2 py-1.5 text-smoke transition-colors hover:text-gold"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-7 text-center text-sm text-ivory">
                              {line.qty}
                            </span>
                            <button
                              onClick={() =>
                                setQty(line.variantId, Math.min(line.qty + 1, line.stockQuantity))
                              }
                              disabled={line.qty >= line.stockQuantity}
                              aria-label="Increase quantity"
                              className="px-2 py-1.5 text-smoke transition-colors hover:text-gold disabled:opacity-40"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gold">
                            {formatPkr(line.priceMinor * line.qty)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={clear}
                    className="micro-label text-[0.625rem] text-smoke/70 transition-colors hover:text-destructive"
                  >
                    Clear bag
                  </button>
                </div>

                <div className="border-t border-border px-6 py-5">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-smoke">
                      <span>Subtotal</span>
                      <span className="text-ivory">{formatPkr(subtotalMinor)}</span>
                    </div>
                    <div className="flex justify-between text-smoke">
                      <span>Delivery</span>
                      <span className="text-ivory">
                        {shippingMinor === 0 ? "Free" : formatPkr(shippingMinor)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2.5 text-base">
                      <span className="text-ivory">Total</span>
                      <span className="font-semibold text-gold">
                        {formatPkr(subtotalMinor + shippingMinor)}
                      </span>
                    </div>
                  </div>
                  {subtotalMinor < shipping.freeOverMinor && (
                    <p className="mt-2 text-xs text-smoke/80">
                      Free delivery over {formatPkr(shipping.freeOverMinor)}.
                    </p>
                  )}
                  <Link
                    to="/checkout"
                    onClick={closeCart}
                    className="mt-4 flex w-full items-center justify-center gap-2 bg-gold py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-soft"
                  >
                    Proceed to Checkout
                  </Link>
                  <button
                    onClick={closeCart}
                    className="mt-3 w-full text-center text-xs uppercase tracking-[0.18em] text-smoke transition-colors hover:text-ivory"
                  >
                    Continue shopping
                  </button>
                  <p className="mt-3 text-center text-[0.6875rem] text-smoke/70">
                    Cash on Delivery available across Pakistan.
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
