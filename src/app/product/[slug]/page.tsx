import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { products } from "@/data/products";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const p = products.find((x) => x.slug === slug);
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

  const p = products.find((x) => x.slug === slug);

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
    <main>
      <h1>{p.name}</h1>
      <p>{p.short}</p>
      <p>
        <b>{p.pricePerDayBYN} BYN</b> / сутки • минимум {p.minDays} день • залог{" "}
        {p.depositBYN} BYN
      </p>

      <h2>Как взять в аренду</h2>
      <ol>
        <li>Пишите в Telegram/WhatsApp, бронируем дату.</li>
        <li>При выдаче: документ + залог + фотофиксация.</li>
        <li>Возврат и проверка. Расходники оплачиваются отдельно.</li>
      </ol>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
