"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError, authApi } from "@/lib/api";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { ShieldCheck, Loader2, Lock, AlertTriangle, Radio, KeyRound, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";

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

function friendlyError(err: unknown, fallback: string): string {
    if (err instanceof ApiError) return err.message;
    return fallback;
}

const resetPasswordSchema = z
    .object({
        newPassword: z
            .string()
            .trim()
            .min(8, "Your new password must be at least 8 characters and include both letters and numbers.")
            .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "Include both letters and numbers."),
        confirmPassword: z.string()
    })
    .refine(v => v.newPassword === v.confirmPassword, {
        message: "The two passwords don't match.",
        path: ["confirmPassword"]
    });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { newPassword: "", confirmPassword: "" }
    });

    const handleReset = async (values: ResetPasswordFormValues) => {
        setError("");
        setNotice("");
        setLoading(true);
        try {
            // Reset grant travels in the HttpOnly cookie set by verify-otp.
            await authApi.resetPassword(values.newPassword, values.confirmPassword);
            setSuccess(true);
        } catch (err) {
            setError(friendlyError(err, "We couldn't update your password right now. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    const continueToLogin = () => {
        router.push("/sign-in?reset=success");
        router.refresh();
    };

    const eyebrow = "text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--stamp)] [font-family:var(--font-mono)]";
    const label = "block text-[11px] font-medium text-[var(--ink)]/70 mb-1.5 [font-family:var(--font-mono)] uppercase tracking-[0.06em]";
    const passwordInputBase =
        "w-full pl-9 pr-10 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-none text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink)]/35 focus:outline-none focus:border-[var(--teal-mid)] focus:ring-2 focus:ring-[var(--teal-mid)]/15 transition-all duration-150 [font-family:var(--font-body)]";
    const primaryButton =
        "w-full mt-2 py-3 bg-[var(--ink)] text-[var(--paper)] text-[13.5px] font-medium hover:bg-[var(--teal-deep)] focus:outline-none focus:ring-2 focus:ring-[var(--teal-mid)]/30 flex items-center justify-center gap-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

    const leftPanel = (
        <>
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
                <span className="text-[15px] font-semibold text-[var(--paper)] tracking-tight [font-family:var(--font-display)]">PharmaSuite Core</span>
            </div>

            <div className="relative z-10 max-w-md">
                <span className={eyebrow}>Account Recovery</span>
                <h1 className="text-[32px] leading-[1.12] font-semibold text-[var(--paper)] tracking-tight mt-4 [font-family:var(--font-display)]">
                    New credentials. Same ledger.
                </h1>
                <p className="text-[13.5px] leading-relaxed text-[var(--paper)]/60 mt-4">
                    You&apos;ve proven who you are. Now choose a password only you know, then sign back into your workspace.
                </p>

                <div className="mt-8 border-t border-[var(--line-dark)] pt-5 space-y-2 [font-family:var(--font-mono)] text-[11px] text-[var(--paper)]/45">
                    <div className="flex justify-between gap-6 items-center">
                        <span className="flex items-center gap-2">
                            <Radio size={11} className="text-emerald-400" /> STATUS
                        </span>
                        <span className="text-[var(--paper)]/70">RECOVERY ACTIVE</span>
                    </div>
                    <div className="flex justify-between gap-6">
                        <span>STEP</span>
                        <span className="text-[var(--paper)]/70">FINAL</span>
                    </div>
                    <div className="flex justify-between gap-6">
                        <span>RESET TOKEN</span>
                        <span className="text-[var(--paper)]/70">15 MINUTES</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex items-end justify-between">
                <div className="relative w-[92px] h-[92px] shrink-0">
                    <svg viewBox="0 0 160 160" className="w-full h-full">
                        <defs>
                            <path id="stampRingReset" d="M 80,80 m -62,0 a 62,62 0 1,1 124,0 a 62,62 0 1,1 -124,0" />
                        </defs>
                        <circle cx="80" cy="80" r="70" fill="none" stroke="var(--stamp)" strokeWidth="1" strokeDasharray="1.5 4.5" opacity="0.7" />
                        <circle cx="80" cy="80" r="54" fill="none" stroke="var(--stamp)" strokeWidth="1" opacity="0.9" />
                        <text fontSize="8.4" fill="var(--stamp)" letterSpacing="2.2" opacity="0.9">
                            <textPath href="#stampRingReset" startOffset="2%">
                                NEW CREDENTIAL · AUTHORIZED OPERATOR ·
                            </textPath>
                        </text>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <KeyRound size={24} className="text-[var(--stamp)]" strokeWidth={1.75} />
                    </div>
                </div>
                <div className="text-[11px] text-[var(--paper)]/40 [font-family:var(--font-mono)] text-right leading-relaxed">
                    © 2026 PharmaSuite
                    <br />
                    Compliance Infrastructure
                </div>
            </div>
        </>
    );

    return (
        <div
            className={`${display.variable} ${body.variable} ${mono.variable} flex min-h-screen w-screen bg-[var(--paper)] [font-family:var(--font-body)]`}
            style={THEME}
        >
            <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between px-12 py-14 bg-[var(--teal-deep)] overflow-hidden">{leftPanel}</div>

            <div className="flex-1 flex flex-col justify-center px-6 py-14 sm:px-12 md:px-20">
                <div className="w-full max-w-sm mx-auto">
                    {success ? (
                        <>
                            <span className={eyebrow}>Password reset successful</span>
                            <h2 className="text-[26px] font-semibold text-[var(--ink)] tracking-tight mt-2 [font-family:var(--font-display)]">
                                Your password has been updated
                            </h2>
                            <div className="flex items-start gap-2.5 bg-[var(--teal-deep)]/10 border border-[var(--teal-mid)]/30 text-[var(--teal-deep)] text-[12.5px] leading-relaxed p-3.5 mt-6">
                                <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                                <span>Password reset successful. Your password has been updated successfully.</span>
                            </div>
                            <button onClick={continueToLogin} className={`${primaryButton} mt-6`}>
                                Continue to Login <ArrowRight size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <span className={eyebrow}>Set new password</span>
                            <h2 className="text-[26px] font-semibold text-[var(--ink)] tracking-tight mt-2 [font-family:var(--font-display)]">
                                Create a new password
                            </h2>
                            <p className="text-[13.5px] text-[var(--ink)]/55 mt-1.5 leading-relaxed">
                                Your new password must be secure and different from your previous password.
                            </p>

                            {error && (
                                <div className="flex items-start gap-2.5 bg-[var(--danger-bg)] border border-[var(--danger)]/25 text-[var(--danger)] text-[12.5px] leading-relaxed p-3.5 mt-6">
                                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                            {error && (
                                <div className="text-center mt-4 text-[12.5px]">
                                    <Link
                                        href="/forgot-password"
                                        className="text-[var(--teal-deep)] hover:text-[var(--stamp)] font-semibold transition-colors"
                                    >
                                        Request a new verification code
                                    </Link>
                                </div>
                            )}

                            {notice && (
                                <div className="flex items-start gap-2.5 bg-[var(--teal-deep)]/10 border border-[var(--teal-mid)]/30 text-[var(--teal-deep)] text-[12.5px] leading-relaxed p-3.5 mt-6 [font-family:var(--font-mono)]">
                                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                                    <span>{notice}</span>
                                </div>
                            )}

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleReset)} className="flex flex-col gap-5 mt-7" noValidate>
                                    <FormField
                                        control={form.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <label htmlFor="new-password" className={label}>
                                                    New password
                                                </label>
                                                <div className="relative">
                                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35" />
                                                    <FormControl>
                                                        <input
                                                            id="new-password"
                                                            type={showNew ? "text" : "password"}
                                                            autoComplete="new-password"
                                                            {...field}
                                                            placeholder="At least 8 characters"
                                                            className={passwordInputBase}
                                                        />
                                                    </FormControl>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNew(v => !v)}
                                                        aria-label={showNew ? "Hide new password" : "Show new password"}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink)]/35 hover:text-[var(--teal-deep)] transition-colors"
                                                    >
                                                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                                                    </button>
                                                </div>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <label htmlFor="confirm-password" className={label}>
                                                    Confirm password
                                                </label>
                                                <div className="relative">
                                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35" />
                                                    <FormControl>
                                                        <input
                                                            id="confirm-password"
                                                            type={showConfirm ? "text" : "password"}
                                                            autoComplete="new-password"
                                                            {...field}
                                                            placeholder="Repeat the password"
                                                            className={passwordInputBase}
                                                        />
                                                    </FormControl>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirm(v => !v)}
                                                        aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink)]/35 hover:text-[var(--teal-deep)] transition-colors"
                                                    >
                                                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                                    </button>
                                                </div>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <button type="submit" disabled={loading} className={primaryButton}>
                                        {loading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                                <span aria-live="polite">Updating Password...</span>
                                            </>
                                        ) : (
                                            <>
                                                Reset Password <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </Form>
                        </>
                    )}

                    {success ? null : (
                        <div className="text-center mt-8 pt-6 border-t border-[var(--line)] text-[13px] text-[var(--ink)]/55">
                            <Link
                                href="/sign-in"
                                className="inline-flex items-center gap-2 text-[var(--teal-deep)] hover:text-[var(--stamp)] font-semibold transition-colors"
                            >
                                <ArrowLeft size={14} /> Back to sign in
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
