"use client";

import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

// Mock Medicine Inventory Database for Real-Time Search Lookup
const inventoryDb = [
  {
    id: "M001",
    name: "Dolo 650mg Tablet",
    stripSize: "15 Tabs",
    pricePerStrip: 30.5,
    taxPct: 12,
    stockStrips: 120,
    rack: "A-04",
  },
  {
    id: "M002",
    name: "Amoxicillin 500mg Capsule",
    stripSize: "10 Caps",
    pricePerStrip: 72.0,
    taxPct: 12,
    stockStrips: 45,
    rack: "B-12",
  },
  {
    id: "M003",
    name: "Pantoprazole 40mg (Pan-D)",
    stripSize: "15 Tabs",
    pricePerStrip: 148.0,
    taxPct: 18,
    stockStrips: 88,
    rack: "A-01",
  },
  {
    id: "M004",
    name: "Metformin 500mg SR (Glycomet)",
    stripSize: "10 Tabs",
    pricePerStrip: 24.5,
    taxPct: 12,
    stockStrips: 210,
    rack: "C-03",
  },
  {
    id: "M005",
    name: "Cetirizine 10mg (Alerid)",
    stripSize: "10 Tabs",
    pricePerStrip: 18.2,
    taxPct: 12,
    stockStrips: 340,
    rack: "D-02",
  },
  {
    id: "M006",
    name: "Azithromycin 500mg (Azee)",
    stripSize: "3 Tabs",
    pricePerStrip: 119.0,
    taxPct: 18,
    stockStrips: 15,
    rack: "B-05",
  },
];

interface CartItem {
  id: string;
  name: string;
  stripSize: string;
  pricePerStrip: number;
  taxPct: number;
  quantityStrips: number;
}

const inputBase =
  "w-full rounded-none border border-line bg-white px-3 py-2 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-2 focus:ring-teal-mid/15 transition-all font-body";

