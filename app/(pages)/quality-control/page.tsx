"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FlaskConical,
  Loader2,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  branchesApi,
  qualityApi,
  type PendingQCBatch,
  type QualityCheckType,
  type QualityControlCheckRow,
  type QualityControlStatus,
} from "@/lib/api";
import { formatDateTime } from "@/lib/inventory";
import { useAppSelector } from "@/lib/redux/hooks";

type LoadState = "loading" | "error" | "ready";

const STATUS_BADGE: Record<QualityControlStatus, string> = {
  PENDING: "border border-stamp/30 bg-stamp-dim text-stamp",
  PASSED: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  FAILED: "border border-danger/25 bg-danger-bg text-danger",
  QUARANTINED: "border border-amber-400/30 bg-amber-400/10 text-amber-700",
  RELEASED: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  DISPOSED: "border border-ink/20 bg-ink/5 text-ink/50",
};

const STATUS_LABEL: Record<QualityControlStatus, string> = {
  PENDING: "Pending",
  PASSED: "Passed",
  FAILED: "Failed",
  QUARANTINED: "Quarantined",
  RELEASED: "Released",
  DISPOSED: "Disposed",
};

const CHECK_TYPE_LABEL: Record<QualityCheckType, string> = {
  RECEIPT_INSPECTION: "Receipt Inspection",
  STORAGE_CONDITION: "Storage Condition",
  EXPIRY_VERIFICATION: "Expiry Verification",
  LABEL_VERIFICATION: "Label Verification",
  ROUTINE_INSPECTION: "Routine Inspection",
};

const inputBase =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

