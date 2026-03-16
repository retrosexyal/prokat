import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { createCategory } from "@/lib/categories";
import { toCategoryView } from "@/lib/category-mappers";
import { isAdminEmail } from "@/lib/auth";


export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Название категории обязательно" },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const category = await createCategory(db, name);

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

    return NextResponse.json({ error: message }, { status: 400 });
  }
}