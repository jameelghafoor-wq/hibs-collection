import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { createOrder, type OrderResult } from "@/lib/orders.functions";
import { orderInputSchema } from "@/lib/schemas";
import { formatPkr } from "@/lib/format";
import { shipping } from "@/config/brand";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — NOIR ÉLIXIR" },
      {
        name: "description",
        content: "Complete your NOIR ÉLIXIR order — Cash on Delivery across Pakistan.",
      },
      { property: "og:title", content: "Checkout — NOIR ÉLIXIR" },
      {
        property: "og:description",
        content: "Complete your order — Cash on Delivery across Pakistan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

const checkoutFormSchema = orderInputSchema.omit({ items: true });
type CheckoutForm = z.infer<typeof checkoutFormSchema>;

function CheckoutPage() {
  const { lines, subtotalMinor, clear } = useCart();
  const navigate = useNavigate();
  const createOrderFn = useServerFn(createOrder);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Extract<OrderResult, { ok: true }> | null>(null);

  const shippingMinor =
    subtotalMinor === 0 || subtotalMinor >= shipping.freeOverMinor ? 0 : shipping.flatChargeMinor;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { notes: "" },
  });

  useEffect(() => {
    if (lines.length === 0 && !placed && !placing && !error) {
      navigate({ to: "/shop", replace: true });
    }
  }, [lines.length, placed, placing, error, navigate]);

  const onSubmit = async (values: CheckoutForm) => {
    setPlacing(true);
    setError(null);
    try {
      const result = await createOrderFn({
        data: {
          ...values,
          items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
        },
      });
      if (result.ok) {
        clear();
        setPlaced(result);
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong while placing your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-32 sm:pt-40">
        <div className="border border-gold/30 bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto size-12 text-gold" strokeWidth={1.4} />
          <h1 className="headline mt-6 text-3xl text-ivory">Order Placed</h1>
          <p className="micro-label mt-3 text-gold">{placed.orderNumber}</p>
          <p className="mt-6 text-sm leading-relaxed text-smoke">
            Thank you. Your order has been received and is being prepared. You will pay{" "}
            <span className="font-semibold text-gold">{formatPkr(placed.totalMinor)}</span> in cash
            when your fragrances are delivered.
          </p>
          <dl className="mt-8 divide-y divide-border border-y border-border text-left">
            {placed.items.map((item, i) => (
              <div
                key={`${item.name}-${item.sizeMl}-${i}`}
                className="flex items-baseline justify-between gap-4 py-3 text-sm"
              >
                <dt className="text-ivory">
                  {item.name}{" "}
                  <span className="text-smoke">
                    — {item.sizeMl} ml × {item.qty}
                  </span>
                </dt>
                <dd className="text-smoke">{formatPkr(item.unitPriceMinor * item.qty)}</dd>
              </div>
            ))}
            <div className="flex justify-between py-3 text-sm text-smoke">
              <dt>Subtotal</dt>
              <dd>{formatPkr(placed.subtotalMinor)}</dd>
            </div>
            <div className="flex justify-between py-3 text-sm text-smoke">
              <dt>Delivery</dt>
              <dd>{placed.shippingMinor === 0 ? "Free" : formatPkr(placed.shippingMinor)}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-ivory">Total payable</dt>
              <dd className="font-semibold text-gold">{formatPkr(placed.totalMinor)}</dd>
            </div>
          </dl>
          <p className="mt-6 text-xs text-smoke/70">
            Keep your order number for any support request. An order confirmation appears here only
            after the order was successfully recorded.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center justify-center bg-gold px-8 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-soft"
          >
            Continue Exploring
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-28 sm:pt-36">
      <p className="micro-label text-gold">Checkout</p>
      <h1 className="headline mt-3 text-4xl text-ivory sm:text-5xl">
        Complete Your <span className="gold-gradient-text">Order</span>
      </h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label="Full name"
              error={errors.fullName?.message}
              {...register("fullName")}
              className="sm:col-span-2"
            />
            <Field label="Phone number" error={errors.phone?.message} {...register("phone")} />
            <Field
              label="Email address"
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Field label="City" error={errors.city?.message} {...register("city")} />
            <Field
              label="Complete delivery address"
              error={errors.address?.message}
              {...register("address")}
              className="sm:col-span-2"
            />
            <label className="sm:col-span-2">
              <span className="micro-label text-[0.625rem] text-smoke">Order notes (optional)</span>
              <textarea
                rows={3}
                maxLength={1000}
                {...register("notes")}
                className="mt-2 w-full border border-input bg-noir/60 px-4 py-3 text-sm text-ivory placeholder:text-smoke/50 focus:border-gold focus:outline-none"
                placeholder="Anything we should know about delivery…"
              />
            </label>
          </div>

          <div className="mt-8 flex items-start gap-4 border border-border bg-card p-5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold" />
            <div className="text-sm text-smoke">
              <p className="text-ivory">Cash on Delivery</p>
              <p className="mt-1.5 leading-relaxed">
                Pay in cash when your order arrives. Prices and stock are re-verified on our server
                before the order is confirmed.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start justify-between gap-4 border border-destructive/40 bg-destructive/10 p-4"
            >
              <p className="text-sm text-ivory">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 text-xs uppercase tracking-[0.18em] text-smoke hover:text-ivory"
              >
                Dismiss
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={placing}
            className="mt-8 flex w-full items-center justify-center gap-2.5 bg-gold py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Placing order…
              </>
            ) : (
              "Place Order — Cash on Delivery"
            )}
          </button>
        </form>

        <aside className="h-fit border border-border bg-card p-7" aria-label="Order summary">
          <h2 className="font-display text-lg uppercase tracking-[0.15em] text-ivory">
            Order Summary
          </h2>
          <div className="mt-6 space-y-4">
            {lines.map((line) => (
              <div key={line.variantId} className="flex gap-4">
                {line.imageUrl && (
                  <img
                    src={line.imageUrl}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    className="size-14 shrink-0 rounded-sm border border-border object-cover"
                  />
                )}
                <div className="flex flex-1 items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-sm tracking-wide text-ivory">{line.name}</p>
                    <p className="micro-label mt-1 text-[0.5625rem] text-smoke">
                      {line.sizeMl} ml × {line.qty}
                    </p>
                  </div>
                  <p className="text-sm text-gold">{formatPkr(line.priceMinor * line.qty)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-1.5 border-t border-border pt-4 text-sm">
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
          <p className="mt-5 flex items-center gap-2 text-xs text-smoke/80">
            <Truck className="size-4 text-gold" />
            {shipping.estimate}
          </p>
          <p className="mt-2 text-xs text-smoke/60">
            Final prices are verified server-side at order creation.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <label className={className}>
      <span className="micro-label text-[0.625rem] text-smoke">{label}</span>
      <input
        {...props}
        className={`mt-2 w-full border bg-noir/60 px-4 py-3 text-sm text-ivory placeholder:text-smoke/50 focus:border-gold focus:outline-none ${
          error ? "border-destructive/60" : "border-input"
        }`}
      />
      {error && <span className="mt-1.5 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
