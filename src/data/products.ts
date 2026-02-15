export type Product = {
  id: string;
  name: string;
  slug: string;
  category: "instrument" | "ladder" | "level" | "vacuum";
  short: string;
  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  city: string;
  images: string[];
};

export const products: Product[] = [
  {
    id: "p1",
    name: "Шуруповёрт аккумуляторный (2 АКБ, кейс)",
    slug: "shurupovert-2akb",
    category: "instrument",
    short: "Для сборки мебели, гипсокартона, мелкого ремонта. Выдача с кейсом.",
    depositBYN: 120,
    pricePerDayBYN: 15,
    minDays: 1,
    city: "Минск",
    images: ["/img/no-image.webp"],
  },    
  {
    id: "p2",
    name: "Перфоратор SDS+",
    slug: "perforator-sds-plus",
    category: "instrument",
    short: "Для сверления бетона/кирпича. Буры — как расходники (по прайсу).",
    depositBYN: 160,
    pricePerDayBYN: 20,
    minDays: 1,
    city: "Минск",
    images: ["/img/no-image.webp"],
  },
  {
    id: "p3",
    name: "Лестница-стремянка 5 ступеней",
    slug: "stremyanka-5",
    category: "ladder",
    short: "Надёжная стремянка для дома/ремонта.",
    depositBYN: 60,
    pricePerDayBYN: 8,
    minDays: 1,
    city: "Минск",
    images: ["/img/no-image.webp"],
  },
  {
    id: "p4",
    name: "Лазерный уровень (крестовой)",
    slug: "lazernyy-uroven",
    category: "level",
    short: "Разметка стен/плитки/полок. Удобно для ремонта.",
    depositBYN: 120,
    pricePerDayBYN: 15,
    minDays: 1,
    city: "Минск",
    images: ["/img/no-image.webp"],
  },
];
