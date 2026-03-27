import Link from "next/link";
import { getApprovedProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { HomeCatalogLink } from "@/components/HomeCatalogLink";

export default async function HomePage() {
  const products = await getApprovedProducts({ limit: 6 });

  return (
    <>
      <section className="mb-10 rounded-xl border border-border-subtle bg-gradient-to-r from-accent/30 via-accent/10 to-transparent px-4 py-6 sm:mb-12 sm:px-8 sm:py-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl md:text-5xl">
            Аренда товаров
            <br />
            по Беларуси
          </h1>

          <p className="mt-4 max-w-xl text-sm text-zinc-600 sm:mt-5 sm:text-base">
            Платформа объявлений для аренды товаров по городам Беларуси. Здесь
            можно найти и разместить предложения для дома, ремонта, отдыха,
            мероприятий, техники и других повседневных задач.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <HomeCatalogLink />

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-border-subtle bg-white px-6 py-3 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Разместить объявление
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between sm:mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">
            Новые товары
          </h2>
          <Link
            href="/all"
            className="hidden text-xs font-medium text-accent-strong hover:text-accent sm:inline"
          >
            Смотреть весь каталог
          </Link>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard
              key={p._id?.toString() ?? p.slug}
              name={p.name}
              slug={p.slug}
              images={p.images}
              pricePerDay={p.pricePerDayBYN}
              available
              minDays={p.minDays ?? 1}
              productId={p._id?.toString() || ""}
              ownerPhone={p.ownerPhone}
              pickupAddress={p.pickupAddress}
            />
          ))}
        </div>
      </section>
    </>
  );
}