import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { LogoutButton } from "@/components/LogoutButton";
import clientPromise from "@/lib/mongodb";
import { getProductsByOwner } from "@/lib/products";
import { toProductViews } from "@/lib/product-mappers";
import type { UserType } from "@/types";
import type { ProductDoc, ProductView } from "@/types/product";
import { UserProductForm } from "./UserProductForm";
import { getBookingsForOwner } from "@/lib/bookings";
import { toBookingViews } from "@/lib/booking-mappers";
import type { BookingView } from "@/types/booking";
import { ProfileSettings } from "@/components/ProfileSettings";


export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  let myProducts: ProductDoc[] = [];
  let myBookings: BookingView[] = [];
  let userProfile: Pick<UserType, "name" | "phone" | "showPhoneInProducts"> = {
    name: "",
    phone: "",
    showPhoneInProducts: false,
  };

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

      userProfile = {
        name: user.name ?? "",
        phone: user.phone ?? "",
        showPhoneInProducts: Boolean(user.showPhoneInProducts),
      };
    }
  }

  const initialProducts: ProductView[] = toProductViews(myProducts);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Личный кабинет</h1>

      <div className="text-sm text-muted">
        {session?.user?.email
          ? `Вы вошли как ${session.user.email}`
          : "Вы вошли."}
      </div>

      <LogoutButton />

      <ProfileSettings
        initialName={userProfile.name}
        initialPhone={userProfile.phone}
        initialShowPhoneInProducts={userProfile.showPhoneInProducts}
      />

      <UserProductForm
        initialProducts={initialProducts}
        initialBookings={myBookings}
      />
    </div>
  );
}