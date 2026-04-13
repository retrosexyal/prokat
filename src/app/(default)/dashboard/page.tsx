import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { getProductsByOwner } from "@/lib/products";
import { toProductViews } from "@/lib/product-mappers";
import type { UserType } from "@/types";
import type { ProductDoc, ProductView } from "@/types/product";
import { getBookingsForOwner } from "@/lib/bookings";
import { toBookingViews } from "@/lib/booking-mappers";
import type { BookingView } from "@/types/booking";
import { getAllCategories } from "@/lib/categories";
import { CategoryDoc } from "@/types/category";
import { DashboardContent } from "./DashboardContent";
import { toCategoryView } from "@/lib/category-mappers";
import { getMonetizationRequestsForUser } from "@/lib/monetization-requests";
import { toMonetizationRequestViews } from "@/lib/monetization-mappers";
import type { MonetizationRequestView } from "@/types/monetization";

const FREE_PRODUCTS_LIMIT = 3;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  let myProducts: ProductDoc[] = [];
  let myBookings: BookingView[] = [];
  let myMonetizationRequests: MonetizationRequestView[] = [];
  let userProfile: Pick<
    UserType,
    "name" | "phone" | "showPhoneInProducts" | "pickupAddress"
  > = {
    name: "",
    phone: "",
    showPhoneInProducts: false,
    pickupAddress: "",
  };

  let categories: CategoryDoc[] = [];
  let productLimit = FREE_PRODUCTS_LIMIT;

  if (session?.user?.email) {
    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection<UserType>("users").findOne({
      email: session.user.email,
    });

    if (user?._id) {
      myProducts = await getProductsByOwner(String(user._id));

      const ownerBookings = await getBookingsForOwner(String(user._id));
      myBookings = toBookingViews(ownerBookings);

      const monetizationRequests = await getMonetizationRequestsForUser(
        user._id,
        {
          onlyActive: true,
        },
      );
      myMonetizationRequests = toMonetizationRequestViews(monetizationRequests);

      userProfile = {
        name: user.name ?? "",
        phone: user.phone ?? "",
        showPhoneInProducts: Boolean(user.showPhoneInProducts),
        pickupAddress: user.pickupAddress ?? "",
      };

      productLimit = user.productLimit ?? FREE_PRODUCTS_LIMIT;
      categories = await getAllCategories();
    }
  }

  const initialProducts: ProductView[] = toProductViews(myProducts);

  return (
    <DashboardContent
      userEmail={session?.user?.email}
      initialName={userProfile.name}
      initialPhone={userProfile.phone}
      initialShowPhoneInProducts={userProfile.showPhoneInProducts}
      initialPickupAddress={userProfile.pickupAddress}
      initialProducts={initialProducts}
      initialBookings={myBookings}
      categories={categories.map((cat) => toCategoryView(cat))}
      currentProductLimit={productLimit}
      initialMonetizationRequests={myMonetizationRequests}
    />
  );
}
