import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  getAllProductsForAdmin,
  getPendingProducts,
} from "@/lib/products";

function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return false;
  }

  return email?.toLowerCase() === adminEmail.toLowerCase();
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  if (scope === "all") {
    const products = await getAllProductsForAdmin();
    return NextResponse.json(products);
  }

  const products = await getPendingProducts();
  return NextResponse.json(products);
}