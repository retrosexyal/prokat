"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error === "EMAIL_NOT_VERIFIED") {
      setErr("Письмо подтверждения отправлено");
    } else if (res?.error === "VERIFY_COOLDOWN") {
      setErr("Письмо уже отправлено. Подождите минуту.");
    } else if (res?.error) {
      setErr("Неверный email или пароль");
    } else {
      router.push("/");
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        type="email"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        type="password"
      />
      <button type="submit">Войти</button>
      {err && <p>{err}</p>}
    </form>
  );
}
