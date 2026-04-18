/*
Estrecho, Adrian M.
Mansilla, Rhangel R.
Romualdo, Jervin Paul C.
Sostea, Joana Marie A.
Torres, Ceazarion Sean Nicholas M.
Tupaen, Arianne Kaye E.

BSIT/IT22S1
*/

import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Components/Navbar";
import profileOrderFallbackImage from "./assets/no-image.jpg";

import { getLocalWishlist, removeFromLocalWishlist } from "./utils/localWishlist";

// Get API instance
const customerAPI = window.customerAPI || {};

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const icons = {
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"],
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  location: ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", "M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6"],
  card: ["M1 4h22v16H1z", "M1 10h22"],
  bell: ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"],
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  edit: ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  chevron: "M9 18l6-6-6-6",
  camera: ["M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z", "M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8"],
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  package: ["M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", "M3.27 6.96 12 12.01l8.73-5.05", "M12 22.08V12"],
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.62a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  mail: ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"],
  cake: ["M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8", "M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1", "M2 21h20", "M7 8v3", "M12 8v3", "M17 8v3", "M7 4a1 1 0 0 1 1-1h.01", "M12 4a1 1 0 0 1 1-1h.01", "M17 4a1 1 0 0 1 1-1h.01"],
  gender: ["M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z", "M12 12v10", "M9 19h6"],
  eye: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6"],
  eyeOff: ["M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24", "M1 1l22 22"],
  x: "M18 6L6 18M6 6l12 12",
  plus: ["M12 5v14", "M5 12h14"],
  check: "M20 6L9 17l-5-5",
  smartphone: ["M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z", "M12 18h.01"],
  trash: ["M3 6h18", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6", "M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"],
  lock: ["M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z", "M7 11V7a5 5 0 0 1 10 0v4"],
  activity: ["M22 12h-4l-3 9L9 3l-3 9H2"],
  link: ["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"],
};

const statusColor = {
  cash_on_delivery_requested: { bg: "#fef3c7", color: "#92400e" },
  online_payment_requested: { bg: "#dbeafe", color: "#1e40af" },
  cash_on_delivery_approved: { bg: "#fef3c7", color: "#92400e" },
  online_payment_processed: { bg: "#dbeafe", color: "#1e40af" },
  waiting_for_courier: { bg: "#e0f2fe", color: "#0c4a6e" },
  to_be_delivered: { bg: "#ede9fe", color: "#5b21b6" },
  delivered: { bg: "#d1fae5", color: "#065f46" },
  shipped: { bg: "#dbeafe", color: "#1e40af" },
  processing: { bg: "#fef3c7", color: "#92400e" },
  confirmed: { bg: "#dbeafe", color: "#1e40af" },
  pending: { bg: "#fef3c7", color: "#92400e" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

const ORDER_STATUS_LABELS = {
  online_payment_requested: "Pending Payment",
  online_payment_processed: "Payment Confirmed",
  cash_on_delivery_requested: "COD Requested",
  cash_on_delivery_approved: "COD Confirmed",
  processing: "Processing",
  waiting_for_courier: "Waiting for Courier",
  shipped: "Shipped",
  to_be_delivered: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  pending: "Pending Payment",
  confirmed: "Payment Confirmed",
};

const ORDER_CANCELLATION_REASON_OPTIONS = [
  { value: "changed_mind", label: "Changed my mind" },
  { value: "ordered_by_mistake", label: "Ordered by mistake" },
  { value: "found_better_price", label: "Found a better price elsewhere" },
  { value: "delivery_takes_too_long", label: "Delivery takes too long" },
  { value: "payment_issue", label: "Payment issue" },
  { value: "other", label: "Other" },
];

const ORDER_CANCELLATION_REASON_LABELS = ORDER_CANCELLATION_REASON_OPTIONS.reduce((map, option) => {
  map[option.value] = option.label;
  return map;
}, {});

const normalizeOrderStatus = (value) => String(value || "").toLowerCase().trim();

const canCancelOrderStatus = (value) => {
  const normalized = normalizeOrderStatus(value);
  return !["waiting_for_courier", "shipped", "to_be_delivered", "delivered", "cancelled"].includes(normalized);
};

const normalizeCancellationReasonValue = (value) => String(value || "").toLowerCase().trim().replace(/[\s-]+/g, "_");

const formatOrderStatusLabel = (value) => {
  const normalized = normalizeOrderStatus(value);
  return ORDER_STATUS_LABELS[normalized] || formatStatus(normalized || "pending");
};

const EMPTY_STATE_STYLE = { fontSize: 13, color: "#888", padding: "8px 0" };
const DEFAULT_NOTIFICATION_SETTINGS = { orders: true, promos: true, wishlist: false, newsletter: false, sms: true };

const safeDateLabel = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
};

const safeDateTimeLabel = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const safeText = (value, fallback = "Not set") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const parseCancellationDetailsFromNotes = (customerNotes) => {
  const notes = String(customerNotes || "");
  if (!notes.trim()) return { reason: "", remark: "" };

  const lines = notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    const match = line.match(/^Cancellation reason:\s*(.+?)(?:\s*\|\s*Remark:\s*(.+))?$/i);
    if (!match) continue;

    return {
      reason: String(match[1] || "").trim(),
      remark: String(match[2] || "").trim(),
    };
  }

  return { reason: "", remark: "" };
};

const getOrderCancellationDetails = (orderDetail) => {
  if (!orderDetail || typeof orderDetail !== "object") {
    return { reason: "", remark: "" };
  }

  const rawReason = String(orderDetail.cancellation_reason_label || orderDetail.cancellation_reason || "").trim();
  const normalizedReasonKey = String(orderDetail.cancellation_reason || "").trim();
  const reason = ORDER_CANCELLATION_REASON_LABELS[normalizedReasonKey] || rawReason;
  const remark = String(orderDetail.cancellation_remark || "").trim();

  if (reason || remark) {
    return { reason, remark };
  }

  return parseCancellationDetailsFromNotes(orderDetail.customer_notes);
};

const resolveProfileImageUrl = (rawUrl) => {
  const value = String(rawUrl || "").trim();

  if (!value) return profileOrderFallbackImage;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.startsWith("/")) return value;
  return `/${value.replace(/^\/+/, "")}`;
};

