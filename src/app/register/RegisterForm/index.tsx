"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterForm() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrlParam = searchParams.get("callbackUrl");
  const callbackUrl =
    callbackUrlParam &&
    callbackUrlParam.startsWith("/") &&
    !callbackUrlParam.startsWith("//")
      ? callbackUrlParam
      : "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, callbackUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "Ошибка регистрации");
        return;
      }

      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (login?.error === "EMAIL_NOT_VERIFIED") {
        setSuccess(
          "Аккаунт создан. Мы отправили письмо для подтверждения email. После подтверждения войдите в аккаунт.",
        );
        return;
      }

      if (login?.error === "VERIFY_COOLDOWN") {
        setSuccess(
          "Аккаунт создан. Письмо уже отправлено ранее, подождите немного и проверьте почту.",
        );
        return;
      }

      if (login?.error) {
        setErr("Аккаунт создан, но войти не удалось");
        return;
      }

      window.location.href = callbackUrl;
    } catch {
      setErr("Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-1 flex-col gap-3 p-4 mx-auto w-full max-w-md"
    >
      <div className="mb-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Регистрация</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Создайте аккаунт, чтобы бронировать товары
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

      <Button type="submit" disabled={loading}>
        {loading ? "Создание..." : "Создать аккаунт"}
      </Button>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <p className="text-sm text-zinc-600">
        Уже есть аккаунт?{" "}
        <Link
          href={
            callbackUrl !== "/"
              ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/login"
          }
          className="font-medium text-accent-strong hover:underline"
        >
          Войти
        </Link>
      </p>
    </form>
  );
}