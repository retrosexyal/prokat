import { loadEnvConfig } from "@next/env";
import { MongoClient, ObjectId, type Collection, type Db } from "mongodb";
import path from "node:path";
import process from "node:process";
import { resolveCity, type CitySlug } from "@/lib/cities";
import { slugify } from "@/lib/slug";
import type {
  ProductCondition,
  ProductDoc,
  ProductFaqItem,
  ProductSpecificationItem,
  ProductStatus,
} from "@/types/product";
import type { UserType } from "@/types";

/* npx tsx src/scripts/seed-products.ts */

const projectDir = path.resolve(process.cwd());
loadEnvConfig(projectDir);

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB;
const PRODUCTS_COLLECTION = "products";
const USERS_COLLECTION = "users";

/**
 * =========================================================
 * УКАЗЫВАЕШЬ EMAIL СВОЕГО АККАУНТА ЗДЕСЬ
 * =========================================================
 */
const OWNER_EMAIL = "retrosexyal@gmail.com";

/**
 * =========================================================
 * ОБЩИЕ НАСТРОЙКИ
 * =========================================================
 */
const DEFAULT_STATUS: ProductStatus = "approved";
const DEFAULT_CONDITION: ProductCondition = "good";
const DEFAULT_ORGANIZATION = "Prokatik";
const DEFAULT_OWNER_PHONE_FALLBACK = "+375 (33) 693-82-68";
const UPSERT_EXISTING_PRODUCTS = true;

/**
 * =========================================================
 * ВРЕМЕННЫЕ КАРТИНКИ
 * Потом просто заменишь на свои
 * =========================================================
 */
function placeholderImages(label: string): string[] {
  const encoded = encodeURIComponent(label);

  return [
    `https://placehold.co/1600x1200/webp?text=${encoded}+1`,
    `https://placehold.co/1600x1200/webp?text=${encoded}+2`,
    `https://placehold.co/1600x1200/webp?text=${encoded}+3`,
  ];
}

type SeedProductInput = {
  name: string;
  slug?: string;
  category: string;

  short: string;
  fullDescription?: string;

  organization?: string;
  brand?: string;
  model?: string;
  condition?: ProductCondition;

  depositBYN: number;
  pricePerDayBYN: number;
  minDays: number;
  quantity?: number;

  city: string;
  citySlug?: CitySlug;
  pickupAddress?: string;
  deliveryAvailable?: boolean;

  kitIncluded?: string[];
  specifications?: ProductSpecificationItem[];
  faq?: ProductFaqItem[];

  images?: string[];

  status?: ProductStatus;
};

