import type { Db } from "mongodb";
import type { CategoryDoc } from "@/types/category";
import { slugify } from "@/lib/slug";
import clientPromise from "./mongodb";

export async function getAllCategories(): Promise<CategoryDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<CategoryDoc>("categories")
    .find({})
    .sort({ name: 1 })
    .toArray();
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryDoc | null> {
  const client = await clientPromise;
  const db = client.db();

  return db.collection<CategoryDoc>("categories").findOne({ slug });
}

export async function createCategory(
  db: Db,
  name: string,
): Promise<CategoryDoc> {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("Category name is required");
  }

  const slug = slugify(normalizedName);
  const now = new Date();

  const existing = await db.collection<CategoryDoc>("categories").findOne({
    $or: [{ name: normalizedName }, { slug }],
  });

  if (existing) {
    throw new Error("Category already exists");
  }

  const doc: CategoryDoc = {
    name: normalizedName,
    slug,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<CategoryDoc>("categories").insertOne(doc);

  return {
    ...doc,
    _id: result.insertedId,
  };
}