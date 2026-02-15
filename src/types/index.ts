import { Condition, ObjectId } from "mongodb";

export type UserType = {
  email: string;
  password: string;
  createdAt: Date;
  verified: boolean;
  verifyToken: string;
  verifySentAt: Date;
  _id: Condition<ObjectId>;
};
