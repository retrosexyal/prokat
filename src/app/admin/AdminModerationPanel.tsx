"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import type { ProductDoc, ProductStatus, ProductView } from "@/types/product";

type Props = {
  initialProducts: ProductView[];
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

export function AdminModerationPanel({ initialProducts }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductView[]>(initialProducts);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function changeStatus(
    id: string,
    status: ProductStatus,
  ): Promise<void> {
    setError("");
    setLoadingId(id);

    try {
      const response = await api.patch<ProductDoc>(
        API_ROUTES.adminProductById(id),
        {
          status,
        },
      );

      setProducts((prev) => prev.filter((product) => product._id !== id));

      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка изменения статуса"));
    } finally {
      setLoadingId(null);
    }
  }

  console.log(products);

  return (
    <section className="bg-white rounded-xl border border-border-subtle p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">
        Админка · Модерация товаров
      </h1>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {products.map((product) => {
          const id = product._id?.toString() ?? null;

          return (
            <article
              key={id ?? product.slug}
              className="rounded-xl border border-border-subtle p-4"
            >
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <div>
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-[220px] w-full rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="flex h-[220px] w-full items-center justify-center rounded-lg border text-sm text-zinc-500">
                      Нет изображения
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{product.name}</h2>
                      <div className="text-sm text-zinc-500">
                        slug: {product.slug}
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="rounded-full border px-3 py-1">
                        {product.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="font-medium">Категория:</span>{" "}
                      {product.category}
                    </div>
                    <div>
                      <span className="font-medium">Организация:</span>{" "}
                      {product.organization?.trim()
                        ? product.organization
                        : "—"}
                    </div>
                    <div>
                      <span className="font-medium">Город:</span> {product.city}
                    </div>
                    <div>
                      <span className="font-medium">Цена за сутки:</span>{" "}
                      {product.pricePerDayBYN} BYN
                    </div>
                    <div>
                      <span className="font-medium">Залог:</span>{" "}
                      {product.depositBYN} BYN
                    </div>
                    <div>
                      <span className="font-medium">Мин. дней:</span>{" "}
                      {product.minDays}
                    </div>
                    <div>
                      <span className="font-medium">Email владельца:</span>{" "}
                      {product.ownerEmail ?? "—"}
                    </div>
                    <div>
                      <span className="font-medium">Создан:</span>{" "}
                      {new Date(product.createdAt).toLocaleString("ru-RU")}
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="mb-1 font-medium">Описание:</div>
                    <div className="rounded-md bg-zinc-50 px-3 py-2">
                      {product.short?.trim()
                        ? product.short
                        : "Описание не заполнено"}
                    </div>
                  </div>

                  {id ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        disabled={loadingId === id}
                        className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                        onClick={() => changeStatus(id, "approved")}
                      >
                        Одобрить
                      </button>

                      <button
                        type="button"
                        disabled={loadingId === id}
                        className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                        onClick={() => changeStatus(id, "rejected")}
                      >
                        Отклонить
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        {products.length === 0 ? (
          <div className="rounded-xl border border-border-subtle p-6 text-center text-sm text-zinc-500">
            Нет товаров на модерации.
          </div>
        ) : null}
      </div>
    </section>
  );
}
