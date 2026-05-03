import type { MetadataRoute } from "next";
import { CITIES } from "@/lib/cities";
import { getAllCategories } from "@/lib/categories";
import { getApprovedProducts } from "@/lib/products";
import { getProductPath } from "@/lib/routes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://prokatik.by";
  const now = new Date();

  const [categories, products] = await Promise.all([
    getAllCategories(),
    getApprovedProducts(),
  ]);

  const indexableCategories = categories.filter(
    (category) =>
      category.isActive &&
      category.indexingMode === "index" &&
      typeof category.slug === "string" &&
      category.slug.length > 0,
  );

  const regionCities = CITIES.filter((city) => city.slug !== "all");

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/all`, lastModified: now },
    { url: `${base}/terms`, lastModified: now },
    { url: `${base}/rules`, lastModified: now },
    { url: `${base}/agreement`, lastModified: now },
    { url: `${base}/privacy`, lastModified: now },
  ];

  const regionPages: MetadataRoute.Sitemap = [
    { url: `${base}/all`, lastModified: now },
    ...regionCities.map((city) => ({
      url: `${base}/${city.slug}`,
      lastModified: now,
    })),
  ];

  const categoryPages: MetadataRoute.Sitemap = [
    ...indexableCategories.map((category) => ({
      url: `${base}/all/${category.slug}`,
      lastModified: category.updatedAt ?? now,
    })),
    ...regionCities.flatMap((city) =>
      indexableCategories.map((category) => ({
        url: `${base}/${city.slug}/${category.slug}`,
        lastModified: category.updatedAt ?? now,
      })),
    ),
  ];

  const productPages: MetadataRoute.Sitemap = products.flatMap((product) => {
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
        url: `${base}${getProductPath({
          slug: product.slug,
          category: product.category,
          citySlug: product.citySlug,
        })}`,
        lastModified: product.updatedAt ?? now,
      },
    ];
  });

  return [...staticPages, ...regionPages, ...categoryPages, ...productPages];
}