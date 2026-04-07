import axios from "axios";
import type {
  MonetizationRequestView,
} from "@/types/monetization";
import type { ProductStatus } from "@/types/product";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

export function getStatusLabel(status: ProductStatus): string {
  switch (status) {
    case "approved":
      return "Подтвержден";
    case "rejected":
      return "Отклонен";
    case "pending":
    default:
      return "На модерации";
  }
}

export function formatInvoiceDate(value?: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("ru-RU");
}

export function isActiveInvoice(request: MonetizationRequestView): boolean {
  if (!request._id) {
    return false;
  }

  if (!request.paymentInvoiceNo && !request.paymentInvoiceUrl) {
    return false;
  }

  if (
    request.status === "completed" ||
    request.status === "cancelled" ||
    request.paymentStatus === "paid" ||
    request.paymentStatus === "failed"
  ) {
    return false;
  }

  if (request.paymentExpiresAt) {
    const expiresAt = new Date(request.paymentExpiresAt).getTime();

    if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
      return false;
    }
  }

  return (
    request.paymentStatus === "pending" ||
    request.paymentStatus === "invoice_created"
  );
}

export function buildInvoiceState(requests: MonetizationRequestView[]): {
  activeLimitInvoice: MonetizationRequestView | null;
  activeBoostInvoices: Record<string, MonetizationRequestView>;
} {
  let activeLimitInvoice: MonetizationRequestView | null = null;
  const activeBoostInvoices: Record<string, MonetizationRequestView> = {};

  for (const request of requests) {
    if (!isActiveInvoice(request)) {
      continue;
    }

    if (request.type === "increase_limit" && !activeLimitInvoice) {
      activeLimitInvoice = request;
      continue;
    }

    if (
      request.type === "boost_product" &&
      request.productId &&
      !activeBoostInvoices[request.productId]
    ) {
      activeBoostInvoices[request.productId] = request;
    }
  }

  return {
    activeLimitInvoice,
    activeBoostInvoices,
  };
}