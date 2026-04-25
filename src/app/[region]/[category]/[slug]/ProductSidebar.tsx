import { ProductBookingForm } from "@/components/ProductBookingForm";
import type { ProductDoc } from "@/types/product";
import { getConditionLabel } from "./utils";
import { PriceBlock } from "@/components/PriceBlock";

type Props = {
  product: ProductDoc;
};

export function ProductSidebar({ product }: Props) {
  return (
    <aside className="hidden space-y-4 md:block">
      <div
        id="product-booking"
        className="sticky top-24 rounded-2xl border border-border-subtle bg-white p-5 shadow-sm"
      >
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Тариф аренды
        </h2>

        <PriceBlock
          pricePerDay={product.pricePerDayBYN}
          pricePerWeek={product.pricePerWeekBYN}
          pricePerMonth={product.pricePerMonthBYN}
        />

        <p className="mt-3 text-sm text-zinc-600">
          Минимум {product.minDays} дн.
        </p>

        {!!product.depositBYN && (
          <p className="mt-1 text-sm text-zinc-600">
            Залог: {product.depositBYN} BYN
          </p>
        )}

        <p className="mt-1 text-sm text-zinc-700">Город: {product.city}</p>

        <p className="mt-1 text-sm text-zinc-700">
          Состояние: {getConditionLabel(product.condition)}
        </p>

        <p className="mt-1 text-sm text-zinc-700">
          Доставка: {product.deliveryAvailable ? "есть" : "нет"}
        </p>

        {product.pickupAddress && (
          <div className="mt-2">
            <p className="mt-1 text-sm text-zinc-600">Адрес самовывоза:</p>
            <p className="mt-1 text-sm text-zinc-700">
              {product.pickupAddress}
            </p>
          </div>
        )}

        <div className="mt-5">
          <ProductBookingForm
            productId={product._id!.toString()}
            minDays={product.minDays}
            totalQuantity={product.quantity ?? 1}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-white p-4 text-sm text-zinc-600 shadow-sm">
        <p>Проверяйте комплект и состояние товара при получении.</p>
        <p className="mt-2">
          Детали выдачи, возврата и продления аренды согласуются после
          подтверждения бронирования.
        </p>
      </div>
    </aside>
  );
}
