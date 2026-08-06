"use client";

import React from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Activity,
} from "lucide-react";

// Mock Data for Quick Rendering
const stats = [
  {
    title: "Total Revenue Today",
    value: "₹84,210.00",
    change: "+14.2%",
    isPositive: true,
    icon: DollarSign,
    iconBg: "#e0f2fe",
    iconColor: "#0284c7",
  },
  {
    title: "Sales Invoices Issued",
    value: "142 Invoices",
    change: "+8.4%",
    isPositive: true,
    icon: ShoppingCart,
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
  },
  {
    title: "Average Ticket Size",
    value: "₹593.00",
    change: "-2.1%",
    isPositive: false,
    icon: CreditCard,
    iconBg: "#fef3c7",
    iconColor: "#d97706",
  },
  {
    title: "Pending Counter Credit",
    value: "₹4,120.00",
    change: "3 Accounts",
    isPositive: true,
    icon: Activity,
    iconBg: "#ffeeec",
    iconColor: "#dc2626",
  },
];

const recentSales = [
  {
    id: "INV-2026-004",
    customer: "Walk-in Customer",
    items: 4,
    total: "₹1,240.00",
    status: "Paid",
    method: "UPI",
    time: "10 mins ago",
  },
  {
    id: "INV-2026-003",
    customer: "Anand Verma",
    items: 12,
    total: "₹4,850.00",
    status: "Paid",
    method: "Cash",
    time: "24 mins ago",
  },
  {
    id: "INV-2026-002",
    customer: "Dr. Sunita Rao (Clinic)",
    items: 45,
    total: "₹18,200.00",
    status: "Due",
    method: "Credit Ledger",
    time: "1 hour ago",
  },
  {
    id: "INV-2026-001",
    customer: "Walk-in Customer",
    items: 1,
    total: "₹180.00",
    status: "Paid",
    method: "Card",
    time: "2 hours ago",
  },
];

const topMovingMedicines = [
  {
    name: "Paracetamol 650mg (Dolo)",
    category: "Analgesic",
    unitsSold: 480,
    stockLeft: 120,
    status: "Healthy",
  },
  {
    name: "Amoxicillin 500mg Capsule",
    category: "Antibiotic",
    unitsSold: 210,
    stockLeft: 45,
    status: "Low Stock",
  },
  {
    name: "Metformin 500mg SR",
    category: "Anti-Diabetic",
    unitsSold: 195,
    stockLeft: 340,
    status: "Healthy",
  },
  {
    name: "Pantoprazole 40mg Tablet",
    category: "Antacid",
    unitsSold: 140,
    stockLeft: 12,
    status: "Critical",
  },
];

export default function SalesDashboard() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        width: "100%",
      }}
    >
      {/* ── Header Area ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
            }}
          >
            Sales Analysis Workstation
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Real-time retail metrics, counter ledger settlements, and stock
            clearance velocities.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <select
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#fff",
              fontSize: "14px",
              fontWeight: 500,
              color: "#475569",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option>Terminal: All Registers</option>
            <option>Counter Terminal 01</option>
            <option>Counter Terminal 02</option>
          </select>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              backgroundColor: "#059669",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Today
          </div>
        </div>
      </div>

      {/* ── Stats Metric Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          width: "100%",
        }}
      >
        {stats.map((stat, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontSize: "13.5px",
                  fontWeight: 500,
                  color: "#64748b",
                }}
              >
                {stat.title}
              </span>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "8px",
                  backgroundColor: stat.iconBg,
                  color: stat.iconColor,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <stat.icon size={18} style={{ alignSelf: "center" }} />
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "4px",
                }}
              >
                {stat.isPositive ? (
                  <ArrowUpRight size={14} color="#16a34a" />
                ) : (
                  <ArrowDownRight size={14} color="#dc2626" />
                )}
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: stat.isPositive ? "#16a34a" : "#dc2626",
                  }}
                >
                  {stat.change}
                </span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                  vs yesterday
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Dashboard Split Columns ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "24px",
          width: "100%",
        }}
      >
        {/* Left Column: Recent Counter Transactions */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Live Terminal Invoices
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  margin: "2px 0 0 0",
                }}
              >
                Instant view of running retail transactions
              </p>
            </div>
            <span
              style={{
                fontSize: "12px",
                color: "#059669",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              View All Invoices
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th
                    style={{
                      padding: "10px 8px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Invoice ID
                  </th>
                  <th
                    style={{
                      padding: "10px 8px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Customer
                  </th>
                  <th
                    style={{
                      padding: "10px 8px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Payment
                  </th>
                  <th
                    style={{
                      padding: "10px 8px",
                      color: "#64748b",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(sale => (
                  <tr
                    key={sale.id}
                    style={{ borderBottom: "1px solid #f8fafc" }}
                  >
                    <td
                      style={{
                        padding: "12px 8px",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      <div>{sale.id}</div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          fontWeight: 400,
                        }}
                      >
                        {sale.time}
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px", color: "#334155" }}>
                      <div>{sale.customer}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {sale.items} line items
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor:
                            sale.status === "Paid" ? "#dcfce7" : "#fee2e2",
                          color: sale.status === "Paid" ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {sale.method}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      {sale.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Moving Inventory Stock */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Top High-Velocity Elements
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  margin: "2px 0 0 0",
                }}
              >
                Fastest moving pharmaceutical SKUs today
              </p>
            </div>
            <span
              style={{
                fontSize: "12px",
                color: "#059669",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Analyze Velocity
            </span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {topMovingMedicines.map((med, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                    }}
                  >
                    <Package size={16} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {med.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {med.category}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {med.unitsSold} units
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color:
                        med.status === "Critical"
                          ? "#dc2626"
                          : med.status === "Low Stock"
                            ? "#d97706"
                            : "#64748b",
                    }}
                  >
                    {med.stockLeft} left ({med.status})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
