"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Clock,
  Layers,
  Package,
  PackagePlus,
} from "lucide-react";
import {
  inventoryApi,
  type InventorySummary,
  type StockStatus,
} from "@/lib/api";
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
import { usePermissions } from "@/lib/hooks/usePermissions";
import { usePaginatedList } from "@/lib/hooks/usePaginatedList";
import {
  PageHeader,
  StatCard,
  StatGrid,
  FilterBar,
  SearchInput,
  FilterSelect,
  PrimaryButton,
  ErrorState,
  TableShell,
  Th,
  Td,
  TableRow,
  LoadingRow,
  EmptyRow,
  Pagination,
  StatusBadge,
} from "@/components/common";

export default function MedicineInventory() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can.isManagerOrAbove();

  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatus | "ALL">("ALL");

  const {
    data: list,
    state,
    error,
    page,
    setPage,
    refresh,
    retry,
    tick,
  } = usePaginatedList({
    fetcher: (p) =>
      inventoryApi.list({
        search: searchTerm || undefined,
        stockStatus: stockStatus === "ALL" ? undefined : stockStatus,
        page: p,
        pageSize: 20,
      }),
    deps: [searchTerm, stockStatus],
  });

  // Summary refetches alongside the list (same tick).
  useEffect(() => {
    let ignore = false;
    inventoryApi
      .summary()
      .then(data => {
        if (!ignore) setSummary(data);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [tick]);

  const runSearch = () => {
    // Search text already triggers refetch via deps — only force one here.
    if (page === 1) refresh();
    else setPage(1);
  };

  const totalPages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1;
  const rangeLabel = list
    ? list.items.length > 0
      ? `${(list.page - 1) * list.pageSize + 1}–${(list.page - 1) * list.pageSize + list.items.length} of ${list.total}`
      : `${list.total} total`
    : undefined;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        eyebrow="Warehouse Ledger"
        title="Medicine Central Inventory"
        description="Live stock, batch-wise expiry and movement intelligence across your branches — powered by FEFO-safe ledger data."
        actions={
          canCreate ? (
            <PrimaryButton onClick={() => router.push("/inventory/new")}>
              <PackagePlus size={15} /> Add Medicine
            </PrimaryButton>
          ) : undefined
        }
      />

      <StatGrid>
        <StatCard
          icon={<Layers size={20} />}
          label="Stock Value (Cost)"
          value={summary ? formatINRCompact(summary.inventoryValue) : "—"}
          sub={summary ? `${summary.totalMedicines} SKUs tracked` : ""}
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          accent="stamp"
          label="At / Below Reorder"
          value={summary ? `${summary.lowStock.products} SKUs` : "—"}
          sub={summary ? `threshold ${summary.lowStockThreshold} units` : ""}
        />
        <StatCard
          icon={<Clock size={20} />}
          accent="danger"
          label="Expiry Risk"
          value={summary ? `${summary.expiringSoon.products} SKUs` : "—"}
          sub={summary ? `${summary.expired.products} already expired` : ""}
        />
        <StatCard
          icon={<CalendarClock size={20} />}
          label="Dead Stock"
          value={summary ? `${summary.deadStock} SKUs` : "—"}
          sub={summary ? `${summary.outOfStock} out of stock` : ""}
        />
      </StatGrid>

      <FilterBar>
        <SearchInput
          placeholder="Search by brand, generic name or manufacturer..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onEnter={runSearch}
        />
        <FilterSelect
          value={stockStatus}
          onChange={e => {
            setStockStatus(e.target.value as StockStatus | "ALL");
            setPage(1);
          }}
        >
          <option value="ALL">All Stock Levels</option>
          <option value="HEALTHY">Healthy</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="OVERSTOCKED">Overstocked</option>
        </FilterSelect>
        <PrimaryButton onClick={runSearch}>Apply Filters</PrimaryButton>
      </FilterBar>

      {state === "error" && (
        <ErrorState
          title="Could not load inventory."
          description={error}
          onRetry={retry}
        />
      )}

      <TableShell
        footer={
          list && list.total > 0 ? (
            <Pagination
              page={list.page}
              totalPages={totalPages}
              onChange={setPage}
              label={rangeLabel}
            />
          ) : undefined
        }
      >
        <thead>
          <tr className="border-b border-line">
            <Th>Medicine</Th>
            <Th>On Hand</Th>
            <Th>Velocity</Th>
            <Th>Nearest Expiry</Th>
            <Th align="right">Value</Th>
            <Th align="center">Stock</Th>
            <Th align="center">Movement</Th>
            <Th align="right">Detail</Th>
          </tr>
        </thead>
        <tbody>
          {state === "loading" && !list && (
            <LoadingRow colSpan={8} message="Loading inventory ledger…" />
          )}

          {state === "ready" &&
            list?.items.map(item => (
              <TableRow
                key={item.productId}
                onClick={() => router.push(`/inventory/${item.productId}`)}
              >
                <Td>
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
                </Td>

                <Td>
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
                </Td>

                <Td>
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
                </Td>

                <Td>
                  {item.nearestExpiry ? (
                    <>
                      <div className="font-medium text-ink/80">
                        {formatDate(item.nearestExpiry)}
                      </div>
                      <div>
                        <StatusBadge
                          className={`px-2 py-0.5 text-[10.5px] ${expiryStatusBadge[item.nearestExpiryStatus] || ""}`}
                        >
                          {expiryStatusLabel[item.nearestExpiryStatus]}
                        </StatusBadge>
                      </div>
                    </>
                  ) : (
                    <span className="text-ink/40">—</span>
                  )}
                </Td>

                <Td align="right" className="font-mono font-bold text-ink">
                  {formatINR(item.inventoryValue)}
                </Td>

                <Td align="center">
                  <StatusBadge className={stockStatusBadge[item.stockStatus] || ""}>
                    {stockStatusLabel[item.stockStatus]}
                  </StatusBadge>
                </Td>

                <Td align="center">
                  <StatusBadge className={movementStatusBadge[item.movementStatus] || ""}>
                    {movementStatusLabel[item.movementStatus]}
                  </StatusBadge>
                </Td>

                <Td align="right" className="text-ink/40">
                  <ArrowRight size={15} className="ml-auto" />
                </Td>
              </TableRow>
            ))}

          {state === "ready" && list && list.items.length === 0 && (
            <EmptyRow
              colSpan={8}
              icon={<Package size={32} />}
              message="No medicines found matching your current filters."
            />
          )}
        </tbody>
      </TableShell>
    </div>
  );
}
