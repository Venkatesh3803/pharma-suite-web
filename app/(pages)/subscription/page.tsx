"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Crown,
  Loader2,
  Lock,
  RefreshCcw,
  ShieldCheck,
  Store,
  Users,
  Wallet,
  X,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Building2,
  IndianRupee,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchSubscription,
  selectPlan,
} from "@/lib/redux/slices/subscriptionSlice";
import type {
  BillingCycle,
  SelectPlanInput,
  SubscriptionTier,
} from "@/lib/api";
import { formatINR } from "@/lib/inventory";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface PlanCard {
  tier: SubscriptionTier;
  name: string;
  tagline: string;
  monthly: number;
  annual: number;
  popular?: boolean;
  features: string[];
}

const PLANS: PlanCard[] = [
  {
    tier: "BASIC",
    name: "Basic",
    tagline: "Single-store pharmacy essentials.",
    monthly: 599,
    annual: 4999,
    features: ["1 user seat", "1 store branch", "Basic POS billing", "Stock & expiry alerts", "GST invoices"],
  },
  {
    tier: "STANDARD",
    name: "Standard",
    tagline: "The most popular choice for growing pharmacies.",
    monthly: 1299,
    annual: 11999,
    popular: true,
    features: ["3 user seats", "POS offline auto-sync", "Schedule H / H1 digital registers", "Dynamic reorder suggestions"],
  },
  {
    tier: "PREMIUM",
    name: "Premium",
    tagline: "Unlimited everything for multi-branch chains.",
    monthly: 2500,
    annual: 23999,
    features: ["Unlimited users", "Multi-branch stock transfers", "Advanced analytics", "Direct REST API access"],
  },
];

