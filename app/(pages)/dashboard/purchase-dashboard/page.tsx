"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  Loader2,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { purchasesApi, type PurchaseSummary } from "@/lib/api";
import { formatINR, formatINRCompact } from "@/lib/inventory";

type LoadState = "loading" | "error" | "ready";

export default function PurchaseDashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<PurchaseSummary | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await purchasesApi.summary();
        if (!ignore) {
          setSummary(data);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load purchase analytics.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const cards = summary
    ? [
        {
          label: "This Month Purchases",
          value: formatINR(summary.thisMonthValue),
          sub:
            summary.monthChangePct == null
              ? `${summary.thisMonthOrders} orders`
              : `${summary.monthChangePct >= 0 ? "+" : ""}${summary.monthChangePct.toFixed(1)}% vs last month`,
          positive: (summary.monthChangePct ?? 0) >= 0,
          icon: ShoppingBag,
          accent: "bg-teal-mid/10 text-teal-mid",
          href: "/purchase/order",
        },
        {
          label: "Open Orders",
          value: String(summary.openOrders),
          sub: `${summary.cancelledOrders} cancelled`,
          positive: true,
          icon: ClipboardList,
          accent: "bg-stamp-dim text-stamp",
          href: "/purchase/order",
        },
        {
          label: "Received",
          value: String(summary.receivedOrders),
          sub: `${summary.totalOrders} total orders`,
          positive: true,
          icon: PackageCheck,
          accent: "bg-teal-mid/10 text-teal-mid",
          href: "/purchase/order",
        },
        {
          label: "Returns",
          value: String(summary.returnsCount),
          sub: `${summary.priceIncreases} price increases`,
          positive: false,
          icon: RotateCcw,
          accent: "bg-danger-bg text-danger",
          href: "/purchase/returns",
        },
      ]
    : [];

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Procurement Analytics
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Purchase Dashboard
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Spending, order pipeline, returns and reorder signals.
          </p>
        </div>
        {summary && (
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="cursor-pointer rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink/70 transition-colors hover:bg-paper-dim"
          >
            Refresh
          </button>
        )}
      </div>

      {state === "loading" && (
        <div className="flex items-center gap-2 py-16 text-ink/50">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-[13px]">Loading analytics…</span>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-2xl border border-danger/40 bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}

      {state === "ready" && summary && (
        <>
          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map(card => (
              <button
                key={card.label}
                onClick={() => router.push(card.href)}
                className="cursor-pointer rounded-2xl border border-line bg-white p-5 text-left shadow-[0_1px_2px_rgba(20,32,28,0.04)] transition-colors hover:border-teal-mid/40"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.accent}`}>
                  <card.icon size={16} />
                </div>
                <div className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/45 font-mono">
                  {card.label}
                </div>
                <div className="mt-1 flex items-center gap-1.5 font-display text-xl font-semibold text-ink">
                  {card.value}
                  <ArrowUpRight
                    size={14}
                    className={card.positive ? "text-teal-mid" : "text-danger"}
                  />
                </div>
                <div className="mt-0.5 text-[11.5px] text-ink/45">{card.sub}</div>
              </button>
            ))}
          </div>

          {/* ── Total spend + reorder signals ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)] lg:col-span-1">
              <div className="border-b border-line px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-teal-mid" />
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                    Lifetime Purchasing
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="font-display text-3xl font-semibold text-ink">
                  {formatINRCompact(summary.totalPurchaseValue)}
                </div>
                <div className="mt-1 text-[12.5px] text-ink/50">
                  across {summary.totalOrders} purchase orders
                </div>
                <div className="mt-4 space-y-2 border-t border-line pt-3 text-[12.5px]">
                  <div className="flex justify-between">
                    <span className="text-ink/50">Open orders</span>
                    <span className="font-mono font-semibold text-ink">{summary.openOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/50">Received</span>
                    <span className="font-mono font-semibold text-ink">{summary.receivedOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/50">Returns this month</span>
                    <span className="font-mono font-semibold text-ink">{summary.returnsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/50">Price increase alerts</span>
                    <span className="font-mono font-semibold text-ink">
                      {summary.priceIncreases}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Low stock / reorder ── */}
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)] lg:col-span-2">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-danger" />
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                    Reorder Signals (low stock)
                  </span>
                </div>
                {summary.lowStock.length > 0 && (
                  <button
                    onClick={() => router.push(`/purchase/order/new?reorder=1`)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-teal-mid/30 bg-teal-mid/10 px-3 py-1.5 text-[12px] font-semibold text-teal-mid transition-colors hover:bg-teal-mid hover:text-white"
                  >
                    <ShoppingBag size={13} /> Create PO
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/40">
                      <th className="px-4 py-2.5 font-medium">Medicine</th>
                      <th className="px-4 py-2.5 font-medium">Batch</th>
                      <th className="px-4 py-2.5 text-right font-medium">On Hand</th>
                      <th className="px-4 py-2.5 text-right font-medium">Reorder Level</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {summary.lowStock.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-ink/45">
                          No stock at or below its reorder level — healthy inventory.
                        </td>
                      </tr>
                    )}
                    {summary.lowStock.map(item => (
                      <tr key={`${item.productId}-${item.batchNumber}`} className="border-b border-line/70">
                        <td className="px-4 py-3">
                          <div className="text-[13px] font-semibold text-ink">{item.brand}</div>
                          {item.genericName && (
                            <div className="text-[11.5px] text-ink/45">{item.genericName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-ink/60">
                          {item.batchNumber}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-[13px] font-bold text-danger">
                            {item.onHand}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[13px] text-ink/60">
                          {item.reorderLevel}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              router.push(`/purchase/order/new?medicine=${item.productId}`)
                            }
                            className="cursor-pointer rounded-lg border border-line px-2.5 py-1 text-[11.5px] font-semibold text-ink/60 transition-colors hover:border-teal-mid hover:text-teal-mid"
                          >
                            Reorder
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}