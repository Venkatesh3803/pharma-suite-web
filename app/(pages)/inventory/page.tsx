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

const statusBadge: Record<string, string> = {
  Healthy: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  "Low Stock": "border border-stamp/30 bg-stamp-dim text-stamp",
  "Out of Stock": "border border-danger/25 bg-danger-bg text-danger",
};

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

  const inputBase =
    "w-full rounded-none border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header System ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Warehouse Ledger
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Medicine Central Inventory
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Monitor real-time item stocks, verify batch tracking parameters, and
            identify critical expiry statuses.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-none bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-colors hover:bg-teal-deep focus:outline-none focus:ring-2 focus:ring-teal-mid/30">
          <Plus size={16} /> Add New Medication
        </button>
      </div>

      {/* ── High-Level Analytics Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-3.5 border border-line bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center bg-paper-dim text-ink/60">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              Total Tracked SKUs
            </div>
            <div className="font-display text-xl font-bold text-ink">
              {totalItems} Items
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border border-line bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center bg-teal-mid/10 text-teal-mid">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              Sufficient Stock
            </div>
            <div className="font-display text-xl font-bold text-teal-mid">
              {healthyCount} Elements
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border border-line bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center bg-stamp-dim text-stamp">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              Reorder Thresholds Hit
            </div>
            <div className="font-display text-xl font-bold text-stamp">
              {lowStockCount} SKUs
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border border-line bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center bg-danger-bg text-danger">
            <Package size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              Depleted Stock
            </div>
            <div className="font-display text-xl font-bold text-danger">
              {outOfStockCount} SKUs
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Options Action Bar ── */}
      <div className="flex items-center gap-3 border border-line bg-white p-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            type="text"
            placeholder="Search by name, item ID, or manufacturing batch number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`${inputBase} pl-9`}
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-1.5">
          <Filter size={15} className="text-ink/50" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className={`${inputBase} cursor-pointer`}
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
        <button className="flex cursor-pointer items-center gap-1.5 rounded-none border border-line bg-white px-3.5 py-2 text-[13.5px] font-medium text-ink/70 transition-colors hover:bg-paper-dim">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* ── Main Inventory Ledger Table ── */}
      <div className="overflow-hidden border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line bg-paper-dim">
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  Medicine Details
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  Batch Code
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  Storage Location
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  Stock Balance
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  Expiry Timeline
                </th>
                <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  Price / Strip
                </th>
                <th className="px-4 py-3.5 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => (
                <tr
                  key={item.id}
                  className="border-b border-line/60 transition-colors hover:bg-paper/70"
                >
                  {/* Name and Internal Meta Tags */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-ink">{item.name}</div>
                    <div className="mt-0.5 flex gap-2 text-[11px] text-ink/40">
                      <span>ID: {item.id}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                  </td>

                  {/* Batch Number Code */}
                  <td className="px-4 py-3.5 font-mono text-[13px] font-medium text-ink/70">
                    {item.batchNo}
                  </td>

                  {/* Shelf/Rack Address */}
                  <td className="px-4 py-3.5 text-ink/60">
                    <span className="rounded-none bg-paper-dim px-2 py-1 text-[12px] font-semibold text-ink/60 font-mono">
                      Rack {item.rack}
                    </span>
                  </td>

                  {/* Current Quantities vs Alert Margin thresholds */}
                  <td className="px-4 py-3.5">
                    <div
                      className={`font-semibold ${
                        item.stockStrips <= item.minLevel
                          ? "text-stamp"
                          : "text-ink"
                      }`}
                    >
                      {item.stockStrips} Strips
                    </div>
                    <div className="text-[11px] text-ink/40">
                      Min Alert Level: {item.minLevel}
                    </div>
                  </td>

                  {/* Expiration Timeline Flag */}
                  <td className="px-4 py-3.5 font-medium text-ink/70">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-ink/40" /> {item.expiry}
                    </div>
                  </td>

                  {/* Base Pricing Matrix */}
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-ink">
                    ₹{item.price.toFixed(2)}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 text-[11.5px] font-semibold ${
                        statusBadge[item.status] ||
                        "border border-line bg-paper-dim text-ink/60"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredInventory.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-12 py-12 text-center text-ink/40"
                  >
                    <Package
                      size={32}
                      className="mx-auto mb-3 opacity-40"
                    />
                    <div className="text-[14px]">
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
