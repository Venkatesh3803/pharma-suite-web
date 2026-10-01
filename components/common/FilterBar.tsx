import * as React from "react";
import { Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputBase } from "./fields";

/**
 * Single source of truth for filter bars + search + selects.
 */

export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(20,32,28,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onEnter?: () => void;
  wrapperClassName?: string;
}

export function SearchInput({ onEnter, className, wrapperClassName, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative flex-1", wrapperClassName)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
      />
      <input
        {...props}
        onKeyDown={e => {
          if (e.key === "Enter") onEnter?.();
          props.onKeyDown?.(e);
        }}
        className={cn(inputBase, "pl-9", className)}
      />
    </div>
  );
}

export function FilterSelect({
  children,
  className,
  showIcon = true,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { showIcon?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {showIcon && <Filter size={15} className="shrink-0 text-ink/50" />}
      <select {...props} className={cn(inputBase, "cursor-pointer", className)}>
        {children}
      </select>
    </div>
  );
}
