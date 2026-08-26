"use client";

import React from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";

interface PermissionGateProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  role?: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "PHARMACIST" | "STAFF";
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLockIcon?: boolean;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  role,
  children,
  fallback = null,
  showLockIcon = false,
}: PermissionGateProps) {
  const { can, role: userRole } = usePermissions();

  const hasAccess = React.useMemo(() => {
    if (role && !can.role(role)) return false;
    if (permission && !can.permission(permission)) return false;
    if (permissions && permissions.length > 0) {
      return requireAll ? can.allPermissions(permissions) : can.anyPermission(permissions);
    }
    return true;
  }, [can, permission, permissions, requireAll, role]);

  if (!hasAccess) {
    if (fallback !== undefined) return <>{fallback}</>;

    return (
      <div className="flex items-center justify-center gap-3 p-6 text-center">
        {showLockIcon && <Lock size={24} className="text-ink/30" />}
        <div className="text-sm text-ink/50">
          <p className="font-medium">Access restricted</p>
          <p className="mt-1">
            You need {permission
              ? permission
              : permissions
              ? permissions.join(", ")
              : role
              ? `${role} role`
              : "sufficient permissions"} to view this content.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  role?: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "PHARMACIST" | "STAFF";
  disabled?: boolean;
  children: React.ReactNode;
}

export function PermissionButton({
  permission,
  permissions,
  requireAll = false,
  role,
  disabled = false,
  children,
  ...props
}: PermissionButtonProps) {
  const { can } = usePermissions();

  const hasAccess = React.useMemo(() => {
    if (role && !can.role(role)) return false;
    if (permission && !can.permission(permission)) return false;
    if (permissions && permissions.length > 0) {
      return requireAll ? can.allPermissions(permissions) : can.anyPermission(permissions);
    }
    return true;
  }, [can, permission, permissions, requireAll, role]);

  const isDisabled = disabled || !hasAccess;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`${props.className || ""} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
      title={!hasAccess ? "Insufficient permissions" : undefined}
    >
      {children}
    </button>
  );
}

interface PermissionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  role?: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "PHARMACIST" | "STAFF";
  children: React.ReactNode;
}

export function PermissionLink({
  permission,
  permissions,
  requireAll = false,
  role,
  children,
  ...props
}: PermissionLinkProps) {
  const { can } = usePermissions();

  const hasAccess = React.useMemo(() => {
    if (role && !can.role(role)) return false;
    if (permission && !can.permission(permission)) return false;
    if (permissions && permissions.length > 0) {
      return requireAll ? can.allPermissions(permissions) : can.anyPermission(permissions);
    }
    return true;
  }, [can, permission, permissions, requireAll, role]);

  if (!hasAccess) {
    return (
      <span
        {...props}
        className={`${props.className || ""} pointer-events-none opacity-50 cursor-not-allowed`}
        title="Insufficient permissions"
      >
        {children}
        <ShieldAlert size={12} className="ml-1 inline-block align-middle text-ink/30" />
      </span>
    );
  }

  return <a {...props}>{children}</a>;
}

export function PermissionWrapper({
  permission,
  permissions,
  requireAll = false,
  role,
  children,
  fallback = null,
}: PermissionGateProps) {
  return <PermissionGate permission={permission} permissions={permissions} requireAll={requireAll} role={role} fallback={fallback}>{children}</PermissionGate>;
}