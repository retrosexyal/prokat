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
    quantity: product.quantity ?? 1,
    city: product.city,
    citySlug: product.citySlug,
    images: product.images,
    imagePublicIds: product.imagePublicIds,
    status: product.status,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    ownerPhone: product.ownerPhone,
    pickupAddress: product.pickupAddress,
    ratingBoost: product.ratingBoost ?? 0,
    priorityScore: product.priorityScore ?? product.ratingBoost ?? 0,
  };
}

export function toProductViews(products: ProductDoc[]): ProductView[] {
  return products.map(toProductView);
}