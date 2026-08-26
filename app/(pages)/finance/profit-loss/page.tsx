"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Scale } from "lucide-react";
import {
  financeApi,
  type BalanceSheetResult,
  type PnLResult,
} from "@/lib/api";
import { formatINR } from "@/lib/inventory";
import { DonutChart, HBars } from "@/components/finance/charts";

type LoadState = "loading" | "error" | "ready";

const CARD = "rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]";
const SECTION_LABEL = "font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45";
const CARD_TITLE = "mt-0.5 font-display text-[15px] font-semibold text-ink";
const ROW_LABEL = "text-[13.5px] text-ink/80";
const ROW_VALUE = "font-mono text-ink";
const ROW_TOTAL = "flex items-center justify-between border-t border-line pt-2 text-[14px] font-semibold text-ink";
const EMPTY = "text-[13px] text-ink/45";

function PnLTable({ data }: { data: PnLResult }) {
  const costOfGoods = data.expenses.find(e => e.code === "5000")?.amount ?? 0;
  const otherExpenses = data.totalExpenses - costOfGoods;

  const topExpenses = [...data.expenses].sort((a, b) => b.amount - a.amount).slice(0, 4);
  const otherExpenseTotal = data.totalExpenses - topExpenses.reduce((a, e) => a + e.amount, 0);
  const topRevenue = [...data.revenue].sort((a, b) => b.amount - a.amount).slice(0, 4);

  const donutSegments = [
    ...topExpenses.map((e, i) => ({
      label: e.name,
      value: e.amount,
      color: ["#1b5a50", "#c1652b", "#0e3b36", "#b23a2e"][i % 4],
    })),
    ...(otherExpenseTotal > 0 ? [{ label: "Other expenses", value: otherExpenseTotal, color: "#ded7c4" }] : []),
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        {/* ── Revenue ── */}
        <div className={CARD}>
          <div className={SECTION_LABEL}>Income</div>
          <h2 className={CARD_TITLE}>Revenue</h2>
          <div className="mt-4 space-y-1.5">
            {data.revenue.length === 0 && <div className={EMPTY}>No revenue posted.</div>}
            {data.revenue.map(r => (
              <div key={r.id} className="flex items-center justify-between">
                <span className={ROW_LABEL}>{r.name}</span>
                <span className={ROW_VALUE}>{formatINR(r.amount)}</span>
              </div>
            ))}
            <div className={ROW_TOTAL}>
              <span>Total Revenue</span>
              <span className="font-mono">{formatINR(data.totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* ── Expenses ── */}
        <div className={CARD}>
          <div className={SECTION_LABEL}>Operating costs</div>
          <h2 className={CARD_TITLE}>Expenses</h2>
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={ROW_LABEL}>Cost of Goods Sold</span>
              <span className={ROW_VALUE}>− {formatINR(costOfGoods)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={ROW_LABEL}>Other Operating Expenses</span>
              <span className={ROW_VALUE}>− {formatINR(otherExpenses)}</span>
            </div>
            {data.expenses
              .filter(e => e.code !== "5000")
              .map(e => (
                <div key={e.id} className="flex items-center justify-between pl-4 text-[12.5px] text-ink/55">
                  <span>{e.name}</span>
                  <span className="font-mono">{formatINR(e.amount)}</span>
                </div>
              ))}
            <div className={ROW_TOTAL}>
              <span>Total Expenses</span>
              <span className="font-mono">− {formatINR(data.totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* ── This period summary ── */}
        <div className={CARD}>
          <div className={SECTION_LABEL}>Summary</div>
          <h2 className={CARD_TITLE}>This period</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                Total Revenue
              </span>
              <span className="font-mono text-[15px] font-semibold text-teal-mid">
                {formatINR(data.totalRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                Total Expenses
              </span>
              <span className="font-mono text-[15px] font-semibold text-stamp">
                − {formatINR(data.totalExpenses)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                Gross Profit
              </span>
              <span className="font-mono text-[15px] font-semibold text-ink">{formatINR(data.grossProfit)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="font-display text-[14px] font-semibold text-ink">Net Profit</span>
              <span
                className={`font-mono text-[18px] font-bold ${
                  data.netProfit >= 0 ? "text-teal-deep" : "text-danger"
                }`}
              >
                {data.netProfit >= 0 ? "+" : "−"} {formatINR(Math.abs(data.netProfit))}
              </span>
            </div>
          </div>
        </div>

        {/* ── Expense breakdown ── */}
        <div className={CARD}>
          <div className={SECTION_LABEL}>Mix</div>
          <h2 className={CARD_TITLE}>Expense breakdown</h2>
          <div className="mt-4">
            <DonutChart
              centerLabel="EXPENSES"
              centerValue={formatINR(data.totalExpenses)}
              segments={donutSegments}
            />
          </div>
        </div>

        {/* ── Leaders ── */}
        <div className={CARD}>
          <div className={SECTION_LABEL}>Leaders</div>
          <h2 className={CARD_TITLE}>Top revenue & expenses</h2>
          <div className="mt-4 space-y-5">
            <div>
              <div className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-teal-mid">
                Revenue leaders
              </div>
              <HBars rows={topRevenue.map(r => ({ label: r.name, amount: r.amount }))} color="#1b5a50" />
            </div>
            <div>
              <div className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stamp">
                Expense leaders
              </div>
              <HBars rows={topExpenses.map(r => ({ label: r.name, amount: r.amount }))} color="#c1652b" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BalanceSheetTable({ data }: { data: BalanceSheetResult }) {
  const rows = [
    { label: "Assets", items: data.assets, total: data.totalAssets },
    { label: "Liabilities", items: data.liabilities, total: data.totalLiabilities },
    { label: "Equity", items: data.equity, total: data.totalEquity },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {rows.map(section => (
          <div key={section.label} className={CARD}>
            <div className={SECTION_LABEL}>Statement</div>
            <h2 className={CARD_TITLE}>{section.label}</h2>
            <div className="mt-4 space-y-1.5">
              {section.items.length === 0 && (
                <div className={EMPTY}>No {section.label.toLowerCase()} recorded.</div>
              )}
              {section.items.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className={ROW_LABEL}>{item.name}</span>
                  <span className={ROW_VALUE}>{formatINR(item.amount)}</span>
                </div>
              ))}
              <div className={ROW_TOTAL}>
                <span>Total {section.label}</span>
                <span className="font-mono">{formatINR(section.total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-[15px] font-semibold ${
          data.balanced ? "bg-teal-mid text-paper" : "bg-danger-bg text-danger"
        }`}
      >
        <span className="flex items-center gap-2">
          <Scale size={15} />
          {data.balanced ? "Assets = Liabilities + Equity" : "Balance sheet out of balance"}
        </span>
        <span className="font-mono">
          {formatINR(data.totalAssets)} = {formatINR(data.totalLiabilities + data.totalEquity)}
        </span>
      </div>
    </div>
  );
}

export default function ProfitLossPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"pnl" | "sheet">("pnl");
  const [pnl, setPnl] = useState<PnLResult | null>(null);
  const [sheet, setSheet] = useState<BalanceSheetResult | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [asOf, setAsOf] = useState("");

  async function fetchData() {
    return Promise.all([
      financeApi.pnl({ from: from || undefined, to: to || undefined }),
      financeApi.balanceSheet({ asOf: asOf || undefined }),
    ]);
  }

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [p, s] = await fetchData();
        if (!ignore) {
          setPnl(p);
          setSheet(s);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load financial reports.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  async function applyFilters() {
    setState("loading");
    try {
      const [p, s] = await fetchData();
      setPnl(p);
      setSheet(s);
      setState("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load financial reports.");
      setState("error");
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp">
            Finance
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Profit & Loss
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Profit & Loss and Balance Sheet computed live from your journal, sales and purchase postings.
          </p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="pnl-from"
            className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45"
          >
            P&L from
          </label>
          <input
            id="pnl-from"
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="pnl-to"
            className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45"
          >
            P&L to
          </label>
          <input
            id="pnl-to"
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="sheet-asof"
            className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45"
          >
            Balance sheet as of
          </label>
          <input
            id="sheet-asof"
            type="date"
            value={asOf}
            onChange={e => setAsOf(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15"
          />
        </div>
        <button
          onClick={applyFilters}
          className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
        >
          Apply
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex w-fit items-center gap-1 rounded-xl bg-paper-dim p-1">
        <button
          onClick={() => setTab("pnl")}
          className={`cursor-pointer rounded-lg px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
            tab === "pnl" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink/75"
          }`}
        >
          Profit & Loss
        </button>
        <button
          onClick={() => setTab("sheet")}
          className={`cursor-pointer rounded-lg px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
            tab === "sheet" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink/75"
          }`}
        >
          Balance Sheet
        </button>
      </div>

      {state === "loading" && (
        <div className="flex items-center gap-2 py-16 text-ink/50">
          <Loader2 size={16} className="animate-spin" /> Loading financial reports…
        </div>
      )}

      {state === "error" && (
        <div className="rounded-2xl border border-danger/25 bg-danger-bg/60 px-4 py-3 text-[13px] text-danger">
          {error}
        </div>
      )}

      {state === "ready" && (
        <div>
          {tab === "pnl" && pnl && <PnLTable data={pnl} />}
          {tab === "sheet" && sheet && <BalanceSheetTable data={sheet} />}
        </div>
      )}
    </div>
  );
}
