"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/Button";
import type { ProductView } from "@/types/product";
import type { MonetizationRequestView } from "@/types/monetization";
import { InvoiceBox } from "./InvoiceBox";
import { getStatusLabel } from "./helpers";

const PRODUCTS_PER_PAGE = 6;

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
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(products.length / PRODUCTS_PER_PAGE),
  );

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return products.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [currentPage, products]);

  const setEffectPage = useEffectEvent((newPages: number) =>
    setCurrentPage(newPages),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setEffectPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (products.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Мои товары</h2>
        <div className="text-sm text-muted">У вас пока нет товаров</div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-medium">Мои товары</h2>
          <div className="text-sm text-zinc-500">
            Показано {paginatedProducts.length} из {products.length} товаров ·
            страница {currentPage} из {totalPages}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedProducts.map((product) => {
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
                  disabled={
                    deletingId === productId || productToDelete !== null
                  }
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
                  pricePerWeek={product.pricePerWeekBYN}
                  pricePerMonth={product.pricePerMonthBYN}
                />
              </div>

              <div className="mt-3 flex flex-col gap-2 px-1">
                <div className="break-words text-sm leading-5 text-zinc-500">
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

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50"
          >
            Назад
          </button>

          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            const isActive = page === currentPage;

            return (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={[
                  "min-w-10 rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "border border-border-subtle bg-white text-zinc-700 hover:border-zinc-900",
                ].join(" ")}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50"
          >
            Вперёд
          </button>
        </div>
      ) : null}
    </section>
  );
}
