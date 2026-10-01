"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import {
    Building2,
    MapPin,
    Users,
    ArrowLeft,
    ArrowRight,
    Check,
    Pill,
    Loader2,
    AlertTriangle,
    CreditCard,
    Wallet,
    QrCode,
    X,
    CheckCircle2
} from "lucide-react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAppDispatch } from "@/lib/redux/hooks";
import { updateWorkspace } from "@/lib/redux/slices/workspaceSlice";
import { selectPlan as dispatchSelectPlan } from "@/lib/redux/slices/subscriptionSlice";
import type { BillingCycle, SelectPlanInput, SubscriptionTier, UpdateWorkspaceInput } from "@/lib/api";
import { setOnboardedCookie } from "@/lib/api";
import { MODULES_BY_TIER, MODULE_LABELS, type FeatureKey } from "@/lib/plans";

const display = Space_Grotesk({
    subsets: ["latin"],
    weight: ["500", "600", "700"],
    variable: "--font-display"
});
const body = IBM_Plex_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-body"
});
const mono = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-mono"
});

const THEME = {
    ["--ink" as string]: "#14201C",
    ["--paper" as string]: "#F7F4EC",
    ["--paper-dim" as string]: "#EFEADC",
    ["--teal-deep" as string]: "#0E3B36",
    ["--teal-mid" as string]: "#1B5A50",
    ["--stamp" as string]: "#C1652B",
    ["--stamp-dim" as string]: "rgba(193,101,43,0.12)",
    ["--line" as string]: "#DED7C4",
    ["--line-dark" as string]: "rgba(247,244,236,0.16)"
} as React.CSSProperties;

const STEPS = [
    { id: 1, title: "Industry", icon: Building2 },
    { id: 2, title: "Location", icon: MapPin },
    { id: 3, title: "Scale", icon: Users },
    { id: 4, title: "Plan", icon: CreditCard }
];

const PLAN_CARDS: {
    tier: SubscriptionTier;
    name: string;
    tagline: string;
    monthly: number;
    annual: number;
    popular?: boolean;
    features: string[];
}[] = [
    {
        tier: "TRIAL_14_DAYS",
        name: "14-Day Free Trial",
        tagline: "Full Standard features. No payment details required.",
        monthly: 0,
        annual: 0,
        features: [
            "2 user seats (Owner + Manager)",
            "1 store branch",
            "POS billing & GST invoices",
            "Inventory with batch & expiry tracking",
            "Purchase orders, GRN & supplier ledger",
            "Schedule H/H1 registers",
            "Full Standard module set"
        ]
    },
    {
        tier: "BASIC",
        name: "Basic",
        tagline: "Single-store pharmacy essentials.",
        monthly: 599,
        annual: 4999,
        features: [
            "2 user seats (Owner + Manager)",
            "1 store branch",
            "POS billing & GST invoices",
            "Inventory, batch & expiry alerts",
            "Purchase orders & supplier ledger",
            "Customers, sales returns & barcode POS",
            "Core finance & reporting"
        ]
    },
    {
        tier: "STANDARD",
        name: "Standard",
        tagline: "The most popular choice for growing pharmacies.",
        monthly: 1299,
        annual: 11999,
        popular: true,
        features: [
            "Everything in Basic · 3 user seats",
            "Schedule H/H1 regulated registers",
            "Dynamic reorders & dead-stock analysis",
            "Quality control & temperature logs",
            "POS offline auto-sync",
            "Advanced reporting suite"
        ]
    },
    {
        tier: "PREMIUM",
        name: "Premium",
        tagline: "Unlimited everything for multi-branch chains.",
        monthly: 2500,
        annual: 23999,
        features: [
            "Everything in Standard · unlimited users",
            "Unlimited branches & stock transfers",
            "Weighing scale integration",
            "Advanced analytics & custom reports",
            "REST API access & audit logs",
            "Dedicated support"
        ]
    }
];

const PAYMENT_DETAILS = {
    upiId: "pharmasuite@hdfcbank",
    upiQrHint: "Scan any UPI app (GPay / PhonePe / Paytm) to pay.",
    bank: {
        beneficiary: "PharmaSuite Retail Solutions Pvt Ltd",
        bankName: "HDFC Bank",
        accountNumber: "50200087654321",
        ifsc: "HDFC0001234"
    },
    note: "After paying, submit the UTR / transaction reference number below. Our team verifies and activates your plan within a few hours."
};

