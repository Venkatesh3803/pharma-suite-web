"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  Loader2,
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
import type { LoadState } from "@/lib/hooks/usePaginatedList";
import { formatDateTime } from "@/lib/inventory";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  PageHeader,
  ErrorState,
  TableShell,
  Th,
  Td,
  TableRow,
  LoadingRow,
  EmptyRow,
  Pagination,
  StatusBadge,
  PrimaryButton,
  SecondaryButton,
  FilterSelect,
  SearchInput,
  Modal,
  inputBase,
} from "@/components/common";

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

export default function QualityControlPage() {
  const { can } = usePermissions();
  const canManage = can.isManagerOrAbove();

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
      if (page === 1) refresh();
      else setPage(1);
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
      <PageHeader
        eyebrow="Good Manufacturing Practice · GMP"
        title="Quality Control"
        description="Inspect incoming and stored batches, quarantine suspect stock and track disposition decisions."
        actions={
          <>
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[12.5px] font-semibold text-amber-700">
                <ShieldAlert size={14} />
                {pendingCount} batch{pendingCount === 1 ? "" : "es"} awaiting inspection
              </div>
            )}
            {canManage && (
              <PrimaryButton
                className="px-3.5 py-2"
                onClick={() => {
                  setSelectedBatch(null);
                  setBatchQuery("");
                  setPickerOpen(false);
                  setShowModal(true);
                }}
              >
                <ClipboardCheck size={15} /> New QC Check
              </PrimaryButton>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          showIcon={false}
          value={status}
          onChange={e => {
            setStatus(e.target.value as QualityControlStatus | "ALL");
            setPage(1);
          }}
          className="w-44"
        >
          <option value="ALL">Any Result</option>
          <option value="PENDING">Pending</option>
          <option value="PASSED">Passed</option>
          <option value="FAILED">Failed</option>
          <option value="QUARANTINED">Quarantined</option>
          <option value="RELEASED">Released</option>
          <option value="DISPOSED">Disposed</option>
        </FilterSelect>
        <FilterSelect
          showIcon={false}
          value={branchId}
          onChange={e => {
            setBranchId(e.target.value);
            setPage(1);
          }}
          className="w-56"
        >
          <option value="">All Branches</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </FilterSelect>
      </div>

      {state === "error" && (
        <ErrorState
          title="Could not load quality control records."
          description={error}
          onRetry={retry}
          icon={<AlertTriangle size={32} className="text-danger/60" />}
        />
      )}

      <TableShell
        footer={
          result && result.total > 0 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              label={
                `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, result.total)} of ${result.total}`
              }
            />
          ) : undefined
        }
      >
        <thead>
          <tr className="border-b border-line">
            <Th>Inspected On</Th>
            <Th>Medicine / Batch</Th>
            <Th>Branch</Th>
            <Th>Check Type</Th>
            <Th>Temp / Condition</Th>
            <Th>Result</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {state === "loading" && !result && (
            <LoadingRow colSpan={7} message="Loading register…" />
          )}
          {state === "ready" &&
            result?.items.map(q => (
              <TableRow key={q.id}>
                <Td className="whitespace-nowrap text-ink/60">
                  {formatDateTime(q.performedAt)}
                </Td>
                <Td>
                  <div className="font-semibold text-ink">{q.batch.product.brand}</div>
                  <div className="font-mono text-[11.5px] text-ink/45">
                    {q.batch.batchNumber} · exp{" "}
                    {formatDateTime(q.batch.expiryDate).split(",")[0]}
                  </div>
                </Td>
                <Td className="text-ink/70">
                  {q.branch?.name ?? "—"}
                </Td>
                <Td className="text-ink/70">{CHECK_TYPE_LABEL[q.checkType]}</Td>
                <Td className="text-ink/60">
                  {q.temperatureC !== null && q.temperatureC !== undefined ? (
                    <span className="font-mono">{q.temperatureC}°C</span>
                  ) : (
                    q.condition || "—"
                  )}
                </Td>
                <Td>
                  <StatusBadge
                    className={`px-2 py-1 text-[11px] uppercase tracking-wide ${STATUS_BADGE[q.status]}`}
                  >
                    {STATUS_LABEL[q.status]}
                  </StatusBadge>
                </Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-2">
                    {q.status === "QUARANTINED" && canManage && (
                      <>
                        <SecondaryButton
                          onClick={() => updateStatus(q.id, "RELEASED")}
                          className="rounded-md border-teal-mid/30 bg-teal-mid/10 px-2.5 py-1.5 text-teal-mid hover:border-teal-mid/30 hover:bg-teal-mid/20 hover:text-teal-mid"
                        >
                          Release
                        </SecondaryButton>
                        <SecondaryButton
                          onClick={() => updateStatus(q.id, "DISPOSED")}
                          className="rounded-md border-danger/25 bg-danger-bg px-2.5 py-1.5 text-danger hover:border-danger/25 hover:bg-danger/15 hover:text-danger"
                        >
                          Dispose
                        </SecondaryButton>
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
                </Td>
              </TableRow>
            ))}
          {state === "ready" && result && result.items.length === 0 && (
            <EmptyRow
              colSpan={7}
              icon={<FlaskConical size={32} />}
              message={
                status !== "ALL" || branchId
                  ? "No quality checks match your filters."
                  : "No quality checks recorded yet. Inspect a received batch to begin."
              }
            />
          )}
        </tbody>
      </TableShell>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
          <CheckCircle2 size={16} className="text-teal-mid" />
          <span className="text-[13px] text-ink">{toast}</span>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New Quality Check"
        width="lg"
        className="flex max-h-[85vh] flex-col overflow-hidden"
        bodyClassName="overflow-y-auto"
      >
        <div className="flex flex-col gap-4">
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
                <SearchInput
                  placeholder="Search brand or batch number…"
                  value={batchQuery}
                  onChange={e => {
                    setBatchQuery(e.target.value);
                    setPickerOpen(true);
                  }}
                  onFocus={() => setPickerOpen(true)}
                />
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

          <PrimaryButton
            onClick={submit}
            disabled={saving || !selectedBatch}
            className="mt-1 w-full justify-center py-2.5 text-[13.5px]"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Record Quality Check
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
