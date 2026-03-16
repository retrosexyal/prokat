import type { ObjectId } from "mongodb";

export type CategoryDoc = {
  _id?: ObjectId;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryView = {
  _id?: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};
