import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { SessionProviderClient } from "@/components/providers/SessionProviderClient";
import { LayoutHeader } from "@/components/LayoutHeader";

export const metadata: Metadata = {
  title: "Prokatik.by — аренда товаров по Беларуси",
  description:
    "Платформа аренды товаров по Беларуси: инструменты, техника, товары для дома, отдыха и других задач.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-background text-foreground">
        <div className="bg-accent text-xs text-black sm:text-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2">
            <span className="font-medium">
              Новый сервис · взять в аренду за 3 минуты
            </span>
            <span className="hidden sm:inline">
              Беларусь · Быстрая выдача и понятные условия
            </span>
          </div>
        </div>

        <LayoutHeader />

        <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <SessionProviderClient>{children}</SessionProviderClient>
        </main>

        <footer className="mt-10 border-t border-border-subtle bg-header">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <span>© {new Date().getFullYear()} Prokatik.by · Беларусь</span>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link
                href="/terms"
                className="transition-colors hover:text-zinc-300"
              >
                Условия аренды
              </Link>
              <Link
                href="/responsibility"
                className="transition-colors hover:text-zinc-300"
              >
                Ответственность арендатора
              </Link>
              <Link
                href="/rules"
                className="transition-colors hover:text-zinc-300"
              >
                Правила размещения
              </Link>
              <Link
                href="/agreement"
                className="transition-colors hover:text-zinc-300"
              >
                Пользовательское соглашение
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}