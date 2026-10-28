import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { brand, shipping } from "@/config/brand";
import { formatPkr } from "@/lib/format";
import { BrandMark } from "./header";

const SHOP_LINKS: { label: string; to: "/shop"; collection?: string }[] = [
  { label: "All Fragrances", to: "/shop" },
  { label: "Signature Collection", to: "/shop", collection: "signature" },
  { label: "Oud Collection", to: "/shop", collection: "oud" },
  { label: "Floral Collection", to: "/shop", collection: "floral" },
  { label: "Amber Collection", to: "/shop", collection: "amber" },
];

const SUPPORT_LINKS = [
  { label: "Our Story", to: "/story" },
  { label: "Contact", to: "/contact" },
  { label: "Collections", to: "/collections" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-charcoal">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <BrandMark />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-smoke">{brand.description}</p>
          <div className="mt-8 space-y-1.5 text-sm text-smoke">
            <p>
              <span className="text-gold/70">Email</span> {brand.contact.email}{" "}
              <span className="text-[0.625rem] uppercase tracking-widest text-bronze">demo</span>
            </p>
            <p>
              <span className="text-gold/70">Phone</span> {brand.contact.phone}{" "}
              <span className="text-[0.625rem] uppercase tracking-widest text-bronze">demo</span>
            </p>
            <p>
              <span className="text-gold/70">Studio</span> {brand.contact.city}
            </p>
          </div>
        </div>

        <div>
          <h3 className="micro-label mb-6 text-gold">Shop</h3>
          <ul className="space-y-3">
            {SHOP_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  search={l.collection ? { collection: l.collection } : {}}
                  className="text-sm text-smoke transition-colors hover:text-ivory"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="micro-label mb-6 text-gold">House</h3>
          <ul className="space-y-3">
            {SUPPORT_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-sm text-smoke transition-colors hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-sm border border-border bg-noir/60 p-6">
          <h3 className="font-display text-xl uppercase tracking-[0.12em] text-ivory">
            Begin your journey
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-smoke">
            Discover the collection and find the scent that defines you.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 bg-gold px-5 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-soft"
          >
            Explore Collection
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-5 text-xs leading-relaxed text-smoke/80">
            Delivery {shipping.estimate}.{" "}
            {shipping.codEnabled
              ? `Cash on Delivery available. Free over ${formatPkr(shipping.freeOverMinor)}.`
              : ""}
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-smoke/70 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p>
            Demo storefront — products, prices and contact details are placeholders until replaced
            by the store owner.
          </p>
        </div>
      </div>
    </footer>
  );
}
