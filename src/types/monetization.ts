import type { ObjectId } from "mongodb";

export type MonetizationRequestType = "increase_limit" | "boost_product";
export type MonetizationRequestStatus =
  | "pending"
  | "paid"
  | "completed"
  | "cancelled";

export type PaymentProvider = "erip";
export type MonetizationPaymentStatus =
  | "pending"
  | "invoice_created"
  | "paid"
  | "failed";

export type BoostDuration = "week" | "month" | "year";

export type MonetizationRequestDoc = {
  _id?: ObjectId;
  userId: ObjectId;
  userEmail: string;
  type: MonetizationRequestType;
  status: MonetizationRequestStatus;

  productId?: ObjectId;
  productName?: string;

  message?: string;
  requestedLimitIncrease?: number;
  requestedBoostValue?: number;
  boostDuration?: BoostDuration;
  boostAppliedAt?: Date;
  boostExpiresAt?: Date;

  paymentProvider: PaymentProvider;
  paymentStatus: MonetizationPaymentStatus;
  paymentStubNote?: string;
  paymentAmountBYN?: number;
  paymentAccountNo?: string;
  paymentInvoiceNo?: number;
  paymentInvoiceUrl?: string;
  paymentCurrency?: number;
  paymentExpiresAt?: Date;
  paymentError?: string;

  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  processedByEmail?: string;
};

export type MonetizationRequestView = {
  _id?: string;
  userId: string;
  userEmail: string;
  type: MonetizationRequestType;
  status: MonetizationRequestStatus;

  productId?: string;
  productName?: string;

  message?: string;
  requestedLimitIncrease?: number;
  requestedBoostValue?: number;
  boostDuration?: BoostDuration;
  boostAppliedAt?: string;
  boostExpiresAt?: string;

  paymentProvider: PaymentProvider;
  paymentStatus: MonetizationPaymentStatus;
  paymentStubNote?: string;
  paymentAmountBYN?: number;
  paymentAccountNo?: string;
  paymentInvoiceNo?: number;
  paymentInvoiceUrl?: string;
  paymentCurrency?: number;
  paymentExpiresAt?: string;
  paymentError?: string;

  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  processedByEmail?: string;
};