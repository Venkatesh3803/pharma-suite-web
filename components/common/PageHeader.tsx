import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Single source of truth for back navigation above headers / error states.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink/55 transition-colors hover:text-stamp"
    >
      <ArrowLeft size={14} /> {label}
    </Link>
  );
}

interface PageHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  backLink?: { href: string; label: string };
}

/**
 * Single source of truth for page headers.
 * Replaces ~34 copies of eyebrow+h1+sub markup.
 */
export function PageHeader({ eyebrow, title, description, actions, className, backLink }: PageHeaderProps) {
  return (
    <div className={className}>
      {backLink && (
        <div className="mb-2">
          <BackLink href={backLink.href} label={backLink.label} />
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp">
            {eyebrow}
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-[13.5px] text-ink/55">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
