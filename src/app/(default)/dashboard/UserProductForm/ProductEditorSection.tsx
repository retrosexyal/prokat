"use client";

import { useMemo, type FormEvent } from "react";
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
  const parentMap = useMemo(() => {
    return new Map(categories.map((category) => [category._id, category]));
  }, [categories]);

  const selectableCategories = useMemo(() => {
    return categories
      .filter((category) => category.isActive)
      .filter((category) => {
        return !categories.some(
          (candidate) => candidate.parentId === category._id,
        );
      })
      .sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level;
        }

        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }

        return a.name.localeCompare(b.name, "ru");
      });
  }, [categories]);

  function getKitItems(): string[] {
    return form.kitIncludedText ? form.kitIncludedText.split("\n") : [""];
  }

  function updateKitItem(index: number, value: string): void {
    const items = getKitItems();
    items[index] = value;
    setForm((prev) => ({ ...prev, kitIncludedText: items.join("\n") }));
  }

  function addKitItem(): void {
    setForm((prev) => ({
      ...prev,
      kitIncludedText: [...getKitItems(), ""].join("\n"),
    }));
  }

  function removeKitItem(index: number): void {
    const items = getKitItems().filter((_, itemIndex) => itemIndex !== index);
    setForm((prev) => ({
      ...prev,
      kitIncludedText: items.length > 0 ? items.join("\n") : "",
    }));
  }

  const hasCurrentCategoryInOptions = selectableCategories.some(
    (category) => category.slug === form.category,
  );

  function getCategoryLabel(category: CategoryView): string {
    if (!category.parentId) {
      return category.name;
    }

    const parent = parentMap.get(category.parentId);

    if (!parent) {
      return category.name;
    }

    return `${parent.name} → ${category.name}`;
  }

  function getSpecificationItems(): { label: string; value: string }[] {
    const lines = form.specificationsText
      ? form.specificationsText.split("\n")
      : [""];

    return lines.map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) return { label: line, value: "" };

      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    });
  }

  function serializeSpecificationItems(
    items: { label: string; value: string }[],
  ): string {
    return items
      .map((item) => {
        if (!item.label && !item.value) return "";
        if (!item.value) return item.label;
        return `${item.label}: ${item.value}`;
      })
      .join("\n");
  }

  function updateSpecificationItem(
    index: number,
    field: "label" | "value",
    value: string,
  ): void {
    const items = getSpecificationItems();
    items[index] = { ...items[index], [field]: value };

    setForm((prev) => ({
      ...prev,
      specificationsText: serializeSpecificationItems(items),
    }));
  }

  function addSpecificationItem(): void {
    setForm((prev) => ({
      ...prev,
      specificationsText: `${serializeSpecificationItems(
        getSpecificationItems(),
      )}\n`,
    }));
  }

  function removeSpecificationItem(index: number): void {
    const items = getSpecificationItems().filter(
      (_, itemIndex) => itemIndex !== index,
    );

    setForm((prev) => ({
      ...prev,
      specificationsText: serializeSpecificationItems(items),
    }));
  }

  function getFaqItems(): { question: string; answer: string }[] {
    const lines = form.faqText ? form.faqText.split("\n") : [""];

    return lines.map((line) => {
      const [question = "", answer = ""] = line.split("||");
      return { question: question.trim(), answer: answer.trim() };
    });
  }

  function serializeFaqItems(
    items: { question: string; answer: string }[],
  ): string {
    return items
      .map((item) => {
        if (!item.question && !item.answer) return "";
        return `${item.question} || ${item.answer}`;
      })
      .join("\n");
  }

  function updateFaqItem(
    index: number,
    field: "question" | "answer",
    value: string,
  ): void {
    const items = getFaqItems();
    items[index] = { ...items[index], [field]: value };

    setForm((prev) => ({
      ...prev,
      faqText: serializeFaqItems(items),
    }));
  }

  function addFaqItem(): void {
    setForm((prev) => ({
      ...prev,
      faqText: `${serializeFaqItems(getFaqItems())}\n`,
    }));
  }

  function removeFaqItem(index: number): void {
    const items = getFaqItems().filter((_, itemIndex) => itemIndex !== index);

    setForm((prev) => ({
      ...prev,
      faqText: serializeFaqItems(items),
    }));
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
      <h2 className="mb-4 text-xl font-semibold sm:text-2xl">
        {isEditing ? "Редактировать товар" : "Добавить товар"}
      </h2>

      <p className="mb-4 text-xs text-zinc-600 sm:text-sm">
        {isEditing
          ? "После сохранения товар снова уйдет на модерацию."
          : "Заполните поля и отправьте товар на модерацию."}
      </p>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
      >
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
            required
          >
            <option value="">Выберите категорию</option>

            {!hasCurrentCategoryInOptions && form.category ? (
              <option value={form.category}>
                Текущая категория ({form.category})
              </option>
            ) : null}

            {selectableCategories.map((category) => (
              <option value={category.slug} key={category._id ?? category.slug}>
                {getCategoryLabel(category)}
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

        <label className="flex flex-col gap-1 text-xs sm:text-sm">
          Организация
          <input
            className="rounded-md border px-2 py-1.5 text-sm"
            value={form.organization}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, organization: event.target.value }))
            }
            placeholder="Например: Prokat Servis"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs sm:text-sm">
          Бренд
          <input
            className="rounded-md border px-2 py-1.5 text-sm"
            value={form.brand}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, brand: event.target.value }))
            }
            placeholder="Например: Bosch"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs sm:text-sm">
          Модель
          <input
            className="rounded-md border px-2 py-1.5 text-sm"
            value={form.model}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, model: event.target.value }))
            }
            placeholder="Например: GSB 13 RE"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs sm:text-sm">
          Состояние
          <select
            className="rounded-md border px-2 py-1.5 text-sm"
            value={form.condition}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                condition: event.target.value as ProductFormValues["condition"],
              }))
            }
          >
            <option value="new">Новый</option>
            <option value="excellent">Отличное</option>
            <option value="good">Хорошее</option>
            <option value="used">Б/у</option>
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

        <label className="flex items-center gap-2 rounded-md border px-3 py-3 text-xs sm:text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.deliveryAvailable}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                deliveryAvailable: event.target.checked,
              }))
            }
          />
          Есть доставка
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

        <label className="flex flex-col gap-1 text-xs sm:text-sm sm:col-span-2">
          Полное описание
          <textarea
            className="rounded-md border px-2 py-1.5 text-sm"
            rows={7}
            value={form.fullDescription}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                fullDescription: event.target.value,
              }))
            }
            placeholder="Подробно опиши товар, для каких задач он подходит, что входит в комплект, в каком он состоянии и какие условия аренды."
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
          Цена за неделю (BYN)
          <input
            type="number"
            min={0}
            step={1}
            className="rounded-md border px-2 py-1.5 text-sm"
            value={form.pricePerWeekBYN}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                pricePerWeekBYN: Number(event.target.value),
              }))
            }
            placeholder="Необязательно"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs sm:text-sm">
          Цена за месяц (BYN)
          <input
            type="number"
            min={0}
            step={1}
            className="rounded-md border px-2 py-1.5 text-sm"
            value={form.pricePerMonthBYN}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                pricePerMonthBYN: Number(event.target.value),
              }))
            }
            placeholder="Необязательно"
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

        <div className="flex flex-col gap-2 text-xs md:col-span-2 sm:text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Комплект</span>
            <button
              type="button"
              className="w-full rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 md:w-auto"
              onClick={addKitItem}
            >
              + Добавить предмет
            </button>
          </div>

          <div className="space-y-2">
            {getKitItems().map((item, index) => (
              <div
                className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                key={`kit-${index}`}
              >
                <input
                  className="rounded-md border px-2 py-1.5 text-sm"
                  value={item}
                  onChange={(event) => updateKitItem(index, event.target.value)}
                  placeholder="Например: Кейс"
                />
                <button
                  type="button"
                  className="w-full rounded-md border border-border-subtle px-3 py-1.5 text-xs text-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  onClick={() => removeKitItem(index)}
                  disabled={getKitItems().length === 1 && !item}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs md:col-span-2 sm:text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Характеристики</span>
            <button
              type="button"
              className="w-full rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 md:w-auto"
              onClick={addSpecificationItem}
            >
              + Добавить характеристику
            </button>
          </div>

          <div className="space-y-2">
            {getSpecificationItems().map((item, index) => (
              <div
                className="grid gap-2 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto]"
                key={`specification-${index}`}
              >
                <input
                  className="rounded-md border px-2 py-1.5 text-sm"
                  value={item.label}
                  onChange={(event) =>
                    updateSpecificationItem(index, "label", event.target.value)
                  }
                  placeholder="Название, например: Мощность"
                />
                <input
                  className="rounded-md border px-2 py-1.5 text-sm"
                  value={item.value}
                  onChange={(event) =>
                    updateSpecificationItem(index, "value", event.target.value)
                  }
                  placeholder="Описание, например: 600 Вт"
                />
                <button
                  type="button"
                  className="w-full rounded-md border border-border-subtle px-3 py-1.5 text-xs text-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  onClick={() => removeSpecificationItem(index)}
                  disabled={
                    getSpecificationItems().length === 1 &&
                    !item.label &&
                    !item.value
                  }
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs md:col-span-2 sm:text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>FAQ для карточки</span>
            <button
              type="button"
              className="w-full rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 md:w-auto"
              onClick={addFaqItem}
            >
              + Добавить вопрос
            </button>
          </div>

          <div className="space-y-2">
            {getFaqItems().map((item, index) => (
              <div
                className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto]"
                key={`faq-${index}`}
              >
                <input
                  className="rounded-md border px-2 py-1.5 text-sm"
                  value={item.question}
                  onChange={(event) =>
                    updateFaqItem(index, "question", event.target.value)
                  }
                  placeholder="Вопрос"
                />
                <input
                  className="rounded-md border px-2 py-1.5 text-sm"
                  value={item.answer}
                  onChange={(event) =>
                    updateFaqItem(index, "answer", event.target.value)
                  }
                  placeholder="Ответ"
                />
                <button
                  type="button"
                  className="w-full rounded-md border border-border-subtle px-3 py-1.5 text-xs text-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  onClick={() => removeFaqItem(index)}
                  disabled={
                    getFaqItems().length === 1 && !item.question && !item.answer
                  }
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>

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
          <div className="text-xs text-red-600 sm:col-span-2">{error}</div>
        ) : null}

        <div className="flex flex-wrap gap-3 sm:col-span-2">
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
