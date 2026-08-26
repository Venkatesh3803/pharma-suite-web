"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  Bell,
  BellRing,
  CheckCheck,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  alertsApi,
  type AlertItem,
  type AlertListResult,
  type AlertSeverity,
  type AlertStatus,
  type AlertType,
} from "@/lib/api";
import { formatDateTime } from "@/lib/inventory";

type LoadState = "loading" | "error" | "ready";

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  LOW_STOCK: "Low Stock",
  STOCKOUT_RISK: "Stockout Risk",
  EXPIRY: "Expiry",
  DEAD_STOCK: "Dead Stock",
  PRICE_VARIANCE: "Price Variance",
  PENDING_PURCHASE: "Pending Purchase",
  SYSTEM: "System",
};

const ALERT_SEVERITY_BADGE: Record<AlertSeverity, string> = {
  CRITICAL: "border border-danger/40 bg-danger text-paper",
  HIGH: "border border-danger/30 bg-danger-bg text-danger",
  MEDIUM: "border border-stamp/30 bg-stamp-dim text-stamp",
  LOW: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
};

const ALERT_SEVERITY_DOT: Record<AlertSeverity, string> = {
  CRITICAL: "bg-danger",
  HIGH: "bg-danger",
  MEDIUM: "bg-stamp",
  LOW: "bg-teal-mid",
};

