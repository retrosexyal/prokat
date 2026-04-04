import type { CitySlug } from "@/lib/cities";

export const API_ROUTES = {
  products: "/api/products",
  productById: (id: string) => `/api/products/${id}`,
  adminProducts: "/api/admin/products",
  adminProductById: (id: string) => `/api/admin/products/${id}`,
  adminImages: "/api/admin/images",
  adminImageDelete: (publicId: string) =>
    `/api/admin/images?publicId=${encodeURIComponent(publicId)}`,
  bookings: "/api/bookings",
  me: "/api/users/me",
  bookingById: (id: string) => `/api/bookings/${id}`,

  monetizationRequests: "/api/monetization/requests",
  adminMonetizationRequestById: (id: string) =>
    `/api/admin/monetization-requests/${id}`,
} as const;

type ProductPathInput = {
  slug: string;
  category: string;
  citySlug: CitySlug;
};

export function getProductPath({
  slug,
  category,
  citySlug,
}: ProductPathInput): string {
  return `/${citySlug}/${category}/${slug}`;
}