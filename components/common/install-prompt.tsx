"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pharmasuite_install_prompt_dismissed";

/**
 * Small, dismissible install call-to-action.
 * - Chrome/Edge/Android: uses the native `beforeinstallprompt` flow.
 * - iOS Safari: shows "Share → Add to Home Screen" instructions after a delay
 *   because iOS does not expose an install prompt.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setInstalled(standalone);
    if (standalone) return;

    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // storage unavailable — still allow the prompt
    }

    const ua = navigator.userAgent;
    // iPadOS 13+ identifies as "Macintosh"; maxTouchPoints distinguishes it
    // from a real Mac (where "Add to Home Screen" does not exist).
    const ios =
      /iphone|ipad|ipod/i.test(ua) ||
      (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt — surface manual instructions.
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (ios) {
      timer = setTimeout(() => setVisible(true), 8000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      setVisible(false);
      if (choice.outcome === "dismissed") dismiss();
    } catch {
      // The prompt can only be used once per event; if that fails, dismiss
      // quietly and let the browser's own install menu handle it.
      setDeferred(null);
      dismiss();
    }
  };

  if (!visible || installed) return null;

  return (
    <div
      role="region"
      aria-label="Install PharmaSuite"
      className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-sm"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-deep text-paper">
          <Download size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[14px] font-semibold text-ink">
            Install PharmaSuite
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-ink/60">
            {isIos
              ? "Tap the Share button, then choose “Add to Home Screen” to install."
              : "Add PharmaSuite to your device for quick, full-screen access."}
          </p>
          {!isIos && deferred && (
            <button
              type="button"
              onClick={install}
              className="mt-2.5 cursor-pointer rounded-lg bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper transition-colors hover:bg-teal-deep"
            >
              Install app
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="cursor-pointer rounded-md p-1 text-ink/35 transition-colors hover:bg-paper-dim hover:text-ink/60"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
