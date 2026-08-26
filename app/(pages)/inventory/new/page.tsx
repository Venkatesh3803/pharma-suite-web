"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package,
  Pill,
  Ruler,
} from "lucide-react";
import {
  productsApi,
  type ProductCategory,
  type UnitConfig,
} from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type LoadState = "loading" | "error" | "ready";

const addMedicineSchema = z.object({
  brand: z.string().trim().min(1, "Brand name is required."),
  genericName: z.string(),
  manufacturer: z.string(),
  strength: z.string(),
  dosageForm: z.string(),
  packSize: z.string(),
  barcode: z.string(),
  gstRate: z
    .string()
    .refine(
      v => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
      "GST rate must be between 0 and 100.",
    ),
  prescriptionRequired: z.boolean(),
  categoryMode: z.enum(["existing", "new"]),
  categoryId: z.string(),
  newCategoryName: z.string(),
  baseUnit: z.string(),
  saleUnit: z.string(),
  saleUnitFactor: z
    .string()
    .refine(
      v => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 1),
      "Must be a whole number of 1 or more.",
    ),
  levels: z.array(
    z.object({
      name: z.string(),
      factor: z
        .string()
        .refine(v => v === "" || Number.isInteger(Number(v)), "Must be a whole number."),
    }),
  ),
});

type AddMedicineFormValues = z.infer<typeof addMedicineSchema>;

