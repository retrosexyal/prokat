import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getProducts } from "@/lib/products";
import { AdminProductForm } from "./AdminProductForm";

function isAdminEmail(email: string | null | undefined) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return email?.toLowerCase() === adminEmail.toLowerCase();
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email)) {
    redirect("/");
  }

  const products = await getProducts();

  return <AdminProductForm initialProducts={products} />;
}

