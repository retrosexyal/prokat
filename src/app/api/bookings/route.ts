import { NextResponse } from "next/server";
import { ObjectId, Filter } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { createBooking } from "@/lib/bookings";
import { toBookingView } from "@/lib/booking-mappers";
import type { UserType } from "@/types";
import type { ProductDoc } from "@/types/product";
import type { BookingDoc } from "@/types/booking";
import { sendPushNotification } from "@/lib/push";

const GUEST_BOOKING_LIMIT_PER_HOUR = 3;

function normalizeDateStart(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function normalizeDateEnd(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

function getClientIpAddress(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "";
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ru-RU").format(value);
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

  const product = await db.collection<ProductDoc>("products").findOne({
    _id: new ObjectId(productId),
  });

  if (!product?._id) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  const bookings = await db
    .collection<BookingDoc>("bookings")
    .find({
      productId: new ObjectId(productId),
      status: "confirmed",
    })
    .sort({ startDate: 1 })
    .toArray();

  return NextResponse.json({
    totalQuantity: product.quantity ?? 1,
    bookings: bookings.map((booking) => ({
      _id: booking._id?.toString(),
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      status: booking.status,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

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

  const product = await db.collection<ProductDoc>("products").findOne({
    _id: new ObjectId(productId),
    status: "approved",
  });

  if (!product?._id || !product.ownerId) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays =
    Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;

  if (diffDays < product.minDays) {
    return NextResponse.json(
      { error: `Минимальный срок аренды: ${product.minDays} дн.` },
      { status: 400 },
    );
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let renterId: ObjectId | undefined;
  let renterEmail: string | undefined;

  if (session?.user?.email) {
    const user = await db.collection<UserType>("users").findOne({
      email: session.user.email,
    });

    if (!user?._id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    renterId = user._id as ObjectId;
    renterEmail = session.user.email;

    const existingUserBooking = await db
      .collection<BookingDoc>("bookings")
      .findOne({
        productId: product._id,
        renterId: user._id as ObjectId,
        status: { $in: ["pending", "confirmed"] },
        endDate: { $gte: todayStart },
      });

    if (existingUserBooking) {
      return NextResponse.json(
        {
          error:
            "У вас уже есть активная или ожидающая подтверждения заявка на этот товар",
        },
        { status: 409 },
      );
    }
  }

  const conflicts = await db.collection<BookingDoc>("bookings").countDocuments({
    productId: product._id,
    status: "confirmed",
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });

  if (conflicts >= (product.quantity ?? 1)) {
    return NextResponse.json(
      { error: "На выбранные даты свободного количества товара уже нет" },
      { status: 409 },
    );
  }

  const guestIpAddress = !session?.user?.email
    ? getClientIpAddress(request)
    : undefined;

  if (!session?.user?.email) {
    if (!guestIpAddress) {
      return NextResponse.json(
        { error: "Не удалось определить IP адрес пользователя" },
        { status: 400 },
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentBookingsCount = await db
      .collection<BookingDoc>("bookings")
      .countDocuments({
        guestIpAddress,
        createdAt: { $gte: oneHourAgo },
        status: { $in: ["pending", "confirmed"] },
      });

    if (recentBookingsCount >= GUEST_BOOKING_LIMIT_PER_HOUR) {
      return NextResponse.json(
        {
          error:
            "С этого IP адреса уже создано максимальное количество бронирований за последний час. Попробуйте позже.",
        },
        { status: 429 },
      );
    }

    const existingGuestBooking = await db
      .collection<BookingDoc>("bookings")
      .findOne({
        productId: product._id,
        guestIpAddress,
        status: { $in: ["pending", "confirmed"] },
        endDate: { $gte: todayStart },
      });

    if (existingGuestBooking) {
      return NextResponse.json(
        {
          error:
            "С этого IP уже есть активная или ожидающая подтверждения заявка на этот товар",
        },
        { status: 409 },
      );
    }
  }

  const booking = await createBooking({
    productId: product._id,
    productOwnerId: product.ownerId,
    renterId,
    renterEmail,
    guestIpAddress,
    phone,
    message: message || undefined,
    startDate,
    endDate,
    status: "pending",
  });

  try {
    const owner = await db
      .collection<UserType>("users")
      .findOne({ _id: product.ownerId } as unknown as Filter<UserType>);

    const subscriptions = owner?.pushSubscriptions ?? [];

    if (subscriptions.length > 0) {
      const senderLabel = renterEmail ? renterEmail : `Гость · ${phone}`;

      const pushResult = await sendPushNotification(subscriptions, {
        title: "Новое бронирование",
        body: `${product.name}: ${formatDate(startDate)} — ${formatDate(endDate)}. ${senderLabel}`,
        url: "/dashboard",
        icon: "/favicon-192x192.png",
        badge: "/favicon-192x192.png",
      });

      if (pushResult.expiredEndpoints.length > 0) {
        await db
          .collection<UserType>("users")
          .updateOne({ _id: product.ownerId } as unknown as Filter<UserType>, {
            $pull: {
              pushSubscriptions: {
                endpoint: { $in: pushResult.expiredEndpoints },
              },
            } as never,
          });
      }
    }
  } catch (error) {
    console.error("Booking created, but push notification failed:", error);
  }

  return NextResponse.json(toBookingView(booking), { status: 201 });
}
