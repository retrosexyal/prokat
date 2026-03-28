"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const callbackUrl = useMemo(() => {
    const raw = searchParams.get("callbackUrl");
    return raw && raw.startsWith("/") ? raw : "/";
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setMsg("");

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "Ошибка");
      } else {
        setMsg("Пароль успешно изменён.");
        setTimeout(() => {
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }, 1200);
      }
    } catch {
      setErr("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="p-4 mx-auto w-full max-w-md">
        <p className="text-sm text-red-600">Отсутствует токен сброса пароля.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-1 flex-col gap-3 p-4 mx-auto w-full max-w-md"
    >
      <h1 className="text-2xl font-semibold text-zinc-900">Новый пароль</h1>

      <Input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Новый пароль"
        type="password"
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Сохранение..." : "Сохранить пароль"}
      </Button>

      {msg ? <p className="text-sm text-green-600">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <Link href="/login" className="text-sm text-accent-strong hover:underline">
        Назад ко входу
      </Link>
    </form>
  );
}