import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { updateProduct } from "@/lib/products";
import { cloudinary } from "@/lib/cloudinary";
import clientPromise from "@/lib/mongodb";
import type { ProductDoc } from "@/types/product";

function isAdminEmail(email: string | null | undefined) {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return false;
  }

  return email?.toLowerCase() === adminEmail.toLowerCase();
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updated = await updateProduct(id, body);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const publicIds = product.imagePublicIds ?? [];

  for (const publicId of publicIds) {
    await cloudinary.uploader.destroy(publicId);
  }

  await db.collection<ProductDoc>("products").deleteOne({
    _id: new ObjectId(id),
  });

  return NextResponse.json({ ok: true });
}