"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertTriangle,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  inventoryApi,
  type MovementItem,
  type MovementType,
} from "@/lib/api";
import {
  formatDateTime,
  movementTypeBadge,
  movementTypeLabel,
} from "@/lib/inventory";

type LoadState = "loading" | "error" | "ready";

export default function MovementsPage() {
  const [items, setItems] = useState<MovementItem[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<MovementType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 30;

  useEffect(() => {
    let ignore = false;
    async function fetchMovements() {
      try {
        const data = await inventoryApi.movements({
          type: type === "ALL" ? undefined : type,
          search: search || undefined,
          page,
          pageSize,
        });
        if (!ignore) {
          setItems(data.items);
          setTotal(data.total);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load movements.");
          setState("error");
        }
      }
    }
    void fetchMovements();
    return () => {
      ignore = true;
    };
  }, [search, type, page, refreshKey]);

  const retry = () => {
    setState("loading");
    setError("");
    setRefreshKey(k => k + 1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const inputBase =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Link
          href="/inventory"
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink/55 transition-colors hover:text-stamp"
        >
          ← Back to Inventory
        </Link>
        <div className="mt-3">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Ledger Feed
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Stock Movement Ledger
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Every stock mutation — purchases, sales, adjustments and counts — with
            before/after balances, traced to the operator who made it.
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            type="text"
            placeholder="Search by medicine or batch number…"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={`${inputBase} pl-9`}
          />
        </div>
        <select
          value={type}
          onChange={e => {
            setType(e.target.value as MovementType | "ALL");
            setPage(1);
          }}
          className={`${inputBase} w-56 cursor-pointer`}
        >
          <option value="ALL">All Movement Types</option>
          <option value="PURCHASE">Purchase</option>
          <option value="SALE">Sale</option>
          <option value="SALE_RETURN">Sale Return</option>
          <option value="PURCHASE_RETURN">Purchase Return</option>
          <option value="ADJUSTMENT">Adjustment</option>
          <option value="TRANSFER_IN">Transfer In</option>
          <option value="TRANSFER_OUT">Transfer Out</option>
          <option value="OPENING_STOCK">Opening Stock</option>
          <option value="EXPIRED">Expired</option>
          <option value="DAMAGED">Damaged</option>
        </select>
      </div>

      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <AlertTriangle size={32} className="text-danger/60" />
          <div>
            <div className="text-[14px] font-medium text-ink">Could not load movements.</div>
            <div className="mt-1 text-[12.5px] text-ink/50">{error}</div>
          </div>
          <button
            onClick={retry}
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
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Date
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Type
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Medicine
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Batch
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Qty Change
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Balance
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Branch
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  By
                </th>
              </tr>
            </thead>
            <tbody>
              {state === "loading" && (
                <tr>
                  <td colSpan={8} className="px-12 py-14">
                    <div className="flex items-center justify-center gap-2 text-[13px] text-ink/45">
                      <Loader2 size={16} className="animate-spin" /> Loading movement ledger…
                    </div>
                  </td>
                </tr>
              )}
              {state === "ready" &&
                items.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-line/60 transition-colors hover:bg-paper/70"
                  >
                    <td className="px-4 py-3 text-ink/60">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 text-[11px] font-semibold ${
                          movementTypeBadge[item.type]
                        }`}
                      >
                        {movementTypeLabel[item.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/inventory/${item.product.id}`}
                        className="font-semibold text-ink hover:text-teal-mid"
                      >
                        {item.product.brand}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-ink/60">
                      {item.batch?.batchNumber ?? "—"}
                    </td>
                    <td
                      className={`px-4 py-3 font-mono font-bold ${
                        item.quantity >= 0 ? "text-teal-mid" : "text-danger"
                      }`}
                    >
                      {item.quantity >= 0 ? "+" : ""}
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-ink/60">
                      {item.beforeQty} → {item.afterQty}
                    </td>
                    <td className="px-4 py-3 text-ink/60">{item.branch?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink/60">
                      {item.user?.fullName ?? "—"}
                    </td>
                  </tr>
                ))}
              {state === "ready" && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-12 py-12 text-center text-ink/40">
                    <Activity size={32} className="mx-auto mb-3 opacity-40" />
                    <div className="text-[14px]">No movements match your filters.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-line bg-paper-dim px-4 py-2.5 text-[12.5px] text-ink/55">
            <span>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 font-medium text-ink/70 transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span className="font-mono">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 font-medium text-ink/70 transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}