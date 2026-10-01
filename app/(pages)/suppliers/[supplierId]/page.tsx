"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Clock,
  Loader2,
  Mail,
  Phone,
  Plus,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import {
  suppliersApi,
  type PriceHistoryResponse,
  type SupplierRow,
  type VendorPerformance,
} from "@/lib/api";
import type { LoadState } from "@/lib/hooks/usePaginatedList";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { formatINR, formatDate } from "@/lib/inventory";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  BackLink,
  ErrorState,
  Modal,
  PrimaryButton,
  SecondaryButton,
  inputBase,
} from "@/components/common";

const supplierFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required."),
  contactPerson: z.string().optional(),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]{6,20}$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  gstin: z.string().optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadTimeDays: z.number().int().min(1, "Lead time must be at least 1 day."),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export default function SupplierDetailPage() {
  const params = useParams<{ supplierId: string }>();
  const router = useRouter();
  const { can } = usePermissions();
  const canManage = can.isManagerOrAbove();

  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [supplier, setSupplier] = useState<(SupplierRow & {
    purchases: { id: string; poNumber: string; status: string; total: number; createdAt: string }[];
    vendorMedicines?: { id: string; product: { id: string; brand: string; genericName: string | null }; lastPurchasePrice: number | null; lastPurchaseDate: string | null }[];
  }) | null>(null);
  const [perf, setPerf] = useState<VendorPerformance | null>(null);
  const [history, setHistory] = useState<PriceHistoryResponse | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      gstin: "",
      address: "",
      paymentTerms: "",
      leadTimeDays: 7,
    },
  });
  const { reset } = form;

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [s, p, h] = await Promise.all([
          suppliersApi.get(params.supplierId),
          suppliersApi.performance(params.supplierId),
          suppliersApi.priceHistory(params.supplierId),
        ]);
        if (!ignore) {
          setSupplier(s);
          setPerf(p);
          setHistory(h);
          reset({
            name: s.name,
            contactPerson: s.contactPerson ?? "",
            phone: s.phone ?? "",
            email: s.email ?? "",
            gstin: s.gstin ?? "",
            address: s.address ?? "",
            paymentTerms: s.paymentTerms ?? "",
            leadTimeDays: s.leadTimeDays ?? 7,
          });
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load vendor.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [params.supplierId, reset]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const onSubmit = async (values: SupplierFormValues) => {
    setSaving(true);
    try {
      await suppliersApi.update(params.supplierId, values);
      setToast("Vendor updated.");
      setEditing(false);
      setState("loading");
      setState("ready");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not update vendor.");
    } finally {
      setSaving(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 py-16 text-ink/50">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-[13px]">Loading vendor…</span>
      </div>
    );
  }

  if (state === "error" || !supplier) {
    return (
      <div className="flex flex-col items-start gap-3">
        <BackLink href="/suppliers" label="Back to suppliers" />
        <ErrorState
          title="Could not load vendor."
          description={error}
        />
      </div>
    );
  }

  const kpis: { label: string; value: string; sub?: string }[] = [
    {
      label: "Total Orders",
      value: String(perf?.totalOrders ?? 0),
      sub: `${perf?.receivedOrders ?? 0} received`,
    },
    {
      label: "Total Value",
      value: formatINR(perf?.totalValue ?? 0),
      sub: `avg ${formatINR(perf?.avgOrderValue ?? 0)}`,
    },
    {
      label: "On-Time Rate",
      value: perf?.onTimeRate != null ? `${perf.onTimeRate.toFixed(0)}%` : "—",
      sub: perf?.avgLeadTimeDays != null ? `${perf.avgLeadTimeDays.toFixed(1)} day lead` : undefined,
    },
    {
      label: "Returns",
      value: String(perf?.returnCount ?? 0),
      sub: "to this vendor",
    },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <BackLink href="/suppliers" label="Back to suppliers" />

      {/* ── Header ── */}
      <div className="flex items-start justify-between rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-paper-dim">
            <Building2 size={20} className="text-teal-mid" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
                {supplier.name}
              </h1>
              {supplier.code && (
                <span className="rounded-lg border border-line bg-paper-dim px-2 py-0.5 font-mono text-[11px] text-ink/50">
                  {supplier.code}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-ink/60">
              {supplier.contactPerson && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-ink/35" /> {supplier.contactPerson}
                </span>
              )}
              {supplier.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-ink/35" /> {supplier.phone}
                </span>
              )}
              {supplier.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={13} className="text-ink/35" /> {supplier.email}
                </span>
              )}
              {supplier.gstin && (
                <span className="font-mono text-[11.5px] text-ink/45">GSTIN {supplier.gstin}</span>
              )}
            </div>
            {(supplier.address || supplier.paymentTerms) && (
              <div className="mt-1.5 text-[12.5px] text-ink/45">
                {supplier.address}
                {supplier.address && supplier.paymentTerms && " · "}
                {supplier.paymentTerms}
                {supplier.leadTimeDays ? ` · ${supplier.leadTimeDays} day lead` : ""}
              </div>
            )}
          </div>
        </div>
        {canManage && (
          <SecondaryButton onClick={() => setEditing(true)} className="px-3.5 py-2 text-[13px]">
            Edit Vendor
          </SecondaryButton>
        )}
      </div>

      {toast && (
        <div className="border border-teal-mid/30 bg-teal-mid/10 px-3 py-2 text-[13px] font-medium text-teal-mid">
          {toast}
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/45 font-mono">
              <TrendingUp size={12} className="text-teal-mid" />
              {k.label}
            </div>
            <div className="mt-2 font-display text-xl font-semibold text-ink">{k.value}</div>
            {k.sub && <div className="mt-0.5 text-[11.5px] text-ink/45">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Recent Purchase Orders ── */}
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ReceiptText size={15} className="text-teal-mid" />
              <span className="font-display text-[14px] font-semibold text-ink">
                Purchase History
              </span>
            </div>
            <SecondaryButton
              onClick={() => router.push(`/purchase/order/new?supplier=${supplier.id}`)}
              className="border-teal-mid/30 bg-teal-mid/10 px-3 py-1.5 text-teal-mid hover:border-teal-mid hover:bg-teal-mid hover:text-white"
            >
              <Plus size={13} /> New PO
            </SecondaryButton>
          </div>
          <div>
            {supplier.purchases.length === 0 && (
              <div className="px-4 py-8 text-center text-[13px] text-ink/45">
                No purchase orders yet.
              </div>
            )}
            {supplier.purchases.map(po => (
              <div
                key={po.id}
                onClick={() => router.push(`/purchase/order/${po.id}`)}
                className="flex cursor-pointer items-center justify-between border-b border-line/70 px-4 py-3 transition-colors hover:bg-teal-mid/5"
              >
                <div>
                  <div className="font-mono text-[12.5px] font-semibold text-ink">{po.poNumber}</div>
                  <div className="text-[11.5px] text-ink/45">{formatDate(po.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[13px] font-semibold text-ink">
                    {formatINR(Number(po.total))}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-ink/40">{po.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Price History ── */}
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
            <Clock size={15} className="text-teal-mid" />
            <span className="font-display text-[14px] font-semibold text-ink">
              Vendor Price History
            </span>
            {history && history.summary.changePct != null && (
              <span
                className={`ml-auto border px-2 py-0.5 text-[11px] font-semibold ${
                  history.summary.changePct > 0
                    ? "border-danger/30 bg-danger-bg text-danger"
                    : "border-teal-mid/30 bg-teal-mid/10 text-teal-mid"
                }`}
              >
                {history.summary.changePct > 0 ? "▲" : "▼"} {Math.abs(history.summary.changePct).toFixed(1)}%
              </span>
            )}
          </div>
          <div>
            {!history || history.rows.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-ink/45">
                No received lots recorded yet.
              </div>
            ) : (
              history.rows.slice(0, 12).map((r, i) => (
                <div
                  key={`${r.batchNumber}-${i}`}
                  className="flex items-center justify-between border-b border-line/70 px-4 py-2.5"
                >
                  <div>
                    <div className="text-[13px] font-medium text-ink">
                      {r.brand}
                      {r.strength ? ` ${r.strength}` : ""}
                    </div>
                    <div className="font-mono text-[11px] text-ink/45">
                      {r.batchNumber} · {formatDate(r.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[13px] font-semibold text-ink">
                      {formatINR(r.purchasePrice)}
                    </div>
                    <div className="text-[11px] text-ink/40">MRP {formatINR(r.mrp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        eyebrow="Vendor Master"
        title="Edit Vendor"
        width="lg"
        className="flex max-h-[85vh] flex-col overflow-hidden"
        bodyClassName="overflow-y-auto"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="cursor-pointer rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink/60 transition-colors hover:bg-paper-dim"
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              form="supplier-edit-form"
              disabled={saving}
              className="border border-teal-mid/30 bg-teal-mid px-4 py-2 text-white"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving…" : "Save Changes"}
            </PrimaryButton>
          </>
        }
      >
        <Form {...form}>
          <form id="supplier-edit-form" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink/55">
                      Vendor Name *
                    </FormLabel>
                    <FormControl>
                      <input {...field} className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink/55">
                      Contact Person
                    </FormLabel>
                    <FormControl>
                      <input {...field} className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink/55">
                      Phone
                    </FormLabel>
                    <FormControl>
                      <input {...field} className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink/55">
                      Email
                    </FormLabel>
                    <FormControl>
                      <input type="email" {...field} className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink/55">
                      GSTIN
                    </FormLabel>
                    <FormControl>
                      <input {...field} className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink/55">
                      Payment Terms
                    </FormLabel>
                    <FormControl>
                      <input {...field} className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leadTimeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink/55">
                      Lead Time (days)
                    </FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        min={1}
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                        className={inputBase}
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink/55">
                      Address
                    </FormLabel>
                    <FormControl>
                      <input {...field} className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </Modal>
    </div>
  );
}
