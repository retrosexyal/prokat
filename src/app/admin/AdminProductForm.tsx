"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductDoc } from "@/types/product";

type Props = {
  initialProducts: ProductDoc[];
};

const emptyForm = {
  name: "",
  slug: "",
  category: "instrument",
  short: "",
  depositBYN: 0,
  pricePerDayBYN: 0,
  minDays: 1,
  city: "Могилёв",
  imageUrl: "",
  imagePublicId: "",
};

export function AdminProductForm({ initialProducts }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function startEdit(p: ProductDoc) {
    setEditingId(p._id?.toString() ?? null);
    setForm({
      name: p.name,
      slug: p.slug,
      category: p.category,
      short: p.short,
      depositBYN: p.depositBYN,
      pricePerDayBYN: p.pricePerDayBYN,
      minDays: p.minDays,
      city: p.city,
      imageUrl: p.images[0] ?? "",
      imagePublicId: p.imagePublicIds?.[0] ?? "",
    });
  }

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/images", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Ошибка загрузки файла");
    }

    const data = (await res.json()) as { url: string; publicId: string };
    setForm((prev) => ({
      ...prev,
      imageUrl: data.url,
      imagePublicId: data.publicId,
    }));
  }

  async function handleDeleteImage() {
    if (!form.imagePublicId) {
      setForm((prev) => ({ ...prev, imageUrl: "", imagePublicId: "" }));
      return;
    }

    await fetch(
      `/api/admin/images?publicId=${encodeURIComponent(form.imagePublicId)}`,
      {
        method: "DELETE",
      },
    );

    setForm((prev) => ({ ...prev, imageUrl: "", imagePublicId: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        depositBYN: Number(form.depositBYN),
        pricePerDayBYN: Number(form.pricePerDayBYN),
        minDays: Number(form.minDays),
      };

      let res: Response;
      if (editingId) {
        res = await fetch(`/api/admin/products/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            images: form.imageUrl ? [form.imageUrl] : [],
            imagePublicIds: form.imagePublicId ? [form.imagePublicId] : [],
          }),
        });
      } else {
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Ошибка сохранения");
      }

      const saved = (await res.json()) as ProductDoc;
      setProducts((prev) => {
        if (editingId) {
          return prev.map((p) => (p._id?.toString() === editingId ? saved : p));
        }
        return [saved, ...prev];
      });
      setForm(emptyForm);
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl border border-border-subtle p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-semibold mb-4">
          Админка · Товары
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 mb-4">
          Здесь можно добавлять новые позиции и редактировать существующие.
          Картинки загружаются в Cloudinary прямо из формы ниже.
        </p>

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-xs sm:text-sm">
            Название
            <input
              className="rounded-md border border-border-subtle px-2 py-1.5 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-xs sm:text-sm">
            Slug (для URL)
            <input
              className="rounded-md border border-border-subtle px-2 py-1.5 text-sm"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-xs sm:text-sm">
            Категория
            <select
              className="rounded-md border border-border-subtle px-2 py-1.5 text-sm"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as (typeof form)["category"],
                })
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
            Город
            <input
              className="rounded-md border border-border-subtle px-2 py-1.5 text-sm"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs sm:text-sm sm:col-span-2">
            Короткое описание
            <textarea
              className="rounded-md border border-border-subtle px-2 py-1.5 text-sm"
              rows={3}
              value={form.short}
              onChange={(e) => setForm({ ...form, short: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs sm:text-sm">
            Цена за сутки (BYN)
            <input
              type="number"
              min={0}
              step={1}
              className="rounded-md border border-border-subtle px-2 py-1.5 text-sm"
              value={form.pricePerDayBYN}
              onChange={(e) =>
                setForm({ ...form, pricePerDayBYN: Number(e.target.value) })
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
              className="rounded-md border border-border-subtle px-2 py-1.5 text-sm"
              value={form.depositBYN}
              onChange={(e) =>
                setForm({ ...form, depositBYN: Number(e.target.value) })
              }
            />
          </label>

          <label className="flex flex-col gap-1 text-xs sm:text-sm">
            Мин. дней аренды
            <input
              type="number"
              min={1}
              step={1}
              className="rounded-md border border-border-subtle px-2 py-1.5 text-sm"
              value={form.minDays}
              onChange={(e) =>
                setForm({ ...form, minDays: Number(e.target.value) })
              }
            />
          </label>

          <div className="flex flex-col gap-1 text-xs sm:text-sm sm:col-span-2">
            <span>Изображение товара (Cloudinary)</span>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setLoading(true);
                    await handleUpload(file);
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Ошибка загрузки файла",
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-xs"
              />
              {form.imageUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 truncate max-w-[160px]">
                    {form.imageUrl}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={handleDeleteImage}
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="sm:col-span-2 text-xs text-red-600">{error}</div>
          )}

          <div className="sm:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-accent-strong px-6 py-2 text-sm font-semibold text-black hover:bg-accent disabled:opacity-60"
            >
              {editingId ? "Сохранить изменения" : "Добавить товар"}
            </button>
            {editingId && (
              <button
                type="button"
                className="text-xs text-zinc-500"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Отменить редактирование
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-border-subtle p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-3">Список товаров</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-zinc-500">
                <th className="py-2 pr-4">Название</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2 pr-4">Цена</th>
                <th className="py-2 pr-4">Залог</th>
                <th className="py-2 pr-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p._id?.toString() ?? p.slug}
                  className="border-b border-border-subtle last:border-b-0"
                >
                  <td className="py-2 pr-4">{p.name}</td>
                  <td className="py-2 pr-4 text-zinc-500">{p.slug}</td>
                  <td className="py-2 pr-4">
                    {p.pricePerDayBYN} BYN / сутки
                  </td>
                  <td className="py-2 pr-4">{p.depositBYN}</td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      className="text-xs text-accent-strong hover:text-accent"
                      onClick={() => startEdit(p)}
                    >
                      Редактировать
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-3 text-zinc-500 text-center text-xs"
                  >
                    Пока нет товаров. Добавь первый через форму выше.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

