import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Collection, Product } from "@/types/commerce";
import { formatPkr } from "@/lib/format";
import { Reveal } from "@/components/reveal";
import { ProductCard } from "@/components/shop/product-card";
import storyAsset from "@/assets/story-ingredients.jpg.asset.json";

/* ---------------------------------------------------------- Signature */

export function SignatureSection({ product }: { product?: Product | undefined }) {
  if (!product) return null;
  const variant = product.variants.find((v) => v.sizeMl === 50) ?? product.variants[0];

  return (
    <section className="relative py-24 sm:py-32" aria-label="Signature fragrance">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden border border-border">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={`${product.name} perfume bottle`}
                width={600}
                height={750}
                loading="lazy"
                className="size-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-noir/60 via-transparent to-transparent" />
          </div>
          <div className="absolute -bottom-6 -right-4 hidden border border-gold/30 bg-noir/90 px-6 py-5 backdrop-blur-sm sm:block">
            <p className="micro-label text-[0.5625rem] text-gold">Eau de Parfum</p>
            <p className="mt-1 font-display text-lg text-ivory">
              {variant ? `${variant.sizeMl} ml` : ""}
            </p>
            <p className="mt-1 text-sm font-medium text-gold">
              {variant ? formatPkr(variant.priceMinor) : ""}
            </p>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="micro-label text-gold">The Signature</p>
            <h2 className="headline mt-4 text-3xl text-ivory sm:text-4xl lg:text-5xl">
              The Signature of <span className="gold-gradient-text">Luxury</span>
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-smoke sm:text-base">
              {product.shortDescription} Built around rare raw materials and matured for weeks,{" "}
              {product.name} is the fragrance that named the house.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <dl className="mt-10 divide-y divide-border border-y border-border">
              {[
                { label: "Top Notes", value: product.topNotes },
                { label: "Heart Notes", value: product.heartNotes },
                { label: "Base Notes", value: product.baseNotes },
                { label: "Fragrance Family", value: product.fragranceFamily },
              ]
                .filter((r) => r.value)
                .map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-6 py-3.5">
                    <dt className="micro-label shrink-0 text-[0.625rem] text-smoke">{row.label}</dt>
                    <dd className="text-right font-display text-sm tracking-wide text-ivory sm:text-base">
                      {row.value}
                    </dd>
                  </div>
                ))}
            </dl>
            <Link
              to="/perfume/$slug"
              params={{ slug: product.slug }}
              className="group mt-9 inline-flex items-center gap-2.5 bg-gold px-7 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-soft"
            >
              Explore {product.name}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- Collections */

export function CollectionsSection({ collections }: { collections: Collection[] }) {
  if (collections.length === 0) return null;

  return (
    <section className="py-24 sm:py-32" aria-label="Shop by collection">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="micro-label text-gold">Shop by Collection</p>
            <h2 className="headline mt-4 text-3xl text-ivory sm:text-4xl">
              Five Worlds, <span className="gold-gradient-text">One House</span>
            </h2>
          </div>
          <Link
            to="/collections"
            className="group inline-flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-smoke transition-colors hover:text-gold"
          >
            All Collections
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <div className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scrollbar-width:none] sm:px-6 lg:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] [&::-webkit-scrollbar]:hidden">
          {collections.map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ collection: c.slug }}
              className="group relative block w-[78vw] max-w-md shrink-0 snap-start overflow-hidden border border-border sm:w-[420px]"
            >
              <div className="aspect-[3/4] overflow-hidden bg-charcoal">
                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    width={600}
                    height={800}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <h3 className="font-display text-2xl uppercase tracking-[0.1em] text-ivory">
                  {c.name}
                </h3>
                {c.description && (
                  <p className="mt-2 line-clamp-2 max-w-xs text-sm text-smoke">{c.description}</p>
                )}
                <span className="mt-4 inline-flex items-center gap-2 border-b border-gold/60 pb-1 text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-gold">
                  Discover
                  <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ----------------------------------------------------- Featured shop */

export function FeaturedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="py-24 sm:py-32" aria-label="Featured fragrances">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="max-w-2xl">
          <p className="micro-label text-gold">The Collection</p>
          <h2 className="headline mt-4 text-3xl text-ivory sm:text-4xl">
            The Fragrance <span className="gold-gradient-text">Wardrobe</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-smoke">
            Compositions in rare raw materials, bottled in small batches. Each available in 30, 50
            and 100 ml.
          </p>
          <p className="mt-3 text-xs text-smoke/60">
            Demo storefront — products and prices are placeholders until the owner adds real
            inventory.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={i * 0.08}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 text-center">
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2.5 border border-gold/40 px-8 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-gold transition-all duration-300 hover:border-gold hover:bg-gold/10"
          >
            Shop All Fragrances
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Story */

export function StorySection() {
  return (
    <section className="relative py-24 sm:py-32" aria-label="Our philosophy">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
        <div className="order-2 lg:order-1">
          <Reveal>
            <p className="micro-label text-gold">Our Philosophy</p>
            <h2 className="headline mt-4 text-3xl text-ivory sm:text-4xl lg:text-5xl">
              More Than a <span className="gold-gradient-text">Fragrance</span>
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-smoke sm:text-base">
              A scent is memory made invisible — the impression you leave in a room after you've
              gone. We build each composition around a single emotion: quiet confidence, magnetic
              warmth, the calm of dusk.
            </p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-smoke sm:text-base">
              Our raw materials are chosen the way jewellers choose stones — Cambodian oud aged
              until it turns sweet, damask rose picked before sunrise, saffron weighed by hand.
            </p>
            <Link
              to="/story"
              className="group mt-9 inline-flex items-center gap-2.5 border border-gold/40 px-7 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-gold transition-all duration-300 hover:border-gold hover:bg-gold/10"
            >
              Our Story
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="order-1 lg:order-2">
          <div className="relative aspect-[4/3] overflow-hidden border border-border">
            <img
              src={storyAsset.url}
              alt="Oud wood, damask rose and saffron on dark stone"
              width={1408}
              height={1008}
              loading="lazy"
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-noir/50 via-transparent to-transparent" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
