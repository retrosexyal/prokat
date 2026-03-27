export const CITIES = [
  { slug: "all", name: "Все города", nameIn: "Беларуси" },
  { slug: "mogilev", name: "Могилёв", nameIn: "Могилёве" },
  { slug: "minsk", name: "Минск", nameIn: "Минске" },
  { slug: "gomel", name: "Гомель", nameIn: "Гомеле" },
  { slug: "vitebsk", name: "Витебск", nameIn: "Витебске" },
  { slug: "grodno", name: "Гродно", nameIn: "Гродно" },
  { slug: "brest", name: "Брест", nameIn: "Бресте" },
] as const;

export type CityItem = (typeof CITIES)[number];
export type CitySlug = Exclude<CityItem["slug"], "all">;
export type RegionSlug = CityItem["slug"];

export const DEFAULT_CITY_SLUG: CitySlug = "mogilev";
export const ALL_REGION_SLUG: RegionSlug = "all";

const CITY_NAME_TO_SLUG_MAP: Record<string, CitySlug> = {
  могилёв: "mogilev",
  могилев: "mogilev",
  mogilev: "mogilev",

  минск: "minsk",
  minsk: "minsk",

  гомель: "gomel",
  gomel: "gomel",

  витебск: "vitebsk",
  vitebsk: "vitebsk",

  гродно: "grodno",
  grodno: "grodno",

  брест: "brest",
  brest: "brest",
};

export function normalizeCityName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isCitySlug(value: string): value is CitySlug {
  return value !== "all" && CITIES.some((city) => city.slug === value);
}

export function getCityBySlug(slug: string): CityItem | undefined {
  return CITIES.find((city) => city.slug === slug);
}

export function getRealCityBySlug(
  slug: string,
): Extract<CityItem, { slug: CitySlug }> | undefined {
  const city = CITIES.find((item) => item.slug === slug && item.slug !== "all");
  return city as Extract<CityItem, { slug: CitySlug }> | undefined;
}

export function getCityByName(
  name: string,
): Extract<CityItem, { slug: CitySlug }> | undefined {
  const normalized = normalizeCityName(name).toLowerCase();
  const slug = CITY_NAME_TO_SLUG_MAP[normalized];
  return slug ? getRealCityBySlug(slug) : undefined;
}

export function isRegionSlug(value: string): value is RegionSlug {
  return CITIES.some((city) => city.slug === value);
}

export function resolveCity(value?: string | null) {
  if (!value) {
    return getRealCityBySlug(DEFAULT_CITY_SLUG)!;
  }

  if (isCitySlug(value)) {
    return getRealCityBySlug(value)!;
  }

  return getCityByName(value) ?? getRealCityBySlug(DEFAULT_CITY_SLUG)!;
}

/* export type CityItem = (typeof CITIES)[number];
export type RegionSlug = CityItem["slug"];
export type CitySlug = Exclude<CityItem["slug"], "all">;

export const ALL_REGION_SLUG = "all";
export const DEFAULT_CITY_SLUG: RegionSlug = "mogilev";

export function getCityBySlug(slug: string) {
  return CITIES.find((city) => city.slug === slug);
}

export function isRegionSlug(value: string): value is RegionSlug {
  return CITIES.some((city) => city.slug === value);
}

export function isCitySlug(value: string): value is CitySlug {
  return value !== "all" && CITIES.some((city) => city.slug === value);
} */

/* export function resolveCity(input?: string | null): {
  city: string;
  citySlug: CitySlug;
} {
  const normalized = (input ?? "").trim().toLowerCase();

  const bySlug = CITIES.find(
    (item) => item.slug !== "all" && item.slug === normalized,
  );
  if (bySlug && bySlug.slug !== "all") {
    return { city: bySlug.name, citySlug: bySlug.slug };
  }

  const byName = CITIES.find(
    (item) => item.slug !== "all" && item.name.toLowerCase() === normalized,
  );
  if (byName && byName.slug !== "all") {
    return { city: byName.name, citySlug: byName.slug };
  }

  return {
    city: "Могилёв",
    citySlug: "mogilev",
  };
}
 */
