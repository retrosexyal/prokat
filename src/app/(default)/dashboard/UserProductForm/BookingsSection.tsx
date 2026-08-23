"use client";

import { Button } from "@/components/ui/Button";
import type { BookingView } from "@/types/booking";
import Link from "next/link";
import { getProductPath } from "@/lib/routes";

function getBookingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

type Props = {
  bookings: BookingView[];
  deletingBookingId?: string | null;
  onStatusChange: (
    bookingId: string,
    status: "confirmed" | "cancelled",
  ) => Promise<void>;
  onDelete: (bookingId: string) => Promise<void>;
};

export function BookingsSection({
  bookings,
  deletingBookingId,
  onStatusChange,
  onDelete,
}: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium">Бронирования моих товаров</h2>

      {bookings.length === 0 ? (
        <div className="text-sm text-muted">Пока нет бронирований</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const isDeleting = deletingBookingId === booking._id;
            const productPath = booking.product
              ? getProductPath({
                  citySlug: booking.product.citySlug,
                  category: booking.product.category,
                  slug: booking.product.slug,
                })
              : null;

            return (
              <div
                key={booking._id}
                className="rounded-xl border border-border-subtle bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    {productPath ? (
                      <Link
                        href={productPath}
                        className="block text-base font-semibold text-zinc-900 hover:underline"
                      >
                        {booking.product?.name ?? "Товар"}
                      </Link>
                    ) : (
                      <div className="text-base font-semibold text-zinc-900">
                        {booking.product?.name ?? "Товар"}
                      </div>
                    )}

                    <div className="text-sm text-zinc-600">
                      Телефон: {booking.phone}
                    </div>

                    {productPath ? (
                      <div className="text-sm text-zinc-600">
                        Ссылка на товар:{" "}
                        <Link href={productPath} className="hover:underline">
                          открыть товар
                        </Link>
                      </div>
                    ) : null}

                    <div className="text-sm text-zinc-600">
                      Количество товаров: {booking.quantity}
                    </div>

                    <div className="text-sm text-zinc-600">
                      Количество дней:{" "}
                      {getBookingDays(booking.startDate, booking.endDate)}
                    </div>

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

                <div className="flex flex-wrap gap-2">
                  {booking.status !== "cancelled" ? (
                    <>
                      {booking.status !== "confirmed" && (
                        <Button
                          onClick={() => onStatusChange(booking._id, "confirmed")}
                          type="button"
                          disabled={isDeleting}
                        >
                          Подтвердить
                        </Button>
                      )}

                      <Button
                        onClick={() => onStatusChange(booking._id, "cancelled")}
                        type="button"
                        disabled={isDeleting}
                        newClasses="text-zinc-700 bg-transparent border border-border-subtle"
                      >
                        Отменить
                      </Button>
                    </>
                  ) : null}

                  <Button
                    onClick={() => onDelete(booking._id)}
                    type="button"
                    disabled={isDeleting}
                    newClasses="text-red-700 bg-transparent border border-red-200"
                  >
                    {isDeleting ? "Удаление..." : "Удалить из списка"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