const formatStatus = (value) => {
  const raw = String(value || "pending").toLowerCase();
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatPaymentMethodLabel = (value) => {
  const raw = String(value || "").toLowerCase();
  if (!raw) return "Not specified";

  const methodMap = {
    gcash: "GCash",
    credit_card: "Card",
    debit_card: "Card",
    card: "Card",
    bank_transfer: "Bank Transfer",
    bank: "Bank Transfer",
    paypal: "PayPal",
    cod: "Cash On Delivery",
    online: "Online Payment",
  };

  return methodMap[raw] || formatStatus(raw);
};

const getPaymentStatusLabel = ({ paymentMethod, paymentStatus, orderStatus }) => {
  const normalizedMethod = String(paymentMethod || "").toLowerCase();
  const normalizedPaymentStatus = String(paymentStatus || "").toLowerCase();
  const normalizedOrderStatus = String(orderStatus || "").toLowerCase();

  if (normalizedMethod === "cod" || normalizedOrderStatus.includes("cash_on_delivery")) {
    return "To be paid";
  }

  if (normalizedPaymentStatus === "failed" || normalizedPaymentStatus === "refunded") {
    return formatStatus(normalizedPaymentStatus);
  }

  if (normalizedMethod || normalizedOrderStatus.includes("online_payment")) {
    return "Paid";
  }

  return normalizedPaymentStatus ? formatStatus(normalizedPaymentStatus) : "Not specified";
};

const formatPeso = (value) => `₱${Number(value || 0).toLocaleString()}`;

// ── Modal Overlay ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button type="button" className="modal-close" onClick={onClose}><Icon d={icons.x} size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── Change Photo Modal ─────────────────────────────────────────────────────
function ChangePhotoModal({ currentPhoto, initials, onSave, onClose }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(currentPhoto);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setSaveError("");
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaveError("");
    setIsSaving(true);

    try {
      if (!preview && currentPhoto) {
        await onSave({ remove: true, file: null });
      } else if (selectedFile) {
        await onSave({ remove: false, file: selectedFile });
      }
      onClose();
    } catch (error) {
      setSaveError(error?.message || "Failed to update profile photo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <Modal title="Change Profile Photo" onClose={onClose}>
      <div className="photo-modal-content">
        <div
          className={`photo-drop-zone${dragging ? " dragging" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="photo-preview-img" />
          ) : (
            <div className="photo-placeholder">{initials}</div>
          )}
          <div className="photo-drop-overlay">
            <Icon d={icons.camera} size={24} />
            <span>Click or drag to upload</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>
        <p className="photo-hint">Supports JPG, PNG, WEBP · Max 5MB</p>
        {preview && (
          <button className="photo-remove-btn" onClick={() => { setPreview(null); setSelectedFile(null); }}>Remove photo</button>
        )}
      </div>
      {saveError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{saveError}</div>}
      <div className="modal-actions" style={{ marginTop: 16 }}>
        <button className="btn-cancel" onClick={onClose} disabled={isSaving}>Cancel</button>
        <button className="btn-save" onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Photo"}</button>
      </div>
    </Modal>
  );
}

// ── Add Payment Modal ─────────────────────────────────────────────────────
const PAYMENT_TYPES = [
  { value: "visa", label: "Visa / Mastercard", icon: "💳" },
  { value: "gcash", label: "GCash", icon: "📱" },
  { value: "maya", label: "Maya", icon: "🏦" },
  { value: "paypal", label: "PayPal", icon: "🅿️" },
];

function AddPaymentModal({ onSave, onClose }) {
  const [type, setType] = useState("visa");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const isCard = type === "visa";
  const isPhone = type === "gcash" || type === "maya";
  const isEmail = type === "paypal";

  const formatCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const handleSubmit = async () => {
    const selected = PAYMENT_TYPES.find(t => t.value === type);
    let meta = "";
    if (isCard) meta = `ending in ${cardNum.replace(/\s/g, "").slice(-4)} · Exp ${expiry}`;
    if (isPhone) meta = phone;
    if (isEmail) meta = email;

    if (!meta.trim()) {
      setError("Please complete payment details.");
      return;
    }

    setError("");
    await onSave({
      type,
      label: selected.label,
      details_masked: meta.trim(),
      is_default: false,
    });
    onClose();
  };

  return (
    <Modal title="Add Payment Method" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Payment Type</label>
          <div className="payment-type-grid">
            {PAYMENT_TYPES.map(t => (
              <div
                key={t.value}
                className={`payment-type-btn${type === t.value ? " selected" : ""}`}
                onClick={() => setType(t.value)}
              >
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 500, marginTop: 4, textAlign: "center" }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {isCard && (
          <>
            <div className="form-group">
              <label className="form-label">Card Number</label>
              <input className="form-input" placeholder="1234 5678 9012 3456" value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input className="form-input" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} style={{ maxWidth: 140 }} />
            </div>
          </>
        )}

        {isPhone && (
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input className="form-input" placeholder="+63 9XX XXX XXXX" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        )}

        {isEmail && (
          <div className="form-group">
            <label className="form-label">PayPal Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        )}

        {error && <div className="auth-msg auth-msg-error">{error}</div>}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit}>Add Method</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Change Password Modal ─────────────────────────────────────────────────
function ChangePasswordModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.current) e.current = "Required";
    if (form.next.length < 8) e.next = "Must be at least 8 characters";
    if (form.next !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitError("");
    setIsSubmitting(true);
    try {
      await onSubmit({
        current: form.current,
        next: form.next,
        confirm: form.confirm,
      });
      setSuccess(true);
    } catch (error) {
      setSubmitError(error?.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = (() => {
    const p = form.next;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"][strength];

  return (
    <Modal title="Change Password" onClose={onClose}>
      {success ? (
        <div className="success-state">
          <div className="success-icon">✅</div>
          <div className="success-title">Password Updated!</div>
          <div className="success-sub">Your password has been changed successfully.</div>
          <button className="btn-save" style={{ marginTop: 20, width: "100%" }} onClick={onClose}>Done</button>
        </div>
      ) : (
        <>
          {["current", "next", "confirm"].map((field) => (
            <div className="form-group" style={{ marginBottom: 14 }} key={field}>
              <label className="form-label">
                {field === "current" ? "Current Password" : field === "next" ? "New Password" : "Confirm New Password"}
              </label>
              <div className="pw-input-wrap">
                <input
                  className={`form-input pw-input${errors[field] ? " input-error" : ""}`}
                  type={show[field] ? "text" : "password"}
                  placeholder={field === "current" ? "Enter current password" : field === "next" ? "Min. 8 characters" : "Re-enter new password"}
                  value={form[field]}
                  onChange={e => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(er => ({ ...er, [field]: "" })); }}
                />
                <button className="pw-eye" onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}>
                  <Icon d={show[field] ? icons.eyeOff : icons.eye} size={16} />
                </button>
              </div>
              {errors[field] && <div className="input-error-msg">{errors[field]}</div>}
              {field === "next" && form.next && (
                <div className="strength-bar-wrap">
                  <div className="strength-bar">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="strength-segment" style={{ background: n <= strength ? strengthColor : "#cfe4f2" }} />
                    ))}
                  </div>
                  <span className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
            </div>
          ))}
          <div className="pw-tips">
            <div className={`pw-tip${form.next.length >= 8 ? " met" : ""}`}>✓ At least 8 characters</div>
            <div className={`pw-tip${/[A-Z]/.test(form.next) ? " met" : ""}`}>✓ One uppercase letter</div>
            <div className={`pw-tip${/[0-9]/.test(form.next) ? " met" : ""}`}>✓ One number</div>
            <div className={`pw-tip${/[^A-Za-z0-9]/.test(form.next) ? " met" : ""}`}>✓ One special character</div>
          </div>
          {submitError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{submitError}</div>}
          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-save" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Update Password"}</button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ── Profile Details Section ────────────────────────────────────────────────
function ProfileDetailsSection({ user, photo, stats, onEdit, onChangePhoto }) {
  const initials = (user.name || "?").split(" ").filter(Boolean).map(n => n[0]).join("") || "?";
  const memberSince = safeDateLabel(user.createdAt);
  const details = [
    { label: "Full Name", value: safeText(user.name), emoji: "👤" },
    { label: "Email Address", value: safeText(user.email), emoji: "✉️" },
    { label: "Phone Number", value: safeText(user.phone), emoji: "📞" },
    { label: "Birthday", value: safeDateLabel(user.birthday), emoji: "🎂" },
    { label: "Gender", value: safeText(user.gender), emoji: "🧬" },
  ];

  return (
    <div className="section-content">
      <div className="pd-header">
        <h3 className="section-title" style={{ marginBottom: 0 }}>Profile Details</h3>
        <button className="edit-btn" onClick={onEdit}><Icon d={icons.edit} size={14} />Edit Profile</button>
      </div>
      <div className="pd-avatar-block">
        <div className="pd-avatar" onClick={onChangePhoto}>
          {photo ? <img src={photo} alt="avatar" className="pd-avatar-img" /> : initials}
          <div className="avatar-cam" style={{ zIndex: 1 }}><Icon d={icons.camera} size={12} /></div>
        </div>
        <div>
          <div className="pd-avatar-name">{safeText(user.name, "Customer")}</div>
          <div className="pd-avatar-sub">Member since {memberSince}</div>
          <button className="change-photo-link" onClick={onChangePhoto}>Change photo</button>
        </div>
      </div>
      <div className="pd-details-grid">
        {details.map(({ label, value, emoji }) => ( 
          <div key={label} className="pd-detail-card">
            <div className="pd-detail-emoji">{emoji}</div>
            <div className="pd-detail-body">
              <div className="pd-detail-label">{label}</div>
              <div className="pd-detail-value">{value}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="pd-account-strip">
        <div className="pd-strip-item"><div className="pd-strip-num">{stats.totalOrders}</div><div className="pd-strip-label">Total Orders</div></div>
        <div className="pd-strip-divider" />
        <div className="pd-strip-item"><div className="pd-strip-num">{stats.wishlistItems}</div><div className="pd-strip-label">Wishlist Items</div></div>
        <div className="pd-strip-divider" />
        <div className="pd-strip-item"><div className="pd-strip-num">{stats.reviewsGiven}</div><div className="pd-strip-label">Reviews Given</div></div>
        <div className="pd-strip-divider" />
        <div className="pd-strip-item"><div className="pd-strip-num">{formatPeso(stats.totalSpent)}</div><div className="pd-strip-label">Total Spent</div></div>
      </div>
    </div>
  );
}

// ── Other Sections ─────────────────────────────────────────────────────────
function OrdersSection() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetailsById, setOrderDetailsById] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [detailErrorsById, setDetailErrorsById] = useState({});
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [cancelErrorsById, setCancelErrorsById] = useState({});
  const [orderActionToast, setOrderActionToast] = useState("");
  const [cancelModal, setCancelModal] = useState({
    open: false,
    orderId: null,
    orderLabel: "",
    reason: ORDER_CANCELLATION_REASON_OPTIONS[0]?.value || "",
    remark: "",
  });
  const [cancelModalError, setCancelModalError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        if (!customerAPI || typeof customerAPI.getOrders !== "function") {
          throw new Error("Orders API is unavailable.");
        }

        const result = await customerAPI.getOrders();
        if (!mounted) return;
        setOrders(Array.isArray(result?.data) ? result.data : []);
      } catch (error) {
        if (!mounted) return;
        setLoadError(error?.message || "Failed to load orders.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadOrders();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!orderActionToast) return undefined;

    const timer = setTimeout(() => {
      setOrderActionToast("");
    }, 2600);

    return () => clearTimeout(timer);
  }, [orderActionToast]);

  const loadOrderDetails = async (orderId) => {
    setDetailLoadingId(orderId);
    setDetailErrorsById((prev) => ({ ...prev, [orderId]: "" }));

    try {
      if (!customerAPI || typeof customerAPI.getOrder !== "function") {
        throw new Error("Order details API is unavailable.");
      }

      const result = await customerAPI.getOrder(orderId);
      setOrderDetailsById((prev) => ({
        ...prev,
        [orderId]: result?.data && typeof result.data === "object" ? result.data : {},
      }));
    } catch (error) {
      setDetailErrorsById((prev) => ({
        ...prev,
        [orderId]: error?.message || "Failed to load order details.",
      }));
    } finally {
      setDetailLoadingId((prev) => (prev === orderId ? null : prev));
    }
  };

  const toggleOrderDetails = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orderId);

    if (!orderDetailsById[orderId]) {
      await loadOrderDetails(orderId);
    }
  };

  const openCancelOrderModal = (orderId, rawStatus) => {
    const status = normalizeOrderStatus(rawStatus);
    if (!canCancelOrderStatus(status)) {
      setCancelErrorsById((prev) => ({
        ...prev,
        [orderId]: "This order can no longer be cancelled.",
      }));
      return;
    }

    const currentOrder = orders.find((order) => Number(order.id) === Number(orderId));
    const orderLabel = currentOrder?.order_number ? String(currentOrder.order_number) : `#${orderId}`;

    setCancelErrorsById((prev) => ({ ...prev, [orderId]: "" }));
    setCancelModalError("");
    setCancelModal({
      open: true,
      orderId,
      orderLabel,
      reason: ORDER_CANCELLATION_REASON_OPTIONS[0]?.value || "",
      remark: "",
    });
  };

  const closeCancelOrderModal = () => {
    if (cancelingOrderId !== null) return;

    setCancelModal((prev) => ({
      ...prev,
      open: false,
    }));
    setCancelModalError("");
  };

  const submitCancelOrder = async () => {
    const orderId = cancelModal.orderId;
    if (!orderId) {
      setCancelModalError("Order is invalid. Please try again.");
      return;
    }

    const selectedReason = normalizeCancellationReasonValue(cancelModal.reason);
    if (!ORDER_CANCELLATION_REASON_LABELS[selectedReason]) {
      setCancelModalError("Please select a cancellation reason.");
      return;
    }

    setCancelingOrderId(orderId);
    setCancelErrorsById((prev) => ({ ...prev, [orderId]: "" }));
    setCancelModalError("");

    try {
      if (!customerAPI || typeof customerAPI.updateOrderStatus !== "function") {
        throw new Error("Order status API is unavailable.");
      }

      const orderLabel = cancelModal.orderLabel || `#${orderId}`;

      const result = await customerAPI.updateOrderStatus(orderId, "cancelled", {
        cancellation_reason: selectedReason,
        reason: selectedReason,
        cancellation_remark: String(cancelModal.remark || "").trim(),
      });
      const nextStatus = normalizeOrderStatus(result?.data?.status || "cancelled");
      const reasonLabel = ORDER_CANCELLATION_REASON_LABELS[selectedReason] || "Selected reason";
      const remarkValue = String(cancelModal.remark || "").trim();

      setOrders((prev) => prev.map((order) => (
        Number(order.id) === Number(orderId)
          ? { ...order, status: nextStatus }
          : order
      )));

      setOrderDetailsById((prev) => {
        const detail = prev[orderId];
        if (!detail || typeof detail !== "object") return prev;

        const existingNotes = String(detail.customer_notes || "").trim();
        const cancellationLine = `Cancellation reason: ${reasonLabel}${remarkValue ? ` | Remark: ${remarkValue}` : ""}`;
        const customerNotes = existingNotes ? `${existingNotes}\n${cancellationLine}` : cancellationLine;

        return {
          ...prev,
          [orderId]: {
            ...detail,
            status: nextStatus,
            cancellation_reason_label: reasonLabel,
            cancellation_remark: remarkValue,
            customer_notes: customerNotes,
          },
        };
      });

      setOrderActionToast(`Order ${orderLabel} was cancelled successfully (${reasonLabel}).`);
      setCancelModal((prev) => ({
        ...prev,
        open: false,
      }));
    } catch (error) {
      setCancelModalError(error?.message || "Failed to cancel order.");
      setCancelErrorsById((prev) => ({
        ...prev,
        [orderId]: error?.message || "Failed to cancel order.",
      }));
    } finally {
      setCancelingOrderId((prev) => (prev === orderId ? null : prev));
    }
  };

  return (
    <div className="section-content">
      <h3 className="section-title">My Orders</h3>
      {orderActionToast && <div className="order-action-toast">{orderActionToast}</div>}
      {isLoading && <div style={EMPTY_STATE_STYLE}>Loading orders...</div>}
      {loadError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{loadError}</div>}
      {!isLoading && !loadError && orders.length === 0 && <div style={EMPTY_STATE_STYLE}>No orders yet.</div>}
      <div className="orders-list">
        {orders.map((o) => {
          const rawStatus = normalizeOrderStatus(o.status || "pending");
          const statusStyle = statusColor[rawStatus] || statusColor.pending;
          const orderLabel = o.order_number ? String(o.order_number) : `#${o.id}`;
          const isExpanded = expandedOrderId === o.id;
          const detail = orderDetailsById[o.id];
          const detailError = detailErrorsById[o.id] || "";
          const detailLoading = detailLoadingId === o.id;
          const canCancel = canCancelOrderStatus(rawStatus);
          const cancelError = cancelErrorsById[o.id] || "";
          const isCanceling = cancelingOrderId === o.id;

          const items = Array.isArray(detail?.items) ? detail.items : [];
          const computedSubtotal = items.reduce(
            (sum, item) => sum + (Number(item?.unit_price || 0) * Number(item?.quantity || 0)),
            0
          );
          const subtotal = Number(detail?.subtotal ?? computedSubtotal ?? 0);
          const shippingCost = Number(detail?.shipping_cost ?? 0);
          const taxAmount = Number(detail?.tax_amount ?? 0);
          const totalAmount = Number(detail?.total_amount ?? o.total_amount ?? (subtotal + shippingCost + taxAmount));

          const paymentMethodRaw = String(detail?.payment?.payment_method || "").toLowerCase();
          const fallbackPaymentMethod = String(o.payment_method || "").toLowerCase();
          const inferredPaymentMethod = rawStatus.includes("cash_on_delivery")
            ? "cod"
            : rawStatus.includes("online_payment")
              ? "online"
              : "";
          const resolvedPaymentMethod = paymentMethodRaw || fallbackPaymentMethod || inferredPaymentMethod;
          const paymentMethodLabel = formatPaymentMethodLabel(
            resolvedPaymentMethod
          );

          const displayStatusLabel = formatOrderStatusLabel(rawStatus);

          const detailStatusRaw = normalizeOrderStatus(detail?.status || rawStatus);
          const cancellationDetails = getOrderCancellationDetails(detail);
          const shouldShowCancellationDetails = detailStatusRaw === "cancelled";

          const paymentStatusRaw = String(detail?.payment?.payment_status || "").toLowerCase();
          const paymentStatusLabel = getPaymentStatusLabel({
            paymentMethod: resolvedPaymentMethod,
            paymentStatus: paymentStatusRaw,
            orderStatus: rawStatus,
          });

          return (
          <div key={o.id} className="order-card">
            <div className="order-top">
              <div className="order-emoji">📦</div>
              <div className="order-info">
                <div className="order-id">{orderLabel}</div>
                <div className="order-meta">Placed on {safeDateLabel(o.created_at)}</div>
              </div>
              <div className="order-right">
                <span className="order-status" style={statusStyle}>{displayStatusLabel}</span>
                <div className="order-total">{formatPeso(o.total_amount)}</div>
              </div>
            </div>

            <div className="order-actions-row">
              <button type="button" className="order-detail-toggle" onClick={() => toggleOrderDetails(o.id)}>
                {isExpanded ? "Hide Details" : "View Details"}
              </button>
              {canCancel && (
                <button
                  type="button"
                  className="order-cancel-btn"
                  onClick={() => openCancelOrderModal(o.id, rawStatus)}
                  disabled={isCanceling}
                >
                  {isCanceling ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
            </div>
            {cancelError && <div className="order-action-feedback">{cancelError}</div>}

            {isExpanded && (
              <div className="order-detail-panel">
                {detailLoading && <div style={EMPTY_STATE_STYLE}>Loading order details...</div>}
                {!detailLoading && detailError && (
                  <div className="auth-msg auth-msg-error" style={{ marginBottom: 10 }}>{detailError}</div>
                )}

                {!detailLoading && !detailError && detail && (
                  <>
                    <div className="order-meta-grid">
                      <div className="order-meta-card">
                        <div className="order-meta-label">Order Number</div>
                        <div className="order-meta-value">{safeText(detail.order_number || orderLabel)}</div>
                      </div>
                      <div className="order-meta-card">
                        <div className="order-meta-label">Order Date</div>
                        <div className="order-meta-value">{safeDateTimeLabel(detail.created_at || o.created_at)}</div>
                      </div>
                      <div className="order-meta-card">
                        <div className="order-meta-label">Order Status</div>
                        <div className="order-meta-value">{formatOrderStatusLabel(detailStatusRaw)}</div>
                      </div>
                      <div className="order-meta-card">
                        <div className="order-meta-label">Payment Method</div>
                        <div className="order-meta-value">{paymentMethodLabel}</div>
                      </div>
                      <div className="order-meta-card">
                        <div className="order-meta-label">Payment Status</div>
                        <div className="order-meta-value">{paymentStatusLabel}</div>
                      </div>
                    </div>

                    <div className="order-shipping-box">
                      <div className="order-meta-label">Shipping Details</div>
                      <div className="order-shipping-text">
                        {safeText(detail.shipping_address, "Address not available")}
                        {detail.shipping_city ? `, ${detail.shipping_city}` : ""}
                        {detail.shipping_province ? `, ${detail.shipping_province}` : ""}
                      </div>
                      <div className="order-shipping-sub">
                        Contact: {safeText(detail.shipping_phone, "Not provided")}
                      </div>
                    </div>

                    {shouldShowCancellationDetails && (
                      <div className="order-cancel-box">
                        <div className="order-meta-label">Cancellation Details</div>
                        <div className="order-cancel-row">
                          <span className="order-cancel-key">Reason</span>
                          <span className="order-cancel-value">{safeText(cancellationDetails.reason, "Not provided")}</span>
                        </div>
                        <div className="order-cancel-row">
                          <span className="order-cancel-key">Remark</span>
                          <span className="order-cancel-value order-cancel-remark">{safeText(cancellationDetails.remark, "No additional remark")}</span>
                        </div>
                      </div>
                    )}

                    <div className="order-items-box">
                      <div className="order-items-title">Order Items</div>
                      {items.length === 0 ? (
                        <div style={EMPTY_STATE_STYLE}>No line items found for this order.</div>
                      ) : (
                        <>
                          <div className="order-items-head">
                            <span>Item</span>
                            <span>Qty</span>
                            <span>Unit Price</span>
                            <span>Line Total</span>
                          </div>
                          {items.map((item) => {
                            const quantity = Number(item?.quantity || 0);
                            const unitPrice = Number(item?.unit_price || 0);
                            const lineTotal = Number(item?.total_price ?? (quantity * unitPrice));
                            const itemImage = resolveProfileImageUrl(item?.product_image_url);

                            return (
                              <div key={item.id || `${item.product_id}-${item.product_name}`} className="order-item-row">
                                <div className="order-item-main">
                                  <img
                                    src={itemImage}
                                    alt={safeText(item.product_name, "Product")}
                                    className="order-item-thumb"
                                    loading="lazy"
                                  />
                                  <span className="order-item-name">{safeText(item.product_name, "Product")}</span>
                                </div>
                                <span>{quantity}</span>
                                <span>{formatPeso(unitPrice)}</span>
                                <span>{formatPeso(lineTotal)}</span>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>

                    <div className="order-total-box">
                      <div className="order-total-row">
                        <span>Subtotal</span>
                        <strong>{formatPeso(subtotal)}</strong>
                      </div>
                      <div className="order-total-row">
                        <span>Shipping</span>
                        <strong>{formatPeso(shippingCost)}</strong>
                      </div>
                      <div className="order-total-row">
                        <span>Tax</span>
                        <strong>{formatPeso(taxAmount)}</strong>
                      </div>
                      <div className="order-total-row grand">
                        <span>Total</span>
                        <strong>{formatPeso(totalAmount)}</strong>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {cancelModal.open && (
        <Modal title={`Cancel ${cancelModal.orderLabel || "Order"}`} onClose={closeCancelOrderModal}>
          <div className="cancel-order-modal-copy">
            Please tell us why you want to cancel this order.
          </div>

          <div className="cancel-reason-list">
            {ORDER_CANCELLATION_REASON_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`cancel-reason-option${cancelModal.reason === option.value ? " selected" : ""}`}
              >
                <input
                  type="radio"
                  name="order-cancel-reason"
                  value={option.value}
                  checked={cancelModal.reason === option.value}
                  onChange={() => setCancelModal((prev) => ({ ...prev, reason: option.value }))}
                  disabled={cancelingOrderId !== null}
                />
                <span className="cancel-reason-title">{option.label}</span>
              </label>
            ))}
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Remark (Optional)</label>
            <textarea
              className="form-input cancel-remark-input"
              placeholder="Add extra details if needed"
              value={cancelModal.remark}
              onChange={(e) => setCancelModal((prev) => ({ ...prev, remark: e.target.value.slice(0, 500) }))}
              disabled={cancelingOrderId !== null}
            />
            <div className="cancel-remark-help">{String(cancelModal.remark || "").length}/500</div>
          </div>

          {cancelModalError && <div className="auth-msg auth-msg-error" style={{ marginTop: 8 }}>{cancelModalError}</div>}

          <div className="modal-actions" style={{ marginTop: 14 }}>
            <button type="button" className="btn-cancel" onClick={closeCancelOrderModal} disabled={cancelingOrderId !== null}>Keep Order</button>
            <button type="button" className="btn-save" onClick={submitCancelOrder} disabled={cancelingOrderId !== null}>
              {cancelingOrderId !== null ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function WishlistSection() {
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const loadWishlist = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        if (!customerAPI || typeof customerAPI.getWishlist !== "function") {
          throw new Error("API unavailable");
        }

        const result = await customerAPI.getWishlist();
        if (!mounted) return;
        const apiList = Array.isArray(result?.data) ? result.data : [];
        setList(apiList.length > 0 ? apiList : getLocalWishlist());
      } catch {
        // Fall back to localStorage
        if (!mounted) return;
        setList(getLocalWishlist());
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadWishlist();
    return () => { mounted = false; };
  }, []);

  const removeItem = async (productId) => {
    const previous = list;
    setList((curr) => curr.filter((x) => Number(x.product_id) !== Number(productId)));
    removeFromLocalWishlist(productId);

    try {
      if (customerAPI && typeof customerAPI.removeFromWishlist === "function") {
        await customerAPI.removeFromWishlist(productId);
      }
    } catch {
      // localStorage already updated
    }
  };

  return (
    <div className="section-content">
      <h3 className="section-title">Wishlist</h3>
      {isLoading && <div style={EMPTY_STATE_STYLE}>Loading wishlist...</div>}
      {loadError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{loadError}</div>}
      {!isLoading && !loadError && list.length === 0 && <div style={EMPTY_STATE_STYLE}>Your wishlist is empty.</div>}
      <div className="wishlist-list">
        {list.map((item) => {
          const imgSrc = item.image || item.featured_image_url || item.product_image_url || "";
          return (
            <div key={item.wishlist_id || item.product_id} className="wish-row">
              {imgSrc ? (
                <div className="wish-row-img"><img src={imgSrc} alt={item.name} /></div>
              ) : (
                <div className="wish-row-img wish-row-img-placeholder">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c0d0da" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                </div>
              )}
              <div className="wish-row-info">
                <div className="wish-row-name">{item.name}</div>
                <div className="wish-row-loc">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  {item.location || "SouCul"}
                </div>
              </div>
              <div className="wish-row-price">{formatPeso(item.price)}</div>
              <button className="wish-row-view" onClick={() => navigate(`/Product/${item.product_id}`)}>
                View
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
              </button>
              <button className="wish-row-remove" onClick={() => removeItem(item.product_id)} title="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Add Address Modal ─────────────────────────────────────────────────────
const ADDRESS_LABEL_OPTIONS = [
  {
    value: "Home",
    icon: ["M3 12 12 4l9 8", "M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"],
  },
  {
    value: "Office",
    icon: ["M3 21h18", "M5 21V7l8-4v18", "M19 21V11l-6-4", "M9 9h.01", "M9 12h.01", "M9 15h.01", "M9 18h.01"],
  },
  {
    value: "Other",
    icon: ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", "M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  },
];

function AddAddressModal({ onSave, onClose }) {
  const [label, setLabel] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const e = {};
    if (!addressLine.trim()) e.addressLine = "Address line is required.";
    if (!city.trim()) e.city = "City is required.";
    if (!province.trim()) e.province = "Province is required.";
    return e;
  };

  const handleSubmit = async () => {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitError("");
    setSubmitting(true);
    try {
      await onSave({
        label,
        address_line: addressLine.trim(),
        city: city.trim(),
        province: province.trim(),
        postal_code: postalCode.trim(),
        is_default: isDefault ? 1 : 0,
      });
      onClose();
    } catch (error) {
      setSubmitError(error?.message || "Failed to save address.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add New Address" onClose={onClose}>
      <p className="addr-modal-intro">
        Save a delivery destination so you can check out faster next time.
      </p>

      <div className="addr-form">
        <div className="form-group">
          <label className="form-label">Label</label>
          <div className="addr-label-grid">
            {ADDRESS_LABEL_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                className={`addr-label-btn${label === opt.value ? " selected" : ""}`}
                onClick={() => setLabel(opt.value)}
              >
                <Icon d={opt.icon} size={24} stroke={1.8} />
                <span className="addr-label-btn-text">{opt.value}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Address Line</label>
          <input
            className="form-input"
            placeholder="House number, street, barangay"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
          />
          {errors.addressLine && <span className="addr-field-error">{errors.addressLine}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">City</label>
          <input
            className="form-input"
            placeholder="e.g. Vigan"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          {errors.city && <span className="addr-field-error">{errors.city}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Province</label>
          <input
            className="form-input"
            placeholder="e.g. Ilocos Sur"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />
          {errors.province && <span className="addr-field-error">{errors.province}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Postal Code <span style={{ color: "#9bb1c2", fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            className="form-input"
            placeholder="2700"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
        </div>

        <div
          className={`addr-default-toggle${isDefault ? " checked" : ""}`}
          onClick={() => setIsDefault(!isDefault)}
        >
          <div className="check-box">
            {isDefault && <Icon d={icons.check} size={14} stroke={3} />}
          </div>
          <div>
            <div className="addr-default-toggle-label">Set as default address</div>
            <div className="addr-default-toggle-sub">Use this address automatically at checkout.</div>
          </div>
        </div>

        {submitError && <div className="auth-msg auth-msg-error">{submitError}</div>}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Address"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AddressSection() {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const loadAddresses = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      if (!customerAPI || typeof customerAPI.getAddresses !== "function") {
        throw new Error("Address API is unavailable.");
      }

      const result = await customerAPI.getAddresses();
      setAddresses(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      setLoadError(error?.message || "Failed to load addresses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleSetDefault = async (id) => {
    try {
      await customerAPI.updateAddress(id, { is_default: true });
      await loadAddresses();
    } catch (error) {
      setLoadError(error?.message || "Failed to update default address.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await customerAPI.deleteAddress(id);
      await loadAddresses();
    } catch (error) {
      setLoadError(error?.message || "Failed to delete address.");
    }
  };

  const handleAddAddress = async (payload) => {
    // Throws on failure so the modal can display the error inline.
    await customerAPI.addAddress(payload);
    await loadAddresses();
  };

  return (
    <div className="section-content">
      <h3 className="section-title">Saved Addresses</h3>
      {isLoading && <div style={EMPTY_STATE_STYLE}>Loading addresses...</div>}
      {loadError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{loadError}</div>}
      {!isLoading && !loadError && addresses.length === 0 && <div style={EMPTY_STATE_STYLE}>No saved addresses yet.</div>}
      <div className="address-list">
        {addresses.map((a) => (
          <div key={a.id} className={`address-card${Number(a.is_default) === 1 ? " address-default" : ""}`}>
            <div className="address-label-row">
              <span className="address-label">{a.label || "Address"}</span>
              {Number(a.is_default) === 1 && <span className="default-badge">Default</span>}
            </div>
            <div className="address-text">
              {a.address_line}, {a.city}, {a.province}{a.postal_code ? ` ${a.postal_code}` : ""}
            </div>
            <div className="address-actions">
              {Number(a.is_default) !== 1 && (
                <button className="addr-btn" onClick={() => handleSetDefault(a.id)}>Set as Default</button>
              )}
              <button className="addr-btn addr-btn-danger" onClick={() => handleDelete(a.id)}>Remove</button>
            </div>
          </div>
        ))}
        <button className="add-address-btn" onClick={() => setShowAddModal(true)}>+ Add New Address</button>
      </div>
      {showAddModal && (
        <AddAddressModal
          onSave={handleAddAddress}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ── Payment Section (Enhanced) ─────────────────────────────────────────────
function PaymentSection() {
  const [methods, setMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const paymentTypeIcon = {
    visa: "💳",
    gcash: "📱",
    maya: "🏦",
    paypal: "🅿️",
  };

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      if (!customerAPI || typeof customerAPI.getPaymentMethods !== "function") {
        throw new Error("Payment API is unavailable.");
      }

      const result = await customerAPI.getPaymentMethods();
      setMethods(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      setLoadError(error?.message || "Failed to load payment methods.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const handleAdd = async (method) => {
    if (!customerAPI || typeof customerAPI.addPaymentMethod !== "function") {
      throw new Error("Payment API is unavailable.");
    }
    await customerAPI.addPaymentMethod(method);
    await loadPaymentMethods();
  };

  const handleSetDefault = async (id) => {
    try {
      await customerAPI.updatePaymentMethod(id, { is_default: true });
      await loadPaymentMethods();
    } catch (error) {
      setLoadError(error?.message || "Failed to update payment method.");
    }
  };

  const handleRemove = async (id) => {
    try {
      await customerAPI.deletePaymentMethod(id);
      await loadPaymentMethods();
    } catch (error) {
      setLoadError(error?.message || "Failed to remove payment method.");
    }
  };

  return (
    <div className="section-content">
      <h3 className="section-title">Payment Methods</h3>
      {isLoading && <div style={EMPTY_STATE_STYLE}>Loading payment methods...</div>}
      {loadError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{loadError}</div>}
      {!isLoading && !loadError && methods.length === 0 && (
        <div style={EMPTY_STATE_STYLE}>No payment methods yet.</div>
      )}
      <div className="payment-list">
        {methods.map(({ id, type, label, details_masked: detailsMasked, is_default: isDefault }) => (
          <div key={id} className={`payment-card${Number(isDefault) === 1 ? " payment-active" : ""}`}>
            <div className="payment-icon">{paymentTypeIcon[type] || "💳"}</div>
            <div className="payment-info">
              <div className="payment-name">{label}</div>
              <div className="payment-meta">
                {detailsMasked}
                {Number(isDefault) === 1 && <span className="default-badge" style={{ marginLeft: 6 }}>Default</span>}
              </div>
            </div>
            <div className="payment-actions">
              {Number(isDefault) !== 1 && (
                <button className="addr-btn" onClick={() => handleSetDefault(id)}>Set Default</button>
              )}
              <button className="addr-btn addr-btn-danger" onClick={() => handleRemove(id)}>
                <Icon d={icons.trash} size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="add-address-btn" onClick={() => setShowModal(true)}>+ Add Payment Method</button>
      {showModal && <AddPaymentModal onSave={handleAdd} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function NotificationsSection() {
  const ALERTS_PAGE_SIZE = 6;
  const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsPage, setAlertsPage] = useState(1);
  const [alertsTotal, setAlertsTotal] = useState(0);
  const [alertsTotalPages, setAlertsTotalPages] = useState(1);
  const [savingKey, setSavingKey] = useState(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      setIsLoading(true);
      setSaveError("");

      try {
        const settingsResult = customerAPI && typeof customerAPI.getNotificationSettings === "function"
          ? await customerAPI.getNotificationSettings()
          : { data: DEFAULT_NOTIFICATION_SETTINGS };
        if (!mounted) return;

        if (settingsResult?.success && settingsResult.data) {
          setSettings((prev) => ({ ...prev, ...settingsResult.data }));
        }
      } catch (error) {
        if (!mounted) return;
        setSaveError(error?.message || "Failed to load notification settings.");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadAlertsPage = async () => {
      setNotifLoading(true);

      try {
        const alertsResult = customerAPI && typeof customerAPI.getNotifications === "function"
          ? await customerAPI.getNotifications({ page: alertsPage, limit: ALERTS_PAGE_SIZE })
          : { data: [], meta: { total_pages: 1 } };

        if (!mounted) return;

        const rows = Array.isArray(alertsResult?.data) ? alertsResult.data : [];
        const mappedAlerts = rows.map((row) => ({
          id: Number(row.id),
          type: String(row.type || "general"),
          title: String(row.title || "Notification"),
          message: String(row.message || ""),
          status: String(row?.meta?.status || "").toLowerCase(),
          orderNumber: String(row?.meta?.order_number || ""),
          createdAt: row.created_at,
          isRead: Boolean(row.is_read),
        }));

        const metaTotalPages = Math.max(1, Number(alertsResult?.meta?.total_pages || 1));
        const metaTotal = Math.max(0, Number(alertsResult?.meta?.total || 0));
        setAlerts(mappedAlerts);
        setAlertsTotal(metaTotal);
        setAlertsTotalPages(metaTotalPages);

        if (alertsPage > metaTotalPages) {
          setAlertsPage(metaTotalPages);
        }
      } catch (error) {
        if (!mounted) return;
        setSaveError(error?.message || "Failed to load notification alerts.");
      } finally {
        if (mounted) {
          setNotifLoading(false);
        }
      }
    };

    loadAlertsPage();
    return () => { mounted = false; };
  }, [alertsPage]);

  const markAlertRead = async (alertId) => {
    const id = Number(alertId);
    if (!id) return;

    setAlerts((prev) => prev.map((entry) => (
      entry.id === id ? { ...entry, isRead: true } : entry
    )));

    try {
      if (!customerAPI || typeof customerAPI.markNotificationRead !== "function") {
        return;
      }
      await customerAPI.markNotificationRead(id);
    } catch (error) {
      setSaveError(error?.message || "Failed to mark alert as read.");
    }
  };

  const markAllAlertsRead = async () => {
    setAlerts((prev) => prev.map((entry) => ({ ...entry, isRead: true })));

    try {
      if (!customerAPI || typeof customerAPI.markAllNotificationsRead !== "function") {
        return;
      }
      await customerAPI.markAllNotificationsRead();
    } catch (error) {
      setSaveError(error?.message || "Failed to mark all alerts as read.");
    }
  };

  const handleToggle = async (key) => {
    const nextValue = !settings[key];
    const previousValue = settings[key];

    setSettings((s) => ({ ...s, [key]: nextValue }));
    setSavingKey(key);
    setSaveError("");

    try {
      if (!customerAPI || typeof customerAPI.updateNotificationSettings !== "function") {
        throw new Error("Notification settings API is unavailable.");
      }

      const result = await customerAPI.updateNotificationSettings({ [key]: nextValue });
      if (result?.success && result.data) {
        setSettings((prev) => ({ ...prev, ...result.data }));
      }
    } catch (error) {
      setSettings((s) => ({ ...s, [key]: previousValue }));
      setSaveError(error?.message || "Failed to update notification settings.");
    } finally {
      setSavingKey(null);
    }
  };

  const items = [
    { key: "orders", label: "Order Updates", desc: "Shipping, delivery & return status" },
    { key: "promos", label: "Promotions & Deals", desc: "Exclusive sales and discount codes" },
    { key: "wishlist", label: "Wishlist Alerts", desc: "Price drops on saved items" },
    { key: "newsletter", label: "Newsletter", desc: "Weekly curated picks from Ilocos" },
    { key: "sms", label: "SMS Notifications", desc: "Text alerts for important updates" },
  ];

  const currentAlertsPage = Math.min(Math.max(alertsPage, 1), alertsTotalPages);
  const alertsRangeStart = alertsTotal > 0 ? ((currentAlertsPage - 1) * ALERTS_PAGE_SIZE) + 1 : 0;
  const alertsRangeEnd = alertsTotal > 0 ? (alertsRangeStart + alerts.length - 1) : 0;
  const unreadAlertCount = alerts.filter((entry) => !entry.isRead).length;

  const changeAlertsPage = (delta) => {
    setAlertsPage((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > alertsTotalPages) return alertsTotalPages;
      return next;
    });
  };

  return (
    <div className="section-content">
      <h3 className="section-title">Notifications</h3>
      {isLoading && <div className="notif-empty">Loading notification settings...</div>}
      {saveError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{saveError}</div>}
      <div className="notif-list">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="notif-row">
            <div>
              <div className="notif-label">{label}</div>
              <div className="notif-desc">{desc}{savingKey === key ? " (Saving...)" : ""}</div>
            </div>
            <div className={`toggle${settings[key] ? " on" : ""}`} onClick={() => handleToggle(key)}>
              <div className="toggle-thumb" />
            </div>
          </div>
        ))}
      </div>

      <div className="alerts-modal-trigger" style={{ marginTop: 22 }}>
        <div>
          <h3 className="section-title" style={{ marginBottom: 4, fontSize: 17 }}>Recent Alerts</h3>
          <div className="alerts-trigger-subtext">
            Open as list modal so you can read alerts without scrolling down this tab.
          </div>
        </div>
        <button type="button" className="edit-btn" onClick={() => setShowAlertsModal(true)}>
          {unreadAlertCount > 0 ? `View Alerts (${unreadAlertCount} new)` : "View Alerts"}
        </button>
      </div>

      {showAlertsModal && (
        <Modal title="Recent Alerts" onClose={() => setShowAlertsModal(false)}>
          <div className="alerts-modal-header-row">
            <span className="alerts-range-info">
              {alertsTotal > 0
                ? `Showing ${alertsRangeStart}-${alertsRangeEnd} of ${alertsTotal} alerts`
                : "No alerts yet"}
            </span>
            {unreadAlertCount > 0 && (
              <button type="button" className="edit-btn" onClick={markAllAlertsRead}>Mark all read</button>
            )}
          </div>

          {notifLoading ? (
            <div style={EMPTY_STATE_STYLE}>Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div style={EMPTY_STATE_STYLE}>No notification alerts yet.</div>
          ) : (
            <ul className="alerts-modal-list">
              {alerts.map((entry) => {
                const statusLabel = entry.status ? formatStatus(entry.status) : "";
                const alertTypeEmoji = entry.type === "order_status" || entry.type === "order_created" ? "📦" : "🔔";
                return (
                  <li key={entry.id} className={`alerts-modal-item${entry.isRead ? "" : " unread"}`}>
                    <button
                      type="button"
                      className="alerts-modal-btn"
                      onClick={() => markAlertRead(entry.id)}
                    >
                      <span className="alerts-modal-icon" aria-hidden="true">{alertTypeEmoji}</span>
                      <span className="alerts-modal-main">
                        <span className="alerts-modal-title-row">
                          <span className="alerts-modal-title">{entry.title}</span>
                          {!entry.isRead && <span className="default-badge">New</span>}
                        </span>
                        <span className="alerts-modal-meta">
                          {safeDateLabel(entry.createdAt)}
                          {statusLabel ? ` • ${statusLabel}` : ""}
                        </span>
                        {entry.message && <span className="alerts-modal-message">{entry.message}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {alertsTotalPages > 1 && (
            <div className="alerts-pagination">
              <button
                type="button"
                className="alerts-page-btn"
                onClick={() => changeAlertsPage(-1)}
                disabled={currentAlertsPage <= 1}
              >
                Prev
              </button>
              <span className="alerts-page-info">Page {currentAlertsPage} of {alertsTotalPages}</span>
              <button
                type="button"
                className="alerts-page-btn"
                onClick={() => changeAlertsPage(1)}
                disabled={currentAlertsPage >= alertsTotalPages}
              >
                Next
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Security Section (Enhanced) ────────────────────────────────────────────
function SecuritySection() {
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordChange = async ({ current, next, confirm }) => {
    if (!customerAPI || typeof customerAPI.changePassword !== "function") {
      throw new Error("Password API is unavailable.");
    }

    await customerAPI.changePassword(current, next, confirm);
  };

  return (
    <div className="section-content">
      <h3 className="section-title">Security</h3>
      <div className="security-list">
        <div className="security-row" onClick={() => setShowPassword(true)}>
          <span className="security-icon">🔒</span>
          <div className="security-info">
            <div className="security-label">Change Password</div>
            <div className="security-desc">Update your account password</div>
          </div>
          <Icon d={icons.chevron} size={18} />
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <div style={EMPTY_STATE_STYLE}>
          Additional security options are hidden until full backend workflows are available.
        </div>
      </div>

      {showPassword && (
        <ChangePasswordModal
          onClose={() => setShowPassword(false)}
          onSubmit={handlePasswordChange}
        />
      )}
    </div>
  );
}

function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadReviews = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      if (!customerAPI || typeof customerAPI.getReviews !== "function") {
        throw new Error("Reviews API is unavailable.");
      }
      const result = await customerAPI.getReviews();
      setReviews(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      setLoadError(error?.message || "Failed to load reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const removeReview = async (id) => {
    try {
      await customerAPI.deleteReview(id);
      await loadReviews();
    } catch (error) {
      setLoadError(error?.message || "Failed to remove review.");
    }
  };

  return (
    <div className="section-content">
      <h3 className="section-title">My Reviews</h3>
      {isLoading && <div style={EMPTY_STATE_STYLE}>Loading reviews...</div>}
      {loadError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{loadError}</div>}
      {!isLoading && !loadError && reviews.length === 0 && (
        <div style={EMPTY_STATE_STYLE}>No reviews yet.</div>
      )}
      <div className="reviews-list">
        {reviews.map((r) => (
          <div key={r.id} className="review-card">
            <div className="review-header">
              <div className="review-product">{r.product_name}</div>
              <div className="review-date">{safeDateLabel(r.created_at)}</div>
            </div>
            <div className="review-stars">{"★".repeat(Number(r.rating || 0))}{"☆".repeat(5 - Number(r.rating || 0))}</div>
            <div className="review-comment">{r.comment}</div>
            <div style={{ marginTop: 10 }}>
              <button className="addr-btn addr-btn-danger" onClick={() => removeReview(r.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { key: "profile", label: "Profile Details", icon: icons.user },
  { key: "orders", label: "Orders", icon: icons.package },
  { key: "wishlist", label: "Wishlist", icon: icons.heart },
  { key: "addresses", label: "Addresses", icon: icons.location },
  { key: "payment", label: "Payment", icon: icons.card },
  { key: "notifications", label: "Notifications", icon: icons.bell },
  { key: "security", label: "Security", icon: icons.shield },
  { key: "reviews", label: "Reviews", icon: icons.star },
];

// ── Main ───────────────────────────────────────────────────────────────────
export default function Profile({ userProfile, onUpdateProfile, cartCount = 0, onLogout }) {
  const navigate = useNavigate();
  const [active, setActive] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [photo, setPhoto] = useState(userProfile?.profileImage || userProfile?.profile_image_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [profileStats, setProfileStats] = useState({
    totalOrders: 0,
    wishlistItems: 0,
    reviewsGiven: 0,
    totalSpent: 0,
  });

  const user = useMemo(
    () => userProfile || { name: "Customer", email: "", phone: "", birthday: "", gender: "", profileImage: "", createdAt: "" },
    [userProfile]
  );
  const setUser = onUpdateProfile;
  const [draft, setDraft] = useState(user);

  useEffect(() => {
    setDraft(user);
  }, [user]);

  useEffect(() => {
    setPhoto(user.profileImage || user.profile_image_url || null);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const [ordersRes, wishlistRes, reviewsRes] = await Promise.all([
          customerAPI.getOrders ? customerAPI.getOrders() : Promise.resolve({ data: [] }),
          customerAPI.getWishlist ? customerAPI.getWishlist() : Promise.resolve({ data: [] }),
          customerAPI.getReviews ? customerAPI.getReviews() : Promise.resolve({ data: [] }),
        ]);

        if (!mounted) return;

        const orders = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
        const wishlist = Array.isArray(wishlistRes?.data) ? wishlistRes.data : [];
        const reviews = Array.isArray(reviewsRes?.data) ? reviewsRes.data : [];
        const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

        setProfileStats({
          totalOrders: orders.length,
          wishlistItems: wishlist.length,
          reviewsGiven: reviews.length,
          totalSpent,
        });
      } catch {
        if (!mounted) return;
        setProfileStats((prev) => ({ ...prev }));
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  const initials = (user.name || "?").split(" ").filter(Boolean).map(n => n[0]).join("") || "?";
  
  const handleSave = async () => {
    setIsLoading(true);
    setSaveError(null);
    
    try {
      const [firstName, ...lastNameParts] = String(draft.name || "").trim().split(" ");
      const lastName = lastNameParts.join(" ");

      if (!firstName) {
        throw new Error("First name is required.");
      }
      
      const updateData = {
        first_name: firstName,
        last_name: lastName,
        phone: draft.phone,
        birthday: draft.birthday,
        gender: draft.gender,
      };
      
      const result = await customerAPI.updateProfile(updateData);
      
      if (result.success) {
        const p = result?.data || {};
        const fullName = `${p.first_name || firstName} ${p.last_name || lastName}`.trim();
        setUser({
          name: fullName || draft.name,
          email: p.email || draft.email,
          phone: p.phone || "",
          birthday: p.birthday || "",
          gender: p.gender || "",
          profileImage: p.profile_image_url || user.profileImage || "",
          createdAt: p.created_at || user.createdAt || "",
        });
        setEditMode(false);
      } else {
        setSaveError(result.message || "Failed to save profile. Please try again.");
      }
    } catch (error) {
      setSaveError(error.message || "An error occurred while saving your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSave = async ({ file, remove }) => {
    if (!customerAPI || typeof customerAPI.updateProfile !== "function") {
      throw new Error("Profile API is unavailable.");
    }

    let imageUrl = null;

    if (!remove && file) {
      if (!customerAPI.uploadProfilePhoto || typeof customerAPI.uploadProfilePhoto !== "function") {
        throw new Error("Photo upload API is unavailable.");
      }

      const uploadResult = await customerAPI.uploadProfilePhoto(file);
      imageUrl = uploadResult?.data?.profile_image_url || null;
    }

    if (remove) {
      const result = await customerAPI.updateProfile({ profile_image_url: "" });
      const nextUrl = result?.data?.profile_image_url || "";
      setPhoto(nextUrl || null);
      setUser({ ...user, profileImage: nextUrl || "" });
      return;
    }

    if (imageUrl) {
      setPhoto(imageUrl);
      setUser({ ...user, profileImage: imageUrl });
    }
  };

  const renderSection = () => {
    if (editMode) return (
      <div className="edit-form">
        <h3>Edit Profile</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Birthday</label>
            <input className="form-input" type="date" value={draft.birthday} onChange={e => setDraft(d => ({ ...d, birthday: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-input" value={draft.gender} onChange={e => setDraft(d => ({ ...d, gender: e.target.value }))}>
              <option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option>
            </select>
          </div>
        </div>
        {saveError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{saveError}</div>}
        <div className="form-actions">
          <button className="btn-cancel" onClick={() => { setDraft(user); setEditMode(false); }}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    );

    switch (active) {
      case "profile": return <ProfileDetailsSection user={user} photo={photo} stats={profileStats} onEdit={() => setEditMode(true)} onChangePhoto={() => setShowPhotoModal(true)} />;
      case "orders": return <OrdersSection />;
      case "wishlist": return <WishlistSection />;
      case "addresses": return <AddressSection />;
      case "payment": return <PaymentSection />;
      case "notifications": return <NotificationsSection />;
      case "security": return <SecuritySection />;
      case "reviews": return <ReviewsSection />;
      default: return null;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .profile-page { min-height: 100vh; background: #eef6fb; font-family: 'DM Sans', sans-serif; color: #0a2540; }

        .profile-banner {
          background: linear-gradient(135deg, #0a3a66 0%, #2a88b5 50%, #6dcbeb 100%);
          padding: 120px 32px 80px; position: relative; overflow: hidden;
        }
        .profile-banner::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .banner-title { font-family: 'Playfair Display', serif; font-size: 13px; letter-spacing: 3px; color: rgba(255,255,255,0.55); text-transform: uppercase; margin-bottom: 6px; position: relative; }
        .banner-greeting { font-family: 'Playfair Display', serif; font-size: 32px; color: #fff; font-weight: 700; position: relative; }

        .avatar-card { max-width: 920px; margin: -48px auto 0; padding: 0 24px; position: relative; z-index: 10; }
        .avatar-inner { background: #fff; border-radius: 20px; padding: 28px 32px; display: flex; align-items: center; gap: 24px; box-shadow: 0 8px 40px rgba(0,0,0,0.10); flex-wrap: wrap; }
        .avatar-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #6dcbeb, #2a88b5); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 28px; color: #fff; flex-shrink: 0; position: relative; cursor: pointer; overflow: hidden; }
        .avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-cam { position: absolute; bottom: 0; right: 0; width: 24px; height: 24px; background: #0a2540; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; }
        .avatar-info { flex: 1; min-width: 120px; }
        .avatar-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; }
        .avatar-email { font-size: 14px; color: #888; margin-top: 2px; }
        .avatar-stats { display: flex; gap: 24px; }
        .stat-item { text-align: center; }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #2a88b5; }
        .stat-label { font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 1px; }
        .edit-btn { display: flex; align-items: center; gap: 6px; padding: 8px 18px; background: #eef6fb; border: 1.5px solid #cfe4f2; border-radius: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #0a3a66; transition: all .2s; }
        .edit-btn:hover { background: #d8ebf5; }

        .profile-layout { max-width: 920px; margin: 24px auto; padding: 0 24px 60px; display: grid; grid-template-columns: 220px 1fr; gap: 20px; }

        .sidebar { background: #fff; border-radius: 16px; padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); height: fit-content; position: sticky; top: 90px; }
        .sidebar-nav-item { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; color: #666; transition: all .2s; margin-bottom: 2px; }
        .sidebar-nav-item:hover { background: #eef6fb; color: #0a3a66; }
        .sidebar-nav-item.active { background: linear-gradient(135deg, #2a88b5, #6dcbeb); color: #fff; }
        .sidebar-divider { height: 1px; background: #dbeaf2; margin: 10px 0; }
        .sidebar-logout { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; color: #e53e3e; transition: background .2s; }
        .sidebar-logout:hover { background: #fff5f5; }

        .main-panel { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden; }

        /* ── Modal ── */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(2px); }
        .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; overflow-x: hidden; }

        /* ── Add Address modal ── */
        .addr-modal-intro { font-size: 13px; color: #6a7a8a; margin-bottom: 18px; line-height: 1.5; }
        .addr-form { display: flex; flex-direction: column; gap: 16px; }
        .addr-label-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 8px; }
        .addr-label-btn {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 6px; padding: 14px 8px;
          border: 2px solid #cfe4f2; border-radius: 14px; background: #f7fbfd;
          cursor: pointer; transition: all .2s;
        }
        .addr-label-btn:hover { border-color: #6dcbeb; background: #eaf6fc; }
        .addr-label-btn.selected {
          border-color: #2a88b5; background: #eaf6fc;
          box-shadow: 0 4px 14px rgba(42,136,181,0.18);
        }
        .addr-label-btn svg { color: #2a88b5; }
        .addr-label-btn-text { font-size: 13px; font-weight: 600; color: #0a2540; }
        .addr-default-toggle {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 12px; border: 1.5px solid #cfe4f2; background: #f7fbfd;
          cursor: pointer; user-select: none; transition: all .2s;
        }
        .addr-default-toggle:hover { border-color: #6dcbeb; background: #eaf6fc; }
        .addr-default-toggle .check-box {
          width: 20px; height: 20px; border-radius: 6px; border: 2px solid #cfe4f2;
          background: #fff; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          color: #fff; transition: all .2s;
        }
        .addr-default-toggle.checked .check-box {
          background: linear-gradient(135deg, #2a88b5, #6dcbeb); border-color: #2a88b5;
        }
        .addr-default-toggle-label { font-size: 13px; font-weight: 600; color: #0a2540; }
        .addr-default-toggle-sub { font-size: 12px; color: #6a7a8a; margin-top: 1px; }
        .addr-field-error { color: #e53e3e; font-size: 12px; margin-top: 4px; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
        .modal-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; }
        .modal-close { width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid #cfe4f2; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #888; transition: all .2s; }
        .modal-close:hover { background: #eef6fb; color: #0a2540; }
        /* Override the global .modal-body rule in ViganCss.css that sets
           display:flex + min-height:420px (intended for a different modal). */
        .modal-box .modal-body { display: block; min-height: 0; padding: 20px 24px 24px; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }

        /* ── Change Photo ── */
        .photo-drop-zone { border: 2px dashed #cfe4f2; border-radius: 16px; cursor: pointer; position: relative; overflow: hidden; width: 180px; height: 180px; flex-shrink: 0; margin: 0 auto 0; display: flex; align-items: center; justify-content: center; background: #f4fafd; transition: border-color .2s; }
        .photo-drop-zone.dragging { border-color: #6dcbeb; background: #eaf6fc; }
        .photo-drop-zone:hover .photo-drop-overlay { opacity: 1; }
        .photo-preview-img { width: 100%; height: 100%; object-fit: cover; }
        .photo-placeholder { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #6dcbeb, #2a88b5); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 28px; color: #fff; }
        .photo-drop-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #fff; font-size: 13px; font-weight: 500; opacity: 0; transition: opacity .2s; }
        .photo-modal-content { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .photo-hint { text-align: center; font-size: 12px; color: #aaa; }
        .photo-remove-btn { background: none; border: none; color: #e53e3e; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; }

        /* ── Payment Type Grid ── */
        .payment-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
        .payment-type-btn { display: flex; flex-direction: column; align-items: center; padding: 14px 10px; border: 2px solid #cfe4f2; border-radius: 12px; cursor: pointer; transition: all .2s; }
        .payment-type-btn.selected { border-color: #6dcbeb; background: #eaf6fc; }

        /* ── Password ── */
        .pw-input-wrap { position: relative; }
        .pw-input { padding-right: 44px !important; }
        .pw-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #aaa; padding: 4px; display: flex; align-items: center; }
        .pw-eye:hover { color: #2a88b5; }
        .input-error { border-color: #ef4444 !important; }
        .input-error-msg { font-size: 12px; color: #ef4444; margin-top: 4px; }
        .strength-bar-wrap { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
        .strength-bar { display: flex; gap: 4px; flex: 1; }
        .strength-segment { height: 4px; flex: 1; border-radius: 2px; transition: background .3s; }
        .strength-label { font-size: 12px; font-weight: 600; width: 46px; }
        .pw-tips { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 12px 0 20px; }
        .pw-tip { font-size: 12px; color: #ccc; transition: color .2s; }
        .pw-tip.met { color: #22c55e; }

        /* ── 2FA ── */
        .tfa-info-box { display: flex; gap: 14px; align-items: flex-start; background: #fef3c7; border-radius: 12px; padding: 14px 16px; margin-bottom: 4px; }
        .tfa-method-list { display: flex; flex-direction: column; gap: 10px; }
        .tfa-method-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 2px solid #cfe4f2; border-radius: 12px; cursor: pointer; transition: all .2s; }
        .tfa-method-card.selected { border-color: #6dcbeb; background: #eaf6fc; }
        .tfa-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #cfe4f2; margin-left: auto; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tfa-method-card.selected .tfa-radio { border-color: #6dcbeb; }
        .tfa-radio-dot { width: 10px; height: 10px; border-radius: 50%; background: #6dcbeb; }
        .otp-grid { display: flex; gap: 8px; justify-content: center; }
        .otp-input { width: 44px; height: 52px; border: 2px solid #cfe4f2; border-radius: 12px; text-align: center; font-size: 20px; font-weight: 700; font-family: 'Playfair Display', serif; color: #0a2540; background: #f4fafd; outline: none; transition: border .2s; }
        .otp-input:focus { border-color: #6dcbeb; background: #fff; }

        /* ── Success ── */
        .success-state { text-align: center; padding: 20px 0; }
        .success-icon { font-size: 48px; margin-bottom: 12px; }
        .success-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; margin-bottom: 6px; }
        .success-sub { font-size: 14px; color: #888; }

        /* ── Security badges ── */
        .security-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; flex-shrink: 0; }
        .badge-on { background: #d1fae5; color: #065f46; }
        .badge-off { background: #fee2e2; color: #991b1b; }

        /* ── Edit Form ── */
        .edit-form { padding: 32px; }
        .edit-form h3 { font-family: 'Playfair Display', serif; font-size: 20px; margin-bottom: 24px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1/-1; }
        .form-label { font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: .8px; }
        .form-input { padding: 11px 14px; border: 1.5px solid #cfe4f2; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0a2540; background: #f4fafd; outline: none; transition: border .2s; width: 100%; }
        .form-input:focus { border-color: #6dcbeb; background: #fff; }
        .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .btn-save { padding: 10px 24px; background: linear-gradient(135deg, #2a88b5, #6dcbeb); color: #fff; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity .2s; }
        .btn-save:hover { opacity: .9; }
        .btn-cancel { padding: 10px 20px; background: #eef6fb; border: 1.5px solid #cfe4f2; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; color: #666; }

        /* ── Section ── */
        .section-content { padding: 32px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 20px; margin-bottom: 20px; }

        /* ── Profile Details ── */
        .pd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .pd-avatar-block { display: flex; align-items: center; gap: 18px; background: #f4fafd; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; border: 1.5px solid #dbeaf2; }
        .pd-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #6dcbeb, #2a88b5); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 22px; color: #fff; flex-shrink: 0; position: relative; cursor: pointer; overflow: hidden; }
        .pd-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .pd-avatar-name { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; }
        .pd-avatar-sub { font-size: 12px; color: #aaa; margin-top: 3px; }
        .change-photo-link { background: none; border: none; color: #2a88b5; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; margin-top: 6px; padding: 0; text-decoration: underline; }
        .pd-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .pd-detail-card { display: flex; align-items: center; gap: 14px; padding: 16px; border: 1.5px solid #dbeaf2; border-radius: 14px; background: #f7fbfd; transition: border .2s; }
        .pd-detail-card:hover { border-color: #6dcbeb; }
        .pd-detail-emoji { font-size: 22px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); flex-shrink: 0; }
        .pd-detail-label { font-size: 11px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 4px; }
        .pd-detail-value { font-size: 14px; font-weight: 600; color: #0a2540; }
        .pd-account-strip { display: flex; align-items: center; background: linear-gradient(135deg, #0a3a66, #2a88b5); border-radius: 14px; padding: 20px 24px; }
        .pd-strip-item { flex: 1; text-align: center; }
        .pd-strip-num { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #fff; }
        .pd-strip-label { font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: .8px; margin-top: 2px; }
        .pd-strip-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.15); flex-shrink: 0; }

        /* ── Orders ── */
        .orders-list { display: flex; flex-direction: column; gap: 12px; }
        .order-card { display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1.5px solid #dbeaf2; border-radius: 12px; transition: border .2s; }
        .order-card:hover { border-color: #6dcbeb; }
        .order-top { display: flex; align-items: center; gap: 16px; }
        .order-emoji { font-size: 28px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #eef6fb; border-radius: 10px; }
        .order-info { flex: 1; }
        .order-id { font-weight: 600; font-size: 14px; }
        .order-meta { font-size: 12px; color: #aaa; margin-top: 2px; }
        .order-right { text-align: right; }
        .order-status { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
        .order-total { font-weight: 700; font-size: 15px; margin-top: 4px; color: #2a88b5; }
        .order-actions-row { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
        .order-detail-toggle {
          border: 1.5px solid #cfe4f2;
          background: #f7fbfd;
          color: #0a3a66;
          font-size: 12px;
          font-weight: 600;
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all .2s;
        }
        .order-detail-toggle:hover { border-color: #6dcbeb; background: #eef6fb; }

        .order-cancel-btn {
          border: 1.5px solid #fecaca;
          background: #fff5f5;
          color: #b91c1c;
          font-size: 12px;
          font-weight: 700;
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all .2s;
        }
        .order-cancel-btn:hover { background: #fee2e2; border-color: #fca5a5; }
        .order-cancel-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .order-action-feedback {
          margin-top: -4px;
          font-size: 12px;
          color: #b91c1c;
          text-align: right;
        }

        .order-action-toast {
          margin-bottom: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #86efac;
          background: #f0fdf4;
          color: #166534;
          font-size: 13px;
          font-weight: 600;
          animation: fadeToastIn .2s ease;
        }

        @keyframes fadeToastIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cancel-order-modal-copy {
          font-size: 13px;
          color: #6a7a8a;
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .cancel-reason-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cancel-reason-option {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1.5px solid #dbeaf2;
          border-radius: 10px;
          background: #f7fbfd;
          padding: 10px 12px;
          cursor: pointer;
          transition: all .2s;
        }
        .cancel-reason-option:hover { border-color: #6dcbeb; background: #eef6fb; }
        .cancel-reason-option.selected { border-color: #2a88b5; background: #eaf6fc; }
        .cancel-reason-option input { accent-color: #2a88b5; }
        .cancel-reason-title {
          font-size: 13px;
          font-weight: 600;
          color: #0a2540;
        }
        .cancel-remark-input {
          min-height: 90px;
          resize: vertical;
          line-height: 1.45;
        }
        .cancel-remark-help {
          margin-top: 5px;
          font-size: 11px;
          color: #8a99a8;
          text-align: right;
        }

        .order-detail-panel {
          border-top: 1px solid #e6f0f7;
          padding-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .order-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .order-meta-card {
          border: 1px solid #e6f0f7;
          background: #f7fbfd;
          border-radius: 10px;
          padding: 10px 12px;
        }
        .order-meta-label {
          font-size: 10px;
          font-weight: 700;
          color: #6a7a8a;
          letter-spacing: .6px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .order-meta-value {
          font-size: 13px;
          color: #0a2540;
          font-weight: 600;
          line-height: 1.4;
        }

        .order-shipping-box {
          border: 1px solid #e6f0f7;
          border-radius: 10px;
          padding: 10px 12px;
          background: #ffffff;
        }
        .order-shipping-text {
          font-size: 13px;
          color: #1f3347;
          font-weight: 500;
          line-height: 1.5;
          margin-bottom: 4px;
        }
        .order-shipping-sub {
          font-size: 12px;
          color: #6a7a8a;
        }

        .order-cancel-box {
          border: 1px solid #f4d6b4;
          border-radius: 10px;
          padding: 10px 12px;
          background: #fff7ed;
        }
        .order-cancel-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          font-size: 13px;
          color: #7c3e1d;
          padding: 4px 0;
        }
        .order-cancel-key {
          font-weight: 700;
          flex-shrink: 0;
        }
        .order-cancel-value {
          text-align: right;
          font-weight: 600;
          color: #9a3412;
          line-height: 1.45;
        }
        .order-cancel-remark {
          white-space: pre-wrap;
          word-break: break-word;
        }

        .order-items-box {
          border: 1px solid #e6f0f7;
          border-radius: 10px;
          padding: 10px 12px;
          background: #ffffff;
        }
        .order-items-title {
          font-size: 13px;
          font-weight: 700;
          color: #0a2540;
          margin-bottom: 8px;
        }
        .order-items-head,
        .order-item-row {
          display: grid;
          grid-template-columns: minmax(120px, 1fr) 60px 95px 95px;
          gap: 8px;
          align-items: center;
        }
        .order-items-head {
          font-size: 11px;
          font-weight: 700;
          color: #6a7a8a;
          text-transform: uppercase;
          letter-spacing: .5px;
          padding: 0 0 8px;
          border-bottom: 1px solid #edf4f9;
        }
        .order-item-row {
          font-size: 13px;
          color: #0a2540;
          padding: 9px 0;
          border-bottom: 1px dashed #edf4f9;
        }
        .order-item-row:last-child { border-bottom: none; }
        .order-item-main {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .order-item-thumb {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #dbeaf2;
          background: #eef6fb;
          flex-shrink: 0;
        }
        .order-item-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .order-item-row span:nth-child(n+2),
        .order-items-head span:nth-child(n+2) {
          text-align: right;
        }

        .order-total-box {
          margin-left: auto;
          width: min(320px, 100%);
          border: 1px solid #e6f0f7;
          border-radius: 10px;
          padding: 10px 12px;
          background: #f7fbfd;
        }
        .order-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #3a4e60;
          padding: 4px 0;
        }
        .order-total-row strong { color: #0a2540; }
        .order-total-row.grand {
          margin-top: 4px;
          padding-top: 8px;
          border-top: 1px solid #dbeaf2;
          font-size: 14px;
          font-weight: 700;
        }
        .order-total-row.grand strong { color: #2a88b5; }

        /* ── Wishlist ── */
        .wishlist-list { display: flex; flex-direction: column; gap: 10px; }
        .wish-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border: 1.5px solid #e8eef3;
          border-radius: 12px;
          background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .wish-row:hover {
          border-color: #b8d4e3;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        .wish-row-img {
          width: 56px;
          height: 56px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          background: #edf4f8;
        }
        .wish-row-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .wish-row-img-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .wish-row-info {
          flex: 1;
          min-width: 0;
        }
        .wish-row-name {
          font-weight: 700;
          font-size: 14px;
          color: #1a1a2e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 3px;
        }
        .wish-row-loc {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #9ca3af;
        }
        .wish-row-loc svg { color: #f87171; flex-shrink: 0; }
        .wish-row-price {
          font-weight: 800;
          font-size: 15px;
          color: #0091A9;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .wish-row-view {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1.5px solid #0091A9;
          background: transparent;
          color: #0091A9;
          font-size: 12px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          flex-shrink: 0;
          white-space: nowrap;
          transition: background 0.2s, color 0.2s;
        }
        .wish-row-view:hover { background: #0091A9; color: #fff; }
        .wish-row-remove {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: none;
          border: 1.5px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #bbb;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .wish-row-remove:hover { background: #fee2e2; color: #e53e3e; border-color: #fca5a5; }

        /* ── Addresses ── */
        .address-list { display: flex; flex-direction: column; gap: 12px; }
        .address-card { padding: 16px; border: 1.5px solid #dbeaf2; border-radius: 12px; }
        .address-default { border-color: #6dcbeb; background: #f4fafd; }
        .address-label-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .address-label { font-weight: 700; font-size: 13px; }
        .default-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #cfe7f5; color: #2a88b5; }
        .address-text { font-size: 13px; color: #666; line-height: 1.5; }
        .address-actions { display: flex; gap: 8px; margin-top: 10px; }
        .addr-btn { font-size: 12px; font-weight: 500; padding: 5px 12px; border: 1.5px solid #cfe4f2; border-radius: 8px; background: none; cursor: pointer; color: #555; display: flex; align-items: center; gap: 4px; }
        .addr-btn-danger { color: #e53e3e; border-color: #fecaca; }
        .add-address-btn { margin-top: 4px; width: 100%; padding: 12px; border: 2px dashed #cfe4f2; border-radius: 12px; background: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #aaa; cursor: pointer; transition: all .2s; }
        .add-address-btn:hover { border-color: #6dcbeb; color: #2a88b5; }

        /* ── Payment ── */
        .payment-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
        .payment-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1.5px solid #dbeaf2; border-radius: 12px; flex-wrap: wrap; }
        .payment-active { border-color: #6dcbeb; background: #f4fafd; }
        .payment-icon { font-size: 24px; }
        .payment-info { flex: 1; min-width: 120px; }
        .payment-name { font-weight: 600; font-size: 14px; }
        .payment-meta { font-size: 12px; color: #aaa; margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .payment-actions { display: flex; gap: 6px; align-items: center; }

        /* ── Notifications ── */
        .notif-list { display: flex; flex-direction: column; gap: 4px; }
        .notif-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #e6f0f7; }
        .notif-label { font-weight: 500; font-size: 14px; }
        .notif-desc { font-size: 12px; color: #aaa; margin-top: 2px; }
        .toggle { width: 44px; height: 24px; border-radius: 12px; background: #cfe4f2; cursor: pointer; position: relative; transition: background .25s; flex-shrink: 0; }
        .toggle.on { background: linear-gradient(135deg, #2a88b5, #6dcbeb); }
        .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .25s; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
        .toggle.on .toggle-thumb { transform: translateX(20px); }
        .alerts-modal-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-top: 1px solid #e6f0f7;
        }
        .alerts-trigger-subtext {
          font-size: 12px;
          color: #6b7d8f;
        }
        .alerts-modal-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .alerts-modal-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 380px;
          overflow-y: auto;
        }
        .alerts-modal-item {
          border: 1px solid #e6f0f7;
          border-radius: 12px;
          background: #fbfdff;
          transition: border-color .2s, background .2s;
        }
        .alerts-modal-item.unread {
          border-color: #b8dbef;
          background: #f2f9fe;
        }
        .alerts-modal-btn {
          width: 100%;
          border: 0;
          background: transparent;
          font: inherit;
          color: inherit;
          cursor: pointer;
          padding: 12px;
          display: flex;
          gap: 10px;
          text-align: left;
        }
        .alerts-modal-icon {
          font-size: 18px;
          line-height: 1;
          margin-top: 1px;
          flex-shrink: 0;
        }
        .alerts-modal-main {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }
        .alerts-modal-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .alerts-modal-title {
          font-size: 14px;
          font-weight: 600;
          color: #163a59;
        }
        .alerts-modal-meta {
          font-size: 12px;
          color: #6b7d8f;
        }
        .alerts-modal-message {
          font-size: 12px;
          color: #4b6074;
          line-height: 1.45;
        }
        .alerts-pagination {
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }
        .alerts-range-info {
          font-size: 12px;
          color: #6b7d8f;
          margin-right: auto;
        }
        .alerts-page-info {
          font-size: 12px;
          color: #6b7d8f;
          min-width: 90px;
          text-align: center;
        }
        .alerts-page-btn {
          border: 1.5px solid #cfe4f2;
          background: #f7fbfd;
          color: #0a3a66;
          font-size: 12px;
          font-weight: 600;
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all .2s;
        }
        .alerts-page-btn:hover:not(:disabled) {
          border-color: #6dcbeb;
          background: #eef6fb;
        }
        .alerts-page-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        /* ── Security ── */
        .security-list { display: flex; flex-direction: column; gap: 4px; }
        .security-row { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid #e6f0f7; cursor: pointer; }
        .security-row:hover .security-label { color: #2a88b5; }
        .security-icon { font-size: 20px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #eef6fb; border-radius: 8px; flex-shrink: 0; }
        .security-info { flex: 1; }
        .security-label { font-weight: 500; font-size: 14px; }
        .security-desc { font-size: 12px; color: #aaa; margin-top: 1px; }

        /* ── Reviews ── */
        .reviews-list { display: flex; flex-direction: column; gap: 14px; }
        .review-card { padding: 16px; border: 1.5px solid #dbeaf2; border-radius: 12px; }
        .review-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .review-product { font-weight: 600; font-size: 14px; }
        .review-date { font-size: 12px; color: #aaa; }
        .review-stars { color: #f59e0b; font-size: 16px; margin-bottom: 6px; }
        .review-comment { font-size: 13px; color: #666; line-height: 1.6; }

        @media (max-width: 680px) {
          .profile-layout { grid-template-columns: 1fr; }
          .avatar-stats { display: none; }
          .form-grid { grid-template-columns: 1fr; }
          .wish-row-view { padding: 6px 10px; font-size: 11px; }
          .pd-details-grid { grid-template-columns: 1fr; }
          .profile-banner { padding-top: 100px; }
          .pd-account-strip { flex-wrap: wrap; gap: 16px; }
          .otp-input { width: 38px; height: 46px; font-size: 18px; }
          .otp-grid { gap: 6px; }
          .modal-box { border-radius: 16px; }
          .payment-type-grid { grid-template-columns: 1fr 1fr; }
          .pw-tips { grid-template-columns: 1fr; }
          .section-content { padding: 20px; }
          .edit-form { padding: 20px; }
          .alerts-modal-trigger { align-items: flex-start; flex-direction: column; }
          .order-meta-grid { grid-template-columns: 1fr; }
          .order-top { align-items: flex-start; }
          .order-right { text-align: left; }
          .order-items-head,
          .order-item-row { grid-template-columns: minmax(110px, 1fr) 45px 85px 85px; font-size: 12px; }
        }

        @media (max-width: 400px) {
          .otp-input { width: 32px; height: 40px; font-size: 16px; }
          .pd-account-strip { justify-content: center; }
        }
      `}</style>

      <div className="profile-page">
        <Navbar cartCount={cartCount} />

        <div className="profile-banner">
          <div className="banner-title">SouCul — My Account</div>
          <div className="banner-greeting">Welcome back, {(user.name || "Customer").split(" ")[0]} 👋</div>
        </div>

        <div className="avatar-card">
          <div className="avatar-inner">
            <div className="avatar-circle" onClick={() => setShowPhotoModal(true)}>
              {photo ? <img src={photo} alt="avatar" /> : initials}
              <div className="avatar-cam"><Icon d={icons.camera} size={12} /></div>
            </div>
            <div className="avatar-info">
              <div className="avatar-name">{safeText(user.name, "Customer")}</div>
              <div className="avatar-email">{safeText(user.email, "No email")}</div>
            </div>
            <div className="avatar-stats">
              <div className="stat-item"><div className="stat-num">{profileStats.totalOrders}</div><div className="stat-label">Orders</div></div>
              <div className="stat-item"><div className="stat-num">{profileStats.wishlistItems}</div><div className="stat-label">Wishlist</div></div>
              <div className="stat-item"><div className="stat-num">{profileStats.reviewsGiven}</div><div className="stat-label">Reviews</div></div>
            </div>
          </div>
        </div>

        <div className="profile-layout">
          <aside className="sidebar">
            {NAV_ITEMS.map(({ key, label, icon }) => (
              <div
                key={key}
                className={`sidebar-nav-item${active === key && !editMode ? " active" : ""}`}
                onClick={() => { setActive(key); setEditMode(false); }}
              >
                <Icon d={icon} size={16} />
                {label}
              </div>
            ))}
            <div className="sidebar-divider" />
            <div className="sidebar-logout" onClick={() => setShowLogoutModal(true)}>
              <Icon d={icons.logout} size={16} />
              Log Out
            </div>
          </aside>

          <main className="main-panel">
            {renderSection()}
          </main>
        </div>
      </div>

      {showPhotoModal && (
        <ChangePhotoModal
          currentPhoto={photo}
          initials={initials}
          onSave={handlePhotoSave}
          onClose={() => setShowPhotoModal(false)}
        />
      )}

      {showLogoutModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowLogoutModal(false)}>
          <div className="modal-box" style={{ maxWidth: 380, textAlign: "center" }}>
            <div className="modal-body" style={{ padding: "32px 28px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Log Out?</h3>
              <p style={{ fontSize: 14, color: "#888", marginBottom: 24, lineHeight: 1.6 }}>
                Are you sure you want to log out? Your cart will be cleared.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="btn-cancel" onClick={() => setShowLogoutModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn-save" onClick={() => { setShowLogoutModal(false); onLogout(); navigate("/Login"); }} style={{ flex: 1, background: "#e53e3e" }}>Log Out</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
