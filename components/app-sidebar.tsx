"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  Receipt,
  ChevronRight,
  ChevronDown,
  LogOut,
  ShoppingBag,
  Settings,
  BadgeDollarSign,
  BadgeCheck,
  ShieldCheck,
  Lock,
  Compass,
  Landmark,
  Bell,
  Cloud,
  type LucideIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { logout } from "@/lib/redux/slices/authSlice";
import { clearWorkspace } from "@/lib/redux/slices/workspaceSlice";
import { clearTeam } from "@/lib/redux/slices/teamSlice";
import { clearAccessToken, clearOnboardedCookie, alertsApi } from "@/lib/api";
import { fetchSubscription } from "@/lib/redux/slices/subscriptionSlice";
import AppTour, { START_TOUR_EVENT } from "@/components/app-tour";
import {
  MODULE_LABELS,
  TIER_NAMES,
  minTierFor,
  routeFeature,
  tierProvides,
  type FeatureKey,
} from "@/lib/plans";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Permissions } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";

interface NavSubItem {
  title: string;
  url: string;
  feature?: FeatureKey;
  permission?: Permission;
}

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  hasDropdown?: boolean;
  prefix?: string | string[];
  subItems?: NavSubItem[];
  feature?: FeatureKey;
  permission?: Permission;
  superAdminOnly?: boolean;
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "#",
    icon: LayoutDashboard,
    hasDropdown: true,
    prefix: "/dashboard",
    subItems: [
      { title: "Purchase Dashboard", url: "/dashboard/purchase-dashboard" },
      { title: "Sales Dashboard", url: "/dashboard/sales-dashboard" },
      { title: "Finance Dashboard", url: "/dashboard/finance-dashboard", feature: "finance" },
    ],
  },
  { title: "Quick Billing", url: "/billing", icon: Receipt, feature: "pos-billing" },
  { title: "Alerts", url: "/alerts", icon: Bell, feature: "alerts", permission: Permissions.ALERTS_MANAGE },
  { title: "Offline Sync", url: "/sync", icon: Cloud, feature: "offline-sync" },
  {
    title: "Sales",
    url: "#",
    icon: BadgeDollarSign,
    hasDropdown: true,
    prefix: ["/sales", "/customers"],
    subItems: [
      { title: "Sales Ledger", url: "/sales", feature: "pos-billing" },
      { title: "Sale Returns", url: "/sales/returns", feature: "pos-billing" },
      { title: "Customers", url: "/customers", feature: "customers" },
      {
        title: "Prescriptions · Schedule H",
        url: "/prescriptions",
        feature: "schedule-h",
        permission: Permissions.PRESCRIPTION_READ,
      },
    ],
  },
  {
    title: "Medicine Inventory",
    url: "#",
    icon: Pill,
    hasDropdown: true,
    prefix: "/inventory",
    subItems: [
      { title: "Inventory Ledger", url: "/inventory", feature: "inventory" },
      { title: "Expiry Risk", url: "/inventory/expiry", feature: "expiry-alerts" },
      { title: "Low Stock", url: "/inventory/low-stock", feature: "expiry-alerts" },
      { title: "Dead Stock", url: "/inventory/dead-stock", feature: "dead-stock" },
      {
        title: "Quality Control",
        url: "/quality-control",
        feature: "quality-control",
        permission: Permissions.QUALITY_CONTROL_READ,
      },
      { title: "Stock Movements", url: "/inventory/movements", feature: "inventory" },
    ],
  },
  {
    title: "Purchase",
    url: "#",
    icon: ShoppingBag,
    hasDropdown: true,
    prefix: ["/purchase", "/suppliers"],
    subItems: [
      { title: "Purchase Orders", url: "/purchase/order", feature: "procurement" },
      { title: "Purchase Returns", url: "/purchase/returns", feature: "procurement" },
      { title: "Suppliers", url: "/suppliers", feature: "suppliers" },
    ],
  },
  {
    title: "Finance",
    url: "#",
    icon: Landmark,
    hasDropdown: true,
    prefix: "/finance",
    subItems: [
      { title: "Overview", url: "/finance/overview", feature: "finance" },
      { title: "Journal Entries", url: "/finance/journal", feature: "finance" },
      { title: "Ledger", url: "/finance/ledger", feature: "finance" },
      { title: "Accounts & Trial", url: "/finance/accounts", feature: "finance" },
      { title: "Profit & Loss", url: "/finance/profit-loss", feature: "finance" },
    ],
  },
  { title: "Subscription", url: "/subscription", icon: BadgeCheck },
  { title: "Settings", url: "/settings", icon: Settings, permission: Permissions.SETTINGS_MANAGE },
  {
    title: "Admin · Billing",
    url: "/admin/subscriptions",
    icon: ShieldCheck,
    permission: Permissions.SUBSCRIPTION_MANAGE,
  },
];

