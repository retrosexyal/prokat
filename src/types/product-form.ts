import type { ProductCondition, ProductDoc } from "@/types/product";
import type { CitySlug } from "@/lib/cities";

export type ProductFormValues = {
  name: string;
  slug: string;
  category: ProductDoc["category"];

  short: string;
  fullDescription: string;

  organization: string;
  brand: string;
  model: string;
  condition: ProductCondition;

  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  quantity: number;

  city: string;
  citySlug: CitySlug;
  pickupAddress: string;
  deliveryAvailable: boolean;

  kitIncludedText: string;
  specificationsText: string;
  faqText: string;
};

export const emptyProductForm: ProductFormValues = {
  name: "",
  slug: "",
  category: "",

  short: "",
  fullDescription: "",

  organization: "",
  brand: "",
  model: "",
  condition: "good",

  depositBYN: 0,
  pricePerDayBYN: 0,
  minDays: 1,
  quantity: 1,

  city: "Могилёв",
  citySlug: "mogilev",
  pickupAddress: "",
  deliveryAvailable: false,

  kitIncludedText: "",
  specificationsText: "",
  faqText: "",
};