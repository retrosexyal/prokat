import type { MetadataRoute } from "next";
import { products } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://prokat.net.by";
  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/catalog`, lastModified: new Date() },
    { url: `${base}/terms`, lastModified: new Date() },
    { url: `${base}/contacts`, lastModified: new Date() },
    ...products.map(p => ({ url: `${base}/product/${p.slug}`, lastModified: new Date() })),
  ];
}
