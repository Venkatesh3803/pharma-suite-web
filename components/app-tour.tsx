"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Pill,
  ShoppingBag,
  Contact,
  TrendingUp,
  BadgeCheck,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const TOUR_DONE_KEY = "pharmasuite_tour_done";
export const START_TOUR_EVENT = "pharmasuite:start-tour";

interface TourStep {
  icon: LucideIcon;
  title: string;
  path: string;
  text: string;
}

const STEPS: TourStep[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    path: "/dashboard/purchase-dashboard",
    text: "Live purchase and sales dashboards with expiry, low-stock and reorder signals at a glance.",
  },
  {
    icon: Receipt,
    title: "Quick Billing (POS)",
    path: "/billing",
    text: "Ring up sales with barcode lookup, Rx checks, GST invoices and instant stock deduction.",
  },
  {
    icon: Pill,
    title: "Medicine Inventory",
    path: "/inventory",
    text: "Full ledger with batch & expiry tracking, low-stock and dead-stock analysis.",
  },
  {
    icon: ShoppingBag,
    title: "Purchase Orders",
    path: "/purchase/order",
    text: "Create purchase orders, receive goods via GRN, and manage purchase returns.",
  },
  {
    icon: Contact,
    title: "Suppliers & Customers",
    path: "/suppliers",
    text: "Supplier ledger with GSTIN and purchase history, plus the customer ledger.",
  },
  {
    icon: TrendingUp,
    title: "Sales Reports",
    path: "/reports",
    text: "Revenue, category and margin analytics to understand how your store is performing.",
  },
  {
    icon: BadgeCheck,
    title: "Plan & Settings",
    path: "/subscription",
    text: "Your subscription, user seats, branches, and workspace & team settings.",
  },
];

export default function AppTour() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (window.localStorage.getItem(TOUR_DONE_KEY) !== "1") setOpen(true);
    }, 600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const start = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(START_TOUR_EVENT, start);
    return () => window.removeEventListener(START_TOUR_EVENT, start);
  }, []);

  if (!open) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const finish = () => {
    window.localStorage.setItem(TOUR_DONE_KEY, "1");
    setOpen(false);
  };

  const visit = (path: string) => {
    finish();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/60 p-4">
      <div className="w-full max-w-md border border-line bg-paper shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-stamp" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-stamp">
              Workspace Tour
            </span>
          </div>
          <button
            onClick={finish}
            title="Close tour"
            className="cursor-pointer border-0 bg-transparent p-1 text-ink/40 transition-colors hover:text-danger"
          >
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-teal-mid/30 bg-teal-mid/10 text-teal-mid">
              <s.icon size={22} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink/45">
                Step {step + 1} of {STEPS.length}
              </div>
              <h2 className="mt-0.5 font-display text-[18px] font-semibold tracking-tight text-ink">
                {s.title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink/55">
                {s.text}
              </p>
            </div>
          </div>

          {/* progress */}
          <div className="mt-6 h-1 w-full bg-line">
            <div
              className="h-full bg-stamp transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* footer */}
        <div className="border-t border-line px-6 py-4">
          <button
            onClick={() => visit(s.path)}
            className="mb-3 flex w-full cursor-pointer items-center justify-center gap-2 bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-teal-deep"
          >
            <Sparkles size={15} />
            Open {s.title}
            <ArrowRight size={15} />
          </button>
          <div className="flex items-center justify-between">
            <button
              onClick={finish}
              className="cursor-pointer border-0 bg-transparent px-2 py-1 text-[12px] font-medium text-ink/45 transition-colors hover:text-ink"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
                className="flex cursor-pointer items-center gap-1.5 rounded-none border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink/70 transition-colors hover:bg-paper-dim disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={13} /> Prev
              </button>
              <button
                onClick={isLast ? finish : () => setStep(step + 1)}
                className="flex cursor-pointer items-center gap-1.5 rounded-none bg-teal-mid px-3 py-1.5 text-[12.5px] font-semibold text-paper transition-colors hover:bg-teal-deep"
              >
                {isLast ? (
                  <>
                    Finish <CheckDot />
                  </>
                ) : (
                  <>
                    Next <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckDot() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}