import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductBookingForm } from "@/components/ProductBookingForm";
import { getApprovedProducts, getProductBySlug } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/categories";
import { getCityBySlug, isRegionSlug } from "@/lib/cities";
import { getProductPath } from "@/lib/routes";
import type { ProductCondition, ProductFaqItem } from "@/types/product";

type Props = {
  params: Promise<{
    region: string;
    category: string;
    slug: string;
  }>;
};

const SITE_URL = "https://prokatik.by";

function getConditionLabel(condition?: ProductCondition): string {
  switch (condition) {
    case "new":
      return "Новый";
    case "excellent":
      return "Отличное";
    case "good":
      return "Хорошее";
    case "used":
      return "Б/у";
    default:
      return "Хорошее";
  }
}

function getSchemaCondition(condition?: ProductCondition): string {
  switch (condition) {
    case "new":
      return "https://schema.org/NewCondition";
    case "excellent":
    case "good":
    case "used":
    default:
      return "https://schema.org/UsedCondition";
  }
}

function buildProductFaq(productName: string, city: string, pickupAddress?: string, depositBYN?: number, customFaq?: ProductFaqItem[]) {
  const normalizedCustomFaq = (customFaq ?? []).filter(
    (item) => item.q.trim() && item.a.trim(),
  );

  if (normalizedCustomFaq.length > 0) {
    return normalizedCustomFaq;
  }

  return [
    {
      q: `На какой срок можно арендовать ${productName}?`,
      a: `Минимальный срок аренды для этого товара указывается в карточке. Точные условия и возможный срок продления согласуются при бронировании.`,
    },
    {
      q: `Где можно забрать ${productName}?`,
      a: pickupAddress
        ? `Самовывоз доступен по адресу: ${pickupAddress}. Детали получения согласуются после бронирования.`
        : `Товар доступен для получения в городе ${city}. Детали выдачи согласуются после бронирования.`,
    },
    {
      q: `Нужен ли залог для аренды ${productName}?`,
      a: depositBYN
        ? `Да, для этого товара указан залог ${depositBYN} BYN.`
        : "Для этого товара залог не указан.",
    },
  ];
}

