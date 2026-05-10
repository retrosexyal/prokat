import type { ObjectId } from "mongodb";

export type ContactMessageDoc = {
  _id?: ObjectId;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isViewed: boolean;
  viewedAt?: Date;
  viewedByEmail?: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactMessageView = {
  _id?: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isViewed: boolean;
  viewedAt?: string;
  viewedByEmail?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
};