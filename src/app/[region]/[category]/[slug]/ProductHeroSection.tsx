import Link from "next/link";
import { ProductGallery } from "@/components/ProductGallery";
import type { ProductDoc } from "@/types/product";
import { getConditionLabel, isMeaningfulBrand } from "./utils";

type Props = {
  product: ProductDoc;
  categoryName: string;
  pageTitle: string;
};

function FactItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border-t border-zinc-100 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium leading-5 text-zinc-800">
        {value}
      </dd>
    </div>
  );
}

export function ProductHeroSection({
  product,
  categoryName,
  pageTitle,
}: Props) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-start">
        <div className="min-w-0">
          <ProductGallery name={product.name} images={product.images} />
        </div>

        <div className="min-w-0">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Доступно сейчас
              </span>

              <Link
                href={`/${product.citySlug}/${product.category}`}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
              >
                {categoryName}
              </Link>

              <Link
                href={`/${product.citySlug}`}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
              >
                {product.city}
              </Link>

              {product.deliveryAvailable ? (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  Есть доставка
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl font-semibold leading-tight text-zinc-900 sm:text-4xl">
              {pageTitle}
            </h1>

            <p className="mt-4 text-base leading-7 text-zinc-600">
              {product.short}
            </p>
          </div>

          <dl className="mt-6 grid gap-x-6 sm:grid-cols-2">
            <FactItem label="Цена" value={`от ${product.pricePerDayBYN} BYN / сутки`} />

            <FactItem label="Минимальный срок" value={`${product.minDays} дн.`} />

            {isMeaningfulBrand(product.brand) ? (
              <FactItem label="Бренд" value={product.brand} />
            ) : null}

            {product.model ? <FactItem label="Модель" value={product.model} /> : null}

            <FactItem
              label="Состояние"
              value={getConditionLabel(product.condition)}
            />

            <FactItem
              label="Доставка"
              value={product.deliveryAvailable ? "Есть" : "Нет"}
            />

            {!!product.depositBYN ? (
              <FactItem label="Залог" value={`${product.depositBYN} BYN`} />
            ) : null}

            {product.pickupAddress ? (
              <FactItem
                label="Самовывоз"
                value={product.pickupAddress}
              />
            ) : null}
          </dl>

          {product.organization ? (
            <p className="mt-4 text-sm text-zinc-500">
              Владелец: {product.organization}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
