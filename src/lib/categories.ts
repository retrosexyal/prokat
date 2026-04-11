import { ObjectId, type Db } from "mongodb";
import type { CategoryDoc, CreateCategoryInput } from "@/types/category";
import { slugify } from "@/lib/slug";
import clientPromise from "./mongodb";

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : undefined;
}

function normalizeStringArray(values: string[] | undefined): string[] {
  if (!values) {
    return [];
  }

  return values
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function getAllCategories(): Promise<CategoryDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<CategoryDoc>("categories")
    .find({})
    .sort({ level: 1, sortOrder: 1, name: 1 })
    .toArray();
}

export async function getActiveCategories(): Promise<CategoryDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<CategoryDoc>("categories")
    .find({ isActive: true })
    .sort({ level: 1, sortOrder: 1, name: 1 })
    .toArray();
}

export async function getRootCategories(): Promise<CategoryDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<CategoryDoc>("categories")
    .find({
      isActive: true,
      $or: [{ parentId: null }, { parentId: { $exists: false } }],
    })
    .sort({ sortOrder: 1, name: 1 })
    .toArray();
}

export async function getChildCategories(
  parentId: string,
): Promise<CategoryDoc[]> {
  if (!ObjectId.isValid(parentId)) {
    return [];
  }

  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<CategoryDoc>("categories")
    .find({
      isActive: true,
      parentId: new ObjectId(parentId),
    })
    .sort({ sortOrder: 1, name: 1 })
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
  input: CreateCategoryInput,
): Promise<CategoryDoc> {
  const normalizedName = input.name.trim();

  if (!normalizedName) {
    throw new Error("Category name is required");
  }

  const slug = slugify(input.slug?.trim() || normalizedName);

  if (!slug) {
    throw new Error("Category slug is required");
  }

  let parentObjectId: ObjectId | null = null;
  let level: 1 | 2 = 1;

  if (input.parentId) {
    if (!ObjectId.isValid(input.parentId)) {
      throw new Error("Invalid parent category");
    }

    parentObjectId = new ObjectId(input.parentId);

    const parentCategory = await db
      .collection<CategoryDoc>("categories")
      .findOne({ _id: parentObjectId });

    if (!parentCategory) {
      throw new Error("Parent category not found");
    }

    if (parentCategory.level !== 1) {
      throw new Error("Only root categories can be parents");
    }

    level = 2;
  }

  const existing = await db.collection<CategoryDoc>("categories").findOne({
    slug,
  });

  if (existing) {
    throw new Error("Category already exists");
  }

  const now = new Date();

  const doc: CategoryDoc = {
    name: normalizedName,
    slug,

    parentId: parentObjectId,
    level,

    isActive: input.isActive ?? true,
    sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 100,
    indexingMode: input.indexingMode ?? "index",

    seoTitle: normalizeOptionalText(input.seoTitle),
    seoDescription: normalizeOptionalText(input.seoDescription),
    h1: normalizeOptionalText(input.h1),
    introText: normalizeOptionalText(input.introText),
    synonyms: normalizeStringArray(input.synonyms),
    faq: (input.faq ?? [])
      .map((item) => ({
        q: item.q.trim(),
        a: item.a.trim(),
      }))
      .filter((item) => item.q && item.a),

    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<CategoryDoc>("categories").insertOne(doc);

  return {
    ...doc,
    _id: result.insertedId,
  };
}