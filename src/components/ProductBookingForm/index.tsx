"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";

type BusyRange = {
  _id?: string;
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "cancelled";
};

type Props = {
  productId: string;
  minDays?: number;
  ownerPhone?: string;
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("ru-RU");
}

function toInputDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toInputDate(date);
}

function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA <= endB && endA >= startB;
}

export function ProductBookingForm({
  productId,
  minDays = 1,
  ownerPhone,
}: Props) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busyRanges, setBusyRanges] = useState<BusyRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBusyDates, setLoadingBusyDates] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBusyRanges(): Promise<void> {
      setLoadingBusyDates(true);

      try {
        const response = await api.get<BusyRange[]>(
          `${API_ROUTES.bookings}?productId=${encodeURIComponent(productId)}`,
        );

        if (!cancelled) {
          setBusyRanges(response.data);
        }
      } catch {
        if (!cancelled) {
          setBusyRanges([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingBusyDates(false);
        }
      }
    }

    void loadBusyRanges();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const conflictText = useMemo(() => {
    if (!startDate || !endDate) {
      return "";
    }

    const hasConflict = busyRanges.some((range) =>
      rangesOverlap(
        startDate,
        endDate,
        range.startDate.slice(0, 10),
        range.endDate.slice(0, 10),
      ),
    );

    return hasConflict
      ? "Этот диапазон пересекается с уже существующей бронью"
      : "";
  }, [busyRanges, endDate, startDate]);

  function syncEndDateFromStart(nextStartDate: string): string {
    if (!nextStartDate) {
      return "";
    }

    return addDays(nextStartDate, Math.max(minDays - 1, 1));
  }

  function handleStartDateChange(nextStartDate: string): void {
    setStartDate(nextStartDate);

    if (!nextStartDate) {
      setEndDate("");
      return;
    }

    if (!endDate) {
      setEndDate(syncEndDateFromStart(nextStartDate));
      return;
    }

    if (endDate < nextStartDate) {
      setEndDate(syncEndDateFromStart(nextStartDate));
      return;
    }

    const minEndDate = addDays(nextStartDate, minDays - 1);
    if (endDate < minEndDate) {
      setEndDate(minEndDate);
    }
  }

  function handleEndDateChange(nextEndDate: string): void {
    if (!startDate) {
      setEndDate(nextEndDate);
      return;
    }

    const minEndDate = addDays(startDate, minDays - 1);

    if (nextEndDate < minEndDate) {
      setEndDate(minEndDate);
      return;
    }

    setEndDate(nextEndDate);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!startDate || !endDate) {
      setError("Выберите даты бронирования");
      setLoading(false);
      return;
    }

    const minEndDate = addDays(startDate, minDays - 1);

    if (endDate < minEndDate) {
      setError(
        minDays > 1
          ? `Минимальный срок аренды: ${minDays} дн.`
          : "Дата окончания не может быть меньше даты начала",
      );
      setLoading(false);
      return;
    }

    const hasConflict = busyRanges.some((range) =>
      rangesOverlap(
        startDate,
        endDate,
        range.startDate.slice(0, 10),
        range.endDate.slice(0, 10),
      ),
    );

    if (hasConflict) {
      setError("На выбранные даты товар уже забронирован");
      setLoading(false);
      return;
    }

    try {
      await api.post(API_ROUTES.bookings, {
        productId,
        phone,
        message,
        startDate,
        endDate,
      });

      setSuccess("Бронирование отправлено. С вами свяжутся.");
      setPhone("");
      setMessage("");
      setStartDate("");
      setEndDate("");

      const response = await api.get<BusyRange[]>(
        `${API_ROUTES.bookings}?productId=${encodeURIComponent(productId)}`,
      );
      setBusyRanges(response.data);
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка бронирования"));
    } finally {
      setLoading(false);
    }
  }

  const minEndDate = startDate ? addDays(startDate, minDays - 1) : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {ownerPhone ? (
        <div className="rounded-xl border border-border-subtle bg-zinc-50 p-3">
          <div className="text-sm font-medium text-zinc-900">
            Телефон владельца
          </div>
          <a
            href={`tel:${ownerPhone}`}
            className="mt-1 inline-block text-sm text-accent-strong hover:underline"
          >
            {ownerPhone}
          </a>
          <p className="mt-1 text-xs text-zinc-500">
            Можете сразу позвонить для уточнения деталей аренды
          </p>
        </div>
      ) : null}
      <div>
        <label className="mb-1 block text-sm text-zinc-700">
          Телефон для связи
        </label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
          placeholder="+375 (29) 123-45-67"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-zinc-700">
            Дата начала
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(event) => handleStartDateChange(event.target.value)}
            className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-700">
            Дата окончания
          </label>
          <input
            type="date"
            required
            value={endDate}
            min={minEndDate || startDate || undefined}
            onChange={(event) => handleEndDateChange(event.target.value)}
            className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
        {minDays > 1 ? (
          <p>Минимальный срок аренды: {minDays} дн.</p>
        ) : (
          <p>Можно выбрать один день аренды.</p>
        )}

        {startDate ? (
          <p className="mt-1">
            Минимально допустимая дата окончания:{" "}
            <span className="font-medium text-zinc-800">
              {formatDate(`${minEndDate || startDate}T00:00:00.000Z`)}
            </span>
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-700">
          Сообщение владельцу
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
          placeholder="Например: нужен с утра, могу забрать сам"
        />
      </div>

      <div className="rounded-xl border border-border-subtle bg-white p-3">
        <div className="mb-2 text-sm font-medium text-zinc-900">
          Уже забронированные даты
        </div>

        {loadingBusyDates ? (
          <div className="text-sm text-zinc-500">Загрузка...</div>
        ) : busyRanges.length === 0 ? (
          <div className="text-sm text-zinc-500">
            Пока нет активных бронирований
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {busyRanges.map((range) => (
              <div
                key={range._id ?? `${range.startDate}-${range.endDate}`}
                className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700"
              >
                {formatDate(range.startDate)} — {formatDate(range.endDate)}
              </div>
            ))}
          </div>
        )}
      </div>

      {conflictText ? (
        <div className="text-sm text-red-600">{conflictText}</div>
      ) : null}

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? (
        <div className="text-sm text-emerald-600">{success}</div>
      ) : null}

      <button
        type="submit"
        disabled={loading || loadingBusyDates}
        className="w-full rounded-full bg-accent-strong px-4 py-3 text-sm font-semibold text-black transition hover:bg-accent disabled:opacity-60"
      >
        {loading ? "Отправка..." : "Забронировать"}
      </button>
    </form>
  );
}
