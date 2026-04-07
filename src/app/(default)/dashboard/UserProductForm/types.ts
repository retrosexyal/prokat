import type { ProductView } from "@/types/product";
import type { MonetizationRequestType } from "@/types/monetization";

export type ExistingImage = {
  url: string;
  publicId?: string;
};

export type MonetizationModalState = {
  open: boolean;
  type: MonetizationRequestType;
  product: ProductView | null;
};

export type MonetizationQrResponse = {
  qrCodeBody?: string;
};