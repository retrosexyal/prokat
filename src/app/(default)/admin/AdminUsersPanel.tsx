"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import type { AdminUserView } from "@/types/admin";

function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? "Не удалось изменить лимит";
  }
  return "Не удалось изменить лимит";
}

export function AdminUsersPanel({ initialUsers }: { initialUsers: AdminUserView[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [draftLimits, setDraftLimits] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialUsers.map((user) => [user._id, String(user.productLimit)])),
  );
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.email, user.name ?? "", user.phone ?? "", user._id]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, users]);

  async function saveLimit(user: AdminUserView): Promise<void> {
    setError("");
    setMessage("");
    setLoadingId(user._id);

    try {
      const productLimit = Number(draftLimits[user._id]);
      await api.patch(API_ROUTES.adminUserById(user._id), { productLimit });
      setUsers((prev) =>
        prev.map((item) => (item._id === user._id ? { ...item, productLimit } : item)),
      );
      setMessage(`Лимит для ${user.email} изменён на ${productLimit}`);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">Пользователи</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Установите точный лимит товаров для выбранного пользователя.
          </p>
        </div>
        <div className="text-sm text-zinc-500">Всего: {users.length}</div>
      </div>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}
      {message ? <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}

      <label className="mb-5 flex flex-col gap-1 text-sm text-zinc-700">
        Поиск пользователя
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Email, имя, телефон или id..."
          className="rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-900"
        />
      </label>

      <div className="space-y-3">
        {filteredUsers.map((user) => {
          const isLoading = loadingId === user._id;
          const hasChanged = draftLimits[user._id] !== String(user.productLimit);
          return (
            <article key={user._id} className="rounded-xl border border-border-subtle p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="space-y-1 text-sm">
                  <div className="text-base font-semibold">{user.name?.trim() || "Без имени"}</div>
                  <div>{user.email}</div>
                  <div className="text-zinc-500">{user.phone?.trim() || "Телефон не указан"}</div>
                  <div className="text-zinc-500">
                    Товаров сейчас: {user.productCount} · зарегистрирован: {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1 text-sm">
                    Лимит товаров
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      step={1}
                      value={draftLimits[user._id]}
                      onChange={(event) => setDraftLimits((prev) => ({ ...prev, [user._id]: event.target.value }))}
                      className="w-32 rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={isLoading || !hasChanged}
                    onClick={() => saveLimit(user)}
                    className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {isLoading ? "Сохраняем..." : "Сохранить"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {filteredUsers.length === 0 ? <div className="rounded-xl border p-6 text-center text-sm text-zinc-500">Пользователи не найдены.</div> : null}
      </div>
    </section>
  );
}
