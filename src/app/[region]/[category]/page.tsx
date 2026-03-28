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
  params: Promise<{ region: string; category: string }>;
  searchParams?: Promise<{
    page?: string;
    q?: string;
  }>;
};

export async function generateStaticParams() {
  const categories = await getAllCategories();

  return [
    "all",
    "mogilev",
    "minsk",
    "gomel",
    "vitebsk",
    "grodno",
    "brest",
  ].flatMap((region) =>
    categories
      .filter(
        (category) =>
          typeof category.slug === "string" && category.slug.length > 0,
      )
      .map((category) => ({
        region,
        category: category.slug,
      })),
  );
}

const PRODUCTS_PER_PAGE = 12;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, category } = await params;

  if (!isRegionSlug(region)) {
    return {};
  }

  const categories = await getAllCategories();
  const categoryItem = categories.find((item) => item.slug === category);

  if (!categoryItem) {
    return {};
  }

  const city = getCityBySlug(region);

  if (!city) {
    return {};
  }

  const isAll = region === ALL_REGION_SLUG;
  const canonical = isAll ? `/all/${category}` : `/${region}/${category}`;

  const title = isAll
    ? `${categoryItem.name} в аренду по Беларуси | Prokatik.by`
    : `${categoryItem.name} в аренду в ${city.nameIn} | Prokatik.by`;

  const description = isAll
    ? `${categoryItem.name} в аренду по Беларуси: предложения, цены, условия бронирования и размещения.`
    : `${categoryItem.name} в аренду в ${city.nameIn}: предложения, цены, условия бронирования и размещения на Prokatik.by.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Prokatik.by",
      locale: "ru_BY",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function RegionCategoryPage({
  params,
  searchParams,
}: Props) {
  const { region, category } = await params;

  if (!isRegionSlug(region)) {
    notFound();
  }

  const [categories, resolvedSearchParams] = await Promise.all([
    getAllCategories(),
    searchParams,
  ]);

  const categoryItem = categories.find((item) => item.slug === category);

  if (!categoryItem) {
    notFound();
  }

  const city = getCityBySlug(region);

  if (!city) {
    notFound();
  }

  const currentPage = Math.max(
    Number(resolvedSearchParams?.page ?? "1") || 1,
    1,
  );
  const search = resolvedSearchParams?.q?.trim() ?? "";
  const selectedCitySlug = isCitySlug(region) ? region : undefined;

  const {
    products,
    totalProducts,
    totalPages,
    currentPage: safePage,
  } = await getApprovedProductsWithAvailability({
    category,
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    search,
    citySlug: selectedCitySlug,
    strictCityOnly: region !== ALL_REGION_SLUG,
  });

  function buildCategoryHref(params: { page?: number; q?: string }) {
    const query = new URLSearchParams();

    if (params.q?.trim()) {
      query.set("q", params.q.trim());
    }

    if (params.page && params.page > 1) {
      query.set("page", String(params.page));
    }

    const queryString = query.toString();
    const basePath = `/${region}/${category}`;

    return queryString ? `${basePath}?${queryString}` : basePath;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2">
              <Link
                href={`/${region}`}
                className="text-sm text-zinc-500 hover:text-zinc-900"
              >
                ← Назад к региону
              </Link>
            </div>

            <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
              {region === ALL_REGION_SLUG
                ? `${categoryItem.name} в аренду`
                : `${categoryItem.name} в аренду в ${city.nameIn}`}
            </h1>

            <p className="mt-2 text-sm text-zinc-600">
              {region === ALL_REGION_SLUG
                ? `Все предложения в категории "${categoryItem.name}"`
                : `Предложения по категории "${categoryItem.name}" в ${city.nameIn}`}
            </p>
          </div>

          <div className="text-sm text-zinc-500">
            Найдено: {totalProducts} позиций
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
          <h2 className="text-xl font-semibold text-zinc-900">
            Товары категории
          </h2>
          {search ? (
            <p className="mt-1 text-sm text-zinc-500">Поиск: {search}</p>
          ) : null}
        </div>

        <div className="px-4 py-4 sm:px-5">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
              <p className="text-sm text-zinc-600">
                В этой категории пока нет товаров
              </p>
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
                href={buildCategoryHref({
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
                href={buildCategoryHref({
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
