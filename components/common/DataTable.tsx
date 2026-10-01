import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for tables.
 * Owns: outer shell, th/td padding + typography, row hover, loading/empty rows.
 */

// ── Shell ──────────────────────────────────────────────
export function TableShell({
  children,
  header,
  footer,
  className,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]",
        className
      )}
    >
      {header && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          {header}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13.5px]">
          {children}
        </table>
      </div>
      {footer}
    </div>
  );
}

// ── Cells ──────────────────────────────────────────────
type Align = "left" | "center" | "right";

export function Th({
  children = null,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: Align;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase",
        align === "left" && "tracking-[0.12em] text-ink/40",
        align !== "left" && "tracking-[0.08em] text-ink/55",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  align?: Align;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3.5",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </td>
  );
}

export function TableRow({
  children,
  onClick,
  className,
  hoverClassName = "hover:bg-paper/70",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hoverClassName?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-line/60 transition-colors",
        onClick && `cursor-pointer ${hoverClassName}`,
        className
      )}
    >
      {children}
    </tr>
  );
}

// ── State rows ─────────────────────────────────────────
export function LoadingRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-12 py-14">
        <div className="flex items-center justify-center gap-2 text-[13px] text-ink/45">
          <Loader2 size={16} className="animate-spin" />
          {message}
        </div>
      </td>
    </tr>
  );
}

export function EmptyRow({
  colSpan,
  icon,
  message,
}: {
  colSpan: number;
  icon?: React.ReactNode;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-12 py-12 text-center text-ink/40">
        {icon && <div className="mx-auto mb-3 flex justify-center opacity-40">{icon}</div>}
        <div className="text-[14px]">{message}</div>
      </td>
    </tr>
  );
}
