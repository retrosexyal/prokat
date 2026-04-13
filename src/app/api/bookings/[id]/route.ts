import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import type { BookingDoc } from "@/types/booking";
import type { UserType } from "@/types";
import type { ProductDoc } from "@/types/product";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getAuthorizedBooking(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!ObjectId.isValid(id)) {
    return {
      error: NextResponse.json(
        { error: "Некорректный id бронирования" },
        { status: 400 },
      ),
    };
  }

  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection<UserType>("users").findOne({
    email: session.user.email,
  });

  if (!user?._id) {
    return {
      error: NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 },
      ),
    };
  }

  const booking = await db.collection<BookingDoc>("bookings").findOne({
    _id: new ObjectId(id),
  });

  if (!booking?._id) {
    return {
      error: NextResponse.json(
        { error: "Бронирование не найдено" },
        { status: 404 },
      ),
    };
  }

  if (String(booking.productOwnerId) !== String(user._id)) {
    return {
      error: NextResponse.json({ error: "Нет доступа" }, { status: 403 }),
    };
  }

  return { db, booking };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const authorized = await getAuthorizedBooking(id);

  if (authorized.error) {
    return authorized.error;
  }

  const { db, booking } = authorized;

  const body = (await request.json()) as {
    status?: "confirmed" | "cancelled";
  };

  const nextStatus = body.status;

  if (!nextStatus || !["confirmed", "cancelled"].includes(nextStatus)) {
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json(
      { error: "Отменённую бронь нельзя изменить" },
      { status: 400 },
    );
  }

  if (nextStatus === "confirmed") {
    const product = await db.collection<ProductDoc>("products").findOne({
      _id: booking.productId,
    });

    if (!product?._id) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    const conflicts = await db.collection<BookingDoc>("bookings").countDocuments(
      {
        _id: { $ne: booking._id },
        productId: booking.productId,
        status: "confirmed",
        startDate: { $lte: booking.endDate },
        endDate: { $gte: booking.startDate },
      },
    );

    if (conflicts >= (product.quantity ?? 1)) {
      return NextResponse.json(
        {
          error:
            "Невозможно подтвердить: свободного количества на эти даты уже нет",
        },
        { status: 409 },
      );
    }
  }

  const updatedAt = new Date();

  await db.collection<BookingDoc>("bookings").updateOne(
    { _id: booking._id },
    {
      $set: {
        status: nextStatus,
        updatedAt,
      },
    },
  );

  const updatedBooking = await db.collection<BookingDoc>("bookings").findOne({
    _id: booking._id,
  });

  return NextResponse.json(updatedBooking);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const authorized = await getAuthorizedBooking(id);

  if (authorized.error) {
    return authorized.error;
  }

  const { db, booking } = authorized;

  await db.collection<BookingDoc>("bookings").deleteOne({
    _id: booking._id,
  });

  return NextResponse.json({ success: true, deletedId: id });
}