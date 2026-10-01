import * as React from "react";
import { cn } from "@/lib/utils";

type StatAccent = "default" | "stamp" | "danger" | "teal";

const accentMap: Record<StatAccent, string> = {
  default: "bg-paper-dim text-ink/60",
  stamp: "bg-stamp-dim text-stamp",
  danger: "bg-danger-bg text-danger",
  teal: "bg-teal-mid/10 text-teal-mid",
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: StatAccent;
  className?: string;
}

/**
 * Single source of truth for stat cards.
 * Change rounded-2xl / padding / icon box here -> all pages update.
 */
export function StatCard({ icon, label, value, sub, accent = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]",
        className
      )}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accentMap[accent])}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/50">
          {label}
        </div>
        <div className="font-display text-xl font-bold text-ink">{value}</div>
        {sub && <div className="text-[11px] text-ink/40">{sub}</div>}
      </div>
    </div>
  );
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}
