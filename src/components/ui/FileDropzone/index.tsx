"use client";

import { useId, useRef, useState } from "react";

type Props = {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  helperText?: string;
};

export function FileDropzone({
  onChange,
  accept = "image/jpeg,image/png,image/webp",
  multiple = true,
  disabled = false,
  maxFiles,
  helperText = "JPEG, PNG, WEBP",
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  function openFileDialog(): void {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    if (disabled) return;
    setIsDragActive(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragActive(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    if (disabled) return;

    setIsDragActive(false);

    const files = event.dataTransfer.files;
    if (!files || files.length === 0 || !inputRef.current) {
      return;
    }

    const dataTransfer = new DataTransfer();
    Array.from(files).forEach((file) => dataTransfer.items.add(file));
    inputRef.current.files = dataTransfer.files;

    const syntheticEvent = {
      target: inputRef.current,
      currentTarget: inputRef.current,
    } as React.ChangeEvent<HTMLInputElement>;

    void onChange(syntheticEvent);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFileDialog();
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-labelledby={`${inputId}-title`}
        aria-describedby={`${inputId}-desc`}
        onClick={openFileDialog}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "group rounded-2xl border-2 border-dashed bg-white p-5 text-center transition",
          "sm:p-6",
          disabled
            ? "cursor-not-allowed border-zinc-200 opacity-60"
            : "cursor-pointer",
          isDragActive
            ? "border-accent-strong bg-yellow-50"
            : "border-border-subtle hover:border-accent-strong hover:bg-yellow-50/50",
        ].join(" ")}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/60 text-zinc-900 transition group-hover:bg-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16V7m0 0-3 3m3-3 3 3M6 16.5A3.5 3.5 0 0 1 7.2 9.7a5 5 0 0 1 9.6 1 3.5 3.5 0 0 1 0 6.8"
            />
          </svg>
        </div>

        <div
          id={`${inputId}-title`}
          className="mt-3 text-sm font-semibold text-zinc-900 sm:text-base"
        >
          {isDragActive ? "Отпустите файлы здесь" : "Перетащите изображения сюда"}
        </div>

        <div
          id={`${inputId}-desc`}
          className="mt-1 text-xs text-zinc-500 sm:text-sm"
        >
          или нажмите, чтобы выбрать файлы
        </div>

        <div className="mt-3 inline-flex rounded-full border border-border-subtle bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition group-hover:border-accent-strong">
          Выбрать изображения
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          {helperText}
          {maxFiles ? ` • до ${maxFiles} файлов` : ""}
        </div>
      </div>
    </div>
  );
}