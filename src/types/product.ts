import type { ObjectId } from "mongodb";

export type ProductDoc = {
  _id?: ObjectId;
  name: string;
  slug: string;
  category: "instrument" | "ladder" | "level" | "vacuum" | "other";
  short: string;
  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  city: string;
  images: string[];
  imagePublicIds?: string[];
  createdAt: Date;
  updatedAt: Date;
};


