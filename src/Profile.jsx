import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Components/Navbar";

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
  delivered: { bg: "#d1fae5", color: "#065f46" },
  shipped: { bg: "#dbeafe", color: "#1e40af" },
  processing: { bg: "#fef3c7", color: "#92400e" },
  confirmed: { bg: "#dbeafe", color: "#1e40af" },
  pending: { bg: "#fef3c7", color: "#92400e" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

const EMPTY_STATE_STYLE = { fontSize: 13, color: "#888", padding: "8px 0" };

const safeDateLabel = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
};

const safeText = (value, fallback = "Not set") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const formatStatus = (value) => {
  const raw = String(value || "pending").toLowerCase();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const formatPeso = (value) => `₱${Number(value || 0).toLocaleString()}`;

// ── Modal Overlay ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}><Icon d={icons.x} size={16} /></button>
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
  const [name, setName] = useState("");
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
              <label className="form-label">Cardholder Name</label>
              <input className="form-input" placeholder="As printed on card" value={name} onChange={e => setName(e.target.value)} />
            </div>
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

// ── 2FA Modal ─────────────────────────────────────────────────────────────
function TwoFAModal({ enabled, onClose, onComplete }) {
  const [step, setStep] = useState(enabled ? "disable" : "choose");
  const [method, setMethod] = useState("sms");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const inputRefs = useRef([]);

  const handleDigit = (i, v) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = d;
    setCode(next);
    if (d && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const verify = async () => {
    if (code.join("").length !== 6) return;

    setSubmitError("");
    setIsSubmitting(true);
    try {
      await onComplete({
        two_factor_enabled: !enabled,
        two_factor_method: method,
      });
      setDone(true);
    } catch (error) {
      setSubmitError(error?.message || 'Failed to update 2FA settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Two-Factor Authentication" onClose={onClose}>
      {done ? (
        <div className="success-state">
          <div className="success-icon">{enabled ? "🔓" : "🔐"}</div>
          <div className="success-title">{enabled ? "2FA Disabled" : "2FA Enabled!"}</div>
          <div className="success-sub">{enabled ? "Two-factor authentication has been turned off." : `Your account is now protected via ${method === "sms" ? "SMS" : "authenticator app"}.`}</div>
          <button className="btn-save" style={{ marginTop: 20, width: "100%" }} onClick={onClose}>Done</button>
        </div>
      ) : step === "disable" ? (
        <>
          <div className="tfa-info-box">
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Disable 2FA?</div>
              <div style={{ fontSize: 13, color: "#888" }}>This will make your account less secure. Enter your verification code to confirm.</div>
            </div>
          </div>
          <div className="otp-grid" style={{ margin: "20px 0" }}>
            {code.map((d, i) => (
              <input key={i} ref={el => inputRefs.current[i] = el} className="otp-input" maxLength={1} value={d}
                onChange={e => handleDigit(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)} />
            ))}
          </div>
          {submitError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{submitError}</div>}
          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Keep Enabled</button>
            <button className="btn-save" style={{ background: "#ef4444" }} onClick={verify} disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Disable 2FA"}</button>
          </div>
        </>
      ) : step === "choose" ? (
        <>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Choose how you'd like to receive your verification code.</p>
          <div className="tfa-method-list">
            {[{ v: "sms", icon: "📱", label: "SMS", desc: "Sent to +63 917 *** 4567" }, { v: "app", icon: "🔑", label: "Authenticator App", desc: "Google Authenticator, Authy, etc." }].map(m => (
              <div key={m.v} className={`tfa-method-card${method === m.v ? " selected" : ""}`} onClick={() => setMethod(m.v)}>
                <span style={{ fontSize: 24 }}>{m.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{m.desc}</div>
                </div>
                <div className="tfa-radio">{method === m.v && <div className="tfa-radio-dot" />}</div>
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-save" onClick={() => setStep("verify")}>Continue</button>
          </div>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
            {method === "sms" ? "Enter the 6-digit code sent to your phone." : "Enter the 6-digit code from your authenticator app."}
          </p>
          <div className="otp-grid">
            {code.map((d, i) => (
              <input key={i} ref={el => inputRefs.current[i] = el} className="otp-input" maxLength={1} value={d}
                onChange={e => handleDigit(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)} />
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#aaa", margin: "12px 0 20px", textAlign: "center" }}>Didn't receive it? <span style={{ color: "#2a88b5", cursor: "pointer", fontWeight: 600 }}>Resend</span></p>
          {submitError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{submitError}</div>}
          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setStep("choose")}>Back</button>
            <button className="btn-save" onClick={verify} disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Verify & Enable"}</button>
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
          <div className="avatar-cam"><Icon d={icons.camera} size={12} /></div>
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

  return (
    <div className="section-content">
      <h3 className="section-title">My Orders</h3>
      {isLoading && <div style={EMPTY_STATE_STYLE}>Loading orders...</div>}
      {loadError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{loadError}</div>}
      {!isLoading && !loadError && orders.length === 0 && <div style={EMPTY_STATE_STYLE}>No orders yet.</div>}
      <div className="orders-list">
        {orders.map((o) => {
          const rawStatus = String(o.status || "pending").toLowerCase();
          const statusStyle = statusColor[rawStatus] || statusColor.pending;
          return (
          <div key={o.id} className="order-card">
            <div className="order-emoji">📦</div>
            <div className="order-info">
              <div className="order-id">#{o.id}</div>
              <div className="order-meta">{safeDateLabel(o.created_at)}</div>
            </div>
            <div className="order-right">
              <span className="order-status" style={statusStyle}>{formatStatus(rawStatus)}</span>
              <div className="order-total">{formatPeso(o.total_amount)}</div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function WishlistSection() {
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadWishlist = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        if (!customerAPI || typeof customerAPI.getWishlist !== "function") {
          throw new Error("Wishlist API is unavailable.");
        }

        const result = await customerAPI.getWishlist();
        if (!mounted) return;
        setList(Array.isArray(result?.data) ? result.data : []);
      } catch (error) {
        if (!mounted) return;
        setLoadError(error?.message || "Failed to load wishlist.");
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

    try {
      if (!customerAPI || typeof customerAPI.removeFromWishlist !== "function") {
        throw new Error("Wishlist API is unavailable.");
      }
      await customerAPI.removeFromWishlist(productId);
    } catch (error) {
      setList(previous);
      setLoadError(error?.message || "Failed to update wishlist.");
    }
  };

  return (
    <div className="section-content">
      <h3 className="section-title">Wishlist</h3>
      {isLoading && <div style={EMPTY_STATE_STYLE}>Loading wishlist...</div>}
      {loadError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{loadError}</div>}
      {!isLoading && !loadError && list.length === 0 && <div style={EMPTY_STATE_STYLE}>Your wishlist is empty.</div>}
      <div className="wishlist-grid">
        {list.map((item) => (
          <div key={item.wishlist_id || item.product_id} className="wish-card">
            <div className="wish-emoji">❤️</div>
            <div className="wish-name">{item.name}</div>
            <div className="wish-location">📍 {item.location || "SouCul"}</div>
            <div className="wish-footer">
              <span className="wish-price">{formatPeso(item.price)}</span>
              <button className="wish-remove" onClick={() => removeItem(item.product_id)}>✕</button>
            </div>
          </div>
        ))}
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
  const defaultSettings = { orders: true, promos: true, wishlist: false, newsletter: false, sms: true };
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      setIsLoading(true);
      setSaveError("");

      try {
        if (!customerAPI || typeof customerAPI.getNotificationSettings !== "function") {
          return;
        }

        const result = await customerAPI.getNotificationSettings();
        if (!mounted) return;

        if (result?.success && result.data) {
          setSettings((prev) => ({ ...prev, ...result.data }));
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
    </div>
  );
}

// ── Security Section (Enhanced) ────────────────────────────────────────────
function SecuritySection() {
  const [showPassword, setShowPassword] = useState(false);
  const [showTFA, setShowTFA] = useState(false);
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [tfaMethod, setTfaMethod] = useState("sms");
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loginActivity, setLoginActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadSecurityData = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const [securityRes, activityRes, linkedRes] = await Promise.all([
        customerAPI.getSecuritySettings ? customerAPI.getSecuritySettings() : Promise.resolve({ data: {} }),
        customerAPI.getLoginActivity ? customerAPI.getLoginActivity() : Promise.resolve({ data: [] }),
        customerAPI.getLinkedAccounts ? customerAPI.getLinkedAccounts() : Promise.resolve({ data: [] }),
      ]);

      const security = securityRes?.data || {};
      setTfaEnabled(Boolean(security.two_factor_enabled));
      setTfaMethod(security.two_factor_method || "sms");
      setLoginActivity(Array.isArray(activityRes?.data) ? activityRes.data : []);
      setLinkedAccounts(Array.isArray(linkedRes?.data) ? linkedRes.data : []);
    } catch (error) {
      setLoadError(error?.message || "Failed to load security settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  const handlePasswordChange = async ({ current, next, confirm }) => {
    if (!customerAPI || typeof customerAPI.changePassword !== "function") {
      throw new Error("Password API is unavailable.");
    }

    await customerAPI.changePassword(current, next, confirm);
  };

  const handleTwoFactorUpdate = async ({ two_factor_enabled, two_factor_method }) => {
    if (!customerAPI || typeof customerAPI.updateSecuritySettings !== "function") {
      throw new Error("Security settings API is unavailable.");
    }

    await customerAPI.updateSecuritySettings({ two_factor_enabled, two_factor_method });
    setTfaEnabled(Boolean(two_factor_enabled));
    setTfaMethod(two_factor_method || "sms");
  };

  const items = [
    {
      label: "Change Password",
      desc: "Update your account password",
      icon: "🔒",
      action: () => setShowPassword(true),
    },
    {
      label: "Two-Factor Authentication",
      desc: tfaEnabled ? `Enabled via ${tfaMethod === "app" ? "Authenticator App" : "SMS"}` : "Not enabled",
      icon: "📲",
      action: () => setShowTFA(true),
      badge: tfaEnabled ? "ON" : "OFF",
      badgeActive: tfaEnabled,
    },
    {
      label: "Login Activity",
      desc: `${loginActivity.length} recent sign-in${loginActivity.length === 1 ? '' : 's'}`,
      icon: "🖥️",
      action: () => {},
    },
    {
      label: "Linked Accounts",
      desc: linkedAccounts.length > 0
        ? linkedAccounts.map((a) => a.provider).join(", ")
        : "No linked accounts",
      icon: "🔗",
      action: () => {},
    },
  ];

  return (
    <div className="section-content">
      <h3 className="section-title">Security</h3>
      {isLoading && <div style={EMPTY_STATE_STYLE}>Loading security settings...</div>}
      {loadError && <div className="auth-msg auth-msg-error" style={{ marginBottom: 12 }}>{loadError}</div>}
      <div className="security-list">
        {items.map(({ label, desc, icon, action, badge, badgeActive }) => (
          <div key={label} className="security-row" onClick={action}>
            <span className="security-icon">{icon}</span>
            <div className="security-info">
              <div className="security-label">{label}</div>
              <div className="security-desc">{desc}</div>
            </div>
            {badge ? (
              <span className={`security-badge${badgeActive ? " badge-on" : " badge-off"}`}>{badge}</span>
            ) : (
              <Icon d={icons.chevron} size={18} />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="section-title" style={{ fontSize: 16, marginBottom: 10 }}>Recent Login Activity</div>
        {loginActivity.length === 0 && <div style={EMPTY_STATE_STYLE}>No recent login activity.</div>}
        <div className="orders-list">
          {loginActivity.slice(0, 5).map((entry) => (
            <div key={entry.id} className="order-card">
              <div className="order-emoji">🔐</div>
              <div className="order-info">
                <div className="order-id">{entry.title || 'Login detected'}</div>
                <div className="order-meta">{safeDateLabel(entry.created_at)}</div>
              </div>
              <div className="order-right">
                <div className="order-total" style={{ fontSize: 12, color: '#6a7a8a' }}>{entry.message || 'Successful sign in'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPassword && (
        <ChangePasswordModal
          onClose={() => setShowPassword(false)}
          onSubmit={handlePasswordChange}
        />
      )}
      {showTFA && (
        <TwoFAModal
          enabled={tfaEnabled}
          onComplete={handleTwoFactorUpdate}
          onClose={() => setShowTFA(false)}
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
          <div className="form-group full">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
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
        .order-card { display: flex; align-items: center; gap: 16px; padding: 16px; border: 1.5px solid #dbeaf2; border-radius: 12px; transition: border .2s; }
        .order-card:hover { border-color: #6dcbeb; }
        .order-emoji { font-size: 28px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #eef6fb; border-radius: 10px; }
        .order-info { flex: 1; }
        .order-id { font-weight: 600; font-size: 14px; }
        .order-meta { font-size: 12px; color: #aaa; margin-top: 2px; }
        .order-right { text-align: right; }
        .order-status { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
        .order-total { font-weight: 700; font-size: 15px; margin-top: 4px; color: #2a88b5; }

        /* ── Wishlist ── */
        .wishlist-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .wish-card { padding: 16px; border: 1.5px solid #dbeaf2; border-radius: 12px; }
        .wish-emoji { font-size: 32px; margin-bottom: 8px; }
        .wish-name { font-weight: 600; font-size: 14px; }
        .wish-location { font-size: 12px; color: #aaa; margin: 4px 0 10px; }
        .wish-footer { display: flex; align-items: center; justify-content: space-between; }
        .wish-price { font-weight: 700; color: #2a88b5; }
        .wish-remove { background: none; border: none; cursor: pointer; color: #ccc; font-size: 14px; }
        .wish-remove:hover { color: #e53e3e; }

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
          .wishlist-grid { grid-template-columns: 1fr; }
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
