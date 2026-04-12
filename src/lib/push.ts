import webpush from "web-push";

export type StoredPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  userAgent?: string;
};

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
};

let isConfigured = false;

function ensureWebPushConfigured() {
  if (isConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("Web Push env vars are not configured");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  isConfigured = true;
}

export function getPublicVapidKey(): string {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing");
  }

  return publicKey;
}

export async function sendPushNotification(
  subscriptions: StoredPushSubscription[],
  payload: PushPayload,
): Promise<{
  expiredEndpoints: string[];
}> {
  ensureWebPushConfigured();

  const expiredEndpoints: string[] = [];
  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime ?? null,
            keys: subscription.keys,
          },
          body,
        );
      } catch (error: unknown) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : undefined;

        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.push(subscription.endpoint);
          return;
        }

        console.error("Push send failed:", error);
      }
    }),
  );

  return { expiredEndpoints };
}