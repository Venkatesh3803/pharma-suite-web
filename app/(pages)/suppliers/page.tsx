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
  Search,
  Truck,
  X,
} from "lucide-react";
import {
  suppliersApi,
  type SupplierRow,
} from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { formatINR, formatDate } from "@/lib/inventory";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type LoadState = "loading" | "error" | "ready";

const inputBase =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

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
  const user = useAppSelector(state => state.auth.user);
  const canManage =
    user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "MANAGER";

  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [list, setList] = useState<{ items: SupplierRow[]; total: number } | null>(null);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

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

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await suppliersApi.list({ search: search || undefined, pageSize: 50 });
        if (!ignore) {
          setList(data);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load suppliers.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [search, refreshKey]);

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
      setRefreshKey(k => k + 1);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not create vendor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Vendor Master
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Suppliers
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Manage distributors, track purchase value and open orders.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              form.reset();
              setShowForm(true);
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-teal-mid/30 bg-teal-mid px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-teal-deep"
          >
            <Plus size={15} strokeWidth={2.2} />
            Add Vendor
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <div className="flex max-w-md items-center gap-2 border border-line bg-white px-3 py-2">
        <Search size={15} className="text-ink/40" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, code, contact, phone, GSTIN…"
          className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none font-body"
        />
      </div>

      {toast && (
        <div className="border border-teal-mid/30 bg-teal-mid/10 px-3 py-2 text-[13px] font-medium text-teal-mid">
          {toast}
        </div>
      )}

      {state === "loading" && (
        <div className="flex items-center gap-2 py-16 text-ink/50">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-[13px]">Loading vendors…</span>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-2xl border border-danger/40 bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}

      {state === "ready" && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <table className="w-full text-left font-body">
            <thead>
              <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink/45">
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium text-right">Open Orders</th>
                <th className="px-4 py-3 font-medium text-right">Total Purchased</th>
                <th className="px-4 py-3 font-medium text-right">Last Purchase</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list?.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-ink/45">
                    No vendors found.
                  </td>
                </tr>
              )}
              {list?.items.map(s => (
                <tr
                  key={s.id}
                  onClick={() => router.push(`/suppliers/${s.id}`)}
                  className="cursor-pointer border-b border-line/70 transition-colors hover:bg-teal-mid/5"
                >
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-ink/65">{s.email ?? "—"}</td>
                  <td className="px-4 py-3 text-[12.5px] text-ink/65">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] text-ink">
                    {s.openOrders ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] text-ink">
                    {formatINR(s.totalPurchased ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-[12.5px] text-ink/60">
                    {formatDate(s.lastPurchase)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ArrowUpRight size={15} className="ml-auto text-ink/30" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list && list.total > 50 && (
            <div className="border-t border-line bg-paper-dim px-4 py-2 text-[12px] text-ink/50">
              Showing first 50 of {list.total} vendors — refine your search.
            </div>
          )}
        </div>
      )}

      {/* ── Add Vendor Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-teal-mid" />
                <span className="font-display text-[15px] font-semibold text-ink">
                  Add Vendor
                </span>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="cursor-pointer text-ink/40 transition-colors hover:text-ink"
              >
                <X size={17} />
              </button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)}>
                <div className="grid grid-cols-1 gap-3.5 px-5 py-4 sm:grid-cols-2">
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
                <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="cursor-pointer rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink/60 transition-colors hover:bg-paper-dim"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-teal-mid/30 bg-teal-mid px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? "Saving…" : "Create Vendor"}
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