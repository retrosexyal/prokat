import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { getApprovedProductsWithAvailability } from "@/lib/products";
import { getAllCategories } from "@/lib/categories";
import {
  ALL_REGION_SLUG,
  getCityBySlug,
  isCitySlug,
  isRegionSlug,
} from "@/lib/cities";

type Props = {
  params: Promise<{ region: string }>;
  searchParams?: Promise<{
    page?: string;
    q?: string;
  }>;
};

const PRODUCTS_PER_PAGE = 12;

export function generateStaticParams() {
  return [
    { region: "all" },
    { region: "mogilev" },
    { region: "minsk" },
    { region: "gomel" },
    { region: "vitebsk" },
    { region: "grodno" },
    { region: "brest" },
  ];
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params;

  if (!isRegionSlug(region)) {
    return {};
  }

  const city = getCityBySlug(region);

  if (!city) {
    return {};
  }

  const isAll = region === ALL_REGION_SLUG;

  const title = isAll
    ? "Все товары в аренду по Беларуси | Prokatik.by"
    : `Аренда товаров в ${city.nameIn} | Prokatik.by`;

  const description = isAll
    ? "Все товары в аренду по Беларуси: инструменты, техника, товары для дома, отдыха и других задач."
    : `Актуальные товары в аренду в ${city.nameIn}: поиск, бронирование и размещение объявлений на Prokatik.by.`;

  return {
    title,
    description,
    alternates: {
      canonical: isAll ? "/all" : `/${region}`,
    },
    openGraph: {
      title,
      description,
      url: isAll ? "/all" : `/${region}`,
      siteName: "Prokatik.by",
      locale: "ru_BY",
      type: "website",
    },
  };
}

export default async function RegionPage({ params, searchParams }: Props) {
  const { region } = await params;

  if (!isRegionSlug(region)) {
    notFound();
  }

  const city = getCityBySlug(region);

  if (!city) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(
    Number(resolvedSearchParams?.page ?? "1") || 1,
    1,
  );
  const search = resolvedSearchParams?.q?.trim() ?? "";
  const selectedCitySlug = isCitySlug(region) ? region : undefined;

  const [
    categories,
    { products, totalProducts, totalPages, currentPage: safePage },
  ] = await Promise.all([
    getAllCategories(),
    getApprovedProductsWithAvailability({
      page: currentPage,
      limit: PRODUCTS_PER_PAGE,
      search,
      citySlug: selectedCitySlug,
      strictCityOnly: region !== ALL_REGION_SLUG,
    }),
  ]);

  function buildRegionHref(params: { page?: number; q?: string }) {
    const query = new URLSearchParams();

    if (params.q?.trim()) {
      query.set("q", params.q.trim());
    }

    if (params.page && params.page > 1) {
      query.set("page", String(params.page));
    }

    const queryString = query.toString();
    return queryString ? `/${region}?${queryString}` : `/${region}`;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
              {region === ALL_REGION_SLUG
                ? "Все товары в аренду"
                : `Аренда товаров в ${city.nameIn}`}
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              {region === ALL_REGION_SLUG
                ? "Все доступные товары по Беларуси"
                : `Товары для аренды в ${city.nameIn}. Можно забронировать или разместить своё предложение.`}
            </p>
          </div>
          <div className="text-sm text-zinc-500">
            Найдено: {totalProducts} позиций
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">
          Категории
        </h2>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category._id?.toString() ?? category.slug}
              href={`/${region}/${category.slug}`}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
          <h2 className="text-xl font-semibold text-zinc-900">Товары</h2>
          {search ? (
            <p className="mt-1 text-sm text-zinc-500">Поиск: {search}</p>
          ) : null}
        </div>

        <div className="px-4 py-4 sm:px-5">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
              <p className="text-sm text-zinc-600">Пока нет товаров</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product._id?.toString() ?? product.slug}
                  name={product.name}
                  slug={product.slug}
                  category={product.category}
                  citySlug={product.citySlug}
                  images={product.images}
                  pricePerDay={product.pricePerDayBYN}
                  available={product.isAvailableNow}
                  minDays={product.minDays ?? 1}
                  productId={product._id?.toString() || ""}
                  pickupAddress={product.pickupAddress}
                  ownerPhone={product.ownerPhone || ""}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-500">
              Страница {safePage} из {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={buildRegionHref({
                  q: search,
                  page: Math.max(safePage - 1, 1),
                })}
                aria-disabled={safePage <= 1}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  safePage <= 1
                    ? "pointer-events-none border border-zinc-200 bg-zinc-100 text-zinc-400"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Назад
              </Link>

              <Link
                href={buildRegionHref({
                  q: search,
                  page: Math.min(safePage + 1, totalPages),
                })}
                aria-disabled={safePage >= totalPages}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  safePage >= totalPages
                    ? "pointer-events-none border border-zinc-200 bg-zinc-100 text-zinc-400"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Вперёд
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
