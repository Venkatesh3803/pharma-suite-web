"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronDown,
  ChevronUp,
  Landmark,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { financeApi, type FinanceAccount, type JournalEntryRow } from "@/lib/api";
import type { LoadState } from "@/lib/hooks/usePaginatedList";
import { formatINR } from "@/lib/inventory";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  PageHeader,
  ErrorState,
  TableShell,
  Th,
  Td,
  TableRow,
  LoadingRow,
  EmptyRow,
  Pagination,
  StatusBadge,
  PrimaryButton,
  SecondaryButton,
  Modal,
  TextInput,
  inputBase,
} from "@/components/common";

const journalSchema = z.object({
  description: z.string().trim().min(1, "A description is required."),
  entryDate: z.string().optional(),
  lines: z
    .array(
      z
        .object({
          accountId: z.string(),
          debit: z
            .string()
            .refine(v => v === "" || !Number.isNaN(Number(v)), "Invalid amount."),
          credit: z
            .string()
            .refine(v => v === "" || !Number.isNaN(Number(v)), "Invalid amount."),
          narration: z.string(),
        })
        .refine(l => !(Number(l.debit) > 0 && Number(l.credit) > 0), {
          message: "A line cannot have both debit and credit.",
        }),
    )
    .refine(
      lines => lines.filter(l => l.accountId && (Number(l.debit) || Number(l.credit))).length >= 2,
      { message: "Add at least two lines with amounts." },
    ),
});

type JournalFormValues = z.infer<typeof journalSchema>;

