import Link from "next/link";
import { getApprovedProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export default async function HomePage() {
  const products = await getApprovedProducts();
  return (
    <>
      {/* HERO */}
      <section className="mb-10 sm:mb-12 rounded-xl bg-gradient-to-r from-accent/30 via-accent/10 to-transparent px-4 py-6 sm:px-8 sm:py-8 border border-border-subtle">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-zinc-900">
            Прокат строительной техники
            <br />и бытовых товаров в Могилёве
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-zinc-600 max-w-xl">
            Инструменты, уборочная техника и полезные вещи для ремонта и быта.
            Без залога, с понятными условиями и быстрой выдачей.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-3 text-sm font-semibold text-black hover:bg-accent"
            >
              Открыть каталог
            </Link>
            <Link
              href="/terms"
              className="inline-flex items-center justify-center rounded-full border border-border-subtle bg-white px-6 py-3 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Условия аренды
            </Link>
          </div>
        </div>
      </section>

      {/* POPULAR */}
      <section>
        <div className="flex items-baseline justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900">
            Популярные товары
          </h2>
          <Link
            href="/catalog"
            className="hidden sm:inline text-xs font-medium text-accent-strong hover:text-accent"
          >
            Смотреть весь каталог
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 items-stretch">
          {products.slice(0, 6).map((p) => (
            <ProductCard
              key={p._id?.toString() ?? p.slug}
              name={p.name}
              slug={p.slug}
              images={p.images}
              pricePerDay={p.pricePerDayBYN}
              available
              minDays={1}
              productId={p._id?.toString() || ""}
            />
          ))}
        </div>
      </section>

      {/* HOW */}
      <section className="mt-14 sm:mt-16">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-zinc-900">
          Как это работает
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
          {[
            "Выбираете товар и дату аренды",
            "Бронируем и подтверждаем условия",
            "Получаем товар",
            "Возвращаете вовремя и без штрафов",
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white border border-border-subtle rounded-lg px-3 py-3 sm:px-4 sm:py-4"
            >
              <div className="text-accent-strong font-semibold mb-1 sm:mb-2">
                {i + 1}
              </div>
              <p className="text-zinc-700">{s}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
