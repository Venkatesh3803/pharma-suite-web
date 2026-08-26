"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, FilePlus2, Loader2, Plus, Trash2, Truck, PackagePlus, Building2, NotebookPen } from "lucide-react";
import { branchesApi, purchasesApi, productsApi, suppliersApi, type BranchSummary, type ProductRow, type SupplierRow } from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { formatINR } from "@/lib/inventory";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export interface LineItem {
    productId: string;
    quantity: string;
    freeQuantity: string;
    purchasePrice: string;
    mrp: string;
    sellingPrice: string;
    gstRate: string;
    discount: string;
    batchNumber: string;
    expiryDate: string;
}

export const emptyLine = (): LineItem => ({
    productId: "",
    quantity: "",
    freeQuantity: "",
    purchasePrice: "",
    mrp: "",
    sellingPrice: "",
    gstRate: "",
    discount: "",
    batchNumber: "",
    expiryDate: ""
});

export interface PurchaseOrderFormInitial {
    branchId?: string;
    supplierId?: string;
    expectedDelivery?: string;
    notes?: string;
    items?: LineItem[];
}

interface Props {
    mode: "create" | "edit";
    poId?: string;
    initial?: PurchaseOrderFormInitial;
}

type LoadState = "loading" | "error" | "ready";

const lineErrors = (l: LineItem): string[] => {
    if (!l.productId) return [];
    const errs: string[] = [];
    const qty = l.quantity === "" ? NaN : Number(l.quantity);
    const free = l.freeQuantity === "" ? 0 : Number(l.freeQuantity);
    const price = l.purchasePrice === "" ? NaN : Number(l.purchasePrice);
    const mrp = l.mrp === "" ? 0 : Number(l.mrp);
    const sell = l.sellingPrice === "" ? undefined : Number(l.sellingPrice);
    const gst = l.gstRate === "" ? 0 : Number(l.gstRate);
    const disc = l.discount === "" ? 0 : Number(l.discount);

    if (!Number.isFinite(qty) || qty <= 0) errs.push("Quantity must be greater than 0.");
    if (!Number.isFinite(free) || free < 0) errs.push("Free quantity cannot be negative.");
    if (!Number.isFinite(price) || price < 0) errs.push("Purchase price cannot be negative.");
    if (!Number.isFinite(mrp) || mrp < 0) errs.push("MRP cannot be negative.");
    if (sell !== undefined && !Number.isFinite(sell)) errs.push("Selling price must be a valid number.");
    if (sell !== undefined && Number.isFinite(sell) && sell < 0) errs.push("Selling price cannot be negative.");
    if (sell !== undefined && Number.isFinite(sell) && Number.isFinite(mrp) && sell > mrp)
        errs.push("Selling price cannot be greater than MRP.");
    if (!Number.isFinite(gst) || gst < 0) errs.push("GST rate cannot be negative.");
    if (!Number.isFinite(disc) || disc < 0 || disc > 100) errs.push("Discount must be between 0 and 100%.");
    return errs;
};

