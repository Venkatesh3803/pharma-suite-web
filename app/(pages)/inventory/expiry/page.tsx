"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertTriangle, CalendarClock } from "lucide-react";
import {
  inventoryApi,
  type ExpiryItem,
  type ExpiryStatus,
} from "@/lib/api";
import {
  formatINR,
  formatDate,
  expiryStatusBadge,
  expiryStatusLabel,
} from "@/lib/inventory";

type LoadState = "loading" | "error" | "ready";
type BucketFilter = "ALL" | "EXPIRED" | "EXPIRING_30_DAYS" | "EXPIRING_60_DAYS" | "EXPIRING_90_DAYS";

function bucketOf(item: ExpiryItem): ExpiryStatus {
  if (item.daysToExpiry < 0) return "EXPIRED";
  if (item.daysToExpiry <= 30) return "EXPIRING_30_DAYS";
  if (item.daysToExpiry <= 60) return "EXPIRING_60_DAYS";
  if (item.daysToExpiry <= 90) return "EXPIRING_90_DAYS";
  return "HEALTHY";
}

const EMPTY_COUNTS: Record<ExpiryStatus, number> = {
  HEALTHY: 0,
  EXPIRED: 0,
  EXPIRING_30_DAYS: 0,
  EXPIRING_60_DAYS: 0,
  EXPIRING_90_DAYS: 0,
};

export default function ExpiryPage() {
  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<BucketFilter>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function fetchExpiry() {
      try {
        const data = await inventoryApi.expiry({ days: 180, pageSize: 50 });
        if (!ignore) {
          setItems(data.items);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load expiry data.");
          setState("error");
        }
      }
    }
    void fetchExpiry();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const retry = () => {
    setState("loading");
    setError("");
    setRefreshKey(k => k + 1);
  };

  const filtered =
    filter === "ALL" ? items : items.filter(i => bucketOf(i) === filter);
  const counts = items.reduce<Record<ExpiryStatus, number>>(
    (acc, i) => {
      acc[bucketOf(i)] += 1;
      return acc;
    },
    { ...EMPTY_COUNTS },
  );

  const tabBase =
    "cursor-pointer rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors";

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Link
          href="/inventory"
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink/55 transition-colors hover:text-stamp"
        >
          ← Back to Inventory
        </Link>
        <div className="mt-3">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Expiry Ledger
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Expiry Risk Register
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Batches within 180 days of expiry — prioritised by FEFO, with expired
            stock flagged for removal.
          </p>
        </div>
      </div>

      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <AlertTriangle size={32} className="text-danger/60" />
          <div>
            <div className="text-[14px] font-medium text-ink">Could not load expiry data.</div>
            <div className="mt-1 text-[12.5px] text-ink/50">{error}</div>
          </div>
          <button
            onClick={retry}
            className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Bucket tabs ── */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["ALL", "All"],
            ["EXPIRED", "Expired"],
            ["EXPIRING_30_DAYS", "< 30 days"],
            ["EXPIRING_60_DAYS", "< 60 days"],
            ["EXPIRING_90_DAYS", "< 90 days"],
          ] as [BucketFilter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`${tabBase} ${
              filter === key
                ? "bg-ink text-paper"
                : "border border-line bg-white text-ink/60 hover:bg-paper-dim"
            }`}
          >
            {label} · {key === "ALL" ? items.length : counts[key]}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Medicine
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Batch
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Qty
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Expiry Date
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Horizon
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Branch
                </th>
                <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Value
                </th>
                <th className="px-4 py-3.5 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {state === "loading" && (
                <tr>
                  <td colSpan={8} className="px-12 py-14">
                    <div className="flex items-center justify-center gap-2 text-[13px] text-ink/45">
                      <Loader2 size={16} className="animate-spin" /> Loading expiry register…
                    </div>
                  </td>
                </tr>
              )}
              {state === "ready" &&
                filtered.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-line/60 transition-colors hover:bg-paper/70"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/inventory/${item.product.id}`}
                        className="font-semibold text-ink hover:text-teal-mid"
                      >
                        {item.product.brand}
                      </Link>
                      <div className="text-[11px] text-ink/40">
                        {[item.product.strength, item.product.packSize]
                          .filter(Boolean)
                          .join(" · ") || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[13px] font-medium text-ink/70">
                      {item.batchNumber}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink">{item.quantity}</td>
                    <td className="px-4 py-3.5 font-medium text-ink/80">
                      {formatDate(item.expiryDate)}
                    </td>
                    <td className="px-4 py-3.5 text-ink/60">
                      {item.daysToExpiry >= 0
                        ? `${item.daysToExpiry} days left`
                        : `${Math.abs(item.daysToExpiry)} days past`}
                    </td>
                    <td className="px-4 py-3.5 text-ink/60">{item.branch.name}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-ink">
                      {formatINR(item.inventoryValue)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11px] font-semibold ${
                          expiryStatusBadge[bucketOf(item)]
                        }`}
                      >
                        {expiryStatusLabel[bucketOf(item)]}
                      </span>
                    </td>
                  </tr>
                ))}
              {state === "ready" && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-12 py-12 text-center text-ink/40">
                    <CalendarClock size={32} className="mx-auto mb-3 opacity-40" />
                    <div className="text-[14px]">
                      No batches in this expiry window.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}