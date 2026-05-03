"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import { PushNotificationsSettings } from "@/components/PushNotificationsSettings";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

type Props = {
  initialName?: string;
  initialPhone?: string;
  initialPickupAddress?: string;
  initialShowPhoneInProducts?: boolean;
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

export function ProfileSettings({
  initialName = "",
  initialPhone = "",
  initialShowPhoneInProducts = false,
  initialPickupAddress = "",
}: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [showPhoneInProducts, setShowPhoneInProducts] = useState(
    initialShowPhoneInProducts,
  );
  const [pickupAddress, setPickupAddress] = useState(initialPickupAddress);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.patch(API_ROUTES.me, {
        name,
        phone,
        showPhoneInProducts,
        pickupAddress,
      });

      setSuccess("Профиль обновлён");
      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка сохранения профиля"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
        <h2 className="mb-4 text-xl font-semibold">Личные данные</h2>

        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs sm:text-sm">
            Имя
            <input
              className="rounded-md border px-2 py-1.5 text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-xs sm:text-sm">
            Телефон
            <input
              type="tel"
              className="rounded-md border px-2 py-1.5 text-sm"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+375 (29) 123-45-67"
              required
            />
          </label>

          <label className="sm:col-span-2 flex items-start gap-2 text-xs sm:text-sm">
            <input
              type="checkbox"
              checked={showPhoneInProducts}
              onChange={(event) => setShowPhoneInProducts(event.target.checked)}
              className="mt-0.5"
            />
            <span>Показывать мой телефон в товарах и форме бронирования</span>
          </label>

          <label className="flex flex-col gap-1 text-xs sm:text-sm sm:col-span-2">
            Адрес самовывоза
            <input
              className="rounded-md border px-2 py-1.5 text-sm"
              value={pickupAddress}
              onChange={(event) => setPickupAddress(event.target.value)}
              placeholder="Например: Могилёв, ул. Ленинская, 10"
            />
          </label>

          {error ? (
            <div className="sm:col-span-2 text-xs text-red-600">{error}</div>
          ) : null}

          {success ? (
            <div className="sm:col-span-2 text-xs text-emerald-600">
              {success}
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-accent-strong px-6 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {loading ? "Сохранение..." : "Сохранить профиль"}
            </button>
          </div>
        </form>
      </section>

      {mounted ? (
        <>
          <PwaInstallPrompt />
          <PushNotificationsSettings />
        </>
      ) : null}
    </div>
  );
}
