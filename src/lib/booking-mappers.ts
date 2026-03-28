import type { BookingDoc, BookingView } from "@/types/booking";
import type { ProductDoc } from "@/types/product";

type BookingWithProduct = BookingDoc & {
  product?: ProductDoc;
};

export function toBookingView(booking: BookingWithProduct): BookingView {
  return {
    _id: booking._id?.toString() || "",
    productId: booking.productId.toString(),
    productOwnerId: booking.productOwnerId.toString(),
    renterId: booking.renterId?.toString(),
    renterEmail: booking.renterEmail,
    guestIpAddress: booking.guestIpAddress,
    phone: booking.phone,
    message: booking.message,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    product: booking.product
      ? {
          _id: booking.product._id?.toString(),
          name: booking.product.name,
          slug: booking.product.slug,
          images: booking.product.images,
          pricePerDayBYN: booking.product.pricePerDayBYN,
          city: booking.product.city,
        }
      : undefined,
  };
}

export function toBookingViews(bookings: BookingWithProduct[]): BookingView[] {
  return bookings.map(toBookingView);
}