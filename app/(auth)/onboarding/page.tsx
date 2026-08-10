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
  Pill,
  ShoppingBag,
  Layers,
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
} as React.CSSProperties;

const STEPS = [
  { id: 1, title: "Industry", icon: Building2 },
  { id: 2, title: "Location", icon: MapPin },
  { id: 3, title: "Scale", icon: Users },
  { id: 4, title: "Modules", icon: Settings },
];

const MODULE_PRESETS = {
  PHARMA: {
    inventory: true,
    procurement: true,
    sales: true,
    finance: true,
    batchTracking: true,
    expiryAlerts: true,
    qualityControl: true,
    temperatureLogs: true,
    weighingScaleIntegration: false,
    barcodePOS: true,
  },
  GROCERY: {
    inventory: true,
    procurement: true,
    sales: true,
    finance: true,
    batchTracking: false,
    expiryAlerts: true,
    qualityControl: false,
    temperatureLogs: false,
    weighingScaleIntegration: true,
    barcodePOS: true,
  },
  HYBRID: {
    inventory: true,
    procurement: true,
    sales: true,
    finance: true,
    batchTracking: true,
    expiryAlerts: true,
    qualityControl: true,
    temperatureLogs: true,
    weighingScaleIntegration: true,
    barcodePOS: true,
  },
};

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
    // STEP 1: INDUSTRY & ENTITY
    industryType: "PHARMA" as "PHARMA" | "GROCERY" | "HYBRID",
    businessName: "",
    website: "",
    gstinOrTaxId: "",
    panNumber: "",
    // Pharma Specific
    drugLicenseNumber: "",
    regulatoryAuthority: "CDSCO",
    gmpCertified: false,
    // Grocery Specific
    fssaiLicenseNumber: "",
    coldStorageAvailable: false,

    // STEP 2: LOCATION
    address: {
      street: "",
      area: "",
      city: "",
      district: "",
      state: "Telangana",
      zipCode: "",
      country: "India",
    },

    // STEP 3: SCALE
    expectedUsers: "1-5",
    outletsCount: 1,
    warehousesCount: 0,
    checkoutCountersCount: 1,
    monthlyOrdersEstimate: "0-100",

    // STEP 4: MODULES & CONFIG
    modules: MODULE_PRESETS.PHARMA as Record<string, boolean>,
    currency: "INR",
    lowStockThreshold: 10,
    allowNegativeStock: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleIndustryChange = (type: "PHARMA" | "GROCERY" | "HYBRID") => {
    setFormData(prev => ({
      ...prev,
      industryType: type,
      modules: MODULE_PRESETS[type],
    }));
  };

  const handleNestedInputChange = (
    parent: "address",
    field: string,
    value: string,
  ) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const handleModuleToggle = (moduleKey: string) => {
    setFormData(prev => ({
      ...prev,
      modules: { ...prev.modules, [moduleKey]: !prev.modules[moduleKey] },
    }));
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    console.log("Submitting Workspace Provision Payload:", formData);
    router.push("/dashboard");
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen w-screen bg-[var(--paper)] flex [font-family:var(--font-body)]`}
      style={THEME}
    >
      {/* SIDEBAR */}
      <div className="hidden lg:flex lg:w-[340px] relative flex-col justify-between px-10 py-12 bg-[var(--teal-deep)] overflow-hidden shrink-0">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1.4px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 border border-[var(--stamp)] flex items-center justify-center text-[var(--stamp)] font-semibold text-xs">
              PS
            </div>
            <span className="text-[15px] font-semibold text-[var(--paper)] tracking-tight [font-family:var(--font-display)]">
              OmniCommerce OS
            </span>
          </div>

          <span className={`${eyebrow} block mt-9`}>
            Workspace Provisioning
          </span>
          <p className="text-[13px] text-[var(--paper)]/60 leading-relaxed mt-3">
            Tailoring ERP modules, regulatory requirements, and checkout POS
            flow for your business model.
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
          PHARMA & GROCERY HYBRID ENGINE
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
                    Select operations domain
                  </h2>
                  <p className="text-[13.5px] text-[var(--ink)]/55 mt-1 leading-relaxed">
                    Choose your primary focus to auto-configure tax rules,
                    compliance defaults, and checkout tools.
                  </p>
                </div>

                {/* INDUSTRY SELECTOR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: "PHARMA",
                      title: "Pharmaceuticals",
                      desc: "Batch tracking, Drug Licenses, CDSCO/FDA logs, Rx rules.",
                      icon: Pill,
                    },
                    {
                      id: "GROCERY",
                      title: "Retail Grocery",
                      desc: "FSSAI compliance, POS weighing scale, loose item sales, barcode.",
                      icon: ShoppingBag,
                    },
                    {
                      id: "HYBRID",
                      title: "Pharma + Grocery",
                      desc: "Unified superstore combining OTC/Pharma with FMCG/Grocery.",
                      icon: Layers,
                    },
                  ].map(item => {
                    const Icon = item.icon;
                    const selected = formData.industryType === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleIndustryChange(item.id as any)}
                        className={`p-4 border text-left flex flex-col justify-between transition-all select-none ${
                          selected
                            ? "bg-[var(--stamp-dim)] border-[var(--stamp)] text-[var(--ink)]"
                            : "bg-white border-[var(--line)] hover:bg-[var(--paper-dim)] text-[var(--ink)]/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Icon
                            size={18}
                            className={
                              selected
                                ? "text-[var(--stamp)]"
                                : "text-[var(--ink)]/40"
                            }
                          />
                          <div
                            className={`w-4 h-4 border flex items-center justify-center ${
                              selected
                                ? "bg-[var(--stamp)] border-[var(--stamp)] text-white"
                                : "border-[var(--line)]"
                            }`}
                          >
                            {selected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                        <div>
                          <div className="text-[13.5px] font-semibold text-[var(--ink)]">
                            {item.title}
                          </div>
                          <div className="text-[11.5px] text-[var(--ink)]/50 mt-1 leading-normal">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="md:col-span-2">
                    <label className={label}>
                      Business / Legal entity name *
                    </label>
                    <input
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="e.g. Apex Healthcare & Retail LLP"
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>GSTIN / Tax Registration</label>
                    <input
                      name="gstinOrTaxId"
                      value={formData.gstinOrTaxId}
                      onChange={handleInputChange}
                      placeholder="15-CHAR ALPHANUMERIC"
                      className={inputBaseMono}
                    />
                  </div>

                  <div>
                    <label className={label}>PAN Number</label>
                    <input
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      placeholder="ABCDE1234F"
                      className={inputBaseMono}
                    />
                  </div>

                  {/* DYNAMIC REGULATORY FIELDS */}
                  {(formData.industryType === "PHARMA" ||
                    formData.industryType === "HYBRID") && (
                    <div>
                      <label className={label}>Drug License Number *</label>
                      <input
                        name="drugLicenseNumber"
                        value={formData.drugLicenseNumber}
                        onChange={handleInputChange}
                        placeholder="TZ-HYD-123456"
                        className={inputBaseMono}
                      />
                    </div>
                  )}

                  {(formData.industryType === "GROCERY" ||
                    formData.industryType === "HYBRID") && (
                    <div>
                      <label className={label}>FSSAI License Number *</label>
                      <input
                        name="fssaiLicenseNumber"
                        value={formData.fssaiLicenseNumber}
                        onChange={handleInputChange}
                        placeholder="14-DIGIT CODE"
                        className={inputBaseMono}
                      />
                    </div>
                  )}
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
                    <label className={label}>Street Address</label>
                    <input
                      value={formData.address.street}
                      onChange={e =>
                        handleNestedInputChange(
                          "address",
                          "street",
                          e.target.value,
                        )
                      }
                      placeholder="Store #4, Retail Complex"
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
                    <label className={label}>Postal Code</label>
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
                      className={inputBaseMono}
                    />
                  </div>

                  <div>
                    <label className={label}>Country</label>
                    <input
                      value={formData.address.country}
                      readOnly
                      className={`${inputBase} bg-[var(--paper-dim)] text-[var(--ink)]/60`}
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
                    Specify counter terminals, storage hubs, and staffing
                    requirements.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={label}>Active Outlets / Branches</label>
                    <input
                      type="number"
                      name="outletsCount"
                      min={1}
                      value={formData.outletsCount}
                      onChange={handleInputChange}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>
                      Checkout Counters (POS terminals)
                    </label>
                    <input
                      type="number"
                      name="checkoutCountersCount"
                      min={1}
                      value={formData.checkoutCountersCount}
                      onChange={handleInputChange}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>Warehouses / Dark Stores</label>
                    <input
                      type="number"
                      name="warehousesCount"
                      min={0}
                      value={formData.warehousesCount}
                      onChange={handleInputChange}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={label}>
                      Expected Monthly Transaction Volume
                    </label>
                    <select
                      name="monthlyOrdersEstimate"
                      value={formData.monthlyOrdersEstimate}
                      onChange={handleInputChange}
                      className={inputBase}
                    >
                      <option value="0-500">0–500 sales/mo</option>
                      <option value="500-2000">500–2,000 sales/mo</option>
                      <option value="2000-10000">2,000–10,000 sales/mo</option>
                      <option value="10000+">High scale (10,000+)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: MODULE PREFERENCES */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <div>
                  <span className={eyebrow}>Step 04 · Feature Provisions</span>
                  <h2 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight mt-1.5 [font-family:var(--font-display)]">
                    Active suite modules
                  </h2>
                  <p className="text-[13.5px] text-[var(--ink)]/55 mt-1 leading-relaxed">
                    Auto-configured based on your selected domain (
                    {formData.industryType}). Customize features as needed.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.keys(formData.modules).map(key => {
                    const moduleLabel = key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, str => str.toUpperCase());
                    const active = formData.modules[key];
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleModuleToggle(key)}
                        className={`flex items-center justify-between text-left p-3 border text-[12px] font-medium transition-all select-none ${
                          active
                            ? "bg-[var(--stamp-dim)] text-[var(--ink)] border-[var(--stamp)]/40"
                            : "bg-white text-[var(--ink)]/60 border-[var(--line)] hover:bg-[var(--paper-dim)]"
                        }`}
                      >
                        <span className="truncate pr-1">{moduleLabel}</span>
                        <div
                          className={`w-4 h-4 flex items-center justify-center transition-all shrink-0 ${
                            active
                              ? "bg-[var(--stamp)] text-white"
                              : "border border-[var(--ink)]/25"
                          }`}
                        >
                          {active && <Check size={10} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between pt-8 border-t border-[var(--line)] mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-4 py-2.5 border border-[var(--line)] text-[12.5px] font-medium transition-all ${
                step === 1
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
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--teal-deep)] text-white text-[12.5px] font-medium hover:bg-[var(--teal-mid)] transition-all shadow-sm"
            >
              {step === 4 ? "Complete provision" : "Next step"}
              {step === 4 ? <Check size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
