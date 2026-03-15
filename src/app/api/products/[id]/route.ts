import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { cloudinary } from "@/lib/cloudinary";
import clientPromise from "@/lib/mongodb";
import type { ProductDoc } from "@/types/product";

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