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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
        height: "100%",
      }}
    >
      {/* ── Top Header Control Block ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Zap size={24} color="#059669" fill="#059669" /> Express Retail
            Billing
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Keyboard optimized counter workspace. Instantly search medical SKUs,
            manage strips, and close cash books.
          </p>
        </div>
        <div
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            backgroundColor: "#f0fdf4",
            color: "#16a34a",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Terminal Active: Counter-01
        </div>
      </div>

      {/* ── Main Workspace Matrix ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: "20px",
          width: "100%",
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN: Search and Product Catalog selection */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Real-time Search Input Wrapper */}
          <div style={{ position: "relative", width: "100%" }}>
            <div
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            >
              <Search size={18} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Type drug name, generic formulation, or batch bar-code... (e.g., Dolo)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 14px 14px 44px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "15px",
                outline: "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Catalog Selection Grid Box */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#475569",
                margin: "0 0 12px 0",
              }}
            >
              {searchQuery
                ? "Matching Formulations Lookup"
                : "Frequently Dispensed Items"}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              {filteredProducts.map(product => {
                const isOutOfStock = product.stockStrips <= 0;
                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "12px",
                      cursor: isOutOfStock ? "not-allowed" : "pointer",
                      backgroundColor: isOutOfStock ? "#f8fafc" : "#ffffff",
                      transition: "transform 0.1s, border-color 0.1s",
                      opacity: isOutOfStock ? 0.6 : 1,
                    }}
                    onMouseEnter={e => {
                      if (!isOutOfStock)
                        e.currentTarget.style.borderColor = "#059669";
                    }}
                    onMouseLeave={e => {
                      if (!isOutOfStock)
                        e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          backgroundColor: "#f1f5f9",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        {product.rack}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color:
                            product.stockStrips < 20 ? "#dc2626" : "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        {product.stockStrips} strips left
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: "#1e293b",
                        margin: "8px 0 4px 0",
                      }}
                    >
                      {product.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      Pack: {product.stripSize} | GST: {product.taxPct}%
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        ₹{product.pricePerStrip.toFixed(2)}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#059669",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "2px",
                        }}
                      >
                        <Plus size={12} /> Add Strip
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "40px",
                    textAlign: "center",
                    color: "#94a3b8",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={24} />
                  <span style={{ fontSize: "14px" }}>
                    No matching medications discovered in system logs.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Running checkout cart container summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Customer CRM Information Section */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              <User size={15} /> Customer Information Link
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Mobile Number (Receipt SMS)"
                value={customerPhone}
                onChange={e => {
                  setCustomerPhone(e.target.value);
                  if (e.target.value === "9876543210")
                    setCustomerName("Srinivas Rao"); // Mock quick fetch
                }}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
            <div
              style={{ fontSize: "12px", color: "#64748b", paddingLeft: "2px" }}
            >
              Active Patient Account:{" "}
              <strong style={{ color: "#0f172a" }}>{customerName}</strong>
            </div>
          </div>

          {/* Running Bill Ledger List */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px",
              minHeight: "280px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "10px",
                marginBottom: "10px",
              }}
            >
              <ShoppingCart size={16} color="#475569" />
              <span
                style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}
              >
                Checkout Queue
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "12px",
                  backgroundColor: "#f1f5f9",
                  padding: "2px 8px",
                  borderRadius: "20px",
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                {cart.reduce((s, i) => s + i.quantityStrips, 0)} items
              </span>
            </div>

            {/* Cart Items Loop */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: "300px",
              }}
            >
              {cart.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    borderBottom: "1px solid #f8fafc",
                    paddingBottom: "8px",
                  }}
                >
                  <div style={{ flex: 1, marginRight: "10px" }}>
                    <div style={{ fontWeight: 600, color: "#334155" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      ₹{item.pricePerStrip.toFixed(2)} / strip
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginRight: "12px",
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      style={{
                        width: "22px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <Minus size={10} />
                    </button>
                    <span
                      style={{
                        width: "20px",
                        textAlign: "center",
                        fontWeight: 600,
                      }}
                    >
                      {item.quantityStrips}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      style={{
                        width: "22px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  <div style={{ textAlign: "right", minWidth: "70px" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      ₹{(item.pricePerStrip * item.quantityStrips).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "#94a3b8",
                        cursor: "pointer",
                        marginTop: "2px",
                      }}
                      onMouseEnter={e =>
                        (e.currentTarget.style.color = "#ef4444")
                      }
                      onMouseLeave={e =>
                        (e.currentTarget.style.color = "#94a3b8")
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "#94a3b8",
                    paddingTop: "40px",
                  }}
                >
                  <ShoppingCart size={24} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: "12.5px" }}>
                    The billing basket is empty
                  </span>
                </div>
              )}
            </div>

            {/* Financial Accounting Aggregation Blocks */}
            <div
              style={{
                borderTop: "1px solid #f1f5f9",
                paddingTop: "12px",
                marginTop: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "13px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#64748b",
                }}
              >
                <span>Subtotal Basket</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#64748b",
                }}
              >
                <span>Calculated CGST/SGST Pool</span>
                <span>₹{totalTax.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                  borderTop: "1px dashed #e2e8f0",
                  paddingTop: "8px",
                  marginTop: "4px",
                }}
              >
                <span>Grand Aggregate Total</span>
                <span style={{ color: "#059669" }}>
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector Block */}
            <div
              style={{
                marginTop: "14px",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "6px",
              }}
            >
              {["UPI", "Cash", "Card"].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: "8px 0",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor:
                      paymentMethod === method ? "#059669" : "#e2e8f0",
                    backgroundColor:
                      paymentMethod === method ? "#f0fdf4" : "#ffffff",
                    color: paymentMethod === method ? "#059669" : "#475569",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.1s",
                  }}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Final Settlement Settle Drawer CTA Trigger */}
            <button
              onClick={handleSettleBill}
              disabled={cart.length === 0 || isBillSettled}
              style={{
                marginTop: "12px",
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: isBillSettled
                  ? "#16a34a"
                  : cart.length === 0
                    ? "#cbd5e1"
                    : "#059669",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
                border: "none",
                cursor:
                  cart.length === 0 || isBillSettled
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background-color 0.15s",
              }}
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
// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import {
//   Search,
//   ShoppingCart,
//   Trash2,
//   Plus,
//   Minus,
//   User,
//   Zap,
//   CreditCard,
//   CheckCircle,
//   AlertCircle,
// } from "lucide-react";

