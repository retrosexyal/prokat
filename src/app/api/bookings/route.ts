import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { createBooking, getActiveBookingConflicts } from "@/lib/bookings";
import { toBookingView } from "@/lib/booking-mappers";
import type { UserType } from "@/types";
import type { ProductDoc } from "@/types/product";
import type { BookingDoc } from "@/types/booking";

function normalizeDateStart(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function normalizeDateEnd(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = String(searchParams.get("productId") ?? "").trim();

  if (!productId || !ObjectId.isValid(productId)) {
    return NextResponse.json(
      { error: "Некорректный productId" },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const bookings = await db
    .collection<BookingDoc>("bookings")
    .find({
      productId: new ObjectId(productId),
      status: { $in: ["pending", "confirmed"] },
    })
    .sort({ startDate: 1 })
    .toArray();

  return NextResponse.json(
    bookings.map((booking) => ({
      _id: booking._id?.toString(),
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      status: booking.status,
    })),
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    productId?: string;
    phone?: string;
    message?: string;
    startDate?: string;
    endDate?: string;
  };

  const productId = String(body.productId ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const message = String(body.message ?? "").trim();
  const startDateRaw = String(body.startDate ?? "").trim();
  const endDateRaw = String(body.endDate ?? "").trim();

  if (!productId || !phone || !startDateRaw || !endDateRaw) {
    return NextResponse.json(
      { error: "Заполните обязательные поля" },
      { status: 400 },
    );
  }

  const startDate = normalizeDateStart(startDateRaw);
  const endDate = normalizeDateEnd(endDateRaw);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: "Некорректные даты бронирования" },
      { status: 400 },
    );
  }

  if (startDate > endDate) {
    return NextResponse.json(
      { error: "Дата начала не может быть позже даты окончания" },
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

  const product = await db.collection<ProductDoc>("products").findOne({
    _id: new ObjectId(productId),
    status: "approved",
  });

  if (!product?._id || !product.ownerId) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  /*   if (String(product.ownerId) === String(user._id)) {
    return NextResponse.json(
      { error: "Нельзя бронировать собственный товар" },
      { status: 400 },
    );
  } */

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays =
    Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;

  if (diffDays < product.minDays) {
    return NextResponse.json(
      { error: `Минимальный срок аренды: ${product.minDays} дн.` },
      { status: 400 },
    );
  }

  const conflicts = await getActiveBookingConflicts(
    productId,
    startDate,
    endDate,
  );

  if (conflicts.length > 0) {
    return NextResponse.json(
      { error: "На выбранные даты товар уже забронирован" },
      { status: 409 },
    );
  }

  const booking = await createBooking({
    productId: product._id,
    productOwnerId: product.ownerId,
    renterId: user._id,
    renterEmail: session.user.email,
    phone,
    message: message || undefined,
    startDate,
    endDate,
    status: "pending",
  });

  return NextResponse.json(toBookingView(booking), { status: 201 });
}
