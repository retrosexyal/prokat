"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
    >
      Выйти
    </button>
  );
}

