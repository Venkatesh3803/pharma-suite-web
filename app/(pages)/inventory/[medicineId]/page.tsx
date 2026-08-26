"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft,
    Loader2,
    AlertTriangle,
    Package,
    Pill,
    Wallet,
    CalendarClock,
    TrendingUp,
    Scale,
    SlidersHorizontal,
    CheckCircle2,
    X,
    PackagePlus
} from "lucide-react";
import {
    inventoryApi,
    branchesApi,
    type MedicineDetail,
    type MovementItem,
    type BatchSummaryRow,
    type AdjustmentReason,
    type BranchSummary
} from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import {
    formatINR,
    formatDateTime,
    formatDate,
    stockStatusBadge,
    stockStatusLabel,
    expiryStatusBadge,
    expiryStatusLabel,
    movementStatusBadge,
    movementStatusLabel,
    movementTypeBadge,
    movementTypeLabel,
    riskBadge,
    riskLabel
} from "@/lib/inventory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

type LoadState = "loading" | "error" | "ready";

const ADJUST_REASONS: { value: AdjustmentReason; label: string }[] = [
    { value: "PHYSICAL_COUNT", label: "Physical Count" },
    { value: "DAMAGE", label: "Damaged Goods" },
    { value: "LOSS", label: "Loss" },
    { value: "EXPIRY", label: "Expired Stock" },
    { value: "DATA_CORRECTION", label: "Data Correction" },
    { value: "OPENING_BALANCE", label: "Opening Balance" },
    { value: "OTHER", label: "Other" }
];

const batchStatusBadge: Record<string, string> = {
    ACTIVE: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
    EMPTY: "border border-line bg-paper-dim text-ink/50",
    EXPIRED: "border border-danger/40 bg-danger text-paper"
};

const adjustFormSchema = z.object({
    delta: z
        .string()
        .refine(
            v => v.trim() !== "" && Number.isInteger(Number(v)) && Number(v) !== 0,
            "Delta must be a non-zero whole number."
        ),
    reason: z.enum(["PHYSICAL_COUNT", "DAMAGE", "LOSS", "EXPIRY", "DATA_CORRECTION", "OPENING_BALANCE", "OTHER"]),
    note: z.string()
});

type AdjustFormValues = z.infer<typeof adjustFormSchema>;

const stockFormSchema = z.object({
    branch: z.string(),
    qty: z
        .string()
        .refine(
            v => v.trim() !== "" && Number.isInteger(Number(v)) && Number(v) > 0,
            "Quantity must be a positive whole number."
        ),
    batchNumber: z.string(),
    expiry: z.string(),
    purchase: z
        .string()
        .refine(v => v === "" || !Number.isNaN(Number(v)), "Enter a valid number."),
    mrp: z
        .string()
        .refine(v => v === "" || !Number.isNaN(Number(v)), "Enter a valid number."),
    sell: z
        .string()
        .refine(v => v === "" || !Number.isNaN(Number(v)), "Enter a valid number."),
    note: z.string()
});

type StockFormValues = z.infer<typeof stockFormSchema>;

