"use client";

import { useMemo, useState } from "react";
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

function getPaymentStatusLabel(
  request: MonetizationRequestView,
): {
  text: string;
  tone: "default" | "success" | "warning" | "danger";
} {
  if (request.paymentStatus === "paid") {
    return {
      text: "оплачено",
      tone: "success",
    };
  }

  if (request.paymentStatus === "failed") {
    if (
      request.paymentError?.toLowerCase().includes("истёк") ||
      request.paymentError?.toLowerCase().includes("срок")
    ) {
      return {
        text: "счёт просрочен",
        tone: "danger",
      };
    }

    return {
      text: "ошибка оплаты",
      tone: "danger",
    };
  }

  return {
    text: "в процессе",
    tone: "warning",
  };
}

function getToneClass(tone: "default" | "success" | "warning" | "danger") {
  switch (tone) {
    case "success":
      return "bg-green-50 text-green-700 border-green-200";
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "danger":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-zinc-50 text-zinc-700 border-zinc-200";
  }
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

  const visibleRequests = useMemo(
    () =>
      requests.filter(
        (item) => item.status !== "completed" && item.status !== "cancelled",
      ),
    [requests],
  );

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

      const updated = response.data;

      setRequests((prev) => {
        if (status === "completed" || status === "cancelled") {
          return prev.filter((item) => item._id !== requestId);
        }

        return prev.map((item) => (item._id === requestId ? updated : item));
      });

      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка обновления заявки"));
    } finally {
      setLoadingId(null);
    }
  }

  async function syncPayment(requestId: string): Promise<void> {
    setError("");
    setLoadingId(requestId);

    try {
      const response = await api.patch<MonetizationRequestView>(
        API_ROUTES.adminMonetizationRequestById(requestId),
        {
          syncPayment: true,
        },
      );

      const updated = response.data;

      setRequests((prev) =>
        prev.map((item) => (item._id === requestId ? updated : item)),
      );
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Не удалось проверить оплату"));
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
        {visibleRequests.length === 0 ? (
          <div className="rounded-xl border border-border-subtle p-6 text-center text-sm text-zinc-500">
            Пока нет активных заявок.
          </div>
        ) : null}

        {visibleRequests.map((request) => {
          const id = request._id ?? "";
          const isLoading = loadingId === id;
          const paymentState = getPaymentStatusLabel(request);
          const canApply = request.paymentStatus === "paid";

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

                  <div>
                    Оплата: ЕРИП
                    {typeof request.paymentAmountBYN === "number"
                      ? ` / ${request.paymentAmountBYN.toFixed(2)} BYN`
                      : ""}
                  </div>

                  <div
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getToneClass(
                      paymentState.tone,
                    )}`}
                  >
                    Статус оплаты: {paymentState.text}
                  </div>

                  {request.paymentInvoiceNo ? (
                    <div>Номер счёта: {request.paymentInvoiceNo}</div>
                  ) : null}

                  {request.paymentInvoiceUrl ? (
                    <div className="break-all">
                      Ссылка на счёт:{" "}
                      <a
                        href={request.paymentInvoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        {request.paymentInvoiceUrl}
                      </a>
                    </div>
                  ) : null}

                  {request.paymentExpiresAt ? (
                    <div>
                      Действует до:{" "}
                      {new Date(request.paymentExpiresAt).toLocaleString("ru-RU")}
                    </div>
                  ) : null}

                  {request.paymentError ? (
                    <div className="text-xs text-red-600">
                      {request.paymentError}
                    </div>
                  ) : null}
                </div>

                <div className="text-sm text-zinc-500">
                  Статус заявки: {request.status}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium disabled:opacity-60"
                  onClick={() => syncPayment(id)}
                >
                  {isLoading ? "Проверяем..." : "Проверить оплату"}
                </button>

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
                    disabled={isLoading || !canApply}
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
                    disabled={isLoading || !canApply}
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