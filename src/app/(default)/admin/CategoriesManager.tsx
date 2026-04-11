"use client";

import { useEffect, useMemo, useState } from "react";
import { slugify } from "@/lib/slug";
import type { CategoryView, CategoryIndexingMode } from "@/types/category";

type FaqItem = {
  q: string;
  a: string;
};

const EMPTY_FAQ_ITEM: FaqItem = { q: "", a: "" };

export function CategoriesManager() {
  const [name, setName] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("100");
  const [isActive, setIsActive] = useState(true);
  const [indexingMode, setIndexingMode] =
    useState<CategoryIndexingMode>("index");

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [h1, setH1] = useState("");
  const [introText, setIntroText] = useState("");
  const [synonymsText, setSynonymsText] = useState("");
  const [faqItems, setFaqItems] = useState<FaqItem[]>([EMPTY_FAQ_ITEM]);

  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const slugPreview = useMemo(() => {
    const source = customSlug.trim() || name.trim();
    return source ? slugify(source) : "";
  }, [customSlug, name]);

  const rootCategories = useMemo(
    () => categories.filter((category) => category.level === 1),
    [categories],
  );

  const categoriesTree = useMemo(() => {
    return categories
      .filter((category) => category.level === 1)
      .map((parent) => ({
        ...parent,
        children: categories.filter(
          (category) => category.parentId === parent._id,
        ),
      }));
  }, [categories]);

  async function loadCategories() {
    try {
      setLoadingCategories(true);
      setError("");

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

  function resetForm() {
    setName("");
    setCustomSlug("");
    setParentId("");
    setSortOrder("100");
    setIsActive(true);
    setIndexingMode("index");
    setSeoTitle("");
    setSeoDescription("");
    setH1("");
    setIntroText("");
    setSynonymsText("");
    setFaqItems([EMPTY_FAQ_ITEM]);
  }

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
        body: JSON.stringify({
          name: trimmedName,
          slug: customSlug.trim(),
          parentId: parentId || null,
          sortOrder: Number(sortOrder || 100),
          isActive,
          indexingMode,
          seoTitle: seoTitle.trim(),
          seoDescription: seoDescription.trim(),
          h1: h1.trim(),
          introText: introText.trim(),
          synonyms: synonymsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          faq: faqItems.filter((item) => item.q.trim() && item.a.trim()),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "Не удалось создать категорию");
        return;
      }

      setSuccess(`Категория "${data.name}" успешно создана`);
      resetForm();
      await loadCategories();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  function updateFaqItem(index: number, key: keyof FaqItem, value: string) {
    setFaqItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  }

  function addFaqItem() {
    setFaqItems((prev) => [...prev, { q: "", a: "" }]);
  }

  function removeFaqItem(index: number) {
    setFaqItems((prev) => {
      if (prev.length === 1) {
        return [EMPTY_FAQ_ITEM];
      }

      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-900">Категории</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Теперь категория может быть корневой или дочерней, с SEO-полями и
          режимом индексации.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Название категории
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Например: Инструменты"
              disabled={loading}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Собственный slug
            <input
              type="text"
              value={customSlug}
              onChange={(event) => setCustomSlug(event.target.value)}
              placeholder="Можно оставить пустым"
              disabled={loading}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Родительская категория
            <select
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
              disabled={loading}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            >
              <option value="">Без родителя (корневая категория)</option>
              {rootCategories.map((category) => (
                <option key={category._id ?? category.slug} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Порядок сортировки
            <input
              type="number"
              min={0}
              step={1}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              disabled={loading}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Индексация
            <select
              value={indexingMode}
              onChange={(event) =>
                setIndexingMode(event.target.value as CategoryIndexingMode)
              }
              disabled={loading}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            >
              <option value="index">index</option>
              <option value="noindex">noindex</option>
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={loading}
            />
            Активная категория
          </label>
        </div>

        {slugPreview ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            slug: <span className="font-medium text-zinc-900">{slugPreview}</span>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            SEO Title
            <input
              type="text"
              value={seoTitle}
              onChange={(event) => setSeoTitle(event.target.value)}
              disabled={loading}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            H1
            <input
              type="text"
              value={h1}
              onChange={(event) => setH1(event.target.value)}
              disabled={loading}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 sm:col-span-2">
            SEO Description
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
              disabled={loading}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 sm:col-span-2">
            Intro-текст категории
            <textarea
              rows={5}
              value={introText}
              onChange={(event) => setIntroText(event.target.value)}
              disabled={loading}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 sm:col-span-2">
            Синонимы через запятую
            <input
              type="text"
              value={synonymsText}
              onChange={(event) => setSynonymsText(event.target.value)}
              placeholder="прокат, аренда, взять напрокат"
              disabled={loading}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />
          </label>
        </div>

        <div className="rounded-xl border border-zinc-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-zinc-900">FAQ категории</div>
              <div className="text-xs text-zinc-500">
                Эти поля пригодятся позже для SEO-блока на странице категории.
              </div>
            </div>
            <button
              type="button"
              onClick={addFaqItem}
              disabled={loading}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
            >
              Добавить вопрос
            </button>
          </div>

          <div className="grid gap-3">
            {faqItems.map((item, index) => (
              <div
                key={`${index}-${item.q}-${item.a}`}
                className="grid gap-3 rounded-xl border border-zinc-200 p-3"
              >
                <label className="flex flex-col gap-1 text-sm text-zinc-700">
                  Вопрос
                  <input
                    type="text"
                    value={item.q}
                    onChange={(event) =>
                      updateFaqItem(index, "q", event.target.value)
                    }
                    disabled={loading}
                    className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-zinc-700">
                  Ответ
                  <textarea
                    rows={3}
                    value={item.a}
                    onChange={(event) =>
                      updateFaqItem(index, "a", event.target.value)
                    }
                    disabled={loading}
                    className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
                  />
                </label>

                <div>
                  <button
                    type="button"
                    onClick={() => removeFaqItem(index)}
                    disabled={loading}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50"
                  >
                    Удалить вопрос
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Создание..." : "Добавить категорию"}
          </button>
        </div>
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
          <div className="grid gap-4">
            {categoriesTree.map((parent) => (
              <div
                key={parent._id ?? parent.slug}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium text-zinc-900">{parent.name}</div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-zinc-600">
                    slug: {parent.slug}
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-zinc-600">
                    {parent.indexingMode}
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-zinc-600">
                    {parent.isActive ? "active" : "inactive"}
                  </span>
                </div>

                {parent.children.length > 0 ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {parent.children.map((child) => (
                      <div
                        key={child._id ?? child.slug}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-3"
                      >
                        <div className="font-medium text-zinc-900">
                          {child.name}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          slug: {child.slug}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                          <span className="rounded-full bg-zinc-100 px-2 py-1">
                            {child.indexingMode}
                          </span>
                          <span className="rounded-full bg-zinc-100 px-2 py-1">
                            sort: {child.sortOrder}
                          </span>
                          <span className="rounded-full bg-zinc-100 px-2 py-1">
                            {child.isActive ? "active" : "inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-zinc-500">
                    Пока без подкатегорий
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}