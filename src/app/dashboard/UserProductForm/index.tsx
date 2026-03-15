"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import { validateImageFile } from "@/lib/image-validation";
import type { ProductView } from "@/types/product";
import type { ProductFormValues } from "@/types/product-form";
import { emptyProductForm } from "@/types/product-form";
import { ProductCard } from "@/components/ProductCard";
import { Modal } from "@/components/ui/Modal";
import { DeleteProductConfirm } from "./DeleteProductConfirm";

type Props = {
  initialProducts: ProductView[];
};

const MAX_IMAGES = 10;

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

export function UserProductForm({ initialProducts }: Props) {
  const router = useRouter();

  const [products, setProducts] = useState<ProductView[]>(initialProducts);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [productToDelete, setProductToDelete] = useState<ProductView | null>(
    null,
  );

  useEffect(() => {
    if (imageFiles.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const objectUrls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    setError("");

    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const nextFiles = [...imageFiles, ...selectedFiles];

    if (nextFiles.length > MAX_IMAGES) {
      event.target.value = "";
      setError(`Можно загрузить не более ${MAX_IMAGES} изображений`);
      return;
    }

    for (const file of selectedFiles) {
      const validationError = await validateImageFile(file);

      if (validationError) {
        event.target.value = "";
        setError(`Файл "${file.name}": ${validationError}`);
        return;
      }
    }

    setImageFiles(nextFiles);
    event.target.value = "";
  }

  function removeSelectedImage(index: number): void {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removeAllImages(): void {
    setImageFiles([]);
    setPreviewUrls([]);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("slug", form.slug);
      formData.append("category", form.category);
      formData.append("short", form.short);
      formData.append("organization", form.organization);
      formData.append("depositBYN", String(form.depositBYN));
      formData.append("pricePerDayBYN", String(form.pricePerDayBYN));
      formData.append("minDays", String(form.minDays));
      formData.append("city", form.city);

      imageFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await api.post<ProductView>(
        API_ROUTES.products,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setProducts((prev) => [response.data, ...prev]);
      setForm(emptyProductForm);
      setImageFiles([]);
      setPreviewUrls([]);
      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка сохранения товара"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct(): Promise<void> {
    if (!productToDelete?._id) {
      return;
    }

    setError("");
    setDeletingId(productToDelete._id);

    try {
      await api.delete(API_ROUTES.productById(productToDelete._id));
      setProducts((prev) =>
        prev.filter((product) => product._id !== productToDelete._id),
      );
      setProductToDelete(null);
      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка удаления товара"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="space-y-8">
        <section className="bg-white rounded-xl border border-border-subtle p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            Добавить товар
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 mb-4">
            Заполните поля и отправьте товар на модерацию.
          </p>

          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs sm:text-sm">
              Название
              <input
                className="rounded-md border px-2 py-1.5 text-sm"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-xs sm:text-sm">
              Slug
              <input
                className="rounded-md border px-2 py-1.5 text-sm"
                value={form.slug}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, slug: event.target.value }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-xs sm:text-sm">
              Категория
              <select
                className="rounded-md border px-2 py-1.5 text-sm"
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    category: event.target
                      .value as ProductFormValues["category"],
                  }))
                }
              >
                <option value="instrument">Инструменты</option>
                <option value="ladder">Лестницы</option>
                <option value="level">Уровни</option>
                <option value="vacuum">Пылесосы</option>
                <option value="other">Другое</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs sm:text-sm">
              Организация
              <input
                className="rounded-md border px-2 py-1.5 text-sm"
                value={form.organization}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    organization: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-xs sm:text-sm">
              Город
              <input
                className="rounded-md border px-2 py-1.5 text-sm"
                value={form.city}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, city: event.target.value }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-xs sm:text-sm sm:col-span-2">
              Короткое описание
              <textarea
                className="rounded-md border px-2 py-1.5 text-sm"
                rows={3}
                value={form.short}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, short: event.target.value }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-xs sm:text-sm">
              Цена за сутки (BYN)
              <input
                type="number"
                min={0}
                step={1}
                className="rounded-md border px-2 py-1.5 text-sm"
                value={form.pricePerDayBYN}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    pricePerDayBYN: Number(event.target.value),
                  }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-xs sm:text-sm">
              Залог (BYN)
              <input
                type="number"
                min={0}
                step={1}
                className="rounded-md border px-2 py-1.5 text-sm"
                value={form.depositBYN}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    depositBYN: Number(event.target.value),
                  }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-xs sm:text-sm">
              Мин. дней аренды
              <input
                type="number"
                min={1}
                step={1}
                className="rounded-md border px-2 py-1.5 text-sm"
                value={form.minDays}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    minDays: Number(event.target.value),
                  }))
                }
                required
              />
            </label>

            <div className="flex flex-col gap-2 text-xs sm:text-sm sm:col-span-2">
              <span>Изображения (до {MAX_IMAGES})</span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
              />

              {previewUrls.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {previewUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="space-y-2">
                        <img
                          src={url}
                          alt={`Предпросмотр ${index + 1}`}
                          className="h-40 w-full rounded-lg border object-cover"
                        />
                        <button
                          type="button"
                          className="text-xs text-red-600"
                          onClick={() => removeSelectedImage(index)}
                        >
                          Убрать
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={removeAllImages}
                  >
                    Убрать все изображения
                  </button>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="sm:col-span-2 text-xs text-red-600">{error}</div>
            ) : null}

            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-accent-strong px-6 py-2 text-sm font-semibold text-black disabled:opacity-60"
              >
                {loading ? "Отправка..." : "Отправить на модерацию"}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">Мои товары</h2>

          {products.length === 0 ? (
            <div className="text-sm text-muted">У вас пока нет товаров</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const productId = product._id;
                const images = product.images;

                return (
                  <div key={productId ?? product.slug} className="relative">
                    {productId ? (
                      <button
                        type="button"
                        aria-label={`Удалить товар ${product.name}`}
                        disabled={
                          deletingId === productId || productToDelete !== null
                        }
                        onClick={() => setProductToDelete(product)}
                        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg text-red-600 shadow disabled:opacity-50"
                      >
                        ×
                      </button>
                    ) : null}

                    <ProductCard
                      name={product.name}
                      slug={product.slug}
                      images={images}
                      pricePerDay={product.pricePerDayBYN}
                      available={product.status === "approved"}
                    />

                    <div className="mt-2 px-1 text-sm text-zinc-500">
                      Статус: {product.status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={productToDelete !== null}
        title="Подтверждение удаления"
        onClose={() => {
          if (!deletingId) {
            setProductToDelete(null);
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-700">
            Вы хотите удалить товар{" "}
            <span className="font-semibold">{productToDelete?.name ?? ""}</span>
            ?
          </p>

          <p className="text-sm text-zinc-700">
            Напишите <span className="font-semibold">удалить</span> и
            подтвердите действие.
          </p>

          <DeleteProductConfirm
            loading={deletingId === productToDelete?._id}
            onCancel={() => setProductToDelete(null)}
            onConfirm={handleDeleteProduct}
          />
        </div>
      </Modal>
    </>
  );
}