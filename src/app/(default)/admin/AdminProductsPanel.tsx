"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import type { ProductView, ProductStatus } from "@/types/product";

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

const STATUS_OPTIONS: Array<{
  value: "all" | ProductStatus;
  label: string;
}> = [
  { value: "all", label: "Все статусы" },
  { value: "pending", label: "На модерации" },
  { value: "approved", label: "Одобренные" },
  { value: "rejected", label: "Отклонённые" },
];

export function AdminProductsPanel({ initialProducts }: Props) {
  const router = useRouter();

  const [products, setProducts] = useState<ProductView[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesStatus =
        statusFilter === "all" ? true : product.status === statusFilter;

      const searchFields = [
        product._id ?? "",
        product.name,
        product.slug,
        product.category,
        product.city,
        product.organization ?? "",
        product.ownerEmail ?? "",
        product.ownerPhone ?? "",
        product.brand ?? "",
        product.model ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? searchFields.includes(normalizedSearch)
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [products, search, statusFilter]);

  async function deleteProduct(id: string): Promise<void> {
    setError("");
    setLoadingId(id);

    try {
      await api.delete(API_ROUTES.adminProductById(id));

      setProducts((prev) => prev.filter((product) => product._id !== id));
      setDeleteConfirmId(null);
      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка удаления товара"));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Все товары</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Здесь можно найти любой товар и удалить его из базы.
          </p>
        </div>

        <div className="text-sm text-zinc-500">
          Всего: {products.length} / Найдено: {filteredProducts.length}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Поиск по товарам
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Название, slug, id, email владельца, категория, город..."
            className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Статус
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | ProductStatus)
            }
            className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-border-subtle p-6 text-center text-sm text-zinc-500">
            По вашему запросу товары не найдены.
          </div>
        ) : null}

        {filteredProducts.map((product) => {
          const id = product._id ?? "";
          const isLoading = loadingId === id;
          const isConfirmOpen = deleteConfirmId === id;

          return (
            <article
              key={id || product.slug}
              className="rounded-xl border border-border-subtle p-4"
            >
              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <div>
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-[180px] w-full rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="flex h-[180px] w-full items-center justify-center rounded-lg border text-sm text-zinc-500">
                      Нет изображения
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <div className="text-sm text-zinc-500">ID: {id || "—"}</div>
                      <div className="text-sm text-zinc-500">
                        slug: {product.slug}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full border px-3 py-1">
                        {product.status}
                      </span>
                      <span className="rounded-full border px-3 py-1">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <span className="font-medium">Город:</span> {product.city}
                    </div>
                    <div>
                      <span className="font-medium">Организация:</span>{" "}
                      {product.organization?.trim() || "—"}
                    </div>
                    <div>
                      <span className="font-medium">Email владельца:</span>{" "}
                      {product.ownerEmail || "—"}
                    </div>
                    <div>
                      <span className="font-medium">Телефон:</span>{" "}
                      {product.ownerPhone || "—"}
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
                      <span className="font-medium">Количество:</span>{" "}
                      {product.quantity}
                    </div>
                    <div>
                      <span className="font-medium">Создан:</span>{" "}
                      {new Date(product.createdAt).toLocaleString("ru-RU")}
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="mb-1 font-medium">Описание:</div>
                    <div className="rounded-md bg-zinc-50 px-3 py-2">
                      {product.short?.trim() || "Описание не заполнено"}
                    </div>
                  </div>

                  <div className="pt-2">
                    {!isConfirmOpen ? (
                      <button
                        type="button"
                        disabled={isLoading}
                        className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-60"
                        onClick={() => setDeleteConfirmId(id)}
                      >
                        Удалить товар
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                        <span className="text-sm text-red-700">
                          Точно удалить товар?
                        </span>

                        <button
                          type="button"
                          disabled={isLoading}
                          className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                          onClick={() => deleteProduct(id)}
                        >
                          {isLoading ? "Удаление..." : "Да, удалить"}
                        </button>

                        <button
                          type="button"
                          disabled={isLoading}
                          className="rounded-full border px-3 py-1.5 text-sm disabled:opacity-60"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Отмена
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}