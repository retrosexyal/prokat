import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/categories";
import { toCategoryView } from "@/lib/category-mappers";

export async function GET() {
  const categories = await getAllCategories();

  return NextResponse.json(categories.map(toCategoryView), { status: 200 });
}
