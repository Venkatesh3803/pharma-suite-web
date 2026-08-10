"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  ArrowUpRight,
  Filter,
  RefreshCw,
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

const inputBase =
  "w-full rounded-none border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

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

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header System ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Revenue Intelligence Ledger
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Sales & Revenue Analytics
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Analyze macro billing parameters, track multi-channel volume shares,
            and audit outstanding invoice matrices.
          </p>
        </div>

        <div className="flex gap-2">
          <button className="flex cursor-pointer items-center gap-1.5 rounded-none border border-line bg-white px-3.5 py-2 text-[13.5px] font-medium text-ink/70 transition-colors hover:bg-paper-dim">
            <RefreshCw size={14} /> Refresh Fields
          </button>
          <button className="flex cursor-pointer items-center gap-1.5 rounded-none border border-ink bg-ink px-3.5 py-2 text-[13.5px] font-semibold text-paper transition-colors hover:bg-teal-deep">
            <Download size={14} /> Export Report Summary
          </button>
        </div>
      </div>

      {/* ── Financial Ledger Cards Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="border border-line bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
                Gross Product Turnaround
              </div>
              <div className="mt-1 font-display text-[22px] font-bold text-ink">
                ₹2,06,150.00
              </div>
            </div>
            <span className="flex items-center gap-0.5 rounded-none bg-teal-mid/10 px-1.5 py-0.5 text-[11px] font-semibold text-teal-mid">
              <ArrowUpRight size={12} /> +12.4%
            </span>
          </div>
          <div className="mt-3 text-[11px] text-ink/40">
            Calculated across current batch cycle
          </div>
        </div>

        <div className="border border-line bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
                Tax Contributions (GST)
              </div>
              <div className="mt-1 font-display text-[22px] font-bold text-ink">
                ₹24,738.00
              </div>
            </div>
            <span className="rounded-none bg-paper-dim px-1.5 py-0.5 text-[11px] font-semibold text-ink/60">
              12% Avg Base
            </span>
          </div>
          <div className="mt-3 text-[11px] text-ink/40">
            Automated liability computation ledger
          </div>
        </div>

        <div className="border border-line bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50 font-mono">
                Active Volume Despatches
              </div>
              <div className="mt-1 font-display text-[22px] font-bold text-ink">
                {initialSales.length} Invoices
              </div>
            </div>
            <span className="rounded-none bg-stamp-dim px-1.5 py-0.5 text-[11px] font-semibold text-stamp">
              100% Core
            </span>
          </div>
          <div className="mt-3 text-[11px] text-ink/40">
            Zero pipeline blocks flagged today
          </div>
        </div>
      </div>

      {/* ── Double Layout: Channel Share vs Detailed Invoices Ledger ── */}
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_320px]">
        {/* LEFT COLUMN: MAIN INVOICES LEDGER CONTROL */}
        <div className="flex flex-col gap-4">
          {/* Action Filter Sub-Bar */}
          <div className="flex items-center gap-3 border border-line bg-white p-3">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <input
                type="text"
                placeholder="Search by unique invoice serial ID or corporate customer name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`${inputBase} pl-8`}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-ink/50" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className={`${inputBase} cursor-pointer`}
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
          <div className="overflow-hidden border border-line bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-line bg-paper-dim">
                    <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                      Billing Identification
                    </th>
                    <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                      Consignee Entity
                    </th>
                    <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                      Invoice Date
                    </th>
                    <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                      Settlement Mode
                    </th>
                    <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                      Tax Matrix
                    </th>
                    <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                      Gross Value
                    </th>
                    <th className="px-4 py-3.5 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/55">
                      State
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(sale => (
                    <tr
                      key={sale.invoiceNo}
                      className="border-b border-line/60 transition-colors hover:bg-paper/70"
                    >
                      <td className="px-4 py-3.5 font-mono font-semibold text-ink">
                        {sale.invoiceNo}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-ink/70">
                          {sale.customer}
                        </div>
                        <div className="text-[11px] text-ink/40">
                          Contains {sale.itemsCount} SKUs
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-ink/50">{sale.date}</td>
                      <td className="px-4 py-3.5 text-[12.5px] text-ink/60">
                        {sale.paymentMode}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-ink/50">
                        ₹{sale.tax.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-ink">
                        ₹{sale.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-semibold ${
                            sale.status === "Settled"
                              ? "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid"
                              : "border border-stamp/30 bg-stamp-dim text-stamp"
                          }`}
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
        <div className="flex flex-col gap-4">
          <div className="border border-line bg-white p-4">
            <div className="mb-3.5 flex items-center gap-2 border-b border-line pb-3">
              <BarChart3 size={16} className="text-stamp" />
              <h3 className="font-display text-[14px] font-bold text-ink">
                Channel Split Matrix
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {channelSales.map((chan, idx) => (
                <div
                  key={idx}
                  className="rounded-none border border-line bg-paper p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ink/70">
                      {chan.channel}
                    </span>
                    <span className="font-mono text-[12px] font-bold text-stamp">
                      {chan.share}
                    </span>
                  </div>

                  {/* Visual Proportion Bar Layout */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-none bg-line">
                    <div
                      className={`h-full ${
                        idx === 0
                          ? "bg-ink"
                          : idx === 1
                            ? "bg-teal-mid"
                            : "bg-stamp"
                      }`}
                      style={{ width: chan.share }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-[11px] text-ink/50">
                    <span>{chan.transactions} Transactions</span>
                    <span className="font-mono font-semibold text-ink">
                      {chan.grossVolume}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-none border border-dashed border-teal-mid/40 bg-teal-mid/10 p-2.5 text-center text-[12px] font-medium text-teal-mid">
              B2B distribution volumes increased by 4% over the last 48 hours.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
