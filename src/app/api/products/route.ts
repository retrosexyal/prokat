import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { createProduct, getProductsByOwner } from "@/lib/products";
import { cloudinary } from "@/lib/cloudinary";
import type { ProductDoc, ProductView } from "@/types/product";
import type { UserType } from "@/types";
import { toProductView } from "@/lib/product-mappers";

const FREE_PRODUCTS_LIMIT = 3;

type CloudinaryUploadResult = {
  secure_url?: string;
  public_id?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() as ProductDoc["category"];
  const short = String(formData.get("short") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const depositBYN = Number(formData.get("depositBYN") ?? 0);
  const pricePerDayBYN = Number(formData.get("pricePerDayBYN") ?? 0);
  const minDays = Number(formData.get("minDays") ?? 1);
  const city = String(formData.get("city") ?? "").trim();
  const file = formData.get("file");

  if (
    !name ||
    !slug ||
    !category ||
    !short ||
    !organization ||
    !city ||
    Number.isNaN(depositBYN) ||
    Number.isNaN(pricePerDayBYN) ||
    Number.isNaN(minDays)
  ) {
    return NextResponse.json(
      { error: "Заполните все обязательные поля" },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection<UserType>("users").findOne({
    email: session.user.email,
  });

  if (!user?._id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userProducts = await getProductsByOwner(String(user._id));

  if (userProducts.length >= FREE_PRODUCTS_LIMIT) {
    return NextResponse.json(
      { error: `Достигнут лимит: ${FREE_PRODUCTS_LIMIT} товаров` },
      { status: 403 },
    );
  }

  let images: string[] = [];
  let imagePublicIds: string[] = [];

  if (file instanceof Blob) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "prokat-products",
          resource_type: "image",
          transformation: [
            {
              width: 600,
              height: 600,
              crop: "limit",
              fetch_format: "auto",
              quality: "auto",
            },
          ],
        },
        (
          error: unknown,
          result: CloudinaryUploadResult | undefined,
        ) => {
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

    images = [uploadResult.secure_url];
    imagePublicIds = [uploadResult.public_id];
  }

  const product = await createProduct({
    ownerId: user._id as ObjectId,
    ownerEmail: session.user.email,
    name,
    slug,
    category,
    short,
    organization,
    depositBYN,
    pricePerDayBYN,
    minDays,
    city,
    images,
    imagePublicIds,
    status: "pending",
  });

  const serialized: ProductView = toProductView(product);

  return NextResponse.json(serialized, { status: 201 });
}