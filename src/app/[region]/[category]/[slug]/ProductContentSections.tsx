import type { ProductDoc, ProductFaqItem } from "@/types/product";
import {
  getConditionLabel,
  isMeaningfulBrand,
} from "./utils";

type Props = {
  product: ProductDoc;
  categoryName: string;
  cityNameIn: string;
  titleMain: string;
  seoDescriptionParagraph: string;
  fullDescription: string;
  faqItems: ProductFaqItem[];
};

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium leading-5 text-zinc-800">
        {value}
      </dd>
    </div>
  );
}

export function ProductContentSections({
  product,
  categoryName,
  cityNameIn,
  titleMain,
  seoDescriptionParagraph,
  fullDescription,
  faqItems,
}: Props) {
  const hasFullDescription = fullDescription.length > 0;
  const hasKitIncluded = (product.kitIncluded?.length ?? 0) > 0;
  const hasSpecifications = (product.specifications?.length ?? 0) > 0;

  return (
    <>
      <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Описание</h2>

        {hasFullDescription ? (
          <div className="mt-3 space-y-3 whitespace-pre-line text-sm leading-7 text-zinc-700">
            {fullDescription}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-7 text-zinc-700">
            {product.short}
          </p>
        )}

        <div className="mt-6 border-t border-zinc-100 pt-5">
          <h3 className="text-base font-semibold text-zinc-900">
            Основные условия
          </h3>

          <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <InfoItem label="Категория" value={categoryName} />
            <InfoItem label="Город" value={product.city} />
            <InfoItem
              label="Цена"
              value={`от ${product.pricePerDayBYN} BYN / сутки`}
            />
            <InfoItem
              label="Минимальный срок"
              value={`${product.minDays} дн.`}
            />

            {isMeaningfulBrand(product.brand) ? (
              <InfoItem label="Бренд" value={product.brand} />
            ) : null}

            {product.model ? (
              <InfoItem label="Модель" value={product.model} />
            ) : null}

            <InfoItem
              label="Состояние"
              value={getConditionLabel(product.condition)}
            />
            <InfoItem
              label="Доставка"
              value={product.deliveryAvailable ? "Есть" : "Нет"}
            />

            {!!product.depositBYN ? (
              <InfoItem label="Залог" value={`${product.depositBYN} BYN`} />
            ) : null}

            {product.pickupAddress ? (
              <InfoItem label="Адрес самовывоза" value={product.pickupAddress} />
            ) : null}
          </dl>
        </div>

        <div className="mt-6 border-t border-zinc-100 pt-5">
          <h3 className="text-base font-semibold text-zinc-900">
            Аренда {titleMain || product.name} в {cityNameIn}
          </h3>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            {seoDescriptionParagraph}
          </p>
        </div>
      </div>

      {hasSpecifications ? (
        <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Характеристики
          </h2>

          <dl className="grid gap-4 sm:grid-cols-2">
            {(product.specifications ?? []).map((item, index) => (
              <div
                key={`${item.label}-${item.value}-${index}`}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <dt className="text-xs uppercase tracking-wide text-zinc-400">
                  {item.label}
                </dt>
                <dd className="mt-2 text-sm text-zinc-800">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {hasKitIncluded ? (
        <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Что входит в комплект
          </h2>

          <ul className="grid gap-2 text-sm text-zinc-700">
            {(product.kitIncluded ?? []).map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Как арендовать</h2>

        <ol className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
          <li className="rounded-xl bg-zinc-50 p-4">
            <span className="font-semibold text-zinc-900">1. Заявка</span>
            <p className="mt-2 leading-6">
              Выберите даты аренды и отправьте заявку владельцу.
            </p>
          </li>
          <li className="rounded-xl bg-zinc-50 p-4">
            <span className="font-semibold text-zinc-900">2. Условия</span>
            <p className="mt-2 leading-6">
              Согласуйте время, адрес получения, залог и способ возврата.
            </p>
          </li>
          <li className="rounded-xl bg-zinc-50 p-4">
            <span className="font-semibold text-zinc-900">3. Получение</span>
            <p className="mt-2 leading-6">
              Проверьте состояние товара и комплектность при выдаче.
            </p>
          </li>
          <li className="rounded-xl bg-zinc-50 p-4">
            <span className="font-semibold text-zinc-900">4. Возврат</span>
            <p className="mt-2 leading-6">
              Верните товар в согласованный срок или договоритесь о продлении.
            </p>
          </li>
        </ol>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Частые вопросы
        </h2>

        <div className="grid gap-4">
          {faqItems.map((item, index) => (
            <div
              key={`${item.q}-${index}`}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <h3 className="text-base font-semibold text-zinc-900">
                {item.q}
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-600">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
