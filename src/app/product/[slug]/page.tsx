import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/products";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const p = await getProductBySlug(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.short} Цена: ${p.pricePerDayBYN} BYN/сутки. Залог: ${p.depositBYN} BYN.`,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      title: p.name,
      description: p.short,
      url: `/product/${p.slug}`,
      images: p.images?.[0] ? [{ url: p.images[0] }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const p = await getProductBySlug(slug);

  if (!p) return notFound();

  // JSON-LD (Product)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.short,
    image: p.images?.length
      ? p.images.map((i) => `https://prokat.net.by${i}`)
      : undefined,
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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        {/* LEFT: image + description */}
        <section className="bg-white rounded-xl border border-border-subtle p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
              <div className="flex-1 flex items-center justify-center bg-zinc-50 rounded-lg border border-dashed border-border-subtle min-h-[220px]">
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="max-h-64 object-contain"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm text-zinc-700">
              <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900">
                {p.name}
              </h1>
              <p className="text-zinc-600">{p.short}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Минимальный срок аренды: {p.minDays} дн.</li>
                <li>Залог: {p.depositBYN} BYN</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">
              Как взять в аренду
            </h2>
            <ol className="list-decimal list-inside text-sm text-zinc-700 space-y-1">
              <li>Пишите в Telegram/WhatsApp, бронируем дату.</li>
              <li>При выдаче: документ, залог и фотофиксация состояния.</li>
              <li>Возврат и проверка, расходники оплачиваются отдельно.</li>
            </ol>
          </div>
        </section>

        {/* RIGHT: price block */}
        <aside className="space-y-3">
          <div className="bg-white rounded-xl border border-border-subtle p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">
              Тариф аренды
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900">
                {p.pricePerDayBYN} BYN
              </span>
              <span className="text-sm text-zinc-500">/ сутки</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Минимум {p.minDays} день • залог {p.depositBYN} BYN
            </p>

            <button className="mt-4 w-full rounded-full bg-accent-strong px-4 py-2.5 text-sm font-semibold text-black hover:bg-accent">
              Забронировать в мессенджере
            </button>
          </div>

          <div className="bg-white rounded-xl border border-border-subtle p-4 text-xs text-zinc-600 space-y-1">
            <p>Вещи страхуем от кражи и повреждений.</p>
            <p>Адрес и условия пришлём при подтверждении заказа.</p>
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
