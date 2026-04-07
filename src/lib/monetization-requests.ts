import { Filter, ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type {
  MonetizationRequestDoc,
  MonetizationRequestStatus,
} from "@/types/monetization";

const COLLECTION = "monetizationRequests";

export async function createMonetizationRequest(
  data: Omit<MonetizationRequestDoc, "_id" | "createdAt" | "updatedAt">,
): Promise<MonetizationRequestDoc> {
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();

  const doc: MonetizationRequestDoc = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db
    .collection<MonetizationRequestDoc>(COLLECTION)
    .insertOne(doc);

  return {
    ...doc,
    _id: result.insertedId,
  };
}

export async function getMonetizationRequestsForAdmin(
  options?: {
    includeProcessed?: boolean;
  },
): Promise<MonetizationRequestDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  const query: Filter<MonetizationRequestDoc> = options?.includeProcessed
    ? {}
    : {
        status: {
          $nin: ["completed", "cancelled"],
        },
      };

  return db
    .collection<MonetizationRequestDoc>(COLLECTION)
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getMonetizationRequestsForUser(
  userId: string | ObjectId,
  options?: {
    onlyActive?: boolean;
  },
): Promise<MonetizationRequestDoc[]> {
  const client = await clientPromise;
  const db = client.db();

  const normalizedUserId =
    typeof userId === "string" ? new ObjectId(userId) : userId;

  const query: Filter<MonetizationRequestDoc> = {
    userId: normalizedUserId,
  };

  if (options?.onlyActive) {
    query.paymentStatus = {
      $in: ["pending", "invoice_created"],
    };
  }

  return db
    .collection<MonetizationRequestDoc>(COLLECTION)
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}

export async function updateMonetizationRequestStatus(
  id: string,
  status: MonetizationRequestStatus,
  processedByEmail?: string,
): Promise<MonetizationRequestDoc | null> {
  const client = await clientPromise;
  const db = client.db();

  const update: Partial<MonetizationRequestDoc> & { updatedAt: Date } = {
    status,
    updatedAt: new Date(),
  };

  if (
    status === "completed" ||
    status === "cancelled" ||
    status === "paid"
  ) {
    update.processedAt = new Date();
    update.processedByEmail = processedByEmail;
  }

  const updated = await db
    .collection<MonetizationRequestDoc>(COLLECTION)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" },
    );

  return updated ?? null;
}

export async function updateMonetizationRequestPayment(
  id: string,
  payment: Partial<MonetizationRequestDoc>,
): Promise<MonetizationRequestDoc | null> {
  const client = await clientPromise;
  const db = client.db();

  const updated = await db
    .collection<MonetizationRequestDoc>(COLLECTION)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...payment,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

  return updated ?? null;
}