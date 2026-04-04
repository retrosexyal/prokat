"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import type {
  MonetizationRequestStatus,
  MonetizationRequestView,
} from "@/types/monetization";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

function getTypeLabel(type: MonetizationRequestView["type"]): string {
  return type === "boost_product"
    ? "Поднять рейтинг товара"
    : "Увеличить лимит";
}

export function AdminMonetizationRequests({
  initialRequests,
}: {
  initialRequests: MonetizationRequestView[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(
    requestId: string,
    status: MonetizationRequestStatus,
    extra?: { applyBoost?: boolean; applyLimitIncrease?: boolean },
  ): Promise<void> {
    setError("");
    setLoadingId(requestId);

    try {
      const response = await api.patch<MonetizationRequestView>(
        API_ROUTES.adminMonetizationRequestById(requestId),
        {
          status,
          ...extra,
        },
      );

      setRequests((prev) =>
        prev.map((item) => (item._id === requestId ? response.data : item)),
      );

      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка обновления заявки"));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-border-subtle p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">
        Заявки на монетизацию
      </h2>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-xl border border-border-subtle p-6 text-center text-sm text-zinc-500">
            Пока нет заявок.
          </div>
        ) : null}

        {requests.map((request) => {
          const id = request._id ?? "";
          const isLoading = loadingId === id;

          return (
            <article
              key={id}
              className="rounded-xl border border-border-subtle p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 text-sm text-zinc-700">
                  <div className="text-base font-semibold text-zinc-900">
                    {getTypeLabel(request.type)}
                  </div>
                  <div>Email пользователя: {request.userEmail}</div>
                  {request.productName ? (
                    <div>Товар: {request.productName}</div>
                  ) : null}
                  {request.requestedBoostValue ? (
                    <div>Повышение рейтинга: +{request.requestedBoostValue}</div>
                  ) : null}
                  {request.requestedLimitIncrease ? (
                    <div>Увеличение лимита: +{request.requestedLimitIncrease}</div>
                  ) : null}
                  {request.message ? (
                    <div>Комментарий: {request.message}</div>
                  ) : null}
                  <div>Оплата: ЕРИП / {request.paymentStatus}</div>
                  <div className="text-xs text-zinc-500">
                    {request.paymentStubNote}
                  </div>
                </div>

                <div className="text-sm text-zinc-500">
                  Статус: {request.status}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium disabled:opacity-60"
                  onClick={() => updateStatus(id, "paid")}
                >
                  Пометить как оплачено
                </button>

                {request.type === "boost_product" ? (
                  <button
                    type="button"
                    disabled={isLoading}
                    className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    onClick={() =>
                      updateStatus(id, "completed", {
                        applyBoost: true,
                      })
                    }
                  >
                    Применить буст
                  </button>
                ) : null}

                {request.type === "increase_limit" ? (
                  <button
                    type="button"
                    disabled={isLoading}
                    className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    onClick={() =>
                      updateStatus(id, "completed", {
                        applyLimitIncrease: true,
                      })
                    }
                  >
                    Увеличить лимит
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={isLoading}
                  className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  onClick={() => updateStatus(id, "cancelled")}
                >
                  Отклонить
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}