import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "teal" | "stamp" | "danger" | "neutral";

const toneMap: Record<BadgeTone, string> = {
  teal: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  stamp: "border border-stamp/30 bg-stamp-dim text-stamp",
  danger: "border border-danger/25 bg-danger-bg text-danger",
  neutral: "border border-line bg-paper-dim text-ink/60",
};

interface StatusBadgeProps {
  children: React.ReactNode;
  /** Preset tone — or pass legacy badge-map string via className */
  tone?: BadgeTone;
  className?: string;
}

/**
 * Single source of truth for pill badges.
 * Shape/size lives here; color comes from tone OR legacy maps
 * (stockStatusBadge, statusBadge, ...) passed as className.
 */
export function StatusBadge({ children, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-1 text-[11.5px] font-semibold",
        toneMap[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
