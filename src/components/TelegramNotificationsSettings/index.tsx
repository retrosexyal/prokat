"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";

type TelegramStatus = {
  connected: boolean;
  username?: string;
  linkedAt?: string | null;
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

export function TelegramNotificationsSettings() {
  const [status, setStatus] = useState<TelegramStatus>({
    connected: false,
  });
  const [linkUrl, setLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function loadStatus() {
    const { data } = await api.get<TelegramStatus>("/api/telegram/link");
    setStatus(data);
  }

  useEffect(() => {
    void loadStatus().catch(() => {
      // Не показываем ошибку при первом тихом статус-чеке
    });
  }, []);

  async function handleConnect() {
    setLoading(true);
    setError("");
    setSuccess("");
    setLinkUrl("");

    try {
      const { data } = await api.post<{ url: string; expiresAt: string }>(
        "/api/telegram/link",
      );

      setLinkUrl(data.url);
      setSuccess(
        "Откройте Telegram по ссылке и нажмите Start. Ссылка действует 10 минут.",
      );

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Не удалось создать ссылку"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await loadStatus();
      setSuccess("Статус обновлён");
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Не удалось обновить статус"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.delete("/api/telegram/link");
      setStatus({ connected: false });
      setLinkUrl("");
      setSuccess("Telegram-уведомления отключены");
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Не удалось отключить Telegram"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
      <h2 className="mb-2 text-xl font-semibold">Telegram-уведомления</h2>

      <p className="text-sm text-zinc-600">
        Получайте уведомления о бронированиях и важных событиях прямо в Telegram.
      </p>

      <div className="mt-3 text-sm text-zinc-700">
        Статус:{" "}
        <span className="font-medium">
          {status.connected ? "подключены" : "не подключены"}
        </span>
      </div>

      {status.connected && status.username ? (
        <div className="mt-1 text-sm text-zinc-700">
          Аккаунт: <span className="font-medium">@{status.username}</span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={loading}
          className="rounded-full bg-accent-strong px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {loading ? "Подождите..." : "Подключить Telegram"}
        </button>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-full border border-border-subtle px-5 py-2 text-sm font-medium text-zinc-700 disabled:opacity-60"
        >
          Проверить статус
        </button>

        <button
          type="button"
          onClick={handleDisconnect}
          disabled={loading || !status.connected}
          className="rounded-full border border-border-subtle px-5 py-2 text-sm font-medium text-zinc-700 disabled:opacity-60"
        >
          Отключить
        </button>
      </div>

      {linkUrl ? (
        <p className="mt-3 text-sm">
          Ссылка:{" "}
          <a
            href={linkUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-600 underline"
          >
            открыть Telegram
          </a>
        </p>
      ) : null}

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      {success ? (
        <div className="mt-3 text-sm text-emerald-600">{success}</div>
      ) : null}
    </section>
  );
}