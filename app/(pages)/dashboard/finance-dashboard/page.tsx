"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BookOpenText,
  HandCoins,
  Landmark,
  Loader2,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { financeApi, type FinanceOverview, type TrendPoint } from "@/lib/api";
import { formatINR } from "@/lib/inventory";
import { DonutChart, HBars, Sparkline, TrendChart } from "@/components/finance/charts";

type LoadState = "loading" | "error" | "ready";

export default function FinanceDashboard() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [d, t] = await Promise.all([financeApi.overview(), financeApi.trend()]);
        if (!ignore) {
          setData(d);
          setTrend(t);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load finance dashboard.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const monthName = useMemo(() => {
    const p = new Intl.DateTimeFormat("en-US", { month: "long" }).formatToParts(new Date());
    return p.find(x => x.type === "month")?.value ?? "This month";
  }, []);

  if (state === "loading") {
    return (
      <div className="flex w-full items-center justify-center gap-2 py-24 text-[13px] text-ink/45">
        <Loader2 size={16} className="animate-spin" /> Loading finance dashboard…
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div className="flex flex-col items-center gap-4 border border-danger/25 bg-danger-bg/60 px-12 py-16 text-center">
        <Banknote size={30} className="text-danger/60" />
        <div>
          <div className="text-[14px] font-medium text-ink">Could not load finance data.</div>
          <div className="mt-1 text-[12.5px] text-ink/50">{error}</div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep"
        >
          Retry
        </button>
      </div>
    );
  }

  const revenueSpark = trend.map(t => t.revenue);
  const expenseRows = [...data.month.expenses].sort((a, b) => b.amount - a.amount).slice(0, 4);
  const otherExpenses = data.month.totalExpenses - expenseRows.reduce((a, e) => a + e.amount, 0);

  const kpis = [
    {
      label: `Revenue · ${monthName}`,
      value: formatINR(data.month.totalRevenue),
      sub: `Net profit ${formatINR(data.allTime)} all-time`,
      icon: TrendingUp,
      accent: "bg-teal-mid/10 text-teal-mid",
      spark: revenueSpark,
      sparkColor: "#1b5a50",
    },
    {
      label: "Gross Profit",
      value: formatINR(data.month.grossProfit),
      sub: "Revenue − cost of goods",
      icon: ArrowUpRight,
      accent: "bg-stamp-dim text-stamp",
    },
    {
      label: "Net Profit",
      value: formatINR(data.month.netProfit),
      sub: `${monthName} revenue − expenses`,
      icon: PiggyBank,
      accent: "bg-teal-mid/10 text-teal-mid",
    },
    {
      label: "Cash Position",
      value: formatINR(data.cash),
      sub: "Cash on hand + bank",
      icon: Wallet,
      accent: "bg-teal-mid/10 text-teal-mid",
    },
    {
      label: "Receivables",
      value: formatINR(data.receivable),
      sub: "Outstanding from customers",
      icon: HandCoins,
      accent: "bg-danger-bg text-danger",
    },
    {
      label: "Payables",
      value: formatINR(data.payable),
      sub: "Owed to suppliers",
      icon: Receipt,
      accent: "bg-danger-bg text-danger",
    },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp">Finance</span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">Finance Dashboard</h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Revenue, expenses, cash and outstanding balances for your workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/finance/journal"
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink/70 transition-colors hover:bg-paper-dim"
          >
            <BookOpenText size={14} /> Journal
          </Link>
          <Link
            href="/finance/profit-loss"
            className="flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
          >
            <Landmark size={14} /> Profit & Loss
          </Link>
        </div>
      </div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map(card => (
          <div key={card.label} className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                  {card.label}
                </div>
                <div className="mt-2 font-display text-[22px] font-bold tracking-tight text-ink">{card.value}</div>
                <div className="mt-1 text-[11.5px] text-ink/50">{card.sub}</div>
              </div>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.accent}`}>
                <card.icon size={16} />
              </div>
            </div>
            {card.spark && (
              <div className="mt-3">
                <Sparkline points={card.spark} color={card.sparkColor} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)] lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">12-month trend</div>
              <h2 className="mt-0.5 font-display text-[15px] font-semibold text-ink">Revenue vs Expenses</h2>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-ink/60">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-mid" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-stamp" /> Expenses
              </span>
            </div>
          </div>
          <div className="mt-4">
            <TrendChart data={trend} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
              This month
            </div>
            <h2 className="mt-0.5 font-display text-[15px] font-semibold text-ink">Expense Breakdown</h2>
            <div className="mt-4">
              <DonutChart
                centerLabel="EXPENSES"
                centerValue={formatINR(data.month.totalExpenses)}
                segments={[
                  ...expenseRows.map((e, i) => ({
                    label: e.name,
                    value: e.amount,
                    color: ["#1b5a50", "#c1652b", "#0e3b36", "#b23a2e"][i % 4],
                  })),
                  ...(otherExpenses > 0
                    ? [{ label: "Other expenses", value: otherExpenses, color: "#ded7c4" }]
                    : []),
                ]}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
              Working capital
            </div>
            <h2 className="mt-0.5 font-display text-[15px] font-semibold text-ink">Where the money sits</h2>
            <div className="mt-4">
              <HBars
                rows={[
                  { label: "Cash on hand + bank", amount: data.cash },
                  { label: "Customer receivables", amount: data.receivable },
                  { label: "Supplier payables", amount: data.payable },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent postings ── */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Ledger feed</div>
            <h2 className="mt-0.5 font-display text-[15px] font-semibold text-ink">Latest Journal Entries</h2>
          </div>
          <Link
            href="/finance/journal"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-teal-mid transition-colors hover:text-stamp"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {data.recent.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-ink/50">
            No journal entries yet. Postings appear automatically from sales and purchase receipts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/40">
                  <th className="px-5 py-3 font-medium">Ref</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 text-right font-medium">Debits</th>
                  <th className="px-5 py-3 text-right font-medium">Credits</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map(row => {
                  const debits = row.lines.reduce((a, l) => a + l.debit, 0);
                  const credits = row.lines.reduce((a, l) => a + l.credit, 0);
                  return (
                    <tr key={row.id} className="border-b border-line/60 transition-colors hover:bg-paper/60">
                      <td className="px-5 py-3 font-mono text-[12px] text-ink/70">{row.referenceNo}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-ink/70">
                        {new Date(row.entryDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3 font-medium text-ink">{row.description}</td>
                      <td className="px-5 py-3 text-right font-mono text-teal-mid">{debits > 0 ? formatINR(debits) : "—"}</td>
                      <td className="px-5 py-3 text-right font-mono text-stamp">{credits > 0 ? formatINR(credits) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
