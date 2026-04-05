import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { isAdminEmail } from "@/lib/auth";
import {
  updateMonetizationRequestPayment,
  updateMonetizationRequestStatus,
} from "@/lib/monetization-requests";
import { toMonetizationRequestView } from "@/lib/monetization-mappers";
import type { MonetizationRequestStatus } from "@/types/monetization";
import type { UserType } from "@/types";

const ALLOWED_STATUSES: MonetizationRequestStatus[] = [
  "pending",
  "paid",
  "completed",
  "cancelled",
];

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
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    status?: MonetizationRequestStatus;
    applyBoost?: boolean;
    applyLimitIncrease?: boolean;
  };

  const status = body.status;
  const applyBoost = Boolean(body.applyBoost);
  const applyLimitIncrease = Boolean(body.applyLimitIncrease);

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  const existing = await db.collection("monetizationRequests").findOne({
    _id: new ObjectId(id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  if (status === "completed") {
    if (applyBoost && existing.type === "boost_product" && existing.productId) {
      await db.collection("products").updateOne(
        { _id: existing.productId },
        {
          $inc: { ratingBoost: Number(existing.requestedBoostValue ?? 0) },
          $set: { updatedAt: new Date() },
        },
      );
    }

    if (applyLimitIncrease && existing.type === "increase_limit") {
      await db.collection<UserType>("users").updateOne(
        { _id: existing.userId },
        {
          $inc: { productLimit: Number(existing.requestedLimitIncrease ?? 0) },
        },
      );
    }
  }

  if (status === "paid" || status === "completed") {
    await updateMonetizationRequestPayment(id, {
      paymentStatus: "paid",
      paymentError: undefined,
    });
  }

  if (status === "cancelled") {
    await updateMonetizationRequestPayment(id, {
      paymentStatus: "failed",
    });
  }

  const processedByEmail =
    typeof session?.user?.email === "string" ? session.user.email : undefined;

  const updated = await updateMonetizationRequestStatus(
    id,
    status,
    processedByEmail,
  );

  return NextResponse.json(updated ? toMonetizationRequestView(updated) : null);
}