"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = useMemo(() => {
    const raw = searchParams.get("callbackUrl");

    if (raw && raw.startsWith("/")) {
      return raw;
    }

    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("post-login-callback-url");
      if (saved && saved.startsWith("/")) {
        return saved;
      }
    }

    return "/";
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("post-login-callback-url", callbackUrl);
  }, [callbackUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (res?.error === "EMAIL_NOT_VERIFIED") {
      setErr(
        "Письмо подтверждения отправлено. Подтвердите email и войдите снова.",
      );
    } else if (res?.error === "VERIFY_COOLDOWN") {
      setErr("Письмо уже отправлено. Подождите минуту.");
    } else if (res?.error) {
      setErr("Неверный email или пароль");
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("post-login-callback-url");
      }

      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-1 flex-col gap-3 p-4 mx-auto w-full max-w-md"
    >
      <div className="mb-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Вход</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Войдите в аккаунт, чтобы бронировать товары
        </p>
      </div>

      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        type="email"
      />
      <Input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        type="password"
      />
      <Button type="submit">Войти</Button>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <p className="text-sm text-zinc-600">
        Нет аккаунта?{" "}
        <Link
          href={
            callbackUrl !== "/"
              ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/register"
          }
          className="font-medium text-accent-strong hover:underline"
        >
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}