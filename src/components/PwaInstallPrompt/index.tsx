"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISS_KEY = "pwa-install-prompt-dismissed";

function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS
    ("standalone" in window.navigator &&
      Boolean(
        (
          window.navigator as Navigator & {
            standalone?: boolean;
          }
        ).standalone,
      ))
  );
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsInstalled(isInStandaloneMode());
    setIsDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const isIos = useMemo(() => isIosDevice(), []);
  const canShowIosHint = isIos && !isInstalled;
  const canShowNativePrompt = Boolean(deferredPrompt) && !isInstalled;

  function handleDismiss() {
    setIsDismissed(true);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
  }

  async function handleInstall() {
    if (!deferredPrompt) return;

    setLoading(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error("PWA install prompt failed:", error);
    } finally {
      setLoading(false);
    }
  }

  if (isInstalled || isDismissed) {
    return null;
  }

  if (canShowNativePrompt) {
    return (
      <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">Установить приложение</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Добавьте Prokatik на главный экран для быстрого доступа.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Не сейчас
            </button>

            <button
              type="button"
              onClick={handleInstall}
              disabled={loading}
              className="rounded-full bg-accent-strong px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {loading ? "Открываем..." : "Установить"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (canShowIosHint) {
    return (
      <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">Установить приложение</h2>
            <p className="mt-1 text-sm text-zinc-600">
              В Safari нажмите <span className="font-medium">Поделиться</span> и
              выберите <span className="font-medium">На экран “Домой”</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="self-start rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Понятно
          </button>
        </div>
      </section>
    );
  }

  return null;
}