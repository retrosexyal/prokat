import type { CategoryDoc, CategoryView } from "@/types/category";

export function toCategoryView(category: CategoryDoc): CategoryView {
  return {
    _id: category._id?.toString(),
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}