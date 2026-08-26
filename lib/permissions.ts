import type { TeamRole } from "@/lib/api";

export const Permissions = {
  INVENTORY_READ: "inventory.read",
  INVENTORY_CREATE: "inventory.create",
  INVENTORY_UPDATE: "inventory.update",
  INVENTORY_ADJUST: "inventory.adjust",
  PURCHASE_READ: "purchase.read",
  PURCHASE_CREATE: "purchase.create",
  PURCHASE_APPROVE: "purchase.approve",
  PURCHASE_RECEIVE: "purchase.receive",
  PURCHASE_RETURN: "purchase.return",
  PRODUCT_READ: "product.read",
  PRODUCT_CREATE: "product.create",
  PRODUCT_UPDATE: "product.update",
  CUSTOMER_READ: "customer.read",
  CUSTOMER_CREATE: "customer.create",
  PRESCRIPTION_READ: "prescription.read",
  PRESCRIPTION_CREATE: "prescription.create",
  QUALITY_CONTROL_READ: "quality-control.read",
  QUALITY_CONTROL_MANAGE: "quality-control.manage",
  REPORTS_READ: "reports.read",
  FINANCE_READ: "finance.read",
  FINANCE_WRITE: "finance.write",
  USERS_MANAGE: "users.manage",
  SETTINGS_MANAGE: "settings.manage",
  ALERTS_MANAGE: "alerts.manage",
  SUPPLIER_READ: "supplier.read",
  SUPPLIER_CREATE: "supplier.create",
  SUPPLIER_UPDATE: "supplier.update",
  SALE_CREATE: "sale.create",
  SALE_READ: "sale.read",
  SALE_RETURN: "sale.return",
  DASHBOARD_READ: "dashboard.read",
  AUDIT_READ: "audit.read",
  SUBSCRIPTION_READ: "subscription.read",
  SUBSCRIPTION_MANAGE: "subscription.manage",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const rolePermissions: Record<TeamRole, Permission[]> = {
  SUPER_ADMIN: Object.values(Permissions),
  OWNER: Object.values(Permissions),
  MANAGER: [
    Permissions.INVENTORY_READ,
    Permissions.INVENTORY_CREATE,
    Permissions.INVENTORY_UPDATE,
    Permissions.INVENTORY_ADJUST,
    Permissions.PURCHASE_READ,
    Permissions.PURCHASE_CREATE,
    Permissions.PURCHASE_APPROVE,
    Permissions.PURCHASE_RECEIVE,
    Permissions.PURCHASE_RETURN,
    Permissions.PRODUCT_READ,
    Permissions.PRODUCT_CREATE,
    Permissions.PRODUCT_UPDATE,
    Permissions.CUSTOMER_READ,
    Permissions.CUSTOMER_CREATE,
    Permissions.PRESCRIPTION_READ,
    Permissions.PRESCRIPTION_CREATE,
    Permissions.QUALITY_CONTROL_READ,
    Permissions.QUALITY_CONTROL_MANAGE,
    Permissions.REPORTS_READ,
    Permissions.FINANCE_READ,
    Permissions.ALERTS_MANAGE,
    Permissions.SUPPLIER_READ,
    Permissions.SUPPLIER_CREATE,
    Permissions.SUPPLIER_UPDATE,
    Permissions.SALE_CREATE,
    Permissions.SALE_READ,
    Permissions.SALE_RETURN,
    Permissions.DASHBOARD_READ,
  ],
  PHARMACIST: [
    Permissions.INVENTORY_READ,
    Permissions.PRODUCT_READ,
    Permissions.CUSTOMER_READ,
    Permissions.CUSTOMER_CREATE,
    Permissions.PRESCRIPTION_READ,
    Permissions.PRESCRIPTION_CREATE,
    Permissions.QUALITY_CONTROL_READ,
    Permissions.SALE_CREATE,
    Permissions.SALE_READ,
    Permissions.SALE_RETURN,
    Permissions.DASHBOARD_READ,
  ],
  STAFF: [
    Permissions.INVENTORY_READ,
    Permissions.PRODUCT_READ,
    Permissions.CUSTOMER_READ,
    Permissions.SALE_CREATE,
    Permissions.SALE_READ,
    Permissions.SALE_RETURN,
    Permissions.DASHBOARD_READ,
  ],
};

export function permissionsForRole(role: TeamRole): Permission[] {
  return rolePermissions[role] ?? [];
}

export function hasPermission(role: TeamRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const perms = permissionsForRole(role);
  return perms.includes(permission);
}

export function hasAnyPermission(role: TeamRole | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  const userPerms = permissionsForRole(role);
  return permissions.some(p => userPerms.includes(p));
}

export function hasAllPermissions(role: TeamRole | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  const userPerms = permissionsForRole(role);
  return permissions.every(p => userPerms.includes(p));
}

export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  SUPER_ADMIN: 5,
  OWNER: 4,
  MANAGER: 3,
  PHARMACIST: 2,
  STAFF: 1,
};

