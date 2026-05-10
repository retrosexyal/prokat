import { ObjectId, type UpdateFilter } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type { ContactMessageDoc } from "@/types/contact-message";

const COLLECTION = "contactMessages";

export async function createContactMessage(
  data: Omit<
    ContactMessageDoc,
    "_id" | "isViewed" | "createdAt" | "updatedAt"
  >,
): Promise<ContactMessageDoc> {
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();

  const doc: ContactMessageDoc = {
    ...data,
    isViewed: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db
    .collection<ContactMessageDoc>(COLLECTION)
    .insertOne(doc);

  return {
    ...doc,
    _id: result.insertedId,
  };
}

export async function getContactMessagesForAdmin(): Promise<
  ContactMessageDoc[]
> {
  const client = await clientPromise;
  const db = client.db();

  return db
    .collection<ContactMessageDoc>(COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

export async function updateContactMessageViewed(
  id: string,
  viewed: boolean,
  viewedByEmail?: string,
): Promise<ContactMessageDoc | null> {
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();

  const update: UpdateFilter<ContactMessageDoc> = viewed
    ? {
        $set: {
          isViewed: true,
          viewedAt: now,
          viewedByEmail,
          updatedAt: now,
        },
      }
    : {
        $set: {
          isViewed: false,
          updatedAt: now,
        },
        $unset: {
          viewedAt: "",
          viewedByEmail: "",
        },
      };

  const updated = await db
    .collection<ContactMessageDoc>(COLLECTION)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      update,
      { returnDocument: "after" },
    );

  return updated ?? null;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db();

  const result = await db.collection<ContactMessageDoc>(COLLECTION).deleteOne({
    _id: new ObjectId(id),
  });

  return result.deletedCount === 1;
}