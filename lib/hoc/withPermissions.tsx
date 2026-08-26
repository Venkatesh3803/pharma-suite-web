"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldAlert, Home } from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";
import { getRequiredPermissionsForPath } from "@/lib/permissions";

interface WithPermissionsOptions {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  role?: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "PHARMACIST" | "STAFF";
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function withPermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithPermissionsOptions = {},
) {
  const {
    permission,
    permissions,
    requireAll = false,
    role,
    redirectTo = "/dashboard/purchase-dashboard",
    fallback = null,
  } = options;

  function WithPermissionsWrapper(props: P) {
    const router = useRouter();
    const { can, role: userRole } = usePermissions();
    const pathname = typeof window !== "undefined" ? window.location.pathname : "/";

    const requiredForPath = React.useMemo(
      () => getRequiredPermissionsForPath(pathname),
      [pathname],
    );

    const hasAccess = React.useMemo(() => {
      if (role && !can.role(role)) return false;
      if (permission && !can.permission(permission)) return false;
      if (permissions && permissions.length > 0) {
        return requireAll ? can.allPermissions(permissions) : can.anyPermission(permissions);
      }
      if (requiredForPath.length > 0) {
        return can.anyPermission(requiredForPath);
      }
      return true;
    }, [can, permission, permissions, requireAll, role, requiredForPath]);

    React.useEffect(() => {
      if (!hasAccess) {
        router.push(redirectTo);
      }
    }, [hasAccess, router, redirectTo]);

    if (!hasAccess) {
      if (fallback !== null) {
        return React.createElement(React.Fragment, null, fallback);
      }

      return (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center border border-stamp/40 bg-stamp-dim text-stamp">
            <Lock size={28} />
          </div>
          <div className="max-w-md">
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
              Access Denied
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
              You don&apos;t have permission to access this page.
              {permission && <span className="ml-1 font-mono text-stamp"> ({permission})</span>}
              {role && <span className="ml-1 font-mono text-stamp"> (requires {role})</span>}
            </p>
          </div>
          <Link
            href={redirectTo}
            className="flex items-center gap-2 rounded-none bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
          >
            <Home size={16} />
            Go to Dashboard
          </Link>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  }

  WithPermissionsWrapper.displayName = `withPermissions(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return WithPermissionsWrapper;
}

export function createPermissionGuard(
  getRequiredPermissions: (pathname: string) => Permission[],
) {
  return function <P extends object>(WrappedComponent: React.ComponentType<P>) {
    return withPermissions(WrappedComponent, {
      permissions: [],
      fallback: (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center border border-stamp/40 bg-stamp-dim text-stamp">
            <Lock size={28} />
          </div>
          <div className="max-w-md">
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
              Access Denied
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
              You don&apos;t have permission to access this page.
            </p>
          </div>
          <Link
            href="/dashboard/purchase-dashboard"
            className="flex items-center gap-2 rounded-none bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
          >
            <Home size={16} />
            Go to Dashboard
          </Link>
        </div>
      ),
    });
  };
}

export function requirePermissions(...requiredPermissions: Permission[]) {
  return function <P extends object>(WrappedComponent: React.ComponentType<P>) {
    return withPermissions(WrappedComponent, {
      permissions: requiredPermissions,
      requireAll: true,
    });
  };
}

export function requireRole(role: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "PHARMACIST" | "STAFF") {
  return function <P extends object>(WrappedComponent: React.ComponentType<P>) {
    return withPermissions(WrappedComponent, { role });
  };
}

export function requireAnyPermission(...permissions: Permission[]) {
  return function <P extends object>(WrappedComponent: React.ComponentType<P>) {
    return withPermissions(WrappedComponent, {
      permissions,
      requireAll: false,
    });
  };
}