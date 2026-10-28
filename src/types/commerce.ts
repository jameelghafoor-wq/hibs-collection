export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
};

export type ProductVariant = {
  id: string;
  sizeMl: number;
  sku: string;
  priceMinor: number;
  stockQuantity: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  fragranceFamily: string | null;
  topNotes: string | null;
  heartNotes: string | null;
  baseNotes: string | null;
  imageUrl: string | null;
  featured: boolean;
  collectionSlug: string | null;
  collectionName: string | null;
  variants: ProductVariant[];
};

export type CatalogPayload = {
  collections: Collection[];
  products: Product[];
};

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  sizeMl: number;
  priceMinor: number;
  stockQuantity: number;
  imageUrl: string | null;
  qty: number;
};
