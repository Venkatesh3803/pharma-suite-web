import type {
  ExpiryStatus,
  MovementStatus,
  MovementType,
  RiskLevel,
  StockStatus,
} from "@/lib/api";

export function formatINR(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "₹0.00";
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

export function formatINRCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "₹0";
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return formatINR(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const stockStatusBadge: Record<StockStatus, string> = {
  HEALTHY: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  LOW_STOCK: "border border-stamp/30 bg-stamp-dim text-stamp",
  OUT_OF_STOCK: "border border-danger/25 bg-danger-bg text-danger",
  OVERSTOCKED: "border border-ink/25 bg-ink/5 text-ink/70",
};

export const stockStatusLabel: Record<StockStatus, string> = {
  HEALTHY: "Healthy",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
  OVERSTOCKED: "Overstocked",
};

export const movementStatusBadge: Record<MovementStatus, string> = {
  FAST_MOVING: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  NORMAL: "border border-ink/25 bg-ink/5 text-ink/70",
  SLOW_MOVING: "border border-stamp/30 bg-stamp-dim text-stamp",
  DEAD_STOCK: "border border-danger/25 bg-danger-bg text-danger",
  INSUFFICIENT_DATA: "border border-line bg-paper-dim text-ink/50",
};

export const movementStatusLabel: Record<MovementStatus, string> = {
  FAST_MOVING: "Fast Moving",
  NORMAL: "Normal",
  SLOW_MOVING: "Slow Moving",
  DEAD_STOCK: "Dead Stock",
  INSUFFICIENT_DATA: "Insufficient Data",
};

export const expiryStatusBadge: Record<ExpiryStatus, string> = {
  HEALTHY: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  EXPIRING_90_DAYS: "border border-stamp/30 bg-stamp-dim text-stamp",
  EXPIRING_60_DAYS: "border border-stamp/40 bg-stamp-dim text-stamp",
  EXPIRING_30_DAYS: "border border-danger/30 bg-danger-bg text-danger",
  EXPIRED: "border border-danger/40 bg-danger text-paper",
};

export const expiryStatusLabel: Record<ExpiryStatus, string> = {
  HEALTHY: "Healthy",
  EXPIRING_90_DAYS: "Expires < 90d",
  EXPIRING_60_DAYS: "Expires < 60d",
  EXPIRING_30_DAYS: "Expires < 30d",
  EXPIRED: "Expired",
};

export const riskBadge: Record<RiskLevel, string> = {
  CRITICAL: "border border-danger/40 bg-danger text-paper",
  HIGH: "border border-danger/30 bg-danger-bg text-danger",
  MEDIUM: "border border-stamp/30 bg-stamp-dim text-stamp",
  LOW: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
};

export const riskLabel: Record<RiskLevel, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const movementTypeLabel: Record<MovementType, string> = {
  PURCHASE: "Purchase",
  SALE: "Sale",
  SALE_RETURN: "Sale Return",
  PURCHASE_RETURN: "Purchase Return",
  ADJUSTMENT: "Adjustment",
  TRANSFER_IN: "Transfer In",
  TRANSFER_OUT: "Transfer Out",
  OPENING_STOCK: "Opening Stock",
  EXPIRED: "Expired",
  DAMAGED: "Damaged",
};

export const movementTypeBadge: Record<MovementType, string> = {
  PURCHASE: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  SALE: "border border-ink/25 bg-ink/5 text-ink/70",
  SALE_RETURN: "border border-stamp/30 bg-stamp-dim text-stamp",
  PURCHASE_RETURN: "border border-stamp/30 bg-stamp-dim text-stamp",
  ADJUSTMENT: "border border-ink/25 bg-ink/5 text-ink/70",
  TRANSFER_IN: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  TRANSFER_OUT: "border border-stamp/30 bg-stamp-dim text-stamp",
  OPENING_STOCK: "border border-line bg-paper-dim text-ink/50",
  EXPIRED: "border border-danger/25 bg-danger-bg text-danger",
  DAMAGED: "border border-danger/25 bg-danger-bg text-danger",
};
