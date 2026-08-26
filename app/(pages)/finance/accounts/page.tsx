"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpenText, Loader2, Plus, Scale, X } from "lucide-react";
import {
  financeApi,
  type AccountType,
  type FinanceAccount,
  type TrialBalanceResult,
  type TrialBalanceRow,
} from "@/lib/api";
import { formatINR } from "@/lib/inventory";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type LoadState = "loading" | "error" | "ready";

const TYPE_LABELS: Record<AccountType, string> = {
  ASSET: "Assets",
  LIABILITY: "Liabilities",
  EQUITY: "Equity",
  REVENUE: "Revenue",
  EXPENSE: "Expenses",
};

const TYPE_ORDER: AccountType[] = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

const DEBIT_NORMAL: AccountType[] = ["ASSET", "EXPENSE"];

const TYPE_DOT: Record<AccountType, string> = {
  ASSET: "#1b5a50",
  LIABILITY: "#c1652b",
  EQUITY: "#0e3b36",
  REVENUE: "#b23a2e",
  EXPENSE: "#14201c",
};

const accountSchema = z.object({
  code: z.string().trim().min(1, "Code is required."),
  name: z.string().trim().min(1, "Name is required."),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  opening: z
    .string()
    .refine(v => v === "" || !Number.isNaN(Number(v)), "Enter a valid amount."),
});

type AccountFormValues = z.infer<typeof accountSchema>;

/** Balance is signed by the account's normal side. Resolve which column it belongs to. */
function trialSide(balance: number, type: AccountType): "debit" | "credit" {
  if (balance === 0) return "credit";
  const onDebit = balance > 0 ? DEBIT_NORMAL.includes(type) : !DEBIT_NORMAL.includes(type);
  return onDebit ? "debit" : "credit";
}

