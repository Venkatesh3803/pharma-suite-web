"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  customersApi,
  type CustomerRow,
} from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { formatDateTime } from "@/lib/inventory";
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

const customerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required."),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const router = useRouter();
  const user = useAppSelector(state => state.auth.user);
  const canManage =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "PHARMACIST";

  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [list, setList] = useState<{ items: CustomerRow[]; total: number } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", email: "", address: "", notes: "" },
  });

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await customersApi.list({
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
          setError(e instanceof Error ? e.message : "Could not load customers.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [search, page, refreshKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const saveCustomer = async (values: CustomerFormValues) => {
    setSaving(true);
    try {
      await customersApi.create({
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        address: values.address?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
      setShowCreate(false);
      form.reset();
      setToast("Customer created.");
      setRefreshKey(k => k + 1);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not create customer.");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = list ? Math.max(1, Math.ceil(list.total / 25)) : 1;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            CRM
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Customers
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Regular buyers, their purchase history and frequently dispensed
            medicines.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              form.reset();
              setShowCreate(true);
            }}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
          >
            <UserPlus size={15} /> Add Customer
          </button>
        )}
      </div>

      <div className="relative w-full max-w-[320px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or phone…"
          className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15"
        />
      </div>

      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <Users size={32} className="text-danger/60" />
          <div>
            <div className="text-[14px] font-medium text-ink">Could not load customers.</div>
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
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Name</th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Phone</th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Email</th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Address</th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Added</th>
                <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">Open</th>
              </tr>
            </thead>
            <tbody>
              {state === "loading" && !list && (
                <tr>
                  <td colSpan={6} className="px-12 py-14">
                    <div className="flex items-center justify-center gap-2 text-[13px] text-ink/45">
                      <Loader2 size={16} className="animate-spin" /> Loading customers…
                    </div>
                  </td>
                </tr>
              )}

              {state === "ready" &&
                list?.items.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/customers/${c.id}`)}
                    className="cursor-pointer border-b border-line/60 transition-colors hover:bg-paper/70"
                  >
                    <td className="px-4 py-3.5 font-medium text-ink/80">{c.name}</td>
                    <td className="px-4 py-3.5 font-mono text-[12.5px] text-ink/60">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3.5 text-ink/60">{c.email ?? "—"}</td>
                    <td className="max-w-[220px] truncate px-4 py-3.5 text-ink/60">{c.address ?? "—"}</td>
                    <td className="px-4 py-3.5 text-ink/60">{formatDateTime(c.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/customers/${c.id}`);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-[12px] font-semibold text-ink/70 transition-colors hover:border-stamp hover:text-stamp"
                      >
                        Profile <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}

              {state === "ready" && list && list.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-12 py-12 text-center text-ink/40">
                    <Users size={32} className="mx-auto mb-3 opacity-40" />
                    <div className="text-[14px]">No customers found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-[12.5px] text-ink/50">
        <span>{list ? `${list.total} customer${list.total === 1 ? "" : "s"}` : "—"}</span>
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

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
          <CheckCircle2 size={16} className="text-teal-mid" />
          <span className="text-[13px] text-ink">{toast}</span>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="font-display text-[17px] font-semibold text-ink">Add Customer</div>
              <button
                onClick={() => setShowCreate(false)}
                className="cursor-pointer border-0 bg-transparent p-1 text-ink/40 transition-colors hover:text-danger"
              >
                <X size={20} />
              </button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(saveCustomer)}>
                <div className="flex flex-col gap-3 p-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
                          Name *
                        </FormLabel>
                        <FormControl>
                          <input {...field} placeholder="Full name" className={inputBase} />
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
                        <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
                          Phone
                        </FormLabel>
                        <FormControl>
                          <input {...field} placeholder="Mobile number" className={inputBase} />
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
                        <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
                          Email
                        </FormLabel>
                        <FormControl>
                          <input type="email" {...field} placeholder="name@example.com" className={inputBase} />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
                          Address
                        </FormLabel>
                        <FormControl>
                          <textarea {...field} placeholder="Billing address" rows={2} className={inputBase} />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
                          Notes
                        </FormLabel>
                        <FormControl>
                          <textarea {...field} placeholder="Allergies, preferences…" rows={2} className={inputBase} />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink/70 hover:border-ink/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-wait disabled:opacity-70"
                  >
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Create Customer"}
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