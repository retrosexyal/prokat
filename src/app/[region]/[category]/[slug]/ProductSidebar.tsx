import { ProductBookingForm } from "@/components/ProductBookingForm";
import type { ProductDoc } from "@/types/product";
import { getConditionLabel } from "./utils";
import { PriceBlock } from "@/components/PriceBlock";

type Props = {
  product: ProductDoc;
};

export function ProductSidebar({ product }: Props) {
  return (
    <aside className="hidden md:block">
      <div
        id="product-booking"
        className="sticky top-4 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm"
      >
        <div className="shrink-0 p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">
            Тариф аренды
          </h2>

          <PriceBlock
            pricePerDay={product.pricePerDayBYN}
            pricePerWeek={product.pricePerWeekBYN}
            pricePerMonth={product.pricePerMonthBYN}
          />

          <div className="mt-3 space-y-1 text-sm text-zinc-600">
            <p>Минимум {product.minDays} дн.</p>

            {!!product.depositBYN && <p>Залог: {product.depositBYN} BYN</p>}

            <p>Город: {product.city}</p>

            <p>Состояние: {getConditionLabel(product.condition)}</p>

            <p>Доставка: {product.deliveryAvailable ? "есть" : "нет"}</p>

            {product.pickupAddress ? (
              <p>Самовывоз: {product.pickupAddress}</p>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden border-t border-zinc-100 px-5 py-4">
          <ProductBookingForm
            productId={product._id!.toString()}
            minDays={product.minDays}
            totalQuantity={product.quantity ?? 1}
            ownerPhone={product.ownerPhone}
            stickySubmit
          />
        </div>
      </div>
    </aside>
  );
}
