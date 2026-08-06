"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Truck,
  FileText,
  Clock,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  ArrowUpRight,
  ExternalLink,
  ClipboardList,
} from "lucide-react";

// Mock Data for Suppliers List
const initialSuppliers = [
  {
    id: "SPL-001",
    name: "Cipla Med Distribution",
    contactPerson: "Amit Shah",
    phone: "+91 98450 11223",
    email: "procure@ciplamed.in",
    activePOs: 2,
    totalSpent: "₹4,12,050",
    rating: "4.8",
  },
  {
    id: "SPL-002",
    name: "Sun Pharma Logistics",
    contactPerson: "K. Srinivasan",
    phone: "+91 94440 55667",
    email: "orders@sunpharma.co.in",
    activePOs: 1,
    totalSpent: "₹8,54,300",
    rating: "4.5",
  },
  {
    id: "SPL-003",
    name: "Reddy's Wholesale Drugs",
    contactPerson: "Vikas Reddy",
    phone: "+91 80081 22334",
    email: "distributors@drreddys.com",
    activePOs: 0,
    totalSpent: "₹12,18,000",
    rating: "4.9",
  },
];

// Mock Data for Purchase Orders (POs) Ledger
const initialPOs = [
  {
    poNo: "PO-2026-089",
    supplier: "Cipla Med Distribution",
    orderDate: "2026-06-08",
    deliveryDate: "2026-06-14",
    totalAmount: "₹48,500.00",
    itemsCount: 4,
    status: "Awaiting GRN",
  },
  {
    poNo: "PO-2026-088",
    supplier: "Sun Pharma Logistics",
    orderDate: "2026-06-10",
    deliveryDate: "2026-06-16",
    totalAmount: "₹1,12,400.00",
    itemsCount: 12,
    status: "Pending Approval",
  },
  {
    poNo: "PO-2026-087",
    supplier: "Reddy's Wholesale Drugs",
    orderDate: "2026-06-01",
    deliveryDate: "2026-06-05",
    totalAmount: "₹3,42,000.00",
    itemsCount: 45,
    status: "Fully Received",
  },
];