const PRODUCTS: SeedProductInput[] = [
  {
    name: "Шуруповёрт Bosch GSR 18V с 2 аккумуляторами",
    category: "instrumenty",
    short:
      "Удобный аккумуляторный шуруповёрт для сборки мебели, монтажа и бытовых работ.",
    fullDescription:
      "Подходит для домашнего ремонта, сборки шкафов, кухонь, крепежа полок и других задач. Выдаётся с двумя аккумуляторами и зарядным устройством.",
    brand: "Bosch",
    model: "GSR 18V",
    depositBYN: 0,
    pricePerDayBYN: 18,
    minDays: 1,
    quantity: 2,
    city: "Минск",
    pickupAddress: "Минск, ул. Притыцкого, 12",
    deliveryAvailable: true,
    kitIncluded: ["2 аккумулятора", "зарядное устройство", "кейс"],
    specifications: [
      { label: "Питание", value: "аккумулятор 18V" },
      { label: "Комплектация", value: "2 АКБ + кейс" },
      { label: "Назначение", value: "сборка, монтаж, крепёж" },
    ],
    faq: [
      {
        q: "Подходит ли для сборки мебели?",
        a: "Да, это один из самых частых сценариев аренды этого инструмента.",
      },
      {
        q: "Есть ли запасной аккумулятор?",
        a: "Да, в комплекте идут 2 аккумулятора.",
      },
    ],
    images: placeholderImages("shurupovert-bosch"),
  },
  {
    name: "Перфоратор Makita HR2470 SDS+",
    category: "instrumenty",
    short:
      "Надёжный перфоратор для бетона, кирпича, демонтажа и монтажных работ.",
    fullDescription:
      "Подходит для установки карнизов, кондиционеров, крепежа, бурения в стенах и лёгкого демонтажа. Удобен как для бытового ремонта, так и для разовых строительных задач.",
    brand: "Makita",
    model: "HR2470",
    depositBYN: 0,
    pricePerDayBYN: 25,
    minDays: 1,
    quantity: 1,
    city: "Минск",
    pickupAddress: "Минск, ул. Лобанка, 94",
    deliveryAvailable: true,
    kitIncluded: ["кейс", "боковая ручка", "ограничитель глубины"],
    specifications: [
      { label: "Тип патрона", value: "SDS+" },
      { label: "Назначение", value: "бетон, кирпич, демонтаж" },
      { label: "Комплектация", value: "кейс и ручка" },
    ],
    images: placeholderImages("perforator-makita"),
  },
  {
    name: "Угловая шлифмашина DeWalt 125 мм",
    category: "instrumenty",
    short:
      "Болгарка для резки металла, зачистки, шлифовки и строительных работ.",
    fullDescription:
      "Подходит для резки профильной трубы, арматуры, листового металла, а также для зачистки и шлифовки различных поверхностей.",
    brand: "DeWalt",
    model: "125 мм",
    depositBYN: 0,
    pricePerDayBYN: 17,
    minDays: 1,
    quantity: 1,
    city: "Гомель",
    pickupAddress: "Гомель, ул. Советская, 41",
    deliveryAvailable: false,
    kitIncluded: ["защитный кожух", "ручка", "ключ"],
    specifications: [
      { label: "Диаметр диска", value: "125 мм" },
      { label: "Назначение", value: "резка и шлифовка" },
    ],
    images: placeholderImages("bolgarka-dewalt"),
  },
  {
    name: "Пылесос Karcher WD 3 для уборки после ремонта",
    category: "dlya-doma",
    short:
      "Строительный пылесос для уборки пыли, мусора и мелкого строительного загрязнения.",
    fullDescription:
      "Подходит для уборки квартиры после ремонта, сверления, монтажа, а также для гаража и мастерской.",
    brand: "Karcher",
    model: "WD 3",
    depositBYN: 0,
    pricePerDayBYN: 20,
    minDays: 1,
    quantity: 1,
    city: "Могилёв",
    pickupAddress: "Могилёв, ул. Первомайская, 18",
    deliveryAvailable: true,
    kitIncluded: ["шланг", "насадки", "фильтр", "бак для мусора"],
    specifications: [
      { label: "Тип", value: "для сухой и влажной уборки" },
      { label: "Назначение", value: "уборка после ремонта" },
    ],
    images: placeholderImages("karcher-wd3"),
  },
  {
    name: "Осушитель воздуха Ballu 25 л/сутки",
    category: "dlya-doma",
    short:
      "Осушитель для квартиры, дома, подвала и помещений после влажных работ.",
    fullDescription:
      "Подходит для борьбы с сыростью, конденсатом, повышенной влажностью, а также для помещений после штукатурки, покраски и затоплений.",
    brand: "Ballu",
    model: "25 л/сутки",
    depositBYN: 0,
    pricePerDayBYN: 35,
    minDays: 2,
    quantity: 1,
    city: "Брест",
    pickupAddress: "Брест, ул. Московская, 273",
    deliveryAvailable: true,
    kitIncluded: ["кабель питания", "бак для воды"],
    specifications: [
      { label: "Производительность", value: "25 л/сутки" },
      { label: "Назначение", value: "осушение помещений" },
    ],
    images: placeholderImages("osushitel-ballu"),
  },
  {
    name: "Проектор Epson Full HD для мероприятий",
    category: "dlya-meropriyatiy",
    short:
      "Яркий проектор для презентаций, фильмов, свадеб, праздников и выездных мероприятий.",
    fullDescription:
      "Подходит для домашнего кино, презентаций, показов, фотозон, свадеб и корпоративов. Хороший вариант, когда проектор нужен на 1–2 дня.",
    brand: "Epson",
    model: "Full HD",
    depositBYN: 0,
    pricePerDayBYN: 55,
    minDays: 1,
    quantity: 1,
    city: "Минск",
    pickupAddress: "Минск, пр-т Дзержинского, 22",
    deliveryAvailable: true,
    kitIncluded: ["пульт", "кабель HDMI", "кабель питания", "сумка"],
    specifications: [
      { label: "Разрешение", value: "Full HD" },
      { label: "Назначение", value: "презентации и мероприятия" },
    ],
    images: placeholderImages("proektor-epson"),
  },
  {
    name: "Колонка JBL PartyBox для праздников",
    category: "dlya-meropriyatiy",
    short:
      "Мощная акустика для дня рождения, вечеринки, выездного мероприятия или презентации.",
    fullDescription:
      "Подходит для небольших праздников, домашних вечеринок, свадебных утренников, выставок и мероприятий на открытом воздухе.",
    brand: "JBL",
    model: "PartyBox",
    depositBYN: 0,
    pricePerDayBYN: 45,
    minDays: 1,
    quantity: 1,
    city: "Гродно",
    pickupAddress: "Гродно, ул. Горького, 91",
    deliveryAvailable: true,
    kitIncluded: ["кабель питания", "микрофон", "стойка"],
    specifications: [
      { label: "Тип", value: "портативная акустика" },
      { label: "Подходит для", value: "праздников и мероприятий" },
    ],
    images: placeholderImages("jbl-partybox"),
  },
  {
    name: "Палатка туристическая 4-местная",
    category: "dlya-otdyha",
    short:
      "Просторная палатка для кемпинга, выезда на природу, фестиваля или отдыха с семьёй.",
    fullDescription:
      "Подходит для 3–4 человек. Удобный вариант для поездки на выходные, кемпинга, рыбалки и отдыха на природе.",
    brand: "Outventure",
    model: "4-местная",
    depositBYN: 0,
    pricePerDayBYN: 22,
    minDays: 2,
    quantity: 2,
    city: "Витебск",
    pickupAddress: "Витебск, ул. Ленина, 54",
    deliveryAvailable: false,
    kitIncluded: ["чехол", "дуги", "колышки", "растяжки"],
    specifications: [
      { label: "Вместимость", value: "4 человека" },
      { label: "Сезон", value: "весна-лето-осень" },
    ],
    images: placeholderImages("palatka-4-mest"),
  },
  {
    name: "SUP-доска надувная с веслом",
    category: "dlya-otdyha",
    short:
      "Надувная SUP-доска для прогулок по воде, активного отдыха и коротких выездов.",
    fullDescription:
      "Отлично подходит для озера, спокойной реки, семейного отдыха и пробных водных прогулок. Удобно брать на 1–3 дня.",
    brand: "Aqua Marina",
    model: "SUP Board",
    depositBYN: 0,
    pricePerDayBYN: 40,
    minDays: 1,
    quantity: 2,
    city: "Брест",
    pickupAddress: "Брест, ул. Советская, 88",
    deliveryAvailable: true,
    kitIncluded: ["весло", "насос", "рюкзак", "лиш"],
    specifications: [
      { label: "Тип", value: "надувная SUP-доска" },
      { label: "Комплектация", value: "насос, весло, рюкзак" },
    ],
    images: placeholderImages("sup-board"),
  },
  {
    name: "Велосипед горный взрослый",
    category: "sport-i-aktivnost",
    short:
      "Горный велосипед для прогулок по городу, паркам и лёгким загородным маршрутам.",
    fullDescription:
      "Подходит для прогулок, коротких поездок, активных выходных и путешествий по городу. Хороший вариант, если велосипед нужен временно.",
    brand: "Stels",
    model: "Mountain 26",
    depositBYN: 0,
    pricePerDayBYN: 28,
    minDays: 1,
    quantity: 3,
    city: "Минск",
    pickupAddress: "Минск, ул. Немига, 5",
    deliveryAvailable: true,
    kitIncluded: ["замок", "насос", "держатель для бутылки"],
    specifications: [
      { label: "Тип", value: "горный" },
      { label: "Диаметр колёс", value: "26" },
    ],
    images: placeholderImages("bike-mountain"),
  },
  {
    name: "Беговая дорожка для дома",
    category: "sport-i-aktivnost",
    short:
      "Домашняя беговая дорожка для тренировок, восстановления и поддержания активности.",
    fullDescription:
      "Подходит для временного использования дома, пробных тренировок перед покупкой или для восстановления после перерыва.",
    brand: "Unix Fit",
    model: "Home Run",
    depositBYN: 0,
    pricePerDayBYN: 60,
    minDays: 3,
    quantity: 1,
    city: "Могилёв",
    pickupAddress: "Могилёв, ул. Островского, 7",
    deliveryAvailable: true,
    kitIncluded: ["кабель питания", "инструкция"],
    specifications: [
      { label: "Тип", value: "для дома" },
      { label: "Назначение", value: "кардио тренировки" },
    ],
    images: placeholderImages("treadmill-home"),
  },
  {
    name: "Детская коляска прогулочная",
    category: "detskie-tovary",
    short:
      "Лёгкая прогулочная коляска для поездок, гостей с ребёнком и временного использования.",
    fullDescription:
      "Удобный вариант на отпуск, визит родственников, поездку в другой город или когда коляска нужна на короткий срок.",
    brand: "Baby Care",
    model: "Travel",
    depositBYN: 0,
    pricePerDayBYN: 24,
    minDays: 2,
    quantity: 2,
    city: "Гомель",
    pickupAddress: "Гомель, ул. Ирининская, 16",
    deliveryAvailable: true,
    kitIncluded: ["чехол", "корзина", "дождевик"],
    specifications: [
      { label: "Тип", value: "прогулочная" },
      { label: "Складывание", value: "компактное" },
    ],
    images: placeholderImages("baby-stroller"),
  },
  {
    name: "Детское автокресло 9-36 кг",
    category: "detskie-tovary",
    short:
      "Автокресло для поездок, гостей с ребёнком, путешествий и временного использования.",
    fullDescription:
      "Подходит для краткосрочной аренды, поездок, трансфера из аэропорта, путешествий и случаев, когда автокресло нужно ненадолго.",
    brand: "Joie",
    model: "9-36 кг",
    depositBYN: 0,
    pricePerDayBYN: 20,
    minDays: 1,
    quantity: 2,
    city: "Витебск",
    pickupAddress: "Витебск, пр-т Черняховского, 25",
    deliveryAvailable: true,
    kitIncluded: ["вкладыш", "ремни безопасности"],
    specifications: [
      { label: "Вес ребёнка", value: "9-36 кг" },
      { label: "Назначение", value: "поездки и путешествия" },
    ],
    images: placeholderImages("car-seat-kids"),
  },
  {
    name: "Кресло-коляска инвалидная складная",
    category: "meditsinskie-tovary",
    short:
      "Складная инвалидная коляска для временного передвижения и восстановления.",
    fullDescription:
      "Подходит для периода реабилитации, ухода за близким человеком, послеоперационного восстановления и временной бытовой поддержки.",
    brand: "Armed",
    model: "Складная",
    depositBYN: 0,
    pricePerDayBYN: 30,
    minDays: 3,
    quantity: 1,
    city: "Минск",
    pickupAddress: "Минск, ул. Кульман, 11",
    deliveryAvailable: true,
    kitIncluded: ["подножки", "подлокотники"],
    specifications: [
      { label: "Тип", value: "складная" },
      { label: "Назначение", value: "временное передвижение" },
    ],
    images: placeholderImages("invalid-chair"),
  },
  {
    name: "Ходунки для реабилитации",
    category: "meditsinskie-tovary",
    short:
      "Ходунки для восстановления после травм, операций и для бытовой поддержки.",
    fullDescription:
      "Удобны для временного использования дома, в период восстановления или ухода за пожилым человеком.",
    brand: "Barry",
    model: "Rehab Walk",
    depositBYN: 0,
    pricePerDayBYN: 12,
    minDays: 3,
    quantity: 2,
    city: "Гродно",
    pickupAddress: "Гродно, ул. Победы, 14",
    deliveryAvailable: true,
    kitIncluded: ["основная рама", "накладки на ножки"],
    specifications: [
      { label: "Тип", value: "реабилитационные" },
      { label: "Назначение", value: "поддержка при ходьбе" },
    ],
    images: placeholderImages("hodunki-rehab"),
  },
  {
    name: "Камера Sony Alpha для съёмки",
    category: "dlya-foto-i-video",
    short:
      "Камера для фото, видео, контента, интервью и съёмочных дней.",
    fullDescription:
      "Подходит для фотосессий, съёмки reels, интервью, мероприятий, контента и тестирования техники перед покупкой.",
    brand: "Sony",
    model: "Alpha",
    depositBYN: 0,
    pricePerDayBYN: 95,
    minDays: 1,
    quantity: 1,
    city: "Минск",
    pickupAddress: "Минск, ул. Сурганова, 57Б",
    deliveryAvailable: true,
    kitIncluded: ["аккумулятор", "зарядка", "ремень", "сумка"],
    specifications: [
      { label: "Тип", value: "беззеркальная камера" },
      { label: "Назначение", value: "фото и видео" },
    ],
    images: placeholderImages("sony-alpha"),
  },
  {
    name: "Штатив для фото и видео съёмки",
    category: "dlya-foto-i-video",
    short:
      "Универсальный штатив для камеры, телефона, предметной и выездной съёмки.",
    fullDescription:
      "Подходит для интервью, студийной съёмки, предметной съёмки, контента и работы с камерой или смартфоном.",
    brand: "Manfrotto",
    model: "Tripod Pro",
    depositBYN: 0,
    pricePerDayBYN: 15,
    minDays: 1,
    quantity: 2,
    city: "Гомель",
    pickupAddress: "Гомель, ул. Речицкий проспект, 80",
    deliveryAvailable: true,
    kitIncluded: ["штатив", "площадка", "чехол"],
    specifications: [
      { label: "Тип", value: "универсальный" },
      { label: "Назначение", value: "камера и смартфон" },
    ],
    images: placeholderImages("tripod-photo-video"),
  },
  {
    name: "Газонокосилка электрическая для дачи",
    category: "sad-i-dacha",
    short:
      "Газонокосилка для ухода за травой на участке, возле дома и на даче.",
    fullDescription:
      "Подходит для сезонного ухода за газоном, разовых дачных работ и приведения участка в порядок.",
    brand: "Bosch",
    model: "Rotak",
    depositBYN: 0,
    pricePerDayBYN: 30,
    minDays: 1,
    quantity: 1,
    city: "Брест",
    pickupAddress: "Брест, ул. Янки Купалы, 3",
    deliveryAvailable: true,
    kitIncluded: ["травосборник", "кабель питания"],
    specifications: [
      { label: "Тип", value: "электрическая" },
      { label: "Назначение", value: "уход за газоном" },
    ],
    images: placeholderImages("gazonokosilka"),
  },
  {
    name: "Триммер бензиновый для участка",
    category: "sad-i-dacha",
    short:
      "Триммер для покоса травы, ухода за участком и сезонных работ на даче.",
    fullDescription:
      "Подходит для высокой травы, неровного участка, покоса вдоль забора, дорожек и труднодоступных мест.",
    brand: "Huter",
    model: "GGT",
    depositBYN: 0,
    pricePerDayBYN: 27,
    minDays: 1,
    quantity: 1,
    city: "Могилёв",
    pickupAddress: "Могилёв, ул. Якубовского, 29",
    deliveryAvailable: false,
    kitIncluded: ["ремень", "катушка", "ключи"],
    specifications: [
      { label: "Тип", value: "бензиновый" },
      { label: "Назначение", value: "покос травы" },
    ],
    images: placeholderImages("trimmer-benzin"),
  },
];

