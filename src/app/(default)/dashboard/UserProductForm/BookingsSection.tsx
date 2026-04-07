"use client";

import { Button } from "@/components/ui/Button";
import type { BookingView } from "@/types/booking";

type Props = {
  bookings: BookingView[];
  onStatusChange: (
    bookingId: string,
    status: "confirmed" | "cancelled",
  ) => Promise<void>;
};

export function BookingsSection({
  bookings,
  onStatusChange,
}: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium">Бронирования моих товаров</h2>

      {bookings.length === 0 ? (
        <div className="text-sm text-muted">Пока нет бронирований</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="rounded-xl border border-border-subtle bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="text-base font-semibold text-zinc-900">
                    {booking.product?.name ?? "Товар"}
                  </div>

                  <div className="text-sm text-zinc-600">
                    Телефон: {booking.phone}
                  </div>

                  <div className="text-sm text-zinc-600">
                    Контакт: {booking.renterEmail ?? "Гость без регистрации"}
                  </div>

                  {booking.guestIpAddress ? (
                    <div className="text-sm text-zinc-600">
                      IP: {booking.guestIpAddress}
                    </div>
                  ) : null}

                  <div className="text-sm text-zinc-600">
                    Даты: {booking.startDate.slice(0, 10)} —{" "}
                    {booking.endDate.slice(0, 10)}
                  </div>

                  {booking.message ? (
                    <div className="text-sm text-zinc-600">
                      Сообщение: {booking.message}
                    </div>
                  ) : null}
                </div>

                <div className="text-sm text-zinc-500">
                  Статус: {booking.status}
                </div>
              </div>

              {booking.status !== "cancelled" ? (
                <div className="flex gap-2">
                  {booking.status !== "confirmed" && (
                    <Button
                      onClick={() => onStatusChange(booking._id, "confirmed")}
                      type="button"
                    >
                      Подтвердить
                    </Button>
                  )}

                  <Button
                    onClick={() => onStatusChange(booking._id, "cancelled")}
                    type="button"
                    newClasses="text-zinc-700 bg-transparent border border-border-subtle"
                  >
                    Отменить
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}