export default function QualityControlPage() {
  const user = useAppSelector(state => state.auth.user);
  const canManage =
    user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "MANAGER";

  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ items: QualityControlCheckRow[]; total: number } | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [status, setStatus] = useState<QualityControlStatus | "ALL">("ALL");
  const [branchId, setBranchId] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 20;

  const [pendingBatches, setPendingBatches] = useState<PendingQCBatch[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Create form state
  const [batchQuery, setBatchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<PendingQCBatch | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [checkType, setCheckType] = useState<QualityCheckType>("RECEIPT_INSPECTION");
  const [decision, setDecision] = useState<"PASSED" | "FAILED" | "QUARANTINE">("PASSED");
  const [temperatureC, setTemperatureC] = useState("");
  const [condition, setCondition] = useState("");
  const [passedItems, setPassedItems] = useState("");
  const [failedItems, setFailedItems] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [data, b, pending] = await Promise.all([
          qualityApi.list({
            status: status === "ALL" ? "ALL" : status,
            branchId: branchId || undefined,
            page,
            pageSize,
          }),
          branchesApi.list(),
          qualityApi.pendingBatches(branchId || undefined),
        ]);
        if (!ignore) {
          setResult(data);
          setBranches(b);
          setPendingBatches(pending);
          setPendingCount(pending.length);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load quality control records.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [status, branchId, page, refreshKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const refresh = () => setRefreshKey(k => k + 1);
  const retry = () => {
    setState("loading");
    refresh();
  };

  const filteredBatches = batchQuery.trim()
    ? pendingBatches.filter(b =>
        `${b.product.brand} ${b.batchNumber} ${b.product.genericName ?? ""}`
          .toLowerCase()
          .includes(batchQuery.toLowerCase()),
      )
    : pendingBatches;

  const submit = async () => {
    if (!selectedBatch) {
      setToast("Select a batch to inspect.");
      return;
    }
    setSaving(true);
    try {
      await qualityApi.create({
        batchId: selectedBatch.id,
        branchId: selectedBatch.branch?.id,
        checkType,
        decision,
        temperatureC: temperatureC ? Number(temperatureC) : undefined,
        condition: condition.trim() || undefined,
        passedItems: passedItems.split(",").map(s => s.trim()).filter(Boolean),
        failedItems: failedItems.split(",").map(s => s.trim()).filter(Boolean),
        notes: notes.trim() || undefined,
      });
      setToast(
        decision === "PASSED"
          ? "Batch passed quality inspection."
          : decision === "FAILED"
            ? "Quality check recorded as failed."
            : "Batch quarantined pending re-inspection.",
      );
      setShowModal(false);
      setSelectedBatch(null);
      setBatchQuery("");
      setPassedItems("");
      setFailedItems("");
      setNotes("");
      setTemperatureC("");
      setCondition("");
      setPage(1);
      refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not record quality check.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, s: "RELEASED" | "DISPOSED") => {
    try {
      await qualityApi.update(id, { status: s });
      setToast(s === "RELEASED" ? "Batch released from quarantine." : "Batch marked as disposed.");
      refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not update quality check.");
    }
  };

  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / pageSize));

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Good Manufacturing Practice · GMP
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Quality Control
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Inspect incoming and stored batches, quarantine suspect stock and track
            disposition decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[12.5px] font-semibold text-amber-700">
              <ShieldAlert size={14} />
              {pendingCount} batch{pendingCount === 1 ? "" : "es"} awaiting inspection
            </div>
          )}
          {canManage && (
            <button
              onClick={() => {
                setSelectedBatch(null);
                setBatchQuery("");
                setPickerOpen(false);
                setShowModal(true);
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
            >
              <ClipboardCheck size={15} /> New QC Check
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={e => {
            setStatus(e.target.value as QualityControlStatus | "ALL");
            setPage(1);
          }}
          className="w-44 cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body"
        >
          <option value="ALL">Any Result</option>
          <option value="PENDING">Pending</option>
          <option value="PASSED">Passed</option>
          <option value="FAILED">Failed</option>
          <option value="QUARANTINED">Quarantined</option>
          <option value="RELEASED">Released</option>
          <option value="DISPOSED">Disposed</option>
        </select>
        <select
          value={branchId}
          onChange={e => {
            setBranchId(e.target.value);
            setPage(1);
          }}
          className="w-56 cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body"
        >
          <option value="">All Branches</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <AlertTriangle size={32} className="text-danger/60" />
          <div>
            <div className="text-[14px] font-medium text-ink">Could not load quality control records.</div>
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
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Inspected On
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Medicine / Batch
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Branch
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Check Type
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Temp / Condition
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Result
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
                      <Loader2 size={16} className="animate-spin" /> Loading register…
                    </div>
                  </td>
                </tr>
              )}
              {state === "ready" &&
                result?.items.map(q => (
                  <tr key={q.id} className="border-b border-line/60 transition-colors hover:bg-paper/70">
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink/60">
                      {formatDateTime(q.performedAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink">{q.batch.product.brand}</div>
                      <div className="font-mono text-[11.5px] text-ink/45">
                        {q.batch.batchNumber} · exp{" "}
                        {formatDateTime(q.batch.expiryDate).split(",")[0]}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-ink/70">
                      {q.branch?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-ink/70">{CHECK_TYPE_LABEL[q.checkType]}</td>
                    <td className="px-4 py-3.5 text-ink/60">
                      {q.temperatureC !== null && q.temperatureC !== undefined ? (
                        <span className="font-mono">{q.temperatureC}°C</span>
                      ) : (
                        q.condition || "—"
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_BADGE[q.status]}`}
                      >
                        {STATUS_LABEL[q.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {q.status === "QUARANTINED" && canManage && (
                          <>
                            <button
                              onClick={() => updateStatus(q.id, "RELEASED")}
                              className="cursor-pointer rounded-md border border-teal-mid/30 bg-teal-mid/10 px-2.5 py-1.5 text-[12px] font-semibold text-teal-mid transition-colors hover:bg-teal-mid/20"
                            >
                              Release
                            </button>
                            <button
                              onClick={() => updateStatus(q.id, "DISPOSED")}
                              className="cursor-pointer rounded-md border border-danger/25 bg-danger-bg px-2.5 py-1.5 text-[12px] font-semibold text-danger transition-colors hover:bg-danger/15"
                            >
                              Dispose
                            </button>
                          </>
                        )}
                        {(q.failedItems.length > 0 || q.notes || q.decisionNote) && (
                          <span
                            className="cursor-help text-ink/40 transition-colors hover:text-ink/70"
                            title={[
                              q.decisionNote,
                              q.failedItems.length ? `Failed: ${q.failedItems.join(", ")}` : null,
                              q.notes,
                            ]
                              .filter(Boolean)
                              .join("\n")}
                          >
                            <FlaskConical size={14} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              {state === "ready" && result && result.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-12 py-12 text-center text-ink/40">
                    <FlaskConical size={32} className="mx-auto mb-3 opacity-40" />
                    <div className="text-[14px]">
                      {status !== "ALL" || branchId
                        ? "No quality checks match your filters."
                        : "No quality checks recorded yet. Inspect a received batch to begin."}
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
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, result.total)} of {result.total}
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

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
          <CheckCircle2 size={16} className="text-teal-mid" />
          <span className="text-[13px] text-ink">{toast}</span>
        </div>
      )}

      {/* ── New QC check modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="font-display text-[17px] font-semibold text-ink">New Quality Check</div>
              <button
                onClick={() => setShowModal(false)}
                className="cursor-pointer border-0 bg-transparent p-1 text-ink/40 transition-colors hover:text-danger"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto p-5">
              {/* Batch picker */}
              <div className="relative">
                <label className="mb-1 block text-[12px] font-semibold text-ink/60">
                  Batch to inspect *
                </label>
                {selectedBatch ? (
                  <div className="flex items-center justify-between rounded-lg border border-teal-mid bg-teal-mid/10 px-3 py-2">
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink">
                        {selectedBatch.product.brand}
                      </div>
                      <div className="font-mono text-[12px] text-ink/50">
                        {selectedBatch.batchNumber} · {selectedBatch.quantity} units · exp{" "}
                        {formatDateTime(selectedBatch.expiryDate).split(",")[0]}
                        {selectedBatch.branch ? ` · ${selectedBatch.branch.name}` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBatch(null)}
                      className="cursor-pointer rounded p-1 text-ink/40 transition-colors hover:text-danger"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
                      />
                      <input
                        type="text"
                        placeholder="Search brand or batch number…"
                        value={batchQuery}
                        onChange={e => {
                          setBatchQuery(e.target.value);
                          setPickerOpen(true);
                        }}
                        onFocus={() => setPickerOpen(true)}
                        className={`${inputBase} pl-9`}
                      />
                    </div>
                    {pickerOpen && (
                      <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-line bg-white shadow-lg">
                        {filteredBatches.length === 0 ? (
                          <div className="px-3 py-3 text-[12.5px] text-ink/40">
                            No batches awaiting inspection. Recently received batches appear here.
                          </div>
                        ) : (
                          filteredBatches.map(b => (
                            <button
                              key={b.id}
                              onClick={() => {
                                setSelectedBatch(b);
                                setPickerOpen(false);
                              }}
                              className="block w-full cursor-pointer border-b border-line/60 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-paper-dim"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[13px] font-semibold text-ink">
                                  {b.product.brand}
                                </span>
                                <span className="font-mono text-[11.5px] text-ink/45">
                                  {b.quantity} units
                                </span>
                              </div>
                              <div className="font-mono text-[11.5px] text-ink/45">
                                {b.batchNumber} · exp{" "}
                                {formatDateTime(b.expiryDate).split(",")[0]}
                                {b.branch ? ` · ${b.branch.name}` : ""}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-ink/60">
                    Check Type *
                  </label>
                  <select
                    value={checkType}
                    onChange={e => setCheckType(e.target.value as QualityCheckType)}
                    className={`${inputBase} cursor-pointer`}
                  >
                    {(Object.keys(CHECK_TYPE_LABEL) as QualityCheckType[]).map(t => (
                      <option key={t} value={t}>
                        {CHECK_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-ink/60">
                    Decision *
                  </label>
                  <select
                    value={decision}
                    onChange={e =>
                      setDecision(e.target.value as "PASSED" | "FAILED" | "QUARANTINE")
                    }
                    className={`${inputBase} cursor-pointer`}
                  >
                    <option value="PASSED">Passed</option>
                    <option value="FAILED">Failed</option>
                    <option value="QUARANTINE">Quarantine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-ink/60">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperatureC}
                    onChange={e => setTemperatureC(e.target.value)}
                    placeholder="e.g. 4.5"
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-ink/60">
                    Condition
                  </label>
                  <input
                    type="text"
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                    placeholder="e.g. 2–8°C cold chain"
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-ink/60">
                    Passed checks (comma separated)
                  </label>
                  <textarea
                    value={passedItems}
                    onChange={e => setPassedItems(e.target.value)}
                    rows={2}
                    placeholder="Seal intact, label legible"
                    className={`${inputBase} resize-none`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-ink/60">
                    Failed checks (comma separated)
                  </label>
                  <textarea
                    value={failedItems}
                    onChange={e => setFailedItems(e.target.value)}
                    rows={2}
                    placeholder="Damaged packaging"
                    className={`${inputBase} resize-none`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink/60">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional remarks…"
                  className={`${inputBase} resize-none`}
                />
              </div>

              <button
                onClick={submit}
                disabled={saving || !selectedBatch}
                className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                Record Quality Check
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}