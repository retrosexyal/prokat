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
    fullDescription: product.fullDescription,

    organization: product.organization,
    brand: product.brand,
    model: product.model,
    condition: product.condition,

    depositBYN: product.depositBYN,
    pricePerDayBYN: product.pricePerDayBYN,
    pricePerWeekBYN: product.pricePerWeekBYN,
    pricePerMonthBYN: product.pricePerMonthBYN,
    minDays: product.minDays,
    quantity: product.quantity ?? 1,

    city: product.city,
    citySlug: product.citySlug,
    pickupAddress: product.pickupAddress,
    deliveryAvailable: product.deliveryAvailable ?? false,

    kitIncluded: product.kitIncluded ?? [],
    specifications: product.specifications ?? [],
    faq: product.faq ?? [],

    images: product.images,
    imagePublicIds: product.imagePublicIds,

    status: product.status,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    ownerPhone: product.ownerPhone,

    ratingBoost: product.ratingBoost ?? 0,
    priorityScore: product.priorityScore ?? product.ratingBoost ?? 0,
    boostRestoreValue: product.boostRestoreValue,
    boostAppliedAt: product.boostAppliedAt?.toISOString(),
    boostExpiresAt: product.boostExpiresAt?.toISOString(),
    boostDuration: product.boostDuration,
  };
}

export function toProductViews(products: ProductDoc[]): ProductView[] {
  return products.map(toProductView);
}
