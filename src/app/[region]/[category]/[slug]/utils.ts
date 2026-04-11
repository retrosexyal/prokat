import type { ProductCondition, ProductFaqItem } from "@/types/product";

export function getConditionLabel(condition?: ProductCondition): string {
  switch (condition) {
    case "new":
      return "Новый";
    case "excellent":
      return "Отличное";
    case "good":
      return "Хорошее";
    case "used":
      return "Б/у";
    default:
      return "Хорошее";
  }
}

export function getSchemaCondition(condition?: ProductCondition): string {
  switch (condition) {
    case "new":
      return "https://schema.org/NewCondition";
    case "excellent":
    case "good":
    case "used":
    default:
      return "https://schema.org/UsedCondition";
  }
}

export function buildProductFaq(
  productName: string,
  city: string,
  pickupAddress?: string,
  depositBYN?: number,
  customFaq?: ProductFaqItem[],
): ProductFaqItem[] {
  const normalizedCustomFaq = (customFaq ?? []).filter(
    (item) => item.q.trim() && item.a.trim(),
  );

  if (normalizedCustomFaq.length > 0) {
    return normalizedCustomFaq;
  }

  return [
    {
      q: `На какой срок можно арендовать ${productName}?`,
      a: "Минимальный срок аренды для этого товара указывается в карточке. Точные условия и возможный срок продления согласуются при бронировании.",
    },
    {
      q: `Где можно забрать ${productName}?`,
      a: pickupAddress
        ? `Самовывоз доступен по адресу: ${pickupAddress}. Детали получения согласуются после бронирования.`
        : `Товар доступен для получения в городе ${city}. Детали выдачи согласуются после бронирования.`,
    },
    {
      q: `Нужен ли залог для аренды ${productName}?`,
      a: depositBYN
        ? `Да, для этого товара указан залог ${depositBYN} BYN.`
        : "Для этого товара залог не указан.",
    },
  ];
}

export function buildSeoDescriptionParagraph(params: {
  titleMain: string;
  productName: string;
  categoryName: string;
  cityNameIn: string;
  cityName: string;
  pricePerDayBYN: number;
  minDays: number;
  depositBYN?: number;
  condition?: ProductCondition;
  deliveryAvailable?: boolean;
  pickupAddress?: string;
}): string {
  const {
    titleMain,
    productName,
    categoryName,
    cityNameIn,
    cityName,
    pricePerDayBYN,
    minDays,
    depositBYN,
    condition,
    deliveryAvailable,
    pickupAddress,
  } = params;

  return [
    `${titleMain || productName} — товар из категории «${categoryName}», доступный для аренды в ${cityNameIn}.`,
    `Стоимость аренды составляет ${pricePerDayBYN} BYN в сутки.`,
    `Минимальный срок аренды — ${minDays} дн.`,
    depositBYN
      ? `Для этого предложения предусмотрен залог ${depositBYN} BYN.`
      : "Для этого предложения залог не указан.",
    condition ? `Состояние товара: ${getConditionLabel(condition)}.` : null,
    deliveryAvailable
      ? "Для этого товара доступна доставка."
      : "Получение товара согласуется по адресу самовывоза.",
    pickupAddress
      ? `Самовывоз доступен по адресу: ${pickupAddress}.`
      : `Выдача товара осуществляется в городе ${cityName}.`,
  ]
    .filter(Boolean)
    .join(" ");
}