"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  ClipboardList,
  ReceiptText,
} from "lucide-react";
import {
  salesApi,
  type SaleStatus,
  type PaymentMode,
} from "@/lib/api";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { usePaginatedList } from "@/lib/hooks/usePaginatedList";
import { formatINR, formatDateTime } from "@/lib/inventory";
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
  SearchInput,
} from "@/components/common";

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
  const { can } = usePermissions();
  const canSell = can.isPharmacistOrAbove();

  const [status, setStatus] = useState<SaleStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const { data: list, state, error, page, setPage, retry } = usePaginatedList({
    fetcher: p =>
      salesApi.list({
        status: status === "ALL" ? undefined : status,
        search: search.trim() || undefined,
        page: p,
        pageSize: 25,
      }),
    deps: [status, search],
  });

  const totalPages = list ? Math.max(1, Math.ceil(list.total / 25)) : 1;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        eyebrow="Point of Sale"
        title="Sales Ledger"
        description="Every settled invoice with live FEFO stock deduction, payment mode and return status."
        actions={
          canSell ? (
            <PrimaryButton onClick={() => router.push("/billing")}>
              <Banknote size={15} /> New Sale
            </PrimaryButton>
          ) : undefined
        }
      />

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
        <SearchInput
          wrapperClassName="ml-auto w-full max-w-[240px]"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Invoice # or customer…"
        />
      </div>

      {state === "error" && (
        <ErrorState
          title="Could not load the sales ledger."
          description={error}
          onRetry={retry}
          icon={<ReceiptText size={32} className="text-danger/60" />}
        />
      )}

      <TableShell>
        <thead>
          <tr className="border-b border-line">
            <Th>Invoice</Th>
            <Th>Customer</Th>
            <Th>Branch</Th>
            <Th>Sold At</Th>
            <Th>Payment</Th>
            <Th align="right">Total</Th>
            <Th align="center">Status</Th>
            <Th align="right">View</Th>
          </tr>
        </thead>
        <tbody>
          {state === "loading" && !list && (
            <LoadingRow colSpan={8} message="Loading sales ledger…" />
          )}

          {state === "ready" &&
            list?.items.map(sale => (
              <TableRow
                key={sale.id}
                onClick={() => router.push(`/sales/${sale.id}`)}
              >
                <Td className="font-mono text-[13px] font-semibold text-ink">
                  {sale.invoiceNo}
                </Td>
                <Td>
                  <div className="font-medium text-ink/80">
                    {sale.customer?.name ?? "Walk-in Customer"}
                  </div>
                  {sale.createdBy && (
                    <div className="text-[11px] text-ink/40">by {sale.createdBy.fullName}</div>
                  )}
                </Td>
                <Td className="text-ink/60">{sale.branch?.name ?? "—"}</Td>
                <Td className="text-ink/60">{formatDateTime(sale.createdAt)}</Td>
                <Td className="text-ink/60">{paymentLabel[sale.paymentMode]}</Td>
                <Td align="right" className="font-mono font-bold text-ink">
                  {formatINR(Number(sale.total))}
                </Td>
                <Td align="center">
                  <StatusBadge className={statusBadge[sale.status]}>
                    {statusLabel[sale.status]}
                  </StatusBadge>
                </Td>
                <Td align="right">
                  <SecondaryButton
                    onClick={e => {
                      e.stopPropagation();
                      router.push(`/sales/${sale.id}`);
                    }}
                  >
                    Open <ArrowRight size={12} />
                  </SecondaryButton>
                </Td>
              </TableRow>
            ))}

          {state === "ready" && list && list.items.length === 0 && (
            <EmptyRow
              colSpan={8}
              icon={<ClipboardList size={32} />}
              message="No invoices found for these filters."
            />
          )}
        </tbody>
      </TableShell>

      <Pagination
        variant="bare"
        page={page}
        totalPages={totalPages}
        onChange={setPage}
        label={list ? `${list.total} invoice${list.total === 1 ? "" : "s"}` : "—"}
      />
    </div>
  );
}
