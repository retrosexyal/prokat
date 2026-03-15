import { ProductCard } from "@/components/ProductCard";
import { getApprovedProducts } from "@/lib/products";

export default async function CatalogPage() {
  const products = await getApprovedProducts();
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* SIDEBAR (desktop-like filters imitation) */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="bg-white rounded-xl border border-border-subtle p-4 text-sm">
          <h2 className="font-semibold mb-3 text-zinc-900">Фильтры</h2>
          <div className="space-y-3 text-xs text-zinc-600">
            <div>
              <div className="font-medium text-zinc-800 mb-1">Категории</div>
              <ul className="space-y-1">
                <li>Строительные инструменты</li>
                <li>Уборочная техника</li>
                <li>Бытовая техника</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-zinc-800 mb-1">Наличие</div>
              <p>Показываем только доступные сейчас</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN LIST */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900">
            Каталог товаров
          </h1>
          <div className="text-xs sm:text-sm text-zinc-500">
            Найдено: {products.length} позиций
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard
              key={p._id?.toString() ?? p.slug}
              name={p.name}
              slug={p.slug}
              images={p.images}
              pricePerDay={p.pricePerDayBYN}
              available={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
