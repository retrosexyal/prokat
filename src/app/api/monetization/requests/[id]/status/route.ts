import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { getExpressPayInvoiceStatus } from "@/lib/express-pay";
import type { UserType } from "@/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Некорректный id заявки" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection<UserType>("users").findOne({
    email: session.user.email,
  });

  if (!user?._id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const requestDoc = await db.collection("monetizationRequests").findOne({
    _id: new ObjectId(id),
    userId: user._id,
  });

  if (!requestDoc) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  if (!requestDoc.paymentInvoiceNo) {
    return NextResponse.json(
      { error: "У заявки нет номера счёта" },
      { status: 400 },
    );
  }

  const status = await getExpressPayInvoiceStatus(
    Number(requestDoc.paymentInvoiceNo),
  );

  return NextResponse.json(status);
}