export default function AlertsPage() {
  const [result, setResult] = useState<AlertListResult | null>(null);
  const [unread, setUnread] = useState(0);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [type, setType] = useState<AlertType | "ALL">("ALL");
  const [severity, setSeverity] = useState<AlertSeverity | "ALL">("ALL");
  const [status, setStatus] = useState<AlertStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 20;

  const loadUnread = async () => {
    try {
      const data = await alertsApi.unreadCount();
      setUnread(data.unread);
    } catch {
      // non-fatal; badge stays at last known value
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [data, count] = await Promise.all([alertsApi.list({
          type: type === "ALL" ? "" : type,
          severity: severity === "ALL" ? "" : severity,
          status: status === "ALL" ? "ALL" : status,
          page,
          pageSize,
        }), alertsApi.unreadCount()]);
        if (!ignore) {
          setResult(data);
          setUnread(count.unread);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load alerts.");
          setState("error");
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [type, severity, status, page, refreshKey]);

  const retry = () => {
    setState("loading");
    setError("");
    setRefreshKey(k => k + 1);
  };

  const markRead = async (id: string) => {
    try {
      await alertsApi.markRead(id);
      setResult(prev =>
        prev
          ? {
              ...prev,
              items: prev.items.map(a =>
                a.id === id ? { ...a, isRead: true, status: "READ" as const } : a,
              ),
            }
          : prev,
      );
      loadUnread();
    } catch {
      // keep item unchanged on failure
    }
  };

  const markAllRead = async () => {
    try {
      const res = await alertsApi.markAllRead();
      if (res.updated > 0) {
        setResult(prev =>
          prev
            ? {
                ...prev,
                items: prev.items.map(a => ({ ...a, isRead: true, status: "READ" as const })),
              }
            : prev,
        );
        loadUnread();
      }
    } catch {
      // silent
    }
  };

  const dismiss = async (id: string) => {
    try {
      await alertsApi.dismiss(id);
      setResult(prev =>
        prev ? { ...prev, items: prev.items.filter(a => a.id !== id) } : prev,
      );
      loadUnread();
    } catch {
      // keep item unchanged on failure
    }
  };

  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / pageSize));
  const hasActiveFilters = type !== "ALL" || severity !== "ALL" || status !== "ALL";

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
              Notification Center
            </span>
            <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
              Alerts & Notifications
            </h1>
            <p className="mt-1 text-[13.5px] text-ink/55">
              Expiry, stockout, dead-stock and reorder flags raised by the daily
              intelligence engine.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unread > 0 && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 font-display text-2xl font-bold text-stamp">
                  <BellRing size={20} />
                  {unread}
                </div>
                <div className="text-[11px] uppercase tracking-[0.08em] text-ink/45 font-mono">
                  unread
                </div>
              </div>
            )}
            <button
              onClick={markAllRead}
              disabled={unread === 0 || state !== "ready"}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-teal-mid hover:text-teal-mid disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck size={15} /> Mark all read
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <select
          value={type}
          onChange={e => {
            setType(e.target.value as AlertType | "ALL");
            setPage(1);
          }}
          className="w-56 cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body"
        >
          <option value="ALL">All Alert Types</option>
          {(Object.keys(ALERT_TYPE_LABELS) as AlertType[]).map(t => (
            <option key={t} value={t}>
              {ALERT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={severity}
          onChange={e => {
            setSeverity(e.target.value as AlertSeverity | "ALL");
            setPage(1);
          }}
          className="w-44 cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={status}
          onChange={e => {
            setStatus(e.target.value as AlertStatus | "ALL");
            setPage(1);
          }}
          className="w-40 cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body"
        >
          <option value="ALL">Any Status</option>
          <option value="ACTIVE">Active</option>
          <option value="READ">Read</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setType("ALL");
              setSeverity("ALL");
              setStatus("ALL");
              setPage(1);
            }}
            className="ml-auto cursor-pointer rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold text-ink/55 transition-colors hover:border-danger/40 hover:text-danger"
          >
            Clear filters
          </button>
        )}
      </div>

      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <AlertTriangle size={32} className="text-danger/60" />
          <div>
            <div className="text-[14px] font-medium text-ink">
              Could not load alerts.
            </div>
            <div className="mt-1 text-[12.5px] text-ink/50">{error}</div>
          </div>
          <button
            onClick={retry}
            className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className="w-3 px-4 py-3.5" />
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  When
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Severity
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Type
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Message
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {state === "loading" && (
                <tr>
                  <td colSpan={7} className="px-12 py-14">
                    <div className="flex items-center justify-center gap-2 text-[13px] text-ink/45">
                      <Loader2 size={16} className="animate-spin" /> Loading alerts…
                    </div>
                  </td>
                </tr>
              )}
              {state === "ready" &&
                result?.items.map((alert: AlertItem) => (
                  <tr
                    key={alert.id}
                    className={`border-b border-line/60 transition-colors hover:bg-paper/70 ${
                      !alert.isRead ? "bg-stamp-dim/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className={`block h-2 w-2 rounded-full ${
                          ALERT_SEVERITY_DOT[alert.severity]
                        } ${alert.isRead ? "opacity-25" : ""}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink/60">
                      {formatDateTime(alert.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          ALERT_SEVERITY_BADGE[alert.severity]
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[12px] font-medium text-ink/70">
                        {ALERT_TYPE_LABELS[alert.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className={`font-semibold ${alert.isRead ? "text-ink/70" : "text-ink"}`}>
                        {alert.title}
                      </div>
                      <div className="mt-0.5 text-[12.5px] text-ink/50">
                        {alert.message}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {!alert.isRead && (
                          <button
                            onClick={() => markRead(alert.id)}
                            title="Mark as read"
                            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-semibold text-teal-mid transition-colors hover:bg-teal-mid/10"
                          >
                            <CheckCheck size={14} /> Read
                          </button>
                        )}
                        <button
                          onClick={() => dismiss(alert.id)}
                          title="Dismiss alert"
                          className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-semibold text-ink/50 transition-colors hover:bg-danger/10 hover:text-danger"
                        >
                          <X size={14} /> Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {state === "ready" && result && result.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-12 py-12 text-center text-ink/40">
                    <Bell size={32} className="mx-auto mb-3 opacity-40" />
                    <div className="text-[14px]">
                      {hasActiveFilters
                        ? "No alerts match your filters."
                        : "All clear — no active alerts right now."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {result && result.total > 0 && (
          <div className="flex items-center justify-between border-t border-line bg-paper-dim px-4 py-2.5 text-[12.5px] text-ink/55">
            <span>
              {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, result.total)} of {result.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-line text-ink/60 transition-colors hover:border-teal-mid hover:text-teal-mid disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-mono text-[12px]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-line text-ink/60 transition-colors hover:border-teal-mid hover:text-teal-mid disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}