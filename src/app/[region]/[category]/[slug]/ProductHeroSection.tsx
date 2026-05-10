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

function DetailItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-zinc-800 sm:text-base">
        {value}
      </dd>
    </div>
  );
}

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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="min-w-0">
          <ProductGallery name={product.name} images={product.images} />
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
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

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
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

          <div className="rounded-2xl bg-zinc-50 p-4">
            <PriceBlock
              pricePerDay={product.pricePerDayBYN}
              pricePerWeek={product.pricePerWeekBYN}
              pricePerMonth={product.pricePerMonthBYN}
            />

            <div className="mt-4 space-y-1 text-sm text-zinc-600">
              <p>Минимальный срок аренды: {product.minDays} дн.</p>

              {!!product.depositBYN ? (
                <p>Залог: {product.depositBYN} BYN</p>
              ) : null}

              <p>Состояние: {getConditionLabel(product.condition)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle p-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Краткое описание
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {product.short}
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-border-subtle p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            Аренда {titleMain || product.name} в {cityNameIn}
          </h2>

          <p className="mt-3 leading-7 text-zinc-600">
            {seoDescriptionParagraph}
          </p>
        </section>

        <section className="rounded-2xl border border-border-subtle p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            Основные условия
          </h2>

          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <DetailItem label="Категория" value={categoryName} />

            <DetailItem label="Город" value={product.city} />

            {product.brand ? (
              <DetailItem label="Бренд" value={product.brand} />
            ) : null}

            {product.model ? (
              <DetailItem label="Модель" value={product.model} />
            ) : null}

            {!!product.depositBYN ? (
              <DetailItem label="Залог" value={`${product.depositBYN} BYN`} />
            ) : null}

            <DetailItem
              label="Мин. срок аренды"
              value={`${product.minDays} дн.`}
            />

            <DetailItem
              label="Состояние"
              value={getConditionLabel(product.condition)}
            />

            <DetailItem
              label="Доставка"
              value={product.deliveryAvailable ? "Есть" : "Нет"}
            />

            {!!product.organization ? (
              <DetailItem label="Организация" value={product.organization} />
            ) : null}

            {product.pickupAddress ? (
              <DetailItem
                label="Адрес самовывоза"
                value={product.pickupAddress}
                className="sm:col-span-2 lg:col-span-1 xl:col-span-2"
              />
            ) : null}
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border-subtle bg-zinc-50 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-900">
          Как взять товар в аренду
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-black">
              1
            </div>

            <h3 className="mt-3 font-medium text-zinc-900">
              Свяжитесь с владельцем
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Уточните свободные даты, адрес получения и итоговую стоимость.
            </p>
          </div>

          <div className="rounded-xl bg-white p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-black">
              2
            </div>

            <h3 className="mt-3 font-medium text-zinc-900">
              Согласуйте условия
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Обсудите срок аренды, залог, доставку и состояние товара.
            </p>
          </div>

          <div className="rounded-xl bg-white p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-black">
              3
            </div>

            <h3 className="mt-3 font-medium text-zinc-900">
              Заберите товар
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Проверьте комплектность и верните товар в согласованный срок.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}