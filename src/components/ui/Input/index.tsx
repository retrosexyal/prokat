import { InputHTMLAttributes } from "react";

export function Input({ ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
      {...rest}
    />
  );
}
