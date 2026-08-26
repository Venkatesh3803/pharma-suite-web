"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import {
  customersApi,
  prescriptionsApi,
  type CustomerRow,
  type PrescriptionRow,
  type PrescriptionStatus,
} from "@/lib/api";
import { formatDateTime } from "@/lib/inventory";
import { useAppSelector } from "@/lib/redux/hooks";

type LoadState = "loading" | "error" | "ready";

const STATUS_BADGE: Record<PrescriptionStatus, string> = {
  ACTIVE: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  COMPLETED: "border border-stamp/30 bg-stamp-dim text-stamp",
  CANCELLED: "border border-danger/25 bg-danger-bg text-danger",
};

const STATUS_LABEL: Record<PrescriptionStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const inputBase =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

export default function PrescriptionsPage() {
  const user = useAppSelector(state => state.auth.user);
  const canCreate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "PHARMACIST";

  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ items: PrescriptionRow[]; total: number } | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PrescriptionStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 20;

  const [showUpload, setShowUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Upload form state
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOptions, setCustomerOptions] = useState<CustomerRow[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await prescriptionsApi.list({
          search: search.trim() || undefined,
          status: status === "ALL" ? "ALL" : status,
          page,
          pageSize,
        });
        if (!ignore) {
          setResult(data);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load prescriptions.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [search, status, page, refreshKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadCustomers = async (q: string) => {
    try {
      const data = await customersApi.list({ search: q.trim() || undefined, pageSize: 10 });
      setCustomerOptions(data.items);
    } catch {
      setCustomerOptions([]);
    }
  };

  useEffect(() => {
    if (!showUpload) return;
    const t = setTimeout(() => loadCustomers(""), 250);
    return () => clearTimeout(t);
  }, [showUpload]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / pageSize)) : 1;

  const retry = () => {
    setState("loading");
    setError("");
    setRefreshKey(k => k + 1);
  };

  const openPrescription = async (id: string) => {
    try {
      const blob = await prescriptionsApi.download(id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not open prescription.");
    }
  };

  const updateStatus = async (id: string, next: PrescriptionStatus) => {
    try {
      await prescriptionsApi.updateStatus(id, next);
      setResult(prev =>
        prev
          ? {
              ...prev,
              items: prev.items.map(p =>
                p.id === id ? { ...p, status: next } : p,
              ),
            }
          : prev,
      );
      setToast(`Prescription marked ${STATUS_LABEL[next].toLowerCase()}.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not update prescription.");
    }
  };

  const resetUploadForm = () => {
    setCustomerQuery("");
    setCustomerOptions([]);
    setSelectedCustomer(null);
    setDoctorName("");
    setPrescriptionDate("");
    setNotes("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitUpload = async () => {
    if (!selectedCustomer) {
      setToast("Select a customer for this prescription.");
      return;
    }
    if (!file) {
      setToast("Attach the prescription PDF or image.");
      return;
    }
    setSaving(true);
    try {
      await prescriptionsApi.upload(
        {
          customerId: selectedCustomer.id,
          doctorName: doctorName.trim() || undefined,
          prescriptionDate: prescriptionDate || undefined,
          notes: notes.trim() || undefined,
        },
        file,
      );
      setShowUpload(false);
      resetUploadForm();
      setToast("Prescription uploaded.");
      setPage(1);
      setRefreshKey(k => k + 1);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not upload prescription.");
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomerOptions = customerOptions.filter(c =>
    !selectedCustomer || c.id !== selectedCustomer.id,
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Schedule H · Digital Register
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Prescriptions Register
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Scanned prescriptions against your Schedule H/H1 and dispensed
            medicines, kept as the statutory digital register.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
          >
            <Upload size={15} /> Upload Prescription
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            type="text"
            placeholder="Search by customer name or phone…"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={`${inputBase} pl-9`}
          />
        </div>
        <select
          value={status}
          onChange={e => {
            setStatus(e.target.value as PrescriptionStatus | "ALL");
            setPage(1);
          }}
          className="w-44 cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body"
        >
          <option value="ALL">Any Status</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <AlertTriangle size={32} className="text-danger/60" />
          <div>
            <div className="text-[14px] font-medium text-ink">
              Could not load prescriptions.
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
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Recorded
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Customer
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Doctor
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Prescribed On
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  Status
                </th>
                <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                  File
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
                result?.items.map(p => (
                  <tr
                    key={p.id}
                    className="border-b border-line/60 transition-colors hover:bg-paper/70"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink/60">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink">{p.customer.name}</div>
                      {p.customer.phone && (
                        <div className="text-[11.5px] text-ink/45">{p.customer.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-ink/70">
                      {p.doctorName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink/60">
                      {formatDateTime(p.prescriptionDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_BADGE[p.status]}`}
                      >
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => openPrescription(p.id)}
                        className="flex cursor-pointer items-center gap-1.5 font-mono text-[12.5px] font-medium text-teal-mid transition-colors hover:underline"
                        title="Open prescription file"
                      >
                        <FileText size={14} />
                        {p.fileName.length > 28 ? `${p.fileName.slice(0, 25)}…` : p.fileName}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === "ACTIVE" && (
                          <button
                            onClick={() => updateStatus(p.id, "COMPLETED")}
                            className="cursor-pointer rounded-md border border-teal-mid/30 bg-teal-mid/10 px-2.5 py-1.5 text-[12px] font-semibold text-teal-mid transition-colors hover:bg-teal-mid/20"
                          >
                            Complete
                          </button>
                        )}
                        {p.status !== "CANCELLED" && (
                          <button
                            onClick={() => updateStatus(p.id, "CANCELLED")}
                            className="cursor-pointer rounded-md border border-danger/25 bg-danger-bg px-2.5 py-1.5 text-[12px] font-semibold text-danger transition-colors hover:bg-danger/15"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              {state === "ready" && result && result.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-12 py-12 text-center text-ink/40">
                    <ClipboardList size={32} className="mx-auto mb-3 opacity-40" />
                    <div className="text-[14px]">
                      {search || status !== "ALL"
                        ? "No prescriptions match your filters."
                        : "No prescriptions recorded yet. Upload the first one to start your register."}
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

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
          <CheckCircle2 size={16} className="text-teal-mid" />
          <span className="text-[13px] text-ink">{toast}</span>
        </div>
      )}

      {/* ── Upload modal ── */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="font-display text-[17px] font-semibold text-ink">
                Upload Prescription
              </div>
              <button
                onClick={() => setShowUpload(false)}
                className="cursor-pointer border-0 bg-transparent p-1 text-ink/40 transition-colors hover:text-danger"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto p-5">
              {/* Customer picker */}
              <div className="relative">
                <label className="mb-1 block text-[12px] font-semibold text-ink/60">
                  Customer *
                </label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-lg border border-teal-mid bg-teal-mid/10 px-3 py-2">
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink">
                        {selectedCustomer.name}
                      </div>
                      {selectedCustomer.phone && (
                        <div className="text-[12px] text-ink/50">{selectedCustomer.phone}</div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
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
                        placeholder="Search name or phone…"
                        value={customerQuery}
                        onChange={e => {
                          setCustomerQuery(e.target.value);
                          void loadCustomers(e.target.value);
                          setPickerOpen(true);
                        }}
                        onFocus={() => setPickerOpen(true)}
                        className={`${inputBase} pl-9`}
                      />
                    </div>
                    {pickerOpen && (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-line bg-white shadow-lg">
                        {filteredCustomerOptions.length === 0 ? (
                          <div className="px-3 py-3 text-[12.5px] text-ink/40">
                            No customers found. Add them from the Customers page first.
                          </div>
                        ) : (
                          filteredCustomerOptions.map(c => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setPickerOpen(false);
                                setCustomerQuery(c.name);
                              }}
                              className="flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left text-[13px] text-ink transition-colors hover:bg-paper"
                            >
                              <span className="font-medium">{c.name}</span>
                              {c.phone && (
                                <span className="font-mono text-[12px] text-ink/40">{c.phone}</span>
                              )}
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
                    Doctor
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. Name"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-ink/60">
                    Prescribed On
                  </label>
                  <input
                    type="date"
                    value={prescriptionDate}
                    onChange={e => setPrescriptionDate(e.target.value)}
                    className={inputBase}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink/60">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Dosage, refill instructions…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink/60">
                  Prescription file *
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-paper px-3 py-5 text-[13px] font-medium text-ink/55 transition-colors hover:border-teal-mid hover:text-teal-mid"
                >
                  {file ? (
                    <>
                      <FileText size={16} className="text-teal-mid" />
                      <span className="max-w-[80%] truncate">{file.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Click to attach PDF or image (max 10 MB)
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
              <button
                onClick={() => setShowUpload(false)}
                className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink/70 hover:border-ink/30"
              >
                Cancel
              </button>
              <button
                onClick={submitUpload}
                disabled={saving}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-wait disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload size={14} /> Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}