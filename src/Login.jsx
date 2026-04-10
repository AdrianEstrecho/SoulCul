import { useState } from "react";
import { useNavigate } from "react-router-dom";
import mapBg from "./assets/mapbg.png";

const PW_RULES = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { key: "number", label: "One number", test: (v) => /[0-9]/.test(v) },
  { key: "special", label: "One special character (!@#$%^&*)", test: (v) => /[!@#$%^&*]/.test(v) },
];

export default function Login({ onLogin, onGuestLogin }) {
  const navigate = useNavigate();
  const [view, setView] = useState("login"); // "login" | "signup"
  const [showForgot, setShowForgot] = useState(false);
  const [showTos, setShowTos] = useState(false);

  // Login state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });
  const [loginErrors, setLoginErrors] = useState({});
  const [loginMsg, setLoginMsg] = useState(null);
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Signup state
  const [signupForm, setSignupForm] = useState({
    firstName: "", lastName: "", email: "", password: "", confirm: "",
  });
  const [signupErrors, setSignupErrors] = useState({});
  const [signupMsg, setSignupMsg] = useState(null);
  const [termsChecked, setTermsChecked] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotMsg, setForgotMsg] = useState(null);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const switchToSignup = () => {
    setView("signup");
    setLoginForm({ username: "", password: "" });
    setLoginErrors({});
    setLoginMsg(null);
  };

  const switchToLogin = () => {
    setView("login");
    setSignupForm({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
    setSignupErrors({});
    setSignupMsg(null);
    setTermsChecked(false);
  };

  // ── Login ──
  const handleLogin = async () => {
    const errors = {};
    if (!loginForm.username.trim()) errors.username = "Email is required.";
    if (!loginForm.password) errors.password = "Password is required.";
    setLoginErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      setLoginMsg({ type: "info", text: "Logging in..." });
      const api = window.CustomerAPI;
      const result = await api.login(loginForm.username.trim(), loginForm.password);

      if (result.success) {
        setLoginMsg({ type: "success", text: "Login successful! Redirecting..." });
        if (onLogin) {
          onLogin({
            name: (result.data.user?.first_name || '') + " " + (result.data.user?.last_name || ''),
            email: result.data.user?.email || "",
            phone: "",
            birthday: "",
            gender: "",
            profileImage: result.data.user?.profile_image_url || "",
          });
        }
        setTimeout(() => navigate("/"), 1200);
      } else {
        setLoginMsg({ type: "error", text: result.message || "Login failed." });
      }
    } catch (error) {
      setLoginMsg({ type: "error", text: "Invalid email or password." });
    }
  };

  // ── Signup ──
  const handleSignup = async () => {
    const { firstName, lastName, email, password, confirm } = signupForm;
    const errors = {};

    if (!firstName.trim()) errors.firstName = "First name is required.";
    else if (!/^[a-zA-Z\s'-]+$/.test(firstName)) errors.firstName = "First name contains invalid characters.";

    if (!lastName.trim()) errors.lastName = "Last name is required.";
    else if (!/^[a-zA-Z\s'-]+$/.test(lastName)) errors.lastName = "Last name contains invalid characters.";

    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";

    if (!password) errors.password = "Password is required.";
    else if (!PW_RULES.every((r) => r.test(password))) errors.password = "Password does not meet all requirements.";

    if (!confirm) errors.confirm = "Please confirm your password.";
    else if (confirm !== password) errors.confirm = "Passwords do not match.";

    if (!termsChecked) errors.terms = "You must agree to the Terms & Conditions.";

    setSignupErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      setSignupMsg({ type: "info", text: "Creating account..." });
      const api = window.CustomerAPI;
      const result = await api.register(firstName.trim(), lastName.trim(), email.trim(), password);

      if (result.success) {
        setSignupMsg({ type: "success", text: "Account created successfully! Redirecting to login..." });
        setTimeout(() => switchToLogin(), 1600);
      } else {
        setSignupMsg({ type: "error", text: result.message || "Registration failed." });
      }
    } catch (error) {
      setSignupMsg({ type: "error", text: "Registration failed. Please try again." });
    }
  };

  // ── Forgot ──
  const handleForgot = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setForgotError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) { setForgotError("Please enter a valid email address."); return; }
    setForgotError("");
    setForgotMsg({ type: "success", text: "If this email exists, a reset link will be sent." });
  };

  return (
    <div className="auth-page">
      <img src={mapBg} alt="" className="auth-bg" />

      {/* ── Back button (rendered outside card wrappers so the wrapper's
            transform animation doesn't reposition the fixed button) ── */}
      <button
        className="auth-back-btn"
        onClick={view === "signup" ? switchToLogin : handleBack}
        aria-label={view === "signup" ? "Back to login" : "Go back"}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        <span>Back</span>
      </button>

      {/* ── Login Card ── */}
      {view === "login" && (
        <div className="auth-card-wrapper auth-fade-in">
          <div className="auth-logo">S</div>
          <div className="auth-card">
            <h2 className="auth-title">Welcome</h2>
            <p className="auth-subtitle">Login to open your account</p>

            {loginMsg && <div className={`auth-msg auth-msg-${loginMsg.type}`}>{loginMsg.text}</div>}

            <div className="auth-input-group">
              <span className="auth-icon-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input
                type="email" placeholder="Email Address"
                className={loginErrors.username ? "auth-error-field" : ""}
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            {loginErrors.username && <span className="auth-field-error">{loginErrors.username}</span>}

            <div className="auth-input-group">
              <span className="auth-icon-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                type={showLoginPw ? "text" : "password"} placeholder="Password"
                className={loginErrors.password ? "auth-error-field" : ""}
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <span className="auth-icon-right" onClick={() => setShowLoginPw(!showLoginPw)}>
                {showLoginPw ? "Hide" : "Show"}
              </span>
            </div>
            {loginErrors.password && <span className="auth-field-error">{loginErrors.password}</span>}

            <div className="auth-options">
              <a onClick={() => { setShowForgot(true); setForgotEmail(""); setForgotError(""); setForgotMsg(null); }}>Forget Password?</a>
            </div>

            <div className="auth-btn-row">
              <button className="auth-btn auth-btn-outline" onClick={switchToSignup}>SIGN UP</button>
              <button className="auth-btn auth-btn-solid" onClick={handleLogin}>LOG IN</button>
            </div>

            <div className="auth-footer-text" style={{ marginTop: 14 }}>
              <a onClick={() => { if (onGuestLogin) { onGuestLogin(); navigate("/"); } }}>Continue as Guest</a>
            </div>
          </div>
        </div>
      )}

      {/* ── Signup Card ── */}
      {view === "signup" && (
        <div className="auth-card-wrapper auth-fade-in">
          <div className="auth-logo">S</div>
          <div className="auth-card">
            <h2 className="auth-title">Welcome</h2>
            <p className="auth-subtitle">Sign Up to open your account</p>

            {signupMsg && <div className={`auth-msg auth-msg-${signupMsg.type}`}>{signupMsg.text}</div>}

            <div className="auth-input-group">
              <span className="auth-icon-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input type="text" placeholder="First Name" className={signupErrors.firstName ? "auth-error-field" : ""}
                value={signupForm.firstName} onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })} />
            </div>
            {signupErrors.firstName && <span className="auth-field-error">{signupErrors.firstName}</span>}

            <div className="auth-input-group">
              <span className="auth-icon-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input type="text" placeholder="Last Name" className={signupErrors.lastName ? "auth-error-field" : ""}
                value={signupForm.lastName} onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })} />
            </div>
            {signupErrors.lastName && <span className="auth-field-error">{signupErrors.lastName}</span>}

            <div className="auth-input-group">
              <span className="auth-icon-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg>
              </span>
              <input type="email" placeholder="Email Address" className={signupErrors.email ? "auth-error-field" : ""}
                value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
            </div>
            {signupErrors.email && <span className="auth-field-error">{signupErrors.email}</span>}

            <div className="auth-input-group">
              <span className="auth-icon-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input type={showSignupPw ? "text" : "password"} placeholder="Password"
                className={signupErrors.password ? "auth-error-field" : ""}
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
              <span className="auth-icon-right" onClick={() => setShowSignupPw(!showSignupPw)}>
                {showSignupPw ? "Hide" : "Show"}
              </span>
            </div>
            {signupErrors.password && <span className="auth-field-error">{signupErrors.password}</span>}

            <div className="auth-pw-requirements">
              <p>Password must contain:</p>
              {PW_RULES.map((r) => (
                <div key={r.key} className={`auth-pw-req-item${r.test(signupForm.password) ? " met" : ""}`}>
                  <span className="auth-req-dot" />
                  {r.label}
                </div>
              ))}
            </div>

            <div className="auth-input-group">
              <span className="auth-icon-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input type={showConfirmPw ? "text" : "password"} placeholder="Confirm Password"
                className={signupErrors.confirm ? "auth-error-field" : ""}
                value={signupForm.confirm}
                onChange={(e) => setSignupForm({ ...signupForm, confirm: e.target.value })} />
              <span className="auth-icon-right" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                {showConfirmPw ? "Hide" : "Show"}
              </span>
            </div>
            {signupErrors.confirm && <span className="auth-field-error">{signupErrors.confirm}</span>}

            <label className="auth-terms" onClick={() => setTermsChecked(!termsChecked)}>
              <span className={`auth-circle-check${termsChecked ? " checked" : ""}`} />
              <span>I agree to the <a onClick={(e) => { e.stopPropagation(); setShowTos(true); }}>Terms & Conditions</a></span>
            </label>
            {signupErrors.terms && <span className="auth-field-error">{signupErrors.terms}</span>}

            <button className="auth-btn-full" onClick={handleSignup}>SIGN UP</button>
            <div className="auth-footer-text">
              Already have an Account? <a onClick={switchToLogin}>Login</a>
            </div>
          </div>
        </div>
      )}

      {/* ── Forgot Password Modal ── */}
      {showForgot && (
        <div className="auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForgot(false)}>
          <div className="auth-modal-wrapper auth-fade-in">
            <div className="auth-logo">S</div>
            <div className="auth-modal-card">
              <span className="auth-modal-close" onClick={() => setShowForgot(false)}>&times;</span>
              <h2 className="auth-title">Forgot Password</h2>
              <p className="auth-subtitle">Enter your email to reset your password</p>
              <form onSubmit={handleForgot}>
                <div className="auth-input-group">
                  <span className="auth-icon-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg>
                  </span>
                  <input type="email" placeholder="Email Address"
                    className={forgotError ? "auth-error-field" : ""}
                    value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                </div>
                {forgotError && <span className="auth-field-error">{forgotError}</span>}
                {forgotMsg && <div className={`auth-msg auth-msg-${forgotMsg.type}`}>{forgotMsg.text}</div>}
                <button className="auth-btn-full" type="submit" style={{ marginTop: 0 }}>Send Reset Link</button>
              </form>
              <div className="auth-footer-text" style={{ marginTop: 14 }}>
                Remembered? <a onClick={() => setShowForgot(false)}>Back to Login</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Terms & Conditions Modal ── */}
      {showTos && (
        <div className="auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowTos(false)}>
          <div className="auth-tos-wrapper auth-fade-in">
            <div className="auth-modal-card auth-tos-card">
              <span className="auth-modal-close" onClick={() => setShowTos(false)}>&times;</span>
              <div className="auth-tos-title">Terms & Conditions</div>
              <p className="auth-tos-text">
                Welcome to <strong>SoulCul Shop</strong> — your gateway to authentic Philippine culture. These Terms and Conditions govern your access to and use of our website and services. By creating an account or placing an order, you confirm that you have read, understood, and agree to be bound by these Terms.
              </p>

              {[
                { title: "1. About SoulCul Shop", text: "SoulCul Shop, short for Souvenir Culture, is an online retail platform dedicated to celebrating and promoting the richness of Filipino heritage. We offer a diverse range of products sourced from various provinces across the Philippines." },
                { title: "2. Eligibility & Account Registration", text: "To access certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to keep your account details up to date." },
                { title: "3. Use of the Platform", text: "You agree to use SoulCul Shop solely for lawful purposes and in a manner consistent with all applicable laws and regulations." },
                { title: "4. Product Listings & Availability", text: "SoulCul Shop strives to provide accurate descriptions, images, and pricing for all listed products. Products are subject to availability." },
                { title: "5. Orders & Payments", text: "By placing an order, you represent that you are authorized to use the selected payment method. Payment must be completed in full before any order is processed." },
                { title: "6. Shipping & Delivery", text: "SoulCul Shop ships products to both local and international addresses. Estimated delivery times are provided as a guide only." },
                { title: "7. Returns & Refunds", text: "If you receive a damaged, defective, or incorrect item, please contact us within 7 days of delivery." },
                { title: "8. Privacy & Data Protection", text: "We value your privacy. Any personal information you provide is collected and processed in accordance with our Privacy Policy." },
              ].map((s) => (
                <div key={s.title}>
                  <div className="auth-tos-section-title">{s.title}</div>
                  <p className="auth-tos-text">{s.text}</p>
                </div>
              ))}

              <div className="auth-tos-divider" />
              <button className="auth-btn-full" onClick={() => { setTermsChecked(true); setShowTos(false); setSignupErrors((e) => ({ ...e, terms: undefined })); }}>
                I Agree & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}