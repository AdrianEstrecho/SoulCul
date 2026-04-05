import { useState, useRef, useEffect } from "react";
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

// ── Mock Data ──────────────────────────────────────────────────────────────
const mockOrders = [
  { id: "#ORD-2841", date: "Mar 20, 2026", status: "Delivered", total: 2350, items: 2, img: "🧵" },
  { id: "#ORD-2790", date: "Mar 12, 2026", status: "In Transit", total: 999, items: 1, img: "👕" },
  { id: "#ORD-2744", date: "Feb 28, 2026", status: "Processing", total: 4500, items: 3, img: "🎁" },
];

const mockWishlist = [
  { id: 1, name: "Inabel Weave Blazer", price: 3200, location: "Vigan", emoji: "🧥" },
  { id: 2, name: "Burnay Print Dress", price: 1800, location: "Ilocos", emoji: "👗" },
  { id: 3, name: "Cordillera Wrap Skirt", price: 1250, location: "Baguio", emoji: "🩱" },
];

const mockAddresses = [
  { id: 1, label: "Home", address: "123 Calle Crisologo, Vigan City, Ilocos Sur 2700", default: true },
  { id: 2, label: "Office", address: "45 Session Road, Baguio City, Benguet 2600", default: false },
];

const statusColor = {
  Delivered: { bg: "#d1fae5", color: "#065f46" },
  "In Transit": { bg: "#dbeafe", color: "#1e40af" },
  Processing: { bg: "#fef3c7", color: "#92400e" },
};

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
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
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
        {preview && preview !== currentPhoto && (
          <button className="photo-remove-btn" onClick={() => setPreview(null)}>Remove photo</button>
        )}
      </div>
      <div className="modal-actions" style={{ marginTop: 16 }}>
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-save" onClick={() => { onSave(preview); onClose(); }}>Save Photo</button>
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

  const isCard = type === "visa";
  const isPhone = type === "gcash" || type === "maya";
  const isEmail = type === "paypal";

  const formatCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const handleSubmit = () => {
    const selected = PAYMENT_TYPES.find(t => t.value === type);
    let meta = "";
    if (isCard) meta = `ending in ${cardNum.replace(/\s/g, "").slice(-4)} · Exp ${expiry}`;
    if (isPhone) meta = phone;
    if (isEmail) meta = email;
    onSave({ icon: selected.icon, name: selected.label, meta, active: false });
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

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit}>Add Method</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Change Password Modal ─────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.current) e.current = "Required";
    if (form.next.length < 8) e.next = "Must be at least 8 characters";
    if (form.next !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSuccess(true);
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
                      <div key={n} className="strength-segment" style={{ background: n <= strength ? strengthColor : "#e5ddd5" }} />
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
          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-save" onClick={handleSubmit}>Update Password</button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ── 2FA Modal ─────────────────────────────────────────────────────────────
function TwoFAModal({ enabled, onClose }) {
  const [step, setStep] = useState(enabled ? "disable" : "choose");
  const [method, setMethod] = useState("sms");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [done, setDone] = useState(false);
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

  const verify = () => {
    if (code.join("").length === 6) setDone(true);
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
          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Keep Enabled</button>
            <button className="btn-save" style={{ background: "#ef4444" }} onClick={verify}>Disable 2FA</button>
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
          <p style={{ fontSize: 12, color: "#aaa", margin: "12px 0 20px", textAlign: "center" }}>Didn't receive it? <span style={{ color: "#7c4a2d", cursor: "pointer", fontWeight: 600 }}>Resend</span></p>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setStep("choose")}>Back</button>
            <button className="btn-save" onClick={verify}>Verify & Enable</button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ── Profile Details Section ────────────────────────────────────────────────
function ProfileDetailsSection({ user, photo, onEdit, onChangePhoto }) {
  const initials = user.name.split(" ").map(n => n[0]).join("");
  const details = [
    { label: "Full Name", value: user.name, emoji: "👤" },
    { label: "Email Address", value: user.email, emoji: "✉️" },
    { label: "Phone Number", value: user.phone, emoji: "📞" },
    { label: "Birthday", value: new Date(user.birthday).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }), emoji: "🎂" },
    { label: "Gender", value: user.gender, emoji: "🧬" },
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
          <div className="pd-avatar-name">{user.name}</div>
          <div className="pd-avatar-sub">Member since January 2024</div>
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
        <div className="pd-strip-item"><div className="pd-strip-num">12</div><div className="pd-strip-label">Total Orders</div></div>
        <div className="pd-strip-divider" />
        <div className="pd-strip-item"><div className="pd-strip-num">3</div><div className="pd-strip-label">Wishlist Items</div></div>
        <div className="pd-strip-divider" />
        <div className="pd-strip-item"><div className="pd-strip-num">8</div><div className="pd-strip-label">Reviews Given</div></div>
        <div className="pd-strip-divider" />
        <div className="pd-strip-item"><div className="pd-strip-num">₱12,450</div><div className="pd-strip-label">Total Spent</div></div>
      </div>
    </div>
  );
}

// ── Other Sections ─────────────────────────────────────────────────────────
function OrdersSection() {
  return (
    <div className="section-content">
      <h3 className="section-title">My Orders</h3>
      <div className="orders-list">
        {mockOrders.map((o) => (
          <div key={o.id} className="order-card">
            <div className="order-emoji">{o.img}</div>
            <div className="order-info">
              <div className="order-id">{o.id}</div>
              <div className="order-meta">{o.date} · {o.items} item{o.items > 1 ? "s" : ""}</div>
            </div>
            <div className="order-right">
              <span className="order-status" style={statusColor[o.status]}>{o.status}</span>
              <div className="order-total">₱{o.total.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WishlistSection() {
  const [list, setList] = useState(mockWishlist);
  return (
    <div className="section-content">
      <h3 className="section-title">Wishlist</h3>
      <div className="wishlist-grid">
        {list.map((item) => (
          <div key={item.id} className="wish-card">
            <div className="wish-emoji">{item.emoji}</div>
            <div className="wish-name">{item.name}</div>
            <div className="wish-location">📍 {item.location}</div>
            <div className="wish-footer">
              <span className="wish-price">₱{item.price.toLocaleString()}</span>
              <button className="wish-remove" onClick={() => setList(l => l.filter(x => x.id !== item.id))}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddressSection() {
  const [addresses, setAddresses] = useState(mockAddresses);
  return (
    <div className="section-content">
      <h3 className="section-title">Saved Addresses</h3>
      <div className="address-list">
        {addresses.map((a) => (
          <div key={a.id} className={`address-card${a.default ? " address-default" : ""}`}>
            <div className="address-label-row">
              <span className="address-label">{a.label}</span>
              {a.default && <span className="default-badge">Default</span>}
            </div>
            <div className="address-text">{a.address}</div>
            <div className="address-actions">
              {!a.default && (
                <button className="addr-btn" onClick={() => setAddresses(list => list.map(x => ({ ...x, default: x.id === a.id })))}>Set as Default</button>
              )}
              <button className="addr-btn addr-btn-danger" onClick={() => setAddresses(l => l.filter(x => x.id !== a.id))}>Remove</button>
            </div>
          </div>
        ))}
        <button className="add-address-btn">+ Add New Address</button>
      </div>
    </div>
  );
}

// ── Payment Section (Enhanced) ─────────────────────────────────────────────
function PaymentSection() {
  const [methods, setMethods] = useState([
    { id: 1, icon: "💳", name: "Visa", meta: "ending in 4242 · Exp 08/28", active: true },
    { id: 2, icon: "📱", name: "GCash", meta: "+63 917 *** 8901", active: false },
    { id: 3, icon: "🏦", name: "Maya", meta: "+63 926 *** 1122", active: false },
  ]);
  const [showModal, setShowModal] = useState(false);

  const handleAdd = (method) => {
    setMethods(m => [...m, { ...method, id: Date.now() }]);
  };

  const handleSetDefault = (id) => {
    setMethods(m => m.map(x => ({ ...x, active: x.id === id })));
  };

  const handleRemove = (id) => {
    setMethods(m => m.filter(x => x.id !== id));
  };

  return (
    <div className="section-content">
      <h3 className="section-title">Payment Methods</h3>
      <div className="payment-list">
        {methods.map(({ id, icon, name, meta, active }) => (
          <div key={id} className={`payment-card${active ? " payment-active" : ""}`}>
            <div className="payment-icon">{icon}</div>
            <div className="payment-info">
              <div className="payment-name">{name}</div>
              <div className="payment-meta">
                {meta}
                {active && <span className="default-badge" style={{ marginLeft: 6 }}>Default</span>}
              </div>
            </div>
            <div className="payment-actions">
              {!active && (
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
  const [settings, setSettings] = useState({ orders: true, promos: true, wishlist: false, newsletter: false, sms: true });
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
      <div className="notif-list">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="notif-row">
            <div><div className="notif-label">{label}</div><div className="notif-desc">{desc}</div></div>
            <div className={`toggle${settings[key] ? " on" : ""}`} onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}>
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
  const [tfaEnabled, setTfaEnabled] = useState(true);

  const items = [
    {
      label: "Change Password",
      desc: "Last changed 3 months ago",
      icon: "🔒",
      action: () => setShowPassword(true),
    },
    {
      label: "Two-Factor Authentication",
      desc: tfaEnabled ? "Enabled via SMS" : "Not enabled",
      icon: "📲",
      action: () => setShowTFA(true),
      badge: tfaEnabled ? "ON" : "OFF",
      badgeActive: tfaEnabled,
    },
    {
      label: "Login Activity",
      desc: "View recent sessions",
      icon: "🖥️",
      action: () => {},
    },
    {
      label: "Linked Accounts",
      desc: "Google, Facebook",
      icon: "🔗",
      action: () => {},
    },
  ];

  return (
    <div className="section-content">
      <h3 className="section-title">Security</h3>
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

      {showPassword && (
        <ChangePasswordModal onClose={() => setShowPassword(false)} />
      )}
      {showTFA && (
        <TwoFAModal
          enabled={tfaEnabled}
          onClose={() => {
            setTfaEnabled(e => !e);
            setShowTFA(false);
          }}
        />
      )}
    </div>
  );
}

function ReviewsSection() {
  return (
    <div className="section-content">
      <h3 className="section-title">My Reviews</h3>
      <div className="reviews-list">
        {[
          { product: "Barong Tagalog", rating: 5, date: "Mar 21, 2026", comment: "Absolutely beautiful craftsmanship. The fabric is light and the embroidery is stunning." },
          { product: "Inabel Shirt", rating: 4, date: "Mar 5, 2026", comment: "Great quality weave. Runs slightly small so size up." },
        ].map((r, i) => (
          <div key={i} className="review-card">
            <div className="review-header">
              <div className="review-product">{r.product}</div>
              <div className="review-date">{r.date}</div>
            </div>
            <div className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            <div className="review-comment">{r.comment}</div>
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
export default function Profile({ userProfile, onUpdateProfile, cartCount = 0, isLoggedIn, onLogout }) {
  const navigate = useNavigate();
  const [active, setActive] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const user = userProfile;
  const setUser = onUpdateProfile;
  const [draft, setDraft] = useState(user);

  const initials = user.name.split(" ").map(n => n[0]).join("");
  
  const handleSave = async () => {
    setIsLoading(true);
    setSaveError(null);
    
    try {
      const [firstName, ...lastNameParts] = draft.name.split(" ");
      const lastName = lastNameParts.join(" ");
      
      const updateData = {
        first_name: firstName,
        last_name: lastName,
        phone: draft.phone,
        birthday: draft.birthday,
        gender: draft.gender,
      };
      
      const result = await customerAPI.updateProfile(updateData);
      
      if (result.success) {
        setUser(draft);
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
        <div className="form-actions">
          <button className="btn-cancel" onClick={() => { setDraft(user); setEditMode(false); }}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    );

    switch (active) {
      case "profile": return <ProfileDetailsSection user={user} photo={photo} onEdit={() => setEditMode(true)} onChangePhoto={() => setShowPhotoModal(true)} />;
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

        .profile-page { min-height: 100vh; background: #f7f3ef; font-family: 'DM Sans', sans-serif; color: #1a1208; }

        .profile-banner {
          background: linear-gradient(135deg, #3d2b1f 0%, #7c4a2d 50%, #c17f4a 100%);
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
        .avatar-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #c17f4a, #7c4a2d); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 28px; color: #fff; flex-shrink: 0; position: relative; cursor: pointer; overflow: hidden; }
        .avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-cam { position: absolute; bottom: 0; right: 0; width: 24px; height: 24px; background: #1a1208; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; }
        .avatar-info { flex: 1; min-width: 120px; }
        .avatar-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; }
        .avatar-email { font-size: 14px; color: #888; margin-top: 2px; }
        .avatar-stats { display: flex; gap: 24px; }
        .stat-item { text-align: center; }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #7c4a2d; }
        .stat-label { font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 1px; }
        .edit-btn { display: flex; align-items: center; gap: 6px; padding: 8px 18px; background: #f7f3ef; border: 1.5px solid #e5ddd5; border-radius: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #3d2b1f; transition: all .2s; }
        .edit-btn:hover { background: #ede6dd; }

        .profile-layout { max-width: 920px; margin: 24px auto; padding: 0 24px 60px; display: grid; grid-template-columns: 220px 1fr; gap: 20px; }

        .sidebar { background: #fff; border-radius: 16px; padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); height: fit-content; position: sticky; top: 90px; }
        .sidebar-nav-item { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; color: #666; transition: all .2s; margin-bottom: 2px; }
        .sidebar-nav-item:hover { background: #f7f3ef; color: #3d2b1f; }
        .sidebar-nav-item.active { background: linear-gradient(135deg, #7c4a2d, #c17f4a); color: #fff; }
        .sidebar-divider { height: 1px; background: #f0ebe4; margin: 10px 0; }
        .sidebar-logout { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; color: #e53e3e; transition: background .2s; }
        .sidebar-logout:hover { background: #fff5f5; }

        .main-panel { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden; }

        /* ── Modal ── */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(2px); }
        .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; overflow-x: hidden; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
        .modal-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; }
        .modal-close { width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid #e5ddd5; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #888; transition: all .2s; }
        .modal-close:hover { background: #f7f3ef; color: #1a1208; }
        .modal-body { padding: 20px 24px 24px; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }

        /* ── Change Photo ── */
        .photo-drop-zone { border: 2px dashed #e5ddd5; border-radius: 16px; cursor: pointer; position: relative; overflow: hidden; width: 180px; height: 180px; flex-shrink: 0; margin: 0 auto 0; display: flex; align-items: center; justify-content: center; background: #faf8f5; transition: border-color .2s; }
        .photo-drop-zone.dragging { border-color: #c17f4a; background: #fdf6ee; }
        .photo-drop-zone:hover .photo-drop-overlay { opacity: 1; }
        .photo-preview-img { width: 100%; height: 100%; object-fit: cover; }
        .photo-placeholder { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #c17f4a, #7c4a2d); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 28px; color: #fff; }
        .photo-drop-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #fff; font-size: 13px; font-weight: 500; opacity: 0; transition: opacity .2s; }
        .photo-modal-content { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .photo-hint { text-align: center; font-size: 12px; color: #aaa; }
        .photo-remove-btn { background: none; border: none; color: #e53e3e; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; }

        /* ── Payment Type Grid ── */
        .payment-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
        .payment-type-btn { display: flex; flex-direction: column; align-items: center; padding: 14px 10px; border: 2px solid #e5ddd5; border-radius: 12px; cursor: pointer; transition: all .2s; }
        .payment-type-btn.selected { border-color: #c17f4a; background: #fdf6ee; }

        /* ── Password ── */
        .pw-input-wrap { position: relative; }
        .pw-input { padding-right: 44px !important; }
        .pw-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #aaa; padding: 4px; display: flex; align-items: center; }
        .pw-eye:hover { color: #7c4a2d; }
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
        .tfa-method-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 2px solid #e5ddd5; border-radius: 12px; cursor: pointer; transition: all .2s; }
        .tfa-method-card.selected { border-color: #c17f4a; background: #fdf6ee; }
        .tfa-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #e5ddd5; margin-left: auto; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tfa-method-card.selected .tfa-radio { border-color: #c17f4a; }
        .tfa-radio-dot { width: 10px; height: 10px; border-radius: 50%; background: #c17f4a; }
        .otp-grid { display: flex; gap: 8px; justify-content: center; }
        .otp-input { width: 44px; height: 52px; border: 2px solid #e5ddd5; border-radius: 12px; text-align: center; font-size: 20px; font-weight: 700; font-family: 'Playfair Display', serif; color: #1a1208; background: #faf8f5; outline: none; transition: border .2s; }
        .otp-input:focus { border-color: #c17f4a; background: #fff; }

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
        .form-input { padding: 11px 14px; border: 1.5px solid #e5ddd5; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1208; background: #faf8f5; outline: none; transition: border .2s; width: 100%; }
        .form-input:focus { border-color: #c17f4a; background: #fff; }
        .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .btn-save { padding: 10px 24px; background: linear-gradient(135deg, #7c4a2d, #c17f4a); color: #fff; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity .2s; }
        .btn-save:hover { opacity: .9; }
        .btn-cancel { padding: 10px 20px; background: #f7f3ef; border: 1.5px solid #e5ddd5; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; color: #666; }

        /* ── Section ── */
        .section-content { padding: 32px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 20px; margin-bottom: 20px; }

        /* ── Profile Details ── */
        .pd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .pd-avatar-block { display: flex; align-items: center; gap: 18px; background: #fdf9f5; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; border: 1.5px solid #f0ebe4; }
        .pd-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #c17f4a, #7c4a2d); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 22px; color: #fff; flex-shrink: 0; position: relative; cursor: pointer; overflow: hidden; }
        .pd-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .pd-avatar-name { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; }
        .pd-avatar-sub { font-size: 12px; color: #aaa; margin-top: 3px; }
        .change-photo-link { background: none; border: none; color: #7c4a2d; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; margin-top: 6px; padding: 0; text-decoration: underline; }
        .pd-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .pd-detail-card { display: flex; align-items: center; gap: 14px; padding: 16px; border: 1.5px solid #f0ebe4; border-radius: 14px; background: #fafaf8; transition: border .2s; }
        .pd-detail-card:hover { border-color: #c17f4a; }
        .pd-detail-emoji { font-size: 22px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); flex-shrink: 0; }
        .pd-detail-label { font-size: 11px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 4px; }
        .pd-detail-value { font-size: 14px; font-weight: 600; color: #1a1208; }
        .pd-account-strip { display: flex; align-items: center; background: linear-gradient(135deg, #3d2b1f, #7c4a2d); border-radius: 14px; padding: 20px 24px; }
        .pd-strip-item { flex: 1; text-align: center; }
        .pd-strip-num { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #fff; }
        .pd-strip-label { font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: .8px; margin-top: 2px; }
        .pd-strip-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.15); flex-shrink: 0; }

        /* ── Orders ── */
        .orders-list { display: flex; flex-direction: column; gap: 12px; }
        .order-card { display: flex; align-items: center; gap: 16px; padding: 16px; border: 1.5px solid #f0ebe4; border-radius: 12px; transition: border .2s; }
        .order-card:hover { border-color: #c17f4a; }
        .order-emoji { font-size: 28px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #f7f3ef; border-radius: 10px; }
        .order-info { flex: 1; }
        .order-id { font-weight: 600; font-size: 14px; }
        .order-meta { font-size: 12px; color: #aaa; margin-top: 2px; }
        .order-right { text-align: right; }
        .order-status { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
        .order-total { font-weight: 700; font-size: 15px; margin-top: 4px; color: #7c4a2d; }

        /* ── Wishlist ── */
        .wishlist-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .wish-card { padding: 16px; border: 1.5px solid #f0ebe4; border-radius: 12px; }
        .wish-emoji { font-size: 32px; margin-bottom: 8px; }
        .wish-name { font-weight: 600; font-size: 14px; }
        .wish-location { font-size: 12px; color: #aaa; margin: 4px 0 10px; }
        .wish-footer { display: flex; align-items: center; justify-content: space-between; }
        .wish-price { font-weight: 700; color: #7c4a2d; }
        .wish-remove { background: none; border: none; cursor: pointer; color: #ccc; font-size: 14px; }
        .wish-remove:hover { color: #e53e3e; }

        /* ── Addresses ── */
        .address-list { display: flex; flex-direction: column; gap: 12px; }
        .address-card { padding: 16px; border: 1.5px solid #f0ebe4; border-radius: 12px; }
        .address-default { border-color: #c17f4a; background: #fdf9f5; }
        .address-label-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .address-label { font-weight: 700; font-size: 13px; }
        .default-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #fde8cc; color: #7c4a2d; }
        .address-text { font-size: 13px; color: #666; line-height: 1.5; }
        .address-actions { display: flex; gap: 8px; margin-top: 10px; }
        .addr-btn { font-size: 12px; font-weight: 500; padding: 5px 12px; border: 1.5px solid #e5ddd5; border-radius: 8px; background: none; cursor: pointer; color: #555; display: flex; align-items: center; gap: 4px; }
        .addr-btn-danger { color: #e53e3e; border-color: #fecaca; }
        .add-address-btn { margin-top: 4px; width: 100%; padding: 12px; border: 2px dashed #e5ddd5; border-radius: 12px; background: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #aaa; cursor: pointer; transition: all .2s; }
        .add-address-btn:hover { border-color: #c17f4a; color: #7c4a2d; }

        /* ── Payment ── */
        .payment-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
        .payment-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1.5px solid #f0ebe4; border-radius: 12px; flex-wrap: wrap; }
        .payment-active { border-color: #c17f4a; background: #fdf9f5; }
        .payment-icon { font-size: 24px; }
        .payment-info { flex: 1; min-width: 120px; }
        .payment-name { font-weight: 600; font-size: 14px; }
        .payment-meta { font-size: 12px; color: #aaa; margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .payment-actions { display: flex; gap: 6px; align-items: center; }

        /* ── Notifications ── */
        .notif-list { display: flex; flex-direction: column; gap: 4px; }
        .notif-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f5f0ea; }
        .notif-label { font-weight: 500; font-size: 14px; }
        .notif-desc { font-size: 12px; color: #aaa; margin-top: 2px; }
        .toggle { width: 44px; height: 24px; border-radius: 12px; background: #e5ddd5; cursor: pointer; position: relative; transition: background .25s; flex-shrink: 0; }
        .toggle.on { background: linear-gradient(135deg, #7c4a2d, #c17f4a); }
        .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .25s; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
        .toggle.on .toggle-thumb { transform: translateX(20px); }

        /* ── Security ── */
        .security-list { display: flex; flex-direction: column; gap: 4px; }
        .security-row { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid #f5f0ea; cursor: pointer; }
        .security-row:hover .security-label { color: #7c4a2d; }
        .security-icon { font-size: 20px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #f7f3ef; border-radius: 8px; flex-shrink: 0; }
        .security-info { flex: 1; }
        .security-label { font-weight: 500; font-size: 14px; }
        .security-desc { font-size: 12px; color: #aaa; margin-top: 1px; }

        /* ── Reviews ── */
        .reviews-list { display: flex; flex-direction: column; gap: 14px; }
        .review-card { padding: 16px; border: 1.5px solid #f0ebe4; border-radius: 12px; }
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
          <div className="banner-greeting">Welcome back, {user.name.split(" ")[0]} 👋</div>
        </div>

        <div className="avatar-card">
          <div className="avatar-inner">
            <div className="avatar-circle" onClick={() => setShowPhotoModal(true)}>
              {photo ? <img src={photo} alt="avatar" /> : user.name.split(" ").map(n => n[0]).join("")}
              <div className="avatar-cam"><Icon d={icons.camera} size={12} /></div>
            </div>
            <div className="avatar-info">
              <div className="avatar-name">{user.name}</div>
              <div className="avatar-email">{user.email}</div>
            </div>
            <div className="avatar-stats">
              <div className="stat-item"><div className="stat-num">12</div><div className="stat-label">Orders</div></div>
              <div className="stat-item"><div className="stat-num">3</div><div className="stat-label">Wishlist</div></div>
              <div className="stat-item"><div className="stat-num">8</div><div className="stat-label">Reviews</div></div>
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
          onSave={setPhoto}
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
