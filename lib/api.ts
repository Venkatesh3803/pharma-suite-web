const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const REFRESH_URL = "/api/auth/refresh";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "PHARMACIST" | "STAFF";
  organizationId: string;
  branchId: string | null;
  organizationName: string;
  branchName: string | null;
  permissions?: string[];
}

export interface BranchSummary {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  code: string;
  gstin: string | null;
  address: string | null;
  currency: string;
  timezone: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  branches: BranchSummary[];
  userCount: number;
}

export interface UpdateWorkspaceInput {
  name?: string;
  gstin?: string;
  address?: string;
  settings?: Record<string, unknown>;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  workspaceName: string;
  workspaceCode: string;
  gstin?: string;
  address?: string;
  state?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  code?: string;
}

let refreshPromise: Promise<string | null> | null = null;

// Legacy token helpers removed — HttpOnly cookie is the single credential.
// Kept for potential migration cleanup; no-op in current flow.
export function getAccessToken(): null {
  return null;
}

export function setAccessToken(_token: string): void {
  // No-op: access token lives in HttpOnly cookie
}

export function clearAccessToken(): void {
  // No-op: access token lives in HttpOnly cookie
}

export function setOnboardedCookie(): void {
  if (typeof window === "undefined") return;
  document.cookie = "pharmasuite_onboarded=1; path=/; max-age=31536000";
}

export function clearOnboardedCookie(): void {
  if (typeof window === "undefined") return;
  document.cookie = "pharmasuite_onboarded=; Max-Age=0; path=/";
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await rawFetch<{ accessToken?: string }>(REFRESH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          skipAuth: true,
        });
        // Session now lives in the HttpOnly cookie set by the backend.
        // Do NOT persist to localStorage. Return the token (when present)
        // so the retried request can use it directly in-memory; otherwise
        // return a non-empty sentinel — the cookie itself is the credential.
        return res.data.accessToken ?? "cookie";
      } catch {
        clearAccessToken();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function rawFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<ApiEnvelope<T>> {
  const { skipAuth, ...init } = options;

  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  // Cookie-only auth: no Authorization header. credentials: "include" sends cookies automatically.

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new ApiError(
      json?.message || "Request failed. Please try again.",
      res.status,
      json?.code,
    );
  }

  if (!json || !json.success) {
    throw new ApiError(
      json?.message || "Unexpected response from server.",
      res.status,
      json?.code,
    );
  }

  return json;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retryOn401 = true,
): Promise<T> {
  try {
    const json = await rawFetch<T>(path, options);
    return json.data;
  } catch (err) {
    if (
      retryOn401 &&
      err instanceof ApiError &&
      err.status === 401 &&
      !path.startsWith("/api/auth/")
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        try {
          // Cookie is already set by refresh; retry with same options
          // (credentials: "include" will send the new cookie automatically)
          const retried = await rawFetch<T>(path, options);
          return retried.data;
        } catch {
          // fall through to original error handling below
        }
      }
      throw err;
    }
    throw err;
  }
}

export async function fetchFile(
  path: string,
  options: RequestInit = {},
): Promise<Blob> {
  const doFetch = async (): Promise<Blob> => {
    const headers = new Headers(options.headers);
    // Cookie-only auth: credentials: "include" sends cookies automatically
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
    if (!res.ok) {
      let message = "Could not fetch file.";
      try {
        const json = (await res.json()) as { message?: string };
        message = json?.message || message;
      } catch {
        // non-JSON error body
      }
      throw new ApiError(message, res.status);
    }
    return res.blob();
  };
  try {
    return await doFetch();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !path.startsWith("/api/auth/")) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return doFetch();
    }
    throw err;
  }
}

export const authApi = {
  async register(input: RegisterInput): Promise<AuthUser> {
    const data = await apiFetch<{ user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: input.fullName,
        email: input.email,
        password: input.password,
        phone: input.phone,
        workspaceName: input.workspaceName,
        workspaceCode: input.workspaceCode,
        gstin: input.gstin,
        address: input.address,
        state: input.state,
      }),
    });
    return data.user;
  },

  async login(username: string, password: string): Promise<AuthUser> {
    const data = await apiFetch<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    return data.user;
  },

  async logout(): Promise<void> {
    await apiFetch<null>("/api/auth/logout", { method: "POST" });
  },

  async me(): Promise<AuthUser> {
    const data = await apiFetch<{ user: AuthUser }>("/api/auth/me");
    return data.user;
  },

  async forgotPassword(email: string): Promise<{ email: string }> {
    return apiFetch<{ email: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async verifyOtp(email: string, otp: string): Promise<{ verified: boolean }> {
    return apiFetch<{ verified: boolean }>("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  async resetPassword(
    newPassword: string,
    confirmPassword: string,
    resetToken?: string,
  ): Promise<void> {
    // The reset token travels in the HttpOnly `pharmasuite_reset` cookie set
    // by verify-otp. The explicit token param is a legacy fallback only.
    await apiFetch<null>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(
        resetToken ? { resetToken, newPassword, confirmPassword } : { newPassword, confirmPassword },
      ),
    });
  },
};

