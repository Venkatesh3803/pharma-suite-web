"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  Loader2,
  ReceiptText,
  RotateCcw,
  Undo2,
  User,
} from "lucide-react";
import {
  salesApi,
  type SaleDetail,
  type SaleStatus,
  type PaymentMode,
} from "@/lib/api";
import type { LoadState } from "@/lib/hooks/usePaginatedList";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { formatINR, formatDateTime } from "@/lib/inventory";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  PageHeader,
  ErrorState,
  TableShell,
  Th,
  Td,
  TableRow,
  StatusBadge,
  PrimaryButton,
  Modal,
  inputBase,
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

const returnFormSchema = z.object({
  returnRows: z
    .array(
      z.object({
        saleItemId: z.string(),
        productLabel: z.string(),
        maxQty: z.number(),
        quantity: z
          .string()
          .refine(
            v =>
              v.trim() === "" ||
              (Number.isInteger(Number(v)) && Number(v) > 0),
            "Whole number of 1 or more.",
          ),
        reason: z.string(),
      }),
    )
    .superRefine((rows, ctx) => {
      if (!rows.some(r => r.quantity.trim() !== "" && Number(r.quantity) > 0)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a whole-number return quantity for at least one item.",
        });
      }
    }),
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

export default function SaleDetailPage() {
  const params = useParams<{ saleId: string }>();
  const saleId = params.saleId;
  const { can } = usePermissions();
  const canReturn = can.isPharmacistOrAbove();

  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const [showReturn, setShowReturn] = useState(false);
  const [returning, setReturning] = useState(false);

  const returnForm = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      returnRows: [],
    },
  });
  const { fields } = useFieldArray({
    control: returnForm.control,
    name: "returnRows",
  });

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const d = await salesApi.get(saleId);
        if (!ignore) {
          setDetail(d);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load invoice.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [saleId, refreshKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const openReturn = () => {
    if (!detail) return;
    const rows = detail.items
      .filter(item => item.quantity - item.returnedQty > 0)
      .map(item => ({
        saleItemId: item.id,
        productLabel: `${item.product.brand}${item.product.strength ? ` ${item.product.strength}` : ""}${
          item.batch ? ` · ${item.batch.batchNumber}` : ""
        }`,
        maxQty: item.quantity - item.returnedQty,
        quantity: "",
        reason: "",
      }));
    if (rows.length === 0) {
      setToast("Nothing left to return on this invoice.");
      return;
    }
    returnForm.reset({ returnRows: rows });
    setShowReturn(true);
  };

  const submitReturn = async (values: ReturnFormValues) => {
    setReturning(true);
    try {
      const items = values.returnRows
        .filter(r => r.quantity.trim() !== "" && Number(r.quantity) > 0)
        .map(r => ({
          saleItemId: r.saleItemId,
          quantity: Number(r.quantity),
          reason: r.reason.trim() || undefined,
        }));
      const result = await salesApi.returnGoods(saleId, items);
      setShowReturn(false);
      returnForm.reset();
      setToast(
        `Return recorded — refund ${formatINR(result.totalRefund)}, status ${statusLabel[result.status]}.`,
      );
      setRefreshKey(k => k + 1);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Return failed.");
    } finally {
      setReturning(false);
    }
  };

  if (state === "error") {
    return (
      <ErrorState
        title="Could not load this invoice."
        description={error}
        onRetry={() => {
          setState("loading");
          setRefreshKey(k => k + 1);
        }}
        icon={<ReceiptText size={32} className="text-danger/60" />}
      />
    );
  }

  if (state === "loading" || !detail) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-[13px] text-ink/45">
        <Loader2 size={16} className="animate-spin" /> Loading invoice…
      </div>
    );
  }

  const returnable = detail.items.some(item => item.quantity - item.returnedQty > 0);

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        backLink={{ href: "/sales", label: "Back to Sales Ledger" }}
        eyebrow="Invoice"
        title={
          <span className="flex items-center gap-3">
            {detail.invoiceNo}
            <StatusBadge className={statusBadge[detail.status]}>
              {statusLabel[detail.status]}
            </StatusBadge>
          </span>
        }
        description={`${formatDateTime(detail.createdAt)} · ${detail.branch?.name ?? "—"} · ${paymentLabel[detail.paymentMode]}`}
        actions={
          canReturn && returnable ? (
            <PrimaryButton onClick={openReturn}>
              <RotateCcw size={15} /> Return Goods
            </PrimaryButton>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/45 font-mono">
            <User size={13} /> Customer
          </div>
          {detail.customer ? (
            <>
              <div className="mt-1.5 text-[15px] font-semibold text-ink">{detail.customer.name}</div>
              <div className="mt-0.5 text-[12px] text-ink/50">{detail.customer.phone ?? "—"}</div>
              <Link
                href={`/customers/${detail.customer.id}`}
                className="mt-1.5 inline-block text-[12.5px] font-semibold text-stamp hover:underline"
              >
                Customer Profile →
              </Link>
            </>
          ) : (
            <div className="mt-1.5 text-[15px] font-semibold text-ink">Walk-in Customer</div>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/45 font-mono">
            <Banknote size={13} /> Payment Mode
          </div>
          <div className="mt-1.5 text-[15px] font-semibold text-ink">{paymentLabel[detail.paymentMode]}</div>
          <div className="mt-0.5 text-[12px] text-ink/50">
            Billed by {detail.createdBy?.fullName ?? "—"}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/45 font-mono">
            Invoice Total
          </div>
          <div className="mt-1.5 font-mono text-[22px] font-bold text-ink">
            {formatINR(Number(detail.total))}
          </div>
          <div className="mt-0.5 text-[12px] text-ink/50">
            Subtotal {formatINR(Number(detail.subtotal))} · Tax {formatINR(Number(detail.tax))}
          </div>
        </div>
      </div>

      <TableShell>
        <thead>
          <tr className="border-b border-line">
            <Th>Medicine</Th>
            <Th>Batch</Th>
            <Th align="right">Qty</Th>
            <Th align="right">Returned</Th>
            <Th align="right">Unit Price</Th>
            <Th align="right">GST</Th>
            <Th align="right">Total</Th>
          </tr>
        </thead>
        <tbody>
          {detail.items.map(item => (
            <TableRow key={item.id}>
              <Td>
                <Link
                  href={`/inventory/${item.productId}`}
                  className="font-medium text-ink/80 hover:text-stamp"
                >
                  {item.product.brand}
                  {item.product.strength ? ` ${item.product.strength}` : ""}
                </Link>
                <div className="text-[11px] text-ink/40">{item.product.genericName ?? ""}</div>
              </Td>
              <Td className="font-mono text-[12px] text-ink/55">
                {item.batch?.batchNumber ?? "—"}
              </Td>
              <Td align="right" className="font-mono text-ink">{item.quantity}</Td>
              <Td align="right" className="font-mono text-stamp">{item.returnedQty}</Td>
              <Td align="right" className="font-mono text-ink/70">{formatINR(Number(item.unitPrice))}</Td>
              <Td align="right" className="font-mono text-ink/55">{item.gstRate}%</Td>
              <Td align="right" className="font-mono font-bold text-ink">{formatINR(Number(item.total))}</Td>
            </TableRow>
          ))}
        </tbody>
      </TableShell>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
          <CheckCircle2 size={16} className="text-teal-mid" />
          <span className="text-[13px] text-ink">{toast}</span>
        </div>
      )}

      <Modal
        open={showReturn}
        onClose={() => setShowReturn(false)}
        title="Return Goods"
        description="Stock is restored to the originating batch and refund computed at sale price."
        width="2xl"
        className="flex max-h-[85vh] flex-col overflow-hidden"
        bodyClassName="max-h-[50vh] overflow-y-auto"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowReturn(false)}
              className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink/70 hover:border-ink/30"
            >
              Cancel
            </button>
            <PrimaryButton type="submit" form="return-form" disabled={returning}>
              {returning ? (
                <><Loader2 size={14} className="animate-spin" /> Recording…</>
              ) : (
                <><Undo2 size={14} /> Record Return</>
              )}
            </PrimaryButton>
          </>
        }
      >
        <Form {...returnForm}>
          <form id="return-form" onSubmit={returnForm.handleSubmit(submitReturn)}>
            <div className="flex flex-col gap-2">
              {fields.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-[1fr_90px_1fr] gap-2.5">
                  <div className="flex flex-col justify-center">
                    <div className="text-[13px] font-medium text-ink/80">{row.productLabel}</div>
                    <div className="text-[11px] text-ink/40">
                      {row.maxQty} returnable
                    </div>
                  </div>
                  <FormField
                    control={returnForm.control}
                    name={`returnRows.${idx}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <input
                            type="number"
                            min={0}
                            max={row.maxQty}
                            placeholder="Qty"
                            {...field}
                            onChange={e => {
                              const val = Number(e.target.value);
                              const clamped = val > row.maxQty ? String(row.maxQty) : e.target.value;
                              field.onChange(clamped);
                            }}
                            className={inputBase}
                          />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={returnForm.control}
                    name={`returnRows.${idx}.reason`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <input
                            type="text"
                            placeholder="Reason (optional)"
                            {...field}
                            className={inputBase}
                          />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              {returnForm.formState.errors.returnRows?.message && (
                <div className="text-[12px] text-danger">
                  {returnForm.formState.errors.returnRows?.message}
                </div>
              )}
            </div>
          </form>
        </Form>
      </Modal>
    </div>
  );
}
