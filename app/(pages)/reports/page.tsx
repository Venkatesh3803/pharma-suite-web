"use client";

import React, { useState } from "react";
import {
  Search,
  Calendar,
  Download,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  ArrowUpRight,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  TrendingDown,
  BarChart3,
} from "lucide-react";

// Mock Data for Invoice Records
const initialSales = [
  {
    invoiceNo: "INV-2026-401",
    customer: "Apollo Pharmacy Group",
    date: "2026-06-12",
    itemsCount: 18,
    totalAmount: 42500.0,
    tax: 5100.0,
    paymentMode: "Bank Transfer",
    status: "Settled",
  },
  {
    invoiceNo: "INV-2026-400",
    customer: "MedPlus Wellness Retail",
    date: "2026-06-11",
    itemsCount: 8,
    totalAmount: 14200.0,
    tax: 1704.0,
    paymentMode: "UPI / QR",
    status: "Settled",
  },
  {
    invoiceNo: "INV-2026-399",
    customer: "Care First Clinic",
    date: "2026-06-10",
    itemsCount: 32,
    totalAmount: 118900.0,
    tax: 14268.0,
    paymentMode: "Net Banking",
    status: "Settled",
  },
  {
    invoiceNo: "INV-2026-398",
    customer: "Lifeline Healthcare",
    date: "2026-06-09",
    itemsCount: 5,
    totalAmount: 8400.0,
    tax: 1008.0,
    paymentMode: "Credit Card",
    status: "Pending Verification",
  },
  {
    invoiceNo: "INV-2026-397",
    customer: "Saraswathi Medicals",
    date: "2026-06-08",
    itemsCount: 14,
    totalAmount: 22150.0,
    tax: 2658.0,
    paymentMode: "Cash on Delivery",
    status: "Settled",
  },
];

// Mock Data for Category Distribution Summary
const channelSales = [
  {
    channel: "B2B Wholesale Distribution",
    share: "64%",
    transactions: 142,
    grossVolume: "₹12,45,000",
  },
  {
    channel: "Retail Counter Sales",
    share: "22%",
    transactions: 510,
    grossVolume: "₹4,28,400",
  },
  {
    channel: "E-Pharmacy API Sync",
    share: "14%",
    transactions: 98,
    grossVolume: "₹2,72,600",
  },
];

