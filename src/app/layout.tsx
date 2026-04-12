import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { SessionProviderClient } from "@/components/providers/SessionProviderClient";
import { CityCookieSync } from "@/components/CityCookieSync";
import { PwaInit } from "@/components/PwaInit";

export const metadata: Metadata = {
  metadataBase: new URL("https://prokatik.by"),
  title: "Prokatik.by — аренда товаров по Беларуси",
  description:
    "Платформа аренды товаров по Беларуси: инструменты, техника, товары для дома, отдыха и других задач.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Prokatik",
    description: "Аренда товаров в Беларуси",
    images: ["/og.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-background text-foreground">
        <SessionProviderClient>
          <PwaInit />
          <CityCookieSync />

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

          {children}

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
        </SessionProviderClient>
      </body>
    </html>
  );
}
