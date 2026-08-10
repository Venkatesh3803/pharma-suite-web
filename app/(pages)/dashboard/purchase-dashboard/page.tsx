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
    accent: "bg-paper-dim text-ink/60",
  },
  {
    title: "Purchase Orders Pending",
    value: "14 Orders",
    change: "3 awaiting RFQ",
    isPositive: true,
    icon: ShoppingBag,
    accent: "bg-stamp-dim text-stamp",
  },
  {
    title: "Critical Low Stock Alerts",
    value: "8 Items",
    change: "Requires GRN",
    isPositive: false,
    icon: AlertTriangle,
    accent: "bg-danger-bg text-danger",
  },
  {
    title: "Active Counter Sessions",
    value: "3 Active",
    change: "Avg speed 2.4m",
    isPositive: true,
    icon: Activity,
    accent: "bg-teal-mid/10 text-teal-mid",
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
    <div className="flex w-full flex-col gap-6">
      {/* ── Dashboard Welcoming Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Operations Overview
          </span>
          <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Store Control Center
          </h2>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Real-time status overview for counter billing terminals and
            purchasing lines.
          </p>
        </div>
      </div>

      {/* ── Metric Analytics Grid Cards ── */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {analyticalStats.map((stat, i) => (
          <div
            key={i}
            className="flex flex-col justify-between border border-line bg-white p-5"
          >
            <div className="mb-3 flex items-start justify-between">
              <span className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-ink/55 font-mono">
                {stat.title}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center ${stat.accent}`}
              >
                <stat.icon size={18} />
              </div>
            </div>
            <div className="font-display text-[22px] font-bold text-ink">
              {stat.value}
            </div>
            <div
              className={`mt-1 flex items-center gap-1 text-[12px] font-medium ${
                stat.isPositive && !stat.title.includes("Alerts")
                  ? "text-teal-mid"
                  : "text-danger"
              }`}
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
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Left Side: Recent Sales Live Stream Terminal */}
        <div className="border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-ink">
              Live Billing Streams
            </h3>
            <span className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-teal-mid font-mono">
              <span className="h-1.5 w-1.5 bg-stamp" /> Live
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {recentTransactions.map(txn => (
              <div
                key={txn.id}
                className="flex items-center justify-between border border-line bg-paper p-3 transition-colors hover:bg-paper-dim"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center bg-teal-mid/10 text-teal-mid">
                    <Pill size={15} />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink">
                      {txn.medicine}
                    </div>
                    <div className="text-[11px] text-ink/50 font-mono">
                      {txn.id} · {txn.type}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13.5px] font-bold text-ink">
                    {txn.amount}
                  </div>
                  <div
                    className={`text-[11px] font-medium ${
                      txn.status === "Completed"
                        ? "text-teal-mid"
                        : "text-danger"
                    }`}
                  >
                    {txn.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Quick Sub-Module Operational Links */}
        <div className="flex flex-col border border-line bg-white p-6">
          <h3 className="font-display text-base font-bold text-ink">
            Quick Launch Actions
          </h3>
          <p className="mb-4 mt-1 text-[12.5px] text-ink/55">
            Bypass navigational channels and load active documents immediately.
          </p>

          <div className="grid flex-1 grid-cols-2 gap-3">
            <button className="group cursor-pointer border border-dashed border-ink/30 bg-white p-4 text-left transition-colors hover:border-teal-mid">
              <div className="mb-2 text-stamp">
                <DollarSign size={18} />
              </div>
              <div className="text-[13px] font-semibold text-ink">
                New Cash Bill
              </div>
              <div className="mt-0.5 text-[11px] text-ink/50">
                Open terminal POS
              </div>
            </button>

            <button className="group cursor-pointer border border-dashed border-ink/30 bg-white p-4 text-left transition-colors hover:border-teal-mid">
              <div className="mb-2 text-stamp">
                <ClipboardList size={18} />
              </div>
              <div className="text-[13px] font-semibold text-ink">
                Draft RFQ
              </div>
              <div className="mt-0.5 text-[11px] text-ink/50">
                Request supplier quotes
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