function assertEnv() {
  if (!MONGODB_URI) {
    throw new Error("Не найден MONGODB_URI в .env");
  }
}

function normalizeOptionalText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeStringArray(values?: string[]): string[] {
  return (values ?? []).map((item) => item.trim()).filter(Boolean);
}

function normalizeSpecifications(
  specifications?: ProductSpecificationItem[],
): ProductSpecificationItem[] {
  return (specifications ?? [])
    .map((item) => ({
      label: item.label.trim(),
      value: item.value.trim(),
    }))
    .filter((item) => item.label && item.value);
}

function normalizeFaq(faq?: ProductFaqItem[]): ProductFaqItem[] {
  return (faq ?? [])
    .map((item) => ({
      q: item.q.trim(),
      a: item.a.trim(),
    }))
    .filter((item) => item.q && item.a);
}

function buildProductDoc(
  input: SeedProductInput,
  owner: UserType,
): Omit<ProductDoc, "_id" | "createdAt" | "updatedAt"> {
  const resolvedCity = resolveCity(input.citySlug ?? input.city);

  return {
    ownerId: owner._id as ObjectId,
    ownerEmail: owner.email,

    name: input.name.trim(),
    slug: (input.slug?.trim() || slugify(input.name)).trim(),
    category: input.category.trim(),

    short: input.short.trim(),
    fullDescription: normalizeOptionalText(input.fullDescription),

    organization: normalizeOptionalText(input.organization) ?? DEFAULT_ORGANIZATION,
    brand: normalizeOptionalText(input.brand),
    model: normalizeOptionalText(input.model),
    condition: input.condition ?? DEFAULT_CONDITION,

    depositBYN: input.depositBYN,
    pricePerDayBYN: input.pricePerDayBYN,
    minDays: input.minDays,
    quantity: Math.max(1, input.quantity ?? 1),

    city: resolvedCity.name,
    citySlug: resolvedCity.slug,
    pickupAddress: normalizeOptionalText(input.pickupAddress),
    deliveryAvailable: input.deliveryAvailable ?? false,

    kitIncluded: normalizeStringArray(input.kitIncluded),
    specifications: normalizeSpecifications(input.specifications),
    faq: normalizeFaq(input.faq),

    images:
      (input.images ?? []).slice(0, 5).filter(Boolean).length > 0
        ? (input.images ?? []).slice(0, 5).filter(Boolean)
        : placeholderImages(input.name),
    imagePublicIds: [],

    status: input.status ?? DEFAULT_STATUS,
    ownerPhone:
      owner.showPhoneInProducts === true
        ? owner.phone || DEFAULT_OWNER_PHONE_FALLBACK
        : owner.phone || DEFAULT_OWNER_PHONE_FALLBACK,

    ratingBoost: 0,
    priorityScore: 0,
  };
}