const eyebrow = "text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--stamp)] [font-family:var(--font-mono)]";
const label = "block text-[11px] font-medium text-[var(--ink)]/70 mb-1.5 [font-family:var(--font-mono)] uppercase tracking-[0.06em]";
const inputBase =
    "w-full px-3.5 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-none text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink)]/35 focus:outline-none focus:border-[var(--teal-mid)] focus:ring-2 focus:ring-[var(--teal-mid)]/15 transition-all duration-150 [font-family:var(--font-body)]";
const inputBaseMono = `${inputBase} [font-family:var(--font-mono)] uppercase`;

const onboardingSchema = z.object({
    // STEP 1: INDUSTRY & ENTITY
    industryType: z.string(),
    businessName: z.string().trim().min(1, "Business / legal entity name is required."),
    website: z.string(),
    gstinOrTaxId: z.string(),
    panNumber: z.string(),
    // Pharma Specific
    drugLicenseNumber: z.string().trim().min(1, "Drug license number is required."),
    regulatoryAuthority: z.string(),
    gmpCertified: z.boolean(),

    // STEP 2: LOCATION
    address: z.object({
        street: z.string(),
        area: z.string(),
        city: z.string(),
        district: z.string(),
        state: z.string(),
        zipCode: z.string(),
        country: z.string()
    }),

    // STEP 3: SCALE
    expectedUsers: z.string(),
    outletsCount: z.string().refine(v => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 1), "Must be a whole number of 1 or more."),
    warehousesCount: z.string().refine(v => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "Must be a whole number of 0 or more."),
    checkoutCountersCount: z.string().refine(v => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 1), "Must be a whole number of 1 or more."),
    monthlyOrdersEstimate: z.string(),

    currency: z.string(),
    lowStockThreshold: z.string().refine(v => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "Must be a whole number of 0 or more."),
    allowNegativeStock: z.boolean()
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const stepFields: FieldPath<OnboardingFormValues>[][] = [
    ["businessName", "website", "gstinOrTaxId", "panNumber", "drugLicenseNumber"],
    ["address.street", "address.city", "address.state", "address.zipCode", "address.country"],
    ["outletsCount", "checkoutCountersCount", "warehousesCount", "monthlyOrdersEstimate"]
];

