"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi, clearAccessToken } from "@/lib/api";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setSession } from "@/lib/redux/slices/authSlice";
import { fetchWorkspace } from "@/lib/redux/slices/workspaceSlice";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import {
  ShieldCheck,
  Loader2,
  Mail,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  Radio,
  Lock,
} from "lucide-react";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
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
  ["--danger-bg" as string]: "#FBEDE9",
} as React.CSSProperties;

const signInSchema = z.object({
  username: z.string().trim().min(1, "Enter your email.").email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

type SignInFormValues = z.infer<typeof signInSchema>;

function SignInContent() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const nextParam = searchParams.get("next");
  const dispatch = useAppDispatch();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { username: "", password: "" },
  });

  const handleLogin = async (values: SignInFormValues) => {
    setError("");
    setLoading(true);

    try {
      const data = await authApi.login(values.username.trim(), values.password);

      // Session cookies (HttpOnly) are set by the backend. Drop any legacy
      // localStorage token so the cookie becomes the single credential.
      clearAccessToken();
      dispatch(setSession(data));
      void dispatch(fetchWorkspace());
      // Return to the page the auth proxy originally bounced (`?next=/...`),
      // falling back to the default dashboard. Only allow same-origin paths.
      const next =
        nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
          ? nextParam
          : "/dashboard/purchase-dashboard";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't verify those credentials. Check your email and password and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const eyebrow =
    "text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--stamp)] [font-family:var(--font-mono)]";
  const label =
    "block text-[11px] font-medium text-[var(--ink)]/70 mb-1.5 [font-family:var(--font-mono)] uppercase tracking-[0.06em]";
  const inputBase =
    "w-full pl-9 pr-3 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-none text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink)]/35 focus:outline-none focus:border-[var(--teal-mid)] focus:ring-2 focus:ring-[var(--teal-mid)]/15 transition-all duration-150 [font-family:var(--font-body)]";

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
            backgroundSize: "22px 22px",
          }}
        />
        {/* perforated seam along the right edge, matching sign-up */}
        <div
          className="pointer-events-none absolute top-0 right-0 h-full w-[2px]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--paper) 3.2px, transparent 3.4px)",
            backgroundSize: "1px 18px",
            backgroundRepeat: "repeat-y",
            backgroundPosition: "right center",
          }}
        />

        {/* Wordmark */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 border border-[var(--stamp)] flex items-center justify-center text-[var(--stamp)]">
            <ShieldCheck size={16} strokeWidth={2.25} />
          </div>
          <span className="text-[15px] font-semibold text-[var(--paper)] tracking-tight [font-family:var(--font-display)]">
            PharmaSuite Core
          </span>
        </div>

        {/* Message block */}
        <div className="relative z-10 max-w-md">
          <span className={eyebrow}>Operator Sign-In</span>
          <h1 className="text-[32px] leading-[1.12] font-semibold text-[var(--paper)] tracking-tight mt-4 [font-family:var(--font-display)]">
            The ledger stays open where you left it.
          </h1>
          <p className="text-[13.5px] leading-relaxed text-[var(--paper)]/60 mt-4">
            Inventory lifecycles, wholesale purchase orders, and counter POS
            billing — all reconciled under one workspace, ready the moment you
            sign in.
          </p>

          {/* Live status rows, echoing the ledger metadata pattern */}
          <div className="mt-8 border-t border-[var(--line-dark)] pt-5 space-y-2 [font-family:var(--font-mono)] text-[11px] text-[var(--paper)]/45">
            <div className="flex justify-between gap-6 items-center">
              <span className="flex items-center gap-2">
                <Radio size={11} className="text-emerald-400" /> STATUS
              </span>
              <span className="text-[var(--paper)]/70">
                ALL SYSTEMS OPERATIONAL
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span>SESSION</span>
              <span className="text-[var(--paper)]/70">
                ENCRYPTED · TLS 1.3
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span>ACCESS</span>
              <span className="text-[var(--paper)]/70">
                ROLE-SCOPED CREDENTIALS
              </span>
            </div>
          </div>
        </div>

        {/* Stamp signature element, same motif as sign-up */}
        <div className="relative z-10 flex items-end justify-between">
          <div className="relative w-[92px] h-[92px] shrink-0">
            <svg viewBox="0 0 160 160" className="w-full h-full">
              <defs>
                <path
                  id="stampRingSignIn"
                  d="M 80,80 m -62,0 a 62,62 0 1,1 124,0 a 62,62 0 1,1 -124,0"
                />
              </defs>
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="var(--stamp)"
                strokeWidth="1"
                strokeDasharray="1.5 4.5"
                opacity="0.7"
              />
              <circle
                cx="80"
                cy="80"
                r="54"
                fill="none"
                stroke="var(--stamp)"
                strokeWidth="1"
                opacity="0.9"
              />
              <text
                fontSize="8.4"
                fill="var(--stamp)"
                letterSpacing="2.2"
                opacity="0.9"
              >
                <textPath href="#stampRingSignIn" startOffset="2%">
                  SECURE SESSION · VERIFIED OPERATOR ·
                </textPath>
              </text>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock
                size={24}
                className="text-[var(--stamp)]"
                strokeWidth={1.75}
              />
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
          <span className={eyebrow}>Welcome back</span>
          <h2 className="text-[26px] font-semibold text-[var(--ink)] tracking-tight mt-2 [font-family:var(--font-display)]">
            Sign in to your workspace
          </h2>
          <p className="text-[13.5px] text-[var(--ink)]/55 mt-1.5 leading-relaxed">
            Enter your credentials to open today&apos;s ledger.
          </p>

          {resetSuccess && (
            <div className="flex items-start gap-2.5 bg-[var(--teal-deep)]/10 border border-[var(--teal-mid)]/30 text-[var(--teal-deep)] text-[12.5px] leading-relaxed p-3.5 mt-6">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" />
              <span>
                Your password was reset successfully. Sign in with your new
                password to continue.
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 bg-[var(--danger-bg)] border border-[var(--danger)]/25 text-[var(--danger)] text-[12.5px] leading-relaxed p-3.5 mt-6">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="flex flex-col gap-5 mt-7">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <label className={label}>Email</label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35"
                      />
                      <FormControl>
                        <input
                          type="email"
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-medium text-[var(--ink)]/70 [font-family:var(--font-mono)] uppercase tracking-[0.06em]">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-[11.5px] text-[var(--teal-deep)] hover:text-[var(--stamp)] font-medium transition-colors [font-family:var(--font-mono)]"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <KeyRound
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35"
                      />
                      <FormControl>
                        <input
                          type="password"
                          {...field}
                          placeholder="••••••••"
                          className={inputBase}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-[var(--ink)] text-[var(--paper)] text-[13.5px] font-medium hover:bg-[var(--teal-deep)] focus:outline-none focus:ring-2 focus:ring-[var(--teal-mid)]/30 flex items-center justify-center gap-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Sign in <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </Form>

          <div className="text-center mt-8 pt-6 border-t border-[var(--line)] text-[13px] text-[var(--ink)]/55">
            New to PharmaSuite?{" "}
            <Link
              href="/sign-up"
              className="text-[var(--teal-deep)] hover:text-[var(--stamp)] font-semibold transition-colors"
            >
              Register your workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
