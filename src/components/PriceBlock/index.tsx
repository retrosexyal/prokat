"use client";

import { useMemo, useState } from "react";

type Props = {
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
};

type PriceTab = {
  key: "day" | "week" | "month";
  label: string;
  suffix: string;
  price: number;
};

export function PriceBlock({
  pricePerDay,
  pricePerWeek,
  pricePerMonth,
}: Props) {
  const tabs = useMemo<PriceTab[]>(() => {
    return [
      {
        key: "day",
        label: "Сутки",
        suffix: "/ сутки",
        price: pricePerDay,
      },
      ...(pricePerWeek && pricePerWeek > 0
        ? [
            {
              key: "week" as const,
              label: "Неделя",
              suffix: "/ неделя",
              price: pricePerWeek,
            },
          ]
        : []),
      ...(pricePerMonth && pricePerMonth > 0
        ? [
            {
              key: "month" as const,
              label: "Месяц",
              suffix: "/ месяц",
              price: pricePerMonth,
            },
          ]
        : []),
    ];
  }, [pricePerDay, pricePerWeek, pricePerMonth]);

  const [activeKey, setActiveKey] = useState<PriceTab["key"]>("day");

  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  return (
    <div className="space-y-2">
      {tabs.length > 1 ? (
        <div className="flex w-fit rounded-full bg-zinc-100 p-1">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveKey(tab.key)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  isActive
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold">{activeTab.price} BYN</span>
        <span className="text-sm text-gray-500">{activeTab.suffix}</span>
      </div>
    </div>
  );
}