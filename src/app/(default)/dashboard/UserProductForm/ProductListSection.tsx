"use client";

import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/Button";
import type { ProductView } from "@/types/product";
import type { MonetizationRequestView } from "@/types/monetization";
import { InvoiceBox } from "./InvoiceBox";
import { getStatusLabel } from "./helpers";

type Props = {
  products: ProductView[];
  deletingId: string | null;
  productToDelete: ProductView | null;
  activeBoostInvoices: Record<string, MonetizationRequestView>;
  onDeleteClick: (product: ProductView) => void;
  onEditClick: (product: ProductView) => void;
  onBoostClick: (product: ProductView) => void;
  onHideBoostInvoice: (productId: string) => void;
};

export function ProductListSection({
  products,
  deletingId,
  productToDelete,
  activeBoostInvoices,
  onDeleteClick,
  onEditClick,
  onBoostClick,
  onHideBoostInvoice,
}: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium">Мои товары</h2>

      {products.length === 0 ? (
        <div className="text-sm text-muted">У вас пока нет товаров</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const productId = product._id;
            const activeBoostInvoice = productId
              ? activeBoostInvoices[productId]
              : null;

            return (
              <div
                key={productId ?? product.slug}
                className="relative flex h-full flex-col rounded-xl"
              >
                {productId ? (
                  <button
                    type="button"
                    aria-label={`Удалить товар ${product.name}`}
                    disabled={deletingId === productId || productToDelete !== null}
                    onClick={() => onDeleteClick(product)}
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg text-red-600 shadow disabled:opacity-50"
                  >
                    ×
                  </button>
                ) : null}

                <div className="min-w-0 overflow-hidden rounded-xl">
                  <ProductCard
                    name={product.name}
                    slug={product.slug}
                    category={product.category}
                    citySlug={product.citySlug}
                    images={product.images}
                    pricePerDay={product.pricePerDayBYN}
                    available={product.status === "approved"}
                    minDays={1}
                    productId={product._id?.toString() || ""}
                    ratingBoost={product.ratingBoost}
                    isHideButton
                  />
                </div>

                <div className="mt-3 flex flex-col gap-2 px-1">
                  <div className="text-sm leading-5 text-zinc-500 break-words">
                    Статус: {getStatusLabel(product.status)} · Кол-во:{" "}
                    {product.quantity ?? 1} · Рейтинг: {product.ratingBoost ?? 0}
                  </div>

                  {activeBoostInvoice ? (
                    <div className="mt-1">
                      <InvoiceBox
                        invoice={activeBoostInvoice}
                        onHide={() => {
                          if (productId) {
                            onHideBoostInvoice(productId);
                          }
                        }}
                      />
                    </div>
                  ) : null}

                  {productId ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        onClick={() => onEditClick(product)}
                        newClasses="bg-transparent border border-border-subtle text-zinc-800 px-4 py-2 w-full sm:w-auto"
                      >
                        Редактировать
                      </Button>

                      <Button
                        type="button"
                        onClick={() => onBoostClick(product)}
                        newClasses="px-4 py-2 w-full sm:w-auto"
                      >
                        Повысить рейтинг
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}