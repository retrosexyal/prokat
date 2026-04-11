import type { Metadata } from "next";
import type { CategoryDoc } from "@/types/category";
import type { CityItem } from "@/lib/cities";
import type { ProductDoc, ProductFaqItem } from "@/types/product";
import { getProductPath } from "@/lib/routes";
import { getSchemaCondition } from "./utils";
import { getSiteUrl } from "@/lib/site-url";

export const SITE_URL = getSiteUrl();

export function buildProductMetadata(params: {
  product: ProductDoc;
  categoryDoc: CategoryDoc | null;
  city: CityItem | undefined;
}): Metadata {
  const { product, categoryDoc, city } = params;

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

export function buildBreadcrumbJsonLd(params: {
  cityName: string;
  citySlug: string;
  categoryTitle: string;
  categorySlug: string;
  productName: string;
  canonicalUrl: string;
}) {
  const {
    cityName,
    citySlug,
    categoryTitle,
    categorySlug,
    productName,
    canonicalUrl,
  } = params;

  return {
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
        name: cityName,
        item: `${SITE_URL}/${citySlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryTitle,
        item: `${SITE_URL}/${citySlug}/${categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: productName,
        item: canonicalUrl,
      },
    ],
  };
}

export function buildProductJsonLd(params: {
  product: ProductDoc;
  categoryName: string;
  canonicalUrl: string;
  titleMain: string;
  fullDescription: string;
}) {
  const { product, categoryName, canonicalUrl, titleMain, fullDescription } =
    params;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: titleMain || product.name,
    description: fullDescription || product.short,
    category: categoryName,
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
}

export function buildFaqJsonLd(faqItems: ProductFaqItem[]) {
  return {
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
}
