"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  DollarSign,
  ShoppingCart,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Loader2,
  RotateCcw,
  Package,
} from "lucide-react";
import {
  salesApi,
  type SalesSummary,
  type SaleStatus,
} from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { formatINR, formatINRCompact, formatDateTime } from "@/lib/inventory";

type LoadState = "loading" | "error" | "ready";

const statusBadge: Record<SaleStatus, string> = {
  PAID: "border border-teal-mid/30 bg-teal-mid/10 text-teal-mid",
  DUE: "border border-stamp/30 bg-stamp-dim text-stamp",
  PARTIAL_RETURN: "border border-stamp/40 bg-stamp-dim text-stamp",
  RETURNED: "border border-ink/30 bg-ink/5 text-ink/60",
  VOID: "border border-danger/40 bg-danger-bg text-danger",
};

export default function SalesDashboard() {
  const router = useRouter();
  const user = useAppSelector(state => state.auth.user);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await salesApi.summary();
        if (!ignore) {
          setSummary(data);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load sales summary.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  if (state === "loading" && !summary) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-[13px] text-ink/45">
        <Loader2 size={16} className="animate-spin" /> Loading sales analytics…
      </div>
    );
  }

  if (state === "error" && !summary) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-16 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <Banknote size={32} className="text-danger/60" />
        <div>
          <div className="text-[14px] font-medium text-ink">Could not load sales analytics.</div>
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
    );
  }

  if (!summary) return null;

  const stats = [
    {
      title: "Total Revenue Today",
      value: formatINR(summary.todaySales),
      change:
        summary.todayChangePct === null
          ? "new"
          : `${summary.todayChangePct >= 0 ? "+" : ""}${summary.todayChangePct.toFixed(1)}%`,
      isPositive: summary.todayChangePct === null || summary.todayChangePct >= 0,
      icon: DollarSign,
      accent: "bg-paper-dim text-ink/60",
    },
    {
      title: "Invoices Today",
      value: `${summary.todayInvoices}`,
      change: `${summary.monthInvoices} this month`,
      isPositive: true,
      icon: ShoppingCart,
      accent: "bg-teal-mid/10 text-teal-mid",
    },
    {
      title: "Avg Ticket (Month)",
      value: formatINR(summary.avgTicket),
      change: `${summary.monthInvoices} invoices`,
      isPositive: true,
      icon: CreditCard,
      accent: "bg-stamp-dim text-stamp",
    },
    {
      title: "Month Sales",
      value: formatINRCompact(summary.monthSales),
      change: `${summary.returns.total} return${summary.returns.total === 1 ? "" : "s"}`,
      isPositive: summary.returns.total === 0,
      icon: Activity,
      accent: "bg-danger-bg text-danger",
    },
  ];

  const paymentTotal = summary.paymentMix.reduce((acc, p) => acc + p.total, 0);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header Area ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Retail Performance Ledger
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Sales Analysis Workstation
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Live counter settlements, payment mix and top velocity SKUs for
            {user?.branchName ? ` ${user.branchName}` : " the workspace"}.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-ink bg-ink px-4 py-2 text-[13.5px] font-semibold text-paper">
          <span className="h-1.5 w-1.5 bg-stamp" /> Today
        </div>
      </div>

      {/* ── Stats Metric Grid ── */}
      <div className="grid w-full gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="flex items-start justify-between">
              <span className="truncate font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                {stat.title}
              </span>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.accent}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <div>
              <div className="font-display text-[22px] font-bold tracking-tight text-ink">
                {stat.value}
              </div>
              <div className="mt-1 flex items-center gap-1">
                {stat.isPositive ? (
                  <ArrowUpRight size={14} className="text-teal-mid" />
                ) : (
                  <ArrowDownRight size={14} className="text-danger" />
                )}
                <span className={`text-[12px] font-semibold ${stat.isPositive ? "text-teal-mid" : "text-danger"}`}>
                  {stat.change}
                </span>
                {idx === 0 && <span className="text-[11px] text-ink/40">vs yesterday</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Payment Mix + Returns Strip ── */}
      <div className="grid w-full gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Payment Mix</h3>
          <p className="mt-0.5 text-[12px] text-ink/45">Month-to-date by payment mode</p>
          <div className="mt-4 flex flex-col gap-3">
            {summary.paymentMix.map(p => {
              const pct = paymentTotal > 0 ? Math.round((p.total / paymentTotal) * 100) : 0;
              return (
                <div key={p.mode} className="flex items-center gap-3">
                  <span className="w-[110px] text-[12.5px] font-semibold text-ink/70 capitalize">
                    {p.mode.replace("_", " ").toLowerCase()}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-dim">
                    <div className="h-2 rounded-full bg-teal-mid" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-[90px] text-right font-mono text-[12.5px] font-semibold text-ink">
                    {formatINR(p.total)}
                  </span>
                  <span className="w-10 text-right text-[11.5px] text-ink/45">{pct}%</span>
                </div>
              );
            })}
            {summary.paymentMix.length === 0 && (
              <div className="text-[12.5px] text-ink/45">No sales recorded this month yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Returns</h3>
              <p className="mt-0.5 text-[12px] text-ink/45">
                {summary.returns.total} return{summary.returns.total === 1 ? "" : "s"} ·{" "}
                {formatINR(summary.returns.value)}
              </p>
            </div>
            <button
              onClick={() => router.push("/sales/returns")}
              className="cursor-pointer text-[12px] font-medium text-stamp hover:text-teal-mid"
            >
              View Returns →
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            {summary.returns.recent.length === 0 && (
              <div className="text-[12.5px] text-ink/45">No recent returns.</div>
            )}
            {summary.returns.recent.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px]"
              >
                <span className="flex items-center gap-2 font-medium text-ink/80">
                  <RotateCcw size={13} className="text-stamp" /> {r.brand}
                  {r.note ? <span className="text-ink/45">· {r.note}</span> : null}
                </span>
                <span className="font-mono font-semibold text-stamp">
                  +{r.quantity}
                  <span className="ml-2 text-ink/40">{formatDateTime(r.createdAt)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Split Columns ── */}
      <div className="grid w-full gap-6 xl:grid-cols-2">
        {/* Left Column: Recent Counter Transactions */}
        <div className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Live Terminal Invoices</h3>
              <p className="mt-0.5 text-[12px] text-ink/45">
                Instant view of running retail transactions
              </p>
            </div>
            <button
              onClick={() => router.push("/sales")}
              className="cursor-pointer text-[12px] font-medium text-stamp hover:text-teal-mid"
            >
              View All Invoices →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-2 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Invoice</th>
                  <th className="px-2 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Customer</th>
                  <th className="px-2 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Payment</th>
                  <th className="px-2 py-2.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/50">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentSales.map(sale => (
                  <tr
                    key={sale.id}
                    onClick={() => router.push(`/sales/${sale.id}`)}
                    className="cursor-pointer border-b border-line/60 transition-colors hover:bg-paper/70"
                  >
                    <td className="px-2 py-3">
                      <div className="font-mono font-semibold text-ink">{sale.invoiceNo}</div>
                      <div className="text-[11px] font-normal text-ink/40">
                        {formatDateTime(sale.createdAt)} · {sale.branchName ?? "—"}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-ink/70">
                      <div>{sale.customerName}</div>
                      {sale.actor && <div className="text-[11px] text-ink/40">by {sale.actor}</div>}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-semibold ${statusBadge[sale.status]}`}
                      >
                        {sale.paymentMode.replace("_", " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right font-mono font-semibold text-ink">
                      {formatINR(sale.total)}
                    </td>
                  </tr>
                ))}
                {summary.recentSales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-2 py-8 text-center text-[12.5px] text-ink/45">
                      No invoices recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Moving Inventory Stock */}
        <div className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Top High-Velocity Elements</h3>
              <p className="mt-0.5 text-[12px] text-ink/45">
                Fastest moving pharmaceutical SKUs this month
              </p>
            </div>
            <button
              onClick={() => router.push("/inventory")}
              className="cursor-pointer text-[12px] font-medium text-stamp hover:text-teal-mid"
            >
              Analyze Velocity →
            </button>
          </div>

          <div className="flex flex-col gap-3.5">
            {summary.topProducts.map(med => (
              <div
                key={med.productId}
                onClick={() => router.push(`/inventory/${med.productId}`)}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-line bg-paper p-2.5 transition-colors hover:bg-paper-dim"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink/50">
                    <Package size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-ink">{med.brand}</div>
                    <div className="text-[11px] text-ink/40">{med.genericName ?? "—"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[13px] font-bold text-ink">
                    {med.quantity} units
                  </div>
                  <div className="text-[11px] font-medium text-ink/50">this month</div>
                </div>
              </div>
            ))}
            {summary.topProducts.length === 0 && (
              <div className="text-[12.5px] text-ink/45">No sales this month yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}