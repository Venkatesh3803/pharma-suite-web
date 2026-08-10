"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  Receipt,
  Users,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  LogOut,
  ShoppingBag,
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    url: "#",
    icon: LayoutDashboard,
    hasDropdown: true,
    prefix: "/dashboard", //Used to keep the dropdown open if URL matches
    subItems: [
      {
        title: "Purchase Dashboard",
        url: "/dashboard/purchase-dashboard",
      },
      { title: "Sales Dashboard", url: "/dashboard/sales-dashboard" },
    ],
  },
  { title: "Quick Billing", url: "/billing", icon: Receipt },
  { title: "Medicine Inventory", url: "/inventory", icon: Pill },
  {
    title: "Purchase",
    url: "#",
    icon: ShoppingBag,
    hasDropdown: true,
    prefix: "/purchase", //Used to keep the dropdown open if URL matches
    subItems: [
      { title: "Purchase Request", url: "/purchase/request" },
      { title: "RFQ", url: "/purchase/rfq" },
      { title: "Purchase Order", url: "/purchase/order" },
      { title: "GRN", url: "/purchase/grn" },
      { title: "Purchase Invoice", url: "/purchase/invoice" },
    ],
  },
  { title: "Suppliers & POs", url: "/suppliers", icon: Users },
  { title: "Sales Reports", url: "/reports", icon: TrendingUp },
];

const mockUser = {
  fullName: "Ravi Kumar",
  email: "ravi.kumar@pharmasuite.in",
  avatarInitials: "RK",
};

export default function AppSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  //Manage dropdown states
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    Dashboard: true,
    Purchase: false,
  });

  //👇 Sync dropdown states automatically with the active URL on route changes
  useEffect(() => {
    navigationItems.forEach(item => {
      if (item.hasDropdown && item.prefix) {
        if (pathname.startsWith(item.prefix)) {
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

  const handleLogout = () => {
    router.push("/sign-in");
  };

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
                PharmaSuite
              </div>
              <div className="whitespace-nowrap text-[10.5px] font-medium uppercase tracking-[0.14em] text-paper/45 font-mono">
                Retail POS · Ledger
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-2 pt-2">
          {!collapsed && (
            <div className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-paper/35 font-mono">
              Management
            </div>
          )}
          <ul className="flex flex-col gap-0.5 p-0 m-0 list-none">
            {navigationItems.map(item => {
              const isActive =
                pathname === item.url ||
                (item.prefix ? pathname.startsWith(item.prefix) : false) ||
                item.subItems?.some(sub => pathname === sub.url);
              const isDropdownOpen = !!openDropdowns[item.title];

              return (
                <li key={item.title}>
                  <div
                    onClick={e => {
                      if (item.hasDropdown) {
                        e.preventDefault();
                        if (collapsed) setCollapsed(false);
                        toggleDropdown(item.title);
                      } else {
                        handleNavigate(item.url);
                      }
                    }}
                    title={collapsed ? item.title : undefined}
                    className={`group flex h-10 cursor-pointer items-center gap-2.5 rounded-none text-[13.5px] font-medium transition-colors duration-150 ${
                      collapsed
                        ? "justify-center px-0"
                        : "justify-start px-2.5"
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

                    {/* Dropdown Indicator Arrow */}
                    {item.hasDropdown && !collapsed && (
                      <div className="ml-auto flex items-center text-paper/40">
                        {isDropdownOpen ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </div>
                    )}

                    {isActive && !item.hasDropdown && !collapsed && (
                      <span className="ml-auto h-5 w-1 bg-stamp" />
                    )}
                  </div>

                  {/* Render Nested Submenu Items */}
                  {item.hasDropdown && isDropdownOpen && !collapsed && (
                    <ul className="m-0 ml-[18px] mb-2 mt-1 list-none border-l border-paper/20 p-0 flex flex-col gap-0.5">
                      {item.subItems?.map(subItem => {
                        const isSubActive = pathname === subItem.url;
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
              {mockUser.avatarInitials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <div className="truncate text-[13px] font-semibold text-paper">
                    {mockUser.fullName}
                  </div>
                  <div className="truncate text-[10.5px] font-medium text-paper/40 font-mono">
                    {mockUser.email}
                  </div>
                </div>
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
        {children}
      </main>
    </div>
  );
}
