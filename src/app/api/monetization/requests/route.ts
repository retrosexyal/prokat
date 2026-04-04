import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { createMonetizationRequest } from "@/lib/monetization-requests";
import { toMonetizationRequestView } from "@/lib/monetization-mappers";
import type { UserType } from "@/types";
import type { ProductDoc } from "@/types/product";
import type { MonetizationRequestType } from "@/types/monetization";

const ALLOWED_TYPES: MonetizationRequestType[] = [
  "increase_limit",
  "boost_product",
];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    type?: MonetizationRequestType;
    productId?: string;
    message?: string;
    requestedLimitIncrease?: number;
    requestedBoostValue?: number;
  };

  const type = body.type;
  const message = String(body.message ?? "").trim();
  const requestedLimitIncrease = Number(body.requestedLimitIncrease ?? 0);
  const requestedBoostValue = Number(body.requestedBoostValue ?? 0);
  const productId = String(body.productId ?? "").trim();

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json(
      { error: "Некорректный тип заявки" },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection<UserType>("users").findOne({
    email: session.user.email,
  });

  if (!user?._id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let product: ProductDoc | null = null;

  if (type === "boost_product") {
    if (!ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Некорректный товар" },
        { status: 400 },
      );
    }

    product = await db.collection<ProductDoc>("products").findOne({
      _id: new ObjectId(productId),
      ownerId: user._id as ObjectId,
    });

    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    if (requestedBoostValue < 1) {
      return NextResponse.json(
        { error: "Укажите, на сколько повысить рейтинг" },
        { status: 400 },
      );
    }
  }

  if (type === "increase_limit" && requestedLimitIncrease < 1) {
    return NextResponse.json(
      { error: "Укажите, на сколько увеличить лимит" },
      { status: 400 },
    );
  }

  const created = await createMonetizationRequest({
    userId: user._id as ObjectId,
    userEmail: session.user.email,
    type,
    status: "pending",
    productId: product?._id,
    productName: product?.name,
    message,
    requestedLimitIncrease:
      type === "increase_limit" ? requestedLimitIncrease : undefined,
    requestedBoostValue:
      type === "boost_product" ? requestedBoostValue : undefined,
    paymentProvider: "erip",
    paymentStatus: "stub",
    paymentStubNote:
      "Заглушка оплаты ЕРИП: после подтверждения администратором здесь можно будет создать реальный EPOS/ЕРИП счёт.",
  });

  return NextResponse.json(toMonetizationRequestView(created), {
    status: 201,
  });
}