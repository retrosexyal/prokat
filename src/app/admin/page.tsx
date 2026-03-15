import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getPendingProducts } from "@/lib/products";
import { AdminModerationPanel } from "./AdminModerationPanel";
import { toProductViews } from "@/lib/product-mappers";

function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return false;
  }

  return email?.toLowerCase() === adminEmail.toLowerCase();
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isAdminEmail(session.user?.email)) {
    redirect("/");
  }

  const products = await getPendingProducts();
  const serializedProducts = toProductViews(products);

  return <AdminModerationPanel initialProducts={serializedProducts} />;
}