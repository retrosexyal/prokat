"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import type { ContactMessageView } from "@/types/contact-message";

type Props = {
  initialMessages: ContactMessageView[];
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminContactMessages({ initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const unreadCount = useMemo(
    () => messages.filter((message) => !message.isViewed).length,
    [messages],
  );

  async function setViewed(id: string, isViewed: boolean) {
    setError("");
    setLoadingId(id);

    try {
      const response = await api.patch<ContactMessageView>(
        API_ROUTES.adminContactMessageById(id),
        { isViewed },
      );

      setMessages((current) =>
        current.map((message) =>
          message._id === id ? response.data : message,
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось обновить сообщение"));
    } finally {
      setLoadingId(null);
    }
  }

  async function removeMessage(id: string) {
    const confirmed = window.confirm("Удалить это сообщение?");

    if (!confirmed) {
      return;
    }

    setError("");
    setLoadingId(id);

    try {
      await api.delete(API_ROUTES.adminContactMessageById(id));
      setMessages((current) => current.filter((message) => message._id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось удалить сообщение"));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Сообщения с формы связи</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Всего: {messages.length}. Непросмотренных: {unreadCount}.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
            Сообщений пока нет.
          </div>
        ) : null}

        {messages.map((message) => {
          const id = message._id ?? "";
          const isLoading = loadingId === id;

          return (
            <article
              key={id}
              className={[
                "rounded-2xl border p-4",
                message.isViewed
                  ? "border-zinc-200 bg-white"
                  : "border-amber-200 bg-amber-50/60",
              ].join(" ")}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-zinc-900">
                      {message.subject || "Без темы"}
                    </h3>

                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        message.isViewed
                          ? "bg-zinc-100 text-zinc-600"
                          : "bg-amber-100 text-amber-800",
                      ].join(" ")}
                    >
                      {message.isViewed ? "Просмотрено" : "Новое"}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-zinc-600">
                    <span className="font-medium">{message.name}</span>{" "}
                    <a
                      href={`mailto:${message.email}`}
                      className="text-accent-strong hover:text-accent"
                    >
                      {message.email}
                    </a>
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {formatDate(message.createdAt)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isLoading || !id}
                    onClick={() => setViewed(id, !message.isViewed)}
                    className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-900 disabled:opacity-60"
                  >
                    {message.isViewed
                      ? "Сделать новым"
                      : "Пометить просмотренным"}
                  </button>

                  <button
                    type="button"
                    disabled={isLoading || !id}
                    onClick={() => removeMessage(id)}
                    className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Удалить
                  </button>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                {message.message}
              </p>

              {message.viewedAt ? (
                <div className="mt-4 text-xs text-zinc-500">
                  Просмотрено: {formatDate(message.viewedAt)}
                  {message.viewedByEmail ? ` — ${message.viewedByEmail}` : ""}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}