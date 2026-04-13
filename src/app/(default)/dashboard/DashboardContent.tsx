"use client";

import { useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { ProfileSettings } from "@/components/ProfileSettings";
import { UserProductForm } from "./UserProductForm";
import type { BookingView } from "@/types/booking";
import type { CategoryView } from "@/types/category";
import type { MonetizationRequestView } from "@/types/monetization";
import type { ProductView } from "@/types/product";

type DashboardTabKey = "profile" | "add-product" | "products" | "bookings";

const TABS: Array<{ key: DashboardTabKey; label: string }> = [
  { key: "profile", label: "Личные данные" },
  { key: "add-product", label: "Добавление товара" },
  { key: "products", label: "Лимиты и товары" },
  { key: "bookings", label: "Бронирование товаров" },
];

type Props = {
  userEmail?: string | null;
  initialName?: string;
  initialPhone?: string;
  initialPickupAddress?: string;
  initialShowPhoneInProducts?: boolean;
  initialProducts: ProductView[];
  initialBookings: BookingView[];
  categories: CategoryView[];
  currentProductLimit: number;
  initialMonetizationRequests: MonetizationRequestView[];
};

export function DashboardContent({
  userEmail,
  initialName = "",
  initialPhone = "",
  initialPickupAddress = "",
  initialShowPhoneInProducts = false,
  initialProducts,
  initialBookings,
  categories,
  currentProductLimit,
  initialMonetizationRequests,
}: Props) {
  const [activeTab, setActiveTab] = useState<DashboardTabKey>("profile");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
        <h1 className="text-2xl font-semibold text-center sm:text-3xl">
          Личный кабинет
        </h1>

        <div className="mt-3 text-sm text-muted mx-auto flex flex-col gap-2 max-w-sm text-center">
          {userEmail ? `Вы вошли как ${userEmail}` : "Вы вошли."}
          <LogoutButton />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-900",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "profile" ? (
        <ProfileSettings
          initialName={initialName}
          initialPhone={initialPhone}
          initialShowPhoneInProducts={initialShowPhoneInProducts}
          initialPickupAddress={initialPickupAddress}
        />
      ) : null}

      {activeTab !== "profile" ? (
        <UserProductForm
          initialProducts={initialProducts}
          initialBookings={initialBookings}
          initialPickupAddress={initialPickupAddress}
          categories={categories}
          currentProductLimit={currentProductLimit}
          initialMonetizationRequests={initialMonetizationRequests}
          dashboardSection={
            activeTab === "add-product"
              ? "editor"
              : activeTab === "products"
                ? "manage"
                : "bookings"
          }
          onRequestEditorSection={() => setActiveTab("add-product")}
        />
      ) : null}
    </div>
  );
}
