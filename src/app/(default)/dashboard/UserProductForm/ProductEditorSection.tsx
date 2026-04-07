"use client";

import type { FormEvent } from "react";
import { CITIES, getRealCityBySlug } from "@/lib/cities";
import { FileDropzone } from "@/components/ui/FileDropzone";
import type { CategoryView } from "@/types/category";
import type { ProductFormValues } from "@/types/product-form";
import type { ExistingImage } from "./types";

const MAX_IMAGES = 10;

type Props = {
  isEditing: boolean;
  form: ProductFormValues;
  setForm: React.Dispatch<React.SetStateAction<ProductFormValues>>;
  categories: CategoryView[];
  existingImages: ExistingImage[];
  imageFiles: File[];
  previewUrls: string[];
  totalImagesCount: number;
  loading: boolean;
  error: string;
  submitButtonLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveExistingImage: (index: number) => void;
  onRemoveSelectedImage: (index: number) => void;
  onRemoveAllNewImages: () => void;
};

export function ProductEditorSection({
  isEditing,
  form,
  setForm,
  categories,
  existingImages,
  previewUrls,
  totalImagesCount,
  loading,
  error,
  submitButtonLabel,
  onSubmit,
  onCancel,
  onFileChange,
  onRemoveExistingImage,
  onRemoveSelectedImage,
  onRemoveAllNewImages,
}: Props) {
  return (
    <section className="bg-white rounded-xl border border-border-subtle p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">
        {isEditing ? "Редактировать товар" : "Добавить товар"}
      </h2>

      <p className="text-xs sm:text-sm text-zinc-600 mb-4">
        {isEditing
          ? "После сохранения товар снова уйдет на модерацию."
          : "Заполните поля и отправьте товар на модерацию."}
      </p>

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
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
                category: event.target.value as ProductFormValues["category"],
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
            onChange={onFileChange}
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
                      onClick={() => onRemoveExistingImage(index)}
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
                      onClick={() => onRemoveSelectedImage(index)}
                    >
                      Убрать
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="text-xs text-red-600"
                onClick={onRemoveAllNewImages}
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
              onClick={onCancel}
              disabled={loading}
              className="rounded-full border border-border-subtle px-6 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-60"
            >
              Отмена
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}