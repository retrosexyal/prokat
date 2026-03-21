import type { ProductDoc } from "@/types/product";

export type ProductFormValues = {
  name: string;
  slug: string;
  category: ProductDoc["category"];
  short: string;
  organization: string;
  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  city: string;
  pickupAddress: string;
};

export const emptyProductForm: ProductFormValues = {
  name: "",
  slug: "",
  category: "Другое",
  short: "",
  organization: "",
  depositBYN: 0,
  pricePerDayBYN: 0,
  minDays: 1,
  city: "Могилёв",
  pickupAddress: "",
};
