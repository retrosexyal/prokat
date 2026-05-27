"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import {
  getGuestBookingLookups,
  readGuestBookings,
  replaceGuestBookingsFromServer,
  writeGuestBookings,
  type StoredGuestBooking,
} from "@/lib/guest-booking-storage";
import {
  BOOKING_STATUS_LABELS,
  type BookingStatus,
  type BookingView,
} from "@/types/booking";

const FALLBACK_IMAGE = "/assets/no-image.webp";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return new Intl.DateTimeFormat("ru-RU").format(date);
}

function getStatusClassName(status: BookingStatus): string {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled") {
    return "border-zinc-200 bg-zinc-50 text-zinc-500";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function GuestBookingsClient() {
  const [bookings, setBookings] = useState<StoredGuestBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshBookings = useCallback(async (): Promise<void> => {
    const lookups = getGuestBookingLookups();

    if (lookups.length === 0) {
      setBookings([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post<BookingView[]>(API_ROUTES.guestBookings, {
        bookings: lookups,
      });
      const nextBookings = replaceGuestBookingsFromServer(response.data);

      setBookings(nextBookings);
    } catch {
      setError("Не удалось обновить статусы бронирований. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }, []);

  function deleteBooking(bookingId: string): void {
    const nextBookings = bookings.filter(
      (booking) => booking.bookingId !== bookingId,
    );

    setBookings(nextBookings);
    writeGuestBookings(nextBookings);
  }

  useEffect(() => {
    const storedBookings = readGuestBookings();

    setBookings(storedBookings);

    if (storedBookings.length > 0) {
      void refreshBookings();
    }
  }, [refreshBookings]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
              Мои бронирования
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Здесь показаны заявки, которые были отправлены без входа в
              аккаунт с этого браузера.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshBookings()}
            disabled={loading || bookings.length === 0}
            className="rounded-full bg-accent-strong px-4 py-2 text-sm font-semibold text-black transition hover:bg-accent disabled:opacity-60"
          >
            {loading ? "Обновление..." : "Обновить статусы"}
          </button>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </section>

      {bookings.length === 0 ? (
        <section className="rounded-xl border border-border-subtle bg-white p-6 text-center">
          <h2 className="text-lg font-semibold text-zinc-900">
            Сохранённых бронирований нет
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
            После отправки заявки без авторизации она появится здесь и останется
            доступной после обновления страницы.
          </p>
          <Link
            href="/all"
            className="mt-4 inline-flex rounded-full bg-accent-strong px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-accent"
          >
            Перейти в каталог
          </Link>
        </section>
      ) : (
        <section className="space-y-3">
          {bookings.map((booking) => {
            const cardContent = (
              <>
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-50 sm:h-28 sm:w-28">
                  <img
                    src={booking.productImage ?? FALLBACK_IMAGE}
                    alt={booking.productName}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-zinc-900">
                        {booking.productName}
                      </h2>
                      <div className="mt-2 space-y-1 text-sm text-zinc-600">
                        <div>
                          Даты: {formatDate(booking.startDate)} -{" "}
                          {formatDate(booking.endDate)}
                        </div>
                        <div>Телефон: {booking.phone}</div>
                        {booking.message ? (
                          <div>Сообщение: {booking.message}</div>
                        ) : null}
                      </div>
                    </div>

                    <span
                      className={[
                        "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium",
                        getStatusClassName(booking.status),
                      ].join(" ")}
                    >
                      {BOOKING_STATUS_LABELS[booking.status]}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {booking.productHref ? (
                      <Link
                        href={booking.productHref}
                        className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                      >
                        Открыть товар
                      </Link>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => deleteBooking(booking.bookingId)}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Удалить из списка
                    </button>
                  </div>
                </div>
              </>
            );

            return (
              <article
                key={booking.bookingId}
                className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-white p-4 sm:flex-row"
              >
                {cardContent}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
