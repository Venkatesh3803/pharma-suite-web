"use client";

import React, { useState } from "react";
import Link from "next/link";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";

import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { ShieldCheck, Loader2, Building2, Smartphone, FileText, MapPin, Briefcase, ChevronDown, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { authApi, setAccessToken } from "@/lib/api";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setSession } from "@/lib/redux/slices/authSlice";
import { fetchWorkspace } from "@/lib/redux/slices/workspaceSlice";

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
    ["--line-dark" as string]: "rgba(247,244,236,0.16)",
    ["--danger" as string]: "#B23A2E",
    ["--danger-bg" as string]: "#FBEDE9"
} as React.CSSProperties;

const pharmaWorkspaceTypes = [
    { value: "SinglePharmacy", label: "Single Retail Pharmacy" },
    { value: "Warehouse", label: "Central Inventory Warehouse" },
    { value: "ChainBranch", label: "Retail Chain Branch" },
    { value: "ManufacturingUnit", label: "Manufacturing Unit" },
    { value: "Distributor", label: "Wholesale Distributor" },
    { value: "Hospital", label: "In-Patient Hospital Pharmacy" }
];

const signUpSchema = z
    .object({
        workspaceName: z.string().trim().min(1, "Workspace name is required."),
        workspaceCode: z
            .string()
            .trim()
            .min(1, "Workspace code is required.")
            .regex(/^[a-zA-Z0-9-_]+$/, "Workspace code must be alphanumeric with no spaces (dashes/underscores allowed).")
            .max(12, "Workspace code must be at most 12 characters."),
        type: z.enum(["SinglePharmacy", "Warehouse", "ChainBranch", "ManufacturingUnit", "Distributor", "Hospital"]),
        complianceLicenseNumber: z.string(),
        gstinOrTaxId: z
            .string()
            .optional()
            .or(z.literal(""))
            .refine(v => !v || v.length === 15, "Invalid GSTIN format. An Indian GSTIN must be exactly 15 characters."),
        state: z.string(),
        phone: z
            .string()
            .min(1, "Enter a valid phone number.")
            .regex(/^[0-9+\-\s()]{6,20}$/, "Enter a valid phone number."),
        adminFullName: z.string().trim().min(1, "Full name is required."),
        adminEmail: z
            .string()
            .trim()
            .min(1, "Enter a valid email address for the admin account.")
            .email("Enter a valid email address for the admin account."),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters and include both letters and numbers.")
            .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "Password must be at least 8 characters and include both letters and numbers."),
        confirmPassword: z.string()
    })
    .refine(v => v.password === v.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match."
    });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const dispatch = useAppDispatch();

    const signUpForm = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            workspaceName: "",
            workspaceCode: "",
            type: "SinglePharmacy",
            complianceLicenseNumber: "",
            gstinOrTaxId: "",
            state: "Telangana",
            phone: "",
            adminFullName: "",
            adminEmail: "",
            password: "",
            confirmPassword: ""
        }
    });

    const handleSignUp = async (values: SignUpFormValues) => {
        setError("");
        setLoading(true);

        try {
            const data = await authApi.register({
                fullName: values.adminFullName.trim(),
                email: values.adminEmail.toLowerCase().trim(),
                password: values.password,
                phone: `+91${values.phone}`,
                workspaceName: values.workspaceName.trim(),
                workspaceCode: values.workspaceCode.toUpperCase().trim()
                // gstin: values.gstinOrTaxId ? values.gstinOrTaxId.toUpperCase().trim() : undefined,
                // state: values.state,
                // address: `${values.state}, India`
            });

            setAccessToken(data.accessToken);
            dispatch(setSession(data));
            void dispatch(fetchWorkspace());
            router.push("/onboarding");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't complete workspace registration. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const eyebrow = "text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--stamp)] [font-family:var(--font-mono)]";
    const label = "block text-[11px] font-medium text-[var(--ink)]/70 mb-1.5 [font-family:var(--font-mono)] uppercase tracking-[0.06em]";
    const inputBase =
        "w-full pl-9 pr-3 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-none text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink)]/35 focus:outline-none focus:border-[var(--teal-mid)] focus:ring-2 focus:ring-[var(--teal-mid)]/15 transition-all duration-150 [font-family:var(--font-body)]";

    return (
        <div
            className={`${display.variable} ${body.variable} ${mono.variable} flex min-h-screen w-screen bg-[var(--paper)] [font-family:var(--font-body)]`}
            style={THEME}
        >
            {/* ── LEFT PANEL: PROVISIONING LABEL ── */}
            <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between px-12 py-14 bg-[var(--teal-deep)] overflow-hidden">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: "radial-gradient(#ffffff 1px, transparent 1.4px)",
                        backgroundSize: "22px 22px"
                    }}
                />
                <div
                    className="pointer-events-none absolute top-0 right-0 h-full w-[2px]"
                    style={{
                        backgroundImage: "radial-gradient(circle, var(--paper) 3.2px, transparent 3.4px)",
                        backgroundSize: "1px 18px",
                        backgroundRepeat: "repeat-y",
                        backgroundPosition: "right center"
                    }}
                />

                <div className="flex items-center gap-2.5 relative z-10">
                    <div className="w-8 h-8 border border-[var(--stamp)] flex items-center justify-center text-[var(--stamp)]">
                        <ShieldCheck size={16} strokeWidth={2.25} />
                    </div>
                    <span className="text-[15px] font-semibold text-[var(--paper)] tracking-tight [font-family:var(--font-display)]">
                        Pharma Suite Core
                    </span>
                </div>

                <div className="relative z-10 max-w-md">
                    <span className={eyebrow}>Workspace Provisioning Label</span>
                    <h1 className="text-[32px] leading-[1.12] font-semibold text-[var(--paper)] tracking-tight mt-4 [font-family:var(--font-display)]">
                        Pharmacy Compliance Operating System.
                    </h1>
                    <p className="text-[13.5px] leading-relaxed text-[var(--paper)]/60 mt-4">
                        Provisioning multi-tenant workspaces for pharmaceutical retail and distribution with drug license, batch, and expiry compliance
                        auditing.
                    </p>

                    <div className="mt-8 border-t border-[var(--line-dark)] pt-5 space-y-2 [font-family:var(--font-mono)] text-[11px] text-[var(--paper)]/45">
                        <div className="flex justify-between gap-6">
                            <span>ACTIVE DOMAIN</span>
                            <span className="text-[var(--paper)]/70 uppercase">Pharma Suite · Drug Control</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span>SCOPE</span>
                            <span className="text-[var(--paper)]/70">MULTI-STATE, INDIA</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span>ISSUER</span>
                            <span className="text-[var(--paper)]/70">RETAILSUITE ENGINE</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                    <div className="relative w-[92px] h-[92px] shrink-0">
                        <svg viewBox="0 0 160 160" className="w-full h-full">
                            <defs>
                                <path id="stampRing" d="M 80,80 m -62,0 a 62,62 0 1,1 124,0 a 62,62 0 1,1 -124,0" />
                            </defs>
                            <circle cx="80" cy="80" r="70" fill="none" stroke="var(--stamp)" strokeWidth="1" strokeDasharray="1.5 4.5" opacity="0.7" />
                            <circle cx="80" cy="80" r="54" fill="none" stroke="var(--stamp)" strokeWidth="1" opacity="0.9" />
                            <text fontSize="8.4" fill="var(--stamp)" letterSpacing="2.2" opacity="0.9">
                                <textPath href="#stampRing" startOffset="2%">
                                    SECURED · MULTI-TENANT · VERIFIED WORKSPACE ·
                                </textPath>
                            </text>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ShieldCheck size={26} className="text-[var(--stamp)]" strokeWidth={1.75} />
                        </div>
                    </div>
                    <div className="text-[11px] text-[var(--paper)]/40 [font-family:var(--font-mono)] text-right leading-relaxed">
                        © 2026 RetailSuite
                        <br />
                        Enterprise Infrastructure
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL: FORM ── */}
            <div className="flex-1 flex flex-col justify-center px-6 py-14 sm:px-12 md:px-20 overflow-y-auto">
                <div className="w-full max-w-lg mx-auto">
                    <span className={eyebrow}>New Workspace</span>
                    <h2 className="text-[26px] font-semibold text-[var(--ink)] tracking-tight mt-2 [font-family:var(--font-display)]">
                        Register your workspace
                    </h2>
                    <p className="text-[13.5px] text-[var(--ink)]/55 mt-1.5 leading-relaxed">
                        Configure a licensed pharmaceutical workspace with drug, GST, and compliance identifiers.
                    </p>

                    {error && (
                        <div className="flex items-start gap-2.5 bg-[var(--danger-bg)] border border-[var(--danger)]/25 text-[var(--danger)] text-[12.5px] leading-relaxed p-3.5 mt-6">
                            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Form {...signUpForm}>
                        <form onSubmit={signUpForm.handleSubmit(handleSignUp)} noValidate className="flex flex-col gap-6 mt-7">
                            {/* SECTION: ENTITY */}
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={eyebrow}>Entity Details</span>
                                    <div className="h-px flex-1 bg-[var(--line)]" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <FormField
                                            control={signUpForm.control}
                                            name="workspaceCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={label}>Workspace Code</FormLabel>
                                                    <div className="relative">
                                                        <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35" />
                                                        <FormControl>
                                                            <input
                                                                type="text"
                                                                {...field}
                                                                placeholder="APOLLO-HYD-01"
                                                                className={`${inputBase} uppercase [font-family:var(--font-mono)]`}
                                                            />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage className="text-[12px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <FormField
                                            control={signUpForm.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={label}>Entity Type</FormLabel>
                                                    <div className="relative">
                                                        <Briefcase
                                                            size={15}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35 pointer-events-none"
                                                        />
                                                        <FormControl>
                                                            <select {...field} className={`${inputBase} pr-8 appearance-none cursor-pointer`}>
                                                                {pharmaWorkspaceTypes.map(t => (
                                                                    <option key={t.value} value={t.value}>
                                                                        {t.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </FormControl>
                                                        <ChevronDown
                                                            size={14}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35 pointer-events-none"
                                                        />
                                                    </div>
                                                    <FormMessage className="text-[12px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <FormField
                                        control={signUpForm.control}
                                        name="workspaceName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={label}>Trading Name</FormLabel>
                                                <div className="relative">
                                                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35" />
                                                    <FormControl>
                                                        <input
                                                            type="text"
                                                            {...field}
                                                            placeholder="Apollo Diagnostics & Pharma Hub"
                                                            className={inputBase}
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* SECTION: CONTACT */}
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={eyebrow}>Contact</span>
                                    <div className="h-px flex-1 bg-[var(--line)]" />
                                </div>
                                <FormField
                                    control={signUpForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={label}>Mobile Number</FormLabel>
                                            <div className="relative">
                                                <Smartphone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35" />
                                                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-[var(--ink)]/50 text-[13px] [font-family:var(--font-mono)]">
                                                    +91
                                                </span>
                                                <FormControl>
                                                    <input
                                                        type="tel"
                                                        {...field}
                                                        placeholder="98765 43210"
                                                        className={`${inputBase} pl-16 [font-family:var(--font-mono)]`}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage className="text-[12px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* SECTION: ADMIN ACCOUNT */}
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={eyebrow}>Admin Account</span>
                                    <div className="h-px flex-1 bg-[var(--line)]" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <FormField
                                            control={signUpForm.control}
                                            name="adminFullName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={label}>Full Name</FormLabel>
                                                    <FormControl>
                                                        <input
                                                            type="text"
                                                            {...field}
                                                            placeholder="Priya Sharma"
                                                            className={`${inputBase} pl-3`}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[12px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <FormField
                                            control={signUpForm.control}
                                            name="adminEmail"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={label}>Email</FormLabel>
                                                    <FormControl>
                                                        <input
                                                            type="email"
                                                            {...field}
                                                            placeholder="priya@store.in"
                                                            className={`${inputBase} pl-3`}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[12px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <FormField
                                            control={signUpForm.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={label}>Password</FormLabel>
                                                    <FormControl>
                                                        <input
                                                            type="password"
                                                            {...field}
                                                            placeholder="At least 8 characters"
                                                            className={`${inputBase} pl-3`}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[12px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <FormField
                                            control={signUpForm.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={label}>Confirm Password</FormLabel>
                                                    <FormControl>
                                                        <input
                                                            type="password"
                                                            {...field}
                                                            placeholder="Re-enter password"
                                                            className={`${inputBase} pl-3`}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[12px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-[var(--line)] mt-1" />

                            <div className="flex items-center gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-[var(--ink)] text-[var(--paper)] text-[13.5px] font-medium hover:bg-[var(--teal-deep)] focus:outline-none focus:ring-2 focus:ring-[var(--teal-mid)]/30 flex items-center justify-center gap-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Create workspace"}
                                </button>
                            </div>
                            <p className="text-[11px] text-[var(--ink)]/40 -mt-3 [font-family:var(--font-mono)]">
                                Your password is hashed before it reaches the database.
                            </p>
                        </form>
                    </Form>

                    <div className="text-center mt-8 pt-6 border-t border-[var(--line)] text-[13px] text-[var(--ink)]/55">
                        Already have a configured deployment?{" "}
                        <Link href="/sign-in" className="text-[var(--teal-deep)] hover:text-[var(--stamp)] font-medium transition-colors">
                            Sign in instead
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
