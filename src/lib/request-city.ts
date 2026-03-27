import { cookies, headers } from "next/headers";
import {
  DEFAULT_CITY_SLUG,
  getCityByName,
  getCityBySlug,
  getRealCityBySlug,
  isCitySlug,
  isRegionSlug,
  type CitySlug,
} from "@/lib/cities";

export const SELECTED_CITY_COOKIE = "selectedCitySlug";

function normalizeHeaderValue(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function getRequestCity() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieCitySlug = cookieStore.get(SELECTED_CITY_COOKIE)?.value;

  if (cookieCitySlug && isCitySlug(cookieCitySlug)) {
    return getRealCityBySlug(cookieCitySlug)!;
  }

  const vercelCity =
    normalizeHeaderValue(headerStore.get("x-vercel-ip-city")) ??
    normalizeHeaderValue(headerStore.get("x-vercel-edge-city"));

  if (vercelCity) {
    const resolvedByName = getCityByName(vercelCity);
    if (resolvedByName) {
      return resolvedByName;
    }
  }

  return getRealCityBySlug(DEFAULT_CITY_SLUG)!;
}

export async function getRequestCitySlug(): Promise<CitySlug> {
  const city = await getRequestCity();
  return city.slug;
}

export async function getCurrentCityForPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const region = segments[0];

  if (region && isRegionSlug(region) && region !== "all") {
    const cityFromUrl = getCityBySlug(region);
    if (cityFromUrl && cityFromUrl.slug !== "all") {
      return cityFromUrl;
    }
  }

  return getRequestCity();
}
