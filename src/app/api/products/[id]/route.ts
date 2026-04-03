import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { cloudinary } from "@/lib/cloudinary";
import clientPromise from "@/lib/mongodb";
import { toProductView } from "@/lib/product-mappers";
import { resolveCity } from "@/lib/cities";
import type { ProductDoc } from "@/types/product";

const MAX_IMAGES = 10;

function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return false;
  }

  return email?.toLowerCase() === adminEmail.toLowerCase();
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  const product = await db.collection<ProductDoc>("products").findOne({
    _id: new ObjectId(id),
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const canEdit =
    product.ownerEmail === session.user.email ||
    isAdminEmail(session.user.email);

  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const short = String(formData.get("short") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const depositBYN = Number(formData.get("depositBYN") ?? 0);
  const pricePerDayBYN = Number(formData.get("pricePerDayBYN") ?? 0);
  const minDays = Number(formData.get("minDays") ?? 1);
  const quantity = Number(formData.get("quantity") ?? 1);
  const rawCity = String(formData.get("city") ?? "").trim();
  const rawCitySlug = String(formData.get("citySlug") ?? "").trim();
  const pickupAddress = String(formData.get("pickupAddress") ?? "").trim();

  const keptImages = formData
    .getAll("keptImages")
    .map((item) => String(item).trim())
    .filter(Boolean);

  const keptImagePublicIds = formData
    .getAll("keptImagePublicIds")
    .map((item) => String(item).trim())
    .filter(Boolean);

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

  const totalImagesCount = keptImages.length + files.length;

  if (totalImagesCount > MAX_IMAGES) {
    return NextResponse.json(
      { error: `Можно загрузить не более ${MAX_IMAGES} изображений` },
      { status: 400 },
    );
  }

  const resolvedCity = resolveCity(rawCitySlug || rawCity);
  const city = resolvedCity.name;
  const citySlug = resolvedCity.slug;

  const uploadResults = await Promise.all(files.map(uploadImage));
  const newImages = uploadResults.map((item) => item.secure_url);
  const newImagePublicIds = uploadResults.map((item) => item.public_id);

  const oldPublicIds = product.imagePublicIds ?? [];
  const removedPublicIds = oldPublicIds.filter(
    (publicId) => !keptImagePublicIds.includes(publicId),
  );

  for (const publicId of removedPublicIds) {
    await cloudinary.uploader.destroy(publicId);
  }

  const nextImages = [...keptImages, ...newImages];
  const nextImagePublicIds = [...keptImagePublicIds, ...newImagePublicIds];

  const updated = await db.collection<ProductDoc>("products").findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        name,
        category,
        short,
        organization,
        depositBYN,
        pricePerDayBYN,
        minDays,
        quantity,
        city,
        citySlug,
        pickupAddress,
        images: nextImages,
        imagePublicIds: nextImagePublicIds,
        status: "pending",
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!updated) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(toProductView(updated));
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  const product = await db.collection<ProductDoc>("products").findOne({
    _id: new ObjectId(id),
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const canDelete =
    product.ownerEmail === session.user.email ||
    isAdminEmail(session.user.email);

  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const publicIds = product.imagePublicIds ?? [];

  for (const publicId of publicIds) {
    await cloudinary.uploader.destroy(publicId);
  }

  await db.collection<ProductDoc>("products").deleteOne({
    _id: new ObjectId(id),
  });

  return NextResponse.json({ ok: true });
}