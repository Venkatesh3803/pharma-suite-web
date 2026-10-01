"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    BadgeCheck,
    CheckCircle2,
    Loader2,
    RefreshCcw,
    ShieldCheck,
    XCircle,
    AlertTriangle,
    Wallet,
    Store,
    ChevronDown,
    Save,
    CalendarClock
} from "lucide-react";
import { useAppSelector } from "@/lib/redux/hooks";
import {
    adminSubscriptionApi,
    type AdminSubscriptionListRow,
    type AdminUpdateSubscriptionInput,
    type PendingPaymentRow,
    type SubscriptionStatus,
    type SubscriptionTier
} from "@/lib/api";
import { formatINR, formatDate } from "@/lib/inventory";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const TIER_LABEL: Record<SubscriptionTier, string> = {
    TRIAL_14_DAYS: "Trial",
    BASIC: "Basic",
    STANDARD: "Standard",
    PREMIUM: "Premium"
};

const STATUS_BADGE: Record<string, string> = {
    TRIALING: "border border-stamp/40 bg-stamp-dim text-stamp",
    PENDING_VERIFICATION: "border border-amber-600/30 bg-amber-50 text-amber-700",
    ACTIVE: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
    PAST_DUE: "border border-danger/30 bg-danger/10 text-danger",
    EXPIRED: "border border-danger/40 bg-danger/10 text-danger",
    CANCELLED: "border border-ink/25 bg-paper-dim text-ink/60"
};

const inputBase =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