export default function OnboardingPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const form = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            // STEP 1: INDUSTRY & ENTITY
            industryType: "PHARMA",
            businessName: "",
            website: "",
            gstinOrTaxId: "",
            panNumber: "",
            // Pharma Specific
            drugLicenseNumber: "",
            regulatoryAuthority: "CDSCO",
            gmpCertified: false,

            // STEP 2: LOCATION
            address: {
                street: "",
                area: "",
                city: "",
                district: "",
                state: "Telangana",
                zipCode: "",
                country: "India"
            },

            // STEP 3: SCALE
            expectedUsers: "1-5",
            outletsCount: "1",
            warehousesCount: "0",
            checkoutCountersCount: "1",
            monthlyOrdersEstimate: "0-100",

            currency: "INR",
            lowStockThreshold: "10",
            allowNegativeStock: false
        }
    });

    // STEP 5: PLAN SELECTION
    const [planCycle, setPlanCycle] = useState<BillingCycle>("MONTHLY");
    const [planTier, setPlanTier] = useState<SubscriptionTier>("TRIAL_14_DAYS");
    const [planConfirmed, setPlanConfirmed] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentDraft, setPaymentDraft] = useState<{ tier: SubscriptionTier; transactionRef: string; proofUrl: string }>({
        tier: "TRIAL_14_DAYS",
        transactionRef: "",
        proofUrl: ""
    });

    const nextStep = async () => {
        if (step < 4) {
            const valid = await form.trigger(stepFields[step - 1]);
            if (!valid) return;
            setStep(step + 1);
            return;
        }

        await submitAll(form.getValues());
    };

    const submitAll = async (values: OnboardingFormValues) => {
        if (step !== 4) return;

        setSaving(true);
        setError("");

        try {
            await dispatch(updateWorkspace(buildUpdateInput(values))).unwrap();
            await dispatch(dispatchSelectPlan(buildPlanInput())).unwrap();
            setOnboardedCookie();
            router.push("/dashboard/purchase-dashboard");
        } catch (err) {
            setError(typeof err === "string" ? err : "Couldn't save your workspace setup. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const buildPlanInput = (): SelectPlanInput => {
        if (planTier === "TRIAL_14_DAYS") {
            return { tier: "TRIAL_14_DAYS" };
        }
        return {
            tier: planTier,
            billingCycle: planCycle,
            paymentMode: "UPI",
            transactionRef: paymentDraft.transactionRef.trim() || undefined,
            proofUrl: paymentDraft.proofUrl.trim() || undefined
        };
    };

    const openPaymentModal = (tier: SubscriptionTier) => {
        setPaymentDraft({ tier, transactionRef: "", proofUrl: "" });
        setShowPaymentModal(true);
    };

    const confirmPayment = () => {
        if (!paymentDraft.transactionRef.trim()) return;
        setPlanTier(paymentDraft.tier);
        setPlanConfirmed(true);
        setShowPaymentModal(false);
    };

    const selectTrial = () => {
        setPlanTier("TRIAL_14_DAYS");
        setPlanConfirmed(true);
    };

    const buildUpdateInput = (values: OnboardingFormValues): UpdateWorkspaceInput => {
        const addr = values.address;
        const address = [addr.street, addr.area, addr.city, addr.district, addr.state, addr.zipCode, addr.country].filter(Boolean).join(", ");

        return {
            name: values.businessName.trim() || undefined,
            gstin: values.gstinOrTaxId.trim().toUpperCase() || undefined,
            address: address || undefined,
            settings: {
                industryType: values.industryType,
                website: values.website,
                panNumber: values.panNumber,
                drugLicenseNumber: values.drugLicenseNumber,
                regulatoryAuthority: values.regulatoryAuthority,
                gmpCertified: values.gmpCertified,
                address: values.address,
                expectedUsers: values.expectedUsers,
                outletsCount: Number(values.outletsCount) || 1,
                warehousesCount: Number(values.warehousesCount) || 0,
                checkoutCountersCount: Number(values.checkoutCountersCount) || 1,
                monthlyOrdersEstimate: values.monthlyOrdersEstimate,
                modules: MODULES_BY_TIER[planTier] ?? MODULES_BY_TIER.TRIAL_14_DAYS,
                currency: values.currency,
                lowStockThreshold: Number(values.lowStockThreshold) || 10,
                allowNegativeStock: values.allowNegativeStock,
                onboardingCompletedAt: new Date().toISOString()
            }
        };
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
        <div
            className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen w-screen bg-[var(--paper)] flex [font-family:var(--font-body)]`}
            style={THEME}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(submitAll)} className="flex w-full">
                    {/* SIDEBAR */}
                    <div className="hidden lg:flex lg:w-[340px] relative flex-col justify-between px-10 py-12 bg-[var(--teal-deep)] overflow-hidden shrink-0">
                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.05]"
                            style={{
                                backgroundImage: "radial-gradient(#ffffff 1px, transparent 1.4px)",
                                backgroundSize: "22px 22px"
                            }}
                        />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 border border-[var(--stamp)] flex items-center justify-center text-[var(--stamp)] font-semibold text-xs">
                                    PS
                                </div>
                                <span className="text-[15px] font-semibold text-[var(--paper)] tracking-tight [font-family:var(--font-display)]">
                                    PharmaSuite OS
                                </span>
                            </div>

                            <span className={`${eyebrow} block mt-9`}>Workspace Provisioning</span>
                            <p className="text-[13px] text-[var(--paper)]/60 leading-relaxed mt-3">
                                Tailoring pharmacy ERP modules, drug-license requirements, and checkout POS flow for your business model.
                            </p>

                            <div className="mt-10 space-y-1">
                                {STEPS.map(item => {
                                    const Icon = item.icon;
                                    const active = item.id === step;
                                    const completed = item.id < step;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-4 py-3 px-1 border-b transition-all duration-200 ${
                                                active ? "border-[var(--stamp)]/40" : "border-[var(--line-dark)]"
                                            }`}
                                        >
                                            <span
                                                className={`text-[11px] w-5 [font-family:var(--font-mono)] ${
                                                    active ? "text-[var(--stamp)]" : completed ? "text-[var(--paper)]/50" : "text-[var(--paper)]/25"
                                                }`}
                                            >
                                                {String(item.id).padStart(2, "0")}
                                            </span>

                                            <div
                                                className={`w-8 h-8 flex items-center justify-center border transition-all shrink-0 ${
                                                    completed
                                                        ? "border-[var(--stamp)]/50 text-[var(--stamp)] bg-[var(--stamp-dim)]"
                                                        : active
                                                          ? "border-[var(--stamp)] text-[var(--stamp)]"
                                                          : "border-[var(--line-dark)] text-[var(--paper)]/30"
                                                }`}
                                            >
                                                {completed ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} />}
                                            </div>

                                            <span className={`text-[13px] font-medium ${active ? "text-[var(--paper)]" : "text-[var(--paper)]/50"}`}>
                                                {item.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="relative z-10 text-[11px] text-[var(--paper)]/40 [font-family:var(--font-mono)] tracking-wide border-t border-[var(--line-dark)] pt-5">
                            PHARMA · DRUG CONTROL ENGINE
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 flex flex-col justify-center py-12 px-6 md:px-12 max-w-4xl mx-auto w-full">
                        <div className="bg-white border border-[var(--line)] p-8 md:p-10 flex flex-col justify-between min-h-[600px]">
                            <div>
                                {/* STEP 1: INDUSTRY & ENTITY */}
                                {step === 1 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <div>
                                            <span className={eyebrow}>Step 01 · Business Archetype</span>
                                            <h2 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight mt-1.5 [font-family:var(--font-display)]">
                                                Pharmaceutical operations domain
                                            </h2>
                                            <p className="text-[13.5px] text-[var(--ink)]/55 mt-1 leading-relaxed">
                                                Drug-control workflows are pre-configured: batch tracking, drug licenses, CDSCO/FDA logs, and Rx rules.
                                            </p>
                                        </div>

                                        {/* DOMAIN CONFIRMATION */}
                                        <div className="p-4 border border-[var(--stamp)] bg-[var(--stamp-dim)] text-left flex flex-col justify-between transition-all select-none">
                                            <div className="flex items-center justify-between mb-3">
                                                <Pill size={18} className="text-[var(--stamp)]" />
                                                <div className="w-4 h-4 bg-[var(--stamp)] border border-[var(--stamp)] flex items-center justify-center text-white">
                                                    <Check size={10} strokeWidth={3} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[13.5px] font-semibold text-[var(--ink)]">Pharmaceuticals</div>
                                                <div className="text-[11.5px] text-[var(--ink)]/50 mt-1 leading-normal">
                                                    Batch tracking, Drug Licenses, CDSCO/FDA logs, Rx rules.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="md:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name="businessName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>Business / Legal entity name *</FormLabel>
                                                            <FormControl>
                                                                <input
                                                                    type="text"
                                                                    {...field}
                                                                    placeholder="e.g. Apex Healthcare & Retail LLP"
                                                                    className={inputBase}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="gstinOrTaxId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>GSTIN / Tax Registration</FormLabel>
                                                            <FormControl>
                                                                <input
                                                                    type="text"
                                                                    {...field}
                                                                    placeholder="15-CHAR ALPHANUMERIC"
                                                                    className={inputBaseMono}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="panNumber"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>PAN Number</FormLabel>
                                                            <FormControl>
                                                                <input type="text" {...field} placeholder="ABCDE1234F" className={inputBaseMono} />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* DYNAMIC REGULATORY FIELDS */}
                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="drugLicenseNumber"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>Drug License Number *</FormLabel>
                                                            <FormControl>
                                                                <input type="text" {...field} placeholder="TZ-HYD-123456" className={inputBaseMono} />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: LOCATION */}
                                {step === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <div>
                                            <span className={eyebrow}>Step 02 · Location</span>
                                            <h2 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight mt-1.5 [font-family:var(--font-display)]">
                                                Primary dispatch & store hub
                                            </h2>
                                            <p className="text-[13.5px] text-[var(--ink)]/55 mt-1 leading-relaxed">
                                                Set up your head office or main store node.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name="address.street"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>Street Address</FormLabel>
                                                            <FormControl>
                                                                <input
                                                                    type="text"
                                                                    {...field}
                                                                    placeholder="Store #4, Retail Complex"
                                                                    className={inputBase}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="address.city"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>City</FormLabel>
                                                            <FormControl>
                                                                <input type="text" {...field} placeholder="Hyderabad" className={inputBase} />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="address.state"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>State</FormLabel>
                                                            <FormControl>
                                                                <input type="text" {...field} placeholder="Telangana" className={inputBase} />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="address.zipCode"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>Postal Code</FormLabel>
                                                            <FormControl>
                                                                <input type="text" {...field} placeholder="500081" className={inputBaseMono} />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="address.country"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>Country</FormLabel>
                                                            <FormControl>
                                                                <input
                                                                    {...field}
                                                                    readOnly
                                                                    className={`${inputBase} bg-[var(--paper-dim)] text-[var(--ink)]/60`}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: SCALE */}
                                {step === 3 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <div>
                                            <span className={eyebrow}>Step 03 · Hardware & Scale</span>
                                            <h2 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight mt-1.5 [font-family:var(--font-display)]">
                                                Capacity & POS infrastructure
                                            </h2>
                                            <p className="text-[13.5px] text-[var(--ink)]/55 mt-1 leading-relaxed">
                                                Specify counter terminals, storage hubs, and staffing requirements.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="outletsCount"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>Active Outlets / Branches</FormLabel>
                                                            <FormControl>
                                                                <input type="number" min={1} {...field} className={inputBase} />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="checkoutCountersCount"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>Checkout Counters (POS terminals)</FormLabel>
                                                            <FormControl>
                                                                <input type="number" min={1} {...field} className={inputBase} />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="warehousesCount"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>Warehouses / Dark Stores</FormLabel>
                                                            <FormControl>
                                                                <input type="number" min={0} {...field} className={inputBase} />
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="monthlyOrdersEstimate"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={label}>Expected Monthly Transaction Volume</FormLabel>
                                                            <FormControl>
                                                                <select {...field} className={inputBase}>
                                                                    <option value="0-500">0–500 sales/mo</option>
                                                                    <option value="500-2000">500–2,000 sales/mo</option>
                                                                    <option value="2000-10000">2,000–10,000 sales/mo</option>
                                                                    <option value="10000+">High scale (10,000+)</option>
                                                                </select>
                                                            </FormControl>
                                                            <FormMessage className="text-[12px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: PLAN SELECTION */}
                                {step === 4 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <span className={eyebrow}>Step 04 · Subscription Plan</span>
                                                <h2 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight mt-1.5 [font-family:var(--font-display)]">
                                                    Choose how you pay
                                                </h2>
                                                <p className="text-[13.5px] text-[var(--ink)]/55 mt-1 leading-relaxed">
                                                    Start free for 14 days — no payment details required — or pick a paid plan and pay via UPI / bank
                                                    transfer. Your modules are provisioned automatically from the plan you choose.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-[var(--paper-dim)] p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setPlanCycle("MONTHLY")}
                                                    className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                                                        planCycle === "MONTHLY" ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--ink)]/50"
                                                    }`}
                                                >
                                                    Monthly
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPlanCycle("ANNUAL")}
                                                    className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                                                        planCycle === "ANNUAL" ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--ink)]/50"
                                                    }`}
                                                >
                                                    Annual <span className="text-[var(--stamp)]">-20%</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {PLAN_CARDS.map(card => {
                                                const active = planTier === card.tier;
                                                const price = planCycle === "ANNUAL" ? card.annual : card.monthly;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={card.tier}
                                                        onClick={() => {
                                                            if (card.tier === "TRIAL_14_DAYS") {
                                                                selectTrial();
                                                            } else {
                                                                openPaymentModal(card.tier);
                                                            }
                                                        }}
                                                        className={`relative flex flex-col text-left p-4 border transition-all select-none ${
                                                            active
                                                                ? "bg-[var(--stamp-dim)] border-[var(--stamp)]/50"
                                                                : "bg-white border-[var(--line)] hover:border-[var(--teal-mid)]"
                                                        }`}
                                                    >
                                                        {card.popular && (
                                                            <span className="absolute right-3 top-3 bg-[var(--stamp)] text-white text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 [font-family:var(--font-mono)]">
                                                                Popular
                                                            </span>
                                                        )}
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[13px] font-semibold text-[var(--ink)]">{card.name}</span>
                                                            <div
                                                                className={`w-4 h-4 flex items-center justify-center transition-all shrink-0 ${
                                                                    active ? "bg-[var(--stamp)] text-white" : "border border-[var(--ink)]/25"
                                                                }`}
                                                            >
                                                                {active && <Check size={10} strokeWidth={3} />}
                                                            </div>
                                                        </div>
                                                        <div className="text-[10.5px] text-[var(--ink)]/45 mt-0.5 leading-tight">{card.tagline}</div>
                                                        <div className="mt-3 flex items-baseline gap-1">
                                                            <span className="text-[20px] font-bold text-[var(--ink)] [font-family:var(--font-display)]">
                                                                ₹{price.toLocaleString("en-IN")}
                                                            </span>
                                                            <span className="text-[10.5px] text-[var(--ink)]/45 [font-family:var(--font-mono)]">
                                                                / {card.tier === "TRIAL_14_DAYS" ? "14 days" : planCycle === "ANNUAL" ? "yr" : "mo"}
                                                            </span>
                                                        </div>
                                                        <ul className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-3">
                                                            {card.features.map(f => (
                                                                <li key={f} className="flex items-start gap-1.5 text-[11px] text-[var(--ink)]/70">
                                                                    <Check size={11} className="mt-0.5 text-[var(--teal-mid)] shrink-0" />
                                                                    {f}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {planConfirmed && planTier !== "TRIAL_14_DAYS" && (
                                            <div className="flex items-start gap-2.5 border border-[var(--stamp)]/40 bg-[var(--stamp-dim)] p-3.5 text-[12.5px] leading-relaxed text-[var(--ink)]/80">
                                                <CreditCard size={15} className="mt-0.5 shrink-0 text-[var(--stamp)]" />
                                                <span>
                                                    <strong>{PLAN_CARDS.find(c => c.tier === planTier)?.name}</strong> selected · payment reference{" "}
                                                    <strong className="[font-family:var(--font-mono)]">{paymentDraft.transactionRef}</strong> submitted.
                                                    We&apos;ll verify it and activate your plan shortly.
                                                </span>
                                            </div>
                                        )}

                                        <div className="border border-[var(--line)] bg-[var(--paper)] p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]/50 [font-family:var(--font-mono)]">
                                                    Modules provisioned with this plan
                                                </span>
                                                <span className="text-[10.5px] text-[var(--ink)]/45 [font-family:var(--font-mono)]">
                                                    {Object.keys(MODULES_BY_TIER[planTier]).filter(k => MODULES_BY_TIER[planTier][k]).length}
                                                    {" / "}
                                                    {Object.keys(MODULES_BY_TIER[planTier]).length} enabled
                                                </span>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                                                {Object.keys(MODULES_BY_TIER[planTier]).map(key => {
                                                    const active = MODULES_BY_TIER[planTier][key];
                                                    return (
                                                        <div
                                                            key={key}
                                                            className={`flex items-center gap-2 px-2.5 py-2 border text-[11.5px] transition-all ${
                                                                active
                                                                    ? "border-[var(--teal-mid)]/25 bg-white text-[var(--ink)]"
                                                                    : "border-[var(--line)] text-[var(--ink)]/35"
                                                            }`}
                                                        >
                                                            <div
                                                                className={`w-3.5 h-3.5 flex items-center justify-center shrink-0 ${
                                                                    active ? "bg-[var(--teal-mid)] text-white" : "border border-[var(--ink)]/20"
                                                                }`}
                                                            >
                                                                {active && <Check size={9} strokeWidth={3} />}
                                                            </div>
                                                            {MODULE_LABELS[key as FeatureKey] ?? key}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* FOOTER ACTIONS */}
                            <div className="pt-8 border-t border-[var(--line)] mt-8">
                                {error && (
                                    <div className="flex items-start gap-2.5 bg-[var(--danger-bg)] border border-[var(--danger)]/25 text-[var(--danger)] text-[12.5px] leading-relaxed p-3.5 mb-6">
                                        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        disabled={step === 1 || saving}
                                        className={`flex items-center gap-2 px-4 py-2.5 border border-[var(--line)] text-[12.5px] font-medium transition-all ${
                                            step === 1 || saving
                                                ? "opacity-30 cursor-not-allowed text-[var(--ink)]"
                                                : "text-[var(--ink)] hover:bg-[var(--paper-dim)]"
                                        }`}
                                    >
                                        <ArrowLeft size={14} />
                                        Previous
                                    </button>

                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={saving || (step === 4 && !planConfirmed)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-[var(--teal-deep)] text-white text-[12.5px] font-medium hover:bg-[var(--teal-mid)] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : step === 4 ? (
                                            <Check size={14} />
                                        ) : (
                                            <ArrowRight size={14} />
                                        )}
                                        {saving ? "Saving workspace…" : step === 4 ? "Complete provision" : "Next step"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>

            {/* ── OFFLINE PAYMENT MODAL ── */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--ink)]/60 p-4">
                    <div className="w-full max-w-md border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className={eyebrow}>Offline Payment · {paymentDraft.tier}</span>
                                <h2 className="mt-1.5 text-[18px] font-semibold text-[var(--ink)] tracking-tight [font-family:var(--font-display)]">
                                    Complete your manual payment
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                className="cursor-pointer border-0 bg-transparent p-1 text-[var(--ink)]/50 hover:text-[var(--danger)]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            <div className="border border-[var(--teal-mid)]/25 bg-[var(--teal-mid)]/10 p-4">
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--teal-mid)] [font-family:var(--font-mono)]">
                                    <QrCode size={14} /> UPI Payment
                                </div>
                                <div className="mt-3 flex items-center gap-4">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-[var(--teal-mid)]/40 bg-white text-[var(--teal-mid)]">
                                        <QrCode size={36} strokeWidth={1.4} />
                                    </div>
                                    <div>
                                        <div className="text-[10.5px] text-[var(--ink)]/50">{PAYMENT_DETAILS.upiQrHint}</div>
                                        <div className="mt-1 flex items-center gap-1.5 text-[14px] font-bold text-[var(--ink)] [font-family:var(--font-mono)]">
                                            <Wallet size={15} className="text-[var(--teal-mid)]" />
                                            {PAYMENT_DETAILS.upiId}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-[var(--line)] bg-white p-4">
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]/50 [font-family:var(--font-mono)]">
                                    <Building2 size={14} /> NEFT / IMPS / RTGS
                                </div>
                                <dl className="mt-3 space-y-2 text-[12.5px]">
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-[var(--ink)]/50">Beneficiary</dt>
                                        <dd className="text-right font-medium text-[var(--ink)]">{PAYMENT_DETAILS.bank.beneficiary}</dd>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-[var(--ink)]/50">Account No.</dt>
                                        <dd className="text-right font-semibold text-[var(--ink)] [font-family:var(--font-mono)]">
                                            {PAYMENT_DETAILS.bank.accountNumber}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-[var(--ink)]/50">IFSC</dt>
                                        <dd className="text-right font-semibold text-[var(--ink)] [font-family:var(--font-mono)]">
                                            {PAYMENT_DETAILS.bank.ifsc}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <p className="text-[11px] leading-relaxed text-[var(--ink)]/55">{PAYMENT_DETAILS.note}</p>

                            <div>
                                <label className={label}>UTR / Transaction Reference *</label>
                                <input
                                    value={paymentDraft.transactionRef}
                                    onChange={e => setPaymentDraft(prev => ({ ...prev, transactionRef: e.target.value }))}
                                    placeholder="e.g. 414198772190"
                                    className={`${inputBaseMono} bg-white`}
                                />
                            </div>

                            <div>
                                <label className={label}>Payment Screenshot URL (Optional)</label>
                                <input
                                    value={paymentDraft.proofUrl}
                                    onChange={e => setPaymentDraft(prev => ({ ...prev, proofUrl: e.target.value }))}
                                    placeholder="https://…/screenshot.jpg"
                                    className={`${inputBase} bg-white`}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={confirmPayment}
                                disabled={!paymentDraft.transactionRef.trim()}
                                className="flex w-full items-center justify-center gap-2 bg-[var(--teal-deep)] px-4 py-2.5 text-[12.5px] font-medium text-white transition-all hover:bg-[var(--teal-mid)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <CheckCircle2 size={15} />
                                Confirm payment reference
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
