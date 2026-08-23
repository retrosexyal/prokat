import type { ObjectId } from "mongodb";
import type { CitySlug } from "@/lib/cities";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждено",
  cancelled: "Отменено",
};

export type BookingDoc = {
  _id?: ObjectId;
  productId: ObjectId;
  productOwnerId: ObjectId;
  renterId?: ObjectId;
  renterEmail?: string;
  guestIpAddress?: string;
  guestAccessTokenHash?: string;
  guestAccessTokenCreatedAt?: Date;
  phone: string;
  message?: string;
  quantity?: number;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;

  personalDataConsentAccepted?: boolean;
  personalDataConsentVersion?: string;
  personalDataConsentAcceptedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
};

export type BookingView = {
  _id: string;
  productId: string;
  productOwnerId: string;
  renterId?: string;
  phone: string;
  message?: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  product?: {
    _id?: string;
    name: string;
    slug: string;
    category: string;
    images: string[];
    pricePerDayBYN: number;
    city: string;
    citySlug: CitySlug;
  };
};
