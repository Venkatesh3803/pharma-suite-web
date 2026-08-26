"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  Permissions,
  type Permission,
  permissionsForRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  roleMeetsMinimum,
  isSuperAdmin,
  isOwnerOrAbove,
  isManagerOrAbove,
  isPharmacistOrAbove,
  getRequiredPermissionsForPath,
} from "@/lib/permissions";
import type { TeamRole } from "@/lib/api";

export { type Permission, Permissions } from "@/lib/permissions";

export function usePermissions() {
  const user = useAppSelector((state) => state.auth.user);

  const role = useMemo(() => user?.role ?? null, [user?.role]);
  const permissions = useMemo(() => permissionsForRole(role as TeamRole), [role]);

  const can = useMemo(
    () => ({
      permission: (permission: Permission) => hasPermission(role, permission),
      anyPermission: (perms: Permission[]) => hasAnyPermission(role, perms),
      allPermissions: (perms: Permission[]) => hasAllPermissions(role, perms),
      role: (minimumRole: TeamRole) => roleMeetsMinimum(role, minimumRole),
      isSuperAdmin: () => isSuperAdmin(role),
      isOwnerOrAbove: () => isOwnerOrAbove(role),
      isManagerOrAbove: () => isManagerOrAbove(role),
      isPharmacistOrAbove: () => isPharmacistOrAbove(role),
    }),
    [role],
  );

  const canAccessPath = useMemo(
    () => (pathname: string) => {
      const required = getRequiredPermissionsForPath(pathname);
      if (required.length === 0) return true;
      return hasAnyPermission(role, required);
    },
    [role],
  );

  const currentPathPermissions = useMemo(
    () => getRequiredPermissionsForPath(typeof window !== "undefined" ? window.location.pathname : "/"),
    [],
  );

  const hasCurrentPathAccess = useMemo(
    () => hasAnyPermission(role, currentPathPermissions),
    [role, currentPathPermissions],
  );

  return {
    user,
    role,
    permissions,
    can,
    canAccessPath,
    currentPathPermissions,
    hasCurrentPathAccess,
    Permission: Permissions,
  };
}

export function usePermission(permission: Permission): boolean {
  const { can } = usePermissions();
  return can.permission(permission);
}

export function useRole(): TeamRole | null {
  const user = useAppSelector((state) => state.auth.user);
  return user?.role ?? null;
}

export function useUserRole(): TeamRole | null {
  return useRole();
}