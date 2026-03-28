import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/categories";
import { getCityBySlug, isRegionSlug } from "@/lib/cities";
import { getProductPath } from "@/lib/routes";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductBookingForm } from "@/components/ProductBookingForm";
import { getApprovedProducts } from "@/lib/products";

type Props = {
  params: Promise<{
    region: string;
    category: string;
    slug: string;
  }>;
};

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

  if (!product) {
    return {};
  }

  const canonical = getProductPath({
    slug: product.slug,
    category: product.category,
    citySlug: product.citySlug,
  });

  return {
    title: product.name,
    description: `${product.short} Цена: ${product.pricePerDayBYN} BYN/сутки.`,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description: product.short,
      url: canonical,
      images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
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

  if (!product) {
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

  const canonicalUrl = `https://prokatik.by${canonicalPath}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short,
    image: product.images?.length ? product.images : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BYN",
      price: product.pricePerDayBYN,
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
    },
  };

  return (
    <>
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
          {categoryDoc.name}
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
                  </div>

                  <h1 className="text-2xl font-semibold leading-tight text-zinc-900 sm:text-3xl">
                    {product.name}
                  </h1>

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
                </div>

                <div className="space-y-3 text-sm text-zinc-700">
                  <div className="rounded-xl border border-border-subtle p-4">
                    <h2 className="mb-2 font-semibold text-zinc-900">
                      Описание
                    </h2>
                    <p className="leading-6 text-zinc-600">{product.short}</p>
                  </div>

                  <div className="rounded-xl border border-border-subtle p-4">
                    <h2 className="mb-3 font-semibold text-zinc-900">
                      Характеристики
                    </h2>
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-400">
                          Категория
                        </dt>
                        <dd className="mt-1 text-zinc-800">
                          {categoryDoc.name}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-400">
                          Город
                        </dt>
                        <dd className="mt-1 text-zinc-800">{product.city}</dd>
                      </div>

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
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">
              Как взять в аренду
            </h2>
            <ol className="space-y-2 text-sm text-zinc-700">
              <li>1. Нажмите кнопку забронировать.</li>
              <li>2. Согласуем дату, время и условия получения.</li>
              <li>3. При выдаче потребуется паспорт.</li>
              <li>4. После возврата проверяем состояние товара.</li>
            </ol>
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

            <p className="mt-1 text-m text-zinc-700">Город: {product.city}</p>

            {product.pickupAddress && (
              <div className="mt-2">
                <p className="mt-1 text-sm text-zinc-600">Адрес самовывоза:</p>
                <p className="mt-1 text-m text-zinc-700">
                  {product.pickupAddress}
                </p>
              </div>
            )}

            <div className="mt-5">
              <ProductBookingForm
                productId={product._id!.toString()}
                minDays={product.minDays}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-white p-4 text-sm text-zinc-600 shadow-sm">
            <p>Проверяем товар перед выдачей и после возврата.</p>
            <p className="mt-2">
              Адрес, время и детали получения согласуем после подтверждения.
            </p>
          </div>
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