export default function AppSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const workspaceName = useAppSelector(
    state => state.workspace.workspace?.name,
  );
  const snapshot = useAppSelector(state => state.subscription.snapshot);
  const [collapsed, setCollapsed] = useState(false);

  const tier = snapshot?.plan.tier;

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    dispatch(fetchSubscription());
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const res = await alertsApi.unreadCount();
        if (active) setUnreadCount(res.unread);
      } catch {
        // badge silently keeps its last value when the API is unreachable
      }
    };
    void refresh();
    const interval = setInterval(refresh, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pathname]);

  const displayName = user?.fullName || "PharmaSuite Operator";
  const displayEmail = user?.email || "operator@pharmasuite.core";
  const avatarInitials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("") || "PS";

  //Manage dropdown states
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    Dashboard: true,
    Sales: false,
    "Medicine Inventory": true,
    Purchase: false,
    Finance: false,
  });

  //👇 Sync dropdown states automatically with the active URL on route changes
  useEffect(() => {
    navigationItems.forEach(item => {
      if (item.hasDropdown && item.prefix) {
        const prefixes = Array.isArray(item.prefix) ? item.prefix : [item.prefix];
        if (prefixes.some(p => pathname.startsWith(p))) {
          setOpenDropdowns(prev => ({ ...prev, [item.title]: true }));
        }
      }
    });
  }, [pathname]);

  const toggleDropdown = (title: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleNavigate = (url: string) => {
    router.push(url);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(clearWorkspace());
    dispatch(clearTeam());
    clearAccessToken();
    clearOnboardedCookie();
    router.push("/sign-in");
    router.refresh();
  };

  const canManageSettings =
    user?.role === "SUPER_ADMIN" || user?.role === "OWNER";

  const canManageAlerts =
    user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "MANAGER";

  const { can } = usePermissions();

  const isItemLocked = (item: NavItem): boolean => {
    if (item.feature) return !tierProvides(tier, item.feature);
    if (item.permission && !can.permission(item.permission)) return true;
    if (item.hasDropdown && item.subItems) {
      return !item.subItems.some(
        sub => (!sub.feature || tierProvides(tier, sub.feature)) && (!sub.permission || can.permission(sub.permission!)),
      );
    }
    return false;
  };

  const visibleNavItems = navigationItems
    .filter(item => !isItemLocked(item))
    .filter(
      item =>
        !("superAdminOnly" in item && item.superAdminOnly) ||
        user?.role === "SUPER_ADMIN",
    )
    .filter(item => item.url !== "/settings" || canManageSettings);

  const currentFeature = routeFeature(pathname);
  const pageLocked = currentFeature
    ? !tierProvides(tier, currentFeature)
    : false;

  return (
    <div className="flex h-screen w-screen max-w-full font-body">
      {/* ── Sidebar ── */}
      <aside
        className={`relative flex flex-col overflow-hidden bg-teal-deep transition-[width,min-width] duration-200 ease-out ${
          collapsed ? "min-w-16 w-16" : "min-w-60 w-60"
        }`}
      >
        {/* dot grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1.4px)",
            backgroundSize: "22px 22px",
          }}
        />

        {/* Header */}
        <div
          className={`relative z-10 flex h-16 shrink-0 items-center gap-2.5 border-b border-line-dark px-3 ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <div className="flex h-9 w-9 min-w-9 items-center justify-center border border-stamp text-stamp">
            <Pill size={18} strokeWidth={2} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="whitespace-nowrap text-[14px] font-bold leading-tight text-paper">
                {workspaceName || "PharmaSuite"}
              </div>
              <div className="whitespace-nowrap text-[10.5px] font-medium uppercase tracking-[0.14em] text-paper/45 font-mono">
                {snapshot ? `${TIER_NAMES[snapshot.plan.tier]} Plan` : "Retail POS · Ledger"}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="no-scrollbar relative z-10 flex-1 overflow-y-auto px-2 pt-2">
          {!collapsed && (
            <div className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-paper/35 font-mono">
              Management
            </div>
          )}
          <ul className="flex flex-col gap-0.5 p-0 m-0 list-none">
{visibleNavItems.map(item => {
              const isActive =
                pathname === item.url ||
                (item.prefix
                  ? (Array.isArray(item.prefix) ? item.prefix : [item.prefix]).some(
                      p => pathname.startsWith(p),
                    )
                  : false) ||
                item.subItems?.some(sub => pathname === sub.url);
              const isDropdownOpen = !!openDropdowns[item.title];
              const itemLocked = item.feature
                ? !tierProvides(tier, item.feature)
                : item.permission
                ? !can.permission(item.permission)
                : false;

              return (
                <li key={item.title}>
                  <div
                    onClick={e => {
                      if (itemLocked) return;
                      if (item.hasDropdown) {
                        e.preventDefault();
                        if (collapsed) setCollapsed(false);
                        toggleDropdown(item.title);
                      } else {
                        handleNavigate(item.url);
                      }
                    }}
                    title={
                      collapsed
                        ? item.title
                        : itemLocked
                        ? item.permission
                          ? `Requires permission: ${item.permission}`
                          : `Requires ${TIER_NAMES[minTierFor(item.feature!)]} plan`
                        : undefined
                    }
                    className={`group flex h-10 items-center gap-2.5 rounded-none text-[13.5px] font-medium transition-colors duration-150 ${
                      collapsed
                        ? "justify-center px-0"
                        : "justify-start px-2.5"
                    } ${
                      itemLocked
                        ? "cursor-not-allowed text-paper/25"
                        : "cursor-pointer"
                    } ${
                      isActive && !item.hasDropdown
                        ? "bg-paper/10 text-stamp"
                        : "text-paper/55 hover:bg-paper/10 hover:text-paper"
                    }`}
                  >
                    <item.icon
                      size={18}
                      className={`shrink-0 ${
                        isActive && !item.hasDropdown
                          ? "text-stamp"
                          : "text-current"
                      }`}
                      strokeWidth={isActive ? 2.25 : 1.8}
                    />
                    {!collapsed && (
                      <span className="truncate overflow-hidden whitespace-nowrap">
                        {item.title}
                      </span>
                    )}

                    {!collapsed && item.title === "Alerts" && unreadCount > 0 && (
                      <span
                        title={`${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`}
                        className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold leading-none text-paper"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}

                    {itemLocked && !collapsed && (
                      <Lock
                        size={13}
                        className="ml-auto shrink-0 text-paper/30"
                      />
                    )}

                    {/* Dropdown Indicator Arrow */}
                    {item.hasDropdown && !collapsed && !itemLocked && (
                      <div className="ml-auto flex items-center text-paper/40">
                        {isDropdownOpen ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </div>
                    )}

                    {isActive && !item.hasDropdown && !collapsed && !itemLocked && (
                      <span className="ml-auto h-5 w-1 bg-stamp" />
                    )}
                  </div>

                  {/* Render Nested Submenu Items */}
                  {item.hasDropdown && isDropdownOpen && !collapsed && (
                    <ul className="m-0 ml-[18px] mb-2 mt-1 list-none border-l border-paper/20 p-0 flex flex-col gap-0.5">
                      {item.subItems
                        ?.filter(
                          subItem =>
                            (!subItem.feature || tierProvides(tier, subItem.feature)) &&
                            (!subItem.permission || can.permission(subItem.permission)),
                        )
                        .map(subItem => {
                        const isSubActive = pathname === subItem.url;
                        const subLocked =
                          !!subItem.feature && !tierProvides(tier, subItem.feature) ||
                          !!subItem.permission && !can.permission(subItem.permission);

                        if (subLocked) {
                          return (
                            <li key={subItem.title}>
                              <div
                                title={
                                  subItem.permission
                                    ? `Requires permission: ${subItem.permission}`
                                    : `Requires ${TIER_NAMES[minTierFor(subItem.feature!)]} plan`
                                }
                                className="flex cursor-not-allowed items-center gap-2 rounded-none px-2.5 py-1.5 text-[12.5px] font-medium text-paper/25"
                              >
                                <span className="truncate">{subItem.title}</span>
                                <Lock size={12} className="ml-auto shrink-0 text-paper/30" />
                              </div>
                            </li>
                          );
                        }

                        return (
                          <li key={subItem.title}>
                            <div
                              onClick={() => handleNavigate(subItem.url)}
                              className={`block cursor-pointer rounded-none px-2.5 py-1.5 text-[12.5px] transition-colors duration-100 ${
                                isSubActive
                                  ? "bg-paper/10 font-semibold text-stamp"
                                  : "font-medium text-paper/45 hover:bg-paper/10 hover:text-paper"
                              }`}
                            >
                              {subItem.title}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="relative z-10 shrink-0 border-t border-line-dark p-2">
          <div
            className={`flex items-center gap-2.5 rounded-none px-2 py-1.5 ${
              collapsed ? "justify-center px-0" : "justify-start"
            }`}
          >
            {/* Avatar */}
            <div className="flex h-8 w-8 min-w-8 items-center justify-center border border-stamp/60 bg-stamp-dim text-[11px] font-bold text-stamp">
              {avatarInitials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <div className="truncate text-[13px] font-semibold text-paper">
                    {displayName}
                  </div>
                  <div className="truncate text-[10.5px] font-medium text-paper/40 font-mono">
                    {displayEmail}
                  </div>
                </div>
                <button
                  title="Take a tour"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent(START_TOUR_EVENT))
                  }
                  className="flex cursor-pointer items-center rounded-none p-1.5 text-paper/45 transition-colors hover:text-stamp"
                >
                  <Compass size={15} />
                </button>
                <button
                  title="Sign out"
                  onClick={handleLogout}
                  className="flex cursor-pointer items-center rounded-none p-1.5 text-paper/45 transition-colors hover:text-danger"
                >
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
          {!collapsed && (
            <div className="mt-2 border-t border-line-dark pt-2 text-[9.5px] uppercase tracking-[0.18em] text-paper/30 font-mono">
              Secured Session · TLS 1.3
            </div>
          )}
        </div>
      </aside>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`fixed top-1/2 z-50 flex h-9 w-5 -translate-y-1/2 cursor-pointer items-center justify-center border border-line border-l-0 bg-paper text-ink/50 shadow-[2px_0_6px_rgba(0,0,0,0.04)] transition-colors hover:text-stamp ${
          collapsed ? "left-[60px]" : "left-[236px]"
        }`}
      >
        <ChevronRight
          size={12}
          className={`transition-transform duration-200 ${
            collapsed ? "rotate-0" : "rotate-180"
          }`}
        />
      </button>

      {/* Main Content Window layout */}
      <main className="flex w-full flex-1 flex-col overflow-y-auto bg-paper p-8">
        {pageLocked && currentFeature ? (
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center border border-stamp/40 bg-stamp-dim text-stamp">
              <Lock size={24} />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
                Feature locked
              </h1>
              <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-ink/55">
                <strong>{MODULE_LABELS[currentFeature]}</strong> requires the{" "}
                <strong>{TIER_NAMES[minTierFor(currentFeature)]}</strong> plan.
                Upgrade to unlock it and the rest of your module suite.
              </p>
            </div>
            <Link
              href="/subscription"
              className="rounded-none bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
            >
              View plans & upgrade
            </Link>
          </div>
        ) : (
          children
        )}
      </main>

      {/* One-time app tour */}
      <AppTour />
    </div>
  );
}