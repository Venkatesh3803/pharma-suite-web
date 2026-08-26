"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft,
    Building2,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    Download,
    Eye,
    Loader2,
    PackageCheck,
    Pencil,
    Plus,
    RotateCcw,
    Send,
    Trash2,
    Truck,
    X
} from "lucide-react";
import { inventoryApi, purchasesApi, type PurchaseDetail, type PurchaseStatus, type ReceiptBatchInput, type ReturnItemInput } from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { formatINR, formatDate, formatDateTime } from "@/lib/inventory";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";

type LoadState = "loading" | "error" | "ready";

const statusBadge: Record<PurchaseStatus, string> = {
    DRAFT: "border border-line bg-paper-dim text-ink/60",
    SUBMITTED: "border border-stamp/30 bg-stamp-dim text-stamp",
    APPROVED: "border border-teal-mid/30 bg-teal-mid/10 text-teal-mid",
    PARTIALLY_RECEIVED: "border border-stamp/30 bg-stamp-dim text-stamp",
    RECEIVED: "border border-teal-mid/30 bg-teal-mid/10 text-teal-mid",
    CANCELLED: "border border-danger/40 bg-danger-bg text-danger"
};

const statusLabel: Record<PurchaseStatus, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    APPROVED: "Approved",
    PARTIALLY_RECEIVED: "Partially Received",
    RECEIVED: "Received",
    CANCELLED: "Cancelled"
};

const inputBase =
    "w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

const receiveSchema = z.object({
    rows: z.array(
        z.object({
            purchaseItemId: z.string(),
            productId: z.string(),
            productLabel: z.string(),
            remaining: z.number(),
            quantity: z
                .string()
                .refine(v => v !== "" && Number.isInteger(Number(v)) && Number(v) > 0, "Enter a positive whole quantity."),
            freeQuantity: z.string().refine(v => v === "" || !Number.isNaN(Number(v)), "Invalid quantity."),
            batchNumber: z.string().trim().min(1, "Batch number is required."),
            expiryDate: z.string().min(1, "Expiry date is required."),
            purchasePrice: z.string().refine(v => v === "" || !Number.isNaN(Number(v)), "Invalid amount."),
            mrp: z.string().refine(v => v === "" || !Number.isNaN(Number(v)), "Invalid amount.")
        })
    )
});

type ReceiveFormValues = z.infer<typeof receiveSchema>;

const returnSchema = z.object({
    rows: z.array(
        z.object({
            productLabel: z.string(),
            batchId: z.string(),
            batchNumber: z.string(),
            maxQty: z.number(),
            quantity: z
                .string()
                .refine(v => v === "" || (Number.isInteger(Number(v)) && Number(v) > 0), "Enter a positive whole quantity."),
            reason: z.string()
        })
    )
});

type ReturnFormValues = z.infer<typeof returnSchema>;

