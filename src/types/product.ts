import type { ObjectId } from "mongodb";
import type { CitySlug } from "@/lib/cities";
import type { BoostDuration } from "@/types/monetization";

export type ProductStatus = "pending" | "approved" | "rejected";
export type ProductCondition = "new" | "excellent" | "good" | "used";

export type ProductFaqItem = {
  q: string;
  a: string;
};

export type ProductSpecificationItem = {
  label: string;
  value: string;
};

export type ProductDoc = {
  _id?: ObjectId;
  ownerId?: ObjectId;
  ownerEmail?: string;

  name: string;
  slug: string;
  category: string;

  short: string;
  fullDescription?: string;

  organization?: string;
  brand?: string;
  model?: string;
  condition?: ProductCondition;

  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  quantity: number;

  city: string;
  citySlug: CitySlug;
  pickupAddress?: string;
  deliveryAvailable?: boolean;

  kitIncluded?: string[];
  specifications?: ProductSpecificationItem[];
  faq?: ProductFaqItem[];

  images: string[];
  imagePublicIds?: string[];

  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  ownerPhone?: string;

  ratingBoost?: number;
  priorityScore?: number;
  boostRestoreValue?: number;
  boostAppliedAt?: Date;
  boostExpiresAt?: Date;
  boostDuration?: BoostDuration;
};

export type ProductView = {
  _id?: string;
  ownerId?: string;
  ownerEmail?: string;

  name: string;
  slug: string;
  category: string;

  short: string;
  fullDescription?: string;

  organization?: string;
  brand?: string;
  model?: string;
  condition?: ProductCondition;

  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  quantity: number;

  city: string;
  citySlug: CitySlug;
  pickupAddress?: string;
  deliveryAvailable?: boolean;

  kitIncluded?: string[];
  specifications?: ProductSpecificationItem[];
  faq?: ProductFaqItem[];

  images: string[];
  imagePublicIds?: string[];

  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  ownerPhone?: string;

  ratingBoost?: number;
  priorityScore?: number;
  boostRestoreValue?: number;
  boostAppliedAt?: string;
  boostExpiresAt?: string;
  boostDuration?: BoostDuration;
};