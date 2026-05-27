import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { toBookingViews } from "@/lib/booking-mappers";
import { hashGuestBookingAccessToken } from "@/lib/guest-booking-tokens";
import type { BookingDoc } from "@/types/booking";
import type { ProductDoc } from "@/types/product";

const MAX_GUEST_BOOKINGS_LOOKUP = 50;

type GuestBookingLookup = {
  bookingId?: string;
  accessToken?: string;
};

type GuestBookingLookupBody = {
  bookings?: GuestBookingLookup[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as GuestBookingLookupBody;
  const rawBookings = Array.isArray(body.bookings) ? body.bookings : [];

  const pairs = rawBookings
    .slice(0, MAX_GUEST_BOOKINGS_LOOKUP)
    .map((item) => ({
      bookingId: String(item.bookingId ?? "").trim(),
      accessToken: String(item.accessToken ?? "").trim(),
    }))
    .filter(
      (item) =>
        ObjectId.isValid(item.bookingId) && item.accessToken.length >= 24,
    )
    .map((item) => ({
      bookingObjectId: new ObjectId(item.bookingId),
      guestAccessTokenHash: hashGuestBookingAccessToken(item.accessToken),
    }));

  if (pairs.length === 0) {
    return NextResponse.json([]);
  }

  const client = await clientPromise;
  const db = client.db();

  const bookings = await db
    .collection<BookingDoc>("bookings")
    .aggregate<
      BookingDoc & {
        product?: ProductDoc;
      }
    >([
      {
        $match: {
          $or: pairs.map((pair) => ({
            _id: pair.bookingObjectId,
            guestAccessTokenHash: pair.guestAccessTokenHash,
          })),
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ])
    .toArray();

  return NextResponse.json(toBookingViews(bookings));
}
