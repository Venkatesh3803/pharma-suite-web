"use client";

import React from "react";
import {
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
    accent: "bg-paper-dim text-ink/60",
  },
  {
    title: "Sales Invoices Issued",
    value: "142 Invoices",
    change: "+8.4%",
    isPositive: true,
    icon: ShoppingCart,
    accent: "bg-teal-mid/10 text-teal-mid",
  },
  {
    title: "Average Ticket Size",
    value: "₹593.00",
    change: "-2.1%",
    isPositive: false,
    icon: CreditCard,
    accent: "bg-stamp-dim text-stamp",
  },
  {
    title: "Pending Counter Credit",
    value: "₹4,120.00",
    change: "3 Accounts",
    isPositive: true,
    icon: Activity,
    accent: "bg-danger-bg text-danger",
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

const badgeStyles: Record<string, string> = {
  Paid: "bg-teal-mid/10 text-teal-mid border border-teal-mid/25",
  Due: "bg-stamp-dim text-stamp border border-stamp/25",
};

const stockBadgeStyles: Record<string, string> = {
  Healthy: "text-teal-mid",
  "Low Stock": "text-stamp",
  Critical: "text-danger",
};

export default function SalesDashboard() {
  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header Area ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Retail Performance Ledger
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Sales Analysis Workstation
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Real-time retail metrics, counter ledger settlements, and stock
            clearance velocities.
          </p>
        </div>
        <div className="flex gap-3">
          <select className="cursor-pointer rounded-none border border-line bg-white px-3 py-2 text-[13.5px] font-medium text-ink/70 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15">
            <option>Terminal: All Registers</option>
            <option>Counter Terminal 01</option>
            <option>Counter Terminal 02</option>
          </select>
          <div className="flex items-center gap-1.5 border border-ink bg-ink px-4 py-2 text-[13.5px] font-semibold text-paper">
            <span className="h-1.5 w-1.5 bg-stamp" /> Today
          </div>
        </div>
      </div>

      {/* ── Stats Metric Grid ── */}
      <div className="grid w-full gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-3 border border-line bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <span className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-ink/55 font-mono">
                {stat.title}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center ${stat.accent}`}
              >
                <stat.icon size={18} />
              </div>
            </div>
            <div>
              <div className="font-display text-[22px] font-bold tracking-tight text-ink">
                {stat.value}
              </div>
              <div className="mt-1 flex items-center gap-1">
                {stat.isPositive ? (
                  <ArrowUpRight size={14} className="text-teal-mid" />
                ) : (
                  <ArrowDownRight size={14} className="text-danger" />
                )}
                <span
                  className={`text-[12px] font-semibold ${
                    stat.isPositive ? "text-teal-mid" : "text-danger"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-[11px] text-ink/40">vs yesterday</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Dashboard Split Columns ── */}
      <div className="grid w-full gap-6 xl:grid-cols-2">
        {/* Left Column: Recent Counter Transactions */}
        <div className="flex flex-col border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Live Terminal Invoices
              </h3>
              <p className="mt-0.5 text-[12px] text-ink/45">
                Instant view of running retail transactions
              </p>
            </div>
            <span className="cursor-pointer text-[12px] font-medium text-stamp hover:text-teal-mid">
              View All Invoices
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-2 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/50">
                    Invoice ID
                  </th>
                  <th className="px-2 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/50">
                    Customer
                  </th>
                  <th className="px-2 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/50">
                    Payment
                  </th>
                  <th className="px-2 py-2.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/50">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(sale => (
                  <tr
                    key={sale.id}
                    className="border-b border-line/60 transition-colors hover:bg-paper/70"
                  >
                    <td className="px-2 py-3">
                      <div className="font-mono font-semibold text-ink">
                        {sale.id}
                      </div>
                      <div className="text-[11px] font-normal text-ink/40">
                        {sale.time}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-ink/70">
                      <div>{sale.customer}</div>
                      <div className="text-[11px] text-ink/40">
                        {sale.items} line items
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-semibold ${
                          badgeStyles[sale.status] ||
                          "border border-line bg-paper-dim text-ink/60"
                        }`}
                      >
                        {sale.method}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right font-mono font-semibold text-ink">
                      {sale.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Moving Inventory Stock */}
        <div className="flex flex-col border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Top High-Velocity Elements
              </h3>
              <p className="mt-0.5 text-[12px] text-ink/45">
                Fastest moving pharmaceutical SKUs today
              </p>
            </div>
            <span className="cursor-pointer text-[12px] font-medium text-stamp hover:text-teal-mid">
              Analyze Velocity
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {topMovingMedicines.map((med, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border border-line bg-paper p-2.5 transition-colors hover:bg-paper-dim"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center border border-line bg-white text-ink/50">
                    <Package size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-ink">
                      {med.name}
                    </div>
                    <div className="text-[11px] text-ink/40">{med.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[13px] font-bold text-ink">
                    {med.unitsSold} units
                  </div>
                  <div
                    className={`text-[11px] font-medium ${
                      stockBadgeStyles[med.status] || "text-ink/50"
                    }`}
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
