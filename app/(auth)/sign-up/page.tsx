"use client";

import React, { useState } from "react";
import Link from "next/link";

import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import {
  ShieldCheck,
  Loader2,
  Building2,
  Smartphone,
  FileText,
  MapPin,
  Briefcase,
  ChevronDown,
  AlertTriangle,
  ShoppingBag,
  Pill,
} from "lucide-react";
import { useRouter } from "next/navigation";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const isStrongPassword = (password: string) =>
  password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    businessCategory: "pharma" as "pharma" | "grocery",
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
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (category: "pharma" | "grocery") => {
    setFormData({
      ...formData,
      businessCategory: category,
      type: category === "pharma" ? "SinglePharmacy" : "Supermarket",
      complianceLicenseNumber: "",
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[a-zA-Z0-9-_]+$/.test(formData.workspaceCode)) {
      setError(
        "Workspace code must be alphanumeric with no spaces (dashes/underscores allowed).",
      );
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (formData.gstinOrTaxId && formData.gstinOrTaxId.length !== 15) {
      setError(
        "Invalid GSTIN format. An Indian GSTIN must be exactly 15 characters.",
      );
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.adminEmail)) {
      setError("Enter a valid email address for the admin account.");
      return;
    }

    if (!isStrongPassword(formData.password)) {
      setError(
        "Password must be at least 8 characters and include both letters and numbers.",
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const payload = {
      workspace: {
        workspaceCode: formData.workspaceCode.toUpperCase().trim(),
        name: formData.workspaceName.trim(),
        displayName: formData.workspaceName.trim(),
        businessCategory: formData.businessCategory,
        type: formData.type,
        phone: `+91${formData.phone}`,
        licenseNumber: formData.complianceLicenseNumber.trim(),
        gstinOrTaxId: formData.gstinOrTaxId
          ? formData.gstinOrTaxId.toUpperCase().trim()
          : undefined,
        address: {
          state: formData.state,
          country: "India",
          street: "",
          city: "",
          zipCode: "",
        },
      },
      admin: {
        fullName: formData.adminFullName.trim(),
        email: formData.adminEmail.toLowerCase().trim(),
        password: formData.password,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Failed to register workspace.",
        );
      }

      localStorage.setItem("access_token", data.data.accessToken);
      router.push("/onboarding");
    } catch (err: any) {
      setError(
        err?.message ||
          "Couldn't complete workspace registration. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const pharmaWorkspaceTypes = [
    { value: "SinglePharmacy", label: "Single Retail Pharmacy" },
    { value: "Warehouse", label: "Central Inventory Warehouse" },
    { value: "ChainBranch", label: "Retail Chain Branch" },
    { value: "ManufacturingUnit", label: "Manufacturing Unit" },
    { value: "Distributor", label: "Wholesale Distributor" },
    { value: "Hospital", label: "In-Patient Hospital Pharmacy" },
  ];

  const groceryWorkspaceTypes = [
    { value: "Supermarket", label: "Independent Supermarket" },
    { value: "GroceryStore", label: "Kirana / Retail Grocery Store" },
    { value: "Hypermarket", label: "Hypermarket / Megastore" },
    { value: "FMCGDistributor", label: "FMCG Wholesale Distributor" },
    { value: "DarkStore", label: "Quick-Commerce Dark Store" },
    { value: "CentralWarehouse", label: "Grocery Central Warehouse" },
  ];

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu & Kashmir",
  ];

  const activeTypes =
    formData.businessCategory === "pharma"
      ? pharmaWorkspaceTypes
      : groceryWorkspaceTypes;

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
      {/* ── LEFT PANEL: PROVISIONING LABEL ── */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between px-12 py-14 bg-[var(--teal-deep)] overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1.4px)",
            backgroundSize: "22px 22px",
          }}
        />
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

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 border border-[var(--stamp)] flex items-center justify-center text-[var(--stamp)]">
            <ShieldCheck size={16} strokeWidth={2.25} />
          </div>
          <span className="text-[15px] font-semibold text-[var(--paper)] tracking-tight [font-family:var(--font-display)]">
            RetailSuite Core
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <span className={eyebrow}>Workspace Provisioning Label</span>
          <h1 className="text-[32px] leading-[1.12] font-semibold text-[var(--paper)] tracking-tight mt-4 [font-family:var(--font-display)]">
            Unified Commerce & Compliance Operating System.
          </h1>
          <p className="text-[13.5px] leading-relaxed text-[var(--paper)]/60 mt-4">
            Provisioning multi-tenant workspaces for Pharmaceutical distribution
            and FMCG Grocery retail with real-time compliance auditing.
          </p>

          <div className="mt-8 border-t border-[var(--line-dark)] pt-5 space-y-2 [font-family:var(--font-mono)] text-[11px] text-[var(--paper)]/45">
            <div className="flex justify-between gap-6">
              <span>ACTIVE DOMAIN</span>
              <span className="text-[var(--paper)]/70 uppercase">
                {formData.businessCategory === "pharma"
                  ? "Pharma Suite · Drug Control"
                  : "Grocery Suite · FSSAI Compliance"}
              </span>
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
                <path
                  id="stampRing"
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
                <textPath href="#stampRing" startOffset="2%">
                  SECURED · MULTI-TENANT · VERIFIED WORKSPACE ·
                </textPath>
              </text>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck
                size={26}
                className="text-[var(--stamp)]"
                strokeWidth={1.75}
              />
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
            Select your primary business category and configure regulatory
            compliance details.
          </p>

          {error && (
            <div className="flex items-start gap-2.5 bg-[var(--danger-bg)] border border-[var(--danger)]/25 text-[var(--danger)] text-[12.5px] leading-relaxed p-3.5 mt-6">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="flex flex-col gap-6 mt-7">
            {/* SECTION: CATEGORY SELECTION */}
            <div>
              <label className={label}>Business Vertical</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleCategoryChange("pharma")}
                  className={`flex items-center gap-2.5 p-3 border transition-all text-left ${
                    formData.businessCategory === "pharma"
                      ? "border-[var(--teal-mid)] bg-[var(--teal-mid)]/10 text-[var(--teal-deep)] font-medium"
                      : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]/60 hover:border-[var(--ink)]/30"
                  }`}
                >
                  <Pill size={18} />
                  <div>
                    <div className="text-[13px] leading-none font-medium">
                      Pharma Suite
                    </div>
                    <div className="text-[10px] text-[var(--ink)]/50 mt-1 [font-family:var(--font-mono)]">
                      Drug License Required
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange("grocery")}
                  className={`flex items-center gap-2.5 p-3 border transition-all text-left ${
                    formData.businessCategory === "grocery"
                      ? "border-[var(--teal-mid)] bg-[var(--teal-mid)]/10 text-[var(--teal-deep)] font-medium"
                      : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]/60 hover:border-[var(--ink)]/30"
                  }`}
                >
                  <ShoppingBag size={18} />
                  <div>
                    <div className="text-[13px] leading-none font-medium">
                      Grocery Suite
                    </div>
                    <div className="text-[10px] text-[var(--ink)]/50 mt-1 [font-family:var(--font-mono)]">
                      FSSAI License Required
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* SECTION: ENTITY */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={eyebrow}>Entity Details</span>
                <div className="h-px flex-1 bg-[var(--line)]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Workspace Code</label>
                  <div className="relative">
                    <Building2
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35"
                    />
                    <input
                      type="text"
                      name="workspaceCode"
                      required
                      value={formData.workspaceCode}
                      onChange={handleInputChange}
                      placeholder={
                        formData.businessCategory === "pharma"
                          ? "APOLLO-HYD-01"
                          : "MORE-HYD-01"
                      }
                      className={`${inputBase} uppercase [font-family:var(--font-mono)]`}
                    />
                  </div>
                </div>

                <div>
                  <label className={label}>Entity Type</label>
                  <div className="relative">
                    <Briefcase
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35 pointer-events-none"
                    />
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className={`${inputBase} pr-8 appearance-none cursor-pointer`}
                    >
                      {activeTypes.map(t => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35 pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className={label}>
                  {formData.businessCategory === "pharma"
                    ? "Trading Name"
                    : "Store / Outlet Name"}
                </label>
                <div className="relative">
                  <Building2
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35"
                  />
                  <input
                    type="text"
                    name="workspaceName"
                    required
                    value={formData.workspaceName}
                    onChange={handleInputChange}
                    placeholder={
                      formData.businessCategory === "pharma"
                        ? "Apollo Diagnostics & Pharma Hub"
                        : "FreshMart Supermarket & Organics"
                    }
                    className={inputBase}
                  />
                </div>
              </div>
            </div>

            {/* SECTION: CONTACT */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={eyebrow}>Contact</span>
                <div className="h-px flex-1 bg-[var(--line)]" />
              </div>
              <label className={label}>Mobile Number</label>
              <div className="relative">
                <Smartphone
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35"
                />
                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-[var(--ink)]/50 text-[13px] [font-family:var(--font-mono)]">
                  +91
                </span>
                <input
                  type="tel"
                  name="phone"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="98765 43210"
                  className={`${inputBase} pl-16 [font-family:var(--font-mono)]`}
                />
              </div>
            </div>

            {/* SECTION: COMPLIANCE IDENTIFIERS */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={eyebrow}>Compliance Identifiers</span>
                <div className="h-px flex-1 bg-[var(--line)]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className={label}>
                    {formData.businessCategory === "pharma"
                      ? "Drug License No."
                      : "FSSAI License No."}
                  </label>
                  <div className="relative">
                    <FileText
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35"
                    />
                    <input
                      type="text"
                      name="complianceLicenseNumber"
                      required
                      value={formData.complianceLicenseNumber}
                      onChange={handleInputChange}
                      placeholder={
                        formData.businessCategory === "pharma"
                          ? "TZ-HYD-123456"
                          : "10012011000123"
                      }
                      className={`${inputBase} [font-family:var(--font-mono)]`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <label className={label}>GSTIN (Optional)</label>
                  <div className="relative">
                    <FileText
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35"
                    />
                    <input
                      type="text"
                      name="gstinOrTaxId"
                      maxLength={15}
                      value={formData.gstinOrTaxId}
                      onChange={handleInputChange}
                      placeholder="36AAAAA0000A1Z5"
                      className={`${inputBase} uppercase [font-family:var(--font-mono)]`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <label className={label}>State</label>
                  <div className="relative">
                    <MapPin
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/35 pointer-events-none"
                    />
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`${inputBase} pr-7 appearance-none cursor-pointer`}
                    >
                      {indianStates.map(st => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink)]/35 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: ADMIN ACCOUNT */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={eyebrow}>Admin Account</span>
                <div className="h-px flex-1 bg-[var(--line)]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Full Name</label>
                  <input
                    type="text"
                    name="adminFullName"
                    required
                    value={formData.adminFullName}
                    onChange={handleInputChange}
                    placeholder="Priya Sharma"
                    className={`${inputBase} pl-3`}
                  />
                </div>
                <div>
                  <label className={label}>Email</label>
                  <input
                    type="email"
                    name="adminEmail"
                    required
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    placeholder="priya@store.in"
                    className={`${inputBase} pl-3`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={label}>Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="At least 8 characters"
                    className={`${inputBase} pl-3`}
                  />
                </div>
                <div>
                  <label className={label}>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Re-enter password"
                    className={`${inputBase} pl-3`}
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
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Create workspace"
                )}
              </button>
            </div>
            <p className="text-[11px] text-[var(--ink)]/40 -mt-3 [font-family:var(--font-mono)]">
              Your password is hashed before it reaches the database.
            </p>
          </form>

          <div className="text-center mt-8 pt-6 border-t border-[var(--line)] text-[13px] text-[var(--ink)]/55">
            Already have a configured deployment?{" "}
            <Link
              href="/sign-in"
              className="text-[var(--teal-deep)] hover:text-[var(--stamp)] font-medium transition-colors"
            >
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
