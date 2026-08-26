"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Download,
  Loader2,
  Package,
  RefreshCw,
  Receipt,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import {
  reportsApi,
  type InventoryReportResult,
  type MarginReportResult,
  type PurchaseReportResult,
  type ReportGroupBy,
  type SalesReportResult,
  type TopProductRow,
} from "@/lib/api";
import { formatINR, formatINRCompact, formatDate } from "@/lib/inventory";

type LoadState = "loading" | "error" | "ready";

const inputBase =
  "rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function seriesLabel(key: string, groupBy: ReportGroupBy): string {
  const d = new Date(`${key}T00:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  if (groupBy === "month") {
    return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }
  if (groupBy === "week") {
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ReportsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");

  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(() => iso(new Date()));
  const [groupBy, setGroupBy] = useState<ReportGroupBy>("day");
  const [refreshKey, setRefreshKey] = useState(0);

  const [sales, setSales] = useState<SalesReportResult | null>(null);
  const [margins, setMargins] = useState<MarginReportResult | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
  const [inventory, setInventory] = useState<InventoryReportResult | null>(null);
  const [purchases, setPurchases] = useState<PurchaseReportResult | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setState("loading");
      try {
        const [s, m, t, i, p] = await Promise.all([
          reportsApi.sales({ from, to, groupBy }),
          reportsApi.margins({ from, to }),
          reportsApi.topProducts({ from, to, limit: 10 }),
          reportsApi.inventory(),
          reportsApi.purchases({ from, to }),
        ]);
        if (!ignore) {
          setSales(s);
          setMargins(m);
          setTopProducts(t);
          setInventory(i);
          setPurchases(p);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load reports.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [from, to, groupBy, refreshKey]);

  const setPreset = (days: number | null) => {
    const t = new Date();
    setTo(iso(t));
    if (days === null) {
      // all time — clear from
      setFrom("");
    } else {
      setFrom(iso(new Date(t.getTime() - days * 86400000)));
    }
  };

  const exportCsv = () => {
    if (!sales || sales.totals.invoices === 0) return;
    const rows = [
      ["Period", "Date", "Revenue", "Invoices", "Units"],
      ...sales.series.map(s => [
        groupBy,
        s.key,
        s.revenue.toFixed(2),
        String(s.invoices),
        String(s.units),
      ]),
      [],
      ["Total", "", sales.totals.revenue.toFixed(2), String(sales.totals.invoices), String(sales.totals.unitsSold)],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${from || "all"}-to-${to}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const maxRevenue = sales ? Math.max(...sales.series.map(s => s.revenue), 0) : 0;

  const cards = sales
    ? [
        {
          label: "Revenue",
          value: formatINR(sales.totals.revenue),
          sub: `${sales.totals.invoices} invoices · ${sales.totals.unitsSold} units`,
          icon: TrendingUp,
          accent: "bg-teal-mid/10 text-teal-mid",
        },
        {
          label: "GST Collected",
          value: formatINR(sales.totals.tax),
          sub: `subtotal ${formatINR(sales.totals.subtotal)} · discounts ${formatINR(sales.totals.discount)}`,
          icon: Receipt,
          accent: "bg-stamp-dim text-stamp",
        },
        {
          label: "Gross Margin",
          value: margins ? `${margins.grossMargin.toFixed(1)}%` : "—",
          sub: margins ? `profit ${formatINR(margins.grossProfit)}` : "no sales in range",
          icon: BarChart3,
          accent: "bg-teal-mid/10 text-teal-mid",
        },
        {
          label: "Stock on Hand",
          value: inventory ? formatINRCompact(inventory.valuation.retailValue) : "—",
          sub: inventory ? `${inventory.valuation.units} units at retail` : "—",
          icon: Package,
          accent: "bg-danger-bg text-danger",
        },
      ]
    : [];

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Revenue Intelligence Ledger
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Sales & Revenue Analytics
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Revenue trends, GST, gross margins, velocity products and purchases —
            computed live from your billing ledger.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-medium text-ink/70 transition-colors hover:bg-paper-dim"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Range controls ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPreset(7)}
            className="cursor-pointer rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold text-ink/60 transition-colors hover:border-teal-mid hover:text-teal-mid"
          >
            7d
          </button>
          <button
            onClick={() => setPreset(30)}
            className="cursor-pointer rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold text-ink/60 transition-colors hover:border-teal-mid hover:text-teal-mid"
          >
            30d
          </button>
          <button
            onClick={() => setPreset(90)}
            className="cursor-pointer rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold text-ink/60 transition-colors hover:border-teal-mid hover:text-teal-mid"
          >
            90d
          </button>
          <button
            onClick={() => setPreset(null)}
            className="cursor-pointer rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold text-ink/60 transition-colors hover:border-teal-mid hover:text-teal-mid"
          >
            All time
          </button>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-line sm:block" />

        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={`${inputBase} cursor-pointer`} />
          <span className="text-[12px] text-ink/40">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className={`${inputBase} cursor-pointer`} />
        </div>

        <select
          value={groupBy}
          onChange={e => setGroupBy(e.target.value as ReportGroupBy)}
          className={`${inputBase} cursor-pointer`}
        >
          <option value="day">Group by Day</option>
          <option value="week">Group by Week</option>
          <option value="month">Group by Month</option>
        </select>

        <button
          onClick={exportCsv}
          disabled={!sales || sales.totals.invoices === 0}
          className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={14} /> Export
        </button>
      </div>

      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <AlertTriangle size={32} className="text-danger/60" />
          <div>
            <div className="text-[14px] font-medium text-ink">Could not load reports.</div>
            <div className="mt-1 text-[12.5px] text-ink/50">{error}</div>
          </div>
          <button
            onClick={() => {
              setState("loading");
              setRefreshKey(k => k + 1);
            }}
            className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep"
          >
            Retry
          </button>
        </div>
      )}

      {state === "loading" && (
        <div className="flex items-center gap-2 py-16 text-ink/50">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-[13px]">Computing report…</span>
        </div>
      )}

      {state === "ready" && sales && (
        <>
          {/* ── KPI cards ── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(card => (
              <div key={card.label} className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                      {card.label}
                    </div>
                    <div className="mt-1.5 font-display text-[22px] font-bold tracking-tight text-ink">
                      {card.value}
                    </div>
                  </div>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.accent}`}>
                    <card.icon size={16} />
                  </div>
                </div>
                <div className="mt-2 text-[11.5px] text-ink/45">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Revenue series bar chart ── */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                  Revenue series · {groupBy}
                </div>
                <h2 className="mt-0.5 font-display text-[15px] font-semibold text-ink">
                  {sales.totals.invoices === 0
                    ? "No sales in this range"
                    : `${sales.series.length} ${groupBy}${sales.series.length === 1 ? "" : "s"} · ${formatINR(sales.totals.revenue)}`}
                </h2>
              </div>
              <div className="text-[12px] text-ink/45">
                Peak {formatINR(maxRevenue)}
              </div>
            </div>

            {sales.totals.invoices === 0 ? (
              <div className="flex items-center justify-center py-14 text-[13px] text-ink/45">
                No invoices recorded between {formatDate(from)} and {formatDate(to)}.
              </div>
            ) : (
              <div className="flex h-56 items-end gap-1.5 overflow-x-auto px-5 py-5">
                {sales.series.map((s, i) => (
                  <div
                    key={s.key}
                    title={`${seriesLabel(s.key, groupBy)}: ${formatINR(s.revenue)} · ${s.invoices} invoice${s.invoices === 1 ? "" : "s"}`}
                    className="group flex min-w-6 flex-1 flex-col items-center gap-1"
                  >
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className={`w-full rounded-t-sm transition-colors ${
                          i === sales.series.length - 1 ? "bg-teal-mid" : "bg-teal-mid/60 group-hover:bg-teal-mid"
                        }`}
                        style={{ height: `${maxRevenue > 0 ? Math.max(4, (s.revenue / maxRevenue) * 100) : 4}%` }}
                      />
                    </div>
                    <span className="whitespace-nowrap font-mono text-[9.5px] text-ink/40">
                      {seriesLabel(s.key, groupBy)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Top products + purchases ── */}
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                <TrendingUp size={15} className="text-stamp" />
                <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                  Top Velocity Products
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/40">
                      <th className="px-5 py-2.5 font-medium">Rank</th>
                      <th className="px-5 py-2.5 font-medium">Medicine</th>
                      <th className="px-5 py-2.5 text-right font-medium">Units</th>
                      <th className="px-5 py-2.5 text-right font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-ink/45">
                          No sales in this range.
                        </td>
                      </tr>
                    )}
                    {topProducts.map((p, i) => (
                      <tr key={p.productId} className="border-b border-line/60 transition-colors hover:bg-paper/70">
                        <td className="px-5 py-3 font-mono text-[12px] text-ink/45">#{i + 1}</td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-ink">{p.brand}</div>
                          {p.genericName && <div className="text-[11.5px] text-ink/45">{p.genericName}</div>}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-ink/70">{p.quantity}</td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-ink">
                          {formatINR(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                <ShoppingBag size={15} className="text-teal-mid" />
                <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                  Purchases by Supplier
                </h3>
              </div>
              {!purchases || purchases.totals.count === 0 ? (
                <div className="px-5 py-10 text-center text-[13px] text-ink/45">
                  No purchases in this range.
                </div>
              ) : (
                <>
                  <div className="border-b border-line px-5 py-3 text-[12.5px] text-ink/50">
                    <span className="font-mono text-[15px] font-bold text-ink">{formatINRCompact(purchases.totals.total)}</span>{" "}
                    across {purchases.totals.count} orders · avg {formatINR(purchases.totals.average)}
                  </div>
                  <div className="flex flex-col gap-2.5 p-5">
                    {purchases.bySupplier.map(sup => {
                      const pct = purchases.totals.total > 0 ? (sup.total / purchases.totals.total) * 100 : 0;
                      return (
                        <div key={sup.supplierId}>
                          <div className="mb-0.5 flex items-baseline justify-between text-[12.5px]">
                            <span className="truncate text-ink/75">{sup.name}</span>
                            <span className="font-mono text-ink">{formatINR(sup.total)}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-dim">
                            <div className="h-full rounded-full bg-teal-mid" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Inventory valuation by branch ── */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
              <Package size={15} className="text-stamp" />
              <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                Inventory Valuation by Branch (current stock)
              </h3>
            </div>
            {!inventory || inventory.branches.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-ink/45">
                No stock on hand across any branch.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/40">
                      <th className="px-5 py-2.5 font-medium">Branch</th>
                      <th className="px-5 py-2.5 text-right font-medium">Batches</th>
                      <th className="px-5 py-2.5 text-right font-medium">Units</th>
                      <th className="px-5 py-2.5 text-right font-medium">Retail Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.branches.map(b => (
                      <tr key={b.name} className="border-b border-line/60 transition-colors hover:bg-paper/70">
                        <td className="px-5 py-3 font-semibold text-ink">{b.name}</td>
                        <td className="px-5 py-3 text-right font-mono text-ink/70">{b.batches}</td>
                        <td className="px-5 py-3 text-right font-mono text-ink/70">{b.units}</td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-ink">{formatINR(b.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}