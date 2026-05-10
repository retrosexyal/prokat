import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Контакты | Prokatik.by",
  description:
    "Свяжитесь с Prokatik.by по вопросам аренды товаров, размещения объявлений и работы платформы.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-subtle bg-gradient-to-r from-accent/30 via-accent/10 to-transparent px-4 py-6 sm:px-8 sm:py-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl">
            Связаться с Prokatik.by
          </h1>

          <p className="mt-4 text-sm leading-6 text-zinc-600 sm:text-base">
            Напишите нам через форму или используйте прямые ссылки на email и
            Instagram.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ContactForm />

        <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-900">
            Прямые контакты
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <a
              href="mailto:prokatik.mail@gmail.com"
              className="block rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-700 transition hover:bg-white"
            >
              <span className="block text-xs text-zinc-500">Email</span>
              <span className="font-medium">prokatik.mail@gmail.com</span>
            </a>

            <a
              href="https://www.instagram.com/prokatik_/"
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-700 transition hover:bg-white"
            >
              <span className="block text-xs text-zinc-500">Instagram</span>
              <span className="font-medium">@prokatik_</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}