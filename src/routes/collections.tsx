import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { catalogQueryOptions } from "@/lib/catalog.functions";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/collections")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  head: () => ({
    meta: [
      { title: "Collections — NOIR ÉLIXIR" },
      {
        name: "description",
        content:
          "Explore the five fragrance collections of NOIR ÉLIXIR — signature, oud, amber, floral and fresh.",
      },
      { property: "og:title", content: "Collections — NOIR ÉLIXIR" },
      {
        property: "og:description",
        content: "Explore the five fragrance collections of the house.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollectionsPage,
});

function CollectionsPage() {
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:pt-40">
      <Reveal>
        <p className="micro-label text-gold">Shop by Collection</p>
        <h1 className="headline mt-4 text-4xl text-ivory sm:text-5xl">
          Five Worlds, <span className="gold-gradient-text">One House</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-smoke sm:text-base">
          Each collection is built around a single olfactory idea — explore the world that matches
          yours.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.collections.map((c, i) => (
          <Reveal key={c.id} delay={Math.min(i, 2) * 0.08}>
            <Link
              to="/shop"
              search={{ collection: c.slug }}
              className="group relative block overflow-hidden border border-border"
            >
              <div className="aspect-[4/5] bg-charcoal">
                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    width={600}
                    height={750}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <h2 className="font-display text-2xl uppercase tracking-[0.1em] text-ivory">
                  {c.name}
                </h2>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-smoke">{c.description}</p>
                )}
                <span className="mt-4 inline-flex items-center gap-2 border-b border-gold/60 pb-1 text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-gold">
                  Discover
                  <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
