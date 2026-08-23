import clientPromise from "@/lib/mongodb";
import type { AdminUserView } from "@/types/admin";

const FREE_PRODUCTS_LIMIT = 3;

type AdminUserAggregation = {
  _id: { toString(): string };
  email: string;
  name?: string;
  phone?: string;
  productLimit?: number;
  productCount: number;
  createdAt: Date;
};

export async function getAllUsersForAdmin(): Promise<AdminUserView[]> {
  const client = await clientPromise;
  const db = client.db();

  const users = await db
    .collection("users")
    .aggregate<AdminUserAggregation>([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "ownerId",
          as: "products",
        },
      },
      { $addFields: { productCount: { $size: "$products" } } },
      {
        $project: {
          email: 1,
          name: 1,
          phone: 1,
          productLimit: 1,
          productCount: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();

  return users.map((user) => ({
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    phone: user.phone,
    productLimit: user.productLimit ?? FREE_PRODUCTS_LIMIT,
    productCount: user.productCount,
    createdAt: user.createdAt.toISOString(),
  }));
}
