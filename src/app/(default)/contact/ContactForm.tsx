"use client";

import { FormEvent, useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      await api.post(API_ROUTES.contact, {
        name,
        email,
        subject,
        message,
      });

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setStatus({
        type: "success",
        text: "Сообщение отправлено. Мы свяжемся с вами в ближайшее время.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        text: getApiErrorMessage(error, "Не удалось отправить сообщение"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Имя *</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
            placeholder="Ваше имя"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Email *</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={160}
            required
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
            placeholder="name@example.com"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-zinc-700">Тема</span>
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={180}
          className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
          placeholder="Например: вопрос по размещению товара"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-zinc-700">Сообщение *</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={3000}
          required
          rows={7}
          className="mt-1 w-full resize-y rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
          placeholder="Опишите ваш вопрос"
        />
      </label>

      {status ? (
        <div
          className={[
            "mt-4 rounded-xl px-4 py-3 text-sm",
            status.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {status.text}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60"
      >
        {isSubmitting ? "Отправляем..." : "Отправить сообщение"}
      </button>
    </form>
  );
}