export async function generateStaticParams() {
  const products = await getApprovedProducts();

  return products.flatMap((product) => {
    if (
      typeof product.citySlug !== "string" ||
      !product.citySlug ||
      typeof product.category !== "string" ||
      !product.category ||
      typeof product.slug !== "string" ||
      !product.slug
    ) {
      return [];
    }

    return [
      {
        region: product.citySlug,
        category: product.category,
        slug: product.slug,
      },
    ];
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));

  if (product?.status !== "approved") {
    return {};
  }

  const categoryDoc = await getCategoryBySlug(product.category);
  const city = getCityBySlug(product.citySlug);

  const canonical = getProductPath({
    slug: product.slug,
    category: product.category,
    citySlug: product.citySlug,
  });

  const categoryName = categoryDoc?.name ?? "товара";
  const cityNameIn = city?.nameIn ?? product.city;
  const brandModel = [product.brand, product.model].filter(Boolean).join(" ");
  const titleBase = brandModel ? `${product.name} ${brandModel}` : product.name;

  const title = `${titleBase} в аренду в ${cityNameIn} | Prokatik.by`;

  const description = [
    `${product.name} в аренду в ${cityNameIn}.`,
    product.brand ? `Бренд: ${product.brand}.` : null,
    product.model ? `Модель: ${product.model}.` : null,
    `Категория: ${categoryName}.`,
    `Цена: ${product.pricePerDayBYN} BYN/сутки.`,
    `Минимальный срок: ${product.minDays} дн.`,
    product.depositBYN ? `Залог: ${product.depositBYN} BYN.` : null,
    product.deliveryAvailable ? "Есть доставка." : null,
    product.short?.trim() || product.fullDescription?.trim() || null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
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
      images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { region, category, slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  if (!isRegionSlug(region)) {
    notFound();
  }

  const product = await getProductBySlug(decodedSlug);

  if (product?.status !== "approved") {
    notFound();
  }

  const canonicalPath = getProductPath({
    slug: product.slug,
    category: product.category,
    citySlug: product.citySlug,
  });

  if (region !== product.citySlug || category !== product.category) {
    permanentRedirect(canonicalPath);
  }

  const [categoryDoc, city] = await Promise.all([
    getCategoryBySlug(product.category),
    Promise.resolve(getCityBySlug(product.citySlug)),
  ]);

  if (!categoryDoc || !city) {
    notFound();
  }

  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const categoryTitle = categoryDoc.h1?.trim() || categoryDoc.name;
  const titleMain = [product.name, product.brand, product.model]
    .filter(Boolean)
    .join(" ")
    .trim();
  const pageTitle = `${titleMain || product.name} в аренду в ${city.nameIn}`;

  const fullDescription = product.fullDescription?.trim() || "";
  const hasFullDescription = fullDescription.length > 0;
  const hasKitIncluded = (product.kitIncluded?.length ?? 0) > 0;
  const hasSpecifications = (product.specifications?.length ?? 0) > 0;

  const faqItems = buildProductFaq(
    product.name,
    product.city,
    product.pickupAddress,
    product.depositBYN,
    product.faq,
  );

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
        name: city.name,
        item: `${SITE_URL}/${product.citySlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryTitle,
        item: `${SITE_URL}/${product.citySlug}/${product.category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: canonicalUrl,
      },
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: titleMain || product.name,
    description: fullDescription || product.short,
    category: categoryDoc.name,
    image: product.images?.length ? product.images : undefined,
    sku: product._id?.toString(),
    brand: product.brand
      ? {
          "@type": "Brand",
          name: product.brand,
        }
      : undefined,
    model: product.model || undefined,
    additionalProperty: product.specifications?.map((item) => ({
      "@type": "PropertyValue",
      name: item.label,
      value: item.value,
    })),
    offers: {
      "@type": "Offer",
      priceCurrency: "BYN",
      price: product.pricePerDayBYN,
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
      itemCondition: getSchemaCondition(product.condition),
      seller: product.organization
        ? {
            "@type": "Organization",
            name: product.organization,
          }
        : {
            "@type": "Organization",
            name: "Prokatik.by",
          },
    },
  };

  const faqJsonLd = {
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
  };

  const seoDescriptionParagraph = [
    `${titleMain || product.name} — товар из категории «${categoryDoc.name}», доступный для аренды в ${city.nameIn}.`,
    `Стоимость аренды составляет ${product.pricePerDayBYN} BYN в сутки.`,
    `Минимальный срок аренды — ${product.minDays} дн.`,
    product.depositBYN
      ? `Для этого предложения предусмотрен залог ${product.depositBYN} BYN.`
      : "Для этого предложения залог не указан.",
    product.condition
      ? `Состояние товара: ${getConditionLabel(product.condition)}.`
      : null,
    product.deliveryAvailable
      ? "Для этого товара доступна доставка."
      : "Получение товара согласуется по адресу самовывоза.",
    product.pickupAddress
      ? `Самовывоз доступен по адресу: ${product.pickupAddress}.`
      : `Выдача товара осуществляется в городе ${product.city}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />

      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-900">
          Главная
        </Link>
        <span>/</span>
        <Link href={`/${product.citySlug}`} className="hover:text-zinc-900">
          {city.name}
        </Link>
        <span>/</span>
        <Link
          href={`/${product.citySlug}/${product.category}`}
          className="hover:text-zinc-900"
        >
          {categoryTitle}
        </Link>
        <span>/</span>
        <span className="text-zinc-900">{product.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_360px]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <ProductGallery name={product.name} images={product.images} />

              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      Доступно сейчас
                    </span>

                    <Link
                      href={`/${product.citySlug}/${product.category}`}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                    >
                      {categoryDoc.name}
                    </Link>

                    <Link
                      href={`/${product.citySlug}`}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                    >
                      {product.city}
                    </Link>

                    {product.deliveryAvailable ? (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        Есть доставка
                      </span>
                    ) : null}
                  </div>

                  <h1 className="text-2xl font-semibold leading-tight text-zinc-900 sm:text-3xl">
                    {pageTitle}
                  </h1>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-500">
                    {product.brand ? <span>Бренд: {product.brand}</span> : null}
                    {product.model ? <span>Модель: {product.model}</span> : null}
                    {product.condition ? (
                      <span>Состояние: {getConditionLabel(product.condition)}</span>
                    ) : null}
                  </div>

                  {product.organization ? (
                    <p className="mt-2 text-sm text-zinc-500">
                      Организация: {product.organization}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl bg-zinc-50 p-4">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-zinc-900">
                      {product.pricePerDayBYN} BYN
                    </span>
                    <span className="pb-1 text-sm text-zinc-500">/ сутки</span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-600">
                    Минимальный срок аренды: {product.minDays} дн.
                  </p>

                  {!!product.depositBYN && (
                    <p className="mt-1 text-sm text-zinc-600">
                      Залог: {product.depositBYN} BYN
                    </p>
                  )}

                  <p className="mt-1 text-sm text-zinc-600">
                    Состояние: {getConditionLabel(product.condition)}
                  </p>
                </div>

                <div className="rounded-xl border border-border-subtle p-4">
                  <h2 className="mb-2 font-semibold text-zinc-900">
                    Краткое описание
                  </h2>
                  <p className="leading-6 text-zinc-600">{product.short}</p>
                </div>

                <div className="rounded-xl border border-border-subtle p-4">
                  <h2 className="mb-2 font-semibold text-zinc-900">
                    Аренда {titleMain || product.name} в {city.nameIn}
                  </h2>
                  <p className="leading-6 text-zinc-600">
                    {seoDescriptionParagraph}
                  </p>
                </div>

                <div className="rounded-xl border border-border-subtle p-4">
                  <h2 className="mb-3 font-semibold text-zinc-900">
                    Основные условия
                  </h2>

                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-zinc-400">
                        Категория
                      </dt>
                      <dd className="mt-1 text-zinc-800">{categoryDoc.name}</dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase tracking-wide text-zinc-400">
                        Город
                      </dt>
                      <dd className="mt-1 text-zinc-800">{product.city}</dd>
                    </div>

                    {product.brand ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-400">
                          Бренд
                        </dt>
                        <dd className="mt-1 text-zinc-800">{product.brand}</dd>
                      </div>
                    ) : null}

                    {product.model ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-400">
                          Модель
                        </dt>
                        <dd className="mt-1 text-zinc-800">{product.model}</dd>
                      </div>
                    ) : null}

                    <div>
                      <dt className="text-xs uppercase tracking-wide text-zinc-400">
                        Цена за сутки
                      </dt>
                      <dd className="mt-1 text-zinc-800">
                        {product.pricePerDayBYN} BYN
                      </dd>
                    </div>

                    {!!product.depositBYN && (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-400">
                          Залог
                        </dt>
                        <dd className="mt-1 text-zinc-800">
                          {product.depositBYN} BYN
                        </dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-xs uppercase tracking-wide text-zinc-400">
                        Мин. срок аренды
                      </dt>
                      <dd className="mt-1 text-zinc-800">
                        {product.minDays} дн.
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase tracking-wide text-zinc-400">
                        Состояние
                      </dt>
                      <dd className="mt-1 text-zinc-800">
                        {getConditionLabel(product.condition)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase tracking-wide text-zinc-400">
                        Доставка
                      </dt>
                      <dd className="mt-1 text-zinc-800">
                        {product.deliveryAvailable ? "Есть" : "Нет"}
                      </dd>
                    </div>

                    {!!product.organization ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-400">
                          Организация
                        </dt>
                        <dd className="mt-1 text-zinc-800">
                          {product.organization}
                        </dd>
                      </div>
                    ) : null}

                    {product.pickupAddress ? (
                      <div className="sm:col-span-2">
                        <dt className="text-xs uppercase tracking-wide text-zinc-400">
                          Адрес самовывоза
                        </dt>
                        <dd className="mt-1 text-zinc-800">
                          {product.pickupAddress}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {hasFullDescription ? (
            <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-3 text-lg font-semibold text-zinc-900">
                Подробное описание
              </h2>
              <div className="space-y-3 whitespace-pre-line text-sm leading-7 text-zinc-700">
                {fullDescription}
              </div>
            </div>
          ) : null}

          {hasSpecifications ? (
            <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                Характеристики
              </h2>

              <dl className="grid gap-4 sm:grid-cols-2">
                {(product.specifications ?? []).map((item, index) => (
                  <div
                    key={`${item.label}-${item.value}-${index}`}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <dt className="text-xs uppercase tracking-wide text-zinc-400">
                      {item.label}
                    </dt>
                    <dd className="mt-2 text-sm text-zinc-800">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {hasKitIncluded ? (
            <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-3 text-lg font-semibold text-zinc-900">
                Что входит в комплект
              </h2>

              <ul className="grid gap-2 text-sm text-zinc-700">
                {(product.kitIncluded ?? []).map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">
              Как взять в аренду
            </h2>

            <ol className="space-y-2 text-sm text-zinc-700">
              <li>1. Нажмите кнопку бронирования и отправьте заявку.</li>
              <li>2. Согласуйте дату, время и условия получения товара.</li>
              <li>3. Проверьте состояние товара и комплект при выдаче.</li>
              <li>4. Верните товар в согласованный срок.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">
              Что важно знать перед арендой
            </h2>

            <div className="space-y-3 text-sm leading-6 text-zinc-700">
              <p>
                Перед бронированием уточните точное время получения, условия
                возврата, комплектность товара и возможность продления аренды.
              </p>

              <p>
                Проверьте, устраивает ли вас минимальный срок аренды, размер
                залога и способ получения товара: самовывоз или доставка.
              </p>

              <p>
                Аренда особенно удобна, когда товар нужен на короткий срок:
                для ремонта, поездки, мероприятия или разовой бытовой задачи.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Частые вопросы
            </h2>

            <div className="grid gap-4">
              {faqItems.map((item, index) => (
                <div
                  key={`${item.q}-${index}`}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
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
          </div>
        </section>

        <aside className="space-y-4">
          <div className="sticky top-24 rounded-2xl border border-border-subtle bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">
              Тариф аренды
            </h2>

            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-zinc-900">
                {product.pricePerDayBYN} BYN
              </span>
              <span className="pb-1 text-sm text-zinc-500">/ сутки</span>
            </div>

            <p className="mt-3 text-sm text-zinc-600">
              Минимум {product.minDays} дн.
            </p>

            {!!product.depositBYN && (
              <p className="mt-1 text-sm text-zinc-600">
                Залог: {product.depositBYN} BYN
              </p>
            )}

            <p className="mt-1 text-sm text-zinc-700">Город: {product.city}</p>

            <p className="mt-1 text-sm text-zinc-700">
              Состояние: {getConditionLabel(product.condition)}
            </p>

            <p className="mt-1 text-sm text-zinc-700">
              Доставка: {product.deliveryAvailable ? "есть" : "нет"}
            </p>

            {product.pickupAddress && (
              <div className="mt-2">
                <p className="mt-1 text-sm text-zinc-600">Адрес самовывоза:</p>
                <p className="mt-1 text-sm text-zinc-700">
                  {product.pickupAddress}
                </p>
              </div>
            )}

            <div className="mt-5">
              <ProductBookingForm
                productId={product._id!.toString()}
                minDays={product.minDays}
                totalQuantity={product.quantity ?? 1}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-white p-4 text-sm text-zinc-600 shadow-sm">
            <p>Проверяйте комплект и состояние товара при получении.</p>
            <p className="mt-2">
              Детали выдачи, возврата и продления аренды согласуются после
              подтверждения бронирования.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}