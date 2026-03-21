import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import type { UserType } from "@/types";

type UpdateMeBody = {
  name?: string;
  phone?: string;
  showPhoneInProducts?: boolean;
  pickupAddress?: string;
};

function normalizePhone(value: string): string {
  return value.trim();
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as UpdateMeBody;

  const name = String(body.name ?? "").trim();
  const pickupAddress = String(body.pickupAddress ?? "").trim();
  const phone = normalizePhone(String(body.phone ?? ""));
  const showPhoneInProducts = Boolean(body.showPhoneInProducts);

  if (!name) {
    return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
  }

  if (!phone) {
    return NextResponse.json({ error: "Укажите телефон" }, { status: 400 });
  }

  if (phone.length < 7) {
    return NextResponse.json(
      { error: "Некорректный номер телефона" },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const updatedUser = await db.collection<UserType>("users").findOneAndUpdate(
    { email: session.user.email },
    {
      $set: {
        name,
        phone,
        showPhoneInProducts,
        pickupAddress,
      },
    },
    { returnDocument: "after" },
  );

  if (!updatedUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    email: updatedUser.email,
    name: updatedUser.name ?? "",
    phone: updatedUser.phone ?? "",
    showPhoneInProducts: Boolean(updatedUser.showPhoneInProducts),
  });
}
