import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Components/Navbar";

const formatCard = (v) =>
  v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

const formatExpiry = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
};

export default function Checkout({ cartItems, onRemove, cartCount, userProfile, directCheckoutItem, onClearDirectCheckout }) {
  const navigate = useNavigate();
  const isDirectCheckout = !!directCheckoutItem;
  const checkedItems = cartItems.filter((i) => i.checked);
  const items = isDirectCheckout
    ? [directCheckoutItem]
    : checkedItems;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = subtotal > 0 ? 150 : 0;
  const total = subtotal + shipping;

  // Pre-fill from profile
  const nameParts = (userProfile?.name || "").split(" ");
  const [form, setForm] = useState({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || "",
    address: "",
    city: "",
    province: "",
    zip: "",
    paymentMethod: "cod",
    // Card fields
    cardName: userProfile?.name || "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    // GCash fields
    gcashName: userProfile?.name || "",
    gcashNumber: userProfile?.phone || "",
    // Bank transfer fields
    bankName: "",
    bankAccountName: userProfile?.name || "",
    bankAccountNumber: "",
  });
  const [placed, setPlaced] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (onClearDirectCheckout) onClearDirectCheckout();
    setPlaced(true);
  };

  if (items.length === 0) {
    return (
      <div className="soucul-app checkout-page">
        <Navbar cartCount={cartCount} />
        <div className="checkout-empty">
          <h2>No items to checkout</h2>
          <p>Add some products to your cart first.</p>
          <button className="checkout-back-btn" onClick={() => navigate("/Products")}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="soucul-app checkout-page">
        <Navbar cartCount={0} />
        <div className="checkout-success">
          <div className="checkout-success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for supporting Filipino artisans. Your order is being prepared.</p>
          <div className="checkout-success-details">
            <span>Order Total: <strong>₱{total.toLocaleString()}</strong></span>
            <span>{items.length} {items.length === 1 ? "item" : "items"}</span>
          </div>
          <button className="checkout-back-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="soucul-app checkout-page">
      <Navbar cartCount={cartCount} />

      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-grid">
          {/* Left — Form */}
          <form className="checkout-form" onSubmit={handlePlaceOrder}>
            {/* Shipping */}
            <div className="checkout-section">
              <h2 className="checkout-section-title">Shipping Information</h2>
              <div className="checkout-form-row">
                <label className="checkout-field">
                  <span>First Name</span>
                  <input type="text" value={form.firstName} onChange={update("firstName")} required />
                </label>
                <label className="checkout-field">
                  <span>Last Name</span>
                  <input type="text" value={form.lastName} onChange={update("lastName")} required />
                </label>
              </div>
              <div className="checkout-form-row">
                <label className="checkout-field">
                  <span>Email</span>
                  <input type="email" value={form.email} onChange={update("email")} required />
                </label>
                <label className="checkout-field">
                  <span>Phone</span>
                  <input type="tel" value={form.phone} onChange={update("phone")} required />
                </label>
              </div>
              <label className="checkout-field checkout-field-full">
                <span>Address</span>
                <input type="text" value={form.address} onChange={update("address")} required />
              </label>
              <div className="checkout-form-row">
                <label className="checkout-field">
                  <span>City</span>
                  <input type="text" value={form.city} onChange={update("city")} required />
                </label>
                <label className="checkout-field">
                  <span>Province</span>
                  <input type="text" value={form.province} onChange={update("province")} required />
                </label>
                <label className="checkout-field">
                  <span>ZIP Code</span>
                  <input type="text" value={form.zip} onChange={update("zip")} required />
                </label>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="checkout-section">
              <h2 className="checkout-section-title">Payment Method</h2>
              <div className="checkout-payment-options">
                {[
                  { value: "cod", label: "Cash on Delivery" },
                  { value: "gcash", label: "GCash" },
                  { value: "card", label: "Credit / Debit Card" },
                  { value: "bank", label: "Bank Transfer" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`checkout-payment-card${form.paymentMethod === opt.value ? " active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.value}
                      checked={form.paymentMethod === opt.value}
                      onChange={update("paymentMethod")}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Details — shown based on selected method */}

            {form.paymentMethod === "cod" && (
              <div className="checkout-section checkout-pay-details">
                <h2 className="checkout-section-title">Cash on Delivery</h2>
                <div className="checkout-pay-info">
                  <div className="checkout-pay-info-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
                  </div>
                  <div>
                    <p>Pay with cash when your order is delivered to your doorstep.</p>
                    <ul>
                      <li>Please prepare the exact amount: <strong>₱{total.toLocaleString()}</strong></li>
                      <li>Our rider will provide an official receipt upon payment.</li>
                      <li>Available for orders up to ₱10,000.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {form.paymentMethod === "gcash" && (
              <div className="checkout-section checkout-pay-details">
                <h2 className="checkout-section-title">GCash Payment</h2>
                <div className="checkout-form-row">
                  <label className="checkout-field">
                    <span>GCash Account Name</span>
                    <input type="text" value={form.gcashName} onChange={update("gcashName")} required />
                  </label>
                  <label className="checkout-field">
                    <span>GCash Number</span>
                    <input type="tel" placeholder="09XX XXX XXXX" value={form.gcashNumber} onChange={update("gcashNumber")} required />
                  </label>
                </div>
                <div className="checkout-pay-info">
                  <div className="checkout-pay-info-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
                  </div>
                  <div>
                    <p>You will receive a GCash payment request after placing your order.</p>
                    <ul>
                      <li>Amount to pay: <strong>₱{total.toLocaleString()}</strong></li>
                      <li>Open your GCash app and approve the payment request.</li>
                      <li>Your order will be confirmed once payment is received.</li>
                      <li>GCash transaction fee: <strong>Free</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {form.paymentMethod === "card" && (
              <div className="checkout-section checkout-pay-details">
                <h2 className="checkout-section-title">Card Details</h2>
                <label className="checkout-field checkout-field-full">
                  <span>Cardholder Name</span>
                  <input type="text" placeholder="As printed on card" value={form.cardName} onChange={update("cardName")} required />
                </label>
                <label className="checkout-field checkout-field-full">
                  <span>Card Number</span>
                  <input type="text" placeholder="1234 5678 9012 3456" value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: formatCard(e.target.value) })} required />
                </label>
                <div className="checkout-form-row">
                  <label className="checkout-field">
                    <span>Expiry Date</span>
                    <input type="text" placeholder="MM/YY" value={form.cardExpiry} onChange={(e) => setForm({ ...form, cardExpiry: formatExpiry(e.target.value) })} required />
                  </label>
                  <label className="checkout-field">
                    <span>CVV</span>
                    <input type="password" placeholder="123" maxLength={4} value={form.cardCvv} onChange={update("cardCvv")} required />
                  </label>
                </div>
                <div className="checkout-pay-info">
                  <div className="checkout-pay-info-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </div>
                  <div>
                    <p>Your payment is secured with 256-bit SSL encryption.</p>
                    <ul>
                      <li>We accept Visa, Mastercard, and JCB.</li>
                      <li>Amount to charge: <strong>₱{total.toLocaleString()}</strong></li>
                      <li>Your card will be charged immediately upon order confirmation.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {form.paymentMethod === "bank" && (
              <div className="checkout-section checkout-pay-details">
                <h2 className="checkout-section-title">Bank Transfer Details</h2>
                <div className="checkout-form-row">
                  <label className="checkout-field">
                    <span>Bank Name</span>
                    <select value={form.bankName} onChange={update("bankName")} required className="checkout-select">
                      <option value="" disabled>Select your bank</option>
                      <option value="BDO">BDO Unibank</option>
                      <option value="BPI">Bank of the Philippine Islands (BPI)</option>
                      <option value="Metrobank">Metrobank</option>
                      <option value="Landbank">Land Bank of the Philippines</option>
                      <option value="UnionBank">UnionBank</option>
                      <option value="PNB">Philippine National Bank (PNB)</option>
                      <option value="RCBC">RCBC</option>
                      <option value="ChinaBank">China Banking Corporation</option>
                    </select>
                  </label>
                </div>
                <div className="checkout-form-row">
                  <label className="checkout-field">
                    <span>Account Holder Name</span>
                    <input type="text" value={form.bankAccountName} onChange={update("bankAccountName")} required />
                  </label>
                  <label className="checkout-field">
                    <span>Account Number</span>
                    <input type="text" placeholder="Enter your account number" value={form.bankAccountNumber} onChange={update("bankAccountNumber")} required />
                  </label>
                </div>
                <div className="checkout-pay-info">
                  <div className="checkout-pay-info-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" /></svg>
                  </div>
                  <div>
                    <p>Transfer the total amount to our bank account after placing your order.</p>
                    <ul>
                      <li>Amount to transfer: <strong>₱{total.toLocaleString()}</strong></li>
                      <li>SoulCul Account: <strong>BDO 0012-3456-7890</strong></li>
                      <li>Account Name: <strong>SoulCul Trading Inc.</strong></li>
                      <li>Please upload your proof of transfer within 24 hours.</li>
                      <li>Your order will be processed once payment is verified.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="checkout-place-btn">
              Place Order — ₱{total.toLocaleString()}
            </button>
          </form>

          {/* Right — Order Summary */}
          <div className="checkout-summary">
            <h2 className="checkout-section-title">Order Summary</h2>
            <div className="checkout-items">
              {items.map((item) => (
                <div key={item.cartId} className="checkout-item">
                  <div className="checkout-item-img">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="checkout-item-info">
                    <div className="checkout-item-name">{item.name}</div>
                    <div className="checkout-item-loc">{item.location}</div>
                    <div className="checkout-item-qty">Qty: {item.qty}</div>
                  </div>
                  <div className="checkout-item-price">
                    ₱{(item.price * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="checkout-totals">
              <div className="checkout-totals-row">
                <span>Subtotal</span>
                <span>₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="checkout-totals-row">
                <span>Shipping</span>
                <span>₱{shipping.toLocaleString()}</span>
              </div>
              <div className="checkout-totals-row checkout-totals-final">
                <span>Total</span>
                <span>₱{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
