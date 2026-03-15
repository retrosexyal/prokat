import type { ProductDoc, ProductView } from "@/types/product";

export function toProductView(product: ProductDoc): ProductView {
  return {
    _id: product._id?.toString(),
    ownerId: product.ownerId?.toString(),
    ownerEmail: product.ownerEmail,
    name: product.name,
    slug: product.slug,
    category: product.category,
    short: product.short,
    organization: product.organization,
    depositBYN: product.depositBYN,
    pricePerDayBYN: product.pricePerDayBYN,
    minDays: product.minDays,
    city: product.city,
    images: product.images,
    imagePublicIds: product.imagePublicIds,
    status: product.status,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toProductViews(products: ProductDoc[]): ProductView[] {
  return products.map(toProductView);
}