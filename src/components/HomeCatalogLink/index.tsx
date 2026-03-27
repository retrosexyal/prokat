import Link from "next/link";
import { getRequestCity } from "@/lib/request-city";

export async function HomeCatalogLink() {
  const city = await getRequestCity();

  return (
    <Link
      href={`/${city.slug}`}
      className="inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-3 text-sm font-semibold text-black hover:bg-accent"
    >
      Открыть каталог
    </Link>
  );
}