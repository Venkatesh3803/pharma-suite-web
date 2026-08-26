"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ClipboardList, FilePlus2, Loader2, PackageCheck, Send, X } from "lucide-react";
import { purchasesApi, type PurchaseRow, type PurchaseStatus } from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { formatINR, formatDate } from "@/lib/inventory";

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
    PARTIALLY_RECEIVED: "Partial GRN",
    RECEIVED: "Received",
    CANCELLED: "Cancelled"
};

const FILTERS: { value: PurchaseStatus | "ALL"; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "DRAFT", label: "Drafts" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "APPROVED", label: "Approved" },
    { value: "RECEIVED", label: "Received" },
    { value: "CANCELLED", label: "Cancelled" }
];

export default function PurchaseOrdersPage() {
    const router = useRouter();
    const user = useAppSelector(state => state.auth.user);
    const canManage = user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "MANAGER";

    const [state, setState] = useState<LoadState>("loading");
    const [error, setError] = useState("");
    const [list, setList] = useState<{ items: PurchaseRow[]; total: number } | null>(null);
    const [status, setStatus] = useState<PurchaseStatus | "ALL">("ALL");
    const [refreshKey, setRefreshKey] = useState(0);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;
        async function load() {
            try {
                const data = await purchasesApi.list({
                    status: status === "ALL" ? undefined : status,
                    pageSize: 50
                });
                if (!ignore) {
                    setList(data);
                    setState("ready");
                }
            } catch (e) {
                if (!ignore) {
                    setError(e instanceof Error ? e.message : "Could not load purchase orders.");
                    setState("error");
                }
            }
        }
        void load();
        return () => {
            ignore = true;
        };
    }, [status, refreshKey]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [toast]);

    const act = async (po: PurchaseRow, fn: (id: string) => Promise<unknown>, okMsg: string) => {
        setBusyId(po.id);
        try {
            await fn(po.id);
            setToast(okMsg);
            setRefreshKey(k => k + 1);
        } catch (e) {
            setToast(e instanceof Error ? e.message : "Action failed.");
        } finally {
            setBusyId(null);
        }
    };

    const renderActions = (po: PurchaseRow) => {
        if (!canManage) return null;
        const base =
            "flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
        return (
            <div className="flex items-center justify-end gap-1.5">
                {po.status === "DRAFT" && (
                    <>
                        <button
                            disabled={busyId === po.id}
                            onClick={() => void act(po, purchasesApi.submit, `${po.poNumber} submitted.`)}
                            className={`${base} border-line bg-white text-ink/70 hover:border-stamp hover:text-stamp`}
                        >
                            <Send size={12} /> Submit
                        </button>
                        <button
                            disabled={busyId === po.id}
                            onClick={() => void act(po, purchasesApi.cancel, `${po.poNumber} cancelled.`)}
                            className={`${base} border-danger/30 bg-white text-danger hover:bg-danger-bg`}
                        >
                            <X size={12} /> Cancel
                        </button>
                    </>
                )}
                {po.status === "SUBMITTED" && (
                    <button
                        disabled={busyId === po.id}
                        onClick={() => void act(po, purchasesApi.approve, `${po.poNumber} approved.`)}
                        className={`${base} bg-ink text-paper hover:bg-teal-deep`}
                    >
                        <CheckCircle2 size={12} /> Approve
                    </button>
                )}
                {po.status === "APPROVED" && (
                    <button
                        disabled={busyId === po.id}
                        onClick={() => void act(po, purchasesApi.receive, `${po.poNumber} received — stock updated.`)}
                        className={`${base} bg-ink text-paper hover:bg-teal-deep`}
                    >
                        <PackageCheck size={12} /> Receive
                    </button>
                )}
                <button
                    onClick={() => router.push(`/purchase/order/${po.id}`)}
                    className={`${base} border-line bg-white text-ink/70 hover:border-stamp hover:text-stamp`}
                >
                    Open <ArrowRight size={12} />
                </button>
            </div>
        );
    };

    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">Procurement</span>
                    <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">Purchase Orders</h1>
                    <p className="mt-1 text-[13.5px] text-ink/55">Draft → submit → approve → receive. Stock lands in the ledger only on receipt (GRN).</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => router.push("/purchase/order/new")}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
                    >
                        <FilePlus2 size={15} /> New Purchase Order
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setStatus(f.value)}
                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                            status === f.value ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink/60 hover:border-stamp hover:text-stamp"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {state === "error" && (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <ClipboardList size={32} className="text-danger/60" />
                    <div>
                        <div className="text-[14px] font-medium text-ink">Could not load purchase orders.</div>
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
                                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">PO Number</th>
                                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Supplier</th>
                                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Branch</th>
                                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Created</th>
                                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Expected</th>
                                <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                                    Total
                                </th>
                                <th className="px-4 py-3.5 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                                    Status
                                </th>
                                <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {state === "loading" && !list && (
                                <tr>
                                    <td colSpan={8} className="px-12 py-14">
                                        <div className="flex items-center justify-center gap-2 text-[13px] text-ink/45">
                                            <Loader2 size={16} className="animate-spin" /> Loading purchase orders…
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {state === "ready" &&
                                list?.items.map(po => (
                                    <tr
                                        key={po.id}
                                        onClick={() => router.push(`/purchase/order/${po.id}`)}
                                        className="cursor-pointer border-b border-line/60 transition-colors hover:bg-paper/70"
                                    >
                                        <td className="px-4 py-3.5 font-mono text-[13px] font-semibold text-ink">{po.poNumber}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-medium text-ink/80">{po.supplier?.name ?? "—"}</div>
                                            {po.supplier?.leadTimeDays != null && (
                                                <div className="text-[11px] text-ink/40">lead {po.supplier.leadTimeDays}d</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-ink/60">{po.branch?.name ?? "—"}</td>
                                        <td className="px-4 py-3.5 text-ink/60">{formatDate(po.createdAt)}</td>
                                        <td className="px-4 py-3.5 text-ink/60">{po.expectedDelivery ? formatDate(po.expectedDelivery) : "—"}</td>
                                        <td className="px-4 py-3.5 text-right font-mono font-bold text-ink">{formatINR(Number(po.total))}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`inline-block px-2.5 py-1 text-[11.5px] font-semibold ${statusBadge[po.status]}`}>
                                                {statusLabel[po.status]}
                                            </span>
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>{renderActions(po)}</td>
                                    </tr>
                                ))}

                            {state === "ready" && list && list.items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-12 py-12 text-center text-ink/40">
                                        <ClipboardList size={32} className="mx-auto mb-3 opacity-40" />
                                        <div className="text-[14px]">No purchase orders found.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
                    <CheckCircle2 size={16} className="text-teal-mid" />
                    <span className="text-[13px] text-ink">{toast}</span>
                </div>
            )}
        </div>
    );
}
