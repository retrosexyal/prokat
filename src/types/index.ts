import { Condition, ObjectId } from "mongodb";

export type UserType = {
  email: string;
  password: string;
  createdAt: Date;
  verified: boolean;
  verifyToken: string;
  verifySentAt: Date;
  _id: Condition<ObjectId>;
  name?: string;
  phone?: string;
  phoneVerified?: boolean;
  showPhoneInProducts?: boolean;
  productLimit?: number;
  pickupAddress?: string;
};
