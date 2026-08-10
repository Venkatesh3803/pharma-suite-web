"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Truck,
  Clock,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
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

const poBadge: Record<string, string> = {
  "Fully Received": "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  "Awaiting GRN": "border border-stamp/30 bg-stamp-dim text-stamp",
  "Pending Approval": "border border-ink/25 bg-paper-dim text-ink/70",
};

const inputBase =
  "w-full rounded-none border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

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
    <div className="flex w-full flex-col gap-6">
      {/* ── Header System ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Vendor Compliance Ledger
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Procurement & Supply Chain Engine
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Manage wholesale medical distributors, generate purchase orders, and
            track fulfillment lifecycles.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-none bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-colors hover:bg-teal-deep focus:outline-none focus:ring-2 focus:ring-teal-mid/30">
          <Plus size={16} /> Raise New Purchase Order
        </button>
      </div>

      {/* ── Procurement Pipelines High-Level Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-3.5 border border-line bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center bg-paper-dim text-ink/60">
            <Building2 size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              Contracted Suppliers
            </div>
            <div className="font-display text-lg font-bold text-ink">
              {initialSuppliers.length} Wholesalers
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border border-line bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center bg-stamp-dim text-stamp">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              Pending Sign-Off
            </div>
            <div className="font-display text-lg font-bold text-stamp">
              1 Order
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border border-line bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center bg-teal-mid/10 text-teal-mid">
            <Truck size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              Awaiting Warehouse GRN
            </div>
            <div className="font-display text-lg font-bold text-teal-mid">
              1 Pipeline
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border border-line bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center bg-teal-mid/10 text-teal-mid">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
              Fulfilled This Month
            </div>
            <div className="font-display text-lg font-bold text-teal-mid">
              28 Batches
            </div>
          </div>
        </div>
      </div>

      {/* ── Segment Controller & Action Row ── */}
      <div className="flex items-center justify-between gap-3 border border-line bg-white p-3">
        {/* Tab Selection */}
        <div className="flex gap-1 rounded-none bg-paper-dim p-1">
          <button
            onClick={() => {
              setActiveTab("suppliers");
              setSearchTerm("");
            }}
            className={`cursor-pointer rounded-none px-4 py-1.5 text-[13px] font-semibold transition-colors ${
              activeTab === "suppliers"
                ? "bg-white text-ink shadow-sm"
                : "text-ink/50 hover:text-ink"
            }`}
          >
            Registered Suppliers
          </button>
          <button
            onClick={() => {
              setActiveTab("pos");
              setSearchTerm("");
            }}
            className={`cursor-pointer rounded-none px-4 py-1.5 text-[13px] font-semibold transition-colors ${
              activeTab === "pos"
                ? "bg-white text-ink shadow-sm"
                : "text-ink/50 hover:text-ink"
            }`}
          >
            Purchase Orders History
          </button>
        </div>

        {/* Dynamic Search Box Input */}
        <div className="relative w-[300px]">
          <Search
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/40"
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
            className={`${inputBase} pl-8`}
          />
        </div>
      </div>

      {/* ── Content View Blocks ── */}
      <div className="overflow-hidden border border-line bg-white">
        {/* RENDER TABLE 1: SUPPLIERS PANEL */}
        {activeTab === "suppliers" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim">
                  <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Supplier Details
                  </th>
                  <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Key Point of Contact
                  </th>
                  <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Communication Details
                  </th>
                  <th className="px-4 py-3.5 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Active POs
                  </th>
                  <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Total Gross Outlay
                  </th>
                  <th className="px-4 py-3.5 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(sup => (
                  <tr
                    key={sup.id}
                    className="border-b border-line/60 transition-colors hover:bg-paper/70"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink">{sup.name}</div>
                      <div className="mt-0.5 text-[11px] text-ink/40 font-mono">
                        ID: {sup.id}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink/70">
                      {sup.contactPerson}
                    </td>
                    <td className="px-4 py-3.5 text-ink/60">
                      <div className="flex items-center gap-1 text-[12px]">
                        <Phone size={12} className="text-ink/40" /> {sup.phone}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[12px] text-ink/50">
                        <Mail size={12} className="text-ink/40" /> {sup.email}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 text-[12px] font-semibold ${
                          sup.activePOs > 0
                            ? "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid"
                            : "border border-line bg-paper-dim text-ink/50"
                        }`}
                      >
                        {sup.activePOs} running
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-ink">
                      {sup.totalSpent}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="rounded-none bg-stamp-dim px-2 py-0.5 text-[11px] font-bold text-stamp font-mono">
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim">
                  <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    PO Number
                  </th>
                  <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Target Vendor Distributor
                  </th>
                  <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Order Date
                  </th>
                  <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Est. Delivery
                  </th>
                  <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Line Elements
                  </th>
                  <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Total Amount
                  </th>
                  <th className="px-4 py-3.5 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                    Fulfillment Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.map(po => (
                  <tr
                    key={po.poNo}
                    className="border-b border-line/60 transition-colors hover:bg-paper/70"
                  >
                    <td className="px-4 py-3.5 font-mono font-semibold text-ink">
                      <div className="group flex cursor-pointer items-center gap-1 transition-colors hover:text-stamp">
                        {po.poNo} <ExternalLink size={12} className="opacity-50" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink/70">
                      {po.supplier}
                    </td>
                    <td className="px-4 py-3.5 text-ink/50">{po.orderDate}</td>
                    <td className="px-4 py-3.5 text-ink/50">
                      {po.deliveryDate}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink/60">
                      {po.itemsCount} variations
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-ink">
                      {po.totalAmount}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11.5px] font-semibold ${
                          poBadge[po.status] ||
                          "border border-line bg-paper-dim text-ink/60"
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Fallback View when search returns empty array results */}
        {((activeTab === "suppliers" && filteredSuppliers.length === 0) ||
          (activeTab === "pos" && filteredPOs.length === 0)) && (
          <div className="px-12 py-12 text-center text-ink/40">
            <ClipboardList size={32} className="mx-auto mb-3 opacity-40" />
            <div className="text-[14px]">
              No procurement elements or record files discovered matching your
              search term.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
