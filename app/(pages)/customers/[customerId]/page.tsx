"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Banknote, CalendarClock, CheckCircle2, Loader2, Mail, MapPin, Pencil, Phone, ReceiptText, ShoppingBag, User, X } from "lucide-react";
import { customersApi, type CustomerRow } from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { formatINR, formatDateTime } from "@/lib/inventory";
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

interface CustomerDetail extends CustomerRow {
    sales: {
        id: string;
        invoiceNo: string;
        createdAt: string;
        total: number;
        status: string;
        paymentMode: string;
        items: { product: { brand: string } }[];
    }[];
    prescriptions: unknown[];
    frequentlyPurchased: { productId: string; totalQuantity: number; product: { id: string; brand: string; genericName: string | null } }[];
    lastPurchase: { invoiceNo: string; createdAt: string } | null;
    purchaseFrequency: number;
}

export default function CustomerDetailPage() {
    const params = useParams<{ customerId: string }>();
    const customerId = params.customerId;
    const user = useAppSelector(state => state.auth.user);
    const canManage = user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "MANAGER" || user?.role === "PHARMACIST";

    const [detail, setDetail] = useState<CustomerDetail | null>(null);
    const [state, setState] = useState<LoadState>("loading");
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [toast, setToast] = useState<string | null>(null);

    const [showEdit, setShowEdit] = useState(false);
    const [saving, setSaving] = useState(false);

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: { name: "", phone: "", email: "", address: "", notes: "" },
    });
    const { reset } = form;

    useEffect(() => {
        let ignore = false;
        async function load() {
            try {
                const d = await customersApi.get(customerId);
                if (!ignore) {
                    setDetail(d as CustomerDetail);
                    reset({
                        name: d.name,
                        phone: d.phone ?? undefined,
                        email: d.email ?? undefined,
                        address: d.address ?? undefined,
                        notes: d.notes ?? undefined
                    });
                    setState("ready");
                }
            } catch (e) {
                if (!ignore) {
                    setError(e instanceof Error ? e.message : "Could not load customer.");
                    setState("error");
                }
            }
        }
        void load();
        return () => {
            ignore = true;
        };
    }, [customerId, refreshKey, reset]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [toast]);

    const saveCustomer = async (values: CustomerFormValues) => {
        setSaving(true);
        try {
            await customersApi.update(customerId, {
                name: values.name.trim(),
                phone: values.phone?.trim() || undefined,
                email: values.email?.trim() || undefined,
                address: values.address?.trim() || undefined,
                notes: values.notes?.trim() || undefined
            });
            setShowEdit(false);
            setToast("Customer updated.");
            setRefreshKey(k => k + 1);
        } catch (e) {
            setToast(e instanceof Error ? e.message : "Could not update customer.");
        } finally {
            setSaving(false);
        }
    };

    if (state === "error") {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-16 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <ReceiptText size={32} className="text-danger/60" />
                <div>
                    <div className="text-[14px] font-medium text-ink">Could not load this customer.</div>
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
        );
    }

    if (state === "loading" || !detail) {
        return (
            <div className="flex items-center justify-center gap-2 py-24 text-[13px] text-ink/45">
                <Loader2 size={16} className="animate-spin" /> Loading customer…
            </div>
        );
    }

    const totalSpend = detail.sales.reduce((acc, s) => acc + Number(s.total), 0);

    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Link
                        href="/customers"
                        className="mb-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink/55 transition-colors hover:text-stamp"
                    >
                        <ArrowLeft size={14} /> Back to Customers
                    </Link>
                    <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">Customer Profile</span>
                    <h1 className="mt-1.5 flex items-center gap-3 font-display text-2xl font-semibold tracking-tight text-ink">
                        <User size={22} className="text-stamp" /> {detail.name}
                    </h1>
                </div>
                {canManage && (
                    <button
                        onClick={() => setShowEdit(true)}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink/70 transition-colors hover:border-stamp hover:text-stamp"
                    >
                        <Pencil size={15} /> Edit Profile
                    </button>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/45 font-mono">
                        <Banknote size={13} /> Lifetime Value
                    </div>
                    <div className="mt-1.5 font-mono text-[22px] font-bold text-ink">{formatINR(totalSpend)}</div>
                    <div className="mt-0.5 text-[12px] text-ink/50">{detail.purchaseFrequency} invoice(s)</div>
                </div>
                <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/45 font-mono">
                        <CalendarClock size={13} /> Last Purchase
                    </div>
                    <div className="mt-1.5 text-[15px] font-semibold text-ink">{detail.lastPurchase?.invoiceNo ?? "—"}</div>
                    <div className="mt-0.5 text-[12px] text-ink/50">
                        {detail.lastPurchase ? formatDateTime(detail.lastPurchase.createdAt) : "No purchases yet"}
                    </div>
                </div>
                <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/45 font-mono">
                        <ShoppingBag size={13} /> Frequently Bought
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {detail.frequentlyPurchased.slice(0, 4).map(fp => (
                            <Link
                                key={fp.productId}
                                href={`/inventory/${fp.productId}`}
                                className="border border-line bg-paper-dim px-2 py-1 text-[12px] font-semibold text-ink/70 hover:border-stamp hover:text-stamp rounded-lg"
                            >
                                {fp.product.brand}
                            </Link>
                        ))}
                        {detail.frequentlyPurchased.length === 0 && <span className="text-[12.5px] text-ink/45">Not enough data</span>}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="border-b border-line px-5 py-3.5">
                        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Purchase History</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-[13.5px]">
                            <thead>
                                <tr className="border-b border-line">
                                    <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Invoice</th>
                                    <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Date</th>
                                    <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Items</th>
                                    <th className="px-4 py-3 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {detail.sales.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-ink/45">
                                            No invoices for this customer yet.
                                        </td>
                                    </tr>
                                )}
                                {detail.sales.map(s => (
                                    <tr key={s.id} className="border-b border-line/60">
                                        <td className="px-4 py-3">
                                            <Link href={`/sales/${s.id}`} className="font-mono text-[13px] font-semibold text-ink hover:text-stamp">
                                                {s.invoiceNo}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-ink/60">{formatDateTime(s.createdAt)}</td>
                                        <td className="px-4 py-3 text-ink/60">
                                            {s.items
                                                .map(i => i.product.brand)
                                                .slice(0, 2)
                                                .join(", ")}
                                            {s.items.length > 2 ? ` +${s.items.length - 2} more` : ""}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-ink">{formatINR(Number(s.total))}</td>
                                        <td className="px-4 py-3 text-center text-[12px] font-semibold text-ink/55">{s.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                        <div className="mb-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Contact Details</div>
                        <div className="flex flex-col gap-2 text-[13px] text-ink/70">
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-ink/35" /> {detail.phone ?? "—"}
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-ink/35" /> {detail.email ?? "—"}
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="mt-0.5 shrink-0 text-ink/35" />
                                <span>{detail.address ?? "—"}</span>
                            </div>
                        </div>
                    </div>
                    {detail.notes && (
                        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                            <div className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Notes</div>
                            <div className="text-[13px] text-ink/70">{detail.notes}</div>
                        </div>
                    )}
                </div>
            </div>

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
                    <CheckCircle2 size={16} className="text-teal-mid" />
                    <span className="text-[13px] text-ink">{toast}</span>
                </div>
            )}

            {showEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
                    <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-line px-5 py-4">
                            <div className="font-display text-[17px] font-semibold text-ink">Edit Customer</div>
                            <button
                                onClick={() => setShowEdit(false)}
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
                                                <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
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
                                                <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
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
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
                                                    Address
                                                </FormLabel>
                                                <FormControl>
                                                    <textarea {...field} rows={2} className={inputBase} />
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
                                                    <textarea {...field} rows={2} className={inputBase} />
                                                </FormControl>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEdit(false)}
                                        className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink/70 hover:border-ink/30"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-wait disabled:opacity-70"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" /> Saving…
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
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
