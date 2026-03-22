import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getApprovedProductsWithAvailability } from "@/lib/products";
import { getAllCategories } from "@/lib/categories";

type CatalogPageProps = {
  searchParams?: Promise<{
    category?: string;
    page?: string;
    q?: string;
  }>;
};

const PRODUCTS_PER_PAGE = 12;

export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedSearchParams = await searchParams;

  const selectedCategory = resolvedSearchParams?.category?.trim() ?? "";
  const currentPage = Math.max(
    Number(resolvedSearchParams?.page ?? "1") || 1,
    1,
  );
  const search = resolvedSearchParams?.q ?? "";

  const [
    { products, totalProducts, totalPages, currentPage: safePage },
    categories,
  ] = await Promise.all([
    getApprovedProductsWithAvailability({
      category: selectedCategory || undefined,
      page: currentPage,
      limit: PRODUCTS_PER_PAGE,
      search
    }),
    getAllCategories(),
  ]);

  const paginatedProducts = products;

  const activeCategoryName =
    categories.find((item) => item.slug === selectedCategory)?.name ?? "";

  function buildCatalogHref(params: { category?: string; page?: number }) {
    const query = new URLSearchParams();

    if (params.category) {
      query.set("category", params.category);
    }

    if (params.page && params.page > 1) {
      query.set("page", String(params.page));
    }

    const queryString = query.toString();

    return queryString ? `/catalog?${queryString}` : "/catalog";
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* MOBILE CATEGORIES */}
      <div className="lg:hidden">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Категории</h2>

            {selectedCategory ? (
              <Link
                href={buildCatalogHref({ page: 1 })}
                className="shrink-0 text-xs font-medium text-zinc-500 underline-offset-2 hover:underline"
              >
                Сбросить
              </Link>
            ) : null}
          </div>

          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex gap-2 px-1">
              <Link
                href={buildCatalogHref({ page: 1 })}
                className={`flex min-h-[52px] shrink-0 items-center rounded-2xl px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                  !selectedCategory
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700"
                }`}
              >
                Все
              </Link>

              {categories.map((category) => {
                const isActive = selectedCategory === category.slug;

                return (
                  <Link
                    key={category._id?.toString() ?? category.slug}
                    href={buildCatalogHref({
                      category: category.slug,
                      page: 1,
                    })}
                    className={`flex min-h-[52px] max-w-[220px] shrink-0 items-center rounded-2xl px-4 py-3 text-sm leading-5 transition ${
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 bg-white text-zinc-700"
                    }`}
                  >
                    <span className="line-clamp-2 break-words">
                      {category.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:block lg:w-72 lg:shrink-0">
        <div className="sticky top-4 rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-900">Категории</h2>

            {selectedCategory ? (
              <Link
                href={buildCatalogHref({ page: 1 })}
                className="shrink-0 text-xs font-medium text-zinc-500 underline-offset-2 hover:underline"
              >
                Сбросить
              </Link>
            ) : null}
          </div>

          <div className="max-h-[75vh] overflow-y-auto p-4">
            <nav className="flex flex-col gap-2">
              <Link
                href={buildCatalogHref({ page: 1 })}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  !selectedCategory
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Все категории
              </Link>

              {categories.map((category) => {
                const isActive = selectedCategory === category.slug;

                return (
                  <Link
                    key={category._id?.toString() ?? category.slug}
                    href={buildCatalogHref({
                      category: category.slug,
                      page: 1,
                    })}
                    className={`rounded-xl px-4 py-3 text-sm leading-5 transition ${
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {category.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <section className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
                Каталог товаров
              </h1>

              {selectedCategory ? (
                <p className="mt-1 text-sm text-zinc-500">
                  Категория: {activeCategoryName || selectedCategory}
                </p>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">
                  Все доступные товары
                </p>
              )}
            </div>

            <div className="text-sm text-zinc-500">
              Найдено: {totalProducts} позиций
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          {paginatedProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
              <p className="text-sm text-zinc-600">
                В этой категории пока нет товаров
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product._id?.toString() ?? product.slug}
                  name={product.name}
                  slug={product.slug}
                  images={product.images}
                  pricePerDay={product.pricePerDayBYN}
                  available={product.isAvailableNow}
                  minDays={product.minDays ?? 1}
                  productId={product._id?.toString() || ""}
                  pickupAddress={product.pickupAddress}
                  ownerPhone={product.ownerPhone || ""}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-500">
              Страница {safePage} из {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={buildCatalogHref({
                  category: selectedCategory || undefined,
                  page: Math.max(safePage - 1, 1),
                })}
                aria-disabled={safePage <= 1}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  safePage <= 1
                    ? "pointer-events-none border border-zinc-200 bg-zinc-100 text-zinc-400"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Назад
              </Link>

              <div className="hidden items-center gap-2 sm:flex">
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .slice(
                    Math.max(0, safePage - 3),
                    Math.min(totalPages, safePage + 2),
                  )
                  .map((pageNumber) => {
                    const isActive = pageNumber === safePage;

                    return (
                      <Link
                        key={pageNumber}
                        href={buildCatalogHref({
                          category: selectedCategory || undefined,
                          page: pageNumber,
                        })}
                        className={`flex h-10 min-w-[40px] items-center justify-center rounded-xl px-3 text-sm font-medium transition ${
                          isActive
                            ? "bg-zinc-900 text-white"
                            : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {pageNumber}
                      </Link>
                    );
                  })}
              </div>

              <Link
                href={buildCatalogHref({
                  category: selectedCategory || undefined,
                  page: Math.min(safePage + 1, totalPages),
                })}
                aria-disabled={safePage >= totalPages}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  safePage >= totalPages
                    ? "pointer-events-none border border-zinc-200 bg-zinc-100 text-zinc-400"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Вперёд
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
