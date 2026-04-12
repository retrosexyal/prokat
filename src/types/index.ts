import { ObjectId } from "mongodb";
import type { CitySlug } from "@/lib/cities";

export type StoredPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  userAgent?: string;
};

export type UserType = {
  _id: ObjectId;
  email: string;
  password?: string;
  createdAt: Date;
  verified: boolean;
  verifyToken?: string;
  verifySentAt?: Date;
  name?: string;
  phone?: string;
  phoneVerified?: boolean;
  showPhoneInProducts?: boolean;
  productLimit?: number;
  pickupAddress?: string;
  city?: string;
  citySlug?: CitySlug;
  provider?: "credentials" | "google";
  resetToken?: string;
  resetTokenExpires?: Date;
  image?: string;
  pushSubscriptions?: StoredPushSubscription[];
};