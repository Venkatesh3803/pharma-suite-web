/*
 * PharmaSuite service worker.
 *
 * Deliberately conservative:
 *  - Never caches /api/* (auth-sensitive, always live).
 *  - Never caches authenticated HTML (avoids showing stale/other-user pages).
 *  - Caches only immutable build assets (/_next/static) and the public icons.
 *  - Serves a static offline fallback for failed page navigations.
 *
 * Bump VERSION whenever PRECACHE or the caching strategy changes.
 */
const VERSION = "v1";
const STATIC_CACHE = `pharmasuite-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];
const MAX_ENTRIES = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // allSettled: one missing asset must not prevent the SW from installing.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      // Do NOT auto-skipWaiting. A waiting worker activates after the last
      // open tab closes, so an in-flight session never loses its old chunks
      // when `activate` clears the previous cache.
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("pharmasuite-") && key !== STATIC_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
});

const PROTECTED_PATHS = new Set(PRECACHE);

function isCacheableAsset(pathname) {
  // Keep this allow-list narrow: only build output and our own public icons
  // are safe to persist. Never cache app-served or user-uploaded files.
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/apple-icon.png" ||
    pathname === "/favicon.ico"
  );
}

async function trimCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= MAX_ENTRIES) return;

  // Never evict the offline page or icons — they are inserted first and would
  // otherwise be the first entries dropped once lots of chunks are cached.
  const removable = keys.filter(
    (key) => !PROTECTED_PATHS.has(new URL(key.url).pathname),
  );
  const excess = keys.length - MAX_ENTRIES;
  await Promise.all(removable.slice(0, excess).map((key) => cache.delete(key)));
}

async function staticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      try {
        await cache.put(request, response.clone());
        await trimCache(STATIC_CACHE);
      } catch {
        // Cache write failed (quota/storage) — the network response is still valid.
      }
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function navigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    const offline = await cache.match(OFFLINE_URL);
    return (
      offline ||
      new Response("You are offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigation(request));
    return;
  }

  if (isCacheableAsset(url.pathname)) {
    event.respondWith(staticAsset(request));
  }
});
