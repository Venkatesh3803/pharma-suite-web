"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  Zap,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  salesApi,
  customersApi,
  branchesApi,
  type PosLookupRow,
  type PaymentMode,
  type BranchSummary,
} from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { formatINR } from "@/lib/inventory";
import {
  enqueueSale,
  flushQueue,
  getPendingCount,
  isNetworkError,
  newClientSaleId,
  subscribeToQueue,
  useOnline,
} from "@/lib/offline-sync";

interface CartItem {
  productId: string;
  brand: string;
  genericName: string | null;
  saleUnit: string;
  saleUnitFactor: number;
  pricePerSaleUnit: number;
  gstRate: number;
  quantity: number;
  maxUnits: number;
}

interface CustomerMatch {
  id: string;
  name: string;
  phone: string | null;
}

const inputBase =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

const PAYMENT_MODES: { mode: PaymentMode; label: string }[] = [
  { mode: "CASH", label: "Cash" },
  { mode: "UPI", label: "UPI" },
  { mode: "CARD", label: "Card" },
  { mode: "CREDIT", label: "Credit" },
];

export default function QuickBilling() {
  const user = useAppSelector(state => state.auth.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<PosLookupRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [branchId, setBranchId] = useState(user?.branchId ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customer, setCustomer] = useState<CustomerMatch | null>(null);
  const [customerLookup, setCustomerLookup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMode>("UPI");
  const [settling, setSettling] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const online = useOnline();
  const [pendingCount, setPendingCount] = useState(() => getPendingCount());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    return subscribeToQueue(() => setPendingCount(getPendingCount()));
  }, []);

  useEffect(() => {
    if (!online || pendingCount === 0) return;
    const t = setTimeout(() => {
      setSyncing(true);
      void flushQueue().finally(() => {
        setSyncing(false);
        setPendingCount(getPendingCount());
      });
    }, 0);
    return () => clearTimeout(t);
  }, [online, pendingCount]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadBranches() {
      try {
        const list = await branchesApi.list();
        if (!ignore) {
          setBranches(list);
          if (!branchId && list.length > 0) setBranchId(list[0].id);
        }
      } catch {
        if (!ignore) setNotice("Unable to load branch list.");
      }
    }
    if (!branchId) void loadBranches();
    return () => {
      ignore = true;
    };
  }, [branchId]);

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim() || !branchId) {
        setResults([]);
        return;
      }
      setSearching(true);
      setError("");
      try {
        const rows = await salesApi.posLookup({ search: q.trim(), branchId });
        setResults(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed.");
      } finally {
        setSearching(false);
      }
    },
    [branchId],
  );

  const debouncedSearch = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    debouncedSearch.current = setTimeout(() => {
      void runSearch(value);
    }, 250);
  };

  const addToCart = (product: PosLookupRow) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.productId === product.productId);
      if (existing) {
        return prevCart.map(item =>
          item.productId === product.productId
            ? { ...item, quantity: Math.min(item.quantity + 1, item.maxUnits) }
            : item,
        );
      }
      if (product.stockSaleUnits <= 0) return prevCart;
      return [
        ...prevCart,
        {
          productId: product.productId,
          brand: product.brand,
          genericName: product.genericName,
          saleUnit: product.saleUnit,
          saleUnitFactor: product.saleUnitFactor,
          pricePerSaleUnit: product.pricePerSaleUnit,
          gstRate: product.gstRate,
          quantity: 1,
          maxUnits: product.stockSaleUnits,
        },
      ];
    });
    setSearchQuery("");
    setResults([]);
    searchInputRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prevCart =>
      prevCart
        .map(item => {
          if (item.productId !== productId) return item;
          const nextQty = item.quantity + delta;
          return { ...item, quantity: Math.max(1, Math.min(nextQty, item.maxUnits)) };
        })
        .filter(() => true),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const lookupCustomer = async () => {
    const phone = customerPhone.trim();
    if (!phone) {
      setCustomer(null);
      return;
    }
    setCustomerLookup(true);
    try {
      const data = await customersApi.list({ search: phone, pageSize: 1 });
      const match = data.items[0];
      if (match && match.phone && match.phone.replace(/\D/g, "").includes(phone.replace(/\D/g, ""))) {
        setCustomer({ id: match.id, name: match.name, phone: match.phone });
        setError("");
      } else {
        setCustomer(null);
        setError("No customer found for this number. It will be billed as walk-in.");
      }
    } catch (e) {
      setCustomer(null);
      setError(e instanceof Error ? e.message : "Customer lookup failed.");
    } finally {
      setCustomerLookup(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.pricePerSaleUnit * item.quantity, 0);
  const totalTax = cart.reduce((sum, item) => {
    const itemPrice = item.pricePerSaleUnit * item.quantity;
    return sum + (itemPrice * item.gstRate) / 100;
  }, 0);
  const grandTotal = subtotal + totalTax;

  const handleSettleBill = async () => {
    if (cart.length === 0 || settling) return;
    setSettling(true);
    setError("");
    setLastInvoice(null);
    const clientSaleId = newClientSaleId();
    const items = cart.map(item => ({
      productId: item.productId,
      quantity: item.quantity * item.saleUnitFactor,
    }));
    const payload = {
      branchId,
      customerId: customer?.id,
      paymentMode: paymentMethod,
      items,
      clientSaleId,
    };
    try {
      if (!online) {
        enqueueSale(payload, {
          labels: cart.map(item => `${item.brand} ×${item.quantity * item.saleUnitFactor}`),
          total: grandTotal,
        });
        setCart([]);
        setCustomerPhone("");
        setCustomer(null);
        setPendingCount(getPendingCount());
        setNotice("You're offline — the sale is queued and will sync automatically.");
        searchInputRef.current?.focus();
        return;
      }
      const data = await salesApi.create(payload);
      setLastInvoice(data.sale.invoiceNo);
      setCart([]);
      setCustomerPhone("");
      setCustomer(null);
      searchInputRef.current?.focus();
    } catch (e) {
      if (isNetworkError(e)) {
        enqueueSale(payload, {
          labels: cart.map(item => `${item.brand} ×${item.quantity * item.saleUnitFactor}`),
          total: grandTotal,
        });
        setCart([]);
        setCustomerPhone("");
        setCustomer(null);
        setPendingCount(getPendingCount());
        setNotice("Connection lost — the sale is queued and will sync automatically.");
        searchInputRef.current?.focus();
      } else {
        setError(e instanceof Error ? e.message : "Could not settle the bill.");
      }
    } finally {
      setSettling(false);
    }
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex h-full w-full flex-col gap-5">
      {/* ── Top Header Control Block ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-stamp font-mono">
            Counter Terminal Workspace
          </span>
          <h1 className="mt-1.5 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-ink">
            <Zap size={24} className="text-stamp" /> Express Retail Billing
          </h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            Instantly search medical SKUs, add to the basket and close the cash
            book.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
            className="max-w-[220px] rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-semibold text-ink focus:outline-none focus:border-teal-mid"
            aria-label="Counter branch"
          >
            {branches.length === 0 && <option value="">Select branch</option>}
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
          <div
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold font-mono ${
              online
                ? "border-teal-mid/25 bg-teal-mid/10 text-teal-mid"
                : "border-danger/25 bg-danger-bg text-danger"
            }`}
          >
            <span className={`h-1.5 w-1.5 ${online ? "bg-stamp" : "bg-danger"}`} />
            {online ? "Online · Counter Active" : "Offline · Queuing Sales"}
          </div>
          {pendingCount > 0 && (
            <button
              onClick={() => {
                setSyncing(true);
                void flushQueue().finally(() => {
                  setSyncing(false);
                  setPendingCount(getPendingCount());
                });
              }}
              disabled={syncing || !online}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stamp/30 bg-stamp-dim px-3 py-1.5 text-[13px] font-semibold text-stamp transition-colors hover:bg-stamp hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ShoppingCart size={14} />
              )}
              {pendingCount} queued · Sync
            </button>
          )}
        </div>
      </div>

      {lastInvoice && (
        <div className="flex items-center gap-2 rounded-2xl border border-teal-mid/40 bg-teal-mid/10 px-4 py-2.5 text-[13.5px] font-semibold text-teal-deep">
          <CheckCircle size={16} /> Invoice {lastInvoice} settled. Stock has been
          deducted from the branch.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger-bg px-4 py-2.5 text-[13.5px] font-semibold text-danger">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-stamp/30 bg-stamp-dim px-4 py-2.5 text-[13.5px] font-semibold text-stamp">
          <AlertCircle size={16} /> {notice}
        </div>
      )}

      {/* ── Main Workspace Matrix ── */}
      <div className="grid w-full items-start gap-5 xl:grid-cols-[1fr_420px]">
        {/* LEFT COLUMN: Search and Product Catalog selection */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
              <Search size={18} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Type drug name, generic formulation, or batch bar-code... (e.g., Dolo)"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className={`${inputBase} py-3.5 pl-11 text-[15px]`}
            />
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <h3 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
              {searchQuery ? "Matching Formulations Lookup" : "Frequently Dispensed Items"}
            </h3>

            {searching && (
              <div className="flex items-center justify-center gap-2 py-10 text-ink/40">
                <Loader2 size={20} className="animate-spin" /> Searching stock…
              </div>
            )}

            {!searching && results.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.map(product => {
                  const isOutOfStock = product.stockSaleUnits <= 0;
                  return (
                    <div
                      key={product.productId}
                      onClick={() => !isOutOfStock && addToCart(product)}
                      className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                        isOutOfStock
                          ? "cursor-not-allowed border-line bg-paper opacity-60"
                          : "border-line bg-white hover:border-teal-mid"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="rounded-lg bg-paper-dim px-1.5 py-0.5 text-[11px] font-semibold text-ink/55 font-mono">
                          {product.saleUnit}
                        </span>
                        <span
                          className={`text-[11px] font-medium ${
                            product.lowStock ? "text-danger" : "text-ink/50"
                          }`}
                        >
                          {product.stockDisplay} left
                        </span>
                      </div>
                      <div className="mb-1 mt-2 text-[13.5px] font-semibold text-ink">
                        {product.brand}
                        {product.strength ? ` ${product.strength}` : ""}
                      </div>
                      <div className="text-[11px] text-ink/40">
                        {product.genericName ?? product.packSize ?? ""} | GST:{" "}
                        {product.gstRate}%
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-mono text-[14px] font-bold text-ink">
                          {formatINR(product.pricePerSaleUnit)}
                        </span>
                        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-stamp">
                          <Plus size={12} /> Add {product.saleUnit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!searching && searchQuery.trim() !== "" && results.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-ink/40">
                <AlertCircle size={24} />
                <span className="text-[14px]">No matching medications in stock.</span>
              </div>
            )}

            {!searching && searchQuery.trim() === "" && cart.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-ink/40">
                <ShoppingCart size={24} className="opacity-50" />
                <span className="text-[13px]">
                  Search above to find stock available at the selected counter branch.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Running checkout cart container summary */}
        <div className="flex flex-col gap-4">
          {/* Customer CRM Information Section */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">
              <User size={15} /> Customer Information
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Mobile Number (lookup or walk-in)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                onBlur={() => void lookupCustomer()}
                className={inputBase}
              />
            </div>
            <div className="pl-0.5 text-[12px] text-ink/50">
              {customerLookup ? (
                <span className="flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Looking up…
                </span>
              ) : customer ? (
                <>
                  Active Customer:{" "}
                  <strong className="text-ink">{customer.name}</strong>
                  <span className="font-mono text-ink/40"> {customer.phone}</span>
                </>
              ) : (
                <>Billing as <strong className="text-ink">Walk-In Customer</strong></>
              )}
            </div>
          </div>

          {/* Running Bill Ledger List */}
          <div className="flex min-h-[280px] flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)]">
            <div className="mb-2.5 flex items-center gap-2 border-b border-line pb-2.5">
              <ShoppingCart size={16} className="text-ink/60" />
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45">Checkout Queue</span>
              <span className="ml-auto rounded-lg bg-paper-dim px-2 py-0.5 text-[12px] font-semibold text-ink/60 font-mono">
                {totalItems} {totalItems === 1 ? "unit" : "units"}
              </span>
            </div>

            <div className="flex max-h-[300px] flex-1 flex-col gap-3 overflow-y-auto">
              {cart.map(item => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between border-b border-line/60 pb-2 text-[13px]"
                >
                  <div className="mr-2.5 flex-1">
                    <div className="font-semibold text-ink/80">{item.brand}</div>
                    <div className="text-[11px] text-ink/40">
                      {formatINR(item.pricePerSaleUnit)} / {item.saleUnit} · GST{" "}
                      {item.gstRate}%
                    </div>
                  </div>

                  <div className="mr-3 flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="flex h-5.5 w-5.5 cursor-pointer items-center justify-center rounded-md border border-line bg-white text-ink/60 transition-colors hover:border-teal-mid hover:text-teal-mid"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="w-5 text-center font-semibold text-ink">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="flex h-5.5 w-5.5 cursor-pointer items-center justify-center rounded-md border border-line bg-white text-ink/60 transition-colors hover:border-teal-mid hover:text-teal-mid"
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  <div className="min-w-[70px] text-right">
                    <div className="font-mono font-bold text-ink">
                      {formatINR(item.pricePerSaleUnit * item.quantity)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="mt-0.5 cursor-pointer border-0 bg-transparent p-0 text-ink/40 transition-colors hover:text-danger"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 pb-10 pt-4 text-ink/40">
                  <ShoppingCart size={24} className="opacity-50" />
                  <span className="text-[12.5px]">The billing basket is empty</span>
                </div>
              )}
            </div>

            {/* Financial Accounting Aggregation Blocks */}
            <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3 text-[13px]">
              <div className="flex justify-between text-ink/50">
                <span>Subtotal Basket</span>
                <span className="font-mono">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink/50">
                <span>Calculated CGST/SGST Pool</span>
                <span className="font-mono">{formatINR(totalTax)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-dashed border-line pt-2 text-base font-bold text-ink">
                <span>Grand Aggregate Total</span>
                <span className="font-mono text-teal-mid">{formatINR(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector Block */}
            <div className="mt-3.5 grid grid-cols-4 gap-1.5">
              {PAYMENT_MODES.map(method => (
                <button
                  key={method.mode}
                  onClick={() => setPaymentMethod(method.mode)}
                  className={`cursor-pointer rounded-lg border py-2 text-[11.5px] font-semibold transition-colors ${
                    paymentMethod === method.mode
                      ? "border-teal-mid bg-teal-mid/10 text-teal-mid"
                      : "border-line bg-white text-ink/50 hover:border-ink/30"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {/* Final Settlement Drawer */}
            <button
              onClick={() => void handleSettleBill()}
              disabled={cart.length === 0 || settling || !branchId}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-[14px] font-bold text-paper transition-colors ${
                settling
                  ? "cursor-wait border-teal-mid bg-teal-mid"
                  : cart.length === 0 || !branchId
                    ? "cursor-not-allowed border-line bg-paper-dim text-ink/40"
                    : "cursor-pointer border-ink bg-ink hover:bg-teal-deep"
              }`}
            >
              {settling ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Settling Bill…
                </>
              ) : (
                <>
                  <CreditCard size={16} /> Close Book & Settle [F8]
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}