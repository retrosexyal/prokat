import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getPendingProducts } from "@/lib/products";
import { AdminModerationPanel } from "./AdminModerationPanel";
import { toProductViews } from "@/lib/product-mappers";
import { isAdminEmail } from "@/lib/auth";
import { CategoriesManager } from "./CategoriesManager";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isAdminEmail(session.user?.email)) {
    redirect("/");
  }

  const products = await getPendingProducts();
  const serializedProducts = toProductViews(products);

  return (
    <div className="space-y-8">
      <CategoriesManager />
      <AdminModerationPanel initialProducts={serializedProducts} />
    </div>
  );
}
