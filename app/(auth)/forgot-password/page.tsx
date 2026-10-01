"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError, authApi } from "@/lib/api";
import OtpInput from "@/components/otp-input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { ShieldCheck, Loader2, Mail, KeyRound, ArrowRight, AlertTriangle, Radio, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

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

const RESEND_COOLDOWN_SECONDS = 60;

type Step = "email" | "otp";

function maskEmail(email: string): string {
    const [local = "", domain] = email.split("@");
    const safeLocal = local.replace(/@/g, "");
    return `${safeLocal.slice(0, 1)}***@${domain}`;
}

function friendlyError(err: unknown, fallback: string): string {
    if (err instanceof ApiError) return err.message;
    return fallback;
}

const forgotEmailSchema = z.object({
    email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email.")
});

const forgotOtpSchema = z.object({
    otp: z.string().length(6, "Enter the 6-digit code.")
});

type ForgotEmailValues = z.infer<typeof forgotEmailSchema>;
type ForgotOtpValues = z.infer<typeof forgotOtpSchema>;

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<Step>("email");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendIn, setResendIn] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const router = useRouter();

    const emailForm = useForm<ForgotEmailValues>({
        resolver: zodResolver(forgotEmailSchema),
        defaultValues: { email: "" }
    });

    const otpForm = useForm<ForgotOtpValues>({
        resolver: zodResolver(forgotOtpSchema),
        defaultValues: { otp: "" }
    });

    useEffect(() => {
        if (resendIn <= 0) return;
        const timer = window.setTimeout(() => setResendIn(s => s - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [resendIn]);

    const email = useWatch({
        control: emailForm.control,
        name: "email",
        defaultValue: ""
    });

    const handleRequestOtp = async (values: ForgotEmailValues) => {
        setError("");
        setNotice("");
        setLoading(true);
        try {
            await authApi.forgotPassword(values.email.trim());
            setStep("otp");
            otpForm.reset({ otp: "" });
            setResendIn(RESEND_COOLDOWN_SECONDS);
            setNotice(`A 6-digit verification code has been sent to ${maskEmail(values.email.trim().toLowerCase())}. It expires in 10 minutes.`);
        } catch (err) {
            setError(friendlyError(err, "We couldn't send the verification code right now. Please try again in a moment."));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (values: ForgotOtpValues) => {
        setError("");
        setNotice("");
        setLoading(true);
        try {
            // The backend stores the reset grant in an HttpOnly cookie;
            // nothing secret touches JS storage here.
            await authApi.verifyOtp(email.trim(), values.otp);
            router.push("/reset-password");
            router.refresh();
        } catch (err) {
            setError(friendlyError(err, "That code didn't work. Double-check it and try again, or request a new one."));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendIn > 0 || resendLoading) return;
        setError("");
        setNotice("");
        setResendLoading(true);
        try {
            await authApi.forgotPassword(email.trim());
            otpForm.reset({ otp: "" });
            setResendIn(RESEND_COOLDOWN_SECONDS);
            setNotice("A new verification code has been sent. It expires in 10 minutes.");
        } catch (err) {
            setError(friendlyError(err, "We couldn't resend the code right now. Please try again in a moment."));
        } finally {
            setResendLoading(false);
        }
    };

    const handleChangeEmail = () => {
        setStep("email");
        otpForm.reset({ otp: "" });
        setError("");
        setNotice("");
        setResendIn(0);
    };

    const eyebrow = "text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--stamp)] [font-family:var(--font-mono)]";
    const label = "block text-[11px] font-medium text-[var(--ink)]/70 mb-1.5 [font-family:var(--font-mono)] uppercase tracking-[0.06em]";
    const inputBase =
        "w-full pl-9 pr-3 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-none text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink)]/35 focus:outline-none focus:border-[var(--teal-mid)] focus:ring-2 focus:ring-[var(--teal-mid)]/15 transition-all duration-150 [font-family:var(--font-body)]";
    const primaryButton =
        "w-full mt-2 py-3 bg-[var(--ink)] text-[var(--paper)] text-[13.5px] font-medium hover:bg-[var(--teal-deep)] focus:outline-none focus:ring-2 focus:ring-[var(--teal-mid)]/30 flex items-center justify-center gap-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

    const stepLabel = step === "email" ? "Request reset" : "Verify OTP";

    return (
        <div
            className={`${display.variable} ${body.variable} ${mono.variable} flex min-h-screen w-screen bg-[var(--paper)] [font-family:var(--font-body)]`}
            style={THEME}
        >
            {/* ── LEFT PANEL: BRAND LEDGER ── */}
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
                    <span className="text-[15px] font-semibold text-[var(--paper)] tracking-tight [font-family:var(--font-display)]">PharmaSuite Core</span>
                </div>

                <div className="relative z-10 max-w-md">
                    <span className={eyebrow}>Account Recovery</span>
                    <h1 className="text-[32px] leading-[1.12] font-semibold text-[var(--paper)] tracking-tight mt-4 [font-family:var(--font-display)]">
                        Keys get lost. The ledger remembers.
                    </h1>
                    <p className="text-[13.5px] leading-relaxed text-[var(--paper)]/60 mt-4">
                        Verify your operator identity with a one-time code, then set a new credential and step back into your workspace.
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
                            <span className="text-[var(--paper)]/70">{step === "email" ? "1 OF 2" : "2 OF 2"}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span>OTP TTL</span>
                            <span className="text-[var(--paper)]/70">10 MINUTES</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                    <div className="relative w-[92px] h-[92px] shrink-0">
                        <svg viewBox="0 0 160 160" className="w-full h-full">
                            <defs>
                                <path id="stampRingForgot" d="M 80,80 m -62,0 a 62,62 0 1,1 124,0 a 62,62 0 1,1 -124,0" />
                            </defs>
                            <circle cx="80" cy="80" r="70" fill="none" stroke="var(--stamp)" strokeWidth="1" strokeDasharray="1.5 4.5" opacity="0.7" />
                            <circle cx="80" cy="80" r="54" fill="none" stroke="var(--stamp)" strokeWidth="1" opacity="0.9" />
                            <text fontSize="8.4" fill="var(--stamp)" letterSpacing="2.2" opacity="0.9">
                                <textPath href="#stampRingForgot" startOffset="2%">
                                    RECOVERY IN PROGRESS · VERIFY OPERATOR ·
                                </textPath>
                            </text>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Lock size={24} className="text-[var(--stamp)]" strokeWidth={1.75} />
                        </div>
                    </div>
                    <div className="text-[11px] text-[var(--paper)]/40 [font-family:var(--font-mono)] text-right leading-relaxed">
                        © 2026 PharmaSuite
                        <br />
                        Compliance Infrastructure
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL: FORM ── */}
            <div className="flex-1 flex flex-col justify-center px-6 py-14 sm:px-12 md:px-20">
                <div className="w-full max-w-sm mx-auto">
                    <span className={eyebrow}>{stepLabel}</span>
                    <h2 className="text-[26px] font-semibold text-[var(--ink)] tracking-tight mt-2 [font-family:var(--font-display)]">
                        {step === "email" ? "Reset your password" : "Verify your email"}
                    </h2>
                    <p className="text-[13.5px] text-[var(--ink)]/55 mt-1.5 leading-relaxed">
                        {step === "email"
                            ? "Tell us the email tied to your workspace and we'll send a verification code."
                            : `We sent a 6-digit verification code to ${maskEmail(email.trim().toLowerCase())}.`}
                    </p>

                    {error && (
                        <div className="flex items-start gap-2.5 bg-[var(--danger-bg)] border border-[var(--danger)]/25 text-[var(--danger)] text-[12.5px] leading-relaxed p-3.5 mt-6">
                            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {notice && (
                        <div className="flex items-start gap-2.5 bg-[var(--teal-deep)]/10 border border-[var(--teal-mid)]/30 text-[var(--teal-deep)] text-[12.5px] leading-relaxed p-3.5 mt-6 [font-family:var(--font-mono)]">
                            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                            <span>{notice}</span>
                        </div>
                    )}

                    {step === "email" && (
                        <Form {...emailForm}>
                            <form onSubmit={emailForm.handleSubmit(handleRequestOtp)} className="flex flex-col gap-5 mt-7" noValidate>
                                <FormField
                                    control={emailForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <label htmlFor="forgot-email" className={label}>
                                                Email
                                            </label>
                                            <div className="relative">
                                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35" />
                                                <FormControl>
                                                    <input
                                                        id="forgot-email"
                                                        type="email"
                                                        autoComplete="email"
                                                        {...field}
                                                        placeholder="operator@pharmasuite.core"
                                                        className={inputBase}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage className="text-[12px]" />
                                        </FormItem>
                                    )}
                                />

                                <button type="submit" disabled={loading} className={primaryButton}>
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                            <span aria-live="polite">Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            Send Verification Code <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </Form>
                    )}

                    {step === "otp" && (
                        <Form {...otpForm}>
                            <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="flex flex-col gap-5 mt-7">
                                <FormField
                                    control={otpForm.control}
                                    name="otp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <label className={label}>One-time code</label>
                                            <div className="flex items-center gap-2">
                                                <KeyRound size={15} className="text-[var(--ink)]/35 shrink-0" />
                                                <FormControl>
                                                    <OtpInput value={field.value} onChange={field.onChange} length={6} autoFocus disabled={loading} />
                                                </FormControl>
                                            </div>
                                            <FormMessage className="text-[12px]" />
                                        </FormItem>
                                    )}
                                />

                                <button type="submit" disabled={loading || email.length === 0} className={primaryButton}>
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                            <span aria-live="polite">Verifying...</span>
                                        </>
                                    ) : (
                                        <>
                                            Verify Code <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>

                                <div className="text-center text-[12.5px] text-[var(--ink)]/55 mt-1">
                                    <span>Didn&apos;t receive it? </span>
                                    {resendIn > 0 ? (
                                        <span className="[font-family:var(--font-mono)] text-[var(--ink)]/70">Resend code in {resendIn}s</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={resendLoading}
                                            className="text-[var(--teal-deep)] hover:text-[var(--stamp)] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {resendLoading ? (
                                                <>
                                                    <Loader2 size={12} className="inline animate-spin mr-1" aria-hidden="true" />
                                                    Sending...
                                                </>
                                            ) : (
                                                "Resend Code"
                                            )}
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleChangeEmail}
                                    className="text-center text-[12.5px] text-[var(--ink)]/50 hover:text-[var(--stamp)] font-medium transition-colors"
                                >
                                    Change email
                                </button>
                            </form>
                        </Form>
                    )}

                    <div className="text-center mt-8 pt-6 border-t border-[var(--line)] text-[13px] text-[var(--ink)]/55">
                        <Link
                            href="/sign-in"
                            className="inline-flex items-center gap-2 text-[var(--teal-deep)] hover:text-[var(--stamp)] font-semibold transition-colors"
                        >
                            <ArrowLeft size={14} /> Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
