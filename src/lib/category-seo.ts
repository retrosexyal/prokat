import type { CategoryFaqItem } from "@/types/category";
import type { CityItem } from "@/lib/cities";

type CategorySeoTemplateContext = {
  categoryName: string;
  cityName: string;
  cityNameIn: string;
  locationName: string;
  locationIn: string;
};

export function createCategorySeoTemplateContext(params: {
  categoryName: string;
  city: CityItem;
  isAllRegion: boolean;
}): CategorySeoTemplateContext {
  const { categoryName, city, isAllRegion } = params;

  return {
    categoryName,
    cityName: city.name,
    cityNameIn: city.nameIn,
    locationName: isAllRegion ? "Беларусь" : city.name,
    locationIn: isAllRegion ? "по Беларуси" : `в ${city.nameIn}`,
  };
}

export function resolveCategorySeoText(
  value: string | undefined,
  context: CategorySeoTemplateContext,
): string {
  const text = value?.trim() ?? "";

  if (!text) {
    return "";
  }

  return text
    .replaceAll("{categoryName}", context.categoryName)
    .replaceAll("{cityName}", context.cityName)
    .replaceAll("{cityNameIn}", context.cityNameIn)
    .replaceAll("{locationName}", context.locationName)
    .replaceAll("{locationIn}", context.locationIn);
}

export function resolveCategorySeoArray(
  values: string[] | undefined,
  context: CategorySeoTemplateContext,
): string[] {
  return (values ?? [])
    .map((item) => resolveCategorySeoText(item, context))
    .filter(Boolean);
}

export function resolveCategorySeoFaq(
  values: CategoryFaqItem[] | undefined,
  context: CategorySeoTemplateContext,
): CategoryFaqItem[] {
  return (values ?? [])
    .map((item) => ({
      q: resolveCategorySeoText(item.q, context),
      a: resolveCategorySeoText(item.a, context),
    }))
    .filter((item) => item.q && item.a);
}