export default function MedicineDetailPage() {
    const params = useParams<{ medicineId: string }>();
    const medicineId = params.medicineId;
    const user = useAppSelector(state => state.auth.user);
    const canAdjust = user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "MANAGER";

    const [detail, setDetail] = useState<MedicineDetail | null>(null);
    const [movements, setMovements] = useState<MovementItem[]>([]);
    const [state, setState] = useState<LoadState>("loading");
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const [adjustBatch, setAdjustBatch] = useState<BatchSummaryRow | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const [stockOpen, setStockOpen] = useState(false);
    const [branches, setBranches] = useState<BranchSummary[]>([]);

    const adjustForm = useForm<AdjustFormValues>({
        resolver: zodResolver(adjustFormSchema),
        defaultValues: {
            delta: "",
            reason: "PHYSICAL_COUNT",
            note: ""
        }
    });

    const stockForm = useForm<StockFormValues>({
        resolver: zodResolver(stockFormSchema),
        defaultValues: {
            branch: user?.branchId ?? "",
            qty: "",
            batchNumber: "",
            expiry: "",
            purchase: "",
            mrp: "",
            sell: "",
            note: ""
        }
    });
    const { setValue } = stockForm;

    useEffect(() => {
        if (!stockOpen) return;
        let ignore = false;
        async function loadBranches() {
            try {
                const list = await branchesApi.list();
                if (!ignore) {
                    setBranches(list);
                    if (!user?.branchId && list.length > 0) setValue("branch", list[0].id);
                }
            } catch {
                /* branch selector optional for owner-only flows */
            }
        }
        void loadBranches();
        return () => {
            ignore = true;
        };
    }, [stockOpen, user?.branchId, setValue]);

    const submitStock = async (values: StockFormValues) => {
        if (!detail) return;
        if (!user?.branchId && !values.branch) return;
        setSubmitting(true);
        try {
            await inventoryApi.createBatch({
                productId: medicineId,
                branchId: user?.branchId ?? values.branch,
                quantity: Number(values.qty),
                batchNumber: values.batchNumber.trim() || undefined,
                expiryDate: values.expiry || undefined,
                purchasePrice: values.purchase ? Number(values.purchase) : undefined,
                mrp: values.mrp ? Number(values.mrp) : undefined,
                sellingPrice: values.sell ? Number(values.sell) : undefined,
                note: values.note.trim() || undefined
            });
            setToast(`Added ${Number(values.qty)} units of ${detail.product.brand}.`);
            setStockOpen(false);
            stockForm.reset();
            setRefreshKey(k => k + 1);
        } catch (e) {
            setToast(e instanceof Error ? e.message : "Could not add stock.");
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        let ignore = false;
        async function fetchDetail() {
            try {
                const [d, mv] = await Promise.all([inventoryApi.detail(medicineId), inventoryApi.medicineMovements(medicineId, { pageSize: 12 })]);
                if (!ignore) {
                    setDetail(d);
                    setMovements(mv.items);
                    setState("ready");
                }
            } catch (e) {
                if (!ignore) {
                    setError(e instanceof Error ? e.message : "Could not load medicine.");
                    setState("error");
                }
            }
        }
        void fetchDetail();
        return () => {
            ignore = true;
        };
    }, [medicineId, refreshKey]);

    const retry = () => {
        setState("loading");
        setError("");
        setRefreshKey(k => k + 1);
    };

    const submitBatchAdjust = async (values: AdjustFormValues) => {
        if (!adjustBatch || !detail) return;
        setSubmitting(true);
        try {
            await inventoryApi.adjustBatch({
                batchId: adjustBatch.id,
                productId: medicineId,
                branchId: adjustBatch.branch?.id ?? undefined,
                quantity: Number(values.delta),
                reason: values.reason,
                note: values.note || undefined
            });
            setToast(`Adjusted ${Number(values.delta) > 0 ? "+" : ""}${Number(values.delta)} on ${adjustBatch.batchNumber}.`);
            setAdjustBatch(null);
            setRefreshKey(k => k + 1);
        } catch (e) {
            setToast(e instanceof Error ? e.message : "Adjustment failed.");
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [toast]);

    const inputBase =
        "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

    if (state === "loading" && !detail) {
        return (
            <div className="flex w-full items-center justify-center gap-2 py-24 text-[13px] text-ink/45">
                <Loader2 size={16} className="animate-spin" /> Loading medicine ledger…
            </div>
        );
    }

    if (state === "error" && !detail) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-16 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <AlertTriangle size={32} className="text-danger/60" />
                <div>
                    <div className="text-[14px] font-medium text-ink">Could not load medicine.</div>
                    <div className="mt-1 text-[12.5px] text-ink/50">{error}</div>
                </div>
                <button onClick={retry} className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep">
                    Retry
                </button>
            </div>
        );
    }

    if (!detail) return null;

    const s = detail.summary;
    const intel = detail.intelligence;

    return (
        <div className="flex w-full flex-col gap-6">
            {/* ── Header System ── */}
            <div>
                <Link href="/inventory" className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink/55 transition-colors hover:text-stamp">
                    <ArrowLeft size={14} /> Back to Inventory
                </Link>
                <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                        <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">Product Ledger</span>
                        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">{detail.product.brand}</h1>
                        <p className="mt-1 text-[13.5px] text-ink/55">
                            {[detail.product.genericName, detail.product.strength, detail.product.dosageForm, detail.product.packSize]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            {detail.product.manufacturer ? ` · ${detail.product.manufacturer}` : ""}
                            {detail.product.category ? ` · ${detail.product.category.name}` : ""}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span
                            className={`inline-block px-2.5 py-1 text-[12px] font-semibold ${
                                stockStatusBadge[s.stockStatus] || "border border-line bg-paper-dim text-ink/60"
                            }`}
                        >
                            {stockStatusLabel[s.stockStatus]}
                        </span>
                        <span className="text-[11px] text-ink/40 font-mono">{detail.branch ? detail.branch.name : "All branches"}</span>
                    </div>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-mid/10 text-teal-mid">
                        <Pill size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">Sellable Stock</div>
                        <div className="font-display text-xl font-bold text-ink">{s.sellableDisplay}</div>
                        {s.expiredStock > 0 && <div className="text-[11px] text-danger">{s.expiredDisplay} expired</div>}
                    </div>
                </div>

                <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper-dim text-ink/60">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">Stock Value (Cost)</div>
                        <div className="font-display text-xl font-bold text-ink">{formatINR(s.inventoryValue)}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-bg text-danger">
                        <CalendarClock size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">Nearest Expiry</div>
                        <div className="font-display text-xl font-bold text-ink">{s.nearestExpiry ? formatDate(s.nearestExpiry) : "—"}</div>
                        <span
                            className={`mt-0.5 inline-block px-2 py-0.5 text-[10.5px] font-semibold ${
                                expiryStatusBadge[s.nearestExpiryStatus] || "border border-line bg-paper-dim text-ink/60"
                            }`}
                        >
                            {expiryStatusLabel[s.nearestExpiryStatus]}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stamp-dim text-stamp">
                        <Scale size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">Days of Cover</div>
                        <div className="font-display text-xl font-bold text-ink">
                            {intel.daysOfCover !== null && intel.daysOfCover !== undefined ? `${intel.daysOfCover.toFixed(1)}d` : "—"}
                        </div>
                        <span className={`mt-0.5 inline-block px-2 py-0.5 text-[10.5px] font-semibold ${riskBadge[intel.stockoutRisk]}`}>
                            {riskLabel[intel.stockoutRisk]} risk
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Movement intelligence + reorder panel ── */}
            <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)] xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <div className="font-display text-[15px] font-semibold text-ink">Movement Intelligence</div>
                            <div className="text-[12px] text-ink/50">Sales velocity over the last 30 days (outbound sales only)</div>
                        </div>
                        <span className={`inline-block px-2.5 py-1 text-[11.5px] font-semibold ${movementStatusBadge[intel.movementStatus]}`}>
                            {movementStatusLabel[intel.movementStatus]}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
                        {[
                            { label: "Avg / day", value: intel.velocity.averageDailySales.toFixed(2) },
                            { label: "Avg / week", value: intel.velocity.averageWeeklySales.toFixed(1) },
                            { label: "Sold 30d", value: intel.velocity.soldUnits30Days.toString() },
                            {
                                label: "Last sale",
                                value: intel.velocity.lastSaleDate ? formatDate(intel.velocity.lastSaleDate) : "never"
                            }
                        ].map((cell, i) => (
                            <div key={i} className="bg-white p-4">
                                <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink/45 font-mono">{cell.label}</div>
                                <div className="mt-1 font-display text-[17px] font-bold text-ink">{cell.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="mb-3 flex items-center gap-2">
                        <TrendingUp size={16} className="text-stamp" />
                        <span className="font-display text-[15px] font-semibold text-ink">Reorder Suggestion</span>
                    </div>
                    {intel.reorderReason ? (
                        <>
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-display text-2xl font-bold text-stamp">{intel.reorderSuggestion}</span>
                                <span className="text-[12px] text-ink/50">units suggested</span>
                            </div>
                            <p className="mt-2 text-[12.5px] leading-relaxed text-ink/60">{intel.reorderReason}</p>
                            {detail.priceVariance && detail.priceVariance.variancePct !== null && (
                                <p
                                    className={`mt-3 border-t border-line pt-2 text-[12px] font-medium ${
                                        detail.priceVariance.difference >= 0 ? "text-stamp" : "text-teal-mid"
                                    }`}
                                >
                                    Purchase price {detail.priceVariance.difference >= 0 ? "up" : "down"}{" "}
                                    {Math.abs(detail.priceVariance.difference).toFixed(2)} ({detail.priceVariance.variancePct.toFixed(1)}%) vs previous
                                    batch
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-[12.5px] text-ink/50">
                            No sales velocity yet — reorder suggestion will appear once this medicine has sales history.
                        </p>
                    )}
                </div>
            </div>

            {/* ── Batches table ── */}
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                        Batches — {detail.batches.length} total · FEFO order
                    </span>
                    {canAdjust && (
                        <button
                            onClick={() => {
                                stockForm.reset({
                                    branch: user?.branchId ?? "",
                                    qty: "",
                                    batchNumber: "",
                                    expiry: "",
                                    purchase: "",
                                    mrp: "",
                                    sell: "",
                                    note: ""
                                });
                                setStockOpen(true);
                            }}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper transition-colors hover:bg-teal-deep"
                        >
                            <PackagePlus size={13} /> Add Stock
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-[13.5px]">
                        <thead>
                            <tr className="border-b border-line">
                                <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Batch</th>
                                <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                                    Qty (base units)
                                </th>
                                <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Expiry</th>
                                <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Purchase</th>
                                <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">MRP / Sale</th>
                                <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Supplier</th>
                                <th className="px-4 py-3 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                                    Status
                                </th>
                                {canAdjust && (
                                    <th className="px-4 py-3 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                                        Action
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {detail.batches.map(batch => (
                                <tr key={batch.id} className="border-b border-line/60 transition-colors hover:bg-paper/70">
                                    <td className="px-4 py-3 font-mono text-[13px] font-medium text-ink/80">
                                        {batch.batchNumber}
                                        <div className="text-[11px] text-ink/40 font-body">{batch.branch ? batch.branch.name : ""}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-ink">{batch.quantityDisplay}</div>
                                        <div className="text-[11px] text-ink/40">{batch.quantity} base units</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-ink/80">{formatDate(batch.expiryDate)}</div>
                                        <div className="text-[11px] text-ink/40">
                                            {batch.daysToExpiry >= 0 ? `${batch.daysToExpiry} days left` : `${Math.abs(batch.daysToExpiry)} days past`}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[13px] text-ink/70">{formatINR(batch.purchasePrice)}</td>
                                    <td className="px-4 py-3 font-mono text-[13px] text-ink/70">
                                        {formatINR(batch.mrp)} / {formatINR(batch.sellingPrice)}
                                    </td>
                                    <td className="px-4 py-3 text-ink/60">{batch.supplier?.name ?? "—"}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`inline-block px-2.5 py-1 text-[11px] font-semibold ${
                                                batchStatusBadge[batch.status] || "border border-line bg-paper-dim text-ink/60"
                                            }`}
                                        >
                                            {batch.status === "EXPIRED" ? "Expired" : batch.status === "EMPTY" ? "Empty" : "Active"}
                                        </span>
                                    </td>
                                    {canAdjust && (
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => {
                                                    adjustForm.reset({ delta: "", reason: "PHYSICAL_COUNT", note: "" });
                                                    setAdjustBatch(batch);
                                                }}
                                                disabled={batch.status === "EMPTY"}
                                                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink/70 transition-colors hover:border-stamp hover:text-stamp disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <SlidersHorizontal size={13} /> Adjust
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {detail.batches.length === 0 && (
                                <tr>
                                    <td colSpan={canAdjust ? 8 : 7} className="px-12 py-12 text-center text-ink/40">
                                        <Package size={32} className="mx-auto mb-3 opacity-40" />
                                        <div className="text-[14px]">No batches registered for this medicine.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Recent movements ── */}
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <div className="border-b border-line px-5 py-4">
                    <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Recent Movements</span>
                </div>
                <div className="divide-y divide-line/60">
                    {movements.map(mv => (
                        <div key={mv.id} className="flex items-center gap-4 px-4 py-3">
                            <span className={`inline-block w-28 shrink-0 px-2 py-1 text-center text-[11px] font-semibold ${movementTypeBadge[mv.type]}`}>
                                {movementTypeLabel[mv.type]}
                            </span>
                            <div className="flex-1">
                                <div className="text-[13px] text-ink/80">
                                    <span className="font-semibold text-ink">
                                        {mv.quantity >= 0 ? "+" : ""}
                                        {mv.quantity} units
                                    </span>
                                    <span className="mx-1.5 text-ink/30">→</span>
                                    <span className="font-mono">{mv.batch?.batchNumber ?? "—"}</span>
                                </div>
                                <div className="text-[11px] text-ink/45">
                                    {formatDateTime(mv.createdAt)}
                                    {mv.user?.fullName ? ` · by ${mv.user.fullName}` : ""}
                                    {mv.branch?.name ? ` · ${mv.branch.name}` : ""}
                                </div>
                            </div>
                            <div className="text-right text-[11.5px] text-ink/45 font-mono">
                                {mv.beforeQty} → {mv.afterQty}
                            </div>
                        </div>
                    ))}
                    {movements.length === 0 && <div className="px-12 py-10 text-center text-[13px] text-ink/40">No movements recorded yet.</div>}
                </div>
            </div>

            {/* ── Batch adjust modal ── */}
            {adjustBatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-line bg-paper shadow-xl">
                        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
                            <div>
                                <div className="font-display text-[15px] font-semibold text-ink">Adjust Batch — {adjustBatch.batchNumber}</div>
                                <div className="text-[12px] text-ink/50">
                                    {detail.product.brand} · {adjustBatch.quantityDisplay} currently
                                </div>
                            </div>
                            <button onClick={() => setAdjustBatch(null)} className="cursor-pointer rounded-lg p-1 text-ink/50 hover:text-ink">
                                <X size={18} />
                            </button>
                        </div>
                        <Form {...adjustForm}>
                            <form onSubmit={adjustForm.handleSubmit(submitBatchAdjust)} className="flex flex-col gap-4 px-5 py-5">
                                <FormField
                                    control={adjustForm.control}
                                    name="delta"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                                                Delta (base units) — negative removes stock
                                            </FormLabel>
                                            <FormControl>
                                                <input
                                                    type="number"
                                                    {...field}
                                                    placeholder="e.g. +10 or -5"
                                                    className={inputBase}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[12px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={adjustForm.control}
                                    name="reason"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                                                Reason
                                            </FormLabel>
                                            <FormControl>
                                                <select {...field} className={`${inputBase} cursor-pointer`}>
                                                    {ADJUST_REASONS.map(r => (
                                                        <option key={r.value} value={r.value}>
                                                            {r.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FormControl>
                                            <FormMessage className="text-[12px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={adjustForm.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                                                Note (optional)
                                            </FormLabel>
                                            <FormControl>
                                                <input
                                                    type="text"
                                                    {...field}
                                                    placeholder="e.g. shelf damage found during audit"
                                                    className={inputBase}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[12px]" />
                                        </FormItem>
                                    )}
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting && <Loader2 size={15} className="animate-spin" />}
                                    Apply Adjustment
                                </button>
                            </form>
                        </Form>
                    </div>
                </div>
            )}

            {/* ── Add Stock modal ── */}
            {stockOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-paper shadow-xl">
                        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
                            <div>
                                <div className="font-display text-[15px] font-semibold text-ink">Add Opening Stock</div>
                                <div className="text-[12px] text-ink/50">{detail.product.brand} · quantity in base units</div>
                            </div>
                            <button onClick={() => setStockOpen(false)} className="cursor-pointer rounded-lg p-1 text-ink/50 hover:text-ink">
                                <X size={18} />
                            </button>
                        </div>
                        <Form {...stockForm}>
                            <form onSubmit={stockForm.handleSubmit(submitStock)} className="flex flex-col gap-4 px-5 py-5">
                                {!user?.branchId && (
                                    <FormField
                                        control={stockForm.control}
                                        name="branch"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                                                    Branch
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
                                    control={stockForm.control}
                                    name="qty"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                                                Quantity (base units) <span className="text-danger">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <input
                                                    type="number"
                                                    {...field}
                                                    placeholder="e.g. 500"
                                                    className={inputBase}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[12px]" />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={stockForm.control}
                                        name="batchNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                                                    Batch number
                                                </FormLabel>
                                                <FormControl>
                                                    <input
                                                        type="text"
                                                        {...field}
                                                        placeholder="e.g. D6500824"
                                                        className={inputBase}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={stockForm.control}
                                        name="expiry"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                                                    Expiry date
                                                </FormLabel>
                                                <FormControl>
                                                    <input type="date" {...field} className={inputBase} />
                                                </FormControl>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={stockForm.control}
                                        name="purchase"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                                                    Purchase price
                                                </FormLabel>
                                                <FormControl>
                                                    <input
                                                        type="number"
                                                        {...field}
                                                        placeholder="e.g. 8.50"
                                                        className={inputBase}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={stockForm.control}
                                        name="mrp"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                                                    MRP
                                                </FormLabel>
                                                <FormControl>
                                                    <input
                                                        type="number"
                                                        {...field}
                                                        placeholder="e.g. 12.00"
                                                        className={inputBase}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={stockForm.control}
                                        name="sell"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                                                    Selling price
                                                </FormLabel>
                                                <FormControl>
                                                    <input
                                                        type="number"
                                                        {...field}
                                                        placeholder="e.g. 11.00"
                                                        className={inputBase}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={stockForm.control}
                                        name="note"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                                                    Note (optional)
                                                </FormLabel>
                                                <FormControl>
                                                    <input
                                                        type="text"
                                                        {...field}
                                                        placeholder="e.g. opening stock"
                                                        className={inputBase}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting && <Loader2 size={15} className="animate-spin" />}
                                    Add Stock
                                </button>
                            </form>
                        </Form>
                    </div>
                </div>
            )}

            {/* ── Toast ── */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
                    <CheckCircle2 size={16} className={toast.startsWith("Adjusted") ? "text-teal-mid" : "text-danger"} />
                    <span className="text-[13px] text-ink">{toast}</span>
                </div>
            )}
        </div>
    );
}
