"use client";

import React from "react";
import {
  ShoppingBag,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Pill,
  DollarSign,
  ClipboardList,
} from "lucide-react";

// Mock snapshot statistics for a busy day counter
const analyticalStats = [
  {
    title: "Gross Sales Today",
    value: "₹42,850.00",
    change: "+12.4%",
    isPositive: true,
    icon: DollarSign,
    iconBg: "#e0f2fe",
    iconColor: "#0284c7",
  },
  {
    title: "Purchase Orders Pending",
    value: "14 Orders",
    change: "3 awaiting RFQ",
    isPositive: true,
    icon: ShoppingBag,
    iconBg: "#fef3c7",
    iconColor: "#d97706",
  },
  {
    title: "Critical Low Stock Alerts",
    value: "8 Items",
    change: "Requires GRN",
    isPositive: false,
    icon: AlertTriangle,
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
  },
  {
    title: "Active Counter Sessions",
    value: "3 Active",
    change: "Avg speed 2.4m",
    isPositive: true,
    icon: Activity,
    iconBg: "#dcfce7",
    iconColor: "#15803d",
  },
];

// Mock list of recent transactions across the retail platform
const recentTransactions = [
  {
    id: "TXN-9021",
    medicine: "Amoxicillin 500mg",
    type: "Acute Care",
    amount: "₹450.00",
    status: "Completed",
    time: "10 mins ago",
  },
  {
    id: "TXN-9020",
    medicine: "Metformin 850mg",
    type: "Chronic Care",
    amount: "₹1,200.00",
    status: "Completed",
    time: "14 mins ago",
  },
  {
    id: "TXN-9019",
    medicine: "Lipitor 20mg",
    type: "Cardiac Care",
    amount: "₹890.00",
    status: "Failed",
    time: "32 mins ago",
  },
  {
    id: "TXN-9018",
    medicine: "Paracetamol 650mg",
    type: "Over-the-Counter",
    amount: "₹85.00",
    status: "Completed",
    time: "1 hr ago",
  },
];

export default function DashboardPage() {
  return (
    <div
      style={{ color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* ── Dashboard Welcoming Header ── */}
      <div
        style={{
          marginBottom: "28px",
          display: "flex",
          justifyContent: "between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 4px 0",
            }}
          >
            Store Control Center
          </h2>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
            Real-time status overview for counter billing terminals and
            purchasing lines.
          </p>
        </div>
      </div>

      {/* ── Metric Analytics Grid Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {analyticalStats.map((stat, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "12px",
              }}
            >
              <span
                style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}
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
                  justifyContent: "center",
                }}
              >
                <stat.icon size={18} />
              </div>
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "4px",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color:
                  stat.isPositive && !stat.title.includes("Alerts")
                    ? "#16a34a"
                    : "#dc2626",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {stat.isPositive && !stat.title.includes("Alerts") ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              <span>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-Column Operational Layout split ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Left Side: Recent Sales Live Stream Terminal */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 16px 0",
            }}
          >
            Live Billing Streams
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {recentTransactions.map(txn => (
              <div
                key={txn.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9",
                  backgroundColor: "#f8fafc",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      backgroundColor: "#e8f5e9",
                      color: "#2e7d32",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Pill size={15} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {txn.medicine}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      {txn.id} • {txn.type}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    {txn.amount}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: txn.status === "Completed" ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {txn.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Quick Sub-Module Operational Links */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 6px 0",
            }}
          >
            Quick Launch Actions
          </h3>
          <p
            style={{
              fontSize: "12.5px",
              color: "#64748b",
              margin: "0 0 16px 0",
            }}
          >
            Bypass navigational channels and load active documents immediately.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              flex: 1,
            }}
          >
            <button
              style={{
                border: "1px dashed #cbd5e1",
                backgroundColor: "#fff",
                borderRadius: "8px",
                padding: "16px",
                cursor: "pointer",
                textAlign: "left",
                transition: "border 0.2s",
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.borderColor = "#059669")
              }
              onMouseLeave={e =>
                (e.currentTarget.style.borderColor = "#cbd5e1")
              }
            >
              <div style={{ color: "#059669", marginBottom: "8px" }}>
                <DollarSign size={18} />
              </div>
              <div
                style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}
              >
                New Cash Bill
              </div>
              <div
                style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}
              >
                Open terminal POS
              </div>
            </button>

            <button
              style={{
                border: "1px dashed #cbd5e1",
                backgroundColor: "#fff",
                borderRadius: "8px",
                padding: "16px",
                cursor: "pointer",
                textAlign: "left",
                transition: "border 0.2s",
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.borderColor = "#059669")
              }
              onMouseLeave={e =>
                (e.currentTarget.style.borderColor = "#cbd5e1")
              }
            >
              <div style={{ color: "#d97706", marginBottom: "8px" }}>
                <ClipboardList size={18} />
              </div>
              <div
                style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}
              >
                Draft RFQ
              </div>
              <div
                style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}
              >
                Request supplier quotes
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
