"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { CITIES, type RegionSlug } from "@/lib/cities";

const STORAGE_KEY = "selectedCitySlug";
const COOKIE_KEY = "selectedCitySlug";
const ONE_YEAR = 60 * 60 * 24 * 365;

function isKnownRegion(value: string): value is RegionSlug {
  return (
    value === "all" ||
    value === "mogilev" ||
    value === "minsk" ||
    value === "gomel" ||
    value === "vitebsk" ||
    value === "grodno" ||
    value === "brest"
  );
}

function getRegionFromPathname(pathname: string): RegionSlug | null {
  const segments = pathname.split("/").filter(Boolean);
  const region = segments[0];

  if (region && isKnownRegion(region)) {
    return region;
  }

  return null;
}

function buildTargetPath(pathname: string, region: RegionSlug): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return region === "all" ? "/all" : `/${region}`;
  }

  if (isKnownRegion(segments[0])) {
    const rest = segments.slice(1);

    if (rest.length === 0) {
      return region === "all" ? "/all" : `/${region}`;
    }

    return region === "all"
      ? `/all/${rest.join("/")}`
      : `/${region}/${rest.join("/")}`;
  }

  if (segments[0] === "catalog") {
    const rest = segments.slice(1);

    if (rest.length === 0) {
      return region === "all" ? "/all" : `/${region}`;
    }

    return region === "all"
      ? `/all/${rest.join("/")}`
      : `/${region}/${rest.join("/")}`;
  }

  return pathname;
}

type CitySelectorProps = {
  initialRegion: RegionSlug;
};

export function CitySelector({ initialRegion }: CitySelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [selectedRegion, setSelectedRegion] =
    useState<RegionSlug>(initialRegion);

  const setEffectRegion = useEffectEvent((saved: RegionSlug) =>
    setSelectedRegion(saved),
  );

  useEffect(() => {
    const regionFromPath = getRegionFromPathname(pathname);

    if (regionFromPath) {
      setEffectRegion(regionFromPath);
      return;
    }

    setEffectRegion(initialRegion);
  }, [pathname, initialRegion]);

  const options = useMemo(
    () =>
      CITIES.map((city) => ({
        value: city.slug,
        label: city.name,
      })),
    [],
  );

  function handleChange(nextRegion: RegionSlug) {
    setSelectedRegion(nextRegion);

    window.localStorage.setItem(STORAGE_KEY, nextRegion);

    if (nextRegion === "all") {
      document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
    } else {
      document.cookie = `${COOKIE_KEY}=${nextRegion}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    }

    const targetPath = buildTargetPath(pathname, nextRegion);

    startTransition(() => {
      router.push(targetPath);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-zinc-500 sm:inline">Город:</span>

      <div className="relative">
        <select
          value={selectedRegion}
          onChange={(e) => handleChange(e.target.value as RegionSlug)}
          className="rounded-full border border-border-subtle bg-white px-3 py-2 pr-8 text-xs text-zinc-700 outline-none transition focus:border-accent-strong sm:text-sm"
          aria-label="Выбор города"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {isPending ? (
          <span className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
        ) : null}
      </div>
    </div>
  );
}