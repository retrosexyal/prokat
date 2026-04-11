import type { ProductDoc, ProductFaqItem } from "@/types/product";

type Props = {
  product: ProductDoc;
  fullDescription: string;
  faqItems: ProductFaqItem[];
};

export function ProductContentSections({
  product,
  fullDescription,
  faqItems,
}: Props) {
  const hasFullDescription = fullDescription.length > 0;
  const hasKitIncluded = (product.kitIncluded?.length ?? 0) > 0;
  const hasSpecifications = (product.specifications?.length ?? 0) > 0;

  return (
    <>
      {hasFullDescription ? (
        <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Подробное описание
          </h2>
          <div className="space-y-3 whitespace-pre-line text-sm leading-7 text-zinc-700">
            {fullDescription}
          </div>
        </div>
      ) : null}

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
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">
          Как взять в аренду
        </h2>

        <ol className="space-y-2 text-sm text-zinc-700">
          <li>1. Нажмите кнопку бронирования и отправьте заявку.</li>
          <li>2. Согласуйте дату, время и условия получения товара.</li>
          <li>3. Проверьте состояние товара и комплект при выдаче.</li>
          <li>4. Верните товар в согласованный срок.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">
          Что важно знать перед арендой
        </h2>

        <div className="space-y-3 text-sm leading-6 text-zinc-700">
          <p>
            Перед бронированием уточните точное время получения, условия
            возврата, комплектность товара и возможность продления аренды.
          </p>

          <p>
            Проверьте, устраивает ли вас минимальный срок аренды, размер залога
            и способ получения товара: самовывоз или доставка.
          </p>

          <p>
            Аренда особенно удобна, когда товар нужен на короткий срок: для
            ремонта, поездки, мероприятия или разовой бытовой задачи.
          </p>
        </div>
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