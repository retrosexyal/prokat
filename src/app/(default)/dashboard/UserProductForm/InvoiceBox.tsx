"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import type { MonetizationRequestView } from "@/types/monetization";
import type { MonetizationQrResponse } from "./types";
import { formatInvoiceDate, getApiErrorMessage } from "./helpers";

export function InvoiceBox({
  invoice,
  onHide,
}: {
  invoice: MonetizationRequestView;
  onHide?: () => void;
}) {
  const [qrCodeBody, setQrCodeBody] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");

  async function handleLoadQr(): Promise<void> {
    if (!invoice._id || qrLoading || qrCodeBody) {
      return;
    }

    setQrLoading(true);
    setQrError("");

    try {
      const response = await api.get<MonetizationQrResponse>(
        API_ROUTES.monetizationRequestQr(invoice._id),
      );

      if (!response.data.qrCodeBody) {
        setQrError("QR-код не был возвращён платёжным провайдером.");
        return;
      }

      setQrCodeBody(response.data.qrCodeBody);
    } catch (error: unknown) {
      setQrError(getApiErrorMessage(error, "Не удалось получить QR-код"));
    } finally {
      setQrLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
      <div className="font-medium">Счёт выставлен</div>

      <div className="mt-1">
        Сумма:{" "}
        {typeof invoice.paymentAmountBYN === "number"
          ? `${invoice.paymentAmountBYN.toFixed(2)} BYN`
          : "—"}
        {invoice.paymentInvoiceNo
          ? ` · № счёта ${invoice.paymentInvoiceNo}`
          : ""}
      </div>

      {invoice.paymentAccountNo ? (
        <div className="mt-1">Лицевой счёт: {invoice.paymentAccountNo}</div>
      ) : null}

      <div className="mt-1">Статус: {invoice.paymentStatus}</div>

      {invoice.paymentExpiresAt ? (
        <div className="mt-1">
          Действует до: {formatInvoiceDate(invoice.paymentExpiresAt)}
        </div>
      ) : null}

      {invoice.paymentInvoiceUrl ? (
        <div className="mt-1 break-all">
          Ссылка:{" "}
          <a
            href={invoice.paymentInvoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {invoice.paymentInvoiceUrl}
          </a>
        </div>
      ) : null}

      {invoice.paymentError ? (
        <div className="mt-2 text-xs text-red-600">{invoice.paymentError}</div>
      ) : null}

      {qrCodeBody ? (
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-sky-800/80">
            QR для оплаты
          </div>

          <img
            src={`data:image/png;base64,${qrCodeBody}`}
            alt={`QR-код для оплаты счёта ${invoice.paymentInvoiceNo ?? ""}`}
            className="h-48 w-48 rounded-lg border border-sky-200 bg-white p-2"
          />
        </div>
      ) : null}

      {qrError ? (
        <div className="mt-2 text-xs text-red-600">{qrError}</div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {invoice.paymentInvoiceUrl ? (
          <a
            href={invoice.paymentInvoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white"
          >
            Открыть счёт
          </a>
        ) : null}

        {invoice._id ? (
          <button
            type="button"
            onClick={handleLoadQr}
            disabled={qrLoading}
            className="rounded-full border border-sky-300 px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {qrLoading ? "Загрузка QR..." : "Показать QR"}
          </button>
        ) : null}

        {onHide ? (
          <button
            type="button"
            className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium"
            onClick={onHide}
          >
            Скрыть
          </button>
        ) : null}
      </div>
    </div>
  );
}