export default function SuppliersAndPOs() {
  const [activeTab, setActiveTab] = useState<"suppliers" | "pos">("suppliers");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSuppliers = initialSuppliers.filter(
    sup =>
      sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sup.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredPOs = initialPOs.filter(
    po =>
      po.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
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
            Procurement & Supply Chain Engine
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Manage wholesale medical distributors, generate purchase orders, and
            track fulfillment lifecycles.
          </p>
        </div>
        <button
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            backgroundColor: "#059669",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <Plus size={16} /> Raise New Purchase Order
        </button>
      </div>

      {/* ── Procurement Pipelines High-Level Cards ── */}
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
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: "#f1f5f9",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyCentering: "center",
              displayFlex: "flex",
              justifyContent: "center",
            }}
          >
            <Building2 size={18} style={{ alignSelf: "center" }} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
            >
              Contracted Suppliers
            </div>
            <div
              style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}
            >
              {initialSuppliers.length} Wholesalers
            </div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: "#fef3c7",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyCentering: "center",
              displayFlex: "flex",
              justifyContent: "center",
            }}
          >
            <Clock size={18} style={{ alignSelf: "center" }} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
            >
              Pending Sign-Off
            </div>
            <div
              style={{ fontSize: "18px", fontWeight: 700, color: "#d97706" }}
            >
              1 Order
            </div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: "#e0f2fe",
              color: "#0284c7",
              display: "flex",
              alignItems: "center",
              justifyCentering: "center",
              displayFlex: "flex",
              justifyContent: "center",
            }}
          >
            <Truck size={18} style={{ alignSelf: "center" }} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
            >
              Awaiting Warehouse GRN
            </div>
            <div
              style={{ fontSize: "18px", fontWeight: 700, color: "#0284c7" }}
            >
              1 Pipeline
            </div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: "#dcfce7",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyCentering: "center",
              displayFlex: "flex",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={18} style={{ alignSelf: "center" }} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
            >
              Fulfilled This Month
            </div>
            <div
              style={{ fontSize: "18px", fontWeight: 700, color: "#16a34a" }}
            >
              28 Batches
            </div>
          </div>
        </div>
      </div>

      {/* ── Segment Controller & Action Row ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "12px",
        }}
      >
        {/* Tab Selection */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            backgroundColor: "#f1f5f9",
            padding: "4px",
            borderRadius: "8px",
          }}
        >
          <button
            onClick={() => {
              setActiveTab("suppliers");
              setSearchTerm("");
            }}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor:
                activeTab === "suppliers" ? "#ffffff" : "transparent",
              color: activeTab === "suppliers" ? "#0f172a" : "#64748b",
              boxShadow:
                activeTab === "suppliers"
                  ? "0 1px 3px rgba(0,0,0,0.1)"
                  : "none",
              transition: "all 0.15s",
            }}
          >
            Registered Suppliers
          </button>
          <button
            onClick={() => {
              setActiveTab("pos");
              setSearchTerm("");
            }}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: activeTab === "pos" ? "#ffffff" : "transparent",
              color: activeTab === "pos" ? "#0f172a" : "#64748b",
              boxShadow:
                activeTab === "pos" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
            }}
          >
            Purchase Orders History
          </button>
        </div>

        {/* Dynamic Search Box Input */}
        <div style={{ position: "relative", width: "300px" }}>
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
            placeholder={
              activeTab === "suppliers"
                ? "Search suppliers or contacts..."
                : "Search PO numbers or distributors..."
            }
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
      </div>

      {/* ── Content View Blocks ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* RENDER TABLE 1: SUPPLIERS PANEL */}
        {activeTab === "suppliers" && (
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
                    Supplier Details
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    Key Point of Contact
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    Communication Details
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      color: "#475569",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    Active POs
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      color: "#475569",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Total Gross Outlay
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      color: "#475569",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(sup => (
                  <tr
                    key={sup.id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.backgroundColor = "#f8fafc")
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {sup.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          marginTop: "2px",
                        }}
                      >
                        ID: {sup.id}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "#334155",
                        fontWeight: 500,
                      }}
                    >
                      {sup.contactPerson}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                        }}
                      >
                        <Phone size={12} color="#94a3b8" /> {sup.phone}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          marginTop: "2px",
                          color: "#64748b",
                        }}
                      >
                        <Mail size={12} color="#94a3b8" /> {sup.email}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor:
                            sup.activePOs > 0 ? "#e0f2fe" : "#f1f5f9",
                          color: sup.activePOs > 0 ? "#0369a1" : "#475569",
                        }}
                      >
                        {sup.activePOs} running
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      {sup.totalSpent}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#ca8a04",
                          backgroundColor: "#fef9c3",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                        }}
                      >
                        ★ {sup.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RENDER TABLE 2: PURCHASE ORDERS HISTORY PANEL */}
        {activeTab === "pos" && (
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
                    PO Number
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    Target Vendor Distributor
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    Order Date
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    Est. Delivery
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    Line Elements
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      color: "#475569",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Total Amount
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      color: "#475569",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    Fulfillment Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.map(po => {
                  const badgeStyles =
                    po.status === "Fully Received"
                      ? { bg: "#dcfce7", text: "#15803d" }
                      : po.status === "Awaiting GRN"
                        ? { bg: "#e0f2fe", text: "#0369a1" }
                        : { bg: "#fef3c7", text: "#b45309" };

                  return (
                    <tr
                      key={po.poNo}
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "pointer",
                          }}
                          onMouseEnter={e =>
                            (e.currentTarget.style.color = "#059669")
                          }
                          onMouseLeave={e =>
                            (e.currentTarget.style.color = "#0f172a")
                          }
                        >
                          {po.poNo}{" "}
                          <ExternalLink size={12} style={{ opacity: 0.5 }} />
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontWeight: 500,
                          color: "#334155",
                        }}
                      >
                        {po.supplier}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#64748b" }}>
                        {po.orderDate}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#64748b" }}>
                        {po.deliveryDate}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "#475569",
                          fontWeight: 500,
                        }}
                      >
                        {po.itemsCount} variations
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {po.totalAmount}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor: badgeStyles.bg,
                            color: badgeStyles.text,
                          }}
                        >
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Fallback View when search returns empty array results */}
        {((activeTab === "suppliers" && filteredSuppliers.length === 0) ||
          (activeTab === "pos" && filteredPOs.length === 0)) && (
          <div
            style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}
          >
            <ClipboardList
              size={32}
              style={{ margin: "0 auto 12px", opacity: 0.4 }}
            />
            <div style={{ fontSize: "14px" }}>
              No procurement elements or record files discovered matching your
              search term.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
