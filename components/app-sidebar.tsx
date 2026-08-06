"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw", //👈 FORCE the layout to use the full viewport width
        maxWidth: "100%", //Prevent any parent containers from shrinking it
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: collapsed ? "64px" : "240px",
          minWidth: collapsed ? "64px" : "240px",
          transition: "width 0.2s ease, min-width 0.2s ease",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: "64px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "0 12px",
            borderBottom: "1px solid #f1f5f9",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              minWidth: "36px",
              borderRadius: "8px",
              backgroundColor: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <Pill size={18} />
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#0f172a",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                PharmaSuite
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Retail Store POS
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 8px 0" }}>
          {!collapsed && (
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#94a3b8",
                padding: "8px 8px 4px",
              }}
            >
              Management
            </div>
          )}
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: collapsed ? "0 14px" : "0 10px",
                      height: "40px",
                      borderRadius: "8px",
                      fontWeight: 500,
                      fontSize: "13.5px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      backgroundColor:
                        isActive && !item.hasDropdown
                          ? "#f0fdf4"
                          : "transparent",
                      color: isActive ? "#059669" : "#475569",
                      transition: "background 0.15s, color 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "#f8fafc";
                        e.currentTarget.style.color = "#059669";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#475569";
                      }
                    }}
                  >
                    <item.icon
                      size={18}
                      style={{
                        flexShrink: 0,
                        color: isActive ? "#059669" : "currentColor",
                      }}
                    />
                    {!collapsed && (
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.title}
                      </span>
                    )}

                    {/* Dropdown Indicator Arrow */}
                    {item.hasDropdown && !collapsed && (
                      <div
                        style={{
                          marginLeft: "auto",
                          display: "flex",
                          alignItems: "center",
                          color: "#94a3b8",
                        }}
                      >
                        {isDropdownOpen ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </div>
                    )}

                    {isActive && !item.hasDropdown && !collapsed && (
                      <span
                        style={{
                          marginLeft: "auto",
                          width: "4px",
                          height: "20px",
                          borderRadius: "2px",
                          backgroundColor: "#059669",
                        }}
                      />
                    )}
                  </div>

                  {/* Render Nested Submenu Items */}
                  {item.hasDropdown && isDropdownOpen && !collapsed && (
                    <ul
                      style={{
                        listStyle: "none",
                        margin: "4px 0 8px 0",
                        padding: "0 0 0 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        borderLeft: "1px solid #e2e8f0",
                        marginLeft: "18px",
                      }}
                    >
                      {item.subItems?.map(subItem => {
                        const isSubActive = pathname === subItem.url;
                        return (
                          <li key={subItem.title}>
                            <div
                              onClick={() => handleNavigate(subItem.url)}
                              style={{
                                display: "block",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                fontSize: "12.5px",
                                fontWeight: isSubActive ? 600 : 500,
                                color: isSubActive ? "#059669" : "#64748b",
                                transition: "color 0.1s, background 0.1s",
                                cursor: "pointer",
                                backgroundColor: isSubActive
                                  ? "#f0fdf4"
                                  : "transparent",
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.color = "#059669";
                                e.currentTarget.style.backgroundColor =
                                  "#f8fafc";
                              }}
                              onMouseLeave={e => {
                                if (!isSubActive) {
                                  e.currentTarget.style.color = "#64748b";
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }
                              }}
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
        <div
          style={{
            borderTop: "1px solid #f1f5f9",
            backgroundColor: "rgba(248,250,252,0.5)",
            padding: "10px 8px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 8px",
              borderRadius: "8px",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "32px",
                height: "32px",
                minWidth: "32px",
                borderRadius: "50%",
                backgroundColor: "#dcfce7",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {mockUser.avatarInitials}
            </div>
            {!collapsed && (
              <>
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1e293b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {mockUser.fullName}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {mockUser.email}
                  </div>
                </div>
                <button
                  title="Sign out"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: "4px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
                >
                  <LogOut size={15} onClick={handleLogout} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          position: "fixed",
          left: collapsed ? "48px" : "224px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 50,
          width: "20px",
          height: "36px",
          borderRadius: "0 6px 6px 0",
          border: "1px solid #e2e8f0",
          borderLeft: "none",
          backgroundColor: "#ffffff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          transition: "left 0.2s ease",
          boxShadow: "2px 0 6px rgba(0,0,0,0.04)",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#059669")}
        onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
      >
        <ChevronRight
          size={12}
          style={{
            transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Main Content Window layout */}
      <main
        style={{
          flex: 1, //👈 Tells flexbox to grow and consume ALL available empty space on the right
          width: "100%", //Explicitly occupies the remainder of the layout axis
          backgroundColor: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          padding: "32px",
          overflowY: "auto", //Ensures clean scrolling inside the workspace only
        }}
      >
        {children}
      </main>
    </div>
  );
}
