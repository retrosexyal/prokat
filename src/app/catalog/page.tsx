import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";

export default function CatalogPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-8">Каталог товаров</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            name={p.name}
            slug={p.slug}
            image={p.images[0]}
            pricePerDay={p.pricePerDayBYN}
            available={true}
          />
        ))}
      </div>
    </div>
  );
}