const purchaseOrderSchema = z.object({
    branchId: z.string().min(1, "Select a branch."),
    supplierId: z.string(),
    expectedDelivery: z.string(),
    notes: z.string(),
    newSupplierName: z.string(),
    newSupplierContact: z.string(),
    newSupplierPhone: z.string(),
    items: z.array(
        z.object({
            productId: z.string(),
            quantity: z.string(),
            freeQuantity: z.string(),
            purchasePrice: z.string(),
            mrp: z.string(),
            sellingPrice: z.string(),
            gstRate: z.string(),
            discount: z.string(),
            batchNumber: z.string(),
            expiryDate: z.string()
        })
    )
}).superRefine((values, ctx) => {
    if (!values.supplierId && !values.newSupplierName.trim()) {
        ctx.addIssue({ code: "custom", path: ["supplierId"], message: "Select a supplier or add a new one." });
    }
    if (!values.items.some(l => l.productId && Number(l.quantity) > 0)) {
        ctx.addIssue({ code: "custom", path: ["items"], message: "Add at least one item with a quantity." });
    }
    if (values.items.filter(l => l.productId && lineErrors(l).length > 0).length > 0) {
        ctx.addIssue({ code: "custom", path: ["items"], message: "Fix the validation errors in the line items before saving the order." });
    }
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

export default function PurchaseOrderForm({ mode, poId, initial }: Props) {
    const router = useRouter();
    const user = useAppSelector(state => state.auth.user);
    const canManage = user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "MANAGER";
    const isEdit = mode === "edit" && !!poId;
    const detailHref = isEdit ? `/purchase/order/${poId}` : "/purchase/order";

    const [state, setState] = useState<LoadState>(canManage ? "loading" : "ready");
    const [error, setError] = useState("");
    const [branches, setBranches] = useState<BranchSummary[]>([]);
    const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [toast, setToast] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showNewSupplier, setShowNewSupplier] = useState(false);

    const form = useForm<PurchaseOrderFormValues>({
        resolver: zodResolver(purchaseOrderSchema),
        defaultValues: {
            branchId: initial?.branchId ?? user?.branchId ?? "",
            supplierId: initial?.supplierId ?? "",
            expectedDelivery: initial?.expectedDelivery ?? "",
            notes: initial?.notes ?? "",
            newSupplierName: "",
            newSupplierContact: "",
            newSupplierPhone: "",
            items: initial?.items?.length ? initial.items : [emptyLine()]
        }
    });
    const { control, register, setValue, getValues, formState } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const items = useWatch({ control, name: "items" }) ?? [];
    const supplierId = useWatch({ control, name: "supplierId" }) ?? "";
    const newSupplierName = useWatch({ control, name: "newSupplierName" }) ?? "";

    useEffect(() => {
        if (!canManage) return;
        let ignore = false;
        async function load() {
            try {
                const [br, su, pr] = await Promise.all([branchesApi.list(), suppliersApi.list({}), productsApi.list({ pageSize: 200 })]);
                if (!ignore) {
                    setBranches(br);
                    setSuppliers(su.items);
                    setProducts(pr.items);
                    if (!getValues("branchId") && br.length > 0) setValue("branchId", br[0].id);
                    if (!getValues("supplierId") && su.items.length > 0) setValue("supplierId", su.items[0].id);

                    if (!isEdit) {
                        const qp = new URLSearchParams(window.location.search);
                        const sup = qp.get("supplier");
                        const med = qp.get("medicine");
                        if (sup) setValue("supplierId", sup);
                        if (med && pr.items.some(p => p.id === med)) {
                            const p = pr.items.find(x => x.id === med);
                            setValue("items", [
                                {
                                    ...emptyLine(),
                                    productId: med,
                                    gstRate: p?.gstRate != null ? String(p.gstRate) : ""
                                }
                            ]);
                        }
                    }
                    setState("ready");
                }
            } catch (e) {
                if (!ignore) {
                    setError(e instanceof Error ? e.message : "Could not load procurement data.");
                    setState("error");
                }
            }
        }
        void load();
        return () => {
            ignore = true;
        };
    }, [canManage, user?.branchId, isEdit, setValue, getValues]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    const label = "mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ink/55";

    const inputBase =
        "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

    const numInput =
        "w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[13.5px] font-mono text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all";

    const lineTotal = (l: LineItem): number => {
        const qty = Number(l.quantity) || 0;
        const price = Number(l.purchasePrice) || 0;
        const disc = Number(l.discount) || 0;
        const gst = Number(l.gstRate) || 0;
        const lineSubtotal = price * qty;
        const beforeGst = lineSubtotal - (lineSubtotal * disc) / 100;
        return beforeGst + (beforeGst * gst) / 100;
    };

    const totals = items.reduce(
        (acc, l) => {
            const qty = Number(l.quantity) || 0;
            const price = Number(l.purchasePrice) || 0;
            const disc = Number(l.discount) || 0;
            const gst = Number(l.gstRate) || 0;
            const lineSubtotal = price * qty;
            const discountAmount = (lineSubtotal * disc) / 100;
            const beforeGst = lineSubtotal - discountAmount;
            acc.subtotal += lineSubtotal;
            acc.discount += discountAmount;
            acc.tax += (beforeGst * gst) / 100;
            acc.freeUnits += Number(l.freeQuantity) || 0;
            return acc;
        },
        { subtotal: 0, discount: 0, tax: 0, freeUnits: 0 }
    );
    const grandTotal = totals.subtotal - totals.discount + totals.tax;
    const validItemCount = items.filter(l => l.productId && Number(l.quantity) > 0).length;

    const selectedSupplier = suppliers.find(s => s.id === supplierId);

    const createSupplier = async (values: PurchaseOrderFormValues): Promise<string> => {
        const created = await suppliersApi.create({
            name: values.newSupplierName.trim(),
            contactPerson: values.newSupplierContact.trim() || undefined,
            phone: values.newSupplierPhone.trim() || undefined
        });
        setSuppliers(ls => [...ls, created]);
        setValue("supplierId", created.id);
        setShowNewSupplier(false);
        setValue("newSupplierName", "");
        setValue("newSupplierContact", "");
        setValue("newSupplierPhone", "");
        return created.id;
    };

    const onSubmit = async (values: PurchaseOrderFormValues) => {
        const resolvedSupplierId = values.supplierId || (values.newSupplierName.trim() ? await createSupplier(values) : "");
        const validItems = values.items
            .filter(l => l.productId && Number(l.quantity) > 0)
            .map(l => ({
                productId: l.productId,
                quantity: Number(l.quantity),
                freeQuantity: l.freeQuantity ? Number(l.freeQuantity) : undefined,
                purchasePrice: Number(l.purchasePrice) || 0,
                mrp: Number(l.mrp) || 0,
                sellingPrice: l.sellingPrice ? Number(l.sellingPrice) : undefined,
                gstRate: l.gstRate ? Number(l.gstRate) : undefined,
                discount: l.discount ? Number(l.discount) : undefined,
                batchNumber: l.batchNumber.trim() || undefined,
                expiryDate: l.expiryDate || undefined
            }));
        setSubmitting(true);
        try {
            const payload = {
                branchId: values.branchId,
                supplierId: resolvedSupplierId,
                expectedDelivery: values.expectedDelivery || undefined,
                notes: values.notes.trim() || undefined,
                items: validItems
            };
            const po = isEdit
                ? await purchasesApi.update(poId!, payload)
                : await purchasesApi.create(payload);
            setToast(isEdit ? "Purchase order updated." : "Purchase order created.");
            setTimeout(() => router.push(`/purchase/order/${po.id}`), 350);
        } catch (e) {
            setToast(e instanceof Error ? e.message : `Could not ${isEdit ? "update" : "create"} purchase order.`);
        } finally {
            setSubmitting(false);
        }
    };

    if (!canManage) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-16 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <FilePlus2 size={32} className="text-danger/60" />
                <div>
                    <div className="text-[14px] font-medium text-ink">Access restricted.</div>
                    <div className="mt-1 text-[12.5px] text-ink/50">Your role does not have permission to manage purchase orders.</div>
                </div>
                <Link href={detailHref} className="rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep">
                    Back to Purchase Orders
                </Link>
            </div>
        );
    }

    if (state === "loading") {
        return (
            <div className="flex w-full items-center justify-center gap-2 py-24 text-[13px] text-ink/45">
                <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
        );
    }

    if (state === "error") {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <FilePlus2 size={32} className="text-danger/60" />
                <div>
                    <div className="text-[14px] font-medium text-ink">Could not load procurement data.</div>
                    <div className="mt-1 text-[12.5px] text-ink/50">{error}</div>
                </div>
                <button
                    onClick={() => router.refresh()}
                    className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col gap-6">
                {/* ── Header ── */}
                <div>
                    <Link href={detailHref} className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink/55 transition-colors hover:text-stamp">
                        <ArrowLeft size={14} /> {isEdit ? "Back to Purchase Order" : "Back to Purchase Orders"}
                    </Link>
                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">Procurement</span>
                            <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">{isEdit ? "Edit Purchase Order" : "New Purchase Order"}</h1>
                            <p className="mt-1 text-[13.5px] text-ink/55">
                                {isEdit
                                    ? "Draft orders can be edited freely. Once submitted the order is locked."
                                    : "Quantities are in base units. Stock enters the ledger only when the order is received (GRN)."}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="rounded-xl border border-line bg-white px-3.5 py-2 text-right shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink/45">Lines</div>
                                <div className="font-mono text-[15px] font-bold text-ink">{String(validItemCount).padStart(2, "0")}</div>
                            </div>
                            <div className="rounded-xl border border-line bg-white px-3.5 py-2 text-right shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink/45">Grand total</div>
                                <div className="font-mono text-[15px] font-bold text-teal-deep">{formatINR(grandTotal)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                    {/* ── Main column ── */}
                    <div className="flex min-w-0 flex-1 flex-col gap-6">
                        {/* Order header */}
                        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                            <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
                                <Building2 size={14} className="text-stamp" />
                                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Order Header</span>
                            </div>
                            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
                                {!user?.branchId && (
                                    <FormField
                                        control={form.control}
                                        name="branchId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={label}>
                                                    Branch <span className="text-danger">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <select {...field} className={`${inputBase} cursor-pointer`}>
                                                        {branches.length === 0 && <option value="">No branches yet</option>}
                                                        {branches.map(b => (
                                                            <option key={b.id} value={b.id}>
                                                                {b.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FormControl>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <FormField
                                    control={form.control}
                                    name="supplierId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={label}>
                                                Supplier <span className="text-danger">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <select {...field} className={`${inputBase} cursor-pointer`}>
                                                    {suppliers.length === 0 && <option value="">No suppliers yet</option>}
                                                    {suppliers.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FormControl>
                                            <FormMessage className="text-[12px]" />
                                            <div className="mt-1.5 flex items-center justify-between">
                                                {!showNewSupplier ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewSupplier(true)}
                                                        className="cursor-pointer text-[12px] font-semibold text-stamp hover:underline"
                                                    >
                                                        + Add a new supplier
                                                    </button>
                                                ) : (
                                                    <span className="text-[12px] text-ink/45" />
                                                )}
                                                {selectedSupplier?.gstin && <span className="font-mono text-[11px] text-ink/45">GSTIN {selectedSupplier.gstin}</span>}
                                            </div>
                                            {showNewSupplier && (
                                                <div className="mt-2.5 flex flex-col gap-2 rounded-lg border border-stamp/25 bg-paper px-3 py-3">
                                                    <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stamp">
                                                        Quick add supplier
                                                    </div>
                                                    <input
                                                        type="text"
                                                        {...register("newSupplierName")}
                                                        placeholder="Supplier name"
                                                        className={inputBase}
                                                    />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="text"
                                                            {...register("newSupplierContact")}
                                                            placeholder="Contact person"
                                                            className={inputBase}
                                                        />
                                                        <input
                                                            type="text"
                                                            {...register("newSupplierPhone")}
                                                            placeholder="Phone"
                                                            className={inputBase}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => void createSupplier(getValues() as PurchaseOrderFormValues)}
                                                            disabled={!newSupplierName.trim()}
                                                            className="cursor-pointer rounded-lg bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            Save supplier
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewSupplier(false)}
                                                            className="cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-ink/60 hover:bg-paper"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expectedDelivery"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={label}>
                                                <span className="flex items-center gap-1.5">
                                                    <Truck size={12} /> Expected delivery
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <input type="date" {...field} className={inputBase} />
                                            </FormControl>
                                            <FormMessage className="text-[12px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2 xl:col-span-3">
                                            <FormLabel className={label}>
                                                <span className="flex items-center gap-1.5">
                                                    <NotebookPen size={12} /> Notes
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <input
                                                    type="text"
                                                    {...field}
                                                    placeholder="e.g. urgent restock — confirm batch numbers with warehouse"
                                                    className={inputBase}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[12px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Line items */}
                        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                            <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
                                <PackagePlus size={14} className="text-stamp" />
                                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Line Items</span>
                                <span className="ml-auto font-mono text-[11px] text-ink/40">
                                    {validItemCount} of {items.length} entered
                                </span>
                            </div>
                            {formState.errors.items?.message && (
                                <div className="flex items-center gap-2 border-b border-danger/20 bg-danger-bg/60 px-5 py-2.5">
                                    <AlertTriangle size={13} className="shrink-0 text-danger" />
                                    <span className="text-[12px] font-medium text-danger">{formState.errors.items.message}</span>
                                </div>
                            )}
                            <div className="flex flex-col gap-3 p-4 sm:p-5">
                                {fields.map((f, idx) => (
                                    <div
                                        key={f.id}
                                        className={`border bg-white transition-colors ${
                                            items[idx]?.productId ? "border-teal-mid/30 shadow-[0_1px_0_0_rgba(0,0,0,0.02)]" : "border-line"
                                        }`}
                                    >
                                        {/* Item header */}
                                        <div className="flex flex-col gap-3 border-b border-line/60 px-4 py-3 lg:flex-row lg:items-center">
                                            <span className="w-fit shrink-0 rounded-lg border border-stamp/30 bg-stamp-dim px-2 py-0.5 font-mono text-[11px] font-semibold text-stamp">
                                                ITEM {String(idx + 1).padStart(2, "0")}
                                            </span>
                                            <select
                                                {...register(`items.${idx}.productId`)}
                                                onChange={e => {
                                                    const id = e.target.value;
                                                    const p = products.find(pr => pr.id === id);
                                                    setValue(`items.${idx}.productId`, id);
                                                    setValue(`items.${idx}.gstRate`, p?.gstRate != null ? String(p.gstRate) : "");
                                                }}
                                                className={`${inputBase} flex-1 cursor-pointer`}
                                            >
                                                <option value="">Select medicine…</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.brand}
                                                        {p.strength ? ` · ${p.strength}` : ""}
                                                        {p.packSize ? ` · ${p.packSize}` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="flex items-center justify-between gap-3 lg:justify-end">
                                                <div className="text-right">
                                                    <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink/45">Line total</div>
                                                    <div className="font-mono text-[15px] font-bold text-ink">{formatINR(lineTotal(items[idx] ?? emptyLine()))}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(idx)}
                                                    disabled={fields.length === 1}
                                                    title={fields.length === 1 ? "An order needs at least one item" : "Remove item"}
                                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-danger/25 bg-white text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-30"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Numeric grid */}
                                        <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-3 lg:grid-cols-7">
                                            <div>
                                                <label className={label}>
                                                    Qty <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    {...register(`items.${idx}.quantity`)}
                                                    placeholder="500"
                                                    className={numInput}
                                                />
                                            </div>
                                            <div>
                                                <label className={label}>Free</label>
                                                <input
                                                    type="number"
                                                    {...register(`items.${idx}.freeQuantity`)}
                                                    placeholder="0"
                                                    className={numInput}
                                                />
                                            </div>
                                            <div>
                                                <label className={label}>
                                                    Purchase <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    {...register(`items.${idx}.purchasePrice`)}
                                                    placeholder="8.50"
                                                    className={numInput}
                                                />
                                            </div>
                                            <div>
                                                <label className={label}>MRP</label>
                                                <input
                                                    type="number"
                                                    {...register(`items.${idx}.mrp`)}
                                                    placeholder="12.00"
                                                    className={numInput}
                                                />
                                            </div>
                                            <div>
                                                <label className={label}>Sell</label>
                                                <input
                                                    type="number"
                                                    {...register(`items.${idx}.sellingPrice`)}
                                                    placeholder="11.00"
                                                    className={numInput}
                                                    max={items[idx]?.mrp ?? ""}
                                                />
                                            </div>
                                            <div>
                                                <label className={label}>GST %</label>
                                                <input
                                                    type="number"
                                                    {...register(`items.${idx}.gstRate`)}
                                                    placeholder="12"
                                                    className={numInput}
                                                />
                                            </div>
                                            <div>
                                                <label className={label}>Disc %</label>
                                                <input
                                                    type="number"
                                                    {...register(`items.${idx}.discount`)}
                                                    placeholder="0"
                                                    className={numInput}
                                                    min={0}
                                                    max={100}
                                                />
                                            </div>
                                        </div>

                                        {/* Batch / expiry */}
                                        {lineErrors(items[idx] ?? emptyLine()).length > 0 && (
                                            <div className="border-t border-danger/20 bg-danger-bg/60 px-4 py-2.5">
                                                <ul className="flex flex-col gap-1">
                                                    {lineErrors(items[idx] ?? emptyLine()).map((msg, i) => (
                                                        <li key={i} className="flex items-start gap-1.5 text-[12px] font-medium text-danger">
                                                            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                                                            {msg}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="grid gap-3 border-t border-line/60 bg-paper/50 px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
                                            <div>
                                                <label className={label}>Batch no.</label>
                                                <input
                                                    type="text"
                                                    {...register(`items.${idx}.batchNumber`)}
                                                    placeholder="e.g. D6500824"
                                                    className={inputBase}
                                                />
                                            </div>
                                            <div>
                                                <label className={label}>Expiry</label>
                                                <input
                                                    type="date"
                                                    {...register(`items.${idx}.expiryDate`)}
                                                    className={inputBase}
                                                />
                                            </div>
                                            <div className="hidden items-center lg:col-span-2 lg:flex lg:justify-end">
                                                <span className="font-mono text-[11px] text-ink/40">GST pre-filled from the medicine catalogue</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => append(emptyLine())}
                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ink/25 bg-paper/40 px-4 py-3 text-[13px] font-semibold text-ink/55 transition-colors hover:border-stamp/50 hover:bg-stamp-dim hover:text-stamp"
                                >
                                    <Plus size={15} /> Add line item
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Sidebar summary ── */}
                    <div className="w-full shrink-0 xl:sticky xl:top-6 xl:w-80">
                        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                            <div className="border-b border-line px-5 py-3.5">
                                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Order Summary</span>
                            </div>
                            <div className="space-y-2.5 px-5 py-4 text-[13px] text-ink/60">
                                <div className="flex justify-between">
                                    <span>Line items</span>
                                    <span className="font-mono font-semibold text-ink">{validItemCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-mono font-semibold text-ink">{formatINR(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Free units</span>
                                    <span className="font-mono font-semibold text-ink">{totals.freeUnits}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Discount</span>
                                    <span className="font-mono font-semibold text-teal-mid">−{formatINR(totals.discount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>GST</span>
                                    <span className="font-mono font-semibold text-ink">{formatINR(totals.tax)}</span>
                                </div>
                                <div className="flex items-baseline justify-between border-t border-line pt-3">
                                    <span className="text-[14px] font-semibold text-ink">Grand total</span>
                                    <span className="font-mono text-[19px] font-bold tracking-tight text-teal-deep">{formatINR(grandTotal)}</span>
                                </div>
                            </div>
                            <div className="border-t border-line px-5 py-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting && <Loader2 size={15} className="animate-spin" />}
                                    {isEdit ? "Save Changes" : "Create Purchase Order"}
                                    <ArrowRight size={15} />
                                </button>
                                <p className="mt-3 text-[11.5px] leading-relaxed text-ink/45">
                                    {isEdit
                                        ? "Changes take effect immediately. The order stays in draft and can be re-edited until it is submitted."
                                        : "Stock is reserved on this order but only enters your ledger when the goods are received and the GRN is saved."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {toast && (
                    <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
                        <CheckCircle2 size={16} className={toast.includes("updated") || toast.includes("created") ? "text-teal-mid" : "text-danger"} />
                        <span className="text-[13px] text-ink">{toast}</span>
                    </div>
                )}
            </form>
        </Form>
    );
}