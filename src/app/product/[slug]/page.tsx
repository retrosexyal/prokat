import { notFound, permanentRedirect } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { getProductPath } from "@/lib/routes";

type Props = { params: Promise<{ slug: string }> };

export default async function LegacyProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));

  if (!product) {
    notFound();
  }

  permanentRedirect(
    getProductPath({
      slug: product.slug,
      category: product.category,
      citySlug: product.citySlug,
    }),
  );
}