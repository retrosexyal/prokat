import Link from "next/link";
import { getCurrentCityForPath } from "@/lib/request-city";

type HeaderCurrentCityProps = {
  pathname: string;
};

export async function HeaderCurrentCity({ pathname }: HeaderCurrentCityProps) {
  const city = await getCurrentCityForPath(pathname);

  return (
    <Link
      href={`/${city.slug}`}
      className="hidden rounded-full border border-border-subtle bg-white px-3 py-2 text-xs text-zinc-700 transition hover:bg-zinc-50 sm:inline-flex sm:items-center sm:text-sm"
      title={`Открыть каталог в ${city.nameIn}`}
    >
      Сейчас: {city.name}
    </Link>
  );
}