const overrideSchema = z.object({
    status: z.enum(["TRIALING", "PENDING_VERIFICATION", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"]),
    tier: z.enum(["TRIAL_14_DAYS", "BASIC", "STANDARD", "PREMIUM"]),
    cycle: z.enum(["MONTHLY", "ANNUAL"]),
    trialEndsAt: z.string().optional(),
    periodEnd: z.string().optional(),
    note: z.string().optional()
});

type OverrideFormValues = z.infer<typeof overrideSchema>;

export default function AdminSubscriptionsPage() {
    const user = useAppSelector(state => state.auth.user);
    const [tab, setTab] = useState<"queue" | "overrides">("queue");
    const [pending, setPending] = useState<PendingPaymentRow[]>([]);
    const [subscriptions, setSubscriptions] = useState<AdminSubscriptionListRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
    const [search, setSearch] = useState("");

    const loadAll = useCallback(async (spinner = false) => {
        if (spinner) {
            setLoading(true);
            setNotice(null);
        }
        try {
            const [p, s] = await Promise.all([adminSubscriptionApi.pending(), adminSubscriptionApi.list()]);
            setPending(p);
            setSubscriptions(s);
        } catch (err) {
            setNotice({
                type: "err",
                text: err instanceof Error ? err.message : "Could not load subscription data."
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [p, s] = await Promise.all([adminSubscriptionApi.pending(), adminSubscriptionApi.list()]);
                if (!cancelled) {
                    setPending(p);
                    setSubscriptions(s);
                }
            } catch (err) {
                if (!cancelled) {
                    setNotice({
                        type: "err",
                        text: err instanceof Error ? err.message : "Could not load subscription data."
                    });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (user?.role !== "SUPER_ADMIN") {
        return (
            <div className="flex w-full flex-col items-center justify-center gap-4 py-32 text-center">
                <ShieldCheck size={40} className="text-ink/30" />
                <div>
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Access restricted</h1>
                    <p className="mt-1 text-[13.5px] text-ink/55">Only Super Admin accounts can manage subscriptions and verify offline payments.</p>
                </div>
            </div>
        );
    }

    const handleVerify = async (payment: PendingPaymentRow, action: "APPROVE" | "REJECT") => {
        setBusyId(payment.id);
        setNotice(null);
        try {
            await adminSubscriptionApi.verifyPayment(payment.id, action);
            setNotice({
                type: "ok",
                text:
                    action === "APPROVE"
                        ? `Payment approved — ${payment.organization.name} is now active.`
                        : `Payment rejected — ${payment.organization.name} is now past due.`
            });
            await loadAll();
        } catch (err) {
            setNotice({
                type: "err",
                text: err instanceof Error ? err.message : "Verification failed."
            });
        } finally {
            setBusyId(null);
        }
    };

    const handleOverride = async (sub: AdminSubscriptionListRow, input: AdminUpdateSubscriptionInput) => {
        setBusyId(sub.id);
        setNotice(null);
        try {
            await adminSubscriptionApi.updateStatus(sub.id, input);
            setNotice({ type: "ok", text: `Subscription for ${sub.organization.name} updated.` });
            setExpanded(null);
            await loadAll();
        } catch (err) {
            setNotice({
                type: "err",
                text: err instanceof Error ? err.message : "Could not update subscription."
            });
        } finally {
            setBusyId(null);
        }
    };

    const filteredSubs = subscriptions.filter(s => `${s.organization.name} ${s.organization.code} ${s.id}`.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex w-full flex-col gap-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">SuperAdmin Console</span>
                    <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">Subscription Management</h1>
                    <p className="mt-1 text-[13.5px] text-ink/55">Verify offline UPI / bank-transfer payments and override subscription lifecycles.</p>
                </div>
                <button
                    onClick={() => void loadAll(true)}
                    disabled={loading}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-paper-dim disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {notice && (
                <div
                    className={`flex items-start gap-2.5 border p-3 text-[13px] ${
                        notice.type === "ok" ? "border-teal-mid/25 bg-teal-mid/10 text-teal-mid" : "border-danger/30 bg-danger/10 text-danger"
                    }`}
                >
                    {notice.type === "ok" ? (
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    ) : (
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    )}
                    X<span>{notice.text}</span>
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex w-fit gap-1 rounded-lg bg-paper-dim p-1">
                <button
                    onClick={() => setTab("queue")}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                        tab === "queue" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"
                    }`}
                >
                    <Wallet size={15} />
                    Pending Verification
                    <span className="rounded-lg bg-paper-dim px-1.5 py-0.5 font-mono text-[11px] text-stamp">{pending.length}</span>
                </button>
                <button
                    onClick={() => setTab("overrides")}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                        tab === "overrides" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"
                    }`}
                >
                    <Store size={15} />
                    Subscription Overrides
                    <span className="rounded-lg bg-paper-dim px-1.5 py-0.5 font-mono text-[11px] text-ink/60">{subscriptions.length}</span>
                </button>
            </div>

            {loading && subscriptions.length === 0 && pending.length === 0 ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-white py-16 text-[13px] text-ink/45 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    <Loader2 size={16} className="animate-spin" /> Loading subscription data…
                </div>
            ) : tab === "queue" ? (
                /* ── Verification Queue ── */
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                    {pending.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-16 text-center text-ink/40">
                            <BadgeCheck size={36} className="opacity-40" />
                            <div className="text-[14px]">No pending offline payments.</div>
                            <div className="text-[12.5px]">All submitted UTR references have been processed.</div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-[13px]">
                                <thead>
                                    <tr className="border-b border-line">
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                                            Organization
                                        </th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                                            Requested Plan
                                        </th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Amount</th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                                            UTR / Ref
                                        </th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                                            Submitted
                                        </th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                                            Decision
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pending.map(p => (
                                        <tr key={p.id} className="border-b border-line/60 transition-colors hover:bg-paper/70">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-ink">{p.organization.name}</div>
                                                <div className="mt-0.5 font-mono text-[11px] text-ink/45">
                                                    {p.organization.code} · {p.organization.gstin ?? "No GSTIN"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-ink">{TIER_LABEL[p.subscription.tier]}</span>
                                                <span className="ml-1.5 text-[11px] text-ink/45 font-mono">
                                                    {p.subscription.billingCycle === "ANNUAL" ? "annual" : "monthly"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono font-semibold text-ink">{formatINR(p.amount)}</td>
                                            <td className="px-4 py-3 font-mono text-[12px] text-ink/60">{p.transactionRef ?? "—"}</td>
                                            <td className="px-4 py-3 text-[12px] text-ink/55">{formatDate(p.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => void handleVerify(p, "APPROVE")}
                                                        disabled={busyId === p.id}
                                                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-teal-mid/40 bg-teal-mid/10 px-3 py-1.5 text-[12px] font-bold text-teal-mid transition-colors hover:bg-teal-mid hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {busyId === p.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => void handleVerify(p, "REJECT")}
                                                        disabled={busyId === p.id}
                                                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-[12px] font-bold text-danger transition-colors hover:bg-danger hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <XCircle size={13} /> Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                /* ── Subscription Overrides ── */
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                        <div className="text-[12.5px] text-ink/55">
                            {subscriptions.length} workspace{subscriptions.length === 1 ? "" : "s"} · search by name, code or subscription id
                        </div>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search workspace…"
                            className="max-w-[260px] rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] focus:border-teal-mid focus:outline-none"
                        />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-[13px]">
                                <thead>
                                    <tr className="border-b border-line">
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                                            Organization
                                        </th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Plan</th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Status</th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                                            Period Ends
                                        </th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                                            Payments
                                        </th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubs.map(sub => (
                                        <OverrideRow
                                            key={sub.id}
                                            sub={sub}
                                            expanded={expanded === sub.id}
                                            busy={busyId === sub.id}
                                            onToggle={() => setExpanded(expanded === sub.id ? null : sub.id)}
                                            onSave={input => void handleOverride(sub, input)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function OverrideRow(props: {
    sub: AdminSubscriptionListRow;
    expanded: boolean;
    busy: boolean;
    onToggle: () => void;
    onSave: (input: AdminUpdateSubscriptionInput) => void;
}) {
    const { sub, expanded, busy, onToggle, onSave } = props;

    return (
        <>
            <tr onClick={onToggle} className="cursor-pointer border-b border-line/60 transition-colors hover:bg-paper/70">
                <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{sub.organization.name}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink/45">{sub.organization.code}</div>
                </td>
                <td className="px-4 py-3 font-semibold text-ink">
                    {TIER_LABEL[sub.tier]}
                    <span className="ml-1.5 font-mono text-[11px] font-normal text-ink/45">{sub.billingCycle === "ANNUAL" ? "annual" : "monthly"}</span>
                </td>
                <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[11.5px] font-semibold ${STATUS_BADGE[sub.status] ?? ""}`}>{sub.status}</span>
                </td>
                <td className="px-4 py-3 text-[12.5px] text-ink/60">{formatDate(sub.currentPeriodEnd)}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-ink/60">{sub.paymentCount}</td>
                <td className="px-4 py-3 text-right">
                    <ChevronDown size={16} className={`ml-auto text-ink/40 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </td>
            </tr>
            {expanded && (
                <tr className="border-b border-line bg-paper/60">
                    <td colSpan={6} className="px-6 py-5">
                        <OverrideForm key={`${sub.id}-${sub.updatedAt}`} sub={sub} busy={busy} onSave={onSave} onCancel={onToggle} />
                    </td>
                </tr>
            )}
        </>
    );
}

function OverrideForm(props: {
    sub: AdminSubscriptionListRow;
    busy: boolean;
    onSave: (input: AdminUpdateSubscriptionInput) => void;
    onCancel: () => void;
}) {
    const { sub, busy, onSave, onCancel } = props;
    const form = useForm<OverrideFormValues>({
        resolver: zodResolver(overrideSchema),
        defaultValues: {
            status: sub.status,
            tier: sub.tier,
            cycle: sub.billingCycle,
            trialEndsAt: sub.trialEndsAt.slice(0, 10),
            periodEnd: sub.currentPeriodEnd.slice(0, 10),
            note: ""
        }
    });

    const handleSave = (values: OverrideFormValues) => {
        onSave({
            status: values.status,
            tier: values.tier,
            billingCycle: values.cycle,
            trialEndsAt: values.trialEndsAt ? `${values.trialEndsAt}T23:59:59.000Z` : undefined,
            currentPeriodEnd: values.periodEnd ? `${values.periodEnd}T23:59:59.000Z` : undefined,
            note: values.note?.trim() || undefined
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                                    Status
                                </FormLabel>
                                <FormControl>
                                    <select {...field} className={`${inputBase} cursor-pointer`}>
                                        {(["TRIALING", "PENDING_VERIFICATION", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"] as SubscriptionStatus[]).map(
                                            s => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </FormControl>
                                <FormMessage className="text-[12px]" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="tier"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                                    Plan Tier
                                </FormLabel>
                                <FormControl>
                                    <select {...field} className={`${inputBase} cursor-pointer`}>
                                        {(Object.keys(TIER_LABEL) as SubscriptionTier[]).map(t => (
                                            <option key={t} value={t}>
                                                {TIER_LABEL[t]}
                                            </option>
                                        ))}
                                    </select>
                                </FormControl>
                                <FormMessage className="text-[12px]" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cycle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                                    Billing Cycle
                                </FormLabel>
                                <FormControl>
                                    <select {...field} className={`${inputBase} cursor-pointer`}>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="ANNUAL">Annual</option>
                                    </select>
                                </FormControl>
                                <FormMessage className="text-[12px]" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="trialEndsAt"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                                    Trial Ends
                                </FormLabel>
                                <FormControl>
                                    <input type="date" {...field} className={inputBase} />
                                </FormControl>
                                <FormMessage className="text-[12px]" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="periodEnd"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                                    Billing Period End
                                </FormLabel>
                                <FormControl>
                                    <input type="date" {...field} className={inputBase} />
                                </FormControl>
                                <FormMessage className="text-[12px]" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                            <FormItem className="lg:col-span-2">
                                <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                                    Support Note (notifies owner)
                                </FormLabel>
                                <FormControl>
                                    <input {...field} placeholder="e.g. 30-day grace extension granted" className={inputBase} />
                                </FormControl>
                                <FormMessage className="text-[12px]" />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
                    <div className="mr-auto flex items-center gap-1.5 text-[12px] text-ink/45 font-mono">
                        <CalendarClock size={13} /> sub·{sub.id.slice(0, 8)}
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink/70 transition-colors hover:bg-paper-dim"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={busy}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-5 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Apply override
                    </button>
                </div>
            </form>
        </Form>
    );
}
