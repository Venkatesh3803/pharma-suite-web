"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  ClipboardList,
  Loader2,
  ReceiptText,
  Search,
} from "lucide-react";
import {
  salesApi,
  type SaleRow,
  type SaleStatus,
  type PaymentMode,
} from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { formatINR, formatDateTime } from "@/lib/inventory";

type LoadState = "loading" | "error" | "ready";

const statusBadge: Record<SaleStatus, string> = {
  PAID: "border border-teal-mid/30 bg-teal-mid/10 text-teal-mid",
  DUE: "border border-stamp/30 bg-stamp-dim text-stamp",
  PARTIAL_RETURN: "border border-stamp/40 bg-stamp-dim text-stamp",
  RETURNED: "border border-ink/30 bg-ink/5 text-ink/60",
  VOID: "border border-danger/40 bg-danger-bg text-danger",
};

const statusLabel: Record<SaleStatus, string> = {
  PAID: "Paid",
  DUE: "Credit Due",
  PARTIAL_RETURN: "Partially Returned",
  RETURNED: "Returned",
  VOID: "Void",
};

const paymentLabel: Record<PaymentMode, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT: "Credit",
};

const FILTERS: { value: SaleStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PAID", label: "Paid" },
  { value: "DUE", label: "Credit Due" },
  { value: "PARTIAL_RETURN", label: "Partial Returns" },
  { value: "RETURNED", label: "Returned" },
];

export default function SalesPage() {
  const router = useRouter();
  const user = useAppSelector(state => state.auth.user);
  const canSell =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "PHARMACIST";

  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [list, setList] = useState<{ items: SaleRow[]; total: number } | null>(null);
  const [status, setStatus] = useState<SaleStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await salesApi.list({
          status: status === "ALL" ? undefined : status,
          search: search.trim() || undefined,
          page,
          pageSize: 25,
        });
        if (!ignore) {
          setList(data);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load sales.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [status, search, page, refreshKey]);

  const totalPages = list ? Math.max(1, Math.ceil(list.total / 25)) : 1;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Point of Sale
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Sales Ledger
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Every settled invoice with live FEFO stock deduction, payment mode
            and return status.
          </p>
        </div>
        {canSell && (
          <button
            onClick={() => router.push("/billing")}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
          >
            <Banknote size={15} /> New Sale
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
              status === f.value
                ? "border-ink bg-ink text-paper"
                : "border-line bg-white text-ink/60 hover:border-stamp hover:text-stamp"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="relative ml-auto w-full max-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Invoice # or customer…"
            className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15"
          />
        </div>
      </div>

      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <ReceiptText size={32} className="text-danger/60" />
          <div>
            <div className="text-[14px] font-medium text-ink">Could not load the sales ledger.</div>
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

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Invoice</th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Customer</th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Branch</th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Sold At</th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Payment</th>
                <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">Total</th>
                <th className="px-4 py-3.5 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">Status</th>
                <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">View</th>
              </tr>
            </thead>
            <tbody>
              {state === "loading" && !list && (
                <tr>
                  <td colSpan={8} className="px-12 py-14">
                    <div className="flex items-center justify-center gap-2 text-[13px] text-ink/45">
                      <Loader2 size={16} className="animate-spin" /> Loading sales ledger…
                    </div>
                  </td>
                </tr>
              )}

              {state === "ready" &&
                list?.items.map(sale => (
                  <tr
                    key={sale.id}
                    onClick={() => router.push(`/sales/${sale.id}`)}
                    className="cursor-pointer border-b border-line/60 transition-colors hover:bg-paper/70"
                  >
                    <td className="px-4 py-3.5 font-mono text-[13px] font-semibold text-ink">
                      {sale.invoiceNo}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-ink/80">
                        {sale.customer?.name ?? "Walk-in Customer"}
                      </div>
                      {sale.createdBy && (
                        <div className="text-[11px] text-ink/40">by {sale.createdBy.fullName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-ink/60">{sale.branch?.name ?? "—"}</td>
                    <td className="px-4 py-3.5 text-ink/60">{formatDateTime(sale.createdAt)}</td>
                    <td className="px-4 py-3.5 text-ink/60">{paymentLabel[sale.paymentMode]}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-ink">
                      {formatINR(Number(sale.total))}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11.5px] font-semibold ${
                          statusBadge[sale.status]
                        }`}
                      >
                        {statusLabel[sale.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/sales/${sale.id}`);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-[12px] font-semibold text-ink/70 transition-colors hover:border-stamp hover:text-stamp"
                      >
                        Open <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}

              {state === "ready" && list && list.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-12 py-12 text-center text-ink/40">
                    <ClipboardList size={32} className="mx-auto mb-3 opacity-40" />
                    <div className="text-[14px]">No invoices found for these filters.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-[12.5px] text-ink/50">
        <span>
          {list ? `${list.total} invoice${list.total === 1 ? "" : "s"}` : "—"}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 font-semibold text-ink/70 transition-colors hover:border-stamp hover:text-stamp disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <span className="font-mono">Page {page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 font-semibold text-ink/70 transition-colors hover:border-stamp hover:text-stamp disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
