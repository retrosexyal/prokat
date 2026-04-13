import type { Filter } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { sendPushNotification } from "@/lib/push";
import type { UserType } from "@/types";

type AdminNotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function notifyAdmin(payload: AdminNotificationPayload): Promise<void> {
  const adminEmail = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

  if (!adminEmail) {
    return;
  }

  const client = await clientPromise;
  const db = client.db();

  const admin = await db.collection<UserType>("users").findOne({
    email: adminEmail,
  });

  const subscriptions = admin?.pushSubscriptions ?? [];

  if (!admin?._id || subscriptions.length === 0) {
    return;
  }

  const pushResult = await sendPushNotification(subscriptions, {
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/admin",
    icon: "/favicon-192x192.png",
    badge: "/favicon-192x192.png",
  });

  if (pushResult.expiredEndpoints.length > 0) {
    await db.collection<UserType>("users").updateOne(
      { _id: admin._id } as unknown as Filter<UserType>,
      {
        $pull: {
          pushSubscriptions: {
            endpoint: { $in: pushResult.expiredEndpoints },
          },
        } as never,
      },
    );
  }
}