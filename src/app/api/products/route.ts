import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { createProduct, getProductsByOwner } from "@/lib/products";
import { cloudinary } from "@/lib/cloudinary";
import type {
  ProductCondition,
  ProductDoc,
  ProductFaqItem,
  ProductSpecificationItem,
  ProductView,
} from "@/types/product";
import type { UserType } from "@/types";
import { toProductView } from "@/lib/product-mappers";
import { generateUniqueSlug } from "@/lib/slug";
import { resolveCity } from "@/lib/cities";
import { notifyAdmin } from "@/lib/admin-notifications";

const FREE_PRODUCTS_LIMIT = 3;
const MAX_IMAGES = 10;

type CloudinaryUploadResult = {
  secure_url?: string;
  public_id?: string;
};

async function uploadImage(file: Blob): Promise<{
  secure_url: string;
  public_id: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "prokat-products",
        resource_type: "image",
        format: "webp",
        transformation: [
          {
            width: 1920,
            height: 1440,
            crop: "limit",
            quality: "auto",
          },
        ],
      },
      (error: unknown, result: CloudinaryUploadResult | undefined) => {
        if (error || !result?.secure_url || !result.public_id) {
          return reject(error ?? new Error("Upload failed"));
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
}

function parseCondition(value: string): ProductCondition {
  if (
    value === "new" ||
    value === "excellent" ||
    value === "good" ||
    value === "used"
  ) {
    return value;
  }

  return "good";
}

function parseSpecifications(
  lines: FormDataEntryValue[],
): ProductSpecificationItem[] {
  return lines
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...valueParts] = line.split(":");
      return {
        label: label?.trim() ?? "",
        value: valueParts.join(":").trim(),
      };
    })
    .filter((item) => item.label && item.value);
}

function parseFaq(lines: FormDataEntryValue[]): ProductFaqItem[] {
  return lines
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((line) => {
      const [q, ...aParts] = line.split("||");
      return {
        q: q?.trim() ?? "",
        a: aParts.join("||").trim(),
      };
    })
    .filter((item) => item.q && item.a);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() as ProductDoc["category"];

  const short = String(formData.get("short") ?? "").trim();
  const fullDescription = String(formData.get("fullDescription") ?? "").trim();

  const organization = String(formData.get("organization") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const condition = parseCondition(String(formData.get("condition") ?? "").trim());

  const depositBYN = Number(formData.get("depositBYN") ?? 0);
  const pricePerDayBYN = Number(formData.get("pricePerDayBYN") ?? 0);
  const minDays = Number(formData.get("minDays") ?? 1);
  const quantity = Number(formData.get("quantity") ?? 1);

  const rawCity = String(formData.get("city") ?? "").trim();
  const rawCitySlug = String(formData.get("citySlug") ?? "").trim();

  const pickupAddress = String(formData.get("pickupAddress") ?? "").trim();
  const deliveryAvailable = String(formData.get("deliveryAvailable") ?? "") === "true";

  const kitIncluded = formData
    .getAll("kitIncluded")
    .map((item) => String(item).trim())
    .filter(Boolean);

  const specifications = parseSpecifications(formData.getAll("specifications"));
  const faq = parseFaq(formData.getAll("faq"));

  const resolvedCity = resolveCity(rawCitySlug || rawCity);
  const city = resolvedCity.name;
  const citySlug = resolvedCity.slug;

  const files = formData.getAll("files").filter((item): item is File => {
    return typeof item !== "string";
  });

  if (
    !name ||
    !category ||
    !short ||
    Number.isNaN(depositBYN) ||
    Number.isNaN(pricePerDayBYN) ||
    Number.isNaN(minDays) ||
    Number.isNaN(quantity)
  ) {
    return NextResponse.json(
      { error: "Заполните все обязательные поля" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json(
      { error: "Количество товара должно быть не меньше 1" },
      { status: 400 },
    );
  }

  if (files.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: `Можно загрузить не более ${MAX_IMAGES} изображений` },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const slug = await generateUniqueSlug(db, name);

  const user = await db.collection<UserType>("users").findOne({
    email: session.user.email,
  });

  if (!user?._id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userProducts = await getProductsByOwner(String(user._id));
  const productLimit = user.productLimit ?? FREE_PRODUCTS_LIMIT;

  if (userProducts.length >= productLimit) {
    return NextResponse.json(
      { error: `Достигнут лимит: ${productLimit} товаров` },
      { status: 403 },
    );
  }

  const uploadResults = await Promise.all(files.map(uploadImage));
  const images = uploadResults.map((item) => item.secure_url);
  const imagePublicIds = uploadResults.map((item) => item.public_id);

  const product = await createProduct({
    ownerId: user._id as ObjectId,
    ownerEmail: session.user.email,

    name,
    slug,
    category,

    short,
    fullDescription: fullDescription || undefined,

    organization: organization || undefined,
    brand: brand || undefined,
    model: model || undefined,
    condition,

    depositBYN,
    pricePerDayBYN,
    minDays,
    quantity,

    city,
    citySlug,
    pickupAddress: pickupAddress || undefined,
    deliveryAvailable,

    kitIncluded,
    specifications,
    faq,

    images,
    imagePublicIds,
    status: "pending",
    ownerPhone: user.showPhoneInProducts ? user.phone : undefined,
  });

  try {
    await notifyAdmin({
      title: "Новая заявка на модерацию",
      body: `${name} · ${session.user.email}`,
      url: "/admin",
    });
  } catch (error) {
    console.error("Product created, but admin notification failed:", error);
  }

  const serialized: ProductView = toProductView(product);

  return NextResponse.json(serialized, { status: 201 });
}