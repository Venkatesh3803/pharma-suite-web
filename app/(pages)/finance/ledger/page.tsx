"use client";

import React, { useEffect, useState } from "react";
import { CalendarRange, Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { financeApi, type AccountType, type FinanceAccount, type LedgerResult } from "@/lib/api";
import { formatINR } from "@/lib/inventory";
import { Sparkline } from "@/components/finance/charts";

type LoadState = "loading" | "error" | "ready";

type LedgerFilters = { from?: string; to?: string };

const TYPE_LABELS: Record<AccountType, string> = {
  ASSET: "Assets",
  LIABILITY: "Liabilities",
  EQUITY: "Equity",
  REVENUE: "Revenue",
  EXPENSE: "Expenses",
};

const TYPE_ORDER: AccountType[] = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

const TYPE_CHIP: Record<AccountType, string> = {
  ASSET: "bg-teal-mid/10 text-teal-mid",
  LIABILITY: "bg-stamp-dim text-stamp",
  EQUITY: "bg-paper-dim text-ink/70",
  REVENUE: "bg-teal-mid/10 text-teal-mid",
  EXPENSE: "bg-danger-bg text-danger",
};

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [ledger, setLedger] = useState<LedgerResult | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filters, setFilters] = useState<LedgerFilters>({});

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const accs = await financeApi.accounts();
        if (!ignore) {
          setAccounts(accs);
          if (accs.length > 0) setSelectedId(accs[0].id);
          else setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load accounts.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let ignore = false;
    async function load() {
      setState("loading");
      try {
        const data = await financeApi.ledger(selectedId, {
          from: filters.from || undefined,
          to: filters.to || undefined,
        });
        if (!ignore) {
          setLedger(data);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load ledger.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [selectedId, filters]);

  const groups = TYPE_ORDER.map(t => ({
    type: t,
    label: TYPE_LABELS[t],
    items: accounts.filter(a => a.type === t),
  })).filter(g => g.items.length > 0);

  const hasActiveFilters = Boolean(filters.from || filters.to);

  function applyFilters() {
    setFilters({ from: from || undefined, to: to || undefined });
  }

  function clearFilters() {
    setFrom("");
    setTo("");
    setFilters({});
  }

  const totalDebits = ledger ? ledger.rows.reduce((a, r) => a + r.debit, 0) : 0;
  const totalCredits = ledger ? ledger.rows.reduce((a, r) => a + r.credit, 0) : 0;
  const stats = ledger
    ? [
        { label: "Opening Balance", value: formatINR(ledger.account.openingBalance), tone: "text-ink" },
        { label: "Total Debits", value: formatINR(totalDebits), tone: "text-teal-mid" },
        { label: "Total Credits", value: formatINR(totalCredits), tone: "text-stamp" },
        { label: "Closing Balance", value: formatINR(ledger.balance), tone: "font-bold text-teal-mid" },
      ]
    : [];

  const inputClass =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15";
  const labelClass = "mb-1 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45";

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp">
            General Ledger
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">Account Ledger</h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Every account&apos;s postings with a running balance.
          </p>
        </div>
        {ledger && hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink/70 transition-colors hover:bg-paper-dim"
          >
            <RotateCcw size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* ── Control panel ── */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-ink/40" />
          <div>
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
              Ledger filters
            </div>
            <h2 className="mt-0.5 font-display text-[15px] font-semibold text-ink">Account &amp; date range</h2>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="ledger-account" className={labelClass}>
              Account
            </label>
            <select
              id="ledger-account"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select account…</option>
              {groups.map(g => (
                <optgroup key={g.type} label={g.label}>
                  {g.items.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.code} · {a.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="w-44">
            <label htmlFor="ledger-from" className={labelClass}>
              From
            </label>
            <input
              id="ledger-from"
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="w-44">
            <label htmlFor="ledger-to" className={labelClass}>
              To
            </label>
            <input id="ledger-to" type="date" value={to} onChange={e => setTo(e.target.value)} className={inputClass} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={applyFilters}
              className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
            >
              <CalendarRange size={14} /> Apply
            </button>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink/70 transition-colors hover:bg-paper-dim"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
      </div>

      {state === "loading" && (
        <div className="flex items-center gap-2 py-16 text-ink/50">
          <Loader2 size={16} className="animate-spin" /> Loading ledger…
        </div>
      )}

      {state === "error" && (
        <div className="rounded-2xl border border-danger/25 bg-danger-bg px-4 py-3 text-[13px] text-danger">{error}</div>
      )}

      {state === "ready" && ledger && (
        <>
          {/* ── Account summary strip ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(s => (
              <div
                key={s.label}
                className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]"
              >
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                  {s.label}
                </div>
                <div className={`mt-2 font-display text-[19px] tracking-tight ${s.tone}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ── Running-balance trend ── */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                  Balance over postings
                </div>
                <h2 className="mt-0.5 font-display text-[15px] font-semibold text-ink">Running Balance Trend</h2>
              </div>
              {ledger.rows.length >= 2 && (
                <div className="flex items-center gap-1.5 text-[12px] text-ink/60">
                  <span className="h-2 w-2 rounded-full bg-teal-mid" /> Running balance
                </div>
              )}
            </div>
            {ledger.rows.length >= 2 ? (
              <div className="mt-3">
                <Sparkline points={ledger.rows.map(r => r.runningBalance)} color="#1b5a50" />
              </div>
            ) : (
              <div className="mt-3 flex h-9 items-center text-[12.5px] text-ink/45">
                Not enough postings to plot a trend yet.
              </div>
            )}
          </div>

          {/* ── Ledger table ── */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div>
                  <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                    Postings · {ledger.account.code}
                  </div>
                  <h2 className="mt-0.5 font-display text-[15px] font-semibold text-ink">{ledger.account.name}</h2>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] ${TYPE_CHIP[ledger.account.type]}`}
                >
                  {TYPE_LABELS[ledger.account.type]}
                </span>
              </div>
              {hasActiveFilters && (
                <span className="rounded-full bg-paper-dim px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  {filters.from ? `${filters.from} → ` : ""}
                  {filters.to || "today"}
                </span>
              )}
            </div>

            {ledger.rows.length === 0 ? (
              <div className="px-5 py-12 text-center text-[13px] text-ink/50">
                No postings for {ledger.account.name} in the selected range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/40">
                      <th className="px-5 py-3 font-medium">Ref</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Description</th>
                      <th className="px-5 py-3 text-right font-medium">Debit</th>
                      <th className="px-5 py-3 text-right font-medium">Credit</th>
                      <th className="px-5 py-3 text-right font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.rows.map(row => (
                      <tr key={row.id} className="border-b border-line/60 transition-colors hover:bg-paper/60">
                        <td className="px-5 py-3 font-mono text-[12px] text-ink/70">{row.referenceNo}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-ink/70">
                          {new Date(row.entryDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3 font-medium text-ink">
                          {row.description}
                          {row.narration && (
                            <span className="block text-[11.5px] font-normal text-ink/45">{row.narration}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-teal-mid">
                          {row.debit > 0 ? formatINR(row.debit) : "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-stamp">
                          {row.credit > 0 ? formatINR(row.credit) : "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-ink">
                          {formatINR(row.runningBalance)}
                        </td>
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
