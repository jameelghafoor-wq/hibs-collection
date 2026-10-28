import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { createPublicClient } from "./catalog.server";
import type { CatalogPayload, Product } from "@/types/commerce";

export const catalogQueryOptions = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
});

/**
 * Public catalog read. Products, collections and variants are anonymous
 * SELECT behind narrow RLS policies — no customer data is reachable.
 */
export const getCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogPayload> => {
    const supabase = createPublicClient();

    const [collectionsRes, productsRes] = await Promise.all([
      supabase
        .from("collections")
        .select("id, slug, name, description, image_url")
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select(
          `id, slug, name, short_description, description, fragrance_family,
           top_notes, heart_notes, base_notes, image_url, featured,
           collection_id, collections!products_collection_id_fkey (slug, name),
           product_variants (id, size_ml, sku, price_minor, stock_quantity)`,
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    const collectionRows = (collectionsRes.data ?? []) as {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      image_url: string | null;
    }[];

    const productRows = (productsRes.data ?? []) as {
      id: string;
      slug: string;
      name: string;
      short_description: string | null;
      description: string | null;
      fragrance_family: string | null;
      top_notes: string | null;
      heart_notes: string | null;
      base_notes: string | null;
      image_url: string | null;
      featured: boolean;
      collection_id: string | null;
      collections: { slug: string; name: string } | null;
      product_variants: {
        id: string;
        size_ml: number;
        sku: string;
        price_minor: number;
        stock_quantity: number;
      }[];
    }[];

    const products: Product[] = productRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      shortDescription: row.short_description,
      description: row.description,
      fragranceFamily: row.fragrance_family,
      topNotes: row.top_notes,
      heartNotes: row.heart_notes,
      baseNotes: row.base_notes,
      imageUrl: row.image_url,
      featured: row.featured,
      collectionSlug: row.collections?.slug ?? null,
      collectionName: row.collections?.name ?? null,
      variants: (row.product_variants ?? [])
        .slice()
        .sort((a, b) => a.size_ml - b.size_ml)
        .map((v) => ({
          id: v.id,
          sizeMl: v.size_ml,
          sku: v.sku,
          priceMinor: v.price_minor,
          stockQuantity: v.stock_quantity,
        })),
    }));

    return {
      collections: collectionRows.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        imageUrl: c.image_url,
      })),
      products,
    };
  },
);

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<Product | null> => {
    const catalog = await getCatalog();
    return catalog.products.find((p) => p.slug === data.slug) ?? null;
  });
