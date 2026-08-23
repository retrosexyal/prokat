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
import { notifyUser } from "@/lib/user-notifications";
import { getProductPath } from "@/lib/routes";
import { getSiteUrl } from "@/lib/site-url";
import { getPeakReservedQuantity } from "@/lib/booking-capacity";
import {
  createGuestBookingAccessToken,
  hashGuestBookingAccessToken,
} from "@/lib/guest-booking-tokens";

const LEGAL_DOCUMENTS_VERSION = "2026-05-03";

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
      quantity: booking.quantity ?? 1,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  const body = (await request.json()) as {
    productId?: string;
    phone?: string;
    message?: string;
    quantity?: number;
    startDate?: string;
    endDate?: string;
    acceptedPrivacyPolicy?: boolean;
  };

  const productId = String(body.productId ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const message = String(body.message ?? "").trim();
  const quantity = Number(body.quantity ?? 1);
  const startDateRaw = String(body.startDate ?? "").trim();
  const endDateRaw = String(body.endDate ?? "").trim();
  const acceptedPrivacyPolicy = body.acceptedPrivacyPolicy === true;

  if (!acceptedPrivacyPolicy) {
    return NextResponse.json(
      {
        error:
          "Необходимо подтвердить ознакомление с Политикой обработки персональных данных",
      },
      { status: 400 },
    );
  }

  if (!productId || !phone || !startDateRaw || !endDateRaw) {
    return NextResponse.json(
      { error: "Заполните обязательные поля" },
      { status: 400 },
    );
  }

  if (!ObjectId.isValid(productId)) {
    return NextResponse.json(
      { error: "Некорректный productId" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json(
      { error: "Количество товаров должно быть целым числом не меньше 1" },
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

  const totalQuantity = product.quantity ?? 1;

  if (quantity > totalQuantity) {
    return NextResponse.json(
      { error: `Доступно товаров: ${totalQuantity}` },
      { status: 400 },
    );
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

  const conflicts = await db
    .collection<BookingDoc>("bookings")
    .find({
      productId: product._id,
      status: "confirmed",
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    })
    .project<Pick<BookingDoc, "startDate" | "endDate" | "quantity">>({
      startDate: 1,
      endDate: 1,
      quantity: 1,
    })
    .toArray();
  const reservedQuantity = getPeakReservedQuantity(
    conflicts,
    startDate,
    endDate,
  );

  if (reservedQuantity + quantity > totalQuantity) {
    return NextResponse.json(
      { error: "На выбранные даты свободного количества товара уже нет" },
      { status: 409 },
    );
  }

  const guestIpAddress = !session?.user?.email
    ? getClientIpAddress(request)
    : undefined;
  let guestAccessToken: string | undefined;
  let guestAccessTokenHash: string | undefined;

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

    guestAccessToken = createGuestBookingAccessToken();
    guestAccessTokenHash = hashGuestBookingAccessToken(guestAccessToken);
  }

  const booking = await createBooking({
    productId: product._id,
    productOwnerId: product.ownerId,
    renterId,
    renterEmail,
    guestIpAddress,
    guestAccessTokenHash,
    guestAccessTokenCreatedAt: guestAccessToken ? new Date() : undefined,
    phone,
    message: message || undefined,
    quantity,
    startDate,
    endDate,
    status: "pending",
    personalDataConsentAccepted: true,
    personalDataConsentVersion: LEGAL_DOCUMENTS_VERSION,
    personalDataConsentAcceptedAt: new Date(),
  });

  try {
    const owner = await db
      .collection<UserType>("users")
      .findOne({ _id: product.ownerId } as unknown as Filter<UserType>);

    const productPath = getProductPath({
      citySlug: product.citySlug,
      category: product.category,
      slug: product.slug,
    });
    const productUrl = `${getSiteUrl()}${productPath}`;
    const notificationLines = [
      `Товар: ${product.name}`,
      `Телефон: ${phone}`,
      `Ссылка: ${productUrl}`,
      `Количество товаров: ${quantity}`,
      `Количество дней: ${diffDays}`,
      `Даты: ${formatDate(startDate)} — ${formatDate(endDate)}`,
      message ? `Сообщение: ${message}` : "",
    ].filter(Boolean);

    await notifyUser(db, owner, {
      title: "Новое бронирование",
      body: notificationLines.join("\n"),
      url: productPath,
      icon: "/favicon-192x192.png",
      badge: "/favicon-192x192.png",
    });
  } catch (error) {
    console.error("Booking created, but notification failed:", error);
  }

  return NextResponse.json(
    {
      ...toBookingView({
        ...booking,
        product,
      }),
      guestAccessToken,
    },
    { status: 201 },
  );
}
