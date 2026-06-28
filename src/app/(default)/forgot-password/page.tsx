import { Suspense } from "react";
import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Загрузка...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
