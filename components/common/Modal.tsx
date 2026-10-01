import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const widthMap = {
  md: "max-w-md",
  lg: "max-w-lg",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
} as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: keyof typeof widthMap;
  className?: string;
  bodyClassName?: string;
}

/**
 * Single source of truth for modals.
 * Replaces 7+ copies of fixed inset-0 + card markup.
 */
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  description,
  children,
  footer,
  width = "lg",
  className,
  bodyClassName,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4">
      <div
        className={cn(
          "w-full rounded-2xl border border-line bg-white shadow-xl",
          widthMap[width],
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            {eyebrow && (
              <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp">
                {eyebrow}
              </div>
            )}
            <div className="mt-0.5 font-display text-lg font-semibold text-ink">
              {title}
            </div>
            {description && (
              <div className="mt-0.5 text-[12.5px] text-ink/50">{description}</div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1 text-ink/50 transition-colors hover:bg-paper-dim hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-paper-dim px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