const STATUS_LABEL: Record<string, string> = {
  TRIALING: "Trial Active",
  PENDING_VERIFICATION: "Payment Under Verification",
  ACTIVE: "Plan Active",
  PAST_DUE: "Past Due",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE: Record<string, string> = {
  TRIALING: "border border-stamp/40 bg-stamp-dim text-stamp",
  PENDING_VERIFICATION: "border border-amber-600/30 bg-amber-50 text-amber-700",
  ACTIVE: "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid",
  PAST_DUE: "border border-danger/30 bg-danger/10 text-danger",
  EXPIRED: "border border-danger/40 bg-danger/10 text-danger",
  CANCELLED: "border border-ink/25 bg-paper-dim text-ink/60",
};

const inputBase =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

const paymentSchema = z.object({
  txnRef: z
    .string()
    .trim()
    .min(1, "Please enter the UTR / transaction reference number."),
  proofUrl: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function SubscriptionPage() {
  const dispatch = useAppDispatch();
  const snapshot = useAppSelector(state => state.subscription.snapshot);
  const status = useAppSelector(state => state.subscription.status);
  const error = useAppSelector(state => state.subscription.error);

  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const planForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { txnRef: "", proofUrl: "" },
  });

  useEffect(() => {
    if (status === "idle" && !snapshot) {
      void dispatch(fetchSubscription());
    }
  }, [dispatch, status, snapshot]);

  const current = snapshot?.plan;
  const offline = snapshot?.offlinePayment;

  const openPlanModal = (tier: SubscriptionTier) => {
    setMsg(null);
    planForm.reset();
    setSelectedTier(tier);
  };

  const handleSubmitPlan = async (values: PaymentFormValues) => {
    if (!selectedTier) return;
    setSubmitting(true);
    setMsg(null);
    const input: SelectPlanInput = {
      tier: selectedTier,
      billingCycle: cycle,
      paymentMode: "UPI",
      transactionRef: values.txnRef.trim(),
      proofUrl: values.proofUrl?.trim() || undefined,
    };
    try {
      await dispatch(selectPlan(input)).unwrap();
      setSelectedTier(null);
      setMsg({ type: "ok", text: "Payment reference submitted. Our team will verify it shortly — you can keep using the app in the meantime." });
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Could not submit payment details.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectTrial = async () => {
    setSubmitting(true);
    setMsg(null);
    try {
      await dispatch(selectPlan({ tier: "TRIAL_14_DAYS" })).unwrap();
      setMsg({ type: "ok", text: "You are on the 14-Day Free Trial." });
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Could not switch to the trial plan.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const priceFor = (plan: PlanCard) => (cycle === "ANNUAL" ? plan.annual : plan.monthly);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Monetisation Control
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Subscription & Billing
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Manage your plan tier, track your billing window and submit offline
            payments for verification.
          </p>
        </div>
        {status === "loading" && (
          <div className="flex items-center gap-2 text-[13px] text-ink/50">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 border border-danger/30 bg-danger/10 p-3 text-[13px] text-danger">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {msg && (
        <div
          className={`flex items-start gap-2.5 border p-3 text-[13px] ${
            msg.type === "ok"
              ? "border-teal-mid/25 bg-teal-mid/10 text-teal-mid"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {msg.type === "ok" ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {!snapshot && status !== "loading" && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <AlertTriangle size={36} className="text-danger/50" />
          <div>
            <div className="text-[15px] font-semibold text-ink">Could not load your subscription.</div>
            <div className="mt-1 text-[13px] text-ink/50">
              {error || "Something went wrong while fetching billing details."}
            </div>
          </div>
          <button
            onClick={() => void dispatch(fetchSubscription())}
            className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
          >
            <RefreshCcw size={14} /> Retry
          </button>
        </div>
      )}

      {snapshot && (
        <>
          {/* ── Current Plan Overview ── */}
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)] lg:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink/45 font-mono">
                    Current Plan
                  </span>
                  <div className="mt-1.5 flex items-center gap-2.5">
                    <span className="font-display text-[22px] font-bold tracking-tight text-ink">
                      {current?.displayName ?? "—"}
                    </span>
                    {current && (
                      <span className={`px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[current.status] ?? ""}`}>
                        {STATUS_LABEL[current.status] ?? current.status}
                      </span>
                    )}
                  </div>
                  {current && (
                    <p className="mt-1 text-[13px] text-ink/55">{current.tagline}</p>
                  )}
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stamp-dim text-stamp">
                  {current?.tier === "PREMIUM" ? <Crown size={22} /> : <BadgeCheck size={22} />}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/45 font-mono">Billing Window</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                    <CalendarClock size={15} className="text-teal-mid" />
                    {snapshot.access.daysRemaining} days left
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-ink/45">
                    Renews {new Date(snapshot.expiry.currentPeriodEnd).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/45 font-mono">Billing Cycle</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                    <RefreshCcw size={15} className="text-teal-mid" />
                    {current?.billingCycle === "ANNUAL" ? "Annual" : "Monthly"}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-ink/45">
                    {formatINR(current?.billingCycle === "ANNUAL" ? current?.annualPrice : current?.monthlyPrice)} / {current?.billingCycle === "ANNUAL" ? "yr" : "mo"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink/45 font-mono">
                Access Status
              </span>
              <div className="mt-2 flex items-center gap-2 text-[15px] font-semibold text-ink">
                {snapshot.access.active ? (
                  <>
                    <ShieldCheck size={18} className="text-teal-mid" /> Active Access
                  </>
                ) : (
                  <>
                    <Lock size={18} className="text-danger" /> Locked (Read-Only)
                  </>
                )}
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/55">
                {snapshot.access.active
                  ? "Billing, stock and POS operations are enabled for your workspace."
                  : "Your subscription window has lapsed. Renew to restore billing operations."}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink/45 font-mono">
                Limits Used
              </span>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] text-ink/70">
                    <Users size={15} className="text-ink/40" /> User Seats
                  </span>
                  <span className="font-mono text-[13px] font-semibold text-ink">
                    {snapshot.limits.seatsLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] text-ink/70">
                    <Store size={15} className="text-ink/40" /> Branches
                  </span>
                  <span className="font-mono text-[13px] font-semibold text-ink">
                    {snapshot.limits.branchesLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Billing Cycle Toggle + Plan Cards ── */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <div className="font-display text-[15px] font-semibold text-ink">
                  Choose your plan
                </div>
                <div className="mt-0.5 text-[12px] text-ink/50">
                  Pay by UPI or bank transfer and we verify your payment manually.
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-paper-dim p-1">
                <button
                  onClick={() => setCycle("MONTHLY")}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    cycle === "MONTHLY" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCycle("ANNUAL")}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    cycle === "ANNUAL" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"
                  }`}
                >
                  Annual <span className="text-stamp">-20%</span>
                </button>
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-3">
              {PLANS.map(plan => {
                const isCurrent = current?.tier === plan.tier;
                return (
                  <div
                    key={plan.tier}
                    className={`relative flex flex-col border p-5 transition-all ${
                      plan.popular ? "border-stamp/50 bg-stamp-dim/40" : "border-line bg-white"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute right-4 top-4 bg-stamp px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-paper font-mono">
                        Most Popular
                      </span>
                    )}
                    <div className="text-[13px] font-semibold text-ink">{plan.name}</div>
                    <div className="mt-0.5 text-[12px] text-ink/50">{plan.tagline}</div>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-display text-[26px] font-bold tracking-tight text-ink">
                        {formatINR(priceFor(plan))}
                      </span>
                      <span className="text-[12px] text-ink/45 font-mono">
                        / {cycle === "ANNUAL" ? "yr" : "mo"}
                      </span>
                    </div>
                    <ul className="mt-4 flex flex-1 flex-col gap-2 border-t border-line pt-4">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-[12.5px] text-ink/70">
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-mid" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => openPlanModal(plan.tier)}
                      disabled={submitting}
                      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        isCurrent
                          ? "cursor-default border-teal-mid/40 bg-teal-mid/10 text-teal-mid"
                          : "cursor-pointer border-ink bg-ink text-paper hover:bg-teal-deep"
                      }`}
                    >
                      {isCurrent ? (
                        <>Current Plan</>
                      ) : (
                        <>
                          <CreditCard size={15} /> Switch to {plan.name}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-line px-5 py-4">
              <button
                onClick={() => void handleSelectTrial()}
                disabled={submitting || current?.tier === "TRIAL_14_DAYS"}
                className="cursor-pointer text-[12.5px] font-semibold text-stamp underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                {current?.tier === "TRIAL_14_DAYS" ? "You are on the 14-Day Free Trial" : "Start over on the 14-Day Free Trial"}
              </button>
            </div>
          </div>

          {/* ── Payment History ── */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
              <Wallet size={16} className="text-ink/50" />
              <div className="font-display text-[15px] font-semibold text-ink">
                Payment History
              </div>
            </div>
            {snapshot.payments.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-ink/40">
                No payments recorded yet. Your plan is covered by the free trial.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Date</th>
                      <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Amount</th>
                      <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Mode</th>
                      <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">UTR / Ref</th>
                      <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.payments.map(p => (
                      <tr key={p.id} className="border-b border-line/60 transition-colors hover:bg-paper/70">
                        <td className="px-4 py-3 font-mono text-[12px] text-ink/60">
                          {new Date(p.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-ink">{formatINR(p.amount)}</td>
                        <td className="px-4 py-3 text-ink/60">{p.paymentMode}</td>
                        <td className="px-4 py-3 font-mono text-[12px] text-ink/50">{p.transactionRef ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[11px] font-semibold ${p.status === "PAID" ? "border border-teal-mid/25 bg-teal-mid/10 text-teal-mid" : p.status === "DUE" ? "border border-amber-600/30 bg-amber-50 text-amber-700" : "border border-danger/30 bg-danger/10 text-danger"}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Offline Payment Modal ── */}
      {selectedTier && snapshot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto border border-line bg-paper p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
                  Offline Payment · {selectedTier}
                </span>
                <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-ink">
                  Complete your manual payment
                </h2>
              </div>
              <button
                onClick={() => setSelectedTier(null)}
                className="cursor-pointer border-0 bg-transparent p-1 text-ink/50 transition-colors hover:text-danger"
              >
                <X size={18} />
              </button>
            </div>

            <Form {...planForm}>
            <form onSubmit={planForm.handleSubmit(handleSubmitPlan)} className="mt-5 flex flex-col gap-4">
              {/* UPI block */}
              <div className="border border-teal-mid/25 bg-teal-mid/10 p-4">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-teal-mid font-mono">
                  <QrCode size={15} /> UPI Payment
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-teal-mid/40 bg-white text-teal-mid">
                    <QrCode size={44} strokeWidth={1.4} />
                  </div>
                  <div>
                    <div className="text-[11px] text-ink/50">{offline?.upiQrHint ?? "Scan with any UPI app."}</div>
                    <div className="mt-1 flex items-center gap-1.5 font-mono text-[15px] font-bold text-ink">
                      <Wallet size={16} className="text-teal-mid" /> {offline?.upiId ?? "pharmasuite@hdfcbank"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank block */}
              <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/50 font-mono">
                  <Building2 size={15} /> NEFT / IMPS / RTGS
                </div>
                <dl className="mt-3 space-y-2 text-[13px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink/50">Beneficiary</dt>
                    <dd className="text-right font-medium text-ink">{offline?.bank.beneficiary}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink/50">Bank</dt>
                    <dd className="text-right font-medium text-ink">{offline?.bank.bankName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink/50">Account No.</dt>
                    <dd className="text-right font-mono font-semibold text-ink">{offline?.bank.accountNumber}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink/50">IFSC</dt>
                    <dd className="text-right font-mono font-semibold text-ink">{offline?.bank.ifsc}</dd>
                  </div>
                </dl>
              </div>

              {offline?.note && (
                <div className="flex items-start gap-2 text-[12px] leading-relaxed text-ink/55">
                  <IndianRupee size={13} className="mt-0.5 shrink-0 text-stamp" />
                  <span>{offline.note}</span>
                </div>
              )}

              <FormField
                control={planForm.control}
                name="txnRef"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                      UTR / Transaction Reference *
                    </FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="e.g. 414198772190"
                        className={`${inputBase} font-mono`}
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={planForm.control}
                name="proofUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-ink/60 font-mono">
                      Payment Screenshot URL (Optional)
                    </FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="https://…/screenshot.jpg"
                        className={inputBase}
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />

              {msg && (
                <div className={`flex items-start gap-2 border p-2.5 text-[12.5px] ${msg.type === "ok" ? "border-teal-mid/25 bg-teal-mid/10 text-teal-mid" : "border-danger/30 bg-danger/10 text-danger"}`}>
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{msg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-line pt-4">
                <div className="text-[12.5px] text-ink/55 font-mono">
                  Paying {cycle === "ANNUAL" ? "annually" : "monthly"} · ₹
                  {(cycle === "ANNUAL" ? PLANS.find(p => p.tier === selectedTier)?.annual : PLANS.find(p => p.tier === selectedTier)?.monthly)?.toLocaleString("en-IN")}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-[13px] font-bold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {submitting ? "Submitting…" : "Submit for verification"}
                </button>
              </div>
            </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
