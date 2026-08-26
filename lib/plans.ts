import type { SubscriptionTier } from "@/lib/api";

export type FeatureKey =
  | "alerts"
  | "pos-billing"
  | "inventory"
  | "batch-tracking"
  | "expiry-alerts"
  | "procurement"
  | "suppliers"
  | "customers"
  | "finance-reports"
  | "finance"
  | "barcode-pos"
  | "schedule-h"
  | "dynamic-reorder"
  | "dead-stock"
  | "quality-control"
  | "temperature-logs"
  | "offline-sync"
  | "multi-branch-transfers"
  | "weighing-scale"
  | "advanced-analytics"
  | "api-access"
  | "audit-logs";

export const TIER_RANK: Record<SubscriptionTier, number> = {
  TRIAL_14_DAYS: 1,
  BASIC: 2,
  STANDARD: 3,
  PREMIUM: 4,
};

export const TIER_NAMES: Record<SubscriptionTier, string> = {
  TRIAL_14_DAYS: "14-Day Trial",
  BASIC: "Basic",
  STANDARD: "Standard",
  PREMIUM: "Premium",
};

interface FeatureDef {
  key: FeatureKey;
  label: string;
  minTier: SubscriptionTier;
}

export const FEATURES: FeatureDef[] = [
  { key: "alerts", label: "Alerts & Notifications", minTier: "TRIAL_14_DAYS" },
  { key: "pos-billing", label: "POS Billing & GST Invoices", minTier: "TRIAL_14_DAYS" },
  { key: "inventory", label: "Inventory Ledger", minTier: "TRIAL_14_DAYS" },
  { key: "batch-tracking", label: "Batch Tracking", minTier: "TRIAL_14_DAYS" },
  { key: "expiry-alerts", label: "Expiry Alerts", minTier: "TRIAL_14_DAYS" },
  { key: "procurement", label: "Purchase Orders & GRN", minTier: "TRIAL_14_DAYS" },
  { key: "suppliers", label: "Supplier Ledger", minTier: "TRIAL_14_DAYS" },
  { key: "customers", label: "Customer Ledger", minTier: "TRIAL_14_DAYS" },
  { key: "finance-reports", label: "Finance & Sales Reports", minTier: "TRIAL_14_DAYS" },
  { key: "finance", label: "Finance & Accounting", minTier: "TRIAL_14_DAYS" },
  { key: "barcode-pos", label: "Barcode POS Scanning", minTier: "TRIAL_14_DAYS" },
  { key: "schedule-h", label: "Schedule H/H1 Registers", minTier: "STANDARD" },
  { key: "dynamic-reorder", label: "Dynamic Reorders", minTier: "STANDARD" },
  { key: "dead-stock", label: "Dead-Stock Analysis", minTier: "STANDARD" },
  { key: "quality-control", label: "Quality Control", minTier: "STANDARD" },
  { key: "temperature-logs", label: "Temperature Logs", minTier: "STANDARD" },
  { key: "offline-sync", label: "POS Offline Auto-Sync", minTier: "STANDARD" },
  { key: "multi-branch-transfers", label: "Multi-Branch Stock Transfers", minTier: "PREMIUM" },
  { key: "weighing-scale", label: "Weighing Scale Integration", minTier: "PREMIUM" },
  { key: "advanced-analytics", label: "Advanced Analytics", minTier: "PREMIUM" },
  { key: "api-access", label: "REST API Access", minTier: "PREMIUM" },
  { key: "audit-logs", label: "Audit Logs", minTier: "PREMIUM" },
];

export const FEATURE_MIN_TIER = Object.fromEntries(
  FEATURES.map(f => [f.key, f.minTier]),
) as Record<FeatureKey, SubscriptionTier>;

export const MODULE_LABELS = Object.fromEntries(
  FEATURES.map(f => [f.key, f.label]),
) as Record<FeatureKey, string>;

export function tierProvides(
  tier: SubscriptionTier | null | undefined,
  feature: FeatureKey,
): boolean {
  if (!tier) return true;
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}

export function minTierFor(feature: FeatureKey): SubscriptionTier {
  return FEATURE_MIN_TIER[feature];
}

export const MODULES_BY_TIER: Record<SubscriptionTier, Record<string, boolean>> = (
  Object.keys(TIER_RANK) as SubscriptionTier[]
).reduce(
  (acc, tier) => {
    acc[tier] = Object.fromEntries(
      FEATURES.map(f => [f.key, tierProvides(tier, f.key)]),
    );
    return acc;
  },
  {} as Record<SubscriptionTier, Record<string, boolean>>,
);

const ROUTE_FEATURES: { prefix: string; feature: FeatureKey }[] = [
  { prefix: "/alerts", feature: "alerts" },
  { prefix: "/billing", feature: "pos-billing" },
  { prefix: "/sales", feature: "pos-billing" },
  { prefix: "/inventory/expiry", feature: "expiry-alerts" },
  { prefix: "/inventory/low-stock", feature: "expiry-alerts" },
  { prefix: "/inventory/dead-stock", feature: "dead-stock" },
  { prefix: "/inventory", feature: "inventory" },
  { prefix: "/purchase", feature: "procurement" },
  { prefix: "/suppliers", feature: "suppliers" },
  { prefix: "/customers", feature: "customers" },
  { prefix: "/reports", feature: "finance-reports" },
  { prefix: "/sync", feature: "offline-sync" },
  { prefix: "/prescriptions", feature: "schedule-h" },
  { prefix: "/quality-control", feature: "quality-control" },
  { prefix: "/finance", feature: "finance" },
  { prefix: "/dashboard/finance-dashboard", feature: "finance" },
];

export function routeFeature(pathname: string): FeatureKey | null {
  for (const r of ROUTE_FEATURES) {
    if (pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)) {
      return r.feature;
    }
  }
  return null;
}