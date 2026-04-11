import type { CategoryDoc } from "@/types/category";
import type { CityItem } from "@/lib/cities";
import type { ProductDoc } from "@/types/product";

export type ProductPageParams = {
  region: string;
  category: string;
  slug: string;
};

export type ProductPageProps = {
  params: Promise<ProductPageParams>;
};

export type ProductPageResolvedData = {
  product: ProductDoc;
  categoryDoc: CategoryDoc;
  city: CityItem;
  canonicalPath: string;
  canonicalUrl: string;
  categoryTitle: string;
  titleMain: string;
  pageTitle: string;
  fullDescription: string;
};