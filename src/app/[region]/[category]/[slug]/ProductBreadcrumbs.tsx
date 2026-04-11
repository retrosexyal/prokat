import Link from "next/link";

type Props = {
  cityName: string;
  citySlug: string;
  categoryTitle: string;
  categorySlug: string;
  productName: string;
};

export function ProductBreadcrumbs({
  cityName,
  citySlug,
  categoryTitle,
  categorySlug,
  productName,
}: Props) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
      <Link href="/" className="hover:text-zinc-900">
        Главная
      </Link>
      <span>/</span>
      <Link href={`/${citySlug}`} className="hover:text-zinc-900">
        {cityName}
      </Link>
      <span>/</span>
      <Link
        href={`/${citySlug}/${categorySlug}`}
        className="hover:text-zinc-900"
      >
        {categoryTitle}
      </Link>
      <span>/</span>
      <span className="text-zinc-900">{productName}</span>
    </nav>
  );
}