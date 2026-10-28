import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { brand } from "@/config/brand";
import { Reveal } from "@/components/reveal";
import storyAsset from "@/assets/story-ingredients.jpg.asset.json";
import heroAsset from "@/assets/hero-bottle.jpg.asset.json";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Our Story — NOIR ÉLIXIR" },
      {
        name: "description",
        content:
          "The philosophy of NOIR ÉLIXIR — scent as personal expression, composed in small batches with rare raw materials.",
      },
      { property: "og:title", content: "Our Story — NOIR ÉLIXIR" },
      {
        property: "og:description",
        content: "The philosophy of the house — scent as personal expression.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoryPage,
});

const PILLARS = [
  {
    title: "Rare Raw Materials",
    text: "We choose each material the way a jeweller chooses a stone — aged woods, hand-picked petals, spices weighed in small portions.",
  },
  {
    title: "Small Batches",
    text: "Every composition is blended in limited runs, so each bottle leaves the studio as carefully as it entered.",
  },
  {
    title: "Patience",
    text: "Fragrances are given weeks to macerate and marry before they are judged ready. Nothing is rushed to a launch date.",
  },
];

function StoryPage() {
  return (
    <>
      <section className="relative flex min-h-[70vh] items-center overflow-hidden">
        <img
          src={heroAsset.url}
          alt="Perfume bottle under golden light"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/60 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-40">
          <Reveal>
            <p className="micro-label text-gold">Our Story</p>
            <h1 className="headline mt-4 max-w-2xl text-4xl text-ivory sm:text-5xl lg:text-6xl">
              More Than a <span className="gold-gradient-text">Fragrance</span>
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="grid gap-16 lg:grid-cols-2">
          <Reveal>
            <p className="text-sm leading-relaxed text-smoke sm:text-base">{brand.description}</p>
            <p className="mt-5 text-sm leading-relaxed text-smoke sm:text-base">
              We believe a fragrance is the most intimate thing you wear. It cannot be seen, yet it
              announces you before you speak and lingers after you leave. That is why we treat
              perfumery as couture — composed by hand, tasted drop by drop, and never compromised.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-smoke sm:text-base">
              The collection is deliberately small. Each fragrance must earn its place: distinctive
              enough to be recognised across a room, elegant enough to be worn every day.
            </p>
            <p className="mt-8 font-display text-lg italic leading-relaxed text-gold-soft">
              “{brand.tagline}”
            </p>
            <p className="micro-label mt-2 text-[0.625rem] text-smoke">
              — {brand.name}, {brand.category}
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative aspect-[4/3] overflow-hidden border border-border">
              <img
                src={storyAsset.url}
                alt="Raw fragrance ingredients on dark stone"
                width={1408}
                height={1008}
                loading="lazy"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-noir/40 via-transparent to-transparent" />
            </div>
          </Reveal>
        </div>

        <div className="mt-24 grid gap-10 border-y border-border py-14 sm:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.1}>
              <h2 className="font-display text-lg uppercase tracking-[0.12em] text-gold">
                {pillar.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-smoke">{pillar.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20 text-center">
          <p className="micro-label text-smoke">The collection</p>
          <h2 className="headline mx-auto mt-4 max-w-xl text-3xl text-ivory sm:text-4xl">
            Find the scent that defines you
          </h2>
          <Link
            to="/shop"
            className="group mt-8 inline-flex items-center gap-2.5 bg-gold px-8 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-soft"
          >
            Explore Collection
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
