import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import type { ApprovedProductWithAvailability } from "@/lib/products";

type Props = {
  title: string;
  description: string;
  products: ApprovedProductWithAvailability[];
  emptyText?: string;
  moreHref?: string;
  moreLabel?: string;
};

export function RelatedProductsSection({
  title,
  description,
  products,
  emptyText,
  moreHref,
  moreLabel,
}: Props) {
  if (products.length === 0 && !emptyText) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
            {description}
          </p>
        </div>

        {moreHref && moreLabel ? (
          <Link
            href={moreHref}
            className="inline-flex items-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            {moreLabel}
          </Link>
        ) : null}
      </div>

      {products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((item) => (
            <ProductCard
              key={item._id?.toString() ?? item.slug}
              productId={item._id!.toString()}
              name={item.name}
              slug={item.slug}
              category={item.category}
              citySlug={item.citySlug}
              images={item.images}
              pricePerDay={item.pricePerDayBYN}
              minDays={item.minDays}
              available={item.isAvailableNow}
              ownerPhone={item.ownerPhone}
              pickupAddress={item.pickupAddress}
              ratingBoost={item.ratingBoost}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-zinc-600">
          {emptyText ?? "Пока нет дополнительных товаров для показа."}
        </p>
      )}
    </section>
  );
}