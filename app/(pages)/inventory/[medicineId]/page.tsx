"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
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
import type { LoadState } from "@/lib/hooks/usePaginatedList";
import { usePermissions } from "@/lib/hooks/usePermissions";
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
import {
    PageHeader,
    ErrorState,
    StatCard,
    StatGrid,
    TableShell,
    Th,
    Td,
    TableRow,
    EmptyRow,
    LoadingRow,
    StatusBadge,
    PrimaryButton,
    SecondaryButton,
    Modal,
    inputBase,
} from "@/components/common";

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
    const { can, user } = usePermissions();
    const canAdjust = can.isManagerOrAbove();

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

    if (state === "loading" && !detail) {
        return (
            <div className="flex w-full items-center justify-center gap-2 py-24 text-[13px] text-ink/45">
                <Loader2 size={16} className="animate-spin" /> Loading medicine ledger…
            </div>
        );
    }

    if (state === "error" && !detail) {
        return (
            <ErrorState
                title="Could not load medicine."
                description={error}
                onRetry={retry}
                icon={<AlertTriangle size={32} className="text-danger/60" />}
            />
        );
    }

    if (!detail) return null;

    const s = detail.summary;
    const intel = detail.intelligence;

    return (
        <div className="flex w-full flex-col gap-6">
            <PageHeader
                backLink={{ href: "/inventory", label: "Back to Inventory" }}
                eyebrow="Product Ledger"
                title={detail.product.brand}
                description={
                    `${[detail.product.genericName, detail.product.strength, detail.product.dosageForm, detail.product.packSize]
                        .filter(Boolean)
                        .join(" · ") || "—"}` +
                    `${detail.product.manufacturer ? ` · ${detail.product.manufacturer}` : ""}` +
                    `${detail.product.category ? ` · ${detail.product.category.name}` : ""}`
                }
                actions={
                    <div className="flex flex-col items-end gap-2">
                        <StatusBadge className={`text-[12px] ${stockStatusBadge[s.stockStatus] || ""}`}>
                            {stockStatusLabel[s.stockStatus]}
                        </StatusBadge>
                        <span className="text-[11px] text-ink/40 font-mono">{detail.branch ? detail.branch.name : "All branches"}</span>
                    </div>
                }
            />

            <StatGrid>
                <StatCard
                    icon={<Pill size={20} />}
                    accent="teal"
                    label="Sellable Stock"
                    value={s.sellableDisplay}
                    sub={s.expiredStock > 0 ? (
                        <span className="text-danger">{s.expiredDisplay} expired</span>
                    ) : undefined}
                />
                <StatCard
                    icon={<Wallet size={20} />}
                    label="Stock Value (Cost)"
                    value={formatINR(s.inventoryValue)}
                />
                <StatCard
                    icon={<CalendarClock size={20} />}
                    accent="danger"
                    label="Nearest Expiry"
                    value={s.nearestExpiry ? formatDate(s.nearestExpiry) : "—"}
                    sub={
                        <StatusBadge
                            className={`mt-0.5 px-2 py-0.5 text-[10.5px] ${expiryStatusBadge[s.nearestExpiryStatus] || ""}`}
                        >
                            {expiryStatusLabel[s.nearestExpiryStatus]}
                        </StatusBadge>
                    }
                />
                <StatCard
                    icon={<Scale size={20} />}
                    accent="stamp"
                    label="Days of Cover"
                    value={
                        intel.daysOfCover !== null && intel.daysOfCover !== undefined ? `${intel.daysOfCover.toFixed(1)}d` : "—"
                    }
                    sub={
                        <StatusBadge tone={intel.stockoutRisk === "LOW" ? "teal" : intel.stockoutRisk === "CRITICAL" || intel.stockoutRisk === "HIGH" ? "danger" : "stamp"} className={`mt-0.5 px-2 py-0.5 text-[10.5px] ${riskBadge[intel.stockoutRisk] || ""}`}>
                            {riskLabel[intel.stockoutRisk]} risk
                        </StatusBadge>
                    }
                />
            </StatGrid>

            {/* ── Movement intelligence + reorder panel ── */}
            <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)] xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <div className="font-display text-[15px] font-semibold text-ink">Movement Intelligence</div>
                            <div className="text-[12px] text-ink/50">Sales velocity over the last 30 days (outbound sales only)</div>
                        </div>
                        <StatusBadge className={movementStatusBadge[intel.movementStatus] || ""}>
                            {movementStatusLabel[intel.movementStatus]}
                        </StatusBadge>
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

            <TableShell
                header={
                    <>
                        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                            Batches — {detail.batches.length} total · FEFO order
                        </span>
                        {canAdjust && (
                            <PrimaryButton
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
                                className="px-3 py-1.5 text-[12px]"
                            >
                                <PackagePlus size={13} /> Add Stock
                            </PrimaryButton>
                        )}
                    </>
                }
            >
                <thead>
                    <tr className="border-b border-line">
                        <Th>Batch</Th>
                        <Th>Qty (base units)</Th>
                        <Th>Expiry</Th>
                        <Th>Purchase</Th>
                        <Th>MRP / Sale</Th>
                        <Th>Supplier</Th>
                        <Th align="center">Status</Th>
                        {canAdjust && <Th align="right">Action</Th>}
                    </tr>
                </thead>
                <tbody>
                    {state === "loading" && (
                        <LoadingRow colSpan={canAdjust ? 8 : 7} message="Loading batches…" />
                    )}
                    {detail.batches.map(batch => (
                        <TableRow key={batch.id}>
                            <Td className="font-mono text-[13px] font-medium text-ink/80">
                                {batch.batchNumber}
                                <div className="text-[11px] text-ink/40 font-body">{batch.branch ? batch.branch.name : ""}</div>
                            </Td>
                            <Td>
                                <div className="font-semibold text-ink">{batch.quantityDisplay}</div>
                                <div className="text-[11px] text-ink/40">{batch.quantity} base units</div>
                            </Td>
                            <Td>
                                <div className="font-medium text-ink/80">{formatDate(batch.expiryDate)}</div>
                                <div className="text-[11px] text-ink/40">
                                    {batch.daysToExpiry >= 0 ? `${batch.daysToExpiry} days left` : `${Math.abs(batch.daysToExpiry)} days past`}
                                </div>
                            </Td>
                            <Td className="font-mono text-[13px] text-ink/70">{formatINR(batch.purchasePrice)}</Td>
                            <Td className="font-mono text-[13px] text-ink/70">
                                {formatINR(batch.mrp)} / {formatINR(batch.sellingPrice)}
                            </Td>
                            <Td className="text-ink/60">{batch.supplier?.name ?? "—"}</Td>
                            <Td align="center">
                                <StatusBadge className={batchStatusBadge[batch.status] || ""}>
                                    {batch.status === "EXPIRED" ? "Expired" : batch.status === "EMPTY" ? "Empty" : "Active"}
                                </StatusBadge>
                            </Td>
                            {canAdjust && (
                                <Td align="right">
                                    <SecondaryButton
                                        onClick={() => {
                                            adjustForm.reset({ delta: "", reason: "PHYSICAL_COUNT", note: "" });
                                            setAdjustBatch(batch);
                                        }}
                                        disabled={batch.status === "EMPTY"}
                                        className="py-1.5"
                                    >
                                        <SlidersHorizontal size={13} /> Adjust
                                    </SecondaryButton>
                                </Td>
                            )}
                        </TableRow>
                    ))}
                    {detail.batches.length === 0 && (
                        <EmptyRow
                            colSpan={canAdjust ? 8 : 7}
                            icon={<Package size={32} />}
                            message="No batches registered for this medicine."
                        />
                    )}
                </tbody>
            </TableShell>

            {/* ── Recent movements ── */}
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <div className="border-b border-line px-5 py-4">
                    <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Recent Movements</span>
                </div>
                <div className="divide-y divide-line/60">
                    {movements.map(mv => (
                        <div key={mv.id} className="flex items-center gap-4 px-4 py-3">
                            <StatusBadge className={`w-28 shrink-0 text-center ${movementTypeBadge[mv.type] || ""}`}>
                                {movementTypeLabel[mv.type]}
                            </StatusBadge>
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

            <Modal
                open={adjustBatch !== null}
                onClose={() => setAdjustBatch(null)}
                title={adjustBatch ? `Adjust Batch — ${adjustBatch.batchNumber}` : "Adjust Batch"}
                description={adjustBatch ? `${detail.product.brand} · ${adjustBatch.quantityDisplay} currently` : undefined}
                width="md"
            >
                <Form {...adjustForm}>
                    <form onSubmit={adjustForm.handleSubmit(submitBatchAdjust)} className="flex flex-col gap-4">
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
                        <PrimaryButton
                            type="submit"
                            disabled={submitting}
                            className="justify-center py-2.5 text-[13.5px]"
                        >
                            {submitting && <Loader2 size={15} className="animate-spin" />}
                            Apply Adjustment
                        </PrimaryButton>
                    </form>
                </Form>
            </Modal>

            <Modal
                open={stockOpen}
                onClose={() => setStockOpen(false)}
                title="Add Opening Stock"
                description={`${detail.product.brand} · quantity in base units`}
                width="lg"
                className="flex max-h-[90vh] flex-col overflow-hidden"
                bodyClassName="overflow-y-auto"
            >
                <Form {...stockForm}>
                    <form onSubmit={stockForm.handleSubmit(submitStock)} className="flex flex-col gap-4">
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
                        <PrimaryButton
                            type="submit"
                            disabled={submitting}
                            className="justify-center py-2.5 text-[13.5px]"
                        >
                            {submitting && <Loader2 size={15} className="animate-spin" />}
                            Add Stock
                        </PrimaryButton>
                    </form>
                </Form>
            </Modal>

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
                    <CheckCircle2 size={16} className={toast.startsWith("Adjusted") ? "text-teal-mid" : "text-danger"} />
                    <span className="text-[13px] text-ink">{toast}</span>
                </div>
            )}
        </div>
    );
}
