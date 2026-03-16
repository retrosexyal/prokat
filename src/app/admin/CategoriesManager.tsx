"use client";

import { useEffect, useState } from "react";

type CategoryView = {
  _id?: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export function CategoriesManager() {
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  async function loadCategories() {
    try {
      setLoadingCategories(true);

      const response = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        setError("Не удалось загрузить категории");
        return;
      }

      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setError("Ошибка загрузки категорий");
    } finally {
      setLoadingCategories(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    setError("");
    setSuccess("");

    if (!trimmedName) {
      setError("Введите название категории");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "Не удалось создать категорию");
        return;
      }

      setSuccess(`Категория "${data.name}" успешно создана`);
      setName("");
      await loadCategories();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-900">Категории</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Создание и просмотр категорий товаров
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Название категории"
          disabled={loading}
          className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Создание..." : "Добавить"}
        </button>
      </form>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium text-zinc-800">
          Существующие категории
        </h3>

        {loadingCategories ? (
          <p className="text-sm text-zinc-500">Загрузка категорий...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-zinc-500">Категорий пока нет</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category._id ?? category.slug}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"
              >
                <div className="font-medium text-zinc-900">{category.name}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  slug: {category.slug}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}