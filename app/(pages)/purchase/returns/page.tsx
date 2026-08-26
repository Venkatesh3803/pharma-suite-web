"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { purchasesApi, type PurchaseReturnRow } from "@/lib/api";
import { formatDateTime } from "@/lib/inventory";

type LoadState = "loading" | "error" | "ready";

export default function PurchaseReturnsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [list, setList] = useState<{ items: PurchaseReturnRow[]; total: number } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await purchasesApi.returns({ pageSize: 50 });
        if (!ignore) {
          setList(data);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load returns.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
          Procurement
        </span>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
          Purchase Returns
        </h1>
        <p className="mt-1 text-[13.5px] text-ink/55">
          Stock returned to vendors — each entry reduces the batch balance and is
          audited against the original purchase order.
        </p>
      </div>

      {state === "loading" && (
        <div className="flex items-center gap-2 py-16 text-ink/50">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-[13px]">Loading returns…</span>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-lg border border-danger/40 bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}

      {state === "ready" && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body">
              <thead>
                <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/40">
                  <th className="px-4 py-3 font-medium">Medicine</th>
                  <th className="px-4 py-3 font-medium">Batch</th>
                  <th className="px-4 py-3 font-medium text-right">Qty Returned</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {list?.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-ink/45">
                      No returns recorded yet.
                    </td>
                  </tr>
                )}
                {list?.items.map(m => (
                  <tr key={m.id} className="border-b border-line/70">
                    <td className="px-4 py-3">
                      <div className="text-[13.5px] font-semibold text-ink">
                        {m.product?.brand ?? "Product"}
                      </div>
                      {m.product?.genericName && (
                        <div className="text-[11.5px] text-ink/45">{m.product.genericName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-ink/70">
                      {m.batch?.batchNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block border border-danger/30 bg-danger-bg px-2 py-0.5 font-mono text-[12px] font-semibold text-danger">
                        −{Math.abs(m.quantity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-ink/60">{m.note ?? "—"}</td>
                    <td className="px-4 py-3 text-[12.5px] text-ink/60">
                      {m.branch?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-[12.5px] text-ink/60">
                      {formatDateTime(m.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list && list.total > 50 && (
            <div className="border-t border-line bg-paper-dim px-4 py-2 text-[12px] text-ink/50">
              Showing first 50 of {list.total} returns.
            </div>
          )}
        </div>
      )}
    </div>
  );
}