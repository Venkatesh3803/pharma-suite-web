"use client";

import { useId } from "react";
import type { TrendPoint } from "@/lib/api";

const INK = "#14201c";
const TEAL = "#1b5a50";
const STAMP = "#c1652b";
const STAMP_SOFT = "rgba(193, 101, 43, 0.14)";
const LINE = "#ded7c4";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function monthLabel(key: string): string {
  const m = Number(key.slice(5, 7));
  return Number.isFinite(m) && m >= 1 && m <= 12 ? MONTH_SHORT[m - 1] : key;
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100000) return `${Math.round(n / 1000)}k`;
  if (abs >= 10000) return `${Math.round(n / 1000)}k`;
  if (abs >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

/** Multi-series revenue vs expenses line chart with a soft area fill. */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  const gradId = useId();
  const W = 640;
  const H = 240;
  const PAD = { top: 16, right: 12, bottom: 28, left: 46 };

  if (!data.length || data.every(d => d.revenue === 0 && d.expenses === 0)) {
    return (
      <div className="flex h-56 items-center justify-center text-[13px] text-ink/45">
        No monthly activity yet — postings will appear here.
      </div>
    );
  }

  const all = data.flatMap(d => [d.revenue, d.expenses]);
  const max = Math.max(...all.map(Math.abs), 1);
  const niceMax = Math.ceil(max / (max / 4)) * (max / 4) || 1;
  const top = niceMax * 1.15;

  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const n = data.length;

  const px = (i: number) => PAD.left + (n > 1 ? (i * iw) / (n - 1) : 0);
  const py = (v: number) => PAD.top + ih - (v / top) * ih;

  const line = (key: "revenue" | "expenses") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(Math.max(0, d[key])).toFixed(1)}`).join(" ");

  const area = (key: "revenue" | "expenses") =>
    `${data
      .map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(Math.max(0, d[key])).toFixed(1)}`)
      .join(" ")} L${px(n - 1).toFixed(1)},${PAD.top + ih} L${PAD.left},${PAD.top + ih} Z`;

  const grid = [0.25, 0.5, 0.75, 1].map(f => PAD.top + ih - f * ih);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Revenue and expenses over time">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.22" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {grid.map((y, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke={LINE} strokeWidth="1" strokeDasharray="3 4" />
          <text x={PAD.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill={INK} opacity="0.45" fontFamily="ui-monospace, monospace">
            {fmt(top * (1 - i * 0.25))}
          </text>
        </g>
      ))}

      <path d={area("expenses")} fill={STAMP_SOFT} />
      <path d={area("revenue")} fill={`url(#${gradId})`} />
      <path d={line("revenue")} fill="none" stroke={TEAL} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={line("expenses")} fill="none" stroke={STAMP} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {data.map((d, i) => (
        <text
          key={d.month}
          x={px(i)}
          y={H - 8}
          textAnchor="middle"
          fontSize="10"
          fill={INK}
          opacity="0.5"
          fontFamily="ui-monospace, monospace"
        >
          {monthLabel(d.month)}
        </text>
      ))}

      {data.map((d, i) =>
        d.revenue === 0 && d.expenses === 0 ? null : (
          <circle key={d.month} cx={px(i)} cy={py(Math.max(0, d.revenue))} r="2.5" fill={TEAL} />
        ),
      )}
    </svg>
  );
}

/** Donut chart for proportional breakdowns (expense mix, cash composition). */
export function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  const segs = segments.filter(s => s.value > 0);
  const cumStarts = segs.map((_, i) => segs.slice(0, i).reduce((a, s) => a + Math.max(0, s.value), 0) / total);

  if (total <= 0) {
    return (
      <div className="flex h-36 items-center justify-center text-[12.5px] text-ink/45">
        No data yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label={centerLabel}>
        <circle cx="60" cy="60" r={R} fill="none" stroke={LINE} strokeWidth="16" />
        {segs.map((s, i) => {
          const frac = s.value / total;
          const dash = Math.max(0, frac * C - 2);
          const offset = C * (1 - cumStarts[i] - frac) + 1;
          return (
            <circle
              key={s.label}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
            />
          );
        })}
        <text x="60" y="58" textAnchor="middle" fontSize="15" fontWeight="700" fill={INK} fontFamily="ui-monospace, monospace">
          {centerValue}
        </text>
        <text x="60" y="72" textAnchor="middle" fontSize="8.5" fill={INK} opacity="0.5" letterSpacing="0.08em">
          {centerLabel}
        </text>
      </svg>
      <div className="grid w-full gap-1.5">
        {segments.map(s => (
          <div key={s.label} className="flex items-center justify-between text-[12px]">
            <span className="flex items-center gap-1.5 text-ink/70">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="font-mono text-ink/80">{fmt(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Thin horizontal bars used for revenue / expense line items. */
export function HBars({
  rows,
  color = TEAL,
}: {
  rows: { label: string; amount: number }[];
  color?: string;
}) {
  const max = Math.max(...rows.map(r => Math.abs(r.amount)), 1);
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.label}>
          <div className="mb-0.5 flex items-baseline justify-between text-[12.5px]">
            <span className="truncate text-ink/75">{r.label}</span>
            <span className="font-mono text-ink">{fmt(r.amount)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-dim">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (Math.abs(r.amount) / max) * 100)}%`,
                backgroundColor: r.amount < 0 ? "rgba(178,58,46,0.55)" : color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tiny inline sparkline for KPI cards. */
export function Sparkline({ points, color = TEAL, height = 34 }: { points: number[]; color?: string; height?: number }) {
  const W = 120;
  const H = height;
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const px = (i: number) => (i / (points.length - 1)) * W;
  const py = (v: number) => H - 4 - ((v - min) / range) * (H - 8);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(p).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-full" preserveAspectRatio="none" role="img" aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export { TEAL, STAMP, INK };
