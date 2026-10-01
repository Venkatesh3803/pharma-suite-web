"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  UserPlus,
  Users,
} from "lucide-react";
import { customersApi } from "@/lib/api";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { usePaginatedList } from "@/lib/hooks/usePaginatedList";
import { formatDateTime } from "@/lib/inventory";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  PrimaryButton,
  SecondaryButton,
  SearchInput,
  Modal,
  inputBase,
} from "@/components/common";

const customerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required."),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canManage = can.isPharmacistOrAbove();

  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", email: "", address: "", notes: "" },
  });

  const { data: list, state, error, page, setPage, refresh, retry } = usePaginatedList({
    fetcher: p =>
      customersApi.list({
        search: search.trim() || undefined,
        page: p,
        pageSize: 25,
      }),
    deps: [search],
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const saveCustomer = async (values: CustomerFormValues) => {
    setSaving(true);
    try {
      await customersApi.create({
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        address: values.address?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
      setShowCreate(false);
      form.reset();
      setToast("Customer created.");
      refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not create customer.");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = list ? Math.max(1, Math.ceil(list.total / 25)) : 1;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        description="Regular buyers, their purchase history and frequently dispensed medicines."
        actions={
          canManage ? (
            <PrimaryButton
              onClick={() => {
                form.reset();
                setShowCreate(true);
              }}
            >
              <UserPlus size={15} /> Add Customer
            </PrimaryButton>
          ) : undefined
        }
      />

      <SearchInput
        wrapperClassName="w-full max-w-[320px]"
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search by name or phone…"
      />

      {state === "error" && (
        <ErrorState
          title="Could not load customers."
          description={error}
          onRetry={retry}
          icon={<Users size={32} className="text-danger/60" />}
        />
      )}

      <TableShell>
        <thead>
          <tr className="border-b border-line">
            <Th>Name</Th>
            <Th>Phone</Th>
            <Th>Email</Th>
            <Th>Address</Th>
            <Th>Added</Th>
            <Th align="right">Open</Th>
          </tr>
        </thead>
        <tbody>
          {state === "loading" && !list && (
            <LoadingRow colSpan={6} message="Loading customers…" />
          )}

          {state === "ready" &&
            list?.items.map(c => (
              <TableRow
                key={c.id}
                onClick={() => router.push(`/customers/${c.id}`)}
              >
                <Td className="font-medium text-ink/80">{c.name}</Td>
                <Td className="font-mono text-[12.5px] text-ink/60">{c.phone ?? "—"}</Td>
                <Td className="text-ink/60">{c.email ?? "—"}</Td>
                <Td className="max-w-[220px] truncate text-ink/60">{c.address ?? "—"}</Td>
                <Td className="text-ink/60">{formatDateTime(c.createdAt)}</Td>
                <Td align="right">
                  <SecondaryButton
                    onClick={e => {
                      e.stopPropagation();
                      router.push(`/customers/${c.id}`);
                    }}
                  >
                    Profile <ArrowRight size={12} />
                  </SecondaryButton>
                </Td>
              </TableRow>
            ))}

          {state === "ready" && list && list.items.length === 0 && (
            <EmptyRow
              colSpan={6}
              icon={<Users size={32} />}
              message="No customers found."
            />
          )}
        </tbody>
      </TableShell>

      <Pagination
        variant="bare"
        page={page}
        totalPages={totalPages}
        onChange={setPage}
        label={list ? `${list.total} customer${list.total === 1 ? "" : "s"}` : "—"}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
          <CheckCircle2 size={16} className="text-teal-mid" />
          <span className="text-[13px] text-ink">{toast}</span>
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Customer"
        width="md"
        className="flex max-h-[85vh] flex-col overflow-hidden"
        bodyClassName="overflow-y-auto"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink/70 hover:border-ink/30"
            >
              Cancel
            </button>
            <PrimaryButton type="submit" form="customer-form" disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Create Customer"}
            </PrimaryButton>
          </>
        }
      >
        <Form {...form}>
          <form id="customer-form" onSubmit={form.handleSubmit(saveCustomer)}>
            <div className="flex flex-col gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
                      Name *
                    </FormLabel>
                    <FormControl>
                      <input {...field} placeholder="Full name" className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
                      Phone
                    </FormLabel>
                    <FormControl>
                      <input {...field} placeholder="Mobile number" className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
                      Email
                    </FormLabel>
                    <FormControl>
                      <input type="email" {...field} placeholder="name@example.com" className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
                      Address
                    </FormLabel>
                    <FormControl>
                      <textarea {...field} placeholder="Billing address" rows={2} className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1 block text-[12px] font-semibold text-ink/60">
                      Notes
                    </FormLabel>
                    <FormControl>
                      <textarea {...field} placeholder="Allergies, preferences…" rows={2} className={inputBase} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </Modal>
    </div>
  );
}
