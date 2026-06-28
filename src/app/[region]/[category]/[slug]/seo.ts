import type { Metadata } from "next";
import type { CategoryDoc } from "@/types/category";
import type { CityItem } from "@/lib/cities";
import type { ProductDoc, ProductFaqItem } from "@/types/product";
import { getProductPath } from "@/lib/routes";
import {
  createCategorySeoTemplateContext,
  resolveCategorySeoArray,
} from "@/lib/category-seo";
import {
  buildProductTitleMain,
  getSchemaCondition,
  isMeaningfulBrand,
} from "./utils";
import { getSiteUrl } from "@/lib/site-url";

export const SITE_URL = getSiteUrl();

function getSeoPhrases(
  categoryDoc: CategoryDoc | null,
  city: CityItem | undefined,
): string[] {
  if (!categoryDoc) {
    return [];
  }

  if (!city) {
    return (categoryDoc.synonyms ?? [])
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  return resolveCategorySeoArray(
    categoryDoc.synonyms,
    createCategorySeoTemplateContext({
      categoryName: categoryDoc.name,
      city,
      isAllRegion: false,
    }),
  ).slice(0, 4);
}

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
  const seoPhrases = getSeoPhrases(categoryDoc, city);
  const cityNameIn = city?.nameIn ?? product.city;
  const titleBase = buildProductTitleMain(product);
  const title = `${titleBase} в аренду и напрокат в ${cityNameIn} | Prokatik.by`;

  const description = [
    `${product.name} в аренду и напрокат в ${cityNameIn}.`,
    `Цена: ${product.pricePerDayBYN} BYN/сутки.`,
    `Минимальный срок: ${product.minDays} дн.`,
    isMeaningfulBrand(product.brand) ? `Бренд: ${product.brand}.` : null,
    product.model ? `Модель: ${product.model}.` : null,
    `Категория: ${categoryName}.`,
    product.depositBYN ? `Залог: ${product.depositBYN} BYN.` : null,
    product.deliveryAvailable ? "Есть доставка." : null,
    seoPhrases.length ? `Также ищут: ${seoPhrases.join(", ")}.` : null,
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
      areaServed: product.city
        ? {
            "@type": "City",
            name: product.city,
          }
        : undefined,
      availableAtOrFrom: product.pickupAddress
        ? {
            "@type": "Place",
            name: product.city,
            address: product.pickupAddress,
          }
        : undefined,
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
