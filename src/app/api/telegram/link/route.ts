import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import type { UserType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getBotUsername(): string {
  const username = String(process.env.TELEGRAM_BOT_USERNAME ?? "")
    .trim()
    .replace(/^@/, "");

  if (!username) {
    throw new Error("TELEGRAM_BOT_USERNAME is missing");
  }

  return username;
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const client = await clientPromise;
  const db = client.db();

  const email = session.user.email.toLowerCase();

  const user = await db.collection<UserType>("users").findOne({ email });

  return { db, email, user };
}

export async function GET() {
  const context = await getCurrentUser();

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!context.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    connected: Boolean(
      context.user.telegramNotificationsEnabled &&
        context.user.telegramChatId,
    ),
    username: context.user.telegramUsername ?? "",
    linkedAt: context.user.telegramLinkedAt ?? null,
  });
}

export async function POST() {
  const context = await getCurrentUser();

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botUsername = getBotUsername();

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS);

  await context.db.collection<UserType>("users").updateOne(
    { email: context.email },
    {
      $set: {
        telegramLinkTokenHash: hashToken(token),
        telegramLinkTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    },
  );

  return NextResponse.json({
    url: `https://t.me/${botUsername}?start=${token}`,
    expiresAt: expiresAt.toISOString(),
  });
}

export async function DELETE() {
  const context = await getCurrentUser();

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await context.db.collection<UserType>("users").updateOne(
    { email: context.email },
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
        telegramLinkTokenHash: "",
        telegramLinkTokenExpiresAt: "",
      } as never,
    },
  );

  return NextResponse.json({ ok: true });
}