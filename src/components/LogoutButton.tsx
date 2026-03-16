"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/Button";

export function LogoutButton() {
  return (
    <Button type="button" onClick={() => signOut({ callbackUrl: "/" })}>
      Выйти
    </Button>
  );
}
