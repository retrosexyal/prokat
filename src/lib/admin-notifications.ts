import clientPromise from "@/lib/mongodb";
import { notifyUser } from "@/lib/user-notifications";
import type { UserType } from "@/types";

type AdminNotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function notifyAdmin(
  payload: AdminNotificationPayload,
): Promise<void> {
  const adminEmail = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

  if (!adminEmail) {
    return;
  }

  const client = await clientPromise;
  const db = client.db();

  const admin = await db.collection<UserType>("users").findOne({
    email: adminEmail,
  });

  await notifyUser(db, admin, {
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/admin",
    icon: "/favicon-192x192.png",
    badge: "/favicon-192x192.png",
  });
}