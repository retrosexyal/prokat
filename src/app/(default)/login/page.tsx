import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Вход",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Загрузка...</div>}>
      <LoginForm />
    </Suspense>
  );
}