export default function AccountsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [trial, setTrial] = useState<TrialBalanceResult | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { code: "", name: "", type: "EXPENSE", opening: "" },
  });

  async function fetchData() {
    return Promise.all([financeApi.accounts(), financeApi.trialBalance()]);
  }

  async function refresh() {
    const [accs, tb] = await fetchData();
    setAccounts(accs);
    setTrial(tb);
    setState("ready");
  }

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [accs, tb] = await fetchData();
        if (!ignore) {
          setAccounts(accs);
          setTrial(tb);
          setState("ready");
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

  function openNewAccount() {
    setFormError("");
    form.reset();
    setShowForm(true);
  }

  async function submit(values: AccountFormValues) {
    setSaving(true);
    setFormError("");
    try {
      await financeApi.createAccount({
        code: values.code.trim(),
        name: values.name.trim(),
        type: values.type,
        openingBalance: Number(values.opening) || 0,
      });
      setShowForm(false);
      form.reset();
      await refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not create account.");
    } finally {
      setSaving(false);
    }
  }

  const balanced = trial ? Math.abs(trial.totalDebit - trial.totalCredit) < 0.01 : false;

  const counts = useMemo(() => {
    const c: Record<AccountType, number> = {
      ASSET: 0,
      LIABILITY: 0,
      EQUITY: 0,
      REVENUE: 0,
      EXPENSE: 0,
    };
    accounts.forEach(a => {
      c[a.type] += 1;
    });
    return c;
  }, [accounts]);

  const trialByCode = useMemo(() => {
    const m = new Map<string, TrialBalanceRow>();
    trial?.rows.forEach(r => m.set(r.code, r));
    return m;
  }, [trial]);

  const inputClass =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15";

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-stamp">
            Chart of Accounts
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Accounts & Trial Balance
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            The standard ledger is seeded automatically; add your own heads as needed.
          </p>
        </div>
        <button
          onClick={openNewAccount}
          className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
        >
          <Plus size={15} /> New Account
        </button>
      </div>

      {state === "loading" && (
        <div className="flex w-full items-center justify-center gap-2 py-24 text-[13px] text-ink/45">
          <Loader2 size={16} className="animate-spin" /> Loading accounts…
        </div>
      )}

      {state === "error" && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-danger/25 bg-danger-bg/60 px-5 py-4">
          <div className="text-[13px] text-danger">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded-lg border border-danger/30 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-danger transition-colors hover:bg-danger-bg"
          >
            Retry
          </button>
        </div>
      )}

      {state === "ready" && (
        <>
          {/* ── Stat strip ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-mid/10 text-teal-mid">
                  <BookOpenText size={17} />
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                    Total accounts
                  </div>
                  <div className="mt-0.5 font-display text-[22px] font-bold tracking-tight text-ink">
                    {accounts.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                Account classes
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1.5">
                {TYPE_ORDER.map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-[12px] text-ink/70">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TYPE_DOT[t] }} />
                    <span className="font-medium">{TYPE_LABELS[t]}</span>
                    <span className="font-mono text-ink/45">{counts[t]}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                Trial balance
              </div>
              {trial && (
                <div className="mt-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                      balanced
                        ? "border-teal-mid/30 bg-teal-mid/10 text-teal-mid"
                        : "border-danger/30 bg-danger-bg text-danger"
                    }`}
                  >
                    <Scale size={13} />
                    {balanced ? "BALANCED" : "OUT OF BALANCE"}
                  </span>
                  <div className="mt-1.5 text-[11.5px] text-ink/50">
                    {balanced
                      ? `Debits = Credits · ${formatINR(trial.totalDebit)}`
                      : `Off by ${formatINR(Math.abs(trial.totalDebit - trial.totalCredit))}`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Chart of Accounts + Trial Balance ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="border-b border-line px-5 py-4">
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                  Ledger heads
                </div>
                <h2 className="mt-0.5 font-display text-[15px] font-semibold text-ink">
                  Chart of Accounts
                </h2>
              </div>
              <div className="max-h-[560px] space-y-3 overflow-y-auto p-5 no-scrollbar">
                {TYPE_ORDER.map(typeKey => {
                  const group = accounts.filter(a => a.type === typeKey);
                  if (group.length === 0) return null;
                  return (
                    <div key={typeKey} className="rounded-xl border border-line/70">
                      <div className="flex items-center gap-2 border-b border-line/70 px-4 py-2.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: TYPE_DOT[typeKey] }}
                        />
                        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink/45">
                          {TYPE_LABELS[typeKey]}
                        </span>
                        <span className="ml-auto rounded-md bg-paper-dim px-1.5 py-0.5 font-mono text-[10.5px] text-ink/50">
                          {group.length}
                        </span>
                      </div>
                      <div className="divide-y divide-line/60">
                        {group.map(a => {
                          const tr = trialByCode.get(a.code);
                          return (
                            <div
                              key={a.id}
                              className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-paper/60"
                            >
                              <span className="flex min-w-0 items-center gap-2.5">
                                <span className="shrink-0 font-mono text-[11.5px] text-ink/40">
                                  {a.code}
                                </span>
                                <span className="truncate text-[13px] font-medium text-ink">
                                  {a.name}
                                </span>
                              </span>
                              {tr && tr.balance !== 0 ? (
                                <span
                                  className={`flex items-center gap-1.5 font-mono text-[12px] ${
                                    trialSide(tr.balance, a.type) === "debit"
                                      ? "text-teal-mid"
                                      : "text-stamp"
                                  }`}
                                >
                                  {formatINR(Math.abs(tr.balance))}
                                  <span className="text-[9.5px] uppercase tracking-wider opacity-70">
                                    {trialSide(tr.balance, a.type) === "debit" ? "Dr" : "Cr"}
                                  </span>
                                </span>
                              ) : (
                                <span className="font-mono text-[12px] text-ink/30">—</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                    Totals must agree
                  </div>
                  <h2 className="mt-0.5 font-display text-[15px] font-semibold text-ink">
                    Trial Balance
                  </h2>
                </div>
                {trial && (
                  <span
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                      balanced
                        ? "border-teal-mid/30 bg-teal-mid/10 text-teal-mid"
                        : "border-danger/30 bg-danger-bg text-danger"
                    }`}
                  >
                    <Scale size={13} />
                    {balanced ? "BALANCED" : "OUT OF BALANCE"}
                  </span>
                )}
              </div>
              {trial && (
                <>
                  <div className="max-h-[440px] overflow-y-auto no-scrollbar">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/40">
                          <th className="px-5 py-3 font-medium">Account</th>
                          <th className="px-5 py-3 text-right font-medium">Debit</th>
                          <th className="px-5 py-3 text-right font-medium">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trial.rows.map(r => {
                          const side = trialSide(r.balance, r.type);
                          return (
                            <tr
                              key={r.id}
                              className="border-b border-line/60 transition-colors hover:bg-paper/60"
                            >
                              <td className="px-5 py-3 text-ink/80">
                                <span className="font-mono text-[11.5px] text-ink/40">{r.code}</span>{" "}
                                {r.name}
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-teal-mid">
                                {r.balance !== 0 && side === "debit"
                                  ? formatINR(Math.abs(r.balance))
                                  : "—"}
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-stamp">
                                {r.balance !== 0 && side === "credit"
                                  ? formatINR(Math.abs(r.balance))
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-line bg-paper-dim">
                          <td className="px-5 py-3 font-semibold text-ink">Totals</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-ink">
                            {formatINR(trial.totalDebit)}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-ink">
                            {formatINR(trial.totalCredit)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── New Account Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4">
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl border border-line bg-white shadow-[0_16px_48px_rgba(20,32,28,0.18)]">
            <div className="flex items-start justify-between border-b border-line px-6 py-4">
              <div>
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-stamp">
                  Chart of Accounts
                </span>
                <h2 className="mt-1 font-display text-lg font-semibold text-ink">New Account</h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="cursor-pointer border-0 bg-transparent p-1 text-ink/50 transition-colors hover:text-danger"
              >
                <X size={18} />
              </button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)}>
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-1.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                            Code
                          </FormLabel>
                          <FormControl>
                            <input {...field} placeholder="e.g. 6010" className={inputClass} />
                          </FormControl>
                          <FormMessage className="text-[12px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-1.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                            Type
                          </FormLabel>
                          <FormControl>
                            <select {...field} className={inputClass}>
                              {TYPE_ORDER.map(t => (
                                <option key={t} value={t}>
                                  {TYPE_LABELS[t]}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage className="text-[12px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="mb-1.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                            Name
                          </FormLabel>
                          <FormControl>
                            <input {...field} placeholder="e.g. Staff Welfare" className={inputClass} />
                          </FormControl>
                          <FormMessage className="text-[12px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="opening"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="mb-1.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                            Opening Balance
                          </FormLabel>
                          <FormControl>
                            <input
                              type="number"
                              {...field}
                              placeholder="0.00"
                              className={`${inputClass} text-right font-mono`}
                            />
                          </FormControl>
                          <FormMessage className="text-[12px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {formError && (
                    <div className="rounded-lg border border-danger/25 bg-danger-bg px-3 py-2 text-[12.5px] text-danger">
                      {formError}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-line bg-paper-dim/50 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink/70 transition-colors hover:bg-paper-dim"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-5 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {saving ? "Saving…" : "Create"}
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
