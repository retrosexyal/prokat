import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getExpiredBoostedProducts, getPendingProducts } from "@/lib/products";
import { AdminModerationPanel } from "./AdminModerationPanel";
import { toProductViews } from "@/lib/product-mappers";
import { isAdminEmail } from "@/lib/auth";
import { CategoriesManager } from "./CategoriesManager";
import { getMonetizationRequestsForAdmin } from "@/lib/monetization-requests";
import { toMonetizationRequestViews } from "@/lib/monetization-mappers";
import { AdminMonetizationRequests } from "./AdminMonetizationRequests";
import { AdminExpiredBoosts } from "./AdminExpiredBoosts";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isAdminEmail(session.user?.email)) {
    redirect("/");
  }

  const [products, requests, expiredBoostedProducts] = await Promise.all([
    getPendingProducts(),
    getMonetizationRequestsForAdmin({ includeProcessed: true }),
    getExpiredBoostedProducts(),
  ]);

  const expiredBoostRequests = requests.filter((request) => {
    const productId = request.productId?.toString();

    return expiredBoostedProducts.some(
      (product) => product._id?.toString() === productId,
    );
  });

  const serializedProducts = toProductViews(products);
  const serializedRequests = toMonetizationRequestViews(requests);
  const serializedExpiredBoostRequests =
    toMonetizationRequestViews(expiredBoostRequests);

  return (
    <div className="space-y-8">
      <CategoriesManager />
      <AdminMonetizationRequests initialRequests={serializedRequests} />
      <AdminExpiredBoosts initialRequests={serializedExpiredBoostRequests} />
      <AdminModerationPanel initialProducts={serializedProducts} />
    </div>
  );
}
