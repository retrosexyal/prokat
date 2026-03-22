"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
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
    } else if (res?.error === "USE_GOOGLE_LOGIN") {
      setErr(
        "Этот аккаунт зарегистрирован через Google. Войдите через Google.",
      );
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

  async function onGoogleLogin() {
    await signIn("google", { callbackUrl });
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

      <Button
        type="button"
        onClick={onGoogleLogin}
        newClasses="flex items-center justify-center gap-3
    w-full h-14
    rounded-full
    border border-zinc-300
    bg-white text-zinc-900
    hover:bg-zinc-50 hover:border-zinc-400
    transition-colors duration-200
    shadow-sm
    font-medium"
      >
        <Image
          src="/assets/googleColor.svg"
          alt="Google"
          width={18}
          height={18}
          className="shrink-0"
        />
        <span className="text-base font-medium">Войти через Google</span>
      </Button>

      <div className="text-center text-sm text-zinc-400">или</div>

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

      <div className="flex justify-between text-sm text-zinc-600">
        <Link
          href={
            callbackUrl !== "/"
              ? `/forgot-password?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/forgot-password"
          }
          className="font-medium text-accent-strong hover:underline"
        >
          Забыли пароль?
        </Link>

        <span>
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
        </span>
      </div>
    </form>
  );
}
