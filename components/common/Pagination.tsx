import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Left-side label, e.g. "1–20 of 132" */
  label?: ReactNode;
  /** card = inside TableShell footer · bare = standalone row below table */
  variant?: "card" | "bare";
  className?: string;
}

/**
 * Single source of truth for pagination.
 * Used inside TableShell footer (border-t style) — one change updates all lists.
 */
export function Pagination({ page, totalPages, onChange, label, variant = "card", className }: PaginationProps) {
  return (
    <div
      className={cn(
        variant === "card"
          ? "flex items-center justify-between border-t border-line bg-paper-dim px-4 py-2.5 text-[12.5px] text-ink/55"
          : "flex items-center justify-between text-[12.5px] text-ink/50",
        className
      )}
    >
      <span>{label ?? `Page ${page} of ${totalPages}`}</span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 font-medium text-ink/70 transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={13} /> Prev
        </button>
        <span className="font-mono">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          className="flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 font-medium text-ink/70 transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
