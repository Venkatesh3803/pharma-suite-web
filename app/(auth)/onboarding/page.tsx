"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import {
  Building2,
  MapPin,
  Users,
  Settings,
  ArrowLeft,
  ArrowRight,
  Check,
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

const STEPS = [
  { id: 1, title: "Business", icon: Building2 },
  { id: 2, title: "Location", icon: MapPin },
  { id: 3, title: "Team", icon: Users },
  { id: 4, title: "Preferences", icon: Settings },
];

const eyebrow =
  "text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--stamp)] [font-family:var(--font-mono)]";
const label =
  "block text-[11px] font-medium text-[var(--ink)]/70 mb-1.5 [font-family:var(--font-mono)] uppercase tracking-[0.06em]";
const inputBase =
  "w-full px-3.5 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-none text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink)]/35 focus:outline-none focus:border-[var(--teal-mid)] focus:ring-2 focus:ring-[var(--teal-mid)]/15 transition-all duration-150 [font-family:var(--font-body)]";
const inputBaseMono = `${inputBase} [font-family:var(--font-mono)] uppercase`;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    // STEP 1
    website: "",
    drugLicenseNumber: "",
    gstinOrTaxId: "",
    panNumber: "",
    fssaiNumber: "",
    regulatoryAuthority: "CDSCO",
    gmpCertified: false,
    gdpCertified: false,

    // STEP 2
    address: {
      street: "",
      area: "",
      city: "",
      district: "",
      state: "Telangana",
      zipCode: "",
      country: "India",
    },
    alternatePhone: "",

    // STEP 3
    expectedUsers: "1-5",
    pharmacistsCount: 1,
    branchesCount: 1,
    warehousesCount: 0,
    monthlyOrdersEstimate: "0-100",

    // STEP 4
    modules: {
      inventory: true,
      procurement: true,
      sales: true,
      finance: true,
      crm: false,
      manufacturing: false,
      qualityControl: false,
      lims: false,
      hrms: false,
    } as Record<string, boolean>,

    settings: {
      currency: "INR",
      language: "en",
      timezone: "Asia/Kolkata",
      lowStockAlertThreshold: 10,
      allowNegativeStock: false,
      batchTrackingEnabled: true,
      expiryTrackingEnabled: true,
      serialTrackingEnabled: false,
    },
  });

  // Flat field change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  // Nested object change handler (address, settings)
  const handleNestedInputChange = (
    parent: "address" | "settings",
    field: string,
    value: any,
  ) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  // Dedicated toggler for modules array
  const handleModuleToggle = (moduleKey: string) => {
    setFormData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleKey]: !prev.modules[moduleKey],
      },
    }));
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    console.log("Submitting Workspace Payload: ", formData);
    router.push("/dashboard/sales-dashboard");
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen w-screen bg-[var(--paper)] flex [font-family:var(--font-body)]`}
      style={THEME}
    >
      {/* LEFT SIDEBAR — matches sign-in / sign-up brand panel */}
      <div className="hidden lg:flex lg:w-[340px] relative flex-col justify-between px-10 py-12 bg-[var(--teal-deep)] overflow-hidden">
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

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 border border-[var(--stamp)] flex items-center justify-center text-[var(--stamp)]">
              <Building2 size={16} strokeWidth={2.25} />
            </div>
            <span className="text-[15px] font-semibold text-[var(--paper)] tracking-tight [font-family:var(--font-display)]">
              PharmaSuite Core
            </span>
          </div>

          <span className={`${eyebrow} block mt-9`}>
            Workspace Provisioning
          </span>
          <p className="text-[13px] text-[var(--paper)]/60 leading-relaxed mt-3">
            Four entries complete the record: legal identity, dispatch
            geography, headcount, and module scope.
          </p>

          {/* Ledger-style step list */}
          <div className="mt-10 space-y-1">
            {STEPS.map(item => {
              const Icon = item.icon;
              const active = item.id === step;
              const completed = item.id < step;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 py-3 px-1 border-b transition-all duration-200 ${
                    active
                      ? "border-[var(--stamp)]/40"
                      : "border-[var(--line-dark)]"
                  }`}
                >
                  <span
                    className={`text-[11px] w-5 [font-family:var(--font-mono)] ${
                      active
                        ? "text-[var(--stamp)]"
                        : completed
                          ? "text-[var(--paper)]/50"
                          : "text-[var(--paper)]/25"
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
                    {completed ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <Icon size={14} />
                    )}
                  </div>

                  <span
                    className={`text-[13px] font-medium ${
                      active ? "text-[var(--paper)]" : "text-[var(--paper)]/50"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-[var(--paper)]/40 [font-family:var(--font-mono)] tracking-wide border-t border-[var(--line-dark)] pt-5">
          v2.1.0-PROD · SECURE COMPLIANCE
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <div className="bg-white border border-[var(--line)] p-8 md:p-10 flex flex-col justify-between min-h-[580px]">
          <div>
            {/* STEP 1: BUSINESS */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <div>
                  <span className={eyebrow}>Step 01 · Entity</span>
                  <h2 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight mt-1.5 [font-family:var(--font-display)]">
                    Business profile
                  </h2>
                  <p className="text-[13.5px] text-[var(--ink)]/55 mt-1 leading-relaxed">
                    Record the regulatory and tax identifiers tied to this
                    entity.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={label}>Corporate website</label>
                    <input
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>Drug license number *</label>
                    <input
                      name="drugLicenseNumber"
                      value={formData.drugLicenseNumber}
                      onChange={handleInputChange}
                      placeholder="TZ-HYD-123456"
                      className={inputBaseMono}
                    />
                  </div>

                  <div>
                    <label className={label}>GSTIN / tax ID</label>
                    <input
                      name="gstinOrTaxId"
                      value={formData.gstinOrTaxId}
                      onChange={handleInputChange}
                      placeholder="15-CHAR ALPHANUMERIC"
                      className={inputBaseMono}
                    />
                  </div>

                  <div>
                    <label className={label}>Company PAN number</label>
                    <input
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      placeholder="ABCDE1234F"
                      className={inputBaseMono}
                    />
                  </div>

                  <div>
                    <label className={label}>FSSAI number (optional)</label>
                    <input
                      name="fssaiNumber"
                      value={formData.fssaiNumber}
                      onChange={handleInputChange}
                      placeholder="14-digit license code"
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>Regulatory body</label>
                    <select
                      name="regulatoryAuthority"
                      value={formData.regulatoryAuthority}
                      onChange={handleInputChange}
                      className={inputBase}
                    >
                      <option value="CDSCO">CDSCO (India)</option>
                      <option value="FDA">FDA (United States)</option>
                      <option value="EMA">EMA (Europe)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 p-4 bg-[var(--paper-dim)] border border-[var(--line)]">
                  <label className="flex items-start gap-3 cursor-pointer text-[13px] font-medium text-[var(--ink)] select-none flex-1">
                    <input
                      type="checkbox"
                      name="gmpCertified"
                      checked={formData.gmpCertified}
                      onChange={handleInputChange}
                      className="w-4 h-4 mt-0.5 accent-[var(--teal-mid)]"
                    />
                    <div>
                      <div>GMP certified</div>
                      <span className="text-[11.5px] text-[var(--ink)]/45 font-normal">
                        Good Manufacturing Practices declaration
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer text-[13px] font-medium text-[var(--ink)] select-none flex-1">
                    <input
                      type="checkbox"
                      name="gdpCertified"
                      checked={formData.gdpCertified}
                      onChange={handleInputChange}
                      className="w-4 h-4 mt-0.5 accent-[var(--teal-mid)]"
                    />
                    <div>
                      <div>GDP certified</div>
                      <span className="text-[11.5px] text-[var(--ink)]/45 font-normal">
                        Good Distribution Practices adherence
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: ADDRESS & CONTACT */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <div>
                  <span className={eyebrow}>Step 02 · Geography</span>
                  <h2 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight mt-1.5 [font-family:var(--font-display)]">
                    Dispatch location
                  </h2>
                  <p className="text-[13.5px] text-[var(--ink)]/55 mt-1 leading-relaxed">
                    Where this workspace's stock physically moves from.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={label}>Street address</label>
                    <input
                      value={formData.address.street}
                      onChange={e =>
                        handleNestedInputChange(
                          "address",
                          "street",
                          e.target.value,
                        )
                      }
                      placeholder="Plot No, Industrial Estate Line 1"
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>Area / colony</label>
                    <input
                      value={formData.address.area}
                      onChange={e =>
                        handleNestedInputChange(
                          "address",
                          "area",
                          e.target.value,
                        )
                      }
                      placeholder="Madhapur"
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>City</label>
                    <input
                      value={formData.address.city}
                      onChange={e =>
                        handleNestedInputChange(
                          "address",
                          "city",
                          e.target.value,
                        )
                      }
                      placeholder="Hyderabad"
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>District</label>
                    <input
                      value={formData.address.district}
                      onChange={e =>
                        handleNestedInputChange(
                          "address",
                          "district",
                          e.target.value,
                        )
                      }
                      placeholder="Rangareddy"
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>State</label>
                    <input
                      value={formData.address.state}
                      onChange={e =>
                        handleNestedInputChange(
                          "address",
                          "state",
                          e.target.value,
                        )
                      }
                      placeholder="Telangana"
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>Postal code / ZIP</label>
                    <input
                      value={formData.address.zipCode}
                      onChange={e =>
                        handleNestedInputChange(
                          "address",
                          "zipCode",
                          e.target.value,
                        )
                      }
                      placeholder="500081"
                      maxLength={6}
                      className={inputBaseMono}
                    />
                  </div>

                  <div>
                    <label className={label}>Alternate escalation phone</label>
                    <input
                      name="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={handleInputChange}
                      placeholder="Backup contact phone"
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: TEAM SETUP */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <div>
                  <span className={eyebrow}>Step 03 · Scale</span>
                  <h2 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight mt-1.5 [font-family:var(--font-display)]">
                    Team &amp; scale
                  </h2>
                  <p className="text-[13.5px] text-[var(--ink)]/55 mt-1 leading-relaxed">
                    Sets the seat count and throughput this workspace is
                    provisioned for.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={label}>Expected active seats</label>
                    <select
                      name="expectedUsers"
                      value={formData.expectedUsers}
                      onChange={handleInputChange}
                      className={inputBase}
                    >
                      <option value="1-5">1–5 operators</option>
                      <option value="5-20">5–20 operators</option>
                      <option value="20-50">20–50 operators</option>
                      <option value="50+">Enterprise (50+)</option>
                    </select>
                  </div>

                  <div>
                    <label className={label}>Registered pharmacists</label>
                    <input
                      type="number"
                      name="pharmacistsCount"
                      min={1}
                      value={formData.pharmacistsCount}
                      onChange={handleInputChange}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>Retail outlets / branches</label>
                    <input
                      type="number"
                      name="branchesCount"
                      min={1}
                      value={formData.branchesCount}
                      onChange={handleInputChange}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>Logistics warehouses</label>
                    <input
                      type="number"
                      name="warehousesCount"
                      min={0}
                      value={formData.warehousesCount}
                      onChange={handleInputChange}
                      className={inputBase}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={label}>Monthly transaction volume</label>
                    <select
                      name="monthlyOrdersEstimate"
                      value={formData.monthlyOrdersEstimate}
                      onChange={handleInputChange}
                      className={inputBase}
                    >
                      <option value="0-100">0–100 transactions</option>
                      <option value="100-500">100–500 transactions</option>
                      <option value="500-1000">500–1,000 transactions</option>
                      <option value="1000+">High scale (1,000+)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: PREFERENCES */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <div>
                  <span className={eyebrow}>Step 04 · Provisioning</span>
                  <h2 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight mt-1.5 [font-family:var(--font-display)]">
                    Modules &amp; preferences
                  </h2>
                  <p className="text-[13.5px] text-[var(--ink)]/55 mt-1 leading-relaxed">
                    Choose which parts of the suite are active, and set your
                    stock-tracking defaults.
                  </p>
                </div>

                <div>
                  <span className={`${eyebrow} block mb-3`}>
                    Enterprise suite modules
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.keys(formData.modules).map(key => {
                      const moduleLabel = key.replace(/([A-Z])/g, " $1");
                      const on = formData.modules[key];
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => handleModuleToggle(key)}
                          className={`flex items-center justify-between text-left p-3 border text-[12px] font-medium transition-all select-none ${
                            on
                              ? "bg-[var(--stamp-dim)] text-[var(--ink)] border-[var(--stamp)]/40"
                              : "bg-white text-[var(--ink)]/60 border-[var(--line)] hover:bg-[var(--paper-dim)]"
                          }`}
                        >
                          <span className="capitalize">{moduleLabel}</span>
                          <div
                            className={`w-4 h-4 flex items-center justify-center transition-all shrink-0 ml-2 ${
                              on
                                ? "bg-[var(--stamp)] text-white"
                                : "border border-[var(--ink)]/25"
                            }`}
                          >
                            {on && <Check size={10} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-[var(--line)]" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={label}>Currency</label>
                    <select
                      value={formData.settings.currency}
                      onChange={e =>
                        handleNestedInputChange(
                          "settings",
                          "currency",
                          e.target.value,
                        )
                      }
                      className={`${inputBase} py-2 text-[12.5px]`}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className={label}>Language pack</label>
                    <select
                      value={formData.settings.language}
                      onChange={e =>
                        handleNestedInputChange(
                          "settings",
                          "language",
                          e.target.value,
                        )
                      }
                      className={`${inputBase} py-2 text-[12.5px]`}
                    >
                      <option value="en">English (global)</option>
                    </select>
                  </div>

                  <div>
                    <label className={label}>Base timezone</label>
                    <select
                      value={formData.settings.timezone}
                      onChange={e =>
                        handleNestedInputChange(
                          "settings",
                          "timezone",
                          e.target.value,
                        )
                      }
                      className={`${inputBase} py-2 text-[12.5px]`}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    </select>
                  </div>
                </div>

                {/* ADVANCED TRACKING CONTROLS */}
                <div className="p-4 bg-[var(--paper-dim)] border border-[var(--line)] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12.5px] font-medium text-[var(--ink)]">
                      Low stock alert buffer level
                    </span>
                    <input
                      type="number"
                      value={formData.settings.lowStockAlertThreshold}
                      onChange={e =>
                        handleNestedInputChange(
                          "settings",
                          "lowStockAlertThreshold",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-16 px-2 py-1 border border-[var(--line)] text-center bg-white font-medium text-[12.5px] [font-family:var(--font-mono)]"
                    />
                  </div>

                  <div className="flex gap-6 pt-1">
                    <label className="flex items-center gap-2 text-[12px] font-medium text-[var(--ink)]/75">
                      <input
                        type="checkbox"
                        checked={formData.settings.batchTrackingEnabled}
                        onChange={e =>
                          handleNestedInputChange(
                            "settings",
                            "batchTrackingEnabled",
                            e.target.checked,
                          )
                        }
                        className="accent-[var(--teal-mid)]"
                      />
                      Batch tracking
                    </label>

                    <label className="flex items-center gap-2 text-[12px] font-medium text-[var(--ink)]/75">
                      <input
                        type="checkbox"
                        checked={formData.settings.expiryTrackingEnabled}
                        onChange={e =>
                          handleNestedInputChange(
                            "settings",
                            "expiryTrackingEnabled",
                            e.target.checked,
                          )
                        }
                        className="accent-[var(--teal-mid)]"
                      />
                      Expiry tracking
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CONTROL FOOTER NAVIGATION */}
          <div className="flex justify-between mt-10 pt-6 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="px-4 py-2.5 text-[13px] font-medium border border-[var(--line)] text-[var(--ink)]/70 flex items-center gap-2 hover:bg-[var(--paper-dim)] hover:text-[var(--ink)] transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowLeft size={15} />
              Back
            </button>

            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2.5 text-[13px] font-medium bg-[var(--ink)] text-[var(--paper)] flex items-center gap-2 hover:bg-[var(--teal-deep)] active:scale-[0.98] transition-all"
            >
              {step === 4 ? "Complete setup" : "Continue"}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
