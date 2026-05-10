"use client";

import { useState } from "react";
import { CategoriesManager } from "./CategoriesManager";
import { AdminModerationPanel } from "./AdminModerationPanel";
import { AdminMonetizationRequests } from "./AdminMonetizationRequests";
import { AdminExpiredBoosts } from "./AdminExpiredBoosts";
import { AdminProductsPanel } from "./AdminProductsPanel";
import { AdminContactMessages } from "./AdminContactMessages";
import type { ProductView } from "@/types/product";
import type { MonetizationRequestView } from "@/types/monetization";
import type { CategoryView } from "@/types/category";
import type { ContactMessageView } from "@/types/contact-message";

type AdminTabKey =
  | "categories"
  | "moderation"
  | "monetization"
  | "expiredBoosts"
  | "products"
  | "messages";

const TABS: Array<{ key: AdminTabKey; label: string }> = [
  { key: "categories", label: "Категории" },
  { key: "moderation", label: "Заявки на модерацию" },
  { key: "monetization", label: "Монетизация" },
  { key: "expiredBoosts", label: "Истёкшие бусты" },
  { key: "products", label: "Товары" },
  { key: "messages", label: "Сообщения" },
];

type Props = {
  pendingProducts: ProductView[];
  allProducts: ProductView[];
  monetizationRequests: MonetizationRequestView[];
  expiredBoostRequests: MonetizationRequestView[];
  categories: CategoryView[];
  contactMessages: ContactMessageView[];
};

export function AdminTabs({
  pendingProducts,
  allProducts,
  monetizationRequests,
  expiredBoostRequests,
  categories,
  contactMessages,
}: Props) {
  const [activeTab, setActiveTab] = useState<AdminTabKey>("moderation");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Админ-панель</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Выберите нужный раздел сверху.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
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

      {activeTab === "categories" ? <CategoriesManager /> : null}

      {activeTab === "moderation" ? (
        <AdminModerationPanel
          initialProducts={pendingProducts}
          categories={categories}
        />
      ) : null}

      {activeTab === "monetization" ? (
        <AdminMonetizationRequests initialRequests={monetizationRequests} />
      ) : null}

      {activeTab === "expiredBoosts" ? (
        <AdminExpiredBoosts initialRequests={expiredBoostRequests} />
      ) : null}

      {activeTab === "products" ? (
        <AdminProductsPanel initialProducts={allProducts} />
      ) : null}

      {activeTab === "messages" ? (
        <AdminContactMessages initialMessages={contactMessages} />
      ) : null}
    </div>
  );
}