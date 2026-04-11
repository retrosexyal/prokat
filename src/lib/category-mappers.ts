import type { CategoryDoc, CategoryView } from "@/types/category";

export function toCategoryView(category: CategoryDoc): CategoryView {
  return {
    _id: category._id?.toString(),
    name: category.name,
    slug: category.slug,

    parentId: category.parentId ? category.parentId.toString() : null,
    level: category.level,

    isActive: category.isActive,
    sortOrder: category.sortOrder,
    indexingMode: category.indexingMode,

    seoTitle: category.seoTitle ?? "",
    seoDescription: category.seoDescription ?? "",
    h1: category.h1 ?? "",
    introText: category.introText ?? "",
    synonyms: category.synonyms ?? [],
    faq: category.faq ?? [],

    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}