// // Mock Medicine Inventory Database for Real-Time Search Lookup
// const inventoryDb = [
//   {
//     id: "M001",
//     name: "Dolo 650mg Tablet",
//     stripSize: "15 Tabs",
//     pricePerStrip: 30.5,
//     taxPct: 12,
//     stockStrips: 120,
//     rack: "A-04",
//   },
//   {
//     id: "M002",
//     name: "Amoxicillin 500mg Capsule",
//     stripSize: "10 Caps",
//     pricePerStrip: 72.0,
//     taxPct: 12,
//     stockStrips: 45,
//     rack: "B-12",
//   },
//   {
//     id: "M003",
//     name: "Pantoprazole 40mg (Pan-D)",
//     stripSize: "15 Tabs",
//     pricePerStrip: 148.0,
//     taxPct: 18,
//     stockStrips: 88,
//     rack: "A-01",
//   },
//   {
//     id: "M004",
//     name: "Metformin 500mg SR (Glycomet)",
//     stripSize: "10 Tabs",
//     pricePerStrip: 24.5,
//     taxPct: 12,
//     stockStrips: 210,
//     rack: "C-03",
//   },
//   {
//     id: "M005",
//     name: "Cetirizine 10mg (Alerid)",
//     stripSize: "10 Tabs",
//     pricePerStrip: 18.2,
//     taxPct: 12,
//     stockStrips: 340,
//     rack: "D-02",
//   },
//   {
//     id: "M006",
//     name: "Azithromycin 500mg (Azee)",
//     stripSize: "3 Tabs",
//     pricePerStrip: 119.0,
//     taxPct: 18,
//     stockStrips: 15,
//     rack: "B-05",
//   },
// ];

// interface CartItem {
//   id: string;
//   name: string;
//   stripSize: string;
//   pricePerStrip: number;
//   taxPct: number;
//   quantityStrips: number;
// }

// export default function QuickBilling() {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [customerPhone, setCustomerPhone] = useState("");
//   const [customerName, setCustomerName] = useState("Walk-In Customer");
//   const [paymentMethod, setPaymentMethod] = useState("UPI");
//   const [isBillSettled, setIsBillSettled] = useState(false);

//   const searchInputRef = useRef<HTMLInputElement>(null);

