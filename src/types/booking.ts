import type { ObjectId } from "mongodb";

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
  renterId: ObjectId;
  renterEmail: string;
  phone: string;
  message?: string;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type BookingView = {
  _id: string;
  productId: string;
  productOwnerId: string;
  renterId: string;
  renterEmail: string;
  phone: string;
  message?: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  product?: {
    _id?: string;
    name: string;
    slug: string;
    images: string[];
    pricePerDayBYN: number;
    city: string;
  };
};