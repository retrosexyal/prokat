import clientPromise from "./mongodb";
import type { ProductDoc, ProductStatus } from "@/types/product";
import type { CitySlug } from "@/lib/cities";
import { ObjectId } from "mongodb";

const COLLECTION = "products";

export type ApprovedProductWithAvailability = ProductDoc & {
  isAvailableNow: boolean;
  availableQuantityNow: number;
  cityPriority?: number;
};

function getTodayRange(): { startOfDay: Date; endOfDay: Date } {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type GetApprovedProductsWithAvailabilityParams = {
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
  citySlug?: CitySlug;
  strictCityOnly?: boolean;
};

export type GetApprovedProductsWithAvailabilityResult = {
  products: ApprovedProductWithAvailability[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
};

export async function getApprovedProductsWithAvailability(
  params: GetApprovedProductsWithAvailabilityParams = {},
): Promise<GetApprovedProductsWithAvailabilityResult> {
  const client = await clientPromise;
  const db = client.db();
  const { startOfDay, endOfDay } = getTodayRange();

  const category = params.category?.trim() ?? "";
  const search = params.search?.trim() ?? "";
  const citySlug = params.citySlug?.trim() ?? "";
  const strictCityOnly = params.strictCityOnly ?? false;

  const limit = Math.max(params.limit ?? 12, 1);
  const page = Math.max(params.page ?? 1, 1);
  const skip = (page - 1) * limit;

  const matchStage: Record<string, unknown> = {
    status: "approved",
  };

  if (category) {
    matchStage.category = category;
  }

  if (search) {
    matchStage.name = {
      $regex: escapeRegex(search),
      $options: "i",
    };
  }

  if (strictCityOnly && citySlug) {
    matchStage.citySlug = citySlug;
  }

  const cityPriorityStage = citySlug
    ? {
        $addFields: {
          cityPriority: {
            $cond: [{ $eq: ["$citySlug", citySlug] }, 0, 1],
          },
        },
      }
    : {
        $addFields: {
          cityPriority: 0,
        },
      };

  const result = await db
  .collection<ProductDoc>(COLLECTION)
  .aggregate([
    { $match: matchStage },
    cityPriorityStage,
    {
      $facet: {
        items: [
          {
            $sort: {
              cityPriority: 1,
              createdAt: -1,
            },
          },
          { $skip: skip },
          { $limit: limit },
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
              ],
              as: "activeBookingsToday",
            },
          },
          {
            $addFields: {
              availableQuantityNow: {
                $max: [
                  0,
                  {
                    $subtract: [
                      { $ifNull: ["$quantity", 1] },
                      { $size: "$activeBookingsToday" },
                    ],
                  },
                ],
              },
            },
          },
          {
            $addFields: {
              isAvailableNow: {
                $gt: ["$availableQuantityNow", 0],
              },
            },
          },
          {
            $project: {
              activeBookingsToday: 0,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ])
  .toArray();

  const first = result[0];
  const products = (first?.items ?? []) as ApprovedProductWithAvailability[];
  const totalProducts = first?.totalCount?.[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / limit));
  const currentPage = Math.min(page, totalPages);

  return {
    products,
    totalProducts,
    totalPages,
    currentPage,
  };
}

export type GetApprovedProductsParams = {
  citySlug?: CitySlug;
  strictCityOnly?: boolean;
  limit?: number;
};

export async function getApprovedProducts(
  params: GetApprovedProductsParams = {},
): Promise<ProductDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  const citySlug = params.citySlug?.trim() ?? "";
  const strictCityOnly = params.strictCityOnly ?? false;
  const limit = Math.max(params.limit ?? 0, 0);

  const matchStage: Record<string, unknown> = {
    status: "approved",
  };

  if (strictCityOnly && citySlug) {
    matchStage.citySlug = citySlug;
  }

  const cityPriorityStage = citySlug
    ? {
        $addFields: {
          cityPriority: {
            $cond: [{ $eq: ["$citySlug", citySlug] }, 0, 1],
          },
        },
      }
    : {
        $addFields: {
          cityPriority: 0,
        },
      };

  const pipeline = [
    { $match: matchStage },
    cityPriorityStage,
    { $sort: { cityPriority: 1, createdAt: -1 } },
    { $project: { cityPriority: 0 } },
    ...(limit > 0 ? [{ $limit: limit }] : []),
  ];

  return db
    .collection<ProductDoc>(COLLECTION)
    .aggregate<ProductDoc>(pipeline)
    .toArray();
}

export async function getAllProductsForAdmin(): Promise<ProductDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<ProductDoc>(COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getPendingProducts(): Promise<ProductDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<ProductDoc>(COLLECTION)
    .find({ status: "pending" })
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
