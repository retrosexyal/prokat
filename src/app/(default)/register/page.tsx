import { Suspense } from "react";
import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Регистрация",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Загрузка...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