export function roleMeetsMinimum(userRole: TeamRole | null | undefined, minimumRole: TeamRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

export function isSuperAdmin(role: TeamRole | null | undefined): boolean {
  return role === "SUPER_ADMIN";
}

export function isOwnerOrAbove(role: TeamRole | null | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "OWNER";
}

export function isManagerOrAbove(role: TeamRole | null | undefined): boolean {
  return ["SUPER_ADMIN", "OWNER", "MANAGER"].includes(role ?? "");
}

export function isPharmacistOrAbove(role: TeamRole | null | undefined): boolean {
  return ["SUPER_ADMIN", "OWNER", "MANAGER", "PHARMACIST"].includes(role ?? "");
}

export const PAGE_PERMISSIONS: Record<string, Permission[]> = {
  "/settings": [Permissions.SETTINGS_MANAGE],
  "/admin/subscriptions": [Permissions.SUBSCRIPTION_MANAGE],
  "/users": [Permissions.USERS_MANAGE],
  "/inventory": [Permissions.INVENTORY_READ],
  "/inventory/new": [Permissions.PRODUCT_CREATE],
  "/inventory/[medicineId]": [Permissions.INVENTORY_READ],
  "/inventory/low-stock": [Permissions.INVENTORY_READ],
  "/inventory/expiry": [Permissions.INVENTORY_READ],
  "/inventory/dead-stock": [Permissions.INVENTORY_READ],
  "/inventory/movements": [Permissions.INVENTORY_READ],
  "/purchase/order": [Permissions.PURCHASE_READ],
  "/purchase/order/new": [Permissions.PURCHASE_CREATE],
  "/purchase/returns": [Permissions.PURCHASE_RETURN],
  "/suppliers": [Permissions.SUPPLIER_READ],
  "/suppliers/[supplierId]": [Permissions.SUPPLIER_READ],
  "/sales": [Permissions.SALE_READ],
  "/sales/returns": [Permissions.SALE_RETURN],
  "/customers": [Permissions.CUSTOMER_READ],
  "/customers/[customerId]": [Permissions.CUSTOMER_READ],
  "/prescriptions": [Permissions.PRESCRIPTION_READ],
  "/billing": [Permissions.SALE_CREATE],
  "/dashboard/purchase-dashboard": [Permissions.PURCHASE_READ],
  "/dashboard/sales-dashboard": [Permissions.SALE_READ],
  "/dashboard/finance-dashboard": [Permissions.FINANCE_READ],
  "/finance": [Permissions.FINANCE_READ],
  "/finance/journal": [Permissions.FINANCE_WRITE],
  "/finance/ledger": [Permissions.FINANCE_READ],
  "/finance/accounts": [Permissions.FINANCE_READ],
  "/finance/profit-loss": [Permissions.FINANCE_READ],
  "/reports": [Permissions.REPORTS_READ],
  "/quality-control": [Permissions.QUALITY_CONTROL_READ],
  "/alerts": [Permissions.ALERTS_MANAGE],
  "/sync": [],
  "/subscription": [Permissions.SUBSCRIPTION_READ],
};

export function getRequiredPermissionsForPath(pathname: string): Permission[] {
  for (const [pattern, permissions] of Object.entries(PAGE_PERMISSIONS)) {
    const regex = new RegExp("^" + pattern.replace(/\[[^\]]+\]/g, "[^/]+") + "(/.*)?$");
    if (regex.test(pathname)) {
      return permissions;
    }
  }
  return [];
}