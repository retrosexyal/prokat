"use client";

import { SubmitEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import { validateImageFile } from "@/lib/image-validation";
import type { ProductView, ProductStatus } from "@/types/product";
import type { ProductFormValues } from "@/types/product-form";
import { emptyProductForm } from "@/types/product-form";
import { ProductCard } from "@/components/ProductCard";
import { Modal } from "@/components/ui/Modal";
import { DeleteProductConfirm } from "./DeleteProductConfirm";
import { BookingView } from "@/types/booking";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { Button } from "@/components/ui/Button";
import { CategoryView } from "@/types/category";
import { CITIES, getRealCityBySlug } from "@/lib/cities";

type Props = {
  initialProducts: ProductView[];
  initialBookings: BookingView[];
  initialPickupAddress?: string;
  categories: CategoryView[];
};

type ExistingImage = {
  url: string;
  publicId?: string;
};

const MAX_IMAGES = 10;

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  return fallback;
}

function getStatusLabel(status: ProductStatus): string {
  switch (status) {
    case "approved":
      return "Подтвержден";
    case "rejected":
      return "Отклонен";
    case "pending":
    default:
      return "На модерации";
  }
}

export function UserProductForm({
  initialProducts,
  initialBookings,
  initialPickupAddress = "",
  categories,
}: Props) {
  const router = useRouter();

  const [products, setProducts] = useState<ProductView[]>(initialProducts);
  const [form, setForm] = useState<ProductFormValues>({
    ...emptyProductForm,
    pickupAddress: initialPickupAddress,
  });

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [productToDelete, setProductToDelete] = useState<ProductView | null>(
    null,
  );
  const [bookings, setBookings] = useState<BookingView[]>(initialBookings);
  const [bookingActionId, setBookingActionId] = useState<string | null>(null);

  const totalImagesCount = existingImages.length + imageFiles.length;
  const isEditing = editingProductId !== null;

  const submitButtonLabel = useMemo(() => {
    if (loading && isEditing) {
      return "Сохранение...";
    }

    if (loading) {
      return "Отправка...";
    }

    return isEditing
      ? "Сохранить и отправить на модерацию"
      : "Отправить на модерацию";
  }, [isEditing, loading]);

  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

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

  function resetForm(): void {
    setEditingProductId(null);
    setExistingImages([]);
    setImageFiles([]);
    setPreviewUrls([]);
    setForm({ ...emptyProductForm, pickupAddress: initialPickupAddress });
    setError("");
  }

  function startEditing(product: ProductView): void {
    setError("");
    setEditingProductId(product._id ?? null);
    setForm({
      name: product.name ?? "",
      slug: product.slug ?? "",
      category: product.category as ProductFormValues["category"],
      short: product.short ?? "",
      organization: product.organization ?? "",
      depositBYN: product.depositBYN ?? 0,
      pricePerDayBYN: product.pricePerDayBYN ?? 0,
      minDays: product.minDays ?? 1,
      quantity: product.quantity ?? 1,
      city: product.city ?? "Могилёв",
      citySlug: product.citySlug ?? "mogilev",
      pickupAddress: product.pickupAddress ?? "",
    });

    setExistingImages(
      (product.images ?? []).map((url, index) => ({
        url,
        publicId: product.imagePublicIds?.[index],
      })),
    );
    setImageFiles([]);
    setPreviewUrls([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    setError("");

    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const nextFiles = [...imageFiles, ...selectedFiles];
    const nextTotal = existingImages.length + nextFiles.length;

    if (nextTotal > MAX_IMAGES) {
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

  function removeExistingImage(index: number): void {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeAllNewImages(): void {
    setImageFiles([]);
    setPreviewUrls([]);
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
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
      formData.append("pickupAddress", form.pickupAddress);
      formData.append("citySlug", form.citySlug);
      formData.append("quantity", String(form.quantity));

      existingImages.forEach((image) => {
        formData.append("keptImages", image.url);
        if (image.publicId) {
          formData.append("keptImagePublicIds", image.publicId);
        }
      });

      imageFiles.forEach((file) => {
        formData.append("files", file);
      });

      if (isEditing && editingProductId) {
        const response = await api.patch<ProductView>(
          API_ROUTES.productById(editingProductId),
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        setProducts((prev) =>
          prev.map((product) =>
            product._id === editingProductId ? response.data : product,
          ),
        );
      } else {
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
      }

      resetForm();
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

      if (editingProductId === productToDelete._id) {
        resetForm();
      }

      setProductToDelete(null);
      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка удаления товара"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBookingStatusChange(
    bookingId: string,
    status: "confirmed" | "cancelled",
  ): Promise<void> {
    setError("");
    setBookingActionId(bookingId);

    try {
      const response = await api.patch<BookingView>(
        API_ROUTES.bookingById(bookingId),
        { status },
      );

      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                ...response.data,
                _id: booking._id,
                product: booking.product,
              }
            : booking,
        ),
      );

      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка обновления бронирования"));
    } finally {
      setBookingActionId(null);
    }
  }

  return (
    <>
      <div className="space-y-8">
        <section className="bg-white rounded-xl border border-border-subtle p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            {isEditing ? "Редактировать товар" : "Добавить товар"}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-600 mb-4">
            {isEditing
              ? "После сохранения товар снова уйдет на модерацию."
              : "Заполните поля и отправьте товар на модерацию."}
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
                {categories.map(({ name, slug }) => (
                  <option value={slug} key={slug}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs sm:text-sm">
              Город
              <select
                className="rounded-md border px-2 py-1.5 text-sm"
                value={form.citySlug}
                onChange={(event) => {
                  const city = getRealCityBySlug(event.target.value);
                  if (!city) return;

                  setForm((prev) => ({
                    ...prev,
                    citySlug: city.slug,
                    city: city.name,
                  }));
                }}
                required
              >
                {CITIES.filter((city) => city.slug !== "all").map((city) => (
                  <option value={city.slug} key={city.slug}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs sm:text-sm sm:col-span-2">
              Адрес самовывоза или укажите если доставка
              <input
                className="rounded-md border px-2 py-1.5 text-sm"
                value={form.pickupAddress}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    pickupAddress: event.target.value,
                  }))
                }
                placeholder="Например: Могилёв, ул. Ленинская, 10"
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

            <label className="flex flex-col gap-1 text-xs sm:text-sm">
              Количество товара
              <input
                type="number"
                min={1}
                step={1}
                className="rounded-md border px-2 py-1.5 text-sm"
                value={form.quantity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    quantity: Number(event.target.value),
                  }))
                }
                required
              />
            </label>

            <div className="flex flex-col gap-2 text-xs sm:text-sm sm:col-span-2">
              <span>Изображения (до {MAX_IMAGES})</span>

              <FileDropzone
                accept="image/jpeg,image/png,image/webp"
                multiple
                maxFiles={MAX_IMAGES}
                onChange={handleFileChange}
                helperText={`JPEG, PNG, WEBP • выбрано ${totalImagesCount} из ${MAX_IMAGES}`}
              />

              {existingImages.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs text-zinc-500">
                    Уже загруженные изображения
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {existingImages.map((image, index) => (
                      <div key={`${image.url}-${index}`} className="space-y-2">
                        <img
                          src={image.url}
                          alt={`Текущее изображение ${index + 1}`}
                          className="h-40 w-full rounded-lg border object-cover"
                        />
                        <button
                          type="button"
                          className="text-xs text-red-600"
                          onClick={() => removeExistingImage(index)}
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {previewUrls.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs text-zinc-500">Новые изображения</div>

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
                    onClick={removeAllNewImages}
                  >
                    Убрать все новые изображения
                  </button>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="sm:col-span-2 text-xs text-red-600">{error}</div>
            ) : null}

            <div className="sm:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-accent-strong px-6 py-2 text-sm font-semibold text-black disabled:opacity-60"
              >
                {submitButtonLabel}
              </button>

              {isEditing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="rounded-full border border-border-subtle px-6 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-60"
                >
                  Отмена
                </button>
              ) : null}
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
                        onClick={() => setProductToDelete(product)}
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
                        images={images}
                        pricePerDay={product.pricePerDayBYN}
                        available={product.status === "approved"}
                        minDays={1}
                        productId={product._id?.toString() || ""}
                        isHideButton
                      />
                    </div>

                    <div className="mt-3 flex flex-col gap-2 px-1">
                      <div className="text-sm leading-5 text-zinc-500 break-words">
                        Статус: {getStatusLabel(product.status)} · Кол-во:{" "}
                        {product.quantity ?? 1}
                      </div>

                      {productId ? (
                        <div className="flex">
                          <Button
                            type="button"
                            onClick={() => startEditing(product)}
                            newClasses="bg-transparent border border-border-subtle text-zinc-800 px-4 py-2 w-full sm:w-auto"
                          >
                            Редактировать
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
                        Контакт:{" "}
                        {booking.renterEmail ?? "Гость без регистрации"}
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
                          onClick={() =>
                            handleBookingStatusChange(booking._id, "confirmed")
                          }
                          type="button"
                        >
                          Подтвердить
                        </Button>
                      )}

                      <Button
                        onClick={() =>
                          handleBookingStatusChange(booking._id, "cancelled")
                        }
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