export default function QuickBilling() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("Walk-In Customer");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isBillSettled, setIsBillSettled] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search field on mount for immediate keyboard entries
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filter products based on typing input
  const filteredProducts = inventoryDb.filter(
    prod =>
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const addToCart = (product: (typeof inventoryDb)[0]) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantityStrips: item.quantityStrips + 1 }
            : item,
        );
      }
      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          stripSize: product.stripSize,
          pricePerStrip: product.pricePerStrip,
          taxPct: product.taxPct,
          quantityStrips: 1,
        },
      ];
    });
    setSearchQuery(""); // Clear search for next scan
    searchInputRef.current?.focus();
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prevCart =>
      prevCart
        .map(item => {
          if (item.id === id) {
            const nextQty = item.quantityStrips + delta;
            return { ...item, quantityStrips: nextQty };
          }
          return item;
        })
        .filter(item => item.quantityStrips > 0),
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.pricePerStrip * item.quantityStrips,
    0,
  );
  const totalTax = cart.reduce((sum, item) => {
    const itemPrice = item.pricePerStrip * item.quantityStrips;
    return sum + (itemPrice * item.taxPct) / 100;
  }, 0);
  const grandTotal = subtotal + totalTax;

  const handleSettleBill = () => {
    if (cart.length === 0) return;
    setIsBillSettled(true);
    setTimeout(() => {
      // Clear workstation variables on successful settlement
      setCart([]);
      setCustomerPhone("");
      setCustomerName("Walk-In Customer");
      setIsBillSettled(false);
      searchInputRef.current?.focus();
    }, 2000);
  };

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
            Keyboard optimized counter workspace. Instantly search medical SKUs,
            manage strips, and close cash books.
          </p>
        </div>
        <div className="flex items-center gap-1.5 border border-teal-mid/25 bg-teal-mid/10 px-3 py-1.5 text-[13px] font-semibold text-teal-mid font-mono">
          <span className="h-1.5 w-1.5 bg-stamp" /> Terminal Active: Counter-01
        </div>
      </div>

      {/* ── Main Workspace Matrix ── */}
      <div className="grid w-full items-start gap-5 xl:grid-cols-[1fr_420px]">
        {/* LEFT COLUMN: Search and Product Catalog selection */}
        <div className="flex flex-col gap-4">
          {/* Real-time Search Input Wrapper */}
          <div className="relative w-full">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
              <Search size={18} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Type drug name, generic formulation, or batch bar-code... (e.g., Dolo)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`${inputBase} py-3.5 pl-11 text-[15px]`}
            />
          </div>

          {/* Catalog Selection Grid Box */}
          <div className="border border-line bg-white p-4">
            <h3 className="mb-3 text-[13.5px] font-semibold uppercase tracking-[0.06em] text-ink/55 font-mono">
              {searchQuery
                ? "Matching Formulations Lookup"
                : "Frequently Dispensed Items"}
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stockStrips <= 0;
                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`cursor-pointer border p-3 transition-colors ${
                      isOutOfStock
                        ? "cursor-not-allowed border-line bg-paper opacity-60"
                        : "border-line bg-white hover:border-teal-mid"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded-none bg-paper-dim px-1.5 py-0.5 text-[11px] font-semibold text-ink/55 font-mono">
                        {product.rack}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          product.stockStrips < 20
                            ? "text-danger"
                            : "text-ink/50"
                        }`}
                      >
                        {product.stockStrips} strips left
                      </span>
                    </div>
                    <div className="mb-1 mt-2 text-[13.5px] font-semibold text-ink">
                      {product.name}
                    </div>
                    <div className="text-[11px] text-ink/40">
                      Pack: {product.stripSize} | GST: {product.taxPct}%
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-mono text-[14px] font-bold text-ink">
                        ₹{product.pricePerStrip.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-0.5 text-[11px] font-semibold text-stamp">
                        <Plus size={12} /> Add Strip
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-2 py-10 text-center text-ink/40">
                  <AlertCircle size={24} />
                  <span className="text-[14px]">
                    No matching medications discovered in system logs.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Running checkout cart container summary */}
        <div className="flex flex-col gap-4">
          {/* Customer CRM Information Section */}
          <div className="flex flex-col gap-2.5 border border-line bg-white p-4">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink/60">
              <User size={15} /> Customer Information Link
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Mobile Number (Receipt SMS)"
                value={customerPhone}
                onChange={e => {
                  setCustomerPhone(e.target.value);
                  if (e.target.value === "9876543210")
                    setCustomerName("Srinivas Rao"); // Mock quick fetch
                }}
                className={inputBase}
              />
            </div>
            <div className="pl-0.5 text-[12px] text-ink/50">
              Active Patient Account:{" "}
              <strong className="text-ink">{customerName}</strong>
            </div>
          </div>

          {/* Running Bill Ledger List */}
          <div className="flex min-h-[280px] flex-col border border-line bg-white p-4">
            <div className="mb-2.5 flex items-center gap-2 border-b border-line pb-2.5">
              <ShoppingCart size={16} className="text-ink/60" />
              <span className="text-[14px] font-semibold text-ink">
                Checkout Queue
              </span>
              <span className="ml-auto rounded-none bg-paper-dim px-2 py-0.5 text-[12px] font-semibold text-ink/60 font-mono">
                {cart.reduce((s, i) => s + i.quantityStrips, 0)} items
              </span>
            </div>

            {/* Cart Items Loop */}
            <div className="flex max-h-[300px] flex-1 flex-col gap-3 overflow-y-auto">
              {cart.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-line/60 pb-2 text-[13px]"
                >
                  <div className="mr-2.5 flex-1">
                    <div className="font-semibold text-ink/80">{item.name}</div>
                    <div className="text-[11px] text-ink/40">
                      ₹{item.pricePerStrip.toFixed(2)} / strip
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div className="mr-3 flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="flex h-5.5 w-5.5 cursor-pointer items-center justify-center border border-line bg-white text-ink/60 transition-colors hover:border-teal-mid hover:text-teal-mid"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="w-5 text-center font-semibold text-ink">
                      {item.quantityStrips}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="flex h-5.5 w-5.5 cursor-pointer items-center justify-center border border-line bg-white text-ink/60 transition-colors hover:border-teal-mid hover:text-teal-mid"
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  <div className="min-w-[70px] text-right">
                    <div className="font-mono font-bold text-ink">
                      ₹{(item.pricePerStrip * item.quantityStrips).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
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
                  <span className="text-[12.5px]">
                    The billing basket is empty
                  </span>
                </div>
              )}
            </div>

            {/* Financial Accounting Aggregation Blocks */}
            <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3 text-[13px]">
              <div className="flex justify-between text-ink/50">
                <span>Subtotal Basket</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-ink/50">
                <span>Calculated CGST/SGST Pool</span>
                <span className="font-mono">₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-dashed border-line pt-2 text-base font-bold text-ink">
                <span>Grand Aggregate Total</span>
                <span className="font-mono text-teal-mid">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector Block */}
            <div className="mt-3.5 grid grid-cols-3 gap-1.5">
              {["UPI", "Cash", "Card"].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`cursor-pointer rounded-none border py-2 text-[12px] font-semibold transition-colors ${
                    paymentMethod === method
                      ? "border-teal-mid bg-teal-mid/10 text-teal-mid"
                      : "border-line bg-white text-ink/50 hover:border-ink/30"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Final Settlement Settle Drawer CTA Trigger */}
            <button
              onClick={handleSettleBill}
              disabled={cart.length === 0 || isBillSettled}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-none border py-3 text-[14px] font-bold text-paper transition-colors ${
                isBillSettled
                  ? "cursor-not-allowed border-teal-mid bg-teal-mid"
                  : cart.length === 0
                    ? "cursor-not-allowed border-line bg-paper-dim text-ink/40"
                    : "cursor-pointer border-ink bg-ink hover:bg-teal-deep"
              }`}
            >
              {isBillSettled ? (
                <>
                  <CheckCircle size={16} /> Bill Settled & Printed!
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