//   // Auto-focus search field on mount for immediate keyboard entries
//   useEffect(() => {
//     if (searchInputRef.current) {
//       searchInputRef.current.focus();
//     }
//   }, []);

//   // Filter products based on typing input
//   const filteredProducts = inventoryDb.filter(
//     prod =>
//       prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       prod.id.toLowerCase().includes(searchQuery.toLowerCase()),
//   );

//   const addToCart = (product: (typeof inventoryDb)[0]) => {
//     setCart(prevCart => {
//       const existing = prevCart.find(item => item.id === product.id);
//       if (existing) {
//         return prevCart.map(item =>
//           item.id === product.id
//             ? { ...item, quantityStrips: item.quantityStrips + 1 }
//             : item,
//         );
//       }
//       return [
//         ...prevCart,
//         {
//           id: product.id,
//           name: product.name,
//           stripSize: product.stripSize,
//           pricePerStrip: product.pricePerStrip,
//           taxPct: product.taxPct,
//           quantityStrips: 1,
//         },
//       ];
//     });
//     setSearchQuery(""); // Clear search for next scan
//     searchInputRef.current?.focus();
//   };

//   const updateQuantity = (id: string, delta: number) => {
//     setCart(prevCart =>
//       prevCart
//         .map(item => {
//           if (item.id === id) {
//             const nextQty = item.quantityStrips + delta;
//             return { ...item, quantityStrips: nextQty };
//           }
//           return item;
//         })
//         .filter(item => item.quantityStrips > 0),
//     );
//   };

//   const removeFromCart = (id: string) => {
//     setCart(prevCart => prevCart.filter(item => item.id !== id));
//   };

//   // Calculations
//   const subtotal = cart.reduce(
//     (sum, item) => sum + item.pricePerStrip * item.quantityStrips,
//     0,
//   );
//   const totalTax = cart.reduce((sum, item) => {
//     const itemPrice = item.pricePerStrip * item.quantityStrips;
//     return sum + (itemPrice * item.taxPct) / 100;
//   }, 0);
//   const grandTotal = subtotal + totalTax;

//   const handleSettleBill = () => {
//     if (cart.length === 0) return;
//     setIsBillSettled(true);
//     setTimeout(() => {
//       // Clear workstation variables on successful settlement
//       setCart([]);
//       setCustomerPhone("");
//       setCustomerName("Walk-In Customer");
//       setIsBillSettled(false);
//       searchInputRef.current?.focus();
//     }, 2000);
//   };

//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         gap: "20px",
//         width: "100%",
//         height: "100%",
//       }}
//     >
//       {/* ── Top Header Control Block ── */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <div>
//           <h1
//             style={{
//               fontSize: "24px",
//               fontWeight: 700,
//               color: "#0f172a",
//               margin: 0,
//               display: "flex",
//               alignItems: "center",
//               gap: "8px",
//             }}
//           >
//             <Zap size={24} color="#059669" fill="#059669" /> Express Retail
//             Billing
//           </h1>
//           <p
//             style={{
//               fontSize: "14px",
//               color: "#64748b",
//               marginTop: "4px",
//               marginBottom: 0,
//             }}
//           >
//             Keyboard optimized counter workspace. Instantly search medical SKUs,
//             manage strips, and close cash books.
//           </p>
//         </div>
//         <div
//           style={{
//             padding: "6px 12px",
//             borderRadius: "6px",
//             backgroundColor: "#f0fdf4",
//             color: "#16a34a",
//             fontSize: "13px",
//             fontWeight: 600,
//           }}
//         >
//           Terminal Active: Counter-01
//         </div>
//       </div>

//       {/* ── Main Workspace Matrix ── */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "1fr 420px",
//           gap: "20px",
//           width: "100%",
//           alignItems: "start",
//         }}
//       >
//         {/* LEFT COLUMN: Search and Product Catalog selection */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//           {/* Real-time Search Input Wrapper */}
//           <div style={{ position: "relative", width: "100%" }}>
//             <div
//               style={{
//                 position: "absolute",
//                 left: "14px",
//                 top: "50%",
//                 transform: "translateY(-50%)",
//                 color: "#94a3b8",
//               }}
//             >
//               <Search size={18} />
//             </div>
//             <input
//               ref={searchInputRef}
//               type="text"
//               placeholder="Type drug name, generic formulation, or batch bar-code... (e.g., Dolo)"
//               value={searchQuery}
//               onChange={e => setSearchQuery(e.target.value)}
//               style={{
//                 width: "100%",
//                 padding: "14px 14px 14px 44px",
//                 borderRadius: "10px",
//                 border: "1px solid #cbd5e1",
//                 fontSize: "15px",
//                 outline: "none",
//                 boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
//                 fontFamily: "inherit",
//               }}
//             />
//           </div>

