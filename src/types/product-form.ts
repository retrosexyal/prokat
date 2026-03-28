import type { ProductDoc } from "@/types/product";
import type { CitySlug } from "@/lib/cities";

export type ProductFormValues = {
  name: string;
  slug: string;
  category: ProductDoc["category"];
  short: string;
  organization: string;
  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  quantity: number;
  city: string;
  citySlug: CitySlug;
  pickupAddress: string;
};

export const emptyProductForm: ProductFormValues = {
  name: "",
  slug: "",
  category: "другое",
  short: "",
  organization: "",
  depositBYN: 0,
  pricePerDayBYN: 0,
  minDays: 1,
  quantity: 1,
  city: "Могилёв",
  citySlug: "mogilev",
  pickupAddress: "",
};