import clientPromise from "./mongodb";
import type { ProductDoc, ProductStatus } from "@/types/product";
import { ObjectId } from "mongodb";

const COLLECTION = "products";

export type ApprovedProductWithAvailability = ProductDoc & {
  isAvailableNow: boolean;
};

function getTodayRange(): { startOfDay: Date; endOfDay: Date } {
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

export async function getApprovedProductsWithAvailability(): Promise<
  ApprovedProductWithAvailability[]
> {
  const client = await clientPromise;
  const db = client.db();

  const { startOfDay, endOfDay } = getTodayRange();

  const products = await db
    .collection<ProductDoc>(COLLECTION)
    .aggregate([
      {
        $match: {
          status: "approved",
        },
      },
      {
        $lookup: {
          from: "bookings",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$status", "confirmed"] },
                    { $lte: ["$startDate", endOfDay] },
                    { $gte: ["$endDate", startOfDay] },
                  ],
                },
              },
            },
            {
              $limit: 1,
            },
          ],
          as: "activeBookingsToday",
        },
      },
      {
        $addFields: {
          isAvailableNow: {
            $eq: [{ $size: "$activeBookingsToday" }, 0],
          },
        },
      },
      {
        $project: {
          activeBookingsToday: 0,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ])
    .toArray();

  return products as ApprovedProductWithAvailability[];
}

export async function getAllProductsForAdmin(): Promise<ProductDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<ProductDoc>("products")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getPendingProducts(): Promise<ProductDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<ProductDoc>("products")
    .find({ status: "pending" })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getApprovedProducts(): Promise<ProductDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<ProductDoc>(COLLECTION)
    .find({ status: "approved" })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getProductsByOwner(
  ownerId: string,
): Promise<ProductDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<ProductDoc>(COLLECTION)
    .find({ ownerId: new ObjectId(ownerId) })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDoc | null> {
  const client = await clientPromise;
  const db = client.db();

  return db.collection<ProductDoc>(COLLECTION).findOne({ slug });
}

export async function createProduct(
  data: Omit<ProductDoc, "_id" | "createdAt" | "updatedAt">,
): Promise<ProductDoc> {
  const client = await clientPromise;
  const db = client.db();

  const now = new Date();

  const doc: ProductDoc = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<ProductDoc>(COLLECTION).insertOne(doc);

  return {
    ...doc,
    _id: result.insertedId,
  };
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<ProductDoc, "_id" | "createdAt">>,
): Promise<ProductDoc | null> {
  console.log({ id, data });
  const client = await clientPromise;
  const db = client.db();

  const _id = new ObjectId(id);

  const update: Partial<Omit<ProductDoc, "_id" | "createdAt">> & {
    updatedAt: Date;
  } = {
    ...data,
    updatedAt: new Date(),
  };

  const res = await db
    .collection<ProductDoc>(COLLECTION)
    .findOneAndUpdate({ _id }, { $set: update }, { returnDocument: "after" });

  return res ?? null;
}

export async function updateProductStatus(
  id: string,
  status: ProductStatus,
): Promise<ProductDoc | null> {
  const client = await clientPromise;
  const db = client.db();

  const _id = new ObjectId(id);

  const res = await db
    .collection<ProductDoc>(COLLECTION)
    .findOneAndUpdate(
      { _id },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

  return res ?? null;
}
