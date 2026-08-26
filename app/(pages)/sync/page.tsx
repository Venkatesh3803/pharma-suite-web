"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudOff,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Wifi,
  WifiOff,
} from "lucide-react";
import { formatDateTime } from "@/lib/inventory";
import {
  clearQueue,
  flushQueue,
  getPendingSales,
  getSyncLog,
  subscribeToQueue,
  useOnline,
  type QueuedSale,
  type SyncLogEntry,
} from "@/lib/offline-sync";
import { formatINR } from "@/lib/inventory";

export default function SyncPage() {
  const online = useOnline();
  const [pending, setPending] = useState<QueuedSale[]>(() => getPendingSales());
  const [log, setLog] = useState<SyncLogEntry[]>(() => getSyncLog());
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => {
    setPending(getPendingSales());
    setLog(getSyncLog());
  };

  useEffect(() => {
    return subscribeToQueue(refresh);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const syncNow = async () => {
    if (syncing || !online) return;
    setSyncing(true);
    try {
      const { synced, failed } = await flushQueue();
      setToast(
        synced + failed === 0
          ? "Queue is empty — nothing to sync."
          : `${synced} sale${synced === 1 ? "" : "s"} synced${failed ? `, ${failed} rejected` : ""}.`,
      );
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setSyncing(false);
      refresh();
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            POS Resilience Layer
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Offline Sync
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Sales settled while offline are queued on this device and auto-synced
            the moment the connection returns — with no duplicate invoices.
          </p>
        </div>
        <button
          onClick={syncNow}
          disabled={syncing || !online || pending.length === 0}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {syncing ? "Syncing…" : "Sync Now"}
        </button>
      </div>

      {/* ── Status cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          className={`rounded-2xl border p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)] ${
            online ? "border-line bg-white" : "border-danger/25 bg-danger-bg/50"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                Connection
              </div>
              <div className={`mt-1.5 font-display text-[20px] font-bold tracking-tight ${online ? "text-ink" : "text-danger"}`}>
                {online ? "Online" : "Offline"}
              </div>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${online ? "bg-teal-mid/10 text-teal-mid" : "bg-danger-bg text-danger"}`}>
              {online ? <Wifi size={16} /> : <WifiOff size={16} />}
            </div>
          </div>
          <div className="mt-2 text-[11.5px] text-ink/45">
            {online
              ? "Syncing enabled — queued sales will flush automatically."
              : "Queued sales will sync automatically when back online."}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                Queued Sales
              </div>
              <div className="mt-1.5 font-display text-[20px] font-bold tracking-tight text-ink">
                {pending.length}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stamp-dim text-stamp">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="mt-2 text-[11.5px] text-ink/45">
            {pending.length > 0
              ? `Total ${formatINR(pending.reduce((s, p) => s + (p.summary?.total ?? 0), 0))} awaiting upload.`
              : "No sales waiting to sync."}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                Last Sync
              </div>
              <div className="mt-1.5 font-display text-[20px] font-bold tracking-tight text-ink">
                {log.length > 0 ? formatDateTime(log[0].at).split(",")[0] : "Never"}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-mid/10 text-teal-mid">
              <Cloud size={16} />
            </div>
          </div>
          <div className="mt-2 text-[11.5px] text-ink/45">
            {log.length > 0
              ? `${log[0].synced} synced · ${log[0].failed} rejected at last attempt.`
              : "No sync activity recorded yet."}
          </div>
        </div>
      </div>

      {/* ── Queue ── */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
            Pending Queue
          </h3>
          {pending.length > 0 && (
            <button
              onClick={clearQueue}
              className="cursor-pointer text-[12px] font-semibold text-danger/70 transition-colors hover:text-danger"
            >
              Discard all
            </button>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-ink/40">
            <CloudOff size={28} className="opacity-40" />
            <div className="text-[13.5px]">Queue is empty — all sales are synced.</div>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-line/60">
            {pending.map(q => (
              <div key={q.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] text-ink/45">
                    Queued {formatDateTime(q.createdAt)}
                  </div>
                  {q.summary?.labels.length ? (
                    <div className="mt-0.5 text-[13px] text-ink/80">
                      {q.summary.labels.slice(0, 3).join(" · ")}
                      {q.summary.labels.length > 3 && ` · +${q.summary.labels.length - 3} more`}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-[13px] text-ink/80">
                      {q.payload.items.length} item{q.payload.items.length === 1 ? "" : "s"}
                    </div>
                  )}
                  <div className="text-[11.5px] text-ink/45">
                    {q.payload.paymentMode}
                    {q.payload.customerId ? " · customer attached" : " · walk-in"}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[14px] font-semibold text-ink">
                    {q.summary ? formatINR(q.summary.total) : "—"}
                  </div>
                  <span className="inline-block rounded-md border border-stamp/25 bg-stamp-dim px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stamp">
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sync history ── */}
      {log.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="border-b border-line px-5 py-4">
            <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
              Sync History
            </h3>
          </div>
          <div className="flex flex-col divide-y divide-line/60">
            {log.slice(0, 20).map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-2.5 text-[13px]">
                <span className="text-ink/60">{formatDateTime(entry.at)}</span>
                <span className="flex items-center gap-2">
                  {entry.synced > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-teal-mid">
                      <CheckCircle2 size={13} /> {entry.synced} synced
                    </span>
                  )}
                  {entry.failed > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-danger">
                      <AlertTriangle size={13} /> {entry.failed} rejected
                    </span>
                  )}
                  {entry.synced === 0 && entry.failed === 0 && (
                    <span className="text-ink/45">idle pass</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
          <Cloud size={16} className="text-teal-mid" />
          <span className="text-[13px] text-ink">{toast}</span>
        </div>
      )}
    </div>
  );
}