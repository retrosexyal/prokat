import type { ObjectId } from "mongodb";

export type MonetizationRequestType = "increase_limit" | "boost_product";
export type MonetizationRequestStatus =
  | "pending"
  | "paid"
  | "completed"
  | "cancelled";

export type PaymentProvider = "erip";

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

  paymentProvider: PaymentProvider;
  paymentStatus: "pending" | "stub";
  paymentStubNote?: string;

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

  paymentProvider: PaymentProvider;
  paymentStatus: "pending" | "stub";
  paymentStubNote?: string;

  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  processedByEmail?: string;
};