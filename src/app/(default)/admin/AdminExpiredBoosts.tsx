"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import { getBoostDurationLabel } from "@/lib/boost-pricing";
import type { MonetizationRequestView } from "@/types/monetization";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

export function AdminExpiredBoosts({
  initialRequests,
}: {
  initialRequests: MonetizationRequestView[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleRestore(requestId: string): Promise<void> {
    setError("");
    setLoadingId(requestId);

    try {
      await api.patch(API_ROUTES.adminMonetizationRequestById(requestId), {
        revertExpiredBoost: true,
      });

      setRequests((prev) => prev.filter((item) => item._id !== requestId));
      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Не удалось вернуть рейтинг"));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-border-subtle p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">
        Истёкшие бусты рейтинга
      </h2>

      <p className="mb-4 text-sm text-zinc-600">
        Здесь показаны товары, у которых закончился оплаченный срок повышения.
        Рейтинг не снижается автоматически — только вручную администратором.
      </p>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-xl border border-border-subtle p-6 text-center text-sm text-zinc-500">
            Нет товаров с истёкшим бустом.
          </div>
        ) : null}

        {requests.map((request) => {
          const id = request._id ?? "";
          const isLoading = loadingId === id;

          return (
            <article
              key={id}
              className="rounded-xl border border-amber-200 bg-amber-50/40 p-4"
            >
              <div className="space-y-2 text-sm text-zinc-700">
                <div className="text-base font-semibold text-zinc-900">
                  {request.productName ?? "Товар без названия"}
                </div>
                <div>Email пользователя: {request.userEmail}</div>
                {request.requestedBoostValue ? (
                  <div>Последний буст: +{request.requestedBoostValue}</div>
                ) : null}
                {request.boostDuration ? (
                  <div>Срок: {getBoostDurationLabel(request.boostDuration)}</div>
                ) : null}
                {request.boostAppliedAt ? (
                  <div>
                    Был применён:{" "}
                    {new Date(request.boostAppliedAt).toLocaleString("ru-RU")}
                  </div>
                ) : null}
                {request.boostExpiresAt ? (
                  <div>
                    Истёк:{" "}
                    {new Date(request.boostExpiresAt).toLocaleString("ru-RU")}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  onClick={() => handleRestore(id)}
                >
                  {isLoading ? "Возвращаем..." : "Вернуть прежний рейтинг"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}