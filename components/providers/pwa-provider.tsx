"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that powers installability and the offline
 * fallback. Registration is production-only by default so `next dev` is not
 * affected by stale cached assets. Set NEXT_PUBLIC_PWA_DEV=1 to test locally
 * against a dev server, or use `yarn build && yarn start`.
 */
export default function PwaProvider() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const enabled =
      process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_PWA_DEV === "1";

    if (!enabled) {
      // A SW registered earlier from `next start` / a preview on this origin
      // would otherwise keep serving stale chunks against `next dev`.
      void cleanupDevServiceWorker();
      return;
    }

    let cancelled = false;

    const register = () => {
      if (cancelled) return;
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
        console.warn("[pwa] Service worker registration failed:", err);
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}

async function cleanupDevServiceWorker() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => {
          const worker =
            registration.active ?? registration.waiting ?? registration.installing;
          if (!worker) return false;
          return new URL(worker.scriptURL).pathname === "/sw.js";
        })
        .map((registration) => registration.unregister()),
    );

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith("pharmasuite-")).map((key) => caches.delete(key)),
      );
    }
  } catch (err) {
    console.warn("[pwa] Dev service worker cleanup skipped:", err);
  }
}
