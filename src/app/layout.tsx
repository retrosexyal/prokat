import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prokat.net.by — прокат товаров в Могилёве",
  description: "Прокат инструментов и полезных вещей без залога.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-semibold">
              Prokat<span className="text-accent">.net.by</span>
            </Link>
            <nav className="flex gap-6 text-sm text-muted">
              <Link href="/catalog">Каталог</Link>
              <Link href="/terms">Условия</Link>
              <Link href="/responsibility">Ответственность</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-10">
          {children}
        </main>

        <footer className="border-t border-white/10 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-muted">
            © {new Date().getFullYear()} Prokat.net.by · Могилёв
          </div>
        </footer>
      </body>
    </html>
  );
}