//           {/* Catalog Selection Grid Box */}
//           <div
//             style={{
//               backgroundColor: "#ffffff",
//               border: "1px solid #e2e8f0",
//               borderRadius: "12px",
//               padding: "16px",
//             }}
//           >
//             <h3
//               style={{
//                 fontSize: "14px",
//                 fontWeight: 600,
//                 color: "#475569",
//                 margin: "0 0 12px 0",
//               }}
//             >
//               {searchQuery
//                 ? "Matching Formulations Lookup"
//                 : "Frequently Dispensed Items"}
//             </h3>

//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
//                 gap: "12px",
//               }}
//             >
//               {filteredProducts.map(product => {
//                 const isOutOfStock = product.stockStrips <= 0;
//                 return (
//                   <div
//                     key={product.id}
//                     onClick={() => !isOutOfStock && addToCart(product)}
//                     style={{
//                       border: "1px solid #e2e8f0",
//                       borderRadius: "8px",
//                       padding: "12px",
//                       cursor: isOutOfStock ? "not-allowed" : "pointer",
//                       backgroundColor: isOutOfStock ? "#f8fafc" : "#ffffff",
//                       transition: "transform 0.1s, border-color 0.1s",
//                       opacity: isOutOfStock ? 0.6 : 1,
//                     }}
//                     onMouseEnter={e => {
//                       if (!isOutOfStock)
//                         e.currentTarget.style.borderColor = "#059669";
//                     }}
//                     onMouseLeave={e => {
//                       if (!isOutOfStock)
//                         e.currentTarget.style.borderColor = "#e2e8f0";
//                     }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "flex-start",
//                       }}
//                     >
//                       <span
//                         style={{
//                           fontSize: "11px",
//                           backgroundColor: "#f1f5f9",
//                           padding: "2px 6px",
//                           borderRadius: "4px",
//                           color: "#64748b",
//                           fontWeight: 600,
//                         }}
//                       >
//                         {product.rack}
//                       </span>
//                       <span
//                         style={{
//                           fontSize: "11px",
//                           color:
//                             product.stockStrips < 20 ? "#dc2626" : "#64748b",
//                           fontWeight: 500,
//                         }}
//                       >
//                         {product.stockStrips} strips left
//                       </span>
//                     </div>
//                     <div
//                       style={{
//                         fontSize: "13.5px",
//                         fontWeight: 600,
//                         color: "#1e293b",
//                         margin: "8px 0 4px 0",
//                       }}
//                     >
//                       {product.name}
//                     </div>
//                     <div style={{ fontSize: "11px", color: "#94a3b8" }}>
//                       Pack: {product.stripSize} | GST: {product.taxPct}%
//                     </div>
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                         marginTop: "12px",
//                       }}
//                     >
//                       <span
//                         style={{
//                           fontSize: "14px",
//                           fontWeight: 700,
//                           color: "#0f172a",
//                         }}
//                       >
//                         ₹{product.pricePerStrip.toFixed(2)}
//                       </span>
//                       <span
//                         style={{
//                           fontSize: "11px",
//                           color: "#059669",
//                           fontWeight: 600,
//                           display: "flex",
//                           alignItems: "center",
//                           gap: "2px",
//                         }}
//                       >
//                         <Plus size={12} /> Add Strip
//                       </span>
//                     </div>
//                   </div>
//                 );
//               })}
//               {filteredProducts.length === 0 && (
//                 <div
//                   style={{
//                     gridColumn: "1 / -1",
//                     padding: "40px",
//                     textAlign: "center",
//                     color: "#94a3b8",
//                     display: "flex",
//                     flexDirection: "column",
//                     alignItems: "center",
//                     gap: "8px",
//                   }}
//                 >
//                   <AlertCircle size={24} />
//                   <span style={{ fontSize: "14px" }}>
//                     No matching medications discovered in system logs.
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* RIGHT COLUMN: Running checkout cart container summary */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//           {/* Customer CRM Information Section */}
//           <div
//             style={{
//               backgroundColor: "#ffffff",
//               border: "1px solid #e2e8f0",
//               borderRadius: "12px",
//               padding: "16px",
//               display: "flex",
//               flexDirection: "column",
//               gap: "10px",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "6px",
//                 fontSize: "13px",
//                 fontWeight: 600,
//                 color: "#475569",
//               }}
//             >
//               <User size={15} /> Customer Information Link
//             </div>
//             <div style={{ display: "flex", gap: "8px" }}>
//               <input
//                 type="text"
//                 placeholder="Mobile Number (Receipt SMS)"
//                 value={customerPhone}
//                 onChange={e => {
//                   setCustomerPhone(e.target.value);
//                   if (e.target.value === "9876543210")
//                     setCustomerName("Srinivas Rao"); // Mock quick fetch
//                 }}
//                 style={{
//                   flex: 1,
//                   padding: "8px 10px",
//                   borderRadius: "6px",
//                   border: "1px solid #cbd5e1",
//                   fontSize: "13px",
//                   outline: "none",
//                 }}
//               />
//             </div>
//             <div
//               style={{ fontSize: "12px", color: "#64748b", paddingLeft: "2px" }}
//             >
//               Active Patient Account:{" "}
//               <strong style={{ color: "#0f172a" }}>{customerName}</strong>
//             </div>
//           </div>

