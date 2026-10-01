"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ClipboardList, FilePlus2, PackageCheck, Send, X } from "lucide-react";
import { purchasesApi, type PurchaseRow, type PurchaseStatus } from "@/lib/api";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { usePaginatedList } from "@/lib/hooks/usePaginatedList";
import { formatINR, formatDate } from "@/lib/inventory";
import {
  PageHeader,
  ErrorState,
  TableShell,
  Th,
  Td,
  TableRow,
  LoadingRow,
  EmptyRow,
  StatusBadge,
  PrimaryButton,
  SecondaryButton,
} from "@/components/common";

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
    const { can } = usePermissions();
    const canManage = can.isManagerOrAbove();

    const [status, setStatus] = useState<PurchaseStatus | "ALL">("ALL");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const { data: list, state, error, refresh, retry } = usePaginatedList({
        fetcher: () =>
            purchasesApi.list({
                status: status === "ALL" ? undefined : status,
                pageSize: 50
            }),
        deps: [status],
    });

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
            refresh();
        } catch (e) {
            setToast(e instanceof Error ? e.message : "Action failed.");
        } finally {
            setBusyId(null);
        }
    };

    const renderActions = (po: PurchaseRow) => {
        if (!canManage) return null;
        return (
            <div className="flex items-center justify-end gap-1.5">
                {po.status === "DRAFT" && (
                    <>
                        <SecondaryButton
                            disabled={busyId === po.id}
                            onClick={() => void act(po, purchasesApi.submit, `${po.poNumber} submitted.`)}
                        >
                            <Send size={12} /> Submit
                        </SecondaryButton>
                        <SecondaryButton
                            disabled={busyId === po.id}
                            onClick={() => void act(po, purchasesApi.cancel, `${po.poNumber} cancelled.`)}
                            className="border-danger/30 text-danger hover:border-danger/30 hover:bg-danger-bg hover:text-danger"
                        >
                            <X size={12} /> Cancel
                        </SecondaryButton>
                    </>
                )}
                {po.status === "SUBMITTED" && (
                    <SecondaryButton
                        disabled={busyId === po.id}
                        onClick={() => void act(po, purchasesApi.approve, `${po.poNumber} approved.`)}
                        className="border-ink bg-ink text-paper hover:border-ink hover:bg-teal-deep hover:text-paper"
                    >
                        <CheckCircle2 size={12} /> Approve
                    </SecondaryButton>
                )}
                {po.status === "APPROVED" && (
                    <SecondaryButton
                        disabled={busyId === po.id}
                        onClick={() => void act(po, purchasesApi.receive, `${po.poNumber} received — stock updated.`)}
                        className="border-ink bg-ink text-paper hover:border-ink hover:bg-teal-deep hover:text-paper"
                    >
                        <PackageCheck size={12} /> Receive
                    </SecondaryButton>
                )}
                <SecondaryButton
                    onClick={() => router.push(`/purchase/order/${po.id}`)}
                >
                    Open <ArrowRight size={12} />
                </SecondaryButton>
            </div>
        );
    };

    return (
        <div className="flex w-full flex-col gap-6">
            <PageHeader
                eyebrow="Procurement"
                title="Purchase Orders"
                description="Draft → submit → approve → receive. Stock lands in the ledger only on receipt (GRN)."
                actions={
                    canManage ? (
                        <PrimaryButton onClick={() => router.push("/purchase/order/new")}>
                            <FilePlus2 size={15} /> New Purchase Order
                        </PrimaryButton>
                    ) : undefined
                }
            />

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
                <ErrorState
                    title="Could not load purchase orders."
                    description={error}
                    onRetry={retry}
                    icon={<ClipboardList size={32} className="text-danger/60" />}
                />
            )}

            <TableShell>
                <thead>
                    <tr className="border-b border-line">
                        <Th>PO Number</Th>
                        <Th>Supplier</Th>
                        <Th>Branch</Th>
                        <Th>Created</Th>
                        <Th>Expected</Th>
                        <Th align="right">Total</Th>
                        <Th align="center">Status</Th>
                        <Th align="right">Actions</Th>
                    </tr>
                </thead>
                <tbody>
                    {state === "loading" && !list && (
                        <LoadingRow colSpan={8} message="Loading purchase orders…" />
                    )}

                    {state === "ready" &&
                        list?.items.map(po => (
                            <TableRow
                                key={po.id}
                                onClick={() => router.push(`/purchase/order/${po.id}`)}
                            >
                                <Td className="font-mono text-[13px] font-semibold text-ink">{po.poNumber}</Td>
                                <Td>
                                    <div className="font-medium text-ink/80">{po.supplier?.name ?? "—"}</div>
                                    {po.supplier?.leadTimeDays != null && (
                                        <div className="text-[11px] text-ink/40">lead {po.supplier.leadTimeDays}d</div>
                                    )}
                                </Td>
                                <Td className="text-ink/60">{po.branch?.name ?? "—"}</Td>
                                <Td className="text-ink/60">{formatDate(po.createdAt)}</Td>
                                <Td className="text-ink/60">{po.expectedDelivery ? formatDate(po.expectedDelivery) : "—"}</Td>
                                <Td align="right" className="font-mono font-bold text-ink">{formatINR(Number(po.total))}</Td>
                                <Td align="center">
                                    <StatusBadge className={statusBadge[po.status]}>
                                        {statusLabel[po.status]}
                                    </StatusBadge>
                                </Td>
                                <Td align="right">
                                    <div onClick={e => e.stopPropagation()}>{renderActions(po)}</div>
                                </Td>
                            </TableRow>
                        ))}

                    {state === "ready" && list && list.items.length === 0 && (
                        <EmptyRow
                            colSpan={8}
                            icon={<ClipboardList size={32} />}
                            message="No purchase orders found."
                        />
                    )}
                </tbody>
            </TableShell>

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
                    <CheckCircle2 size={16} className="text-teal-mid" />
                    <span className="text-[13px] text-ink">{toast}</span>
                </div>
            )}
        </div>
    );
}
