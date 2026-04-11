"use client";

import { useEffect, useState } from "react";
import { ProductBookingForm } from "@/components/ProductBookingForm";

type Props = {
  productId: string;
  minDays: number;
  totalQuantity: number;
  pricePerDayBYN: number;
  productName: string;
};

export function ProductMobileBookingBar({
  productId,
  minDays,
  totalQuantity,
  pricePerDayBYN,
  productName,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-zinc-900">
              {productName}
            </div>
            <div className="text-xs text-zinc-500">
              от {pricePerDayBYN} BYN / сутки
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-black transition hover:bg-accent-strong"
          >
            Забронировать
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/45 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Бронирование товара
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Выберите даты и отправьте заявку
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
              >
                Закрыть
              </button>
            </div>

            <div className="max-h-[calc(92vh-73px)] overflow-y-auto px-4 py-4">
              <ProductBookingForm
                productId={productId}
                minDays={minDays}
                totalQuantity={totalQuantity}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}