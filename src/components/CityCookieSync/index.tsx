"use client";

import { useEffect } from "react";

const STORAGE_KEY = "selectedCitySlug";
const COOKIE_KEY = "selectedCitySlug";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function CityCookieSync() {
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (
      saved === "mogilev" ||
      saved === "minsk" ||
      saved === "gomel" ||
      saved === "vitebsk" ||
      saved === "grodno" ||
      saved === "brest"
    ) {
      document.cookie = `${COOKIE_KEY}=${saved}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    }
  }, []);

  return null;
}