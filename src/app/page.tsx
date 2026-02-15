import Link from "next/link";
import { products } from "@/data/products";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="mb-20">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Прокат товаров <br />
          <span className="text-accent">без залога</span> в Могилёве
        </h1>

        <p className="mt-6 text-muted max-w-xl">
          Инструменты и полезные вещи для ремонта и быта.
          Оплата сразу, понятные правила, без скрытых условий.
        </p>

        <div className="mt-8 flex gap-4">
          <Link
            href="/catalog"
            className="bg-accent text-black px-6 py-3 rounded-md font-medium"
          >
            Открыть каталог
          </Link>
          <Link
            href="/terms"
            className="border border-white/20 px-6 py-3 rounded-md"
          >
            Условия аренды
          </Link>
        </div>
      </section>

      {/* POPULAR */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">
          Популярные товары
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map(p => (
            <div
              key={p.id}
              className="bg-card border border-white/10 rounded-lg p-5 hover:border-accent/50 transition"
            >
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-muted mt-2">{p.short}</p>

              <div className="mt-4">
                <span className="text-lg font-semibold">
                  {p.pricePerDayBYN} BYN
                </span>
                <span className="text-sm text-muted"> / сутки</span>
              </div>

              <Link
                href={`/product/${p.slug}`}
                className="inline-block mt-4 text-accent text-sm"
              >
                Подробнее →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section className="mt-24">
        <h2 className="text-2xl font-semibold mb-6">Как это работает</h2>
        <div className="grid md:grid-cols-4 gap-6 text-sm">
          {[
            "Выбираете товар",
            "Оплачиваете сразу",
            "Пользуетесь",
            "Возвращаете вовремя",
          ].map((s, i) => (
            <div
              key={i}
              className="bg-card border border-white/10 rounded-lg p-5"
            >
              <div className="text-accent font-semibold mb-2">
                {i + 1}.
              </div>
              {s}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
