import Link from "next/link";
import type { Metadata } from "next";
import { getApprovedProducts } from "@/lib/products";
import { getAllCategories } from "@/lib/categories";
import { ProductCard } from "@/components/ProductCard";

const SITE_URL = "https://prokatik.by";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Аренда товаров по Беларуси | Prokatik.by",
  description:
    "Платформа аренды товаров по Беларуси. Ищите и размещайте предложения по аренде инструментов, техники, товаров для дома, отдыха и мероприятий.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Аренда товаров по Беларуси | Prokatik.by",
    description:
      "Платформа аренды товаров по Беларуси. Ищите и размещайте предложения по аренде инструментов, техники, товаров для дома, отдыха и мероприятий.",
    url: "https://prokatik.by",
    siteName: "Prokatik.by",
    locale: "ru_BY",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Аренда товаров по Беларуси | Prokatik.by",
    description:
      "Платформа аренды товаров по Беларуси. Ищите и размещайте предложения по аренде инструментов, техники, товаров для дома, отдыха и мероприятий.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getApprovedProducts({ limit: 6 }),
    getAllCategories(),
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

  const featuredCategories = rootCategories.slice(0, 8);

  const regions = [
    { slug: "minsk", label: "Минск" },
    { slug: "mogilev", label: "Могилёв" },
    { slug: "gomel", label: "Гомель" },
    { slug: "vitebsk", label: "Витебск" },
    { slug: "grodno", label: "Гродно" },
    { slug: "brest", label: "Брест" },
  ];

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Prokatik.by",
    url: SITE_URL,
    logo: `${SITE_URL}/android-chrome-512x512.png`,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Prokatik.by",
    url: SITE_URL,
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />

      <section className="rounded-2xl border border-border-subtle bg-gradient-to-r from-accent/30 via-accent/10 to-transparent px-4 py-6 sm:px-8 sm:py-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl md:text-5xl">
            Аренда товаров
            <br />
            по Беларуси
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:mt-5 sm:text-base">
            Prokatik.by — платформа объявлений для аренды товаров по городам
            Беларуси. Здесь можно найти и разместить предложения для ремонта,
            дома, отдыха, мероприятий, техники и других повседневных задач.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/all"
              className="inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-3 text-sm font-semibold text-black hover:bg-accent"
            >
              Открыть каталог
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-border-subtle bg-white px-6 py-3 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Разместить объявление
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
          <h2 className="text-xl font-semibold text-zinc-900">
            Популярные категории
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Основные разделы каталога для поиска и размещения товаров.
          </p>
        </div>

        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
          {featuredCategories.map((category) => (
            <Link
              key={category._id?.toString() ?? category.slug}
              href={`/all/${category.slug}`}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:border-zinc-300 hover:bg-white"
            >
              <div className="text-lg font-semibold text-zinc-900">
                {category.h1?.trim() || category.name}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-600">
                {category.introText?.trim() ||
                  `Перейти в раздел "${category.name}" и посмотреть доступные предложения.`}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
          <h2 className="text-xl font-semibold text-zinc-900">Города</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Выберите свой регион и откройте локальный каталог аренды.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 px-4 py-4 sm:px-5">
          <Link
            href="/all"
            className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-700 transition hover:bg-white"
          >
            Вся Беларусь
          </Link>

          {regions.map((region) => (
            <Link
              key={region.slug}
              href={`/${region.slug}`}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-700 transition hover:bg-white"
            >
              {region.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
          <h2 className="text-xl font-semibold text-zinc-900">
            Как работает сервис
          </h2>
        </div>

        <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-base font-semibold text-zinc-900">
              1. Выберите категорию
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Перейдите в нужный раздел, выберите город и найдите подходящий
              товар по условиям аренды.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-base font-semibold text-zinc-900">
              2. Свяжитесь с владельцем
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Откройте карточку товара, проверьте стоимость, срок аренды, адрес
              самовывоза и договоритесь о получении.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-base font-semibold text-zinc-900">
              3. Разместите своё предложение
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Если у вас есть товар для аренды, добавьте объявление через личный
              кабинет и получите заявки от клиентов.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">
                Новые товары
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Последние добавленные предложения по аренде.
              </p>
            </div>

            <Link
              href="/all"
              className="hidden text-xs font-medium text-accent-strong hover:text-accent sm:inline"
            >
              Смотреть весь каталог
            </Link>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard
                key={p._id?.toString() ?? p.slug}
                name={p.name}
                slug={p.slug}
                images={p.images}
                pricePerDay={p.pricePerDayBYN}
                available
                minDays={p.minDays ?? 1}
                productId={p._id?.toString() || ""}
                ownerPhone={p.ownerPhone}
                pickupAddress={p.pickupAddress}
                category={p.category}
                citySlug={p.citySlug}
                ratingBoost={p.ratingBoost}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
