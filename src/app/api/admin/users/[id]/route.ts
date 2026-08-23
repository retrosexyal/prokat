import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { isAdminEmail } from "@/lib/auth";
import type { UserType } from "@/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Некорректный id пользователя" }, { status: 400 });
  }

  const body = (await request.json()) as { productLimit?: unknown };
  const productLimit = body.productLimit;

  if (
    typeof productLimit !== "number" ||
    !Number.isInteger(productLimit) ||
    productLimit < 0 ||
    productLimit > 10000
  ) {
    return NextResponse.json(
      { error: "Лимит должен быть целым числом от 0 до 10000" },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const updated = await client
    .db()
    .collection<UserType>("users")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { productLimit, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

  if (!updated) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  return NextResponse.json({ id, productLimit: updated.productLimit });
}
