"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Users,
  Settings as SettingsIcon,
  Save,
  Plus,
  Mail,
  Phone,
  KeyRound,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  MapPin,
  Hash,
  ShieldCheck,
  Lock,
  Landmark,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchWorkspace,
  updateWorkspace,
} from "@/lib/redux/slices/workspaceSlice";
import {
  createTeamMember,
  fetchTeam,
  updateTeamMember,
} from "@/lib/redux/slices/teamSlice";
import { fetchSubscription } from "@/lib/redux/slices/subscriptionSlice";
import { branchesApi, type TeamMember, type TeamRole, type TeamStatus } from "@/lib/api";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Permissions } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";
import { rolePermissions } from "@/lib/permissions";

const ROLE_LABELS: Record<TeamRole, string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  PHARMACIST: "Pharmacist",
  STAFF: "Staff",
};

const ALL_ROLE_OPTIONS: TeamRole[] = [
  "SUPER_ADMIN",
  "OWNER",
  "MANAGER",
  "PHARMACIST",
  "STAFF",
];

function getAssignableRoles(userPermissions: Permission[]): TeamRole[] {
  return ALL_ROLE_OPTIONS.filter(role => {
    const requiredPerms = rolePermissions[role];
    return requiredPerms.every(p => userPermissions.includes(p));
  });
}

function canAssignRole(userPermissions: Permission[], targetRole: TeamRole): boolean {
  const requiredPerms = rolePermissions[targetRole];
  return requiredPerms.every(p => userPermissions.includes(p));
}

const STATUS_BADGE: Record<TeamStatus, string> = {
  ACTIVE: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  INACTIVE: "border border-ink/25 bg-paper-dim text-ink/60",
  SUSPENDED: "border border-danger/30 bg-danger/10 text-danger",
};

const inputBase =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

const isStrongPassword = (password: string) =>
  password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);

const orgSchema = z.object({
  name: z.string().trim().min(1, "Organisation name is required."),
  gstin: z.string().optional(),
  address: z.string().optional(),
  lowStockThreshold: z
    .string()
    .refine(v => v === "" || !Number.isNaN(Number(v)), "Enter a valid threshold."),
});

type OrgFormValues = z.infer<typeof orgSchema>;

const memberSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .refine(
      isStrongPassword,
      "Password must be at least 8 characters and include letters and numbers.",
    ),
  phone: z
    .string()
    .refine(
      v => v === "" || /^[6-9]\d{9}$/.test(v.trim()),
      "Enter a valid 10-digit Indian mobile number.",
    ),
  role: z.enum(["SUPER_ADMIN", "OWNER", "MANAGER", "PHARMACIST", "STAFF"]),
  branchId: z.string(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

const branchSchema = z.object({
  name: z.string().trim().min(1, "Branch name is required."),
  code: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

type Notice = { type: "ok" | "err"; text: string } | null;

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const workspace = useAppSelector(state => state.workspace.workspace);
  const workspaceStatus = useAppSelector(state => state.workspace.status);
  const team = useAppSelector(state => state.team);
  const teamItems = team?.items ?? [];
  const teamStatus = team?.status ?? "idle";

  const { permissions: userPermissions } = usePermissions();

  const [activeTab, setActiveTab] = useState<"workspace" | "team">("workspace");
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgMsg, setOrgMsg] = useState<Notice>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberMsg, setMemberMsg] = useState<Notice>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const assignableRoles = getAssignableRoles(userPermissions ?? []);
  const defaultRole = assignableRoles.includes("PHARMACIST") ? "PHARMACIST" : assignableRoles[0] ?? "STAFF";

  const orgForm = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: "", gstin: "", address: "", lowStockThreshold: "" },
  });
  const { reset: resetOrgForm } = orgForm;
  const memberForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      role: defaultRole,
      branchId: "",
    },
  });

  const snapshot = useAppSelector(state => state.subscription.snapshot);
  const limits = snapshot?.limits;

  const [showBranchForm, setShowBranchForm] = useState(false);
  const [addingBranch, setAddingBranch] = useState(false);
  const [branchMsg, setBranchMsg] = useState<Notice>(null);

  const branchForm = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "", code: "", city: "", state: "" },
  });

  const { can } = usePermissions();
  const canManageSettings = can.permission(Permissions.SETTINGS_MANAGE);
  const branches = workspace?.branches ?? [];

  const canAddBranch = limits?.maxBranches === null;
  const seatsFull =
    limits?.maxUsers != null && limits.seatsUsed >= limits.maxUsers;

  useEffect(() => {
    if (!snapshot) void dispatch(fetchSubscription());
  }, [dispatch, snapshot]);

  useEffect(() => {
    if (workspaceStatus === "idle" && !workspace) {
      void dispatch(fetchWorkspace());
    }
  }, [dispatch, workspaceStatus, workspace]);

  useEffect(() => {
    if (teamStatus === "idle" || teamStatus === "error") {
      void dispatch(fetchTeam());
    }
  }, [dispatch, teamStatus]);

  const workspaceSettings = workspace?.settings as
    | Record<string, unknown>
    | undefined;

  useEffect(() => {
    resetOrgForm({
      name: workspace?.name ?? "",
      gstin: workspace?.gstin ?? "",
      address: workspace?.address ?? "",
      lowStockThreshold: String(
        typeof workspaceSettings?.lowStockThreshold === "number"
          ? workspaceSettings.lowStockThreshold
          : 10,
      ),
    });
  }, [workspace, workspaceSettings, resetOrgForm]);

  const handleSaveOrg = async (values: OrgFormValues) => {
    setSavingOrg(true);
    setOrgMsg(null);
    try {
      await dispatch(
        updateWorkspace({
          name: values.name.trim(),
          gstin: values.gstin?.trim() || undefined,
          address: values.address?.trim() || undefined,
          settings: {
            lowStockThreshold: Number(values.lowStockThreshold) || 0,
          },
        }),
      ).unwrap();
      setOrgMsg({ type: "ok", text: "Workspace details updated successfully." });
    } catch (err) {
      setOrgMsg({
        type: "err",
        text:
          err instanceof Error ? err.message : "Failed to update workspace.",
      });
    } finally {
      setSavingOrg(false);
    }
  };

  const handleAddMember = async (values: MemberFormValues) => {
    setMemberMsg(null);

    if (seatsFull) {
      setMemberMsg({
        type: "err",
        text: `You've used all ${limits?.maxUsers} user seats on your plan. Upgrade to add more team members.`,
      });
      return;
    }

    setAddingMember(true);
    try {
      await dispatch(
        createTeamMember({
          fullName: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          phone: values.phone.trim()
            ? `+91${values.phone.trim()}`
            : undefined,
          role: values.role,
          branchId: values.branchId || undefined,
        }),
      ).unwrap();
      memberForm.reset();
      setShowAddForm(false);
      setMemberMsg({ type: "ok", text: "Team member added successfully." });
    } catch (err) {
      setMemberMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to add team member.",
      });
    } finally {
      setAddingMember(false);
    }
  };

  const handleAddBranch = async (values: BranchFormValues) => {
    setBranchMsg(null);

    if (!canAddBranch) {
      setBranchMsg({
        type: "err",
        text: "Branch creation requires the Premium plan.",
      });
      return;
    }

    setAddingBranch(true);
    try {
      const created = await branchesApi.create({
        name: values.name.trim(),
        code: values.code?.trim() || undefined,
        city: values.city?.trim() || undefined,
        state: values.state?.trim() || undefined,
      });
      branchForm.reset();
      setShowBranchForm(false);
      setBranchMsg({
        type: "ok",
        text: `Branch "${created.name}" created.`,
      });
      void dispatch(fetchWorkspace());
    } catch (err) {
      setBranchMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to create branch.",
      });
    } finally {
      setAddingBranch(false);
    }
  };

  const handleRoleChange = async (member: TeamMember, role: TeamRole) => {
    setUpdatingId(member.id);
    try {
      await dispatch(updateTeamMember({ id: member.id, input: { role } })).unwrap();
    } catch (err) {
      setMemberMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to update member role.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (
    member: TeamMember,
    status: TeamStatus,
  ) => {
    setUpdatingId(member.id);
    try {
      await dispatch(
        updateTeamMember({ id: member.id, input: { status } }),
      ).unwrap();
    } catch (err) {
      setMemberMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to update member status.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (!canManageSettings) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 py-32 text-center">
        <ShieldCheck size={40} className="text-ink/30" />
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Access restricted
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Only Super Admin or Owner accounts can manage workspace settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Workspace Control Room
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Organisation & Team Settings
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Update workspace profile details and manage members of your
            organisation.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stamp-dim text-stamp">
          <SettingsIcon size={20} />
        </div>
      </div>

      {/* ── Segment Controller ── */}
      <div className="flex w-fit gap-1 rounded-lg bg-paper-dim p-1">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors ${
            activeTab === "workspace"
              ? "bg-white text-ink shadow-sm"
              : "text-ink/50 hover:text-ink"
          }`}
        >
          <Building2 size={15} />
          Workspace Profile
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors ${
            activeTab === "team"
              ? "bg-white text-ink shadow-sm"
              : "text-ink/50 hover:text-ink"
          }`}
        >
          <Users size={15} />
          Team Members
          <span className="rounded-lg bg-paper-dim px-1.5 py-0.5 font-mono text-[11px] text-ink/60">
            {teamItems.length}
          </span>
        </button>
      </div>

      {/* ── WORKSPACE PROFILE TAB ── */}
      {activeTab === "workspace" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Profile form */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <div className="font-display text-[15px] font-semibold text-ink">
                  Organisation Profile
                </div>
                <div className="mt-0.5 text-[12px] text-ink/50">
                  These details appear on purchase orders, invoices, and
                  compliance records.
                </div>
              </div>
              <span className="border border-teal-mid/25 bg-teal-mid/10 px-2 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-teal-mid">
                Workspace · {workspace?.code ?? "—"}
              </span>
            </div>

            <div className="p-5">
              {orgMsg && (
                <div
                  className={`mb-5 flex items-start gap-2.5 border p-3 text-[12.5px] leading-relaxed ${
                    orgMsg.type === "ok"
                      ? "border-teal-mid/25 bg-teal-mid/10 text-teal-mid"
                      : "border-danger/30 bg-danger/10 text-danger"
                  }`}
                >
                  {orgMsg.type === "ok" ? (
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  )}
                  <span>{orgMsg.text}</span>
                </div>
              )}

              <Form {...orgForm}>
                <form onSubmit={orgForm.handleSubmit(handleSaveOrg)}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={orgForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                            Organisation Name
                          </FormLabel>
                          <FormControl>
                            <input
                              {...field}
                              placeholder="e.g. PharmaSuite Health Hub"
                              className={inputBase}
                            />
                          </FormControl>
                          <FormMessage className="text-[12px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={orgForm.control}
                      name="gstin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                            GSTIN
                          </FormLabel>
                          <FormControl>
                            <input
                              {...field}
                              placeholder="29AABCP1234F1Z5"
                              className={`${inputBase} font-mono uppercase`}
                            />
                          </FormControl>
                          <FormMessage className="text-[12px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={orgForm.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                            Low Stock Alert Threshold
                          </FormLabel>
                          <FormControl>
                            <input
                              type="number"
                              min={0}
                              {...field}
                              className={inputBase}
                            />
                          </FormControl>
                          <FormMessage className="text-[12px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={orgForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                            Registered Address
                          </FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              rows={3}
                              placeholder="Store #4, Retail Complex, Hyderabad"
                              className={`${inputBase} resize-none`}
                            />
                          </FormControl>
                          <FormMessage className="text-[12px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                    <div className="text-[11.5px] text-ink/45 font-mono">
                      Last updated ·{" "}
                      {workspace
                        ? new Date(workspace.updatedAt).toLocaleString()
                        : "—"}
                    </div>
                    <button
                      type="submit"
                      disabled={savingOrg}
                      className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep focus:outline-none focus:ring-2 focus:ring-teal-mid/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingOrg ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      Save changes
                    </button>
                  </div>
                </form>
              </Form>
            </div>
          </div>

          {/* Metadata side panel */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/50 font-mono">
                Workspace Snapshot
              </div>
              <div className="space-y-3 text-[13px]">
                <div className="flex items-center gap-2.5 text-ink/70">
                  <Hash size={14} className="text-ink/40" />
                  Code · {workspace?.code ?? "—"}
                </div>
                <div className="flex items-center gap-2.5 text-ink/70">
                  <MapPin size={14} className="text-ink/40" />
                  {workspace?.timezone ?? "—"}
                </div>
                <div className="flex items-center gap-2.5 text-ink/70">
                  <Building2 size={14} className="text-ink/40" />
                  {branches.length} active branch
                  {branches.length === 1 ? "" : "es"}
                </div>
                <div className="flex items-center gap-2.5 text-ink/70">
                  <Users size={14} className="text-ink/40" />
                  {workspace?.userCount ?? teamItems.length} user
                  {(workspace?.userCount ?? teamItems.length) === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/50 font-mono">
                Active Branches
              </div>
              {branches.length === 0 ? (
                <div className="text-[12.5px] text-ink/40">
                  No branches configured yet.
                </div>
              ) : (
                <ul className="space-y-2">
                  {branches.map(b => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between border-b border-line/60 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-[13px] font-medium text-ink">
                        {b.name}
                      </span>
                      <span className="font-mono text-[11px] text-ink/45">
                        {b.code}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Add branch — Premium plan */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/50 font-mono">
                  Add Branch
                </div>
                {canAddBranch && (
                  <button
                    onClick={() => setShowBranchForm(s => !s)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-[12px] font-semibold text-ink/70 transition-colors hover:bg-paper-dim"
                  >
                    {showBranchForm ? <X size={13} /> : <Plus size={13} />}
                    {showBranchForm ? "Cancel" : "New Branch"}
                  </button>
                )}
              </div>

              {!canAddBranch ? (
                <div className="flex items-start gap-2.5 border border-stamp/30 bg-stamp-dim p-3 text-[12.5px] leading-relaxed text-ink/70">
                  <Lock size={14} className="mt-0.5 shrink-0 text-stamp" />
                  <span>
                    Branch creation is a <strong>Premium</strong> feature.{" "}
                    <Link
                      href="/subscription"
                      className="font-semibold text-stamp underline"
                    >
                      Upgrade
                    </Link>{" "}
                    to open additional store branches.
                  </span>
                </div>
              ) : showBranchForm ? (
                <Form {...branchForm}>
                  <form onSubmit={branchForm.handleSubmit(handleAddBranch)} className="space-y-3">
                    {branchMsg && (
                      <div
                        className={`flex items-start gap-2 border p-2.5 text-[12px] ${
                          branchMsg.type === "ok"
                            ? "border-teal-mid/25 bg-teal-mid/10 text-teal-mid"
                            : "border-danger/30 bg-danger/10 text-danger"
                        }`}
                      >
                        {branchMsg.type === "ok" ? (
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        )}
                        <span>{branchMsg.text}</span>
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        control={branchForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                              Branch Name *
                            </FormLabel>
                            <FormControl>
                              <input
                                {...field}
                                placeholder="e.g. Hitech City"
                                className={inputBase}
                              />
                            </FormControl>
                            <FormMessage className="text-[12px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                              Branch Code (Optional)
                            </FormLabel>
                            <FormControl>
                              <input
                                {...field}
                                placeholder="e.g. HTC05"
                                className={`${inputBase} font-mono uppercase`}
                              />
                            </FormControl>
                            <FormMessage className="text-[12px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                              City (Optional)
                            </FormLabel>
                            <FormControl>
                              <input
                                {...field}
                                placeholder="Hyderabad"
                                className={inputBase}
                              />
                            </FormControl>
                            <FormMessage className="text-[12px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                              State (Optional)
                            </FormLabel>
                            <FormControl>
                              <input
                                {...field}
                                placeholder="Telangana"
                                className={inputBase}
                              />
                            </FormControl>
                            <FormMessage className="text-[12px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={addingBranch}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingBranch ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Landmark size={14} />
                        )}
                        Create branch
                      </button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="text-[12.5px] text-ink/40">
                  Your plan allows unlimited branches.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TEAM MEMBERS TAB ── */}
      {activeTab === "team" && (
        <div className="flex flex-col gap-6">
          {/* Action row */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="text-[12.5px] text-ink/55">
              {teamStatus === "loading" && !teamItems.length
                ? "Loading team members…"
                : limits?.maxUsers != null
                  ? `${teamItems.length} of ${limits.maxUsers} user seats used`
                  : `${teamItems.length} member${teamItems.length === 1 ? "" : "s"} in your organisation`}
            </div>
            {seatsFull ? (
              <div className="flex items-center gap-2 border border-stamp/30 bg-stamp-dim px-3 py-2 text-[12.5px] text-ink/70">
                <Lock size={14} className="shrink-0 text-stamp" />
                <span>
                  All {limits?.maxUsers} seats used.{" "}
                  <Link
                    href="/subscription"
                    className="font-semibold text-stamp underline"
                  >
                    Upgrade
                  </Link>{" "}
                  to add more users.
                </span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAddForm(s => !s);
                  setMemberMsg(null);
                }}
                className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep focus:outline-none focus:ring-2 focus:ring-teal-mid/30"
              >
                {showAddForm ? <X size={16} /> : <Plus size={16} />}
                {showAddForm ? "Cancel" : "Add Team Member"}
              </button>
            )}
          </div>

          {memberMsg && (
            <div
              className={`flex items-start gap-2.5 border p-3 text-[12.5px] leading-relaxed ${
                memberMsg.type === "ok"
                  ? "border-teal-mid/25 bg-teal-mid/10 text-teal-mid"
                  : "border-danger/30 bg-danger/10 text-danger"
              }`}
            >
              {memberMsg.type === "ok" ? (
                <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              )}
              <span>{memberMsg.text}</span>
            </div>
          )}

          {/* Add member form */}
          {showAddForm && (
            <Form {...memberForm}>
              <form
                onSubmit={memberForm.handleSubmit(handleAddMember)}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]"
              >
                <div className="border-b border-line px-5 py-3.5">
                  <div className="text-[13px] font-semibold text-ink">
                    Invite new team member
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink/50">
                    They receive immediate access with a temporary password you set
                    below.
                  </div>
                </div>
                <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    control={memberForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                          Full Name *
                        </FormLabel>
                        <FormControl>
                          <input {...field} placeholder="Priya Menon" className={inputBase} />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={memberForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                          Email *
                        </FormLabel>
                        <FormControl>
                          <input
                            type="email"
                            {...field}
                            placeholder="priya@pharmasuite.in"
                            className={inputBase}
                          />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={memberForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                          Temporary Password *
                        </FormLabel>
                        <FormControl>
                          <input
                            type="password"
                            {...field}
                            placeholder="Min 8 chars, letters + numbers"
                            className={inputBase}
                          />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={memberForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                          Mobile (Optional)
                        </FormLabel>
                        <FormControl>
                          <input {...field} placeholder="98765 43210" className={`${inputBase} font-mono`} />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={memberForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                          Role *
                        </FormLabel>
                        <FormControl>
                          <select {...field} className={`${inputBase} cursor-pointer`}>
                            {assignableRoles.map(r => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={memberForm.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                          Branch (Optional)
                        </FormLabel>
                        <FormControl>
                          <select {...field} className={`${inputBase} cursor-pointer`}>
                            <option value="">Unassigned</option>
                            {branches.map(b => (
                              <option key={b.id} value={b.id}>
                                {b.name} ({b.code})
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end border-t border-line px-5 py-4">
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep focus:outline-none focus:ring-2 focus:ring-teal-mid/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingMember ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Plus size={15} />
                    )}
                    Create account
                  </button>
                </div>
              </form>
            </Form>
          )}

          {/* Members table */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            {teamStatus === "loading" && !teamItems.length ? (
              <div className="flex items-center justify-center gap-2 px-12 py-14 text-[13px] text-ink/45">
                <Loader2 size={16} className="animate-spin" />
                Loading team members…
              </div>
            ) : teamStatus === "error" && !teamItems.length ? (
              <div className="flex flex-col items-center gap-4 px-12 py-14 text-center">
                <AlertTriangle size={32} className="text-danger/60" />
                <div>
                  <div className="text-[14px] font-medium text-ink">
                    Could not load team members.
                  </div>
                  <div className="mt-1 text-[12.5px] text-ink/50">
                    {team?.error || "Something went wrong while fetching the list."}
                  </div>
                </div>
                <button
                  onClick={() => void dispatch(fetchTeam())}
                  className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
                >
                  Retry
                </button>
              </div>
            ) : teamItems.length === 0 ? (
              <div className="px-12 py-14 text-center text-ink/40">
                <Users size={32} className="mx-auto mb-3 opacity-40" />
                <div className="text-[14px]">
                  No team members yet. Add your first member to get started.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[13.5px]">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                        Member
                      </th>
                      <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                        Contact
                      </th>
                      <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                        Branch
                      </th>
                      <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                        Role
                      </th>
                      <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                        Status
                      </th>
                      <th className="px-4 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                        Last Login
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamItems.map(member => {
                      const isCurrentUser = member.id === user?.id;
                      const isUpdating = updatingId === member.id;
                      return (
                        <tr
                          key={member.id}
                          className="border-b border-line/60 transition-colors hover:bg-paper/70"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-stamp/50 bg-stamp-dim text-[11px] font-bold text-stamp">
                                {member.fullName
                                  .split(" ")
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map(p => p[0]?.toUpperCase() ?? "")
                                  .join("")}
                              </div>
                              <div>
                                <div className="font-semibold text-ink">
                                  {member.fullName}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-[10.5px] font-semibold uppercase tracking-wide text-stamp font-mono">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/40 font-mono">
                                  <KeyRound size={10} /> {member.id.slice(0, 8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-ink/60">
                            <div className="flex items-center gap-1 text-[12px]">
                              <Mail size={12} className="text-ink/40" />
                              {member.email}
                            </div>
                            {member.phone && (
                              <div className="mt-0.5 flex items-center gap-1 text-[12px] text-ink/50">
                                <Phone size={12} className="text-ink/40" />
                                {member.phone}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-ink/70">
                            {member.branch?.name ?? (
                              <span className="text-ink/40">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {isCurrentUser ? (
                              <span className="text-[12.5px] font-semibold text-ink/70">
                                {ROLE_LABELS[member.role]}
                              </span>
                            ) : (
                              <select
                                value={member.role}
                                disabled={isUpdating}
                                onChange={e => {
                                  const newRole = e.target.value as TeamRole;
                                  if (canAssignRole(userPermissions ?? [], newRole)) {
                                    void handleRoleChange(member, newRole);
                                  }
                                }}
                                className="cursor-pointer rounded-lg border border-line bg-white px-2 py-1 text-[12.5px] font-medium text-ink focus:outline-none focus:border-teal-mid disabled:opacity-50"
                              >
                                {assignableRoles
                                  .filter(r => canAssignRole(userPermissions ?? [], r))
                                  .map(r => (
                                    <option key={r} value={r}>
                                      {ROLE_LABELS[r]}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {isCurrentUser ? (
                              <span
                                className={`px-2 py-0.5 text-[11.5px] font-semibold ${STATUS_BADGE[member.status]}`}
                              >
                                {member.status}
                              </span>
                            ) : (
                              <select
                                value={member.status}
                                disabled={isUpdating}
                                onChange={e =>
                                  void handleStatusChange(
                                    member,
                                    e.target.value as TeamStatus,
                                  )
                                }
                                className="cursor-pointer rounded-lg border border-line bg-white px-2 py-1 text-[12px] font-semibold focus:outline-none focus:border-teal-mid disabled:opacity-50"
                              >
                                {(["ACTIVE", "INACTIVE", "SUSPENDED"] as TeamStatus[]).map(
                                  s => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ),
                                )}
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[12px] text-ink/45">
                            {member.lastLoginAt
                              ? new Date(member.lastLoginAt).toLocaleString()
                              : "Never"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
