import { Suspense } from "react";
import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Сброс пароля",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Загрузка...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
