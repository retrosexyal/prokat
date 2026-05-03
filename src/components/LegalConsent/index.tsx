"use client";

import Link from "next/link";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
  label?: string;
};

export function LegalConsent({
  checked,
  onChange,
  id = "legal-consent",
  className = "",
  label = "Я ознакомлен(а) и согласен(на) с Пользовательским соглашением и Политикой обработки персональных данных.",
}: Props) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-2 text-xs leading-5 text-zinc-600 sm:text-sm ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 shrink-0"
        required
      />

      <span>
        {label}{" "}
        <Link
          href="/agreement"
          target="_blank"
          className="font-medium text-accent-strong hover:underline"
        >
          Пользовательское соглашение
        </Link>{" "}
        и{" "}
        <Link
          href="/privacy"
          target="_blank"
          className="font-medium text-accent-strong hover:underline"
        >
          Политика обработки персональных данных
        </Link>
        .
      </span>
    </label>
  );
}