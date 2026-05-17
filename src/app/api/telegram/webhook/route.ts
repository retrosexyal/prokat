import { createHash } from "crypto";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { sendTelegramText } from "@/lib/telegram";
import type { UserType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: {
      id?: number;
      type?: string;
    };
    from?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function extractStartToken(text: string): string | null {
  const match = text.trim().match(/^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]+))?$/);

  return match?.[1] ?? null;
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const incomingSecret = request.headers.get(
    "x-telegram-bot-api-secret-token",
  );

  if (!secret || incomingSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update = (await request.json()) as TelegramUpdate;

    const message = update.message;
    const text = message?.text ?? "";
    const chatId = message?.chat?.id;
    const chatType = message?.chat?.type;

    if (!chatId || !text) {
      return NextResponse.json({ ok: true });
    }

    if (chatType !== "private") {
      await sendTelegramText(
        chatId,
        "Подключение уведомлений доступно только в личном чате с ботом.",
      );

      return NextResponse.json({ ok: true });
    }

    const token = extractStartToken(text);

    if (!token) {
      await sendTelegramText(
        chatId,
        "Чтобы подключить уведомления, откройте профиль на сайте и нажмите «Подключить Telegram».",
      );

      return NextResponse.json({ ok: true });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection<UserType>("users");

    const now = new Date();

    const updatedUser = await users.findOneAndUpdate(
      {
        telegramLinkTokenHash: hashToken(token),
        telegramLinkTokenExpiresAt: { $gt: now },
      },
      {
        $set: {
          telegramChatId: chatId,
          telegramUsername: message.from?.username ?? "",
          telegramFirstName: message.from?.first_name ?? "",
          telegramLastName: message.from?.last_name ?? "",
          telegramLinkedAt: now,
          telegramNotificationsEnabled: true,
          updatedAt: now,
        },
        $unset: {
          telegramLinkTokenHash: "",
          telegramLinkTokenExpiresAt: "",
        } as never,
      },
      { returnDocument: "after" },
    );

    if (!updatedUser) {
      await sendTelegramText(
        chatId,
        "Ссылка устарела или недействительна. Откройте сайт и нажмите «Подключить Telegram» ещё раз.",
      );

      return NextResponse.json({ ok: true });
    }

    await sendTelegramText(
      chatId,
      "Готово ✅ Telegram-уведомления подключены.",
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook failed:", error);

    return NextResponse.json({ ok: true });
  }
}