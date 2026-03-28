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

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/all`, lastModified: now },
    { url: `${base}/terms`, lastModified: now },
    { url: `${base}/rules`, lastModified: now },
    { url: `${base}/agreement`, lastModified: now },
    { url: `${base}/dashboard`, lastModified: now },
  ];

  const regionPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${base}/${city.slug}`,
    lastModified: now,
  }));

  const categoryPages: MetadataRoute.Sitemap = CITIES.flatMap((city) =>
    categories.map((category) => ({
      url: `${base}/${city.slug}/${category.slug}`,
      lastModified: now,
    })),
  );

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}${getProductPath({
      slug: product.slug,
      category: product.category,
      citySlug: product.citySlug,
    })}`,
    lastModified: product.updatedAt ?? now,
  }));

  return [...staticPages, ...regionPages, ...categoryPages, ...productPages];
}