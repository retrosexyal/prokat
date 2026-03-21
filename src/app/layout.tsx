import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { SessionProviderClient } from "@/components/providers/SessionProviderClient";

export const metadata: Metadata = {
  title: "Prokat.by — прокат товаров в Могилёве",
  description: "Прокат инструментов и полезных вещей без залога.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-background text-foreground">
        {/* TOP STRIP */}
        <div className="bg-accent text-xs sm:text-sm text-black">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
            <span className="font-medium">
              Новый сервис · взять в аренду за 3 минуты
            </span>
            <span className="hidden sm:inline">
              Могилёв · Быстрая выдача и понятные условия
            </span>
          </div>
        </div>

        {/* MAIN HEADER */}
        <header className="bg-header border-b border-border-subtle">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-black font-bold text-lg">
                P
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-semibold">Prokat.net.by</span>
                <span className="text-[11px] text-zinc-500">
                  Товары в аренду · Могилёв
                </span>
              </div>
            </Link>

            {/* SEARCH (desktop) */}
            <form className="hidden md:flex flex-1 max-w-md items-center gap-2">
              <input
                type="search"
                placeholder="Поиск по каталогу"
                className="w-full rounded-full border border-border-subtle bg-white px-4 py-2 text-sm outline-none focus:border-accent-strong"
              />
            </form>

            <nav className="flex items-center gap-3 text-xs sm:text-sm">
              <Link
                href="/catalog"
                className="hidden sm:inline-flex px-3 py-2 rounded-md hover:bg-zinc-100"
              >
                Каталог
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full border border-accent-strong bg-accent px-4 py-2 text-xs sm:text-sm font-medium text-black hover:bg-accent-strong"
              >
                Личный кабинет
              </Link>
            </nav>
          </div>

          {/* SEARCH (mobile) */}
          <div className="md:hidden border-t border-border-subtle">
            <div className="max-w-6xl mx-auto px-4 py-3">
              <input
                type="search"
                placeholder="Поиск по каталогу"
                className="w-full rounded-full border border-border-subtle bg-white px-4 py-2 text-sm outline-none focus:border-accent-strong"
              />
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <SessionProviderClient>{children}</SessionProviderClient>
        </main>

        <footer className="border-t border-border-subtle mt-10 bg-header">
          <div className="max-w-6xl mx-auto px-4 py-6 text-xs sm:text-sm text-zinc-500 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Prokat.net.by · Могилёв</span>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link
                href="/terms"
                className="hover:text-zinc-300 transition-colors"
              >
                Условия аренды
              </Link>
              <Link
                href="/responsibility"
                className="hover:text-zinc-300 transition-colors"
              >
                Ответственность арендатора
              </Link>
              <Link
                href="/rules"
                className="hover:text-zinc-300 transition-colors"
              >
                Правила размещения
              </Link>
              <Link
                href="/agreement"
                className="hover:text-zinc-300 transition-colors"
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
