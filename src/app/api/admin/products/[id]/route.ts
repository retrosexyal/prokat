import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { cloudinary } from "@/lib/cloudinary";
import clientPromise from "@/lib/mongodb";
import type { ProductDoc } from "@/types/product";
import type { BoostDuration } from "@/types/monetization";
import {
  BOOST_FIXED_VALUE,
  calculateBoostExpiration,
} from "@/lib/boost-pricing";
import { toProductView } from "@/lib/product-mappers";

function isAdminEmail(email: string | null | undefined) {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return false;
  }

  return email?.toLowerCase() === adminEmail.toLowerCase();
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const body = await request.json();

  const boostAction = body?.boostAction as "apply" | "remove" | undefined;
  const boostDuration = body?.boostDuration as BoostDuration | undefined;
  const allowedBoostDurations: BoostDuration[] = ["week", "month", "year"];

  const status = body?.status as ProductDoc["status"] | undefined;
  const selectedCategory = String(body?.category ?? "").trim();

  const createCategoryInput = body?.createCategory
    ? {
        name: String(body.createCategory.name ?? "").trim(),
        slug: String(body.createCategory.slug ?? "").trim(),
        parentId: body.createCategory.parentId
          ? String(body.createCategory.parentId)
          : null,
        isActive: true,
        sortOrder: Number(body.createCategory.sortOrder ?? 100),
        indexingMode: "index" as const,
      }
    : null;

  if (
    status === "approved" &&
    !selectedCategory &&
    !createCategoryInput?.name
  ) {
    return NextResponse.json(
      { error: "Перед одобрением выберите или создайте категорию" },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db();

  if (boostAction) {
    if (!(["apply", "remove"] as const).includes(boostAction)) {
      return NextResponse.json(
        { error: "Некорректное действие с бустом" },
        { status: 400 },
      );
    }

    if (
      boostAction === "apply" &&
      (!boostDuration || !allowedBoostDurations.includes(boostDuration))
    ) {
      return NextResponse.json(
        { error: "Выберите корректный срок буста" },
        { status: 400 },
      );
    }

    const productId = new ObjectId(id);
    const product = await db.collection<ProductDoc>("products").findOne({ _id: productId });
    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    if (boostAction === "remove") {
      if (typeof product.boostRestoreValue !== "number") {
        return NextResponse.json({ error: "У товара нет активного буста" }, { status: 400 });
      }

      const updated = await db.collection<ProductDoc>("products").findOneAndUpdate(
        { _id: productId },
        {
          $set: {
            ratingBoost: product.boostRestoreValue,
            priorityScore: product.boostRestoreValue,
            updatedAt: new Date(),
          },
          $unset: {
            boostRestoreValue: "",
            boostAppliedAt: "",
            boostExpiresAt: "",
            boostDuration: "",
          },
        },
        { returnDocument: "after" },
      );

      return NextResponse.json(updated ? toProductView(updated) : null);
    }

    const appliedAt = new Date();
    const restoreValue =
      typeof product.boostRestoreValue === "number"
        ? product.boostRestoreValue
        : Number(product.ratingBoost ?? 0);
    const boostedRating = restoreValue + BOOST_FIXED_VALUE;
    const updated = await db.collection<ProductDoc>("products").findOneAndUpdate(
      { _id: productId },
      {
        $set: {
          ratingBoost: boostedRating,
          priorityScore: boostedRating,
          boostRestoreValue: restoreValue,
          boostAppliedAt: appliedAt,
          boostExpiresAt: calculateBoostExpiration(boostDuration as BoostDuration, appliedAt),
          boostDuration,
          updatedAt: appliedAt,
        },
      },
      { returnDocument: "after" },
    );

    return NextResponse.json(updated ? toProductView(updated) : null);
  }

  let finalCategory = selectedCategory;

  if (createCategoryInput?.name) {
    const { createCategory } = await import("@/lib/categories");

    const createdCategory = await createCategory(db, createCategoryInput);
    finalCategory = createdCategory.slug;
  }

  const setPatch: Partial<ProductDoc> = {
    updatedAt: new Date(),
  };

  if (status) {
    setPatch.status = status;
  }

  if (finalCategory) {
    setPatch.category = finalCategory;
  }

  const updateQuery: {
    $set: Partial<ProductDoc>;
    $unset?: Record<string, true | "" | 1>;
  } = {
    $set: setPatch,
  };
  if (finalCategory) {
    updateQuery.$unset = {
      suggestedCategoryName: "",
    };
  }

  const updated = await db
    .collection<ProductDoc>("products")
    .findOneAndUpdate({ _id: new ObjectId(id) }, updateQuery, {
      returnDocument: "after",
    });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  const product = await db.collection<ProductDoc>("products").findOne({
    _id: new ObjectId(id),
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const publicIds = product.imagePublicIds ?? [];

  for (const publicId of publicIds) {
    await cloudinary.uploader.destroy(publicId);
  }

  await db.collection<ProductDoc>("products").deleteOne({
    _id: new ObjectId(id),
  });

  return NextResponse.json({ ok: true });
}