export default function PurchaseOrderDetailPage() {
    const params = useParams<{ purchaseId: string }>();
    const purchaseId = params.purchaseId;
    const user = useAppSelector(state => state.auth.user);
    const canManage = user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "MANAGER";

    const [detail, setDetail] = useState<PurchaseDetail | null>(null);
    const [state, setState] = useState<LoadState>("loading");
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [pdfBusy, setPdfBusy] = useState(false);

    const [showReceive, setShowReceive] = useState(false);
    const [receiving, setReceiving] = useState(false);

    const [showReturn, setShowReturn] = useState(false);
    const [returning, setReturning] = useState(false);

    const receiveForm = useForm<ReceiveFormValues>({
        resolver: zodResolver(receiveSchema),
        defaultValues: { rows: [] }
    });
    const { fields: receiveFields, append: appendReceive, remove: removeReceive } = useFieldArray({
        control: receiveForm.control,
        name: "rows"
    });

    const returnForm = useForm<ReturnFormValues>({
        resolver: zodResolver(returnSchema),
        defaultValues: { rows: [] }
    });
    const { fields: returnFields } = useFieldArray({
        control: returnForm.control,
        name: "rows"
    });

    useEffect(() => {
        let ignore = false;
        async function load() {
            try {
                const d = await purchasesApi.get(purchaseId);
                if (!ignore) {
                    setDetail(d);
                    setState("ready");
                }
            } catch (e) {
                if (!ignore) {
                    setError(e instanceof Error ? e.message : "Could not load purchase order.");
                    setState("error");
                }
            }
        }
        void load();
        return () => {
            ignore = true;
        };
    }, [purchaseId, refreshKey]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    const act = async (fn: (id: string) => Promise<unknown>, okMsg: string) => {
        setBusy(true);
        try {
            await fn(purchaseId);
            setToast(okMsg);
            setRefreshKey(k => k + 1);
        } catch (e) {
            setToast(e instanceof Error ? e.message : "Action failed.");
        } finally {
            setBusy(false);
        }
    };

    const openPdf = async (mode: "inline" | "attachment") => {
        setPdfBusy(true);
        try {
            const blob = await purchasesApi.pdf(purchaseId, mode);
            const url = URL.createObjectURL(blob);
            if (mode === "inline") {
                window.open(url, "_blank", "noopener,noreferrer");
            } else {
                const a = document.createElement("a");
                a.href = url;
                a.download = `${detail?.poNumber ?? "purchase-order"}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (e) {
            setToast(e instanceof Error ? e.message : "Could not open the PDF.");
        } finally {
            setPdfBusy(false);
        }
    };

    const openReceive = () => {
        if (!detail) return;
        const seeded: ReceiveFormValues["rows"] = [];
        for (const item of detail.items) {
            const remaining = item.quantity - item.receivedQty;
            if (remaining <= 0) continue;
            seeded.push({
                purchaseItemId: item.id,
                productId: item.productId,
                productLabel: item.product.brand,
                remaining,
                quantity: String(remaining),
                freeQuantity: "",
                batchNumber: item.batchNumber ?? "",
                expiryDate: "",
                purchasePrice: String(Number(item.purchasePrice)),
                mrp: String(Number(item.mrp))
            });
        }
        receiveForm.reset({ rows: seeded });
        setShowReceive(true);
    };

    const addReceiveRow = (itemId: string) => {
        const item = detail?.items.find(i => i.id === itemId);
        if (!item) return;
        appendReceive({
            purchaseItemId: item.id,
            productId: item.productId,
            productLabel: item.product.brand,
            remaining: item.quantity - item.receivedQty,
            quantity: "",
            freeQuantity: "",
            batchNumber: "",
            expiryDate: "",
            purchasePrice: String(Number(item.purchasePrice)),
            mrp: String(Number(item.mrp))
        });
    };

    const submitReceive = async (values: ReceiveFormValues) => {
        setReceiving(true);
        try {
            const items: ReceiptBatchInput[] = values.rows.map(r => ({
                purchaseItemId: r.purchaseItemId,
                productId: r.productId,
                quantity: Number(r.quantity),
                freeQuantity: r.freeQuantity ? Number(r.freeQuantity) : 0,
                batchNumber: r.batchNumber,
                expiryDate: r.expiryDate,
                purchasePrice: r.purchasePrice ? Number(r.purchasePrice) : undefined,
                mrp: r.mrp ? Number(r.mrp) : undefined
            }));
            const result = await purchasesApi.receive(purchaseId, { items });
            setToast(
                result.status === "PARTIALLY_RECEIVED" ? `GRN recorded — order partially received.` : `GRN recorded — order fully received, stock updated.`
            );
            setShowReceive(false);
            setRefreshKey(k => k + 1);
        } catch (e) {
            setToast(e instanceof Error ? e.message : "Could not record GRN.");
        } finally {
            setReceiving(false);
        }
    };

    const openReturn = async () => {
        if (!detail) return;
        try {
            const seeded: ReturnFormValues["rows"] = [];
            for (const item of detail.items) {
                const batches = await inventoryApi.medicineBatches(item.productId);
                for (const b of batches.items) {
                    if (b.quantity <= 0) continue;
                    seeded.push({
                        productLabel: `${item.product.brand} · ${b.batchNumber}`,
                        batchId: b.id,
                        batchNumber: b.batchNumber,
                        maxQty: b.quantity,
                        quantity: "",
                        reason: ""
                    });
                }
            }
            returnForm.reset({ rows: seeded });
            setShowReturn(true);
        } catch (e) {
            setToast(e instanceof Error ? e.message : "Could not load batches.");
        }
    };

    const submitReturn = async (values: ReturnFormValues) => {
        setReturning(true);
        try {
            const items: ReturnItemInput[] = values.rows
                .filter(r => r.quantity && Number(r.quantity) > 0)
                .map(r => ({
                    batchId: r.batchId,
                    quantity: Number(r.quantity),
                    reason: r.reason || undefined
                }));
            if (items.length === 0) {
                setToast("Enter a quantity for at least one batch.");
                return;
            }
            await purchasesApi.returnGoods(purchaseId, items);
            setToast("Return recorded — stock reduced.");
            setShowReturn(false);
            setRefreshKey(k => k + 1);
        } catch (e) {
            setToast(e instanceof Error ? e.message : "Could not record return.");
        } finally {
            setReturning(false);
        }
    };

    if (state === "loading" && !detail) {
        return (
            <div className="flex w-full items-center justify-center gap-2 py-24 text-[13px] text-ink/45">
                <Loader2 size={16} className="animate-spin" /> Loading purchase order…
            </div>
        );
    }

    if (state === "error" && !detail) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-16 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <ClipboardList size={32} className="text-danger/60" />
                <div>
                    <div className="text-[14px] font-medium text-ink">Could not load purchase order.</div>
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

    if (!detail) return null;

    const receivedAll = detail.items.every(i => i.receivedQty >= i.quantity);
    const canReturn = detail.status === "RECEIVED" || detail.status === "PARTIALLY_RECEIVED";

    return (
        <div className="flex w-full flex-col gap-6">
            <div>
                <Link href="/purchase/order" className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink/55 transition-colors hover:text-stamp">
                    <ArrowLeft size={14} /> Back to Purchase Orders
                </Link>
                <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                        <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">Purchase Order</span>
                        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">{detail.poNumber}</h1>
                        <p className="mt-1 text-[13.5px] text-ink/55">
                            Created {formatDateTime(detail.createdAt)}
                            {detail.createdBy?.fullName ? ` by ${detail.createdBy.fullName}` : ""}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`inline-block px-2.5 py-1 text-[12px] font-semibold ${statusBadge[detail.status]}`}>
                            {statusLabel[detail.status]}
                        </span>
                        {detail.receivedAt && <span className="text-[11px] text-ink/40 font-mono">Received {formatDateTime(detail.receivedAt)}</span>}
                    </div>
                </div>
            </div>

            {/* ── Header cards ── */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper-dim text-ink/60">
                        <Building2 size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">Supplier</div>
                        <div className="truncate font-display text-[15px] font-bold text-ink">{detail.supplier?.name ?? "—"}</div>
                        <div className="text-[11px] text-ink/40">{detail.supplier?.contactPerson || detail.supplier?.phone || ""}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper-dim text-ink/60">
                        <Truck size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">Branch</div>
                        <div className="font-display text-[15px] font-bold text-ink">{detail.branch?.name ?? "—"}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper-dim text-ink/60">
                        <CalendarClock size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">Expected Delivery</div>
                        <div className="font-display text-[15px] font-bold text-ink">
                            {detail.expectedDelivery ? formatDate(detail.expectedDelivery) : "—"}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stamp-dim text-stamp">
                        <ClipboardList size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">Items</div>
                        <div className="font-display text-[15px] font-bold text-ink">
                            {detail.items.length} line{detail.items.length === 1 ? "" : "s"}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PDF actions ── */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => void openPdf("inline")}
                    disabled={pdfBusy}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-teal-mid/30 bg-white px-4 py-2 text-[13px] font-semibold text-teal-deep transition-colors hover:bg-teal-mid/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {pdfBusy ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} Preview PDF
                </button>
                <button
                    onClick={() => void openPdf("attachment")}
                    disabled={pdfBusy}
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Download size={14} /> Download PDF
                </button>
            </div>

            {/* ── Workflow actions ── */}
            {canManage && (detail.status === "DRAFT" || detail.status === "SUBMITTED" || detail.status === "APPROVED" || canReturn) && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    {detail.status === "DRAFT" && (
                        <>
                            <Link
                                href={`/purchase/order/${detail.id}/edit`}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-teal-mid/30 bg-white px-4 py-2 text-[13px] font-semibold text-teal-deep transition-colors hover:bg-teal-mid/10"
                            >
                                <Pencil size={14} /> Edit Order
                            </Link>
                            <button
                                onClick={() => void act(purchasesApi.submit, `${detail.poNumber} submitted.`)}
                                disabled={busy}
                                className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Send size={14} /> Submit for Approval
                            </button>
                            <button
                                onClick={() => void act(purchasesApi.cancel, `${detail.poNumber} cancelled.`)}
                                disabled={busy}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-danger/30 bg-white px-4 py-2 text-[13px] font-semibold text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X size={14} /> Cancel Order
                            </button>
                        </>
                    )}
                    {detail.status === "SUBMITTED" && (
                        <>
                            <button
                                onClick={() => void act(purchasesApi.approve, `${detail.poNumber} approved.`)}
                                disabled={busy}
                                className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <CheckCircle2 size={14} /> Approve
                            </button>
                            <button
                                onClick={() => void act(purchasesApi.cancel, `${detail.poNumber} cancelled.`)}
                                disabled={busy}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-danger/30 bg-white px-4 py-2 text-[13px] font-semibold text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X size={14} /> Reject & Cancel
                            </button>
                        </>
                    )}
                    {detail.status === "APPROVED" && (
                        <>
                            <button
                                onClick={openReceive}
                                disabled={busy}
                                className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <PackageCheck size={14} /> Receive Goods (GRN)
                            </button>
                            <button
                                onClick={() => void act(purchasesApi.cancel, `${detail.poNumber} cancelled.`)}
                                disabled={busy}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-danger/30 bg-white px-4 py-2 text-[13px] font-semibold text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X size={14} /> Cancel Order
                            </button>
                        </>
                    )}
                    {canReturn && (
                        <button
                            onClick={() => void openReturn()}
                            disabled={busy}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-stamp/30 bg-white px-4 py-2 text-[13px] font-semibold text-stamp transition-colors hover:bg-stamp-dim disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RotateCcw size={14} /> Return Goods
                        </button>
                    )}
                </div>
            )}

            {/* ── Items table ── */}
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                    <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Line Items</span>
                    {receivedAll && detail.status !== "RECEIVED" && <span className="text-[11px] text-teal-mid font-semibold">Fully received</span>}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-[13.5px]">
                        <thead>
                            <tr className="border-b border-line">
                                <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Medicine</th>
                                <th className="px-4 py-3 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Qty</th>
                                <th className="px-4 py-3 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Free</th>
                                <th className="px-4 py-3 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Rate</th>
                                <th className="px-4 py-3 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Disc</th>
                                <th className="px-4 py-3 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">GST</th>
                                <th className="px-4 py-3 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                                    Line Total
                                </th>
                                <th className="px-4 py-3 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                                    Received
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {detail.items.map(item => (
                                <tr key={item.id} className="border-b border-line/60">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-ink">{item.product.brand}</div>
                                        <div className="text-[11px] text-ink/40">
                                            {[item.product.strength, item.product.dosageForm, item.product.packSize].filter(Boolean).join(" · ") || "—"}
                                            {item.batchNumber ? ` · batch ${item.batchNumber}` : ""}
                                            {item.expiryDate ? ` · exp ${formatDate(item.expiryDate)}` : ""}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-semibold text-ink">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right font-mono text-ink/60">{item.freeQuantity > 0 ? item.freeQuantity : "—"}</td>
                                    <td className="px-4 py-3 text-right font-mono text-ink/70">{formatINR(Number(item.purchasePrice))}</td>
                                    <td className="px-4 py-3 text-right font-mono text-teal-mid">
                                        {Number(item.discount) > 0 ? `${item.discount}%` : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-ink/70">{Number(item.gstRate) > 0 ? `${item.gstRate}%` : "—"}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-ink">{formatINR(Number(item.total))}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`inline-block px-2 py-0.5 text-[11px] font-semibold ${
                                                item.receivedQty >= item.quantity
                                                    ? "border border-teal-mid/30 bg-teal-mid/10 text-teal-mid"
                                                    : "border border-line bg-paper-dim text-ink/50"
                                            }`}
                                        >
                                            {item.receivedQty}/{item.quantity}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Receipts ── */}
            {detail.receipts.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
                        <PackageCheck size={15} className="text-teal-mid" />
                        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                            Goods Receipts ({detail.receipts.length})
                        </span>
                    </div>
                    <div className="divide-y divide-line/70">
                        {detail.receipts.map(receipt => (
                            <div key={receipt.id} className="px-4 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[12.5px] font-bold text-ink">{receipt.receiptNumber}</span>
                                        <span className="text-[11.5px] text-ink/45">
                                            {formatDateTime(receipt.receivedAt)}
                                            {receipt.receivedBy?.fullName ? ` by ${receipt.receivedBy.fullName}` : ""}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-ink/40">
                                        {receipt.items.length} lot{receipt.items.length === 1 ? "" : "s"}
                                    </span>
                                </div>
                                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                                    {receipt.items.map(ri => (
                                        <div key={ri.id} className="flex items-center justify-between border border-line/70 bg-paper-dim/50 px-2.5 py-1.5">
                                            <div>
                                                <div className="text-[12px] font-medium text-ink">{ri.product?.brand ?? "Product"}</div>
                                                <div className="font-mono text-[10.5px] text-ink/45">
                                                    {ri.batchNumber} · exp {formatDate(ri.expiryDate)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-[12px] font-semibold text-ink">{ri.quantity + ri.freeQuantity}</div>
                                                {ri.freeQuantity > 0 && <div className="text-[10.5px] text-teal-mid">free {ri.freeQuantity}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Totals ── */}
            <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)] sm:flex-row sm:items-start sm:justify-between">
                <div className="text-[12.5px] text-ink/55">
                    {detail.notes && <p className="mb-1">Notes: {detail.notes}</p>}
                    <p>Status flows: Draft → Submitted → Approved → Received (GRN adds stock).</p>
                </div>
                <div className="w-full max-w-xs space-y-1 text-[13px] text-ink/60">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono font-semibold text-ink">{formatINR(Number(detail.subtotal))}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Discount</span>
                        <span className="font-mono font-semibold text-teal-mid">−{formatINR(Number(detail.discount))}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>GST</span>
                        <span className="font-mono font-semibold text-ink">{formatINR(Number(detail.tax))}</span>
                    </div>
                    <div className="flex justify-between border-t border-line pt-1">
                        <span className="font-semibold text-ink">Grand total</span>
                        <span className="font-mono font-bold text-ink">{formatINR(Number(detail.total))}</span>
                    </div>
                </div>
            </div>

            {/* ── Receive modal ── */}
            {showReceive && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
                    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                            <div className="flex items-center gap-2">
                                <PackageCheck size={15} className="text-teal-mid" />
                                <span className="font-display text-[15px] font-semibold text-ink">Receive Goods (GRN)</span>
                            </div>
                            <button onClick={() => setShowReceive(false)} className="cursor-pointer text-ink/40 hover:text-ink">
                                <X size={17} />
                            </button>
                        </div>
                        <Form {...receiveForm}>
                            <form onSubmit={receiveForm.handleSubmit(submitReceive)}>
                                <div className="flex-1 overflow-y-auto px-5 py-4">
                                    {receiveFields.map((row, idx) => (
                                        <div key={row.id} className="mb-4 border border-line/70 bg-paper-dim/40 p-3">
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] font-semibold text-ink">{row.productLabel}</span>
                                                    <span className="text-[11px] text-ink/45">max {row.remaining} remaining</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => addReceiveRow(row.purchaseItemId)}
                                                        className="flex cursor-pointer items-center gap-1 text-[11.5px] font-semibold text-teal-mid"
                                                    >
                                                        <Plus size={13} /> Add batch
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeReceive(idx)}
                                                        className="cursor-pointer text-ink/35 hover:text-danger"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                                                <div>
                                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink/50">Qty *</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        {...receiveForm.register(`rows.${idx}.quantity`)}
                                                        className={inputBase}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink/50">Free</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        {...receiveForm.register(`rows.${idx}.freeQuantity`)}
                                                        className={inputBase}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink/50">Batch *</label>
                                                    <input
                                                        {...receiveForm.register(`rows.${idx}.batchNumber`)}
                                                        placeholder="e.g. BT26001"
                                                        className={inputBase}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink/50">Expiry *</label>
                                                    <input
                                                        type="date"
                                                        {...receiveForm.register(`rows.${idx}.expiryDate`)}
                                                        className={inputBase}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink/50">Cost</label>
                                                    <input
                                                        type="number"
                                                        {...receiveForm.register(`rows.${idx}.purchasePrice`)}
                                                        className={inputBase}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink/50">MRP</label>
                                                    <input
                                                        type="number"
                                                        {...receiveForm.register(`rows.${idx}.mrp`)}
                                                        className={inputBase}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-[11.5px] text-ink/40">
                                        Split a line across batches by adding rows. Free stock adds to the batch without counting against the ordered quantity.
                                    </p>
                                    {receiveForm.formState.errors.rows && (
                                        <div className="border border-danger/25 bg-danger-bg px-3 py-2 text-[12.5px] text-danger">
                                            Fix the highlighted fields to record this GRN.
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowReceive(false)}
                                        className="cursor-pointer rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink/60 hover:bg-paper-dim"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={receiving}
                                        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-teal-mid px-4 py-2 text-[13px] font-semibold text-white hover:bg-teal-deep disabled:opacity-50"
                                    >
                                        {receiving && <Loader2 size={14} className="animate-spin" />}
                                        {receiving ? "Recording…" : "Record GRN"}
                                    </button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            )}

            {/* ── Return modal ── */}
            {showReturn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
                    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                            <div className="flex items-center gap-2">
                                <RotateCcw size={15} className="text-stamp" />
                                <span className="font-display text-[15px] font-semibold text-ink">Return Goods to Vendor</span>
                            </div>
                            <button onClick={() => setShowReturn(false)} className="cursor-pointer text-ink/40 hover:text-ink">
                                <X size={17} />
                            </button>
                        </div>
                        <Form {...returnForm}>
                            <form onSubmit={returnForm.handleSubmit(submitReturn)}>
                                <div className="flex-1 overflow-y-auto px-5 py-4">
                                    {returnFields.length === 0 && (
                                        <div className="py-8 text-center text-[13px] text-ink/45">No batches with stock found for this order.</div>
                                    )}
                                    <div className="space-y-2.5">
                                        {returnFields.map((row, idx) => (
                                            <div key={row.id} className="flex flex-wrap items-center gap-2.5 border border-line/70 bg-paper-dim/40 p-2.5">
                                                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{row.productLabel}</span>
                                                <span className="text-[11px] text-ink/45">on hand {row.maxQty}</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={row.maxQty}
                                                    placeholder="Qty"
                                                    {...returnForm.register(`rows.${idx}.quantity`)}
                                                    className="w-24 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-ink focus:border-stamp focus:outline-none"
                                                />
                                                <input
                                                    placeholder="Reason (damaged, expired…)"
                                                    {...returnForm.register(`rows.${idx}.reason`)}
                                                    className="w-52 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-ink placeholder:text-ink/35 focus:border-stamp focus:outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {returnForm.formState.errors.rows && (
                                        <div className="border border-danger/25 bg-danger-bg px-3 py-2 text-[12.5px] text-danger">
                                            Fix the highlighted fields to record this return.
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowReturn(false)}
                                        className="cursor-pointer rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink/60 hover:bg-paper-dim"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={returning}
                                        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-stamp px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                                    >
                                        {returning && <Loader2 size={14} className="animate-spin" />}
                                        {returning ? "Recording…" : "Record Return"}
                                    </button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
                    <CheckCircle2 size={16} className="text-teal-mid" />
                    <span className="text-[13px] text-ink">{toast}</span>
                </div>
            )}
        </div>
    );
}
