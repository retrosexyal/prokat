import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { isAdminEmail } from "@/lib/auth";
import {
  getAllProductsForAdmin,
  getExpiredBoostedProducts,
  getPendingProducts,
} from "@/lib/products";
import { getMonetizationRequestsForAdmin } from "@/lib/monetization-requests";
import { toProductViews } from "@/lib/product-mappers";
import { toMonetizationRequestViews } from "@/lib/monetization-mappers";
import { AdminTabs } from "./AdminTabs";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isAdminEmail(session.user?.email)) {
    redirect("/");
  }

  const [pendingProducts, allProducts, requests, expiredBoostedProducts] =
    await Promise.all([
      getPendingProducts(),
      getAllProductsForAdmin(),
      getMonetizationRequestsForAdmin({ includeProcessed: true }),
      getExpiredBoostedProducts(),
    ]);

  const expiredBoostRequests = requests.filter((request) => {
    const productId = request.productId?.toString();

    return expiredBoostedProducts.some(
      (product) => product._id?.toString() === productId,
    );
  });

  return (
    <AdminTabs
      pendingProducts={toProductViews(pendingProducts)}
      allProducts={toProductViews(allProducts)}
      monetizationRequests={toMonetizationRequestViews(requests)}
      expiredBoostRequests={toMonetizationRequestViews(expiredBoostRequests)}
    />
  );
}