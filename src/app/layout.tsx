import "./globals.css";
import Image from "next/image";
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
    index: true,
    follow: true,
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
            <div className="mx-auto max-w-6xl px-4 py-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <span className="block text-sm text-zinc-500">
                    © {new Date().getFullYear()} Prokatik.by · Беларусь
                  </span>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href="mailto:prokatik.mail@gmail.com"
                      className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                      aria-label="Написать на email Prokatik"
                    >
                      <Image
                        src="/icons/email.svg"
                        alt=""
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px]"
                      />
                      <span>prokatik.mail@gmail.com</span>
                    </a>

                    <a
                      href="https://www.instagram.com/prokatik_/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                      aria-label="Открыть Instagram Prokatik"
                    >
                      <Image
                        src="/icons/instagram.svg"
                        alt=""
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px]"
                      />
                      <span>@prokatik_</span>
                    </a>
                  </div>
                </div>

                <div className="flex max-w-2xl flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500 sm:justify-end sm:text-sm">
                  <Link
                    href="/contact"
                    className="transition-colors hover:text-zinc-900"
                  >
                    Контакты
                  </Link>

                  <Link
                    href="/terms"
                    className="transition-colors hover:text-zinc-900"
                  >
                    Условия аренды
                  </Link>

                  <Link
                    href="/responsibility"
                    className="transition-colors hover:text-zinc-900"
                  >
                    Ответственность арендатора
                  </Link>

                  <Link
                    href="/rules"
                    className="transition-colors hover:text-zinc-900"
                  >
                    Правила размещения
                  </Link>

                  <Link
                    href="/agreement"
                    className="transition-colors hover:text-zinc-900"
                  >
                    Пользовательское соглашение
                  </Link>

                  <Link
                    href="/privacy"
                    className="transition-colors hover:text-zinc-900"
                  >
                    Политика обработки персональных данных
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </SessionProviderClient>
      </body>
    </html>
  );
}