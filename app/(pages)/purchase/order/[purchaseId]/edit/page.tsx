"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ClipboardList, FilePlus2, Loader2, Lock } from "lucide-react";
import PurchaseOrderForm, { type LineItem } from "@/components/purchase/PurchaseOrderForm";
import { purchasesApi, type PurchaseDetail } from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";

type LoadState = "loading" | "error" | "ready";

export default function EditPurchaseOrderPage() {
    const params = useParams<{ purchaseId: string }>();
    const purchaseId = params.purchaseId;
    const user = useAppSelector(state => state.auth.user);
    const canManage = user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "MANAGER";

    const [state, setState] = useState<LoadState>(canManage ? "loading" : "ready");
    const [error, setError] = useState("");
    const [detail, setDetail] = useState<PurchaseDetail | null>(null);

    useEffect(() => {
        if (!canManage) return;
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
    }, [canManage, purchaseId]);

    if (!canManage) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-16 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <FilePlus2 size={32} className="text-danger/60" />
                <div>
                    <div className="text-[14px] font-medium text-ink">Access restricted.</div>
                    <div className="mt-1 text-[12.5px] text-ink/50">Your role does not have permission to manage purchase orders.</div>
                </div>
                <Link href="/purchase/order" className="rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep">
                    Back to Purchase Orders
                </Link>
            </div>
        );
    }

    if (state === "loading" || !detail) {
        return (
            <div className="flex w-full items-center justify-center gap-2 py-24 text-[13px] text-ink/45">
                <Loader2 size={16} className="animate-spin" /> Loading purchase order…
            </div>
        );
    }

    if (state === "error") {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-16 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <ClipboardList size={32} className="text-danger/60" />
                <div>
                    <div className="text-[14px] font-medium text-ink">Could not load purchase order.</div>
                    <div className="mt-1 text-[12.5px] text-ink/50">{error}</div>
                </div>
                <Link href="/purchase/order" className="rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep">
                    Back to Purchase Orders
                </Link>
            </div>
        );
    }

    if (detail.status !== "DRAFT") {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-16 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <Lock size={32} className="text-ink/40" />
                <div>
                    <div className="text-[14px] font-medium text-ink">This order can no longer be edited.</div>
                    <div className="mt-1 max-w-md text-[12.5px] leading-relaxed text-ink/50">
                        Purchase orders can only be edited while they are in <span className="font-semibold text-ink">Draft</span>. This order is currently{" "}
                        <span className="font-semibold text-ink">{detail.status.replace(/_/g, " ")}</span> and is locked to prevent changes after it has
                        moved through the workflow.
                    </div>
                </div>
                <Link
                    href={`/purchase/order/${purchaseId}`}
                    className="rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep"
                >
                    View Purchase Order
                </Link>
            </div>
        );
    }

    const initialItems: LineItem[] = detail.items.map(i => ({
        productId: i.productId,
        quantity: String(i.quantity),
        freeQuantity: String(i.freeQuantity),
        purchasePrice: String(Number(i.purchasePrice)),
        mrp: String(Number(i.mrp)),
        sellingPrice: i.sellingPrice != null && Number(i.sellingPrice) > 0 ? String(Number(i.sellingPrice)) : "",
        gstRate: String(Number(i.gstRate)),
        discount: String(Number(i.discount)),
        batchNumber: i.batchNumber ?? "",
        expiryDate: i.expiryDate ? String(i.expiryDate).slice(0, 10) : ""
    }));

    return (
        <PurchaseOrderForm
            mode="edit"
            poId={purchaseId}
            initial={{
                branchId: detail.branchId,
                supplierId: detail.supplierId,
                expectedDelivery: detail.expectedDelivery ? String(detail.expectedDelivery).slice(0, 10) : "",
                notes: detail.notes ?? "",
                items: initialItems
            }}
        />
    );
}
