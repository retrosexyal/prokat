import type { Db, Filter } from "mongodb";
import { sendPushNotification } from "@/lib/push";
import { sendTelegramNotification } from "@/lib/telegram";
import type { UserType } from "@/types";

type UserNotificationPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
};

export async function notifyUser(
  db: Db,
  user: UserType | null | undefined,
  payload: UserNotificationPayload,
): Promise<void> {
  if (!user?._id) return;

  const users = db.collection<UserType>("users");
  const subscriptions = user.pushSubscriptions ?? [];

  if (subscriptions.length > 0) {
    try {
      const pushResult = await sendPushNotification(subscriptions, {
        title: payload.title,
        body: payload.body,
        url: payload.url,
        icon: payload.icon ?? "/favicon-192x192.png",
        badge: payload.badge ?? "/favicon-192x192.png",
      });

      if (pushResult.expiredEndpoints.length > 0) {
        await users.updateOne(
          { _id: user._id } as unknown as Filter<UserType>,
          {
            $pull: {
              pushSubscriptions: {
                endpoint: { $in: pushResult.expiredEndpoints },
              },
            } as never,
          },
        );
      }
    } catch (error) {
      console.error("Push notification failed:", error);
    }
  }

  if (user.telegramNotificationsEnabled && user.telegramChatId) {
    try {
      const telegramResult = await sendTelegramNotification(
        user.telegramChatId,
        {
          title: payload.title,
          body: payload.body,
          url: payload.url,
        },
      );

      if (!telegramResult.ok && telegramResult.shouldDisable) {
        await users.updateOne(
          { _id: user._id } as unknown as Filter<UserType>,
          {
            $set: {
              telegramNotificationsEnabled: false,
              updatedAt: new Date(),
            },
            $unset: {
              telegramChatId: "",
              telegramUsername: "",
              telegramFirstName: "",
              telegramLastName: "",
              telegramLinkedAt: "",
            } as never,
          },
        );
      }
    } catch (error) {
      console.error("Telegram notification failed:", error);
    }
  }
}