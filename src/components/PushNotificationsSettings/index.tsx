"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray.buffer;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

export function PushNotificationsSettings() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const check = async () => {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        setSupported(false);
        return;
      }

      setSupported(true);
      setPermission(Notification.permission);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(Boolean(subscription));
    };

    void check();
  }, []);

  async function handleEnable() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Ваш браузер не поддерживает push-уведомления");
      }

      const registration = await navigator.serviceWorker.ready;

      let currentPermission = Notification.permission;
      if (currentPermission !== "granted") {
        currentPermission = await Notification.requestPermission();
      }

      setPermission(currentPermission);

      if (currentPermission !== "granted") {
        throw new Error("Разрешение на уведомления не выдано");
      }

      const { data } = await api.get<{ publicKey: string }>(
        "/api/push/public-key",
      );

      const existingSubscription =
        await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(data.publicKey),
        }));

      await api.post("/api/push/subscriptions", subscription.toJSON());

      setIsSubscribed(true);
      setSuccess("Push-уведомления включены");
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Не удалось включить уведомления"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await api.delete("/api/push/subscriptions", {
          data: { endpoint: subscription.endpoint },
        });

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setSuccess("Push-уведомления отключены");
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Не удалось отключить уведомления"));
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
        <h2 className="mb-2 text-xl font-semibold">Push-уведомления</h2>
        <p className="text-sm text-zinc-600">
          Этот браузер не поддерживает push-уведомления.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
      <h2 className="mb-2 text-xl font-semibold">Push-уведомления</h2>

      <p className="text-sm text-zinc-600">
        Получайте уведомления, когда кто-то забронировал ваш товар.
      </p>

      <div className="mt-3 text-sm text-zinc-700">
        Статус браузера:{" "}
        <span className="font-medium">
          {permission === "granted"
            ? "разрешены"
            : permission === "denied"
              ? "запрещены"
              : "ещё не запрошены"}
        </span>
      </div>

      <div className="mt-2 text-sm text-zinc-700">
        Подписка:{" "}
        <span className="font-medium">
          {isSubscribed ? "активна" : "не активна"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleEnable}
          disabled={loading}
          className="rounded-full bg-accent-strong px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {loading ? "Подождите..." : "Включить уведомления"}
        </button>

        <button
          type="button"
          onClick={handleDisable}
          disabled={loading || !isSubscribed}
          className="rounded-full border border-border-subtle px-5 py-2 text-sm font-medium text-zinc-700 disabled:opacity-60"
        >
          Отключить
        </button>
      </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
      {success ? (
        <div className="mt-3 text-sm text-emerald-600">{success}</div>
      ) : null}
    </section>
  );
}
