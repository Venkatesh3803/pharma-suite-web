"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  Package,
  Layers,
  CalendarClock,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  PackagePlus,
} from "lucide-react";
import {
  inventoryApi,
  type InventoryListResult,
  type InventorySummary,
  type StockStatus,
} from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  formatINR,
  formatINRCompact,
  formatDate,
  stockStatusBadge,
  stockStatusLabel,
  movementStatusLabel,
  expiryStatusLabel,
  movementStatusBadge,
  expiryStatusBadge,
} from "@/lib/inventory";

type LoadState = "loading" | "error" | "ready";

export default function MedicineInventory() {
  const router = useRouter();
  const user = useAppSelector(state => state.auth.user);
  const canCreate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "OWNER" ||
    user?.role === "MANAGER";
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [list, setList] = useState<InventoryListResult | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function fetchInventory() {
      try {
        const [sum, data] = await Promise.all([
          inventoryApi.summary(),
          inventoryApi.list({
            search: searchTerm || undefined,
            stockStatus: stockStatus === "ALL" ? undefined : stockStatus,
            page,
            pageSize: 20,
          }),
        ]);
        if (!ignore) {
          setSummary(sum);
          setList(data);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load inventory.");
          setState("error");
        }
      }
    }
    void fetchInventory();
    return () => {
      ignore = true;
    };
  }, [searchTerm, stockStatus, page, refreshKey]);

  const runSearch = () => {
    setPage(1);
    setState("loading");
    setError("");
    setRefreshKey(k => k + 1);
  };

  const retry = () => {
    setState("loading");
    setError("");
    setRefreshKey(k => k + 1);
  };

  const inputBase =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

  const totalPages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1;

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header System ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Warehouse Ledger
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Medicine Central Inventory
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Live stock, batch-wise expiry and movement intelligence across your
            branches — powered by FEFO-safe ledger data.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push("/inventory/new")}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
          >
            <PackagePlus size={15} /> Add Medicine
          </button>
        )}
      </div>

      {/* ── High-Level Analytics Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper-dim text-ink/60">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              Stock Value (Cost)
            </div>
            <div className="font-display text-xl font-bold text-ink">
              {summary ? formatINRCompact(summary.inventoryValue) : "—"}
            </div>
            <div className="text-[11px] text-ink/40">
              {summary ? `${summary.totalMedicines} SKUs tracked` : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stamp-dim text-stamp">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              At / Below Reorder
            </div>
            <div className="font-display text-xl font-bold text-stamp">
              {summary ? summary.lowStock.products : "—"} SKUs
            </div>
            <div className="text-[11px] text-ink/40">
              threshold {summary ? summary.lowStockThreshold : ""} units
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-bg text-danger">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              Expiry Risk
            </div>
            <div className="font-display text-xl font-bold text-danger">
              {summary ? summary.expiringSoon.products : "—"} SKUs
            </div>
            <div className="text-[11px] text-ink/40">
              {summary ? summary.expired.products : ""} already expired
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper-dim text-ink/60">
            <CalendarClock size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              Dead Stock
            </div>
            <div className="font-display text-xl font-bold text-ink">
              {summary ? summary.deadStock : "—"} SKUs
            </div>
            <div className="text-[11px] text-ink/40">
              {summary ? summary.outOfStock : ""} out of stock
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Options Action Bar ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            type="text"
            placeholder="Search by brand, generic name or manufacturer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") runSearch();
            }}
            className={`${inputBase} pl-9`}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter size={15} className="text-ink/50" />
          <select
            value={stockStatus}
            onChange={e => {
              setStockStatus(e.target.value as StockStatus | "ALL");
              setPage(1);
            }}
            className={`${inputBase} cursor-pointer`}
          >
            <option value="ALL">All Stock Levels</option>
            <option value="HEALTHY">Healthy</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="OVERSTOCKED">Overstocked</option>
          </select>
        </div>

        <button
          onClick={runSearch}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13.5px] font-semibold text-paper transition-colors hover:bg-teal-deep"
        >
          Apply Filters
        </button>
      </div>

      {/* ── Error State ── */}
      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <AlertTriangle size={32} className="text-danger/60" />
          <div>
            <div className="text-[14px] font-medium text-ink">
              Could not load inventory.
            </div>
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

      {/* ── Main Inventory Ledger Table ── */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Medicine
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  On Hand
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Velocity
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Nearest Expiry
                </th>
                <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  Value
                </th>
                <th className="px-4 py-3.5 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  Stock
                </th>
                <th className="px-4 py-3.5 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  Movement
                </th>
                <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {state === "loading" && !list && (
                <tr>
                  <td colSpan={8} className="px-12 py-14">
                    <div className="flex items-center justify-center gap-2 text-[13px] text-ink/45">
                      <Loader2 size={16} className="animate-spin" />
                      Loading inventory ledger…
                    </div>
                  </td>
                </tr>
              )}

              {state === "ready" &&
                list?.items.map(item => (
                  <tr
                    key={item.productId}
                    onClick={() => router.push(`/inventory/${item.productId}`)}
                    className="cursor-pointer border-b border-line/60 transition-colors hover:bg-paper/70"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink">{item.brand}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-ink/40">
                        <span>
                          {[item.strength, item.dosageForm, item.packSize]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                        {item.category && (
                          <>
                            <span>•</span>
                            <span>{item.category.name}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div
                        className={`font-semibold ${
                          item.stockStatus === "LOW_STOCK" ||
                          item.stockStatus === "OUT_OF_STOCK"
                            ? "text-stamp"
                            : "text-ink"
                        }`}
                      >
                        {item.stockDisplay}
                      </div>
                      <div className="text-[11px] text-ink/40">
                        {item.batchCount} batch{item.batchCount === 1 ? "" : "es"}
                        {item.expiredStock > 0 ? ` · ${item.expiredStock} expired` : ""}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-ink/80">
                        {item.averageDailySales > 0
                          ? `${item.averageDailySales.toFixed(1)}/day`
                          : "—"}
                      </div>
                      <div className="text-[11px] text-ink/40">
                        {item.daysOfCover !== null && item.daysOfCover !== undefined
                          ? `${item.daysOfCover.toFixed(1)} days cover`
                          : "no sales data"}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {item.nearestExpiry ? (
                        <>
                          <div className="font-medium text-ink/80">
                            {formatDate(item.nearestExpiry)}
                          </div>
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 text-[10.5px] font-semibold ${
                                expiryStatusBadge[item.nearestExpiryStatus] ||
                                "border border-line bg-paper-dim text-ink/60"
                              }`}
                            >
                              {expiryStatusLabel[item.nearestExpiryStatus]}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-ink/40">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold text-ink">
                      {formatINR(item.inventoryValue)}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11.5px] font-semibold ${
                          stockStatusBadge[item.stockStatus] ||
                          "border border-line bg-paper-dim text-ink/60"
                        }`}
                      >
                        {stockStatusLabel[item.stockStatus]}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11.5px] font-semibold ${
                          movementStatusBadge[item.movementStatus] ||
                          "border border-line bg-paper-dim text-ink/60"
                        }`}
                      >
                        {movementStatusLabel[item.movementStatus]}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right text-ink/40">
                      <ArrowRight size={15} className="ml-auto" />
                    </td>
                  </tr>
                ))}

              {state === "ready" && list && list.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-12 py-12 text-center text-ink/40">
                    <Package size={32} className="mx-auto mb-3 opacity-40" />
                    <div className="text-[14px]">
                      No medicines found matching your current filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {list && list.total > 0 && (
          <div className="flex items-center justify-between border-t border-line bg-paper-dim px-4 py-2.5 text-[12.5px] text-ink/55">
            <span>
              {list.items.length > 0
                ? `${(list.page - 1) * list.pageSize + 1}–${
                    (list.page - 1) * list.pageSize + list.items.length
                  } of ${list.total}`
                : `${list.total} total`}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={list.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 font-medium text-ink/70 transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span className="font-mono">
                {list.page} / {totalPages}
              </span>
              <button
                disabled={list.page >= totalPages}
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
