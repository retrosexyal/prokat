import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-border-subtle bg-white p-6 shadow-sm sm:p-10">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-black">
            Ошибка 404
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Страница не найдена
          </h1>

          <p className="mt-4 text-sm leading-6 text-zinc-600 sm:text-base">
            Возможно, ссылка устарела, страница была удалена или адрес введён с
            ошибкой.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-3 text-sm font-semibold text-black transition hover:bg-accent"
            >
              На главную
            </Link>

            <Link
              href="/all"
              className="inline-flex items-center justify-center rounded-full border border-border-subtle bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Открыть каталог
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}