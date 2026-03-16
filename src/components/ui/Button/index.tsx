import { ButtonHTMLAttributes } from "react";

export function Button({
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-3 text-sm font-semibold text-black hover:bg-accent hover:cursor-pointer"
    >
      {children}
    </button>
  );
}
