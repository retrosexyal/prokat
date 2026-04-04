import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getPendingProducts } from "@/lib/products";
import { AdminModerationPanel } from "./AdminModerationPanel";
import { toProductViews } from "@/lib/product-mappers";
import { isAdminEmail } from "@/lib/auth";
import { CategoriesManager } from "./CategoriesManager";
import { getMonetizationRequestsForAdmin } from "@/lib/monetization-requests";
import { toMonetizationRequestViews } from "@/lib/monetization-mappers";
import { AdminMonetizationRequests } from "./AdminMonetizationRequests";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isAdminEmail(session.user?.email)) {
    redirect("/");
  }

  const [products, requests] = await Promise.all([
    getPendingProducts(),
    getMonetizationRequestsForAdmin(),
  ]);

  const serializedProducts = toProductViews(products);
  const serializedRequests = toMonetizationRequestViews(requests);

  return (
    <div className="space-y-8">
      <CategoriesManager />
      <AdminMonetizationRequests initialRequests={serializedRequests} />
      <AdminModerationPanel initialProducts={serializedProducts} />
    </div>
  );
}