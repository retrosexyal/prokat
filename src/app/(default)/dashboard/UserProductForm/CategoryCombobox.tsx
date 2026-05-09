"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CategoryView } from "@/types/category";

type Props = {
  categories: CategoryView[];
  value: string;
  suggestedValue: string;
  onChange: (value: string) => void;
  onSuggest: (value: string) => void;
};

export function CategoryCombobox({
  categories,
  value,
  suggestedValue,
  onChange,
  onSuggest,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [isUserEditing, setIsUserEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

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
        if (a.level !== b.level) return a.level - b.level;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name, "ru");
      });
  }, [categories]);

  const categoriesWithLabels = useMemo(() => {
    return selectableCategories.map((category) => {
      const parent = category.parentId ? parentMap.get(category.parentId) : null;

      return {
        category,
        label: parent ? `${parent.name} → ${category.name}` : category.name,
      };
    });
  }, [selectableCategories, parentMap]);

  const selectedCategoryItem = useMemo(() => {
    return categoriesWithLabels.find((item) => item.category.slug === value);
  }, [categoriesWithLabels, value]);

  const displayValue = isUserEditing
    ? inputValue
    : selectedCategoryItem?.label || suggestedValue || "";

  const normalizedQuery = displayValue.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) {
      return categoriesWithLabels.slice(0, 30);
    }

    return categoriesWithLabels
      .filter(({ category, label }) => {
        return (
          label.toLowerCase().includes(normalizedQuery) ||
          category.slug.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 30);
  }, [categoriesWithLabels, normalizedQuery]);

  const hasExactCategory = categoriesWithLabels.some(({ label }) => {
    return label.toLowerCase() === normalizedQuery;
  });

  const shouldShowSuggestion =
    !value && displayValue.trim().length >= 2 && !hasExactCategory;

  function handleInputChange(nextValue: string): void {
    setInputValue(nextValue);
    setIsUserEditing(true);
    setIsOpen(true);

    onChange("");

    const trimmedValue = nextValue.trim();

    if (trimmedValue.length >= 2) {
      onSuggest(trimmedValue);
    } else {
      onSuggest("");
    }
  }

  function selectExistingCategory(categorySlug: string, label: string): void {
    onChange(categorySlug);
    onSuggest("");

    setInputValue(label);
    setIsUserEditing(true);
    setIsOpen(false);
  }

  function suggestCurrentInput(): void {
    const trimmedValue = displayValue.trim();

    if (!trimmedValue) return;

    onChange("");
    onSuggest(trimmedValue);

    setInputValue(trimmedValue);
    setIsUserEditing(true);
    setIsOpen(false);
  }

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1 text-xs sm:text-sm">
      <span>
        Категория <span className="text-red-500">*</span>
      </span>

      <input
        className="rounded-md border px-2 py-1.5 text-sm"
        value={displayValue}
        placeholder="Начните вводить категорию"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => handleInputChange(event.target.value)}
      />

      {suggestedValue && !value ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Будет отправлена новая категория на модерацию:{" "}
          <span className="font-medium">{suggestedValue}</span>
        </div>
      ) : null}

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border bg-white p-1 shadow-lg">
          {filteredCategories.length > 0 ? (
            filteredCategories.map(({ category, label }) => (
              <button
                key={category._id ?? category.slug}
                type="button"
                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  selectExistingCategory(category.slug, label);
                }}
              >
                <div className="font-medium">{label}</div>
                <div className="text-xs text-zinc-500">{category.slug}</div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-zinc-500">
              Категория не найдена.
            </div>
          )}

          {shouldShowSuggestion ? (
            <button
              type="button"
              className="mt-1 block w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-left text-sm font-medium text-amber-800 hover:bg-amber-100"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();

                suggestCurrentInput();
              }}
            >
              Использовать как новую категорию: “{displayValue.trim()}”
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="text-xs text-zinc-500">
        Выберите существующую категорию или введите новую — она уйдёт на
        модерацию.
      </div>
    </div>
  );
}