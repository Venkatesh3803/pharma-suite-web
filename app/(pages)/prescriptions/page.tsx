"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  customersApi,
  prescriptionsApi,
  type CustomerRow,
  type PrescriptionStatus,
} from "@/lib/api";
import { formatDateTime } from "@/lib/inventory";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { usePaginatedList } from "@/lib/hooks/usePaginatedList";
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
  FilterBar,
  SearchInput,
  FilterSelect,
  Modal,
  inputBase,
} from "@/components/common";

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

export default function PrescriptionsPage() {
  const { can } = usePermissions();
  const canCreate = can.isPharmacistOrAbove();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PrescriptionStatus | "ALL">("ALL");
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

  const {
    data: result,
    setData: setResult,
    state,
    error,
    page,
    setPage,
    refresh,
    retry,
  } = usePaginatedList({
    fetcher: p =>
      prescriptionsApi.list({
        search: search.trim() || undefined,
        status: status === "ALL" ? "ALL" : status,
        page: p,
        pageSize,
      }),
    deps: [search, status],
  });

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
      if (page === 1) refresh();
      else setPage(1);
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
      <PageHeader
        eyebrow="Schedule H · Digital Register"
        title="Prescriptions Register"
        description="Scanned prescriptions against your Schedule H/H1 and dispensed medicines, kept as the statutory digital register."
        actions={
          canCreate ? (
            <PrimaryButton onClick={() => setShowUpload(true)}>
              <Upload size={15} /> Upload Prescription
            </PrimaryButton>
          ) : undefined
        }
      />

      <FilterBar>
        <SearchInput
          placeholder="Search by customer name or phone…"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <FilterSelect
          showIcon={false}
          value={status}
          onChange={e => {
            setStatus(e.target.value as PrescriptionStatus | "ALL");
            setPage(1);
          }}
          className="w-44"
        >
          <option value="ALL">Any Status</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </FilterSelect>
      </FilterBar>

      {state === "error" && (
        <ErrorState
          title="Could not load prescriptions."
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
            <Th>Recorded</Th>
            <Th>Customer</Th>
            <Th>Doctor</Th>
            <Th>Prescribed On</Th>
            <Th>Status</Th>
            <Th>File</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {state === "loading" && !result && (
            <LoadingRow colSpan={7} message="Loading register…" />
          )}
          {state === "ready" &&
            result?.items.map(p => (
              <TableRow key={p.id}>
                <Td className="whitespace-nowrap text-ink/60">
                  {formatDateTime(p.createdAt)}
                </Td>
                <Td>
                  <div className="font-semibold text-ink">{p.customer.name}</div>
                  {p.customer.phone && (
                    <div className="text-[11.5px] text-ink/45">{p.customer.phone}</div>
                  )}
                </Td>
                <Td className="text-ink/70">
                  {p.doctorName || "—"}
                </Td>
                <Td className="whitespace-nowrap text-ink/60">
                  {formatDateTime(p.prescriptionDate)}
                </Td>
                <Td>
                  <StatusBadge
                    className={`px-2 py-1 text-[11px] uppercase tracking-wide ${STATUS_BADGE[p.status]}`}
                  >
                    {STATUS_LABEL[p.status]}
                  </StatusBadge>
                </Td>
                <Td>
                  <button
                    onClick={() => openPrescription(p.id)}
                    className="flex cursor-pointer items-center gap-1.5 font-mono text-[12.5px] font-medium text-teal-mid transition-colors hover:underline"
                    title="Open prescription file"
                  >
                    <FileText size={14} />
                    {p.fileName.length > 28 ? `${p.fileName.slice(0, 25)}…` : p.fileName}
                  </button>
                </Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-2">
                    {p.status === "ACTIVE" && (
                      <SecondaryButton
                        onClick={() => updateStatus(p.id, "COMPLETED")}
                        className="rounded-md border-teal-mid/30 bg-teal-mid/10 px-2.5 py-1.5 text-teal-mid hover:border-teal-mid/30 hover:bg-teal-mid/20 hover:text-teal-mid"
                      >
                        Complete
                      </SecondaryButton>
                    )}
                    {p.status !== "CANCELLED" && (
                      <SecondaryButton
                        onClick={() => updateStatus(p.id, "CANCELLED")}
                        className="rounded-md border-danger/25 bg-danger-bg px-2.5 py-1.5 text-danger hover:border-danger/25 hover:bg-danger/15 hover:text-danger"
                      >
                        Cancel
                      </SecondaryButton>
                    )}
                  </div>
                </Td>
              </TableRow>
            ))}
          {state === "ready" && result && result.items.length === 0 && (
            <EmptyRow
              colSpan={7}
              icon={<ClipboardList size={32} />}
              message={
                search || status !== "ALL"
                  ? "No prescriptions match your filters."
                  : "No prescriptions recorded yet. Upload the first one to start your register."
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
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="Upload Prescription"
        width="lg"
        className="flex max-h-[85vh] flex-col overflow-hidden"
        bodyClassName="overflow-y-auto"
        footer={
          <>
            <button
              onClick={() => setShowUpload(false)}
              className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink/70 hover:border-ink/30"
            >
              Cancel
            </button>
            <PrimaryButton onClick={submitUpload} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload size={14} /> Upload
                </>
              )}
            </PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
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
                <SearchInput
                  placeholder="Search name or phone…"
                  value={customerQuery}
                  onChange={e => {
                    setCustomerQuery(e.target.value);
                    void loadCustomers(e.target.value);
                    setPickerOpen(true);
                  }}
                  onFocus={() => setPickerOpen(true)}
                />
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
      </Modal>
    </div>
  );
}
