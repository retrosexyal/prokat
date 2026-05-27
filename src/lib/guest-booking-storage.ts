import type { BookingStatus, BookingView } from "@/types/booking";

export const GUEST_BOOKINGS_STORAGE_KEY = "guest-bookings:v1";

const RETENTION_DAYS_AFTER_END = 180;
const MAX_STORED_GUEST_BOOKINGS = 50;

export type StoredGuestBooking = {
  bookingId: string;
  accessToken: string;
  productId: string;
  productName: string;
  productHref?: string;
  productImage?: string;
  phone: string;
  message?: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type GuestBookingLookup = {
  bookingId: string;
  accessToken: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function isStoredGuestBooking(value: unknown): value is StoredGuestBooking {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.bookingId === "string" &&
    typeof value.accessToken === "string" &&
    typeof value.productId === "string" &&
    typeof value.productName === "string" &&
    typeof value.phone === "string" &&
    typeof value.startDate === "string" &&
    typeof value.endDate === "string" &&
    typeof value.status === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.expiresAt === "string"
  );
}

function isExpired(item: StoredGuestBooking): boolean {
  const expiresAtTime = new Date(item.expiresAt).getTime();

  return Number.isFinite(expiresAtTime) && expiresAtTime < Date.now();
}

function buildExpiresAt(endDate: string): string {
  const endDateTime = new Date(endDate).getTime();
  const base = Number.isFinite(endDateTime) ? endDateTime : Date.now();
  const expiresAt = new Date(base);

  expiresAt.setDate(expiresAt.getDate() + RETENTION_DAYS_AFTER_END);

  return expiresAt.toISOString();
}

function getProductHref(booking: BookingView): string | undefined {
  if (!booking.product?.citySlug || !booking.product.category || !booking.product.slug) {
    return undefined;
  }

  return `/${booking.product.citySlug}/${booking.product.category}/${booking.product.slug}`;
}

function toStoredGuestBooking(
  booking: BookingView,
  accessToken: string,
  previous?: StoredGuestBooking,
): StoredGuestBooking {
  return {
    bookingId: booking._id,
    accessToken,
    productId: booking.productId,
    productName: booking.product?.name ?? previous?.productName ?? "Товар",
    productHref: getProductHref(booking) ?? previous?.productHref,
    productImage: booking.product?.images?.[0] ?? previous?.productImage,
    phone: booking.phone,
    message: booking.message,
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: booking.status,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    expiresAt: previous?.expiresAt ?? buildExpiresAt(booking.endDate),
  };
}

export function readGuestBookings(): StoredGuestBooking[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const raw = storage.getItem(GUEST_BOOKINGS_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    const bookings = Array.isArray(parsed)
      ? parsed.filter(isStoredGuestBooking).filter((item) => !isExpired(item))
      : [];

    if (bookings.length === 0) {
      storage.removeItem(GUEST_BOOKINGS_STORAGE_KEY);
      return [];
    }

    return bookings;
  } catch {
    storage.removeItem(GUEST_BOOKINGS_STORAGE_KEY);
    return [];
  }
}

export function writeGuestBookings(bookings: StoredGuestBooking[]): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const cleaned = bookings
    .filter((item) => !isExpired(item))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, MAX_STORED_GUEST_BOOKINGS);

  if (cleaned.length === 0) {
    storage.removeItem(GUEST_BOOKINGS_STORAGE_KEY);
    return;
  }

  storage.setItem(GUEST_BOOKINGS_STORAGE_KEY, JSON.stringify(cleaned));
}

export function upsertGuestBooking(
  booking: BookingView,
  accessToken?: string,
): StoredGuestBooking[] {
  if (!accessToken) {
    return readGuestBookings();
  }

  const existing = readGuestBookings();
  const previous = existing.find((item) => item.bookingId === booking._id);
  const nextBooking = toStoredGuestBooking(booking, accessToken, previous);
  const next = [
    nextBooking,
    ...existing.filter((item) => item.bookingId !== booking._id),
  ];

  writeGuestBookings(next);

  return next;
}

export function replaceGuestBookingsFromServer(
  bookings: BookingView[],
): StoredGuestBooking[] {
  const existing = readGuestBookings();
  const byId = new Map(existing.map((item) => [item.bookingId, item]));

  const next = bookings
    .map((booking) => {
      const previous = byId.get(booking._id);

      if (!previous) {
        return null;
      }

      return toStoredGuestBooking(booking, previous.accessToken, previous);
    })
    .filter((item): item is StoredGuestBooking => item !== null);

  writeGuestBookings(next);

  return next;
}

export function getGuestBookingLookups(): GuestBookingLookup[] {
  return readGuestBookings().map((booking) => ({
    bookingId: booking.bookingId,
    accessToken: booking.accessToken,
  }));
}
