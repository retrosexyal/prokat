import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createProduct, getProducts } from "@/lib/products";
import type { ProductDoc } from "@/types/product";

function isAdminEmail(email: string | null | undefined) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return email?.toLowerCase() === adminEmail.toLowerCase();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ProductDoc> & {
    imageUrl?: string;
    imagePublicIds?: string[];
  };

  if (!body.name || !body.slug || !body.pricePerDayBYN) {
    return NextResponse.json(
      { error: "name, slug и pricePerDayBYN обязательны" },
      { status: 400 },
    );
  }

  const doc = await createProduct({
    name: body.name,
    slug: body.slug,
    category: (body.category as ProductDoc["category"]) ?? "other",
    short: body.short ?? "",
    depositBYN: body.depositBYN ?? 0,
    pricePerDayBYN: body.pricePerDayBYN,
    minDays: body.minDays ?? 1,
    city: body.city ?? "Могилёв",
    images:
      body.images && body.images.length > 0
        ? body.images
        : body.imageUrl
          ? [body.imageUrl]
          : [],
    imagePublicIds:
      body.imagePublicIds && body.imagePublicIds.length > 0
        ? body.imagePublicIds
        : body.imagePublicIds === undefined && body.imageUrl
          ? [body.imagePublicIds?.[0] ?? ""].filter(Boolean)
          : [],
  });

  return NextResponse.json(doc, { status: 201 });
}

