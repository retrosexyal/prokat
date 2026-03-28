import Link from "next/link";
import { Suspense } from "react";
import { CatalogSearch } from "@/components/CatalogSearch";
import { CitySelector } from "@/components/CitySelector";
import { getRequestCity } from "@/lib/request-city";
import { getRealCityBySlug, isRegionSlug, type RegionSlug } from "@/lib/cities";

type LayoutHeaderProps = {
  forcedRegion?: string;
};

export async function LayoutHeader({ forcedRegion }: LayoutHeaderProps = {}) {
  const requestCity = await getRequestCity();

  const initialRegion: RegionSlug =
    forcedRegion && isRegionSlug(forcedRegion)
      ? forcedRegion
      : requestCity.slug;

  const currentCity =
    forcedRegion && forcedRegion !== "all"
      ? getRealCityBySlug(forcedRegion)
      : requestCity;

  return (
    <header className="border-b border-border-subtle bg-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-lg font-bold text-black">
            P
          </span>

          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold">Prokatik.by</span>
            <span className="text-[11px] text-zinc-500">
              Товары в аренду · Беларусь
            </span>
          </div>
        </Link>

        <div className="hidden min-w-0 max-w-md flex-1 md:flex">
          <Suspense
            fallback={<div className="h-11 w-full rounded-full bg-white" />}
          >
            <CatalogSearch />
          </Suspense>
        </div>

        <nav className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
          {currentCity ? (
            <Link
              href={`/${currentCity.slug}`}
              className="hidden rounded-full border border-border-subtle bg-white px-3 py-2 text-xs text-zinc-700 transition hover:bg-zinc-50 sm:inline-flex sm:items-center sm:text-sm"
              title={`Открыть каталог в ${currentCity.nameIn}`}
            >
              Сейчас: {currentCity.name}
            </Link>
          ) : null}

          <CitySelector initialRegion={initialRegion} />

          <Link
            href="/all"
            className="hidden rounded-md px-3 py-2 hover:bg-zinc-100 sm:inline-flex"
          >
            Каталог
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-accent-strong bg-accent px-4 py-2 text-xs font-medium text-black hover:bg-accent-strong sm:text-sm"
          >
            Личный кабинет
          </Link>
        </nav>
      </div>

      <div className="border-t border-border-subtle md:hidden">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Suspense
            fallback={<div className="h-11 w-full rounded-full bg-white" />}
          >
            <CatalogSearch />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
