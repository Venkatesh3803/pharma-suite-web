import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { PrimaryButton } from "./buttons";

/**
 * Single source of truth for full-width error cards.
 * Table-level loading/empty live in DataTable (LoadingRow/EmptyRow).
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  icon,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
      {icon ?? <AlertTriangle size={32} className="text-danger/60" />}
      <div>
        <div className="text-[14px] font-medium text-ink">{title}</div>
        {description && (
          <div className="mt-1 text-[12.5px] text-ink/50">{description}</div>
        )}
      </div>
      {onRetry && (
        <PrimaryButton onClick={onRetry}>{retryLabel}</PrimaryButton>
      )}
    </div>
  );
}
