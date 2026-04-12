import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import type { UserType } from "@/types";

type SubscriptionBody = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

function validateSubscription(body: SubscriptionBody) {
  const endpoint = String(body.endpoint ?? "").trim();
  const p256dh = String(body.keys?.p256dh ?? "").trim();
  const auth = String(body.keys?.auth ?? "").trim();

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint,
    expirationTime:
      typeof body.expirationTime === "number" ? body.expirationTime : null,
    keys: {
      p256dh,
      auth,
    },
  };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = (await request.json()) as SubscriptionBody;
  const subscription = validateSubscription(rawBody);

  if (!subscription) {
    return NextResponse.json(
      { error: "Некорректная push-подписка" },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db();

  await db.collection<UserType>("users").updateOne(
    { email: session.user.email },
    {
      $pull: {
        pushSubscriptions: {
          endpoint: subscription.endpoint,
        },
      } as never,
    },
  );

  await db.collection<UserType>("users").updateOne(
    { email: session.user.email },
    {
      $push: {
        pushSubscriptions: {
          ...subscription,
          createdAt: new Date(),
          userAgent: request.headers.get("user-agent") ?? "",
        },
      } as never,
    },
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { endpoint?: string };
  const endpoint = String(body.endpoint ?? "").trim();

  if (!endpoint) {
    return NextResponse.json(
      { error: "Endpoint is required" },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db();

  await db.collection<UserType>("users").updateOne(
    { email: session.user.email },
    {
      $pull: {
        pushSubscriptions: {
          endpoint,
        },
      } as never,
    },
  );

  return NextResponse.json({ ok: true });
}