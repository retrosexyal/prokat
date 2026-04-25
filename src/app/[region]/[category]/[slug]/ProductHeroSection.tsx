import Link from "next/link";
import { ProductGallery } from "@/components/ProductGallery";
import type { ProductDoc } from "@/types/product";
import { getConditionLabel } from "./utils";
import { PriceBlock } from "@/components/PriceBlock";

type Props = {
  product: ProductDoc;
  categoryName: string;
  cityNameIn: string;
  pageTitle: string;
  titleMain: string;
  seoDescriptionParagraph: string;
};

export function ProductHeroSection({
  product,
  categoryName,
  cityNameIn,
  pageTitle,
  titleMain,
  seoDescriptionParagraph,
}: Props) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-6 lg:items-start lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <ProductGallery name={product.name} images={product.images} />

        <div className="space-y-5">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
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

            <h1 className="text-2xl font-semibold leading-tight text-zinc-900 sm:text-3xl">
              {pageTitle}
            </h1>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-500">
              {product.brand ? <span>Бренд: {product.brand}</span> : null}
              {product.model ? <span>Модель: {product.model}</span> : null}
              {product.condition ? (
                <span>Состояние: {getConditionLabel(product.condition)}</span>
              ) : null}
            </div>

            {product.organization ? (
              <p className="mt-2 text-sm text-zinc-500">
                Организация: {product.organization}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl bg-zinc-50 p-4">
            <PriceBlock
              pricePerDay={product.pricePerDayBYN}
              pricePerWeek={product.pricePerWeekBYN}
              pricePerMonth={product.pricePerMonthBYN}
            />

            <p className="mt-2 text-sm text-zinc-600">
              Минимальный срок аренды: {product.minDays} дн.
            </p>

            {!!product.depositBYN && (
              <p className="mt-1 text-sm text-zinc-600">
                Залог: {product.depositBYN} BYN
              </p>
            )}

            <p className="mt-1 text-sm text-zinc-600">
              Состояние: {getConditionLabel(product.condition)}
            </p>
          </div>

          <div className="rounded-xl border border-border-subtle p-4">
            <h2 className="mb-2 font-semibold text-zinc-900">
              Краткое описание
            </h2>
            <p className="leading-6 text-zinc-600">{product.short}</p>
          </div>

          <div className="rounded-xl border border-border-subtle p-4">
            <h2 className="mb-3 font-semibold text-zinc-900">
              Аренда {titleMain || product.name} в {cityNameIn}
            </h2>
            <p className="leading-6 text-zinc-600">{seoDescriptionParagraph}</p>
          </div>

          <div className="rounded-xl border border-border-subtle p-4">
            <h2 className="mb-3 font-semibold text-zinc-900">
              Основные условия
            </h2>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400">
                  Категория
                </dt>
                <dd className="mt-1 text-zinc-800">{categoryName}</dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400">
                  Город
                </dt>
                <dd className="mt-1 text-zinc-800">{product.city}</dd>
              </div>

              {product.brand ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-400">
                    Бренд
                  </dt>
                  <dd className="mt-1 text-zinc-800">{product.brand}</dd>
                </div>
              ) : null}

              {product.model ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-400">
                    Модель
                  </dt>
                  <dd className="mt-1 text-zinc-800">{product.model}</dd>
                </div>
              ) : null}

              {!!product.depositBYN && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-400">
                    Залог
                  </dt>
                  <dd className="mt-1 text-zinc-800">
                    {product.depositBYN} BYN
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400">
                  Мин. срок аренды
                </dt>
                <dd className="mt-1 text-zinc-800">{product.minDays} дн.</dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400">
                  Состояние
                </dt>
                <dd className="mt-1 text-zinc-800">
                  {getConditionLabel(product.condition)}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400">
                  Доставка
                </dt>
                <dd className="mt-1 text-zinc-800">
                  {product.deliveryAvailable ? "Есть" : "Нет"}
                </dd>
              </div>

              {!!product.organization ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-400">
                    Организация
                  </dt>
                  <dd className="mt-1 text-zinc-800">{product.organization}</dd>
                </div>
              ) : null}

              {product.pickupAddress ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-zinc-400">
                    Адрес самовывоза
                  </dt>
                  <dd className="mt-1 text-zinc-800">
                    {product.pickupAddress}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
