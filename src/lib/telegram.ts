import { getSiteUrl } from "@/lib/site-url";

type TelegramNotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

type TelegramSendResult = {
  ok: boolean;
  status?: number;
  shouldDisable?: boolean;
};

const MAX_TELEGRAM_MESSAGE_LENGTH = 4096;

function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }

  return token;
}

function normalizeNotificationUrl(url?: string): string | undefined {
  if (!url) return undefined;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const siteUrl = getSiteUrl();
  return `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function sendTelegramText(
  chatId: number | string,
  text: string,
): Promise<TelegramSendResult> {
  const token = getTelegramBotToken();

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, MAX_TELEGRAM_MESSAGE_LENGTH),
      }),
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    console.error("Telegram sendMessage failed:", response.status, data);

    return {
      ok: false,
      status: response.status,
      shouldDisable: response.status === 400 || response.status === 403,
    };
  }

  return { ok: true };
}

export async function sendTelegramNotification(
  chatId: number | string,
  payload: TelegramNotificationPayload,
): Promise<TelegramSendResult> {
  const url = normalizeNotificationUrl(payload.url);

  const text = [
    `🔔 ${payload.title}`,
    payload.body,
    url ? `Открыть: ${url}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return sendTelegramText(chatId, text);
}