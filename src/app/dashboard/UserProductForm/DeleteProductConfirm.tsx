"use client";

import { useState } from "react";

type DeleteProductConfirmProps = {
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteProductConfirm({
  loading,
  onCancel,
  onConfirm,
}: DeleteProductConfirmProps) {
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText.trim().toLowerCase() === "удалить";

  return (
    <div className="space-y-4">
      <input
        className="w-full rounded-md border px-3 py-2 text-sm"
        value={confirmText}
        onChange={(event) => setConfirmText(event.target.value)}
        placeholder='Введите "удалить"'
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-full border px-4 py-2 text-sm disabled:opacity-60"
        >
          Отмена
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={!canDelete || loading}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Удаление..." : "Удалить"}
        </button>
      </div>
    </div>
  );
}
