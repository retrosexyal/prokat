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
import { getSiteUrl } from "@/lib/site-url";

type Props = {
  params: Promise<{ region: string; category: string }>;
  searchParams?: Promise<{
    page?: string;
    q?: string;
  }>;
};

const REGION_SLUGS = [
  "all",
  "mogilev",
  "minsk",
  "gomel",
  "vitebsk",
  "grodno",
  "brest",
];

const PRODUCTS_PER_PAGE = 12;
const SITE_URL = getSiteUrl();

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const categories = await getAllCategories();

  return REGION_SLUGS.flatMap((region) =>
    categories
      .filter(
        (category) =>
          category.isActive &&
          category.indexingMode === "index" &&
          typeof category.slug === "string" &&
          category.slug.length > 0,
      )
      .map((category) => ({
        region,
        category: category.slug,
      })),
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { region, category } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isRegionSlug(region)) {
    return {};
  }

  const categories = await getAllCategories();
  const categoryItem = categories.find(
    (item) => item.slug === category && item.isActive,
  );

  if (!categoryItem) {
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

  const canonicalBase = isAll ? `/all/${category}` : `/${region}/${category}`;
  const canonical =
    search.length > 0
      ? canonicalBase
      : currentPage > 1
        ? `${canonicalBase}?page=${currentPage}`
        : canonicalBase;

  const fallbackTitle = isAll
    ? `${categoryItem.name} в аренду по Беларуси | Prokatik.by`
    : `${categoryItem.name} в аренду в ${city.nameIn} | Prokatik.by`;

  const fallbackDescription = isAll
    ? `${categoryItem.name} в аренду по Беларуси: предложения, цены, условия бронирования и размещения.`
    : `${categoryItem.name} в аренду в ${city.nameIn}: предложения, цены, условия бронирования и размещения на Prokatik.by.`;

  const title = categoryItem.seoTitle?.trim() || fallbackTitle;
  const description =
    categoryItem.seoDescription?.trim() || fallbackDescription;

  const shouldNoindex =
    categoryItem.indexingMode === "noindex" || search.length > 0;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: shouldNoindex
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

  const activeCategories = categories.filter((item) => item.isActive);
  const categoryItem = activeCategories.find((item) => item.slug === category);

  if (!categoryItem) {
    notFound();
  }

  const city = getCityBySlug(region);

  if (!city) {
    notFound();
  }

  const childCategories = activeCategories
    .filter(
      (item) => item.parentId?.toString() === categoryItem._id?.toString(),
    )
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.localeCompare(b.name, "ru");
    });

  const hasChildren = childCategories.length > 0;

  const parentCategory = categoryItem.parentId
    ? activeCategories.find(
        (item) => item._id?.toString() === categoryItem.parentId?.toString(),
      )
    : null;

  const siblingCategories = parentCategory
    ? activeCategories
        .filter(
          (item) =>
            item.parentId?.toString() === parentCategory._id?.toString() &&
            item.slug !== categoryItem.slug,
        )
        .sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
          }

          return a.name.localeCompare(b.name, "ru");
        })
        .slice(0, 8)
    : [];

  const otherRootCategories = activeCategories
    .filter((item) => item.level === 1)
    .filter((item) => item.slug !== categoryItem.slug)
    .filter((item) => item.slug !== parentCategory?.slug)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.localeCompare(b.name, "ru");
    })
    .slice(0, 10);

  const currentPage = Math.max(
    Number(resolvedSearchParams?.page ?? "1") || 1,
    1,
  );
  const search = resolvedSearchParams?.q?.trim() ?? "";
  const selectedCitySlug = isCitySlug(region) ? region : undefined;

  const categorySlugsForProducts = hasChildren
    ? [categoryItem.slug, ...childCategories.map((item) => item.slug)]
    : [categoryItem.slug];

  const result = await getApprovedProductsWithAvailability({
    categories: categorySlugsForProducts,
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    search,
    citySlug: selectedCitySlug,
    strictCityOnly: region !== ALL_REGION_SLUG,
  });

  const { products, totalProducts, totalPages, currentPage: safePage } = result;

  const pageTitle =
    categoryItem.h1?.trim() ||
    (region === ALL_REGION_SLUG
      ? `${categoryItem.name} в аренду`
      : `${categoryItem.name} в аренду в ${city.nameIn}`);

  const introText =
    categoryItem.introText?.trim() ||
    (region === ALL_REGION_SLUG
      ? `На этой странице собраны предложения по аренде в категории "${categoryItem.name}" по Беларуси.`
      : `На этой странице собраны предложения по аренде в категории "${categoryItem.name}" в ${city.nameIn}.`);

  const faqItems = (categoryItem.faq ?? []).filter(
    (item) => item.q.trim() && item.a.trim(),
  );

  const canonicalPath =
    region === ALL_REGION_SLUG ? `/all/${category}` : `/${region}/${category}`;

  const breadcrumbItems = [
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
    {
      "@type": "ListItem",
      position: 3,
      name: categoryItem.h1?.trim() || categoryItem.name,
      item: `${SITE_URL}${canonicalPath}`,
    },
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  const faqJsonLd =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;

  const relatedCategoriesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name:
      region === ALL_REGION_SLUG
        ? `Другие категории рядом с ${categoryItem.name}`
        : `Другие категории аренды в ${city.nameIn}`,
    itemListElement: [
      ...otherRootCategories.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/${region}/${item.slug}`,
        name: item.h1?.trim() || item.name,
      })),
      ...siblingCategories.map((item, index) => ({
        "@type": "ListItem",
        position: otherRootCategories.length + index + 1,
        url: `${SITE_URL}/${region}/${item.slug}`,
        name: item.h1?.trim() || item.name,
      })),
    ],
  };

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

  function buildChildCategoryHref(childSlug: string) {
    return `/${region}/${childSlug}`;
  }

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd),
          }}
        />
      ) : null}

      {otherRootCategories.length > 0 || siblingCategories.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(relatedCategoriesJsonLd),
          }}
        />
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <Link href="/" className="hover:text-zinc-900">
                Главная
              </Link>
              <span>/</span>
              <Link href={`/${region}`} className="hover:text-zinc-900">
                {region === ALL_REGION_SLUG ? "Все товары" : city.name}
              </Link>
              <span>/</span>
              <span className="text-zinc-900">
                {categoryItem.h1?.trim() || categoryItem.name}
              </span>
            </nav>

            <div className="mb-2">
              <Link
                href={`/${region}`}
                className="text-sm text-zinc-500 hover:text-zinc-900"
              >
                ← Назад к региону
              </Link>
            </div>

            <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
              {pageTitle}
            </h1>

            <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-zinc-600">
              {introText}
            </p>
          </div>

          <div className="text-sm text-zinc-500">
            Найдено: {totalProducts} позиций
            {hasChildren ? ` • Подкатегорий: ${childCategories.length}` : ""}
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
          ) : (
            <p className="mt-1 text-sm text-zinc-500">
              Актуальные предложения в категории{" "}
              {categoryItem.h1?.trim() || categoryItem.name}.
            </p>
          )}
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
                  ratingBoost={product.ratingBoost}
                  pricePerWeek={product.pricePerWeekBYN}
                  pricePerMonth={product.pricePerMonthBYN}
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

      {hasChildren && (
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
            <h2 className="text-xl font-semibold text-zinc-900">
              Подкатегории
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Выберите нужный раздел, чтобы увидеть товары и отдельную страницу
              категории.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5 xl:grid-cols-3">
            {childCategories.map((child) => (
              <Link
                key={child._id?.toString() ?? child.slug}
                href={buildChildCategoryHref(child.slug)}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:border-zinc-300 hover:bg-white"
              >
                <div className="text-lg font-semibold text-zinc-900">
                  {child.h1?.trim() || child.name}
                </div>
                <div className="mt-2 text-sm leading-6 text-zinc-600">
                  {child.introText?.trim() ||
                    `Перейти в подкатегорию "${child.name}"`}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {siblingCategories.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
            <h2 className="text-xl font-semibold text-zinc-900">
              Похожие разделы
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Соседние подкатегории внутри того же раздела. Этот блок помогает
              быстро перейти к близким тематикам и усиливает внутреннюю
              перелинковку.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-5">
            {siblingCategories.map((item) => (
              <Link
                key={item._id?.toString() ?? item.slug}
                href={`/${region}/${item.slug}`}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-white"
              >
                {item.h1?.trim() || item.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {otherRootCategories.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
            <h2 className="text-xl font-semibold text-zinc-900">
              Другие категории в этом городе
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Дополнительные разделы каталога в том же регионе. Такие ссылки
              помогают пользователю находить альтернативы, а поисковым системам
              лучше понимать структуру локального каталога.
            </p>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5 xl:grid-cols-3">
            {otherRootCategories.map((item) => (
              <Link
                key={item._id?.toString() ?? item.slug}
                href={`/${region}/${item.slug}`}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition hover:border-zinc-300 hover:bg-white"
              >
                <div className="text-base font-semibold text-zinc-900">
                  {item.h1?.trim() || item.name}
                </div>
                <div className="mt-2 text-sm leading-6 text-zinc-600">
                  {item.introText?.trim() ||
                    `Перейти в категорию "${item.name}" и посмотреть предложения по аренде.`}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {faqItems.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
            <h2 className="text-xl font-semibold text-zinc-900">
              Частые вопросы
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Ответы по аренде и выбору товаров в этой категории.
            </p>
          </div>

          <div className="grid gap-4 px-4 py-4 sm:px-5">
            {faqItems.map((item, index) => (
              <div
                key={`${item.q}-${index}`}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <h3 className="text-base font-semibold text-zinc-900">
                  {item.q}
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-600">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
