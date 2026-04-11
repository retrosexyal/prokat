import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    /* toDo убрать потом */
    /* rules: [{ userAgent: "*", allow: "/" }], */
    rules: [{ userAgent: "*", disallow: "/" }],
    sitemap: "https://prokatik.by/sitemap.xml",
  };
}