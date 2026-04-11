import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getApprovedProducts, getProductBySlug } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/categories";
import { getCityBySlug, isRegionSlug } from "@/lib/cities";
import { getProductPath } from "@/lib/routes";
import { ProductBreadcrumbs } from "./ProductBreadcrumbs";
import { ProductHeroSection } from "./ProductHeroSection";
import { ProductContentSections } from "./ProductContentSections";
import { ProductSidebar } from "./ProductSidebar";
import { ProductMobileBookingBar } from "./ProductMobileBookingBar";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildProductJsonLd,
  buildProductMetadata,
  SITE_URL,
} from "./seo";
import { buildProductFaq, buildSeoDescriptionParagraph } from "./utils";
import type { ProductPageProps } from "./types";

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

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));

  if (product?.status !== "approved") {
    return {};
  }

  const [categoryDoc, city] = await Promise.all([
    getCategoryBySlug(product.category),
    Promise.resolve(getCityBySlug(product.citySlug)),
  ]);

  return buildProductMetadata({
    product,
    categoryDoc,
    city,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
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

  const faqItems = buildProductFaq(
    product.name,
    product.city,
    product.pickupAddress,
    product.depositBYN,
    product.faq,
  );

  const seoDescriptionParagraph = buildSeoDescriptionParagraph({
    titleMain,
    productName: product.name,
    categoryName: categoryDoc.name,
    cityNameIn: city.nameIn,
    cityName: product.city,
    pricePerDayBYN: product.pricePerDayBYN,
    minDays: product.minDays,
    depositBYN: product.depositBYN,
    condition: product.condition,
    deliveryAvailable: product.deliveryAvailable,
    pickupAddress: product.pickupAddress,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd({
    cityName: city.name,
    citySlug: product.citySlug,
    categoryTitle,
    categorySlug: product.category,
    productName: product.name,
    canonicalUrl,
  });

  const productJsonLd = buildProductJsonLd({
    product,
    categoryName: categoryDoc.name,
    canonicalUrl,
    titleMain,
    fullDescription,
  });

  const faqJsonLd = buildFaqJsonLd(faqItems);

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

      <div className="pb-24 md:pb-0">
        <ProductBreadcrumbs
          cityName={city.name}
          citySlug={product.citySlug}
          categoryTitle={categoryTitle}
          categorySlug={product.category}
          productName={product.name}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_360px]">
          <section className="space-y-6">
            <ProductHeroSection
              product={product}
              categoryName={categoryDoc.name}
              cityNameIn={city.nameIn}
              pageTitle={pageTitle}
              titleMain={titleMain}
              seoDescriptionParagraph={seoDescriptionParagraph}
            />

            <ProductContentSections
              product={product}
              fullDescription={fullDescription}
              faqItems={faqItems}
            />
          </section>

          <ProductSidebar product={product} />
        </div>
      </div>

      <ProductMobileBookingBar
        productId={product._id!.toString()}
        minDays={product.minDays}
        totalQuantity={product.quantity ?? 1}
        pricePerDayBYN={product.pricePerDayBYN}
        productName={product.name}
      />
    </>
  );
}