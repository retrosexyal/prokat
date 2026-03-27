import { Condition, ObjectId } from "mongodb";
import type { CitySlug } from "@/lib/cities";

export type UserType = {
  email: string;
  password?: string;
  createdAt: Date;
  verified: boolean;
  verifyToken?: string;
  verifySentAt?: Date;
  _id: Condition<ObjectId>;
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
};