async function findOwner(db: Db, email: string): Promise<UserType> {
  const owner = await db
    .collection<UserType>(USERS_COLLECTION)
    .findOne({ email: email.toLowerCase() });

  if (!owner?._id) {
    throw new Error(`Пользователь с email "${email}" не найден`);
  }

  return owner;
}

async function upsertProduct(
  collection: Collection<ProductDoc>,
  owner: UserType,
  input: SeedProductInput,
  index: number,
): Promise<"created" | "updated" | "skipped"> {
  const doc = buildProductDoc(input, owner);
  const existing = await collection.findOne({ slug: doc.slug });

  if (existing && !UPSERT_EXISTING_PRODUCTS) {
    console.log(
      `[${index + 1}] SKIP  ${doc.name} — товар со slug "${doc.slug}" уже существует`,
    );
    return "skipped";
  }

  if (existing) {
    await collection.updateOne(
      { _id: existing._id },
      {
        $set: {
          ...doc,
          updatedAt: new Date(),
        },
      },
    );

    console.log(`[${index + 1}] UPDATE ${doc.name}`);
    return "updated";
  }

  await collection.insertOne({
    ...doc,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`[${index + 1}] CREATE ${doc.name}`);
  return "created";
}

async function printSummary(collection: Collection<ProductDoc>, owner: UserType) {
  const totalOwnerProducts = await collection.countDocuments({
    ownerId: owner._id,
  });

  const approvedOwnerProducts = await collection.countDocuments({
    ownerId: owner._id,
    status: "approved",
  });

  console.log("");
  console.log("======================================");
  console.log("Готово");
  console.log(`Владелец: ${owner.email}`);
  console.log(`Всего товаров у владельца: ${totalOwnerProducts}`);
  console.log(`Одобренных товаров у владельца: ${approvedOwnerProducts}`);
  console.log("======================================");
}

async function run() {
  assertEnv();

  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();

    const db = DB_NAME ? client.db(DB_NAME) : client.db();
    const owner = await findOwner(db, OWNER_EMAIL);
    const collection = db.collection<ProductDoc>(PRODUCTS_COLLECTION);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < PRODUCTS.length; i += 1) {
      const result = await upsertProduct(collection, owner, PRODUCTS[i], i);

      if (result === "created") created += 1;
      if (result === "updated") updated += 1;
      if (result === "skipped") skipped += 1;
    }

    console.log("");
    console.log(`Создано: ${created}`);
    console.log(`Обновлено: ${updated}`);
    console.log(`Пропущено: ${skipped}`);

    await printSummary(collection, owner);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error("Ошибка seed-products:", error);
  process.exit(1);
});