"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

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
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "Ошибка");
      } else {
        setMsg("Если такой email существует, письмо для сброса пароля отправлено.");
      }
    } catch {
      setErr("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-1 flex-col gap-3 p-4 mx-auto w-full max-w-md"
    >
      <h1 className="text-2xl font-semibold text-zinc-900">Восстановление пароля</h1>

      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        type="email"
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Отправка..." : "Отправить ссылку"}
      </Button>

      {msg ? <p className="text-sm text-green-600">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <Link href="/login" className="text-sm text-accent-strong hover:underline">
        Назад ко входу
      </Link>
    </form>
  );
}