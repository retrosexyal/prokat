import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type { BookingDoc } from "@/types/booking";
import type { ProductDoc } from "@/types/product";

export async function createBooking(
  input: Omit<BookingDoc, "_id" | "createdAt" | "updatedAt">,
): Promise<BookingDoc> {
  const client = await clientPromise;
  const db = client.db();

  const now = new Date();

  const doc: BookingDoc = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<BookingDoc>("bookings").insertOne(doc);

  return {
    ...doc,
    _id: result.insertedId,
  };
}

export async function getActiveBookingConflicts(
  productId: string,
  startDate: Date,
  endDate: Date,
): Promise<BookingDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  return db.collection<BookingDoc>("bookings")
    .find({
      productId: new ObjectId(productId),
      status: "confirmed",
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    })
    .toArray();
}

export async function getBookingsForOwner(ownerId: string) {
  const client = await clientPromise;
  const db = client.db();

  const bookings = await db
    .collection<BookingDoc>("bookings")
    .aggregate([
      {
        $match: {
          productOwnerId: new ObjectId(ownerId),
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

  return bookings as Array<
    BookingDoc & {
      product?: ProductDoc;
    }
  >;
}

export async function getBookingsByRenter(renterId: string) {
  const client = await clientPromise;
  const db = client.db();

  const bookings = await db
    .collection<BookingDoc>("bookings")
    .aggregate([
      {
        $match: {
          renterId: new ObjectId(renterId),
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

  return bookings as Array<
    BookingDoc & {
      product?: ProductDoc;
    }
  >;
}