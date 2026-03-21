"use client";

import {
  SubmitEvent,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { DayPicker, DateRange } from "react-day-picker";
import { ru } from "react-day-picker/locale";

import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import { useIsMobile } from "@/hook";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

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
  pickupAddress?: string;
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

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function addDays(dateString: string, days: number): string {
  const date = parseLocalDate(dateString);
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

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

type BookingCalendarModalProps = {
  open: boolean;
  onClose: () => void;
  value?: DateRange;
  onApply: (range: DateRange | undefined) => void;
  bookedRanges: { from: Date; to: Date }[];
  minDays: number;
  isMobile: boolean;
};

function BookingCalendarModal({
  open,
  onClose,
  value,
  onApply,
  bookedRanges,
  minDays,
  isMobile,
}: BookingCalendarModalProps) {
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(value);

  const effectDraft = useEffectEvent(() => {
    setDraftRange(value);
  });

  useEffect(() => {
    if (open) {
      effectDraft();
    }
  }, [open, value]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
      <div className="w-full rounded-t-3xl bg-white shadow-2xl sm:max-w-[760px] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4 sm:px-5">
          <div>
            <div className="text-base font-semibold text-zinc-900">
              Выбор дат аренды
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Недоступные даты уже заблокированы
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border-subtle px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Закрыть
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
          <div className="rounded-2xl border border-border-subtle bg-white p-3 sm:p-4">
            <DayPicker
              locale={ru}
              mode="range"
              selected={draftRange}
              onSelect={setDraftRange}
              disabled={[{ before: startOfToday() }, ...bookedRanges]}
              modifiers={{ booked: bookedRanges }}
              modifiersClassNames={{ booked: "rdp-booked" }}
              excludeDisabled
              numberOfMonths={isMobile ? 1 : 2}
              showOutsideDays
              className="booking-calendar"
            />
          </div>

          <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
            <div className="text-sm font-medium text-zinc-900">
              Выбранные даты
            </div>

            {!draftRange?.from ? (
              <p className="mt-2 text-sm text-zinc-500">
                Пока ничего не выбрано
              </p>
            ) : (
              <div className="mt-2 space-y-1 text-sm text-zinc-700">
                <p>
                  <span className="font-medium text-zinc-900">Начало:</span>{" "}
                  {formatDate(toInputDate(draftRange.from))}
                </p>
                <p>
                  <span className="font-medium text-zinc-900">Окончание:</span>{" "}
                  {draftRange.to
                    ? formatDate(toInputDate(draftRange.to))
                    : "выберите дату окончания"}
                </p>
              </div>
            )}

            <div className="mt-3 text-xs text-zinc-600">
              {minDays > 1 ? (
                <p>Минимальный срок аренды: {minDays} дн.</p>
              ) : (
                <p>Можно выбрать один день аренды.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-border-subtle px-4 py-4 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-border-subtle px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draftRange);
              onClose();
            }}
            className="flex-1 rounded-full bg-accent-strong px-4 py-3 text-sm font-semibold text-black transition hover:bg-accent"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductBookingForm({
  productId,
  minDays = 1,
  ownerPhone,
  pickupAddress,
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
  const [calendarOpen, setCalendarOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const bookingDraftStorageKey = `booking-draft:${productId}`;

  function saveBookingDraft(): void {
    if (typeof window === "undefined") return;

    sessionStorage.setItem(
      bookingDraftStorageKey,
      JSON.stringify({
        phone,
        message,
        startDate,
        endDate,
      }),
    );
  }

  function getCurrentUrl(): string {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const isMobile = useIsMobile();

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

  const activeBusyRanges = useMemo(
    () => busyRanges.filter((range) => range.status !== "cancelled"),
    [busyRanges],
  );

  const bookedRanges = useMemo(
    () =>
      activeBusyRanges.map((range) => ({
        from: parseLocalDate(range.startDate.slice(0, 10)),
        to: parseLocalDate(range.endDate.slice(0, 10)),
      })),
    [activeBusyRanges],
  );

  const calendarValue = useMemo<DateRange | undefined>(() => {
    if (!startDate) return undefined;

    return {
      from: parseLocalDate(startDate),
      to: endDate ? parseLocalDate(endDate) : undefined,
    };
  }, [startDate, endDate]);

  const conflictText = useMemo(() => {
    if (!startDate || !endDate) return "";

    const hasConflict = activeBusyRanges.some((range) =>
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
  }, [activeBusyRanges, startDate, endDate]);

  function applyCalendarRange(range: DateRange | undefined): void {
    setError("");
    setSuccess("");

    if (!range?.from) {
      setStartDate("");
      setEndDate("");
      return;
    }

    const nextStart = toInputDate(range.from);
    const nextEnd = range.to ? toInputDate(range.to) : "";

    setStartDate(nextStart);

    if (!nextEnd) {
      setEndDate("");
      return;
    }

    const minAllowedEnd = addDays(nextStart, minDays - 1);

    if (nextEnd < minAllowedEnd) {
      setEndDate(minAllowedEnd);
      return;
    }

    setEndDate(nextEnd);
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
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

    const today = toInputDate(startOfToday());

    if (startDate < today || endDate < today) {
      setError("Нельзя выбрать дату в прошлом");
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

    const hasConflict = activeBusyRanges.some((range) =>
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

    if (status !== "authenticated") {
      saveBookingDraft();

      const callbackUrl = encodeURIComponent(getCurrentUrl());
      router.push(`/login?callbackUrl=${callbackUrl}`);
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

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(bookingDraftStorageKey);
      }

      const response = await api.get<BusyRange[]>(
        `${API_ROUTES.bookings}?productId=${encodeURIComponent(productId)}`,
      );
      setBusyRanges(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        saveBookingDraft();
        const callbackUrl = encodeURIComponent(getCurrentUrl());
        router.push(`/login?callbackUrl=${callbackUrl}`);
      } else {
        setError(getApiErrorMessage(error, "Ошибка бронирования"));
      }
    } finally {
      setLoading(false);
    }
  }

  const selectedDaysCount =
    startDate && endDate
      ? Math.floor(
          (parseLocalDate(endDate).getTime() -
            parseLocalDate(startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : 0;

  const selectedLabel = !startDate
    ? "Даты не выбраны"
    : endDate
      ? `${formatDate(startDate)} — ${formatDate(endDate)}`
      : `${formatDate(startDate)} — выберите дату окончания`;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = sessionStorage.getItem(bookingDraftStorageKey);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as {
        phone?: string;
        message?: string;
        startDate?: string;
        endDate?: string;
      };

      if (draft.phone) {
        setPhone(draft.phone);
      }

      if (draft.message) {
        setMessage(draft.message);
      }

      if (draft.startDate) {
        setStartDate(draft.startDate);
      }

      if (draft.endDate) {
        setEndDate(draft.endDate);
      }
    } catch {
      sessionStorage.removeItem(bookingDraftStorageKey);
    }
  }, [bookingDraftStorageKey]);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {ownerPhone ? (
          <div className="rounded-2xl border border-border-subtle bg-white p-3 sm:p-4">
            <div className="text-sm font-medium text-zinc-900">
              Телефон владельца
            </div>
            <a
              href={`tel:${ownerPhone}`}
              className="mt-1 inline-block text-sm font-medium text-accent-strong hover:underline"
            >
              {ownerPhone}
            </a>
            <p className="mt-1 text-xs text-zinc-500">
              Можете сразу позвонить для уточнения деталей аренды
            </p>
          </div>
        ) : null}
        {pickupAddress ? (
          <div className="text-sm text-zinc-600">
            Адрес самовывоза: {pickupAddress}
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-sm text-zinc-700">
            Телефон для связи
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-sm outline-none transition focus:border-accent-strong"
            placeholder="+375 (29) 123-45-67"
          />
        </div>

        <div className="rounded-2xl border border-border-subtle bg-white p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-zinc-900">
                Даты аренды
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Прошедшие и занятые даты недоступны
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="shrink-0 rounded-full bg-accent-strong px-4 py-2 text-sm font-semibold text-black transition hover:bg-accent"
            >
              Выбрать
            </button>
          </div>

          <div className="mt-3 rounded-2xl bg-zinc-50 p-4">
            <div className="text-sm font-medium text-zinc-900">
              {selectedLabel}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
              {selectedDaysCount > 0 ? (
                <span>Дней: {selectedDaysCount}</span>
              ) : null}
              <span>
                {minDays > 1
                  ? `Минимальный срок: ${minDays} дн.`
                  : "Можно выбрать один день"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-zinc-700">
            Сообщение владельцу
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-sm outline-none transition focus:border-accent-strong"
            placeholder="Например: нужен с утра, могу забрать сам"
          />
        </div>

        <div className="rounded-2xl border border-border-subtle bg-white p-3 sm:p-4">
          <div className="mb-2 text-sm font-medium text-zinc-900">
            Уже забронированные даты
          </div>

          {loadingBusyDates ? (
            <div className="text-sm text-zinc-500">Загрузка...</div>
          ) : activeBusyRanges.length === 0 ? (
            <div className="text-sm text-zinc-500">
              Пока нет активных бронирований
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeBusyRanges.map((range) => (
                <div
                  key={range._id ?? `${range.startDate}-${range.endDate}`}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
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

      <BookingCalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        value={calendarValue}
        onApply={applyCalendarRange}
        bookedRanges={bookedRanges}
        minDays={minDays}
        isMobile={isMobile}
      />
    </>
  );
}
