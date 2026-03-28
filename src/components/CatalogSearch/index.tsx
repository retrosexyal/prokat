"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isRegionSlug } from "@/lib/cities";

type CatalogSearchProps = {
  placeholder?: string;
  className?: string;
};

function getSearchBasePath(pathname: string): string {
  if (pathname === "/" || pathname === "/all") {
    return "/all";
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length >= 1 && isRegionSlug(segments[0])) {
    if (segments.length >= 2) {
      return `/${segments[0]}/${segments[1]}`;
    }

    return `/${segments[0]}`;
  }


  return "/all";
}

export function CatalogSearch({
  placeholder = "Поиск по каталогу",
  className = "",
}: CatalogSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryValue = searchParams.get("q") ?? "";

  const [value, setValue] = useState(queryValue);
  const [isPending, startTransition] = useTransition();

  const isEditingRef = useRef(false);
  const lastAppliedRef = useRef(queryValue);

  const setEffectValue = useEffectEvent((val: string) => setValue(val));

  useEffect(() => {
    const currentQuery = searchParams.get("q") ?? "";

    if (!isEditingRef.current) {
      setEffectValue(currentQuery);
    }

    lastAppliedRef.current = currentQuery;
  }, [searchParams]);

  useEffect(() => {
    isEditingRef.current = true;

    const timer = setTimeout(() => {
      const trimmed = value.trim();
      const currentQuery = searchParams.get("q") ?? "";

      if (trimmed === currentQuery) {
        isEditingRef.current = false;
        return;
      }

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("page");

        if (trimmed) {
          params.set("q", trimmed);
        } else {
          params.delete("q");
        }

        const basePath = getSearchBasePath(pathname);
        const target = params.toString()
          ? `${basePath}?${params.toString()}`
          : basePath;

        router.replace(target);

        lastAppliedRef.current = trimmed;
        isEditingRef.current = false;
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [value, pathname, router, searchParams]);

  function clearSearch() {
    isEditingRef.current = false;
    setValue("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");

    const basePath = getSearchBasePath(pathname);
    const nextUrl = params.toString() ? `${basePath}?${params.toString()}` : basePath;

    startTransition(() => {
      router.replace(nextUrl);
    });
  }

  return (
    <div className={`relative w-full min-w-0 ${className}`}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-full border border-border-subtle bg-white px-4 py-2 pr-12 text-sm outline-none focus:border-accent-strong"
      />

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {isPending && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700"
            aria-label="Загрузка"
          />
        )}

        {value && !isPending && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Очистить поиск"
            className="cursor-pointer text-zinc-500 transition-colors hover:text-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}