export default function SalesReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredSales = initialSales.filter(sale => {
    const matchesSearch =
      sale.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || sale.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate gross running totals for the listed entries
  const totalGrossRevenue = initialSales.reduce(
    (acc, current) => acc + current.totalAmount,
    0,
  );
  const totalInvoicedTax = initialSales.reduce(
    (acc, current) => acc + current.tax,
    0,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        width: "100%",
      }}
    >
      {/* ── Header System ── */}
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
            Sales & Revenue Analytics
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Analyze macro billing parameters, track multi-channel volume shares,
            and audit outstanding invoice matrices.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#fff",
              fontSize: "13.5px",
              fontWeight: 500,
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} /> Refresh Fields
          </button>
          <button
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              backgroundColor: "#0f172a",
              color: "#fff",
              fontSize: "13.5px",
              fontWeight: 600,
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Download size={14} /> Export Report Summary
          </button>
        </div>
      </div>

      {/* ── Financial Ledger Cards Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
              >
                Gross Product Turnaround
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginTop: "4px",
                }}
              >
                ₹2,06,150.00
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                backgroundColor: "#dcfce7",
                color: "#15803d",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <ArrowUpRight size={12} /> +12.4%
            </span>
          </div>
          <div
            style={{ fontSize: "11px", color: "#94a3b8", marginTop: "12px" }}
          >
            Calculated across current batch cycle
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
              >
                Tax Contributions (GST)
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginTop: "4px",
                }}
              >
                ₹24,738.00
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                backgroundColor: "#f1f5f9",
                color: "#475569",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              12% Avg Base
            </span>
          </div>
          <div
            style={{ fontSize: "11px", color: "#94a3b8", marginTop: "12px" }}
          >
            Automated liability computation ledger
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
              >
                Active Volume Despatches
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginTop: "4px",
                }}
              >
                {initialSales.length} Invoices
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              100% Core
            </span>
          </div>
          <div
            style={{ fontSize: "11px", color: "#94a3b8", marginTop: "12px" }}
          >
            Zero pipeline blocks flagged today
          </div>
        </div>
      </div>

      {/* ── Double Layout: Channel Share vs Detailed Invoices Ledger ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN: MAIN INVOICES LEDGER CONTROL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Action Filter Sub-Bar */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "12px",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="text"
                placeholder="Search by unique invoice serial ID or corporate customer name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 32px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={14} color="#64748b" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#fff",
                  fontSize: "13px",
                  color: "#475569",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="All">All Invoicing States</option>
                <option value="Settled">Settled Ledger</option>
                <option value="Pending Verification">
                  Pending Verification
                </option>
              </select>
            </div>
          </div>

          {/* Tables Workspace Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "13.5px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <th
                      style={{
                        padding: "14px 16px",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Billing Identification
                    </th>
                    <th
                      style={{
                        padding: "14px 16px",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Consignee Entity
                    </th>
                    <th
                      style={{
                        padding: "14px 16px",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Invoice Date
                    </th>
                    <th
                      style={{
                        padding: "14px 16px",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Settlement Mode
                    </th>
                    <th
                      style={{
                        padding: "14px 16px",
                        color: "#475569",
                        fontWeight: 600,
                        textAlign: "right",
                      }}
                    >
                      Tax Matrix
                    </th>
                    <th
                      style={{
                        padding: "14px 16px",
                        color: "#475569",
                        fontWeight: 600,
                        textAlign: "right",
                      }}
                    >
                      Gross Value
                    </th>
                    <th
                      style={{
                        padding: "14px 16px",
                        color: "#475569",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      State
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(sale => (
                    <tr
                      key={sale.invoiceNo}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={e =>
                        (e.currentTarget.style.backgroundColor = "#f8fafc")
                      }
                      onMouseLeave={e =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "14px 16px",
                          fontWeight: 600,
                          color: "#0f172a",
                          fontFamily: "monospace",
                        }}
                      >
                        {sale.invoiceNo}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 500, color: "#334155" }}>
                          {sale.customer}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          Contains {sale.itemsCount} SKUs
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#64748b" }}>
                        {sale.date}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "#475569",
                          fontSize: "12.5px",
                        }}
                      >
                        {sale.paymentMode}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          color: "#64748b",
                          fontFamily: "monospace",
                        }}
                      >
                        ₹{sale.tax.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#0f172a",
                          fontFamily: "monospace",
                        }}
                      >
                        ₹{sale.totalAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            backgroundColor:
                              sale.status === "Settled" ? "#e0fdf4" : "#fff7ed",
                            color:
                              sale.status === "Settled" ? "#16a34a" : "#c2410c",
                          }}
                        >
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DISTRIBUTION OUTLETS SHIFT MATRIX */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "12px",
                marginBottom: "14px",
              }}
            >
              <BarChart3 size={16} color="#475569" />
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Channel Split Matrix
              </h3>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {channelSales.map((chan, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      {chan.channel}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#059669",
                      }}
                    >
                      {chan.share}
                    </span>
                  </div>

                  {/* Visual Proportion Bar Layout */}
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      backgroundColor: "#e2e8f0",
                      borderRadius: "3px",
                      marginTop: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: chan.share,
                        height: "100%",
                        backgroundColor:
                          idx === 0
                            ? "#0f172a"
                            : idx === 1
                              ? "#0284c7"
                              : "#10b981",
                        borderRadius: "3px",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "#64748b",
                      marginTop: "8px",
                    }}
                  >
                    <span>{chan.transactions} Transactions</span>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                      {chan.grossVolume}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "16px",
                backgroundColor: "#f0fdf4",
                border: "1px dashed #bbf7d0",
                borderRadius: "8px",
                padding: "10px",
                fontSize: "12px",
                color: "#16a34a",
                textAlign: "center",
                fontWeight: 500,
              }}
            >
              💡 B2B distribution volumes increased by 4% over the last 48
              hours.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
