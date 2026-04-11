import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { createCategory } from "@/lib/categories";
import { toCategoryView } from "@/lib/category-mappers";
import { isAdminEmail } from "@/lib/auth";
import type { CreateCategoryInput } from "@/types/category";

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  const input: CreateCategoryInput = {
    name: String(body?.name ?? "").trim(),
    slug: String(body?.slug ?? "").trim(),
    parentId: body?.parentId ? String(body.parentId) : null,

    isActive: Boolean(body?.isActive ?? true),
    sortOrder: Number(body?.sortOrder ?? 100),
    indexingMode: body?.indexingMode === "noindex" ? "noindex" : "index",

    seoTitle: String(body?.seoTitle ?? "").trim(),
    seoDescription: String(body?.seoDescription ?? "").trim(),
    h1: String(body?.h1 ?? "").trim(),
    introText: String(body?.introText ?? "").trim(),
    synonyms: normalizeStringArray(body?.synonyms),
    faq: Array.isArray(body?.faq)
      ? body.faq.map((item: { q?: unknown; a?: unknown }) => ({
          q: String(item?.q ?? "").trim(),
          a: String(item?.a ?? "").trim(),
        }))
      : [],
  };

  if (!input.name) {
    return NextResponse.json(
      { error: "Название категории обязательно" },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const category = await createCategory(db, input);

    return NextResponse.json(toCategoryView(category), { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось создать категорию";

    if (message === "Category already exists") {
      return NextResponse.json(
        { error: "Такая категория уже существует" },
        { status: 409 },
      );
    }

    if (message === "Parent category not found") {
      return NextResponse.json(
        { error: "Родительская категория не найдена" },
        { status: 400 },
      );
    }

    if (message === "Only root categories can be parents") {
      return NextResponse.json(
        { error: "Подкатегорию можно создавать только внутри корневой категории" },
        { status: 400 },
      );
    }

    if (message === "Invalid parent category") {
      return NextResponse.json(
        { error: "Некорректный parentId" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}