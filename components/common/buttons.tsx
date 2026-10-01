import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for buttons.
 * Primary = dark ink button used in headers / filters / error retry.
 * Secondary = bordered white button used for row actions / pagination-alt.
 */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-[12px] font-semibold text-ink/70 transition-colors hover:border-stamp hover:text-stamp disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}
