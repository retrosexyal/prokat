import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Загрузка...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
