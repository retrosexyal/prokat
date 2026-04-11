import Link from "next/link";
import { Suspense } from "react";
import { CatalogSearch } from "@/components/CatalogSearch";
import { CitySelector } from "@/components/CitySelector";
import { getRequestCity } from "@/lib/request-city";
import { isRegionSlug, type RegionSlug } from "@/lib/cities";

type LayoutHeaderProps = {
  forcedRegion?: string;
};

export async function LayoutHeader({ forcedRegion }: LayoutHeaderProps = {}) {
  const requestCity = await getRequestCity();

  const initialRegion: RegionSlug =
    forcedRegion && isRegionSlug(forcedRegion) ? forcedRegion : requestCity.slug;

  return (
    <header className="border-b border-border-subtle bg-header">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 md:hidden">
          <Link href="/" className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-black">
                P
              </span>

              <div className="min-w-0 leading-tight">
                <div className="truncate text-lg font-semibold text-zinc-900">
                  Prokatik.by
                </div>
                <div className="text-[11px] text-zinc-500">
                  Товары в аренду
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="shrink-0 rounded-full border border-accent-strong bg-accent px-4 py-2 text-xs font-medium text-black hover:bg-accent-strong"
          >
            Кабинет
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-3 md:hidden">
          <div className="min-w-0 flex-1">
            <CitySelector initialRegion={initialRegion} />
          </div>

          <Link
            href="/all"
            className="shrink-0 rounded-full border border-border-subtle bg-white px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Каталог
          </Link>
        </div>

        <div className="mt-3 md:hidden">
          <Suspense
            fallback={<div className="h-11 w-full rounded-full bg-white" />}
          >
            <CatalogSearch />
          </Suspense>
        </div>

        <div className="hidden items-center justify-between gap-4 md:flex">
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

          <div className="min-w-0 max-w-md flex-1">
            <Suspense
              fallback={<div className="h-11 w-full rounded-full bg-white" />}
            >
              <CatalogSearch />
            </Suspense>
          </div>

          <nav className="flex items-center gap-3 text-sm">
            <CitySelector initialRegion={initialRegion} />

            <Link
              href="/all"
              className="rounded-md px-3 py-2 hover:bg-zinc-100"
            >
              Каталог
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-accent-strong bg-accent px-4 py-2 font-medium text-black hover:bg-accent-strong"
            >
              Личный кабинет
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}