export default function JournalPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<JournalEntryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      description: "",
      entryDate: "",
      lines: [
        { accountId: "", debit: "", credit: "", narration: "" },
        { accountId: "", debit: "", credit: "", narration: "" },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });
  const watchedLines = useWatch({ control: form.control, name: "lines" }) ?? [];

  const totals = watchedLines.reduce(
    (acc, l) => ({
      debit: acc.debit + (Number(l?.debit) || 0),
      credit: acc.credit + (Number(l?.credit) || 0),
    }),
    { debit: 0, credit: 0 },
  );
  const balanced = Math.abs(totals.debit - totals.credit) < 0.01;

  const fetchData = useCallback(
    async (currentPage: number) => {
      return financeApi.journal({
        from: from || undefined,
        to: to || undefined,
        page: currentPage,
        limit: pageSize,
      });
    },
    [from, to],
  );

  async function refresh() {
    const data = await fetchData(page);
    setRows(data.rows);
    setTotal(data.total);
    setState("ready");
  }

  useEffect(() => {
    let ignore = false;
    async function load() {
      setState("loading");
      try {
        const data = await fetchData(page);
        if (!ignore) {
          setRows(data.rows);
          setTotal(data.total);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load journal entries.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [page, fetchData]);

  function applyFilters() {
    setFrom(fromInput);
    setTo(toInput);
    setPage(1);
  }

  function clearFilters() {
    setFromInput("");
    setToInput("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  function toggleRow(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  async function openModal() {
    setFormError("");
    form.reset({
      description: "",
      entryDate: "",
      lines: [
        { accountId: "", debit: "", credit: "", narration: "" },
        { accountId: "", debit: "", credit: "", narration: "" },
      ],
    });
    try {
      setAccounts(await financeApi.accounts());
      setShowModal(true);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not load accounts.");
      setShowModal(true);
    }
  }

  function addLine() {
    append({ accountId: "", debit: "", credit: "", narration: "" });
  }

  async function submit(values: JournalFormValues) {
    const payloadLines = values.lines
      .map(l => ({
        accountId: l.accountId,
        debit: Number(l.debit) || undefined,
        credit: Number(l.credit) || undefined,
        narration: l.narration.trim() || undefined,
      }))
      .filter(l => l.accountId && (l.debit || l.credit));
    setSaving(true);
    setFormError("");
    try {
      await financeApi.createJournal({
        description: values.description.trim(),
        entryDate: values.entryDate || undefined,
        lines: payloadLines,
      });
      setShowModal(false);
      setPage(1);
      await refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not post journal entry.");
    } finally {
      setSaving(false);
    }
  }

  async function voidEntry(id: string) {
    if (!window.confirm("Void this journal entry? Its effect is removed from the ledger.")) return;
    try {
      await financeApi.voidJournal(id);
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not void entry.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(from || to);
  const rootLinesError = (form.formState.errors.lines as unknown as { message?: string } | undefined)?.message;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        eyebrow="General Ledger"
        title="Journal Entries"
        description="Every debit is balanced by a credit. Sales & purchase receipts post automatically."
        actions={
          <PrimaryButton onClick={openModal} className="px-4 py-2">
            <Plus size={15} /> New Entry
          </PrimaryButton>
        }
      />

      {/* ── Filter row ── */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-[180px]">
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
              Date range
            </div>
            <h2 className="mt-0.5 font-display text-[15px] font-semibold text-ink">
              Filter journal entries
            </h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ink/50">
                From
              </span>
              <TextInput
                type="date"
                value={fromInput}
                onChange={e => setFromInput(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ink/50">
                To
              </span>
              <TextInput
                type="date"
                value={toInput}
                onChange={e => setToInput(e.target.value)}
              />
            </label>
            <PrimaryButton onClick={applyFilters} className="px-3.5 py-2">
              Apply
            </PrimaryButton>
            {hasFilters && (
              <SecondaryButton onClick={clearFilters} className="px-3.5 py-2 text-[13px]">
                <X size={13} /> Clear
              </SecondaryButton>
            )}
          </div>
        </div>
      </div>

      {state === "loading" && (
        <TableShell>
          <tbody>
            <LoadingRow colSpan={8} message="Loading journal…" />
          </tbody>
        </TableShell>
      )}

      {state === "error" && (
        <ErrorState
          title="Could not load journal entries."
          description={error}
        />
      )}

      {state === "ready" && (
        <TableShell
          footer={
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              label={
                <>
                  {total} entr{total === 1 ? "y" : "ies"}
                  {hasFilters && (
                    <>
                      {" · "}
                      <span className="font-mono text-ink/45">
                        {from ? `from ${new Date(from).toLocaleDateString("en-IN")}` : ""}
                        {from && to ? " " : ""}
                        {to ? `to ${new Date(to).toLocaleDateString("en-IN")}` : ""}
                      </span>
                    </>
                  )}
                </>
              }
            />
          }
        >
          <thead>
            <tr className="border-b border-line">
              <Th className="px-5 py-3 font-medium">Ref</Th>
              <Th className="px-5 py-3 font-medium">Date</Th>
              <Th className="px-5 py-3 font-medium">Description</Th>
              <Th className="px-5 py-3 font-medium">Lines</Th>
              <Th align="right" className="px-5 py-3 font-medium">Debits</Th>
              <Th align="right" className="px-5 py-3 font-medium">Credits</Th>
              <Th align="center" className="px-5 py-3 font-medium">Status</Th>
              <Th align="right" className="px-5 py-3 font-medium" />
            </tr>
          </thead>
              <tbody>
                {rows.length === 0 && (
                  <EmptyRow
                    colSpan={8}
                    message={
                      hasFilters
                        ? "No journal entries match this date range."
                        : "No journal entries yet. Create one manually or post a sale / purchase receipt."
                    }
                  />
                )}
                {rows.map(row => {
                  const debits = row.lines.reduce((a, l) => a + l.debit, 0);
                  const credits = row.lines.reduce((a, l) => a + l.credit, 0);
                  const isOpen = expandedId === row.id;
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow className="hover:bg-paper/60">
                        <Td className="px-5 py-3 font-mono text-[12px] text-ink/70">{row.referenceNo}</Td>
                        <Td className="whitespace-nowrap px-5 py-3 text-ink/70">
                          {new Date(row.entryDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Td>
                        <Td className="max-w-[300px] px-5 py-3 font-medium text-ink">
                          <span className="block truncate">{row.description}</span>
                        </Td>
                        <Td className="px-5 py-3">
                          <StatusBadge className="rounded-full border-line bg-paper-dim px-2 py-0.5 font-mono text-[11px] text-ink/55">
                            {row.lines.length} line{row.lines.length === 1 ? "" : "s"}
                          </StatusBadge>
                        </Td>
                        <Td align="right" className="px-5 py-3 font-mono text-teal-mid">
                          {debits > 0 ? formatINR(debits) : "—"}
                        </Td>
                        <Td align="right" className="px-5 py-3 font-mono text-stamp">
                          {credits > 0 ? formatINR(credits) : "—"}
                        </Td>
                        <Td align="center" className="px-5 py-3">
                          {row.status === "VOID" ? (
                            <StatusBadge className="rounded-full border-ink/10 bg-ink/5 px-2 py-0.5 text-[11px] text-ink/50">
                              VOID
                            </StatusBadge>
                          ) : (
                            <StatusBadge className="rounded-full border-teal-mid/20 bg-teal-mid/10 px-2 py-0.5 text-[11px] text-teal-mid">
                              POSTED
                            </StatusBadge>
                          )}
                        </Td>
                        <Td align="right" className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {row.status === "POSTED" && (
                              <button
                                onClick={() => voidEntry(row.id)}
                                title="Void entry"
                                className="cursor-pointer rounded-lg p-1.5 text-ink/40 transition-colors hover:bg-danger-bg hover:text-danger"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => toggleRow(row.id)}
                              title={isOpen ? "Collapse" : "Expand"}
                              className="cursor-pointer rounded-lg p-1.5 text-ink/40 transition-colors hover:bg-paper-dim hover:text-ink"
                            >
                              {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                          </div>
                        </Td>
                      </TableRow>
                      {isOpen && (
                        <tr className="border-b border-line/60 bg-paper/40">
                          <td colSpan={8} className="px-5 py-4">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1.4fr] gap-4 pb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/40">
                              <span>Account</span>
                              <span className="text-right">Debit</span>
                              <span className="text-right">Credit</span>
                              <span>Narration</span>
                            </div>
                            {row.lines.map((l, i) => (
                              <div
                                key={i}
                                className="grid grid-cols-[2fr_1fr_1fr_1.4fr] gap-4 border-t border-line/50 py-2.5 text-[12.5px]"
                              >
                                <span className="text-ink">
                                  <span className="font-mono text-[11px] text-ink/40">{l.accountCode}</span>
                                  <span className="mx-1.5 text-ink/25">·</span>
                                  {l.accountName}
                                </span>
                                <span className="text-right font-mono text-teal-mid">
                                  {l.debit > 0 ? formatINR(l.debit) : "—"}
                                </span>
                                <span className="text-right font-mono text-stamp">
                                  {l.credit > 0 ? formatINR(l.credit) : "—"}
                                </span>
                                <span className="truncate text-ink/55">{l.narration || "—"}</span>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
        </TableShell>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        eyebrow="Double-Entry"
        title="New Journal Entry"
        width="3xl"
        className="flex max-h-[92vh] flex-col overflow-hidden"
        bodyClassName="flex-1 space-y-4 overflow-y-auto px-6 py-5"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink/70 transition-colors hover:bg-paper-dim"
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              form="journal-form"
              disabled={saving || !balanced}
              className="px-5 py-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Landmark size={14} />}
              Post Entry
            </PrimaryButton>
          </>
        }
      >
        <Form {...form}>
          <form id="journal-form" onSubmit={form.handleSubmit(submit)}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60">
                      Description *
                    </FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="e.g. Monthly rent payment"
                        className={inputBase}
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60">
                      Entry Date
                    </FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        {...field}
                        className={inputBase}
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
              <div className="grid grid-cols-[1.6fr_1fr_1fr_1.2fr_auto] items-center gap-2 border-b border-line bg-paper/50 px-4 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/40">
                <span>Account</span>
                <span className="text-right">Debit</span>
                <span className="text-right">Credit</span>
                <span>Narration</span>
                <span />
              </div>
              {fields.map((f, idx) => {
                const lineErrors = form.formState.errors.lines as unknown as
                  | Array<{ message?: string } | undefined>
                  | { message?: string }
                  | undefined;
                const lineError = Array.isArray(lineErrors) ? lineErrors[idx]?.message : undefined;
                return (
                  <div
                    key={f.id}
                    className="grid grid-cols-[1.6fr_1fr_1fr_1.2fr_auto] items-center gap-2 border-b border-line/60 px-4 py-2.5"
                  >
                    <select
                      {...form.register(`lines.${idx}.accountId`)}
                      className={`${inputBase} cursor-pointer`}
                    >
                      <option value="">Select account…</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.code} · {a.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      {...form.register(`lines.${idx}.debit`)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-right font-mono text-[13px] text-ink focus:border-teal-mid focus:outline-none focus:ring-2 focus:ring-teal-mid/15"
                    />
                    <input
                      type="number"
                      min={0}
                      {...form.register(`lines.${idx}.credit`)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-right font-mono text-[13px] text-ink focus:border-teal-mid focus:outline-none focus:ring-2 focus:ring-teal-mid/15"
                    />
                    <input
                      {...form.register(`lines.${idx}.narration`)}
                      placeholder="Optional"
                      className={inputBase}
                    />
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      disabled={fields.length <= 2}
                      className="cursor-pointer rounded-lg p-1.5 text-ink/40 transition-colors hover:bg-danger-bg hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                    {lineError && (
                      <div className="col-span-5 text-[11.5px] font-medium text-danger">{lineError}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={addLine}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[12.5px] font-semibold text-ink/70 transition-colors hover:bg-paper-dim"
              >
                <Plus size={14} /> Add line
              </button>
              <div className="flex items-center gap-2 text-[12.5px] font-semibold">
                <span className="font-mono text-ink/60">Dr {formatINR(totals.debit)}</span>
                <span className="text-ink/30">·</span>
                <span className="font-mono text-ink/60">Cr {formatINR(totals.credit)}</span>
                <StatusBadge
                  tone={balanced ? "teal" : "danger"}
                  className="ml-1 rounded-full px-2 py-0.5 text-[10.5px]"
                >
                  {balanced ? "BALANCED" : "UNBALANCED"}
                </StatusBadge>
              </div>
            </div>

            {rootLinesError && (
              <div className="mt-4 rounded-xl border border-danger/25 bg-danger-bg px-3 py-2 text-[12.5px] text-danger">
                {rootLinesError}
              </div>
            )}

            {formError && (
              <div className="mt-4 rounded-xl border border-danger/25 bg-danger-bg px-3 py-2 text-[12.5px] text-danger">
                {formError}
              </div>
            )}
          </form>
        </Form>
      </Modal>
    </div>
  );
}