//           {/* Running Bill Ledger List */}
//           <div
//             style={{
//               backgroundColor: "#ffffff",
//               border: "1px solid #e2e8f0",
//               borderRadius: "12px",
//               padding: "16px",
//               minHeight: "280px",
//               display: "flex",
//               flexDirection: "column",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "8px",
//                 borderBottom: "1px solid #f1f5f9",
//                 paddingBottom: "10px",
//                 marginBottom: "10px",
//               }}
//             >
//               <ShoppingCart size={16} color="#475569" />
//               <span
//                 style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}
//               >
//                 Checkout Queue
//               </span>
//               <span
//                 style={{
//                   marginLeft: "auto",
//                   fontSize: "12px",
//                   backgroundColor: "#f1f5f9",
//                   padding: "2px 8px",
//                   borderRadius: "20px",
//                   fontWeight: 600,
//                   color: "#475569",
//                 }}
//               >
//                 {cart.reduce((s, i) => s + i.quantityStrips, 0)} items
//               </span>
//             </div>

//             {/* Cart Items Loop */}
//             <div
//               style={{
//                 flex: 1,
//                 overflowY: "auto",
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "12px",
//                 maxHeight: "300px",
//               }}
//             >
//               {cart.map(item => (
//                 <div
//                   key={item.id}
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     fontSize: "13px",
//                     borderBottom: "1px solid #f8fafc",
//                     paddingBottom: "8px",
//                   }}
//                 >
//                   <div style={{ flex: 1, marginRight: "10px" }}>
//                     <div style={{ fontWeight: 600, color: "#334155" }}>
//                       {item.name}
//                     </div>
//                     <div style={{ fontSize: "11px", color: "#94a3b8" }}>
//                       ₹{item.pricePerStrip.toFixed(2)} / strip
//                     </div>
//                   </div>

//                   {/* Quantity Actions */}
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: "6px",
//                       marginRight: "12px",
//                     }}
//                   >
//                     <button
//                       onClick={() => updateQuantity(item.id, -1)}
//                       style={{
//                         width: "22px",
//                         height: "22px",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         border: "1px solid #cbd5e1",
//                         borderRadius: "4px",
//                         backgroundColor: "#fff",
//                         cursor: "pointer",
//                       }}
//                     >
//                       <Minus size={10} />
//                     </button>
//                     <span
//                       style={{
//                         width: "20px",
//                         textAlign: "center",
//                         fontWeight: 600,
//                       }}
//                     >
//                       {item.quantityStrips}
//                     </span>
//                     <button
//                       onClick={() => updateQuantity(item.id, 1)}
//                       style={{
//                         width: "22px",
//                         height: "22px",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         border: "1px solid #cbd5e1",
//                         borderRadius: "4px",
//                         backgroundColor: "#fff",
//                         cursor: "pointer",
//                       }}
//                     >
//                       <Plus size={10} />
//                     </button>
//                   </div>

