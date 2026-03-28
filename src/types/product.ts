import type { ObjectId } from "mongodb";
import type { CitySlug } from "@/lib/cities";

export type ProductStatus = "pending" | "approved" | "rejected";

export type ProductDoc = {
  _id?: ObjectId;
  ownerId?: ObjectId;
  ownerEmail?: string;
  name: string;
  slug: string;
  category: string;
  short: string;
  organization?: string;
  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  quantity: number;
  city: string;
  citySlug: CitySlug;
  images: string[];
  imagePublicIds?: string[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  ownerPhone?: string;
  pickupAddress?: string;
};

export type ProductView = {
  _id?: string;
  ownerId?: string;
  ownerEmail?: string;
  name: string;
  slug: string;
  category: string;
  short: string;
  organization?: string;
  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  quantity: number;
  city: string;
  citySlug: CitySlug;
  images: string[];
  imagePublicIds?: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  ownerPhone?: string;
  pickupAddress?: string;
};