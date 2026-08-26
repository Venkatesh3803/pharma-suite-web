"use client";

import { useEffect, useState } from "react";
import { salesApi, type CreateSaleInput } from "@/lib/api";

const QUEUE_KEY = "pharmasuite_offline_queue";
const LOG_KEY = "pharmasuite_offline_synclog";
const CHANNEL = "pharmasuite-offline-sync";
const EVENT = "offlineQueueChanged";

export interface QueuedSale {
  id: string;
  clientSaleId: string;
  createdAt: string;
  payload: CreateSaleInput;
  attempts: number;
  lastError?: string;
  summary?: { labels: string[]; total: number };
}

export interface SyncLogEntry {
  at: string;
  synced: number;
  failed: number;
}

const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
  window.dispatchEvent(new CustomEvent(EVENT));
  try {
    new BroadcastChannel(CHANNEL).postMessage({ type: EVENT });
  } catch {
    // BroadcastChannel unsupported — localStorage event still covers other tabs.
  }
}

export function newClientSaleId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readQueue(): QueuedSale[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedSale[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedSale[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // storage full / unavailable — drop silently
  }
  notify();
}

function readLog(): SyncLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as SyncLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function getPendingSales(): QueuedSale[] {
  return readQueue();
}

export function getPendingCount(): number {
  return readQueue().length;
}

export function getSyncLog(): SyncLogEntry[] {
  return readLog().reverse();
}

export function enqueueSale(
  payload: CreateSaleInput,
  summary?: { labels: string[]; total: number },
): QueuedSale {
  const clientSaleId = payload.clientSaleId ?? newClientSaleId();
  const item: QueuedSale = {
    id: clientSaleId,
    clientSaleId,
    createdAt: new Date().toISOString(),
    payload: { ...payload, clientSaleId },
    attempts: 0,
    summary,
  };
  const queue = readQueue();
  if (!queue.some(q => q.clientSaleId === item.clientSaleId)) {
    queue.push(item);
    writeQueue(queue);
  }
  return item;
}

export function removeQueuedSale(id: string) {
  writeQueue(readQueue().filter(q => q.id !== id));
}

export function clearQueue() {
  writeQueue([]);
}

export function subscribeToQueue(cb: () => void): () => void {
  listeners.add(cb);
  const onCustom = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === QUEUE_KEY) cb();
  };
  window.addEventListener(EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => cb();
  } catch {
    // unsupported
  }
  return () => {
    listeners.delete(cb);
    window.removeEventListener(EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
    channel?.close();
  };
}

export function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  const msg = e instanceof Error ? e.message : String(e);
  return /failed to fetch|networkerror|network request failed|load failed|timed out/i.test(msg);
}

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const queue = readQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  for (const item of queue) {
    try {
      await salesApi.create({ ...item.payload, clientSaleId: item.clientSaleId });
      synced += 1;
    } catch (e) {
      if (isNetworkError(e)) {
        // Still offline — leave the rest queued and try again later.
        break;
      }
      // Terminal rejection (validation, stock, etc.) — drop it and log.
      failed += 1;
    }
    writeQueue(readQueue().filter(q => q.id !== item.id));
  }

  const log = readLog();
  log.push({ at: new Date().toISOString(), synced, failed });
  writeLog(log);
  notify();
  return { synced, failed };
}

function writeLog(log: SyncLogEntry[]) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-50)));
  } catch {
    // ignore
  }
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}