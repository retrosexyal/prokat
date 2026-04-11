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
const SITE_URL = "https://prokatik.by";

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

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { region } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isRegionSlug(region)) {
    return {};
  }

  const city = getCityBySlug(region);

  if (!city) {
    return {};
  }

  const isAll = region === ALL_REGION_SLUG;
  const currentPage = Math.max(
    Number(resolvedSearchParams?.page ?? "1") || 1,
    1,
  );
  const search = resolvedSearchParams?.q?.trim() ?? "";

  const canonicalBase = isAll ? "/all" : `/${region}`;
  const canonical =
    search.length > 0
      ? canonicalBase
      : currentPage > 1
        ? `${canonicalBase}?page=${currentPage}`
        : canonicalBase;

  const title = isAll
    ? "Все товары в аренду по Беларуси | Prokatik.by"
    : `Аренда товаров в ${city.nameIn} | Prokatik.by`;

  const description = isAll
    ? "Все товары в аренду по Беларуси: инструменты, техника, товары для дома, отдыха, мероприятий и других задач."
    : `Актуальные товары в аренду в ${city.nameIn}: категории, предложения, поиск и размещение объявлений на Prokatik.by.`;

  const shouldNoindexSearch = search.length > 0;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: shouldNoindexSearch
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
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

  const rootCategories = categories
    .filter((category) => category.isActive)
    .filter((category) => category.level === 1)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.localeCompare(b.name, "ru");
    });

  const childCategoriesByParent = new Map(
    rootCategories.map((parent) => [
      parent._id?.toString(),
      categories
        .filter((category) => category.isActive)
        .filter(
          (category) => category.parentId?.toString() === parent._id?.toString(),
        )
        .sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
          }

          return a.name.localeCompare(b.name, "ru");
        }),
    ]),
  );

  const introText =
    region === ALL_REGION_SLUG
      ? "На этой странице собраны товары в аренду по Беларуси. Вы можете перейти в нужную категорию, выбрать подходящее предложение и оформить бронирование."
      : `На этой странице собраны товары в аренду в ${city.nameIn}. Выберите категорию, перейдите в нужный раздел и найдите подходящее предложение в своём городе.`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: region === ALL_REGION_SLUG ? "Все товары" : city.name,
        item: `${SITE_URL}/${region}`,
      },
    ],
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <Link href="/" className="hover:text-zinc-900">
                Главная
              </Link>
              <span>/</span>
              <span className="text-zinc-900">
                {region === ALL_REGION_SLUG ? "Все товары" : city.name}
              </span>
            </nav>

            <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
              {region === ALL_REGION_SLUG
                ? "Все товары в аренду"
                : `Аренда товаров в ${city.nameIn}`}
            </h1>

            <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-zinc-600">
              {introText}
            </p>
          </div>

          <div className="text-sm text-zinc-500">
            Найдено: {totalProducts} позиций
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
          <h2 className="text-xl font-semibold text-zinc-900">Категории</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Основные разделы каталога для этого региона.
          </p>
        </div>

        <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-2">
          {rootCategories.map((category) => {
            const children =
              childCategoriesByParent.get(category._id?.toString()) ?? [];

            return (
              <div
                key={category._id?.toString() ?? category.slug}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <Link
                      href={`/${region}/${category.slug}`}
                      className="text-lg font-semibold text-zinc-900 hover:text-zinc-700"
                    >
                      {category.h1?.trim() || category.name}
                    </Link>

                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {category.introText?.trim() ||
                        `Перейти в раздел "${category.name}" и посмотреть доступные предложения.`}
                    </p>
                  </div>

                  {children.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {children.map((child) => (
                        <Link
                          key={child._id?.toString() ?? child.slug}
                          href={`/${region}/${child.slug}`}
                          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
          <h2 className="text-xl font-semibold text-zinc-900">Товары</h2>
          {search ? (
            <p className="mt-1 text-sm text-zinc-500">Поиск: {search}</p>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">
              Актуальные предложения по аренде в этом регионе.
            </p>
          )}
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
                  ratingBoost={product.ratingBoost}
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