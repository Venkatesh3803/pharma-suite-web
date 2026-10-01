"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowUpRight,
  Building2,
  Loader2,
  Plus,
} from "lucide-react";
import { suppliersApi } from "@/lib/api";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { usePaginatedList } from "@/lib/hooks/usePaginatedList";
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
  PageHeader,
  ErrorState,
  TableShell,
  Th,
  Td,
  TableRow,
  LoadingRow,
  EmptyRow,
  PrimaryButton,
  SearchInput,
  Modal,
  inputBase,
} from "@/components/common";

const supplierSchema = z.object({
  name: z.string().trim().min(1, "Vendor name is required."),
  contactPerson: z.string().optional(),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]{6,20}$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  gstin: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadTimeDays: z.number().int().min(1, "Lead time must be at least 1 day."),
  address: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canManage = can.isManagerOrAbove();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      gstin: "",
      paymentTerms: "",
      leadTimeDays: 7,
      address: "",
    },
  });

  const { data: list, state, error, refresh, retry } = usePaginatedList({
    fetcher: () => suppliersApi.list({ search: search || undefined, pageSize: 50 }),
    deps: [search],
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const submit = async (values: SupplierFormValues) => {
    setSaving(true);
    try {
      await suppliersApi.create({
        ...values,
        name: values.name.trim(),
        contactPerson: values.contactPerson?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        gstin: values.gstin?.trim() || undefined,
        paymentTerms: values.paymentTerms?.trim() || undefined,
        address: values.address?.trim() || undefined,
      });
      setToast("Vendor created.");
      setShowForm(false);
      form.reset();
      refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not create vendor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        eyebrow="Vendor Master"
        title="Suppliers"
        description="Manage distributors, track purchase value and open orders."
        actions={
          canManage ? (
            <PrimaryButton
              className="border border-teal-mid/30 bg-teal-mid px-3.5 py-2 text-white"
              onClick={() => {
                form.reset();
                setShowForm(true);
              }}
            >
              <Plus size={15} strokeWidth={2.2} />
              Add Vendor
            </PrimaryButton>
          ) : undefined
        }
      />

      <SearchInput
        wrapperClassName="w-full max-w-md"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search name, code, contact, phone, GSTIN…"
      />

      {toast && (
        <div className="border border-teal-mid/30 bg-teal-mid/10 px-3 py-2 text-[13px] font-medium text-teal-mid">
          {toast}
        </div>
      )}

      {state === "error" && (
        <ErrorState
          title="Could not load suppliers."
          description={error}
          onRetry={retry}
        />
      )}

      {state !== "error" && (
        <TableShell
          footer={
            list && list.total > 50 ? (
              <div className="border-t border-line bg-paper-dim px-4 py-2 text-[12px] text-ink/50">
                Showing first 50 of {list.total} vendors — refine your search.
              </div>
            ) : undefined
          }
        >
          <thead>
            <tr className="border-b border-line">
              <Th className="py-3 font-medium tracking-[0.14em] text-ink/45">Vendor</Th>
              <Th className="py-3 font-medium tracking-[0.14em] text-ink/45">Contact</Th>
              <Th className="py-3 font-medium tracking-[0.14em] text-ink/45">Phone</Th>
              <Th align="right" className="py-3 font-medium tracking-[0.14em] text-ink/45">Open Orders</Th>
              <Th align="right" className="py-3 font-medium tracking-[0.14em] text-ink/45">Total Purchased</Th>
              <Th align="right" className="py-3 font-medium tracking-[0.14em] text-ink/45">Last Purchase</Th>
              <Th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {state === "loading" && !list && (
              <LoadingRow colSpan={7} message="Loading vendors…" />
            )}

            {state === "ready" && list && list.items.length === 0 && (
              <EmptyRow colSpan={7} message="No vendors found." />
            )}

            {list?.items.map(s => (
              <TableRow
                key={s.id}
                onClick={() => router.push(`/suppliers/${s.id}`)}
                hoverClassName="hover:bg-teal-mid/5"
                className="border-line/70"
              >
                <Td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-paper-dim">
                      <Building2 size={15} className="text-teal-mid" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-ink">{s.name}</span>
                        {s.code && (
                          <span className="rounded-lg border border-line bg-paper-dim px-1.5 py-0.5 font-mono text-[10px] text-ink/50">
                            {s.code}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ink/45">
                        {s.contactPerson && <span>{s.contactPerson}</span>}
                        {s.paymentTerms && (
                          <span className="text-ink/35">· {s.paymentTerms}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Td>
                <Td className="py-3 text-[12.5px] text-ink/65">{s.email ?? "—"}</Td>
                <Td className="py-3 text-[12.5px] text-ink/65">{s.phone ?? "—"}</Td>
                <Td align="right" className="py-3 font-mono text-[13px] text-ink">
                  {s.openOrders ?? 0}
                </Td>
                <Td align="right" className="py-3 font-mono text-[13px] text-ink">
                  {formatINR(s.totalPurchased ?? 0)}
                </Td>
                <Td align="right" className="py-3 text-[12.5px] text-ink/60">
                  {formatDate(s.lastPurchase)}
                </Td>
                <Td align="right" className="py-3">
                  <ArrowUpRight size={15} className="ml-auto text-ink/30" />
                </Td>
              </TableRow>
            ))}
          </tbody>
        </TableShell>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        eyebrow="Vendor Master"
        title="Add Vendor"
        width="lg"
        className="flex max-h-[85vh] flex-col overflow-hidden"
        bodyClassName="overflow-y-auto"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="cursor-pointer rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink/60 transition-colors hover:bg-paper-dim"
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              form="supplier-form"
              disabled={saving}
              className="border border-teal-mid/30 bg-teal-mid px-4 py-2 text-white"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving…" : "Create Vendor"}
            </PrimaryButton>
          </>
        }
      >
        <Form {...form}>
          <form id="supplier-form" onSubmit={form.handleSubmit(submit)}>
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
                      <input
                        {...field}
                        placeholder="e.g. A.J. Medical Distributors"
                        className={inputBase}
                      />
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
                      <input {...field} placeholder="e.g. Net 30" className={inputBase} />
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
                      Typical Lead Time (days)
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
