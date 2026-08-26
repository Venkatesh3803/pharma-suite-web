"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertTriangle, Archive } from "lucide-react";
import { inventoryApi, type DeadStockResult } from "@/lib/api";
import { formatINR, formatINRCompact, formatDate } from "@/lib/inventory";

type LoadState = "loading" | "error" | "ready";

export default function DeadStockPage() {
  const [data, setData] = useState<DeadStockResult | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function fetchDeadStock() {
      try {
        const result = await inventoryApi.deadStock();
        if (!ignore) {
          setData(result);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load dead stock.");
          setState("error");
        }
      }
    }
    void fetchDeadStock();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const retry = () => {
    setState("loading");
    setError("");
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Link
          href="/inventory"
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink/55 transition-colors hover:text-stamp"
        >
          ← Back to Inventory
        </Link>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
              Capital Trap
            </span>
            <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
              Dead Stock Register
            </h1>
            <p className="mt-1 text-[13.5px] text-ink/55">
              Stock that has not moved in 60+ days — capital trapped on the shelf,
              ranked by trapped value.
            </p>
          </div>
          {data && (
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-danger">
                {formatINRCompact(data.trappedCapital)}
              </div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-ink/45 font-mono">
                trapped · {data.total} batches
              </div>
            </div>
          )}
        </div>
      </div>

      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <AlertTriangle size={32} className="text-danger/60" />
          <div>
            <div className="text-[14px] font-medium text-ink">
              Could not load dead stock.
            </div>
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
                  On Hand
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Last Sale
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Idle
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Expiry
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Branch
                </th>
                <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Trapped Value
                </th>
              </tr>
            </thead>
            <tbody>
              {state === "loading" && (
                <tr>
                  <td colSpan={8} className="px-12 py-14">
                    <div className="flex items-center justify-center gap-2 text-[13px] text-ink/45">
                      <Loader2 size={16} className="animate-spin" /> Loading dead stock…
                    </div>
                  </td>
                </tr>
              )}
              {state === "ready" &&
                data?.items.map(item => (
                  <tr
                    key={`${item.productId}-${item.batchNumber}`}
                    className="border-b border-line/60 transition-colors hover:bg-paper/70"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/inventory/${item.productId}`}
                        className="font-semibold text-ink hover:text-teal-mid"
                      >
                        {item.productBrand}
                      </Link>
                      <div className="text-[11px] text-ink/40">
                        {item.genericName ?? ""}
                        {item.strength ? ` · ${item.strength}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[13px] font-medium text-ink/70">
                      {item.batchNumber}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink">{item.stock}</td>
                    <td className="px-4 py-3.5 text-ink/60">
                      {item.lastSaleDate ? formatDate(item.lastSaleDate) : "never sold"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block border border-danger/25 bg-danger-bg px-2 py-0.5 text-[11px] font-semibold text-danger">
                        {item.daysInactive} days
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink/70">
                      {formatDate(item.expiryDate)}
                    </td>
                    <td className="px-4 py-3.5 text-ink/60">{item.branch.name}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-danger">
                      {formatINR(item.inventoryValue)}
                    </td>
                  </tr>
                ))}
              {state === "ready" && data && data.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-12 py-12 text-center text-ink/40">
                    <Archive size={32} className="mx-auto mb-3 opacity-40" />
                    <div className="text-[14px]">No dead stock detected.</div>
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