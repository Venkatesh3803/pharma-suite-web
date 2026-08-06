"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  Package,
  Layers,
  Calendar,
  DollarSign,
} from "lucide-react";

// Mock Data for Pharmaceutical Inventory
const initialInventory = [
  {
    id: "MED-001",
    name: "Dolo 650mg Tablet",
    category: "Analgesic",
    batchNo: "DL9832",
    stockStrips: 120,
    minLevel: 30,
    price: 30.5,
    expiry: "2027-11",
    rack: "A-04",
    status: "Healthy",
  },
  {
    id: "MED-002",
    name: "Amoxicillin 500mg Capsule",
    category: "Antibiotic",
    batchNo: "AM4410",
    stockStrips: 45,
    minLevel: 50,
    price: 72.0,
    expiry: "2026-09",
    rack: "B-12",
    status: "Low Stock",
  },
  {
    id: "MED-003",
    name: "Pantoprazole 40mg (Pan-D)",
    category: "Antacid",
    batchNo: "PT1102",
    stockStrips: 88,
    minLevel: 25,
    price: 148.0,
    expiry: "2027-04",
    rack: "A-01",
    status: "Healthy",
  },
  {
    id: "MED-004",
    name: "Metformin 500mg SR",
    category: "Anti-Diabetic",
    batchNo: "MF2291",
    stockStrips: 14,
    minLevel: 40,
    price: 24.5,
    expiry: "2026-07",
    rack: "C-03",
    status: "Low Stock",
  },
  {
    id: "MED-005",
    name: "Cetirizine 10mg (Alerid)",
    category: "Anti-Allergic",
    batchNo: "CT5543",
    stockStrips: 340,
    minLevel: 60,
    price: 18.2,
    expiry: "2026-08",
    rack: "D-02",
    status: "Healthy",
  },
  {
    id: "MED-006",
    name: "Azithromycin 500mg (Azee)",
    category: "Antibiotic",
    batchNo: "AZ0092",
    stockStrips: 0,
    minLevel: 20,
    price: 119.0,
    expiry: "2026-04",
    rack: "B-05",
    status: "Out of Stock",
  },
];

export default function MedicineInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Dynamic filter processing
  const filteredInventory = initialInventory.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate aggregated status totals
  const totalItems = initialInventory.length;
  const lowStockCount = initialInventory.filter(
    i => i.status === "Low Stock",
  ).length;
  const outOfStockCount = initialInventory.filter(
    i => i.status === "Out of Stock",
  ).length;
  const healthyCount = initialInventory.filter(
    i => i.status === "Healthy",
  ).length;

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
            Medicine Central Inventory
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Monitor real-time item stocks, verify batch tracking parameters, and
            identify critical expiry statuses.
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
          <Plus size={16} /> Add New Medication
        </button>
      </div>

      {/* ── High-Level Analytics Row ── */}
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
              justifyContent: "center",
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
            >
              Total Tracked SKUs
            </div>
            <div
              style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}
            >
              {totalItems} Items
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
              backgroundColor: "#e0fdf4",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle size={20} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
            >
              Sufficient Stock
            </div>
            <div
              style={{ fontSize: "20px", fontWeight: 700, color: "#16a34a" }}
            >
              {healthyCount} Elements
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
              backgroundColor: "#fff7ed",
              color: "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
            >
              Reorder Thresholds Hit
            </div>
            <div
              style={{ fontSize: "20px", fontWeight: 700, color: "#ea580c" }}
            >
              {lowStockCount} SKUs
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
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Package size={20} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
            >
              Depleted Stock
            </div>
            <div
              style={{ fontSize: "20px", fontWeight: 700, color: "#dc2626" }}
            >
              {outOfStockCount} SKUs
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Options Action Bar ── */}
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
        {/* Search Field */}
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Search by name, item ID, or manufacturing batch number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "13.5px",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Category Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={15} color="#64748b" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#fff",
              fontSize: "13.5px",
              color: "#475569",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="All">All Categories</option>
            <option value="Analgesic">Analgesic</option>
            <option value="Antibiotic">Antibiotic</option>
            <option value="Antacid">Antacid</option>
            <option value="Anti-Diabetic">Anti-Diabetic</option>
            <option value="Anti-Allergic">Anti-Allergic</option>
          </select>
        </div>

        {/* Export Data Button */}
        <button
          style={{
            padding: "8px 14px",
            borderRadius: "6px",
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
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* ── Main Inventory Ledger Table ── */}
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
                  Medicine Details
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    color: "#475569",
                    fontWeight: 600,
                  }}
                >
                  Batch Code
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    color: "#475569",
                    fontWeight: 600,
                  }}
                >
                  Storage Location
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    color: "#475569",
                    fontWeight: 600,
                  }}
                >
                  Stock Balance
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    color: "#475569",
                    fontWeight: 600,
                  }}
                >
                  Expiry Timeline
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    color: "#475569",
                    fontWeight: 600,
                    textAlign: "right",
                  }}
                >
                  Price / Strip
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    color: "#475569",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => {
                // Determine layout badges based on safety states
                const statusStyles =
                  item.status === "Healthy"
                    ? { bg: "#dcfce7", text: "#15803d" }
                    : item.status === "Low Stock"
                      ? { bg: "#fef3c7", text: "#b45309" }
                      : { bg: "#fee2e2", text: "#b91c1c" };

                return (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.backgroundColor = "#f8fafc")
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {/* Name and Internal Meta Tags */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          display: "flex",
                          gap: "8px",
                          marginTop: "2px",
                        }}
                      >
                        <span>ID: {item.id}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </td>

                    {/* Batch Number Code */}
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "#334155",
                        fontFamily: "monospace",
                        fontWeight: 500,
                      }}
                    >
                      {item.batchNo}
                    </td>

                    {/* Shelf/Rack Address */}
                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          backgroundColor: "#f1f5f9",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: 600,
                          color: "#64748b",
                        }}
                      >
                        Rack {item.rack}
                      </span>
                    </td>

                    {/* Current Quantities vs Alert Margin thresholds */}
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color:
                            item.stockStrips <= item.minLevel
                              ? "#ca8a04"
                              : "#0f172a",
                        }}
                      >
                        {item.stockStrips} Strips
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                        Min Alert Level: {item.minLevel}
                      </div>
                    </td>

                    {/* Expiration Timeline Flag */}
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "#334155",
                        fontWeight: 500,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Calendar size={13} color="#94a3b8" /> {item.expiry}
                      </div>
                    </td>

                    {/* Base Pricing Matrix */}
                    <td
                      style={{
                        padding: "14px 16px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      ₹{item.price.toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor: statusStyles.bg,
                          color: statusStyles.text,
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredInventory.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "48px",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    <Package
                      size={32}
                      style={{ margin: "0 auto 12px", opacity: 0.4 }}
                    />
                    <div style={{ fontSize: "14px" }}>
                      No medications found matching your current filter filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