export default function AddMedicinePage() {
  const router = useRouter();
  const user = useAppSelector(state => state.auth.user);
  const canCreate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "OWNER" ||
    user?.role === "MANAGER";

  const [state, setState] = useState<LoadState>(canCreate ? "loading" : "ready");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AddMedicineFormValues>({
    resolver: zodResolver(addMedicineSchema),
    defaultValues: {
      brand: "",
      genericName: "",
      manufacturer: "",
      strength: "",
      dosageForm: "",
      packSize: "",
      barcode: "",
      gstRate: "",
      prescriptionRequired: false,
      categoryMode: "existing",
      categoryId: "",
      newCategoryName: "",
      baseUnit: "tablet",
      saleUnit: "strip",
      saleUnitFactor: "10",
      levels: [
        { name: "strip", factor: "10" },
        { name: "box", factor: "100" },
      ],
    },
  });
  const { setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "levels",
  });
  const watchCategoryMode = useWatch({
    control: form.control,
    name: "categoryMode",
  });

  useEffect(() => {
    if (!canCreate) return;
    let ignore = false;
    async function load() {
      try {
        const cats = await productsApi.categories();
        if (!ignore) {
          setCategories(cats);
          if (cats.length > 0) setValue("categoryId", cats[0].id);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load categories.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [canCreate, setValue]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const inputBase =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

  const buildUnitConfig = (values: AddMedicineFormValues): UnitConfig => {
    const factor = Number(values.saleUnitFactor);
    return {
      baseUnit: values.baseUnit.trim() || "tablet",
      saleUnit: values.saleUnit.trim() || "tablet",
      saleUnitFactor: factor > 0 ? factor : 1,
      levels: values.levels
        .map(l => ({
          name: l.name.trim(),
          label: l.name.trim(),
          factor: Number(l.factor),
        }))
        .filter(l => l.name && Number.isInteger(l.factor) && l.factor > 1),
    };
  };

  const resolveCategoryId = async (
    values: AddMedicineFormValues,
  ): Promise<string | undefined> => {
    if (values.categoryMode === "existing") return values.categoryId || undefined;
    const name = values.newCategoryName.trim();
    if (!name) return undefined;
    const created = await productsApi.createCategory(name);
    return created.id;
  };

  const onSubmit = async (values: AddMedicineFormValues) => {
    setSubmitting(true);
    try {
      const categoryId_ = await resolveCategoryId(values);
      const product = await productsApi.create({
        brand: values.brand.trim(),
        genericName: values.genericName.trim() || undefined,
        manufacturer: values.manufacturer.trim() || undefined,
        strength: values.strength.trim() || undefined,
        dosageForm: values.dosageForm.trim() || undefined,
        packSize: values.packSize.trim() || undefined,
        barcode: values.barcode.trim() || undefined,
        gstRate: values.gstRate === "" ? 0 : Number(values.gstRate),
        prescriptionRequired: values.prescriptionRequired,
        categoryId: categoryId_,
        unitConfig: buildUnitConfig(values),
      });
      setToast("Medicine created.");
      setTimeout(() => {
        router.push(`/inventory/${product.id}`);
      }, 350);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not create medicine.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-16 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
        <Package size={32} className="text-danger/60" />
        <div>
          <div className="text-[14px] font-medium text-ink">Access restricted.</div>
          <div className="mt-1 text-[12.5px] text-ink/50">
            Your role does not have permission to create medicines.
          </div>
        </div>
        <Link
          href="/inventory"
          className="rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep"
        >
          Back to Inventory
        </Link>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex w-full items-center justify-center gap-2 py-24 text-[13px] text-ink/45">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Link
          href="/inventory"
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink/55 transition-colors hover:text-stamp"
        >
          <ArrowLeft size={14} /> Back to Inventory
        </Link>
        <div className="mt-3">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Catalog Entry
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Add New Medicine
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Create a medicine with its pack structure, then add opening stock from
            its ledger page.
          </p>
        </div>
      </div>

      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-12 py-14 text-center shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
          <Package size={32} className="text-danger/60" />
          <div>
            <div className="text-[14px] font-medium text-ink">
              Could not load categories.
            </div>
            <div className="mt-1 text-[12.5px] text-ink/50">{error}</div>
          </div>
          <button
            onClick={() => router.refresh()}
            className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-teal-deep"
          >
            Retry
          </button>
        </div>
      )}

      {state === "ready" && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* ── Identity ── */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="flex items-center gap-2">
                <Pill size={15} className="text-stamp" />
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                  Product Identity
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                        Brand name <span className="text-danger">*</span>
                      </FormLabel>
                      <FormControl>
                        <input
                          type="text"
                          {...field}
                          placeholder="e.g. Dolo 650"
                          className={inputBase}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="genericName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                        Generic name
                      </FormLabel>
                      <FormControl>
                        <input
                          type="text"
                          {...field}
                          placeholder="e.g. Paracetamol"
                          className={inputBase}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                        Manufacturer
                      </FormLabel>
                      <FormControl>
                        <input
                          type="text"
                          {...field}
                          placeholder="e.g. Micro Labs"
                          className={inputBase}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />
              <FormField
                  control={form.control}
                  name="strength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                        Strength
                      </FormLabel>
                      <FormControl>
                        <input
                          type="text"
                          {...field}
                          placeholder="e.g. 650mg"
                          className={inputBase}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />
              <FormField
                  control={form.control}
                  name="dosageForm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                        Dosage form
                      </FormLabel>
                      <FormControl>
                        <input
                          type="text"
                          {...field}
                          placeholder="e.g. Tablet"
                          className={inputBase}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                        Pack size
                      </FormLabel>
                      <FormControl>
                        <input
                          type="text"
                          {...field}
                          placeholder="e.g. 10's strip"
                          className={inputBase}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                        Barcode
                      </FormLabel>
                      <FormControl>
                        <input
                          type="text"
                          {...field}
                          placeholder="e.g. 8901234567890"
                          className={inputBase}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gstRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                        GST rate (%)
                      </FormLabel>
                      <FormControl>
                        <input
                          type="number"
                          {...field}
                          placeholder="12"
                          className={inputBase}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prescriptionRequired"
                  render={({ field }) => (
                    <FormItem className="flex items-end pb-1">
                      <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink/70">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={e => field.onChange(e.target.checked)}
                            className="h-4 w-4 accent-teal-mid"
                          />
                        </FormControl>
                        Prescription required
                      </label>
                    </FormItem>
                  )}
                />
              </div>
            </div>

          {/* ── Category ── */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                Category
              </span>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="categoryMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                        Assign category
                      </FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className={`${inputBase} cursor-pointer`}
                        >
                          <option value="existing">Pick existing</option>
                          <option value="new">Create new category</option>
                        </select>
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />
                {watchCategoryMode === "existing" ? (
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                          Category
                        </FormLabel>
                        <FormControl>
                          <select {...field} className={`${inputBase} cursor-pointer`}>
                            {categories.length === 0 && <option value="">No categories yet</option>}
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage className="text-[11.5px]" />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="newCategoryName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                          New category name
                        </FormLabel>
                        <FormControl>
                          <input
                            type="text"
                            {...field}
                            placeholder="e.g. Antihistamines"
                            className={inputBase}
                          />
                        </FormControl>
                        <FormMessage className="text-[11.5px]" />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

          {/* ── Unit configuration ── */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <div className="flex items-center gap-2">
                <Ruler size={15} className="text-stamp" />
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                  Pack / Unit Configuration
                </span>
              </div>
              <div className="mt-4">
                <p className="mb-4 text-[12.5px] leading-relaxed text-ink/55">
                  All stock is tracked in a single base unit (e.g. <b>tablet</b>).
                  Add pack levels above it so you can receive, sell and display in
                  strips/boxes.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="baseUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                          Base unit
                        </FormLabel>
                        <FormControl>
                          <input
                            type="text"
                            {...field}
                            placeholder="tablet"
                            className={inputBase}
                          />
                        </FormControl>
                        <FormMessage className="text-[11.5px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="saleUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                          Sale unit
                        </FormLabel>
                        <FormControl>
                          <input
                            type="text"
                            {...field}
                            placeholder="strip"
                            className={inputBase}
                          />
                        </FormControl>
                        <FormMessage className="text-[11.5px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="saleUnitFactor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1.5 block text-[12px] font-semibold text-ink/70">
                          Base units per sale unit
                        </FormLabel>
                        <FormControl>
                          <input
                            type="number"
                            {...field}
                            placeholder="10"
                            className={inputBase}
                          />
                        </FormControl>
                        <FormMessage className="text-[11.5px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-ink/70">
                      Pack levels (bigger packs first)
                    </label>
                    <button
                      type="button"
                      onClick={() => append({ name: "", factor: "" })}
                      className="cursor-pointer text-[12px] font-semibold text-stamp hover:underline"
                    >
                      + Add level
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {fields.map((f, idx) => (
                      <div key={f.id} className="flex flex-col gap-1">
                        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <input
                            type="text"
                            {...form.register(`levels.${idx}.name`)}
                            placeholder="Level name (e.g. box)"
                            className={inputBase}
                          />
                          <input
                            type="number"
                            {...form.register(`levels.${idx}.factor`)}
                            placeholder="Factor (e.g. 100)"
                            className={inputBase}
                          />
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="cursor-pointer rounded-lg border border-line bg-white px-3 text-[12px] font-semibold text-danger/70 hover:bg-danger-bg"
                          >
                            Remove
                          </button>
                        </div>
                        {(form.formState.errors.levels?.[idx]?.name?.message ||
                          form.formState.errors.levels?.[idx]?.factor?.message) && (
                          <div className="text-[11.5px] text-danger">
                            {form.formState.errors.levels?.[idx]?.name?.message ??
                              form.formState.errors.levels?.[idx]?.factor?.message}
                          </div>
                        )}
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <div className="text-[12px] text-ink/45">
                        No pack levels — this medicine will be tracked in base units only.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex items-center justify-end gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
              <Link
                href="/inventory"
                className="rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink/70 transition-colors hover:bg-paper"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                Create Medicine
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </Form>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
          <CheckCircle2
            size={16}
            className={
              toast.startsWith("Medicine created.") ? "text-teal-mid" : "text-danger"
            }
          />
          <span className="text-[13px] text-ink">{toast}</span>
        </div>
      )}
    </div>
  );
}
