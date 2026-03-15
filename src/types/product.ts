import type { ObjectId } from "mongodb";

export type ProductStatus = "pending" | "approved" | "rejected";

export type ProductDoc = {
  _id?: ObjectId;
  ownerId?: ObjectId;
  ownerEmail?: string;
  name: string;
  slug: string;
  category: "instrument" | "ladder" | "level" | "vacuum" | "other";
  short: string;
  organization?: string;
  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  city: string;
  images: string[];
  imagePublicIds?: string[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  ownerPhone?: string;
};

export type ProductView = {
  _id?: string;
  ownerId?: string;
  ownerEmail?: string;
  name: string;
  slug: string;
  category: "instrument" | "ladder" | "level" | "vacuum" | "other";
  short: string;
  organization?: string;
  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  city: string;
  images: string[];
  imagePublicIds?: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  ownerPhone?: string;
};