export const organizationApi = {
  async getWorkspace(): Promise<Workspace> {
    return apiFetch<Workspace>("/api/organization");
  },

  async updateWorkspace(input: UpdateWorkspaceInput): Promise<Workspace> {
    return apiFetch<Workspace>("/api/organization", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
};

export const branchesApi = {
  async list(): Promise<BranchSummary[]> {
    return apiFetch<BranchSummary[]>("/api/branches");
  },

  async create(input: {
    name: string;
    code?: string;
    city?: string;
    state?: string;
    phone?: string;
    address?: string;
  }): Promise<BranchSummary> {
    return apiFetch<BranchSummary>("/api/branches", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export type TeamRole = "SUPER_ADMIN" | "OWNER" | "MANAGER" | "PHARMACIST" | "STAFF";
export type TeamStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: TeamRole;
  status: TeamStatus;
  branchId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  branch: { id: string; name: string; code: string } | null;
}

export interface CreateTeamMemberInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: TeamRole;
  branchId?: string;
}

export interface UpdateTeamMemberInput {
  fullName?: string;
  phone?: string;
  role?: TeamRole;
  status?: TeamStatus;
  branchId?: string | null;
  password?: string;
}

export const usersApi = {
  async list(): Promise<{ items: TeamMember[]; total: number }> {
    return apiFetch<{ items: TeamMember[]; total: number }>("/api/users");
  },

  async create(input: CreateTeamMemberInput): Promise<TeamMember> {
    return apiFetch<TeamMember>("/api/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(
    id: string,
    input: UpdateTeamMemberInput,
  ): Promise<TeamMember> {
    return apiFetch<TeamMember>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
};

/* ─────────────────────────── Inventory ─────────────────────────── */

export interface UnitConfigLevel {
  name: string;
  label: string;
  factor: number;
}

export interface UnitConfig {
  levels: UnitConfigLevel[];
  baseUnit: string;
  baseUnitLabel?: string;
  saleUnit: string;
  saleUnitFactor: number;
}

export type StockStatus = "HEALTHY" | "LOW_STOCK" | "OUT_OF_STOCK" | "OVERSTOCKED";
export type MovementStatus = "FAST_MOVING" | "NORMAL" | "SLOW_MOVING" | "DEAD_STOCK" | "INSUFFICIENT_DATA";
export type ExpiryStatus = "HEALTHY" | "EXPIRING_30_DAYS" | "EXPIRING_60_DAYS" | "EXPIRING_90_DAYS" | "EXPIRED";
export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type BatchLifecycleStatus = "ACTIVE" | "EXPIRED" | "EMPTY";
export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "SALE_RETURN"
  | "PURCHASE_RETURN"
  | "ADJUSTMENT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "OPENING_STOCK"
  | "EXPIRED"
  | "DAMAGED";
export type AdjustmentReason =
  | "PHYSICAL_COUNT"
  | "DAMAGE"
  | "LOSS"
  | "EXPIRY"
  | "DATA_CORRECTION"
  | "OPENING_BALANCE"
  | "OTHER";

export interface InventoryListItem {
  productId: string;
  brand: string;
  genericName: string | null;
  manufacturer: string | null;
  strength: string | null;
  dosageForm: string | null;
  packSize: string | null;
  category: { id: string; name: string } | null;
  barcode: string | null;
  unitConfig: UnitConfig;
  sellableStock: number;
  expiredStock: number;
  totalStock: number;
  batchCount: number;
  nearestExpiry: string | null;
  nearestExpiryStatus: ExpiryStatus;
  inventoryValue: number;
  stockStatus: StockStatus;
  movementStatus: MovementStatus;
  averageDailySales: number;
  daysOfCover: number | null;
  stockDisplay: string;
}

export interface InventoryListResult {
  items: InventoryListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InventorySummary {
  totalMedicines: number;
  inventoryValue: number;
  lowStock: { count: number; products: number };
  outOfStock: number;
  expiringSoon: { units: number; products: number };
  expired: { units: number; value: number; products: number };
  deadStock: number;
  lowStockThreshold: number;
}

export interface BatchSummaryRow {
  id: string;
  batchNumber: string;
  expiryDate: string;
  expiryStatus: ExpiryStatus;
  daysToExpiry: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  quantity: number;
  quantityDisplay: string;
  supplier: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  status: BatchLifecycleStatus;
}

export interface SalesVelocity {
  averageDailySales: number;
  averageWeeklySales: number;
  averageMonthlySales: number;
  soldUnits30Days: number;
  lastSaleDate: string | null;
  daysSinceLastSale: number | null;
}

export interface MedicineDetail {
  product: {
    id: string;
    brand: string;
    genericName: string | null;
    manufacturer: string | null;
    strength: string | null;
    dosageForm: string | null;
    packSize: string | null;
    category: { id: string; name: string } | null;
    unitConfig: UnitConfig;
  };
  branch: { id: string; name: string } | null;
  summary: {
    sellableStock: number;
    sellableDisplay: string;
    expiredStock: number;
    expiredDisplay: string;
    inventoryValue: number;
    nearestExpiry: string | null;
    nearestExpiryStatus: ExpiryStatus;
    estimatedDaysOfCover: number | null;
    stockStatus: StockStatus;
    lowStockThreshold: number;
  };
  batches: BatchSummaryRow[];
  intelligence: {
    velocity: SalesVelocity;
    movementStatus: MovementStatus;
    daysOfCover: number | null;
    stockoutRisk: RiskLevel;
    reorderSuggestion: number;
    reorderReason: string | null;
    lastSaleDate: string | null;
  };
  priceHistory: {
    batchId: string;
    batchNumber: string;
    purchasePrice: number;
    mrp: number;
    supplierName: string | null;
    receivedAt: string;
  }[];
  priceVariance: { difference: number; variancePct: number | null } | null;
}

export interface MovementItem {
  id: string;
  type: MovementType;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  unitCost: number | null;
  referenceType: string | null;
  note: string | null;
  createdAt: string;
  product: { id: string; brand: string };
  branch: { id: string; name: string } | null;
  batch: { id: string; batchNumber: string } | null;
  user: { fullName: string } | null;
}

export interface ExpiryItem {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  inventoryValue: number;
  daysToExpiry: number;
  product: {
    id: string;
    brand: string;
    genericName: string | null;
    strength: string | null;
    packSize: string | null;
  };
  branch: { id: string; name: string };
}

export interface DeadStockItem {
  productId: string;
  productBrand: string;
  genericName: string | null;
  strength: string | null;
  product: {
    id: string;
    brand: string;
    genericName: string | null;
    strength: string | null;
    packSize: string | null;
  };
  branch: { id: string; name: string };
  batchNumber: string;
  expiryDate: string;
  stock: number;
  lastSaleDate: string | null;
  daysInactive: number;
  inventoryValue: number;
}

export interface DeadStockResult {
  items: DeadStockItem[];
  total: number;
  trappedCapital: number;
}

export interface LowStockBatch {
  id: string;
  productId: string;
  productBrand: string;
  genericName: string | null;
  strength: string | null;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  branch: { id: string; name: string };
}

export interface LowStockResult {
  count: number;
  items: LowStockBatch[];
}

export interface ReorderRecommendation {
  product: {
    id: string;
    brand: string;
    genericName: string | null;
    strength: string | null;
    packSize: string | null;
  };
  supplier: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  availableQty: number;
  averageDailySales: number;
  supplierLeadTime: number;
  safetyStock: number;
  openPurchaseQty: number;
  recommendedQuantity: number;
  estimatedStockoutDate: string | null;
  riskLevel: RiskLevel;
  reason: string;
}

export interface InventoryAdjustInput {
  productId: string;
  branchId?: string;
  quantity: number;
  reason: AdjustmentReason | string;
  note?: string;
}

export interface BatchAdjustInput {
  batchId: string;
  productId: string;
  branchId?: string;
  quantity: number;
  reason: AdjustmentReason;
  note?: string;
}

export interface StockCountInput {
  batchId: string;
  productId: string;
  physicalQuantity: number;
}

export interface StockCountBody {
  branchId?: string;
  counts: StockCountInput[];
}

export interface InventoryListQuery {
  search?: string;
  categoryId?: string;
  stockStatus?: StockStatus;
  expiryRisk?: ExpiryStatus;
  movementStatus?: MovementStatus;
  page?: number;
  pageSize?: number;
}

export interface ProductCategory {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
}

export interface CreateProductInput {
  brand: string;
  genericName?: string;
  manufacturer?: string;
  strength?: string;
  dosageForm?: string;
  packSize?: string;
  barcode?: string;
  hsnCode?: string;
  gstRate?: number;
  prescriptionRequired?: boolean;
  categoryId?: string;
  unitConfig?: UnitConfig;
}

export interface OpeningBatchInput {
  productId: string;
  branchId?: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  purchasePrice?: number;
  mrp?: number;
  sellingPrice?: number;
  supplierId?: string;
  note?: string;
}

export interface ProductRow {
  id: string;
  brand: string;
  genericName: string | null;
  manufacturer: string | null;
  strength: string | null;
  dosageForm: string | null;
  packSize: string | null;
  categoryId: string | null;
  category?: ProductCategory | null;
  unitConfig?: UnitConfig | Record<string, unknown>;
  gstRate: number;
  prescriptionRequired: boolean;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export const inventoryApi = {
  async summary(branchId?: string): Promise<InventorySummary> {
    return apiFetch<InventorySummary>(
      `/api/inventory/summary${toQuery({ branchId })}`,
    );
  },

  async list(
    query: InventoryListQuery = {},
  ): Promise<InventoryListResult> {
    return apiFetch<InventoryListResult>(
      `/api/inventory/${toQuery({
        search: query.search,
        categoryId: query.categoryId,
        stockStatus: query.stockStatus,
        expiryRisk: query.expiryRisk,
        movementStatus: query.movementStatus,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      })}`,
    );
  },

  async detail(medicineId: string): Promise<MedicineDetail> {
    return apiFetch<MedicineDetail>(`/api/inventory/${medicineId}`);
  },

  async medicineBatches(
    medicineId: string,
  ): Promise<{ items: BatchSummaryRow[]; total: number }> {
    return apiFetch<{ items: BatchSummaryRow[]; total: number }>(
      `/api/inventory/${medicineId}/batches`,
    );
  },

  async medicineMovements(
    medicineId: string,
    query: { type?: MovementType; page?: number; pageSize?: number } = {},
  ): Promise<{ items: MovementItem[]; total: number }> {
    return apiFetch<{ items: MovementItem[]; total: number }>(
      `/api/inventory/${medicineId}/movements${toQuery({
        type: query.type,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      })}`,
    );
  },

  async movements(
    query: {
      type?: MovementType;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<{ items: MovementItem[]; total: number }> {
    return apiFetch<{ items: MovementItem[]; total: number }>(
      `/api/inventory/movements${toQuery({
        type: query.type,
        search: query.search,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      })}`,
    );
  },

  async expiry(
    query: { days?: number; page?: number; pageSize?: number } = {},
  ): Promise<{ items: ExpiryItem[]; total: number }> {
    return apiFetch<{ items: ExpiryItem[]; total: number }>(
      `/api/inventory/expiry${toQuery({
        days: query.days ?? 180,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 30,
      })}`,
    );
  },

  async lowStock(): Promise<LowStockResult> {
    return apiFetch<LowStockResult>("/api/inventory/low-stock");
  },

  async deadStock(): Promise<DeadStockResult> {
    return apiFetch<DeadStockResult>("/api/inventory/dead-stock");
  },

  async reorder(): Promise<ReorderRecommendation[]> {
    return apiFetch<ReorderRecommendation[]>("/api/inventory/reorder");
  },

  async adjust(input: InventoryAdjustInput): Promise<unknown> {
    return apiFetch<unknown>("/api/inventory/adjust", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async adjustBatch(input: BatchAdjustInput): Promise<{ applied: boolean; batchId: string }> {
    return apiFetch<{ applied: boolean; batchId: string }>("/api/inventory/adjust-batch", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async stockCount(body: StockCountBody): Promise<unknown> {
    return apiFetch<unknown>("/api/inventory/stock-count", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async createBatch(input: OpeningBatchInput): Promise<{
    batch: { id: string; batchNumber: string; quantity: number };
    created: boolean;
    beforeQty: number;
    afterQty: number;
  }> {
    return apiFetch<{
      batch: { id: string; batchNumber: string; quantity: number };
      created: boolean;
      beforeQty: number;
      afterQty: number;
    }>("/api/inventory/batches", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export const productsApi = {
  async list(query: { search?: string; page?: number; pageSize?: number } = {}): Promise<{ items: ProductRow[]; total: number }> {
    return apiFetch<{ items: ProductRow[]; total: number }>(
      `/api/products${toQuery({
        search: query.search,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
      })}`,
    );
  },

  async get(id: string): Promise<ProductRow> {
    return apiFetch<ProductRow>(`/api/products/${id}`);
  },

  async create(input: CreateProductInput): Promise<ProductRow> {
    return apiFetch<ProductRow>("/api/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async categories(): Promise<ProductCategory[]> {
    return apiFetch<ProductCategory[]>("/api/products/categories");
  },

  async createCategory(name: string): Promise<ProductCategory> {
    return apiFetch<ProductCategory>("/api/products/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },
};

/* ─────────────────────────── Purchases & Suppliers ─────────────────────────── */

export interface SupplierRow {
  id: string;
  code: string | null;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  address: string | null;
  paymentTerms: string | null;
  leadTimeDays: number | null;
  rating: number | null;
  isActive: boolean;
  totalPurchased?: number;
  purchaseCount?: number;
  openOrders?: number;
  lastPurchase?: string | null;
}

export interface CreateSupplierInput {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
}

export type PurchaseStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export interface PurchaseRow {
  id: string;
  poNumber: string;
  status: PurchaseStatus;
  branchId: string;
  supplierId: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
  expectedDelivery: string | null;
  receivedAt: string | null;
  createdAt: string;
  supplier: SupplierRow;
  branch: { id: string; name: string; code: string };
}

export interface PurchaseItemRow {
  id: string;
  productId: string;
  batchNumber: string | null;
  quantity: number;
  freeQuantity: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  gstRate: number;
  discount: number;
  total: number;
  receivedQty: number;
  expiryDate: string | null;
  product: ProductRow;
  receiptItems?: PurchaseReceiptItemRow[];
}

export interface PurchaseReceiptItemRow {
  id: string;
  batchNumber: string;
  quantity: number;
  freeQuantity: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number | null;
  expiryDate: string | null;
  product?: ProductRow;
}

export interface PurchaseReceiptRow {
  id: string;
  receiptNumber: string;
  receivedAt: string;
  receivedBy: { fullName: string } | null;
  items: PurchaseReceiptItemRow[];
}

export interface PurchaseDetail extends PurchaseRow {
  items: PurchaseItemRow[];
  createdBy: { fullName: string } | null;
  receipts: PurchaseReceiptRow[];
}

export interface CreatePurchaseItemInput {
  productId: string;
  quantity: number;
  freeQuantity?: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice?: number;
  gstRate?: number;
  discount?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface CreatePurchaseInput {
  branchId: string;
  supplierId: string;
  expectedDelivery?: string;
  notes?: string;
  supplierInvoiceNumber?: string;
  invoiceDate?: string;
  items: CreatePurchaseItemInput[];
}

export interface ReceiptBatchInput {
  purchaseItemId: string;
  productId: string;
  quantity: number;
  freeQuantity?: number;
  batchNumber: string;
  expiryDate: string;
  purchasePrice?: number;
  mrp?: number;
  sellingPrice?: number;
}

export interface ReturnItemInput {
  batchId: string;
  quantity: number;
  reason?: string;
  note?: string;
}

export interface PurchaseReturnRow {
  id: string;
  type: string;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
  product: ProductRow;
  batch: { id: string; batchNumber: string } | null;
  branch: { id: string; name: string } | null;
  user: { fullName: string } | null;
}

export interface LowStockRow {
  productId: string;
  brand: string;
  genericName: string | null;
  batchNumber: string;
  onHand: number;
  reorderLevel: number;
}

export interface PurchaseSummary {
  thisMonthValue: number;
  thisMonthOrders: number;
  monthChangePct: number | null;
  totalPurchaseValue: number;
  totalOrders: number;
  openOrders: number;
  receivedOrders: number;
  cancelledOrders: number;
  returnsCount: number;
  priceIncreases: number;
  lowStock: LowStockRow[];
}

export interface VendorPerformance {
  vendor: { id: string; name: string; code: string | null };
  totalOrders: number;
  receivedOrders: number;
  totalValue: number;
  avgOrderValue: number;
  avgLeadTimeDays: number | null;
  onTimeRate: number | null;
  returnCount: number;
  lastPurchase: string | null;
}

export interface PriceHistoryResponse {
  rows: {
    productId: string;
    brand: string;
    genericName: string | null;
    strength: string | null;
    batchNumber: string;
    date: string;
    purchasePrice: number;
    mrp: number;
  }[];
  summary: {
    samples: number;
    latest: number | null;
    previous: number | null;
    changePct: number | null;
    lowest: number | null;
    highest: number | null;
    average: number | null;
  };
}

export const suppliersApi = {
  async list(query: { search?: string; page?: number; pageSize?: number } = {}): Promise<{ items: SupplierRow[]; total: number }> {
    return apiFetch<{ items: SupplierRow[]; total: number }>(
      `/api/suppliers${toQuery({ search: query.search, page: query.page ?? 1, pageSize: query.pageSize ?? 20 })}`,
    );
  },

  async get(id: string): Promise<SupplierRow & { purchases: { id: string; poNumber: string; status: PurchaseStatus; total: number; createdAt: string }[] }> {
    return apiFetch<SupplierRow & { purchases: { id: string; poNumber: string; status: PurchaseStatus; total: number; createdAt: string }[] }>(
      `/api/suppliers/${id}`,
    );
  },

  async create(input: CreateSupplierInput): Promise<SupplierRow> {
    return apiFetch<SupplierRow>("/api/suppliers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: Partial<CreateSupplierInput>): Promise<SupplierRow> {
    return apiFetch<SupplierRow>(`/api/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async performance(id: string): Promise<VendorPerformance> {
    return apiFetch<VendorPerformance>(`/api/suppliers/${id}/performance`);
  },

  async priceHistory(id: string, query: { productId?: string; limit?: number } = {}): Promise<PriceHistoryResponse> {
    return apiFetch<PriceHistoryResponse>(
      `/api/suppliers/${id}/price-history${toQuery(query)}`,
    );
  },
};

export const purchasesApi = {
  async list(query: { status?: PurchaseStatus; page?: number; pageSize?: number } = {}): Promise<{ items: PurchaseRow[]; total: number }> {
    return apiFetch<{ items: PurchaseRow[]; total: number }>(
      `/api/purchases${toQuery({
        status: query.status,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      })}`,
    );
  },

  async get(id: string): Promise<PurchaseDetail> {
    return apiFetch<PurchaseDetail>(`/api/purchases/${id}`);
  },

  async pdf(id: string, mode: "inline" | "attachment" = "attachment"): Promise<Blob> {
    return fetchFile(`/api/purchases/${id}/pdf?mode=${mode}`);
  },

  async create(input: CreatePurchaseInput): Promise<PurchaseRow> {
    return apiFetch<PurchaseRow>("/api/purchases", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: CreatePurchaseInput): Promise<PurchaseRow> {
    return apiFetch<PurchaseRow>(`/api/purchases/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  async submit(id: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/purchases/${id}/submit`, { method: "POST" });
  },

  async approve(id: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/purchases/${id}/approve`, { method: "POST" });
  },

  async cancel(id: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/purchases/${id}/cancel`, { method: "POST" });
  },

  async receive(
    id: string,
    body?: { branchId?: string; items?: ReceiptBatchInput[] },
  ): Promise<{ purchase: PurchaseRow; status: PurchaseStatus; receipt: PurchaseReceiptRow }> {
    return apiFetch<{ purchase: PurchaseRow; status: PurchaseStatus; receipt: PurchaseReceiptRow }>(
      `/api/purchases/${id}/receive`,
      { method: "POST", body: body ? JSON.stringify(body) : undefined },
    );
  },

  async returnGoods(id: string, items: ReturnItemInput[]): Promise<{ applied: boolean; results: { batchNumber: string; returned: number; remaining: number }[] }> {
    return apiFetch<{ applied: boolean; results: { batchNumber: string; returned: number; remaining: number }[] }>(
      `/api/purchases/${id}/return`,
      { method: "POST", body: JSON.stringify({ items }) },
    );
  },

  async returns(query: { branchId?: string; page?: number; pageSize?: number } = {}): Promise<{ items: PurchaseReturnRow[]; total: number }> {
    return apiFetch<{ items: PurchaseReturnRow[]; total: number }>(
      `/api/purchases/returns${toQuery(query)}`,
    );
  },

  async summary(query: { branchId?: string } = {}): Promise<PurchaseSummary> {
    return apiFetch<PurchaseSummary>(`/api/purchases/summary${toQuery(query)}`);
  },
};

/* ─────────────────────────── Sales & Customers ─────────────────────────── */

export type SaleStatus = "PAID" | "DUE" | "PARTIAL_RETURN" | "RETURNED" | "VOID";
export type PaymentMode = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "CREDIT";

export interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface SaleRow {
  id: string;
  invoiceNo: string;
  status: SaleStatus;
  paymentMode: PaymentMode;
  subtotal: number;
  tax: number;
  total: number;
  branchId: string;
  customerId: string | null;
  createdAt: string;
  customer: CustomerRow | null;
  branch: { id: string; name: string; code: string };
  createdBy: { fullName: string } | null;
}

export interface SaleItemRow {
  id: string;
  productId: string;
  batchId: string | null;
  quantity: number;
  returnedQty: number;
  unitPrice: number;
  unitCost: number;
  gstRate: number;
  total: number;
  product: ProductRow;
  batch: { id: string; batchNumber: string; expiryDate: string } | null;
}

export interface SaleDetail extends SaleRow {
  items: SaleItemRow[];
}

export interface CreateSaleInput {
  branchId: string;
  customerId?: string;
  paymentMode?: PaymentMode;
  discount?: number;
  items: { productId: string; quantity: number }[];
  clientSaleId?: string;
}

export interface SaleReturnRow {
  id: string;
  type: string;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  note: string | null;
  createdAt: string;
  product: ProductRow;
  batch: { id: string; batchNumber: string } | null;
  branch: { id: string; name: string } | null;
  user: { fullName: string } | null;
}

export interface SalesSummary {
  todaySales: number;
  todayInvoices: number;
  todayChangePct: number | null;
  monthSales: number;
  monthInvoices: number;
  avgTicket: number;
  paymentMix: { mode: PaymentMode; total: number; count: number }[];
  returns: {
    total: number;
    value: number;
    recent: { id: string; brand: string; quantity: number; note: string | null; createdAt: string }[];
  };
  recentSales: {
    id: string;
    invoiceNo: string;
    customerName: string;
    branchName: string | null;
    total: number;
    status: SaleStatus;
    paymentMode: PaymentMode;
    actor: string | null;
    createdAt: string;
  }[];
  topProducts: {
    productId: string;
    quantity: number;
    brand: string;
    genericName: string | null;
  }[];
}

export interface PosLookupRow {
  productId: string;
  brand: string;
  genericName: string | null;
  strength: string | null;
  dosageForm: string | null;
  packSize: string | null;
  barcode: string | null;
  gstRate: number;
  saleUnit: string;
  saleUnitFactor: number;
  baseUnit: string;
  sellableBase: number;
  stockSaleUnits: number;
  stockDisplay: string;
  pricePerSaleUnit: number;
  unitPriceBase: number;
  lowStock: boolean;
}

export const customersApi = {
  async list(query: { search?: string; page?: number; pageSize?: number } = {}): Promise<{ items: CustomerRow[]; total: number }> {
    return apiFetch<{ items: CustomerRow[]; total: number }>(
      `/api/customers${toQuery({ search: query.search, page: query.page ?? 1, pageSize: query.pageSize ?? 20 })}`,
    );
  },

  async get(id: string): Promise<CustomerRow & {
    sales: (SaleRow & { items: { product: ProductRow }[] })[];
    prescriptions: unknown[];
    frequentlyPurchased: { productId: string; totalQuantity: number; product: ProductRow }[];
    lastPurchase: SaleRow | null;
    purchaseFrequency: number;
  }> {
    return apiFetch<CustomerRow & {
      sales: (SaleRow & { items: { product: ProductRow }[] })[];
      prescriptions: unknown[];
      frequentlyPurchased: { productId: string; totalQuantity: number; product: ProductRow }[];
      lastPurchase: SaleRow | null;
      purchaseFrequency: number;
    }>(`/api/customers/${id}`);
  },

  async create(input: CreateCustomerInput): Promise<CustomerRow> {
    return apiFetch<CustomerRow>("/api/customers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: Partial<CreateCustomerInput>): Promise<CustomerRow> {
    return apiFetch<CustomerRow>(`/api/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async remove(id: string): Promise<void> {
    await apiFetch<null>(`/api/customers/${id}`, { method: "DELETE" });
  },
};

export const salesApi = {
  async list(query: {
    status?: SaleStatus;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ items: SaleRow[]; total: number }> {
    return apiFetch<{ items: SaleRow[]; total: number }>(
      `/api/sales${toQuery({
        status: query.status,
        search: query.search,
        from: query.from,
        to: query.to,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      })}`,
    );
  },

  async get(id: string): Promise<SaleDetail> {
    return apiFetch<SaleDetail>(`/api/sales/${id}`);
  },

  async create(input: CreateSaleInput): Promise<{ sale: SaleRow; totals: { subtotal: number; discount: number; tax: number; total: number } }> {
    return apiFetch<{ sale: SaleRow; totals: { subtotal: number; discount: number; tax: number; total: number } }>(
      "/api/sales",
      { method: "POST", body: JSON.stringify(input) },
    );
  },

  async returnGoods(id: string, items: { saleItemId: string; quantity: number; reason?: string }[]): Promise<{
    applied: boolean;
    results: { saleItemId: string; productId: string; batchId: string | null; returned: number; refund: number }[];
    totalRefund: number;
    status: SaleStatus;
  }> {
    return apiFetch<{
      applied: boolean;
      results: { saleItemId: string; productId: string; batchId: string | null; returned: number; refund: number }[];
      totalRefund: number;
      status: SaleStatus;
    }>(`/api/sales/${id}/return`, { method: "POST", body: JSON.stringify({ items }) });
  },

  async returns(query: { branchId?: string; page?: number; pageSize?: number } = {}): Promise<{ items: SaleReturnRow[]; total: number }> {
    return apiFetch<{ items: SaleReturnRow[]; total: number }>(
      `/api/sales/returns${toQuery(query)}`,
    );
  },

  async summary(query: { branchId?: string } = {}): Promise<SalesSummary> {
    return apiFetch<SalesSummary>(`/api/sales/summary${toQuery(query)}`);
  },

  async posLookup(query: { search?: string; branchId?: string } = {}): Promise<PosLookupRow[]> {
    return apiFetch<PosLookupRow[]>(
      `/api/sales/pos-lookup${toQuery({ search: query.search, branchId: query.branchId })}`,
    );
  },
};

/* ─────────────────────────── Subscription & Billing ─────────────────────────── */

export type SubscriptionTier = "TRIAL_14_DAYS" | "BASIC" | "STANDARD" | "PREMIUM";
export type SubscriptionStatus =
  | "TRIALING"
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "PAST_DUE"
  | "EXPIRED"
  | "CANCELLED";
export type BillingCycle = "MONTHLY" | "ANNUAL";

export interface OfflinePaymentDetails {
  upiId: string;
  upiQrHint: string;
  bank: {
    beneficiary: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
  };
  note: string;
}

export interface SubscriptionSnapshot {
  plan: {
    tier: SubscriptionTier;
    displayName: string;
    tagline: string;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    monthlyPrice: number;
    annualPrice: number;
    features: string[];
  };
  expiry: {
    trialStartsAt: string;
    trialEndsAt: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
  access: {
    active: boolean;
    daysRemaining: number;
  };
  limits: {
    maxUsers: number | null;
    maxBranches: number | null;
    seatsUsed: number;
    branchesUsed: number;
    seatsLabel: string;
    branchesLabel: string;
  };
  payments: {
    id: string;
    amount: number;
    paymentMode: string;
    transactionRef: string | null;
    proofUrl: string | null;
    status: string;
    notes: string | null;
    createdAt: string;
  }[];
  offlinePayment: OfflinePaymentDetails;
}

export interface SelectPlanInput {
  tier: SubscriptionTier;
  billingCycle?: BillingCycle;
  paymentMode?: PaymentMode;
  transactionRef?: string;
  proofUrl?: string;
}

export interface PendingPaymentRow {
  id: string;
  organization: { id: string; name: string; code: string; gstin: string | null };
  subscription: { id: string; tier: SubscriptionTier; billingCycle: BillingCycle; status: SubscriptionStatus };
  amount: number;
  paymentMode: string;
  transactionRef: string | null;
  proofUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AdminUpdateSubscriptionInput {
  status?: SubscriptionStatus;
  tier?: SubscriptionTier;
  billingCycle?: BillingCycle;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  note?: string;
}

export interface AdminSubscriptionRow {
  id: string;
  organization: { id: string; name: string; code: string };
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  trialStartsAt: string;
  trialEndsAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  updatedAt: string;
  payments: {
    id: string;
    amount: number;
    paymentMode: string;
    transactionRef: string | null;
    status: string;
    createdAt: string;
  }[];
}

export interface AdminSubscriptionListRow {
  id: string;
  organization: { id: string; name: string; code: string; gstin: string | null };
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  trialStartsAt: string;
  trialEndsAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  updatedAt: string;
  paymentCount: number;
  active: boolean;
}

export const subscriptionApi = {
  async me(): Promise<SubscriptionSnapshot> {
    return apiFetch<SubscriptionSnapshot>("/api/subscription/me");
  },

  async selectPlan(input: SelectPlanInput): Promise<SubscriptionSnapshot> {
    return apiFetch<SubscriptionSnapshot>("/api/subscription/select-plan", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export const adminSubscriptionApi = {
  async list(): Promise<AdminSubscriptionListRow[]> {
    return apiFetch<AdminSubscriptionListRow[]>("/api/admin/subscriptions");
  },

  async pending(): Promise<PendingPaymentRow[]> {
    return apiFetch<PendingPaymentRow[]>("/api/admin/subscriptions/pending");
  },

  async verifyPayment(
    paymentRecordId: string,
    action: "APPROVE" | "REJECT",
  ): Promise<SubscriptionSnapshot> {
    return apiFetch<SubscriptionSnapshot>("/api/admin/subscriptions/verify-payment", {
      method: "POST",
      body: JSON.stringify({ paymentRecordId, action }),
    });
  },

  async updateStatus(
    subscriptionId: string,
    input: AdminUpdateSubscriptionInput,
  ): Promise<AdminSubscriptionRow> {
    return apiFetch<AdminSubscriptionRow>(`/api/admin/subscriptions/${subscriptionId}/status`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
};

// ── Finance / Accounting ─────────────────────────────────────────────────────

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export interface FinanceAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  isActive: boolean;
  openingBalance: number;
  parentId: string | null;
  createdAt: string;
}

export interface JournalLineRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  narration: string | null;
}

export interface JournalEntryRow {
  id: string;
  referenceNo: string;
  entryDate: string;
  description: string;
  status: "POSTED" | "VOID";
  createdBy: string | null;
  lines: JournalLineRow[];
}

export interface JournalListResult {
  rows: JournalEntryRow[];
  total: number;
  page: number;
  limit: number;
}

export interface LedgerRow {
  id: string;
  referenceNo: string;
  entryDate: string;
  description: string;
  narration: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface LedgerResult {
  account: { id: string; code: string; name: string; type: AccountType; openingBalance: number };
  rows: LedgerRow[];
  balance: number;
}

export interface TrialBalanceRow {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceResult {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
}

export interface PnLRow {
  id: string;
  code: string;
  name: string;
  amount: number;
}

export interface PnLResult {
  revenue: PnLRow[];
  expenses: PnLRow[];
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface BalanceSheetResult {
  assets: PnLRow[];
  liabilities: PnLRow[];
  equity: PnLRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  balanced: boolean;
}

export interface FinanceOverview {
  month: PnLResult;
  allTime: number;
  receivable: number;
  payable: number;
  cash: number;
  recent: JournalEntryRow[];
}

export interface TrendPoint {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

export interface CreateJournalLineInput {
  accountId: string;
  debit?: number;
  credit?: number;
  narration?: string;
}

export interface CreateJournalInput {
  entryDate?: string;
  description: string;
  lines: CreateJournalLineInput[];
}

export interface CreateAccountInput {
  code: string;
  name: string;
  type: AccountType;
  openingBalance?: number;
}

export const financeApi = {
  async overview(): Promise<FinanceOverview> {
    return apiFetch<FinanceOverview>("/api/finance/overview");
  },

  async trend(): Promise<TrendPoint[]> {
    return apiFetch<TrendPoint[]>("/api/finance/trend");
  },

  async accounts(): Promise<FinanceAccount[]> {
    return apiFetch<FinanceAccount[]>("/api/finance/accounts");
  },

  async createAccount(input: CreateAccountInput): Promise<FinanceAccount> {
    return apiFetch<FinanceAccount>("/api/finance/accounts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateAccount(id: string, input: Partial<CreateAccountInput>): Promise<FinanceAccount> {
    return apiFetch<FinanceAccount>(`/api/finance/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async journal(params: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<JournalListResult> {
    return apiFetch<JournalListResult>(
      `/api/finance/journal${toQuery({ from: params.from, to: params.to, page: params.page, limit: params.limit })}`,
    );
  },

  async createJournal(input: CreateJournalInput): Promise<{ id: string; referenceNo: string }> {
    return apiFetch<{ id: string; referenceNo: string }>("/api/finance/journal", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async voidJournal(id: string): Promise<{ id: string; status: "VOID" }> {
    return apiFetch<{ id: string; status: "VOID" }>(`/api/finance/journal/${id}/void`, {
      method: "POST",
    });
  },

  async ledger(
    accountId: string,
    params: { from?: string; to?: string } = {},
  ): Promise<LedgerResult> {
    return apiFetch<LedgerResult>(
      `/api/finance/ledger/${accountId}${toQuery({ from: params.from, to: params.to })}`,
    );
  },

  async trialBalance(): Promise<TrialBalanceResult> {
    return apiFetch<TrialBalanceResult>("/api/finance/trial-balance");
  },

  async pnl(params: { from?: string; to?: string } = {}): Promise<PnLResult> {
    return apiFetch<PnLResult>(`/api/finance/pnl${toQuery({ from: params.from, to: params.to })}`);
  },

  async balanceSheet(params: { asOf?: string } = {}): Promise<BalanceSheetResult> {
    return apiFetch<BalanceSheetResult>(
      `/api/finance/balance-sheet${toQuery({ asOf: params.asOf })}`,
    );
  },
};

/* ─────────────────────────── Alerts & Notifications ─────────────────────────── */

export type AlertType =
  | "LOW_STOCK"
  | "STOCKOUT_RISK"
  | "EXPIRY"
  | "DEAD_STOCK"
  | "PRICE_VARIANCE"
  | "PENDING_PURCHASE"
  | "SYSTEM";

export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type AlertStatus = "ACTIVE" | "READ" | "DISMISSED";

export interface AlertItem {
  id: string;
  branchId: string | null;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  isRead: boolean;
}

export interface AlertListResult {
  items: AlertItem[];
  total: number;
}

export interface AlertListQuery {
  branchId?: string;
  type?: AlertType | "";
  severity?: AlertSeverity | "";
  status?: AlertStatus | "ALL";
  page?: number;
  pageSize?: number;
}

export const alertsApi = {
  async list(query: AlertListQuery = {}): Promise<AlertListResult> {
    return apiFetch<AlertListResult>(
      `/api/alerts${toQuery({
        branchId: query.branchId,
        type: query.type,
        severity: query.severity,
        status: query.status,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      })}`,
    );
  },

  async unreadCount(): Promise<{ unread: number }> {
    return apiFetch<{ unread: number }>("/api/alerts/count");
  },

  async markRead(id: string): Promise<AlertItem> {
    return apiFetch<AlertItem>(`/api/alerts/${id}/read`, { method: "POST" });
  },

  async markAllRead(params: { branchId?: string } = {}): Promise<{ updated: number }> {
    return apiFetch<{ updated: number }>(
      `/api/alerts/read-all${toQuery({ branchId: params.branchId })}`,
      { method: "POST" },
    );
  },

  async dismiss(id: string): Promise<AlertItem> {
    return apiFetch<AlertItem>(`/api/alerts/${id}/dismiss`, { method: "POST" });
  },
};

/* ─────────────────────────── Prescriptions · Schedule H ─────────────────────────── */

export type PrescriptionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface PrescriptionRow {
  id: string;
  branchId: string | null;
  customerId: string;
  doctorName: string | null;
  prescriptionDate: string;
  notes: string | null;
  status: PrescriptionStatus;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedById: string | null;
  createdAt: string;
  customer: CustomerRow;
}

export interface PrescriptionListResult {
  items: PrescriptionRow[];
  total: number;
}

export interface PrescriptionListQuery {
  search?: string;
  status?: PrescriptionStatus | "ALL";
  page?: number;
  pageSize?: number;
}

export interface CreatePrescriptionInput {
  customerId: string;
  branchId?: string;
  doctorName?: string;
  prescriptionDate?: string;
  notes?: string;
}

export const prescriptionsApi = {
  async list(query: PrescriptionListQuery = {}): Promise<PrescriptionListResult> {
    return apiFetch<PrescriptionListResult>(
      `/api/prescriptions${toQuery({
        search: query.search,
        status: query.status === "ALL" ? "ALL" : query.status,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      })}`,
    );
  },

  async upload(
    input: CreatePrescriptionInput,
    file: File,
  ): Promise<PrescriptionRow> {
    const form = new FormData();
    form.append("file", file);
    form.append("customerId", input.customerId);
    if (input.branchId) form.append("branchId", input.branchId);
    if (input.doctorName) form.append("doctorName", input.doctorName);
    if (input.prescriptionDate) form.append("prescriptionDate", input.prescriptionDate);
    if (input.notes) form.append("notes", input.notes);
    return apiFetch<PrescriptionRow>("/api/prescriptions", {
      method: "POST",
      body: form,
    });
  },

  async updateStatus(
    id: string,
    status: PrescriptionStatus,
  ): Promise<PrescriptionRow> {
    return apiFetch<PrescriptionRow>(`/api/prescriptions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async download(id: string): Promise<Blob> {
    return fetchFile(`/api/prescriptions/${id}/download`);
  },
};

/* ─────────────────────────── Reports ─────────────────────────── */

export type ReportGroupBy = "day" | "week" | "month";

export interface ReportQuery {
  branchId?: string;
  from?: string;
  to?: string;
  groupBy?: ReportGroupBy;
  limit?: number;
}

export interface SalesReportSeriesPoint {
  key: string;
  revenue: number;
  invoices: number;
  units: number;
}

export interface SalesReportResult {
  series: SalesReportSeriesPoint[];
  totals: {
    revenue: number;
    subtotal: number;
    tax: number;
    discount: number;
    unitsSold: number;
    invoices: number;
  };
}

export interface MarginReportResult {
  revenue: number;
  tax: number;
  invoices: number;
  estimatedCogs: number;
  grossProfit: number;
  grossMargin: number;
}

export interface TopProductRow {
  productId: string;
  brand: string;
  genericName: string | null;
  quantity: number;
  revenue: number;
}

export interface InventoryReportResult {
  valuation: {
    units: number;
    costValue: number;
    retailValue: number;
    mrpValue: number;
  };
  branches: { name: string; batches: number; units: number; value: number }[];
}

export interface PurchaseReportResult {
  totals: { total: number; count: number; average: number };
  bySupplier: { supplierId: string; name: string; total: number; count: number }[];
}

export const reportsApi = {
  async sales(query: ReportQuery = {}): Promise<SalesReportResult> {
    return apiFetch<SalesReportResult>(
      `/api/reports/sales${toQuery({
        branchId: query.branchId,
        from: query.from,
        to: query.to,
        groupBy: query.groupBy,
      })}`,
    );
  },

  async margins(query: ReportQuery = {}): Promise<MarginReportResult> {
    return apiFetch<MarginReportResult>(
      `/api/reports/margins${toQuery({
        branchId: query.branchId,
        from: query.from,
        to: query.to,
      })}`,
    );
  },

  async topProducts(query: ReportQuery = {}): Promise<TopProductRow[]> {
    return apiFetch<TopProductRow[]>(
      `/api/reports/top-products${toQuery({
        branchId: query.branchId,
        from: query.from,
        to: query.to,
        limit: query.limit ?? 10,
      })}`,
    );
  },

  async inventory(): Promise<InventoryReportResult> {
    return apiFetch<InventoryReportResult>("/api/reports/inventory");
  },

  async purchases(query: ReportQuery = {}): Promise<PurchaseReportResult> {
    return apiFetch<PurchaseReportResult>(
      `/api/reports/purchases${toQuery({
        branchId: query.branchId,
        from: query.from,
        to: query.to,
      })}`,
    );
  },
};

/* ─────────────────────── Quality Control ─────────────────────── */

export type QualityCheckType =
  | "RECEIPT_INSPECTION"
  | "STORAGE_CONDITION"
  | "EXPIRY_VERIFICATION"
  | "LABEL_VERIFICATION"
  | "ROUTINE_INSPECTION";

export type QualityControlStatus =
  | "PENDING"
  | "PASSED"
  | "FAILED"
  | "QUARANTINED"
  | "RELEASED"
  | "DISPOSED";

export interface QualityControlCheckRow {
  id: string;
  branchId: string;
  batchId: string;
  checkType: QualityCheckType;
  status: QualityControlStatus;
  condition: string | null;
  temperatureC: number | null;
  passedItems: string[];
  failedItems: string[];
  notes: string | null;
  decisionNote: string | null;
  performedAt: string;
  createdAt: string;
  batch: {
    id: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    product: {
      id: string;
      brand: string;
      genericName: string | null;
      manufacturer: string | null;
      strength: string | null;
      packSize: string | null;
    };
  };
  branch: { id: string; name: string } | null;
  conductedBy: { id: string; fullName: string } | null;
}

export interface QualityControlListResult {
  items: QualityControlCheckRow[];
  total: number;
}

export interface PendingQCBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  receivedAt: string;
  product: {
    id: string;
    brand: string;
    genericName: string | null;
    manufacturer: string | null;
    strength: string | null;
    packSize: string | null;
  };
  branch: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
}

export interface CreateQualityCheckInput {
  batchId: string;
  branchId?: string;
  checkType: QualityCheckType;
  temperatureC?: number;
  condition?: string;
  passedItems?: string[];
  failedItems?: string[];
  notes?: string;
  decision?: "PENDING" | "PASSED" | "FAILED" | "QUARANTINE";
}

export interface UpdateQualityCheckInput {
  status: "PASSED" | "FAILED" | "RELEASED" | "DISPOSED";
  decisionNote?: string;
}

export interface QualityControlListQuery {
  branchId?: string;
  batchId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const qualityApi = {
  async list(query: QualityControlListQuery = {}): Promise<QualityControlListResult> {
    return apiFetch<QualityControlListResult>(
      `/api/quality-control${toQuery({
        branchId: query.branchId,
        batchId: query.batchId,
        status: query.status,
        page: query.page,
        pageSize: query.pageSize,
      })}`,
    );
  },

  async pendingBatches(branchId?: string): Promise<PendingQCBatch[]> {
    return apiFetch<PendingQCBatch[]>(`/api/quality-control/pending${toQuery({ branchId })}`);
  },

  async create(input: CreateQualityCheckInput): Promise<QualityControlCheckRow> {
    return apiFetch<QualityControlCheckRow>("/api/quality-control", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: UpdateQualityCheckInput): Promise<QualityControlCheckRow> {
    return apiFetch<QualityControlCheckRow>(`/api/quality-control/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
};