//                   <div style={{ textAlign: "right", minWidth: "70px" }}>
//                     <div style={{ fontWeight: 700, color: "#0f172a" }}>
//                       ₹{(item.pricePerStrip * item.quantityStrips).toFixed(2)}
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(item.id)}
//                       style={{
//                         background: "none",
//                         border: "none",
//                         padding: 0,
//                         color: "#94a3b8",
//                         cursor: "pointer",
//                         marginTop: "2px",
//                       }}
//                       onMouseEnter={e =>
//                         (e.currentTarget.style.color = "#ef4444")
//                       }
//                       onMouseLeave={e =>
//                         (e.currentTarget.style.color = "#94a3b8")
//                       }
//                     >
//                       <Trash2 size={12} />
//                     </button>
//                   </div>
//                 </div>
//               ))}

//               {cart.length === 0 && (
//                 <div
//                   style={{
//                     flex: 1,
//                     display: "flex",
//                     flexDirection: "column",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     gap: "8px",
//                     color: "#94a3b8",
//                     paddingTop: "40px",
//                   }}
//                 >
//                   <ShoppingCart size={24} style={{ opacity: 0.5 }} />
//                   <span style={{ fontSize: "12.5px" }}>
//                     The billing basket is empty
//                   </span>
//                 </div>
//               )}
//             </div>

//             {/* Financial Accounting Aggregation Blocks */}
//             <div
//               style={{
//                 borderTop: "1px solid #f1f5f9",
//                 paddingTop: "12px",
//                 marginTop: "12px",
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "6px",
//                 fontSize: "13px",
//               }}
//             >
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   color: "#64748b",
//                 }}
//               >
//                 <span>Subtotal Basket</span>
//                 <span>₹{subtotal.toFixed(2)}</span>
//               </div>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   color: "#64748b",
//                 }}
//               >
//                 <span>Calculated CGST/SGST Pool</span>
//                 <span>₹{totalTax.toFixed(2)}</span>
//               </div>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   fontSize: "16px",
//                   fontWeight: 700,
//                   color: "#0f172a",
//                   borderTop: "1px dashed #e2e8f0",
//                   paddingTop: "8px",
//                   marginTop: "4px",
//                 }}
//               >
//                 <span>Grand Aggregate Total</span>
//                 <span style={{ color: "#059669" }}>
//                   ₹{grandTotal.toFixed(2)}
//                 </span>
//               </div>
//             </div>

//             {/* Payment Method Selector Block */}
//             <div
//               style={{
//                 marginTop: "14px",
//                 display: "grid",
//                 gridTemplateColumns: "repeat(3, 1fr)",
//                 gap: "6px",
//               }}
//             >
//               {["UPI", "Cash", "Card"].map(method => (
//                 <button
//                   key={method}
//                   onClick={() => setPaymentMethod(method)}
//                   style={{
//                     padding: "8px 0",
//                     borderRadius: "6px",
//                     border: "1px solid",
//                     borderColor:
//                       paymentMethod === method ? "#059669" : "#e2e8f0",
//                     backgroundColor:
//                       paymentMethod === method ? "#f0fdf4" : "#ffffff",
//                     color: paymentMethod === method ? "#059669" : "#475569",
//                     fontSize: "12px",
//                     fontWeight: 600,
//                     cursor: "pointer",
//                     transition: "all 0.1s",
//                   }}
//                 >
//                   {method}
//                 </button>
//               ))}
//             </div>

//             {/* Final Settlement Settle Drawer CTA Trigger */}
//             <button
//               onClick={handleSettleBill}
//               disabled={cart.length === 0 || isBillSettled}
//               style={{
//                 marginTop: "12px",
//                 width: "100%",
//                 padding: "12px",
//                 borderRadius: "8px",
//                 backgroundColor: isBillSettled
//                   ? "#16a34a"
//                   : cart.length === 0
//                     ? "#cbd5e1"
//                     : "#059669",
//                 color: "#ffffff",
//                 fontSize: "14px",
//                 fontWeight: 700,
//                 border: "none",
//                 cursor:
//                   cart.length === 0 || isBillSettled
//                     ? "not-allowed"
//                     : "pointer",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 gap: "8px",
//                 transition: "background-color 0.15s",
//               }}
//             >
//               {isBillSettled ? (
//                 <>
//                   <CheckCircle size={16} /> Bill Settled & Printed!
//                 </>
//               ) : (
//                 <>
//                   <CreditCard size={16} /> Close Book & Settle [F8]
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
