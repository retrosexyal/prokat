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
} as const;
