import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/products";
import { ProductGallery } from "@/components/ProductGallery";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const p = await getProductBySlug(slug);
  if (!p) return {};

  return {
    title: p.name,
    description: `${p.short} Цена: ${p.pricePerDayBYN} BYN/сутки.`,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      title: p.name,
      description: p.short,
      url: `/product/${p.slug}`,
      images: p.images?.[0] ? [{ url: p.images[0] }] : undefined,
    },
  };
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "instrument":
      return "Инструменты";
    case "ladder":
      return "Лестницы";
    case "level":
      return "Уровни";
    case "vacuum":
      return "Пылесосы";
    default:
      return "Другое";
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);

  if (!p) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.short,
    image: p.images?.length ? p.images : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BYN",
      price: p.pricePerDayBYN,
      availability: "https://schema.org/InStock",
      url: `https://prokat.net.by/product/${p.slug}`,
    },
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_360px]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <ProductGallery name={p.name} images={p.images} />

              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      Доступно сейчас
                    </span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                      {getCategoryLabel(p.category)}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                      {p.city}
                    </span>
                  </div>

                  <h1 className="text-2xl font-semibold leading-tight text-zinc-900 sm:text-3xl">
                    {p.name}
                  </h1>

                  {p.organization ? (
                    <p className="mt-2 text-sm text-zinc-500">
                      Организация: {p.organization}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl bg-zinc-50 p-4">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-zinc-900">
                      {p.pricePerDayBYN} BYN
                    </span>
                    <span className="pb-1 text-sm text-zinc-500">/ сутки</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    Минимальный срок аренды: {p.minDays} дн.
                  </p>
                  {/* <p className="mt-1 text-sm text-zinc-600">
                    Залог: {p.depositBYN} BYN
                  </p> */}
                </div>

                <div className="space-y-3 text-sm text-zinc-700">
                  <div className="rounded-xl border border-border-subtle p-4">
                    <h2 className="mb-2 font-semibold text-zinc-900">
                      Описание
                    </h2>
                    <p className="leading-6 text-zinc-600">{p.short}</p>
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
                          {getCategoryLabel(p.category)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-400">
                          Город
                        </dt>
                        <dd className="mt-1 text-zinc-800">{p.city}</dd>
                      </div>

                      <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-400">
                          Цена за сутки
                        </dt>
                        <dd className="mt-1 text-zinc-800">
                          {p.pricePerDayBYN} BYN
                        </dd>
                      </div>

                      {/* <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-400">
                          Залог
                        </dt>
                        <dd className="mt-1 text-zinc-800">
                          {p.depositBYN} BYN
                        </dd>
                      </div> */}

                      <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-400">
                          Мин. срок аренды
                        </dt>
                        <dd className="mt-1 text-zinc-800">{p.minDays} дн.</dd>
                      </div>

                      {p.organization ? (
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-zinc-400">
                            Организация
                          </dt>
                          <dd className="mt-1 text-zinc-800">
                            {p.organization}
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
                {p.pricePerDayBYN} BYN
              </span>
              <span className="pb-1 text-sm text-zinc-500">/ сутки</span>
            </div>

            <p className="mt-3 text-sm text-zinc-600">
              Минимум {p.minDays} дн.
            </p>
            {/* <p className="mt-1 text-sm text-zinc-600">
              Залог: {p.depositBYN} BYN
            </p> */}
            <p className="mt-1 text-sm text-zinc-600">Город: {p.city}</p>

            <button className="mt-5 w-full rounded-full bg-accent-strong px-4 py-3 text-sm font-semibold text-black transition hover:bg-accent">
              Забронировать
            </button>
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
