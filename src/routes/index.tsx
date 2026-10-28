import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { catalogQueryOptions } from "@/lib/catalog.functions";
import { HeroSlideshow } from "@/components/home/slideshow";
import {
  SignatureSection,
  CollectionsSection,
  FeaturedProducts,
  StorySection,
} from "@/components/home/sections";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  head: () => ({
    meta: [
      {
        title: "NOIR ÉLIXIR — Scent That Defines You",
      },
      {
        name: "description",
        content:
          "Discover distinctive luxury fragrances composed in small batches. Noir Élixir, Golden Oud, Velvet Rose, Amber Noir — Cash on Delivery across Pakistan.",
      },
      { property: "og:title", content: "NOIR ÉLIXIR — Scent That Defines You" },
      {
        property: "og:description",
        content:
          "Cinematic luxury perfume house. Shop the collection — 30, 50 and 100 ml extraits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions);

  const signature = catalog.products.find((p) => p.slug === "noir-elixir");
  const featured = catalog.products.filter((p) => p.featured);
  const showcase = featured.length > 0 ? featured : catalog.products.slice(0, 4);

  return (
    <>
      <HeroSlideshow />
      <SignatureSection product={signature ?? undefined} />
      <CollectionsSection collections={catalog.collections} />
      <FeaturedProducts products={showcase} />
      <StorySection />
    </>
  );
}
