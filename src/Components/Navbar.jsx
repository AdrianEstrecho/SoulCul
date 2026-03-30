import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="White" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const CartIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

export default function Navbar({ cartCount, onGoHome, hideBackButton }) {
  const [showGuestMsg, setShowGuestMsg] = useState(false);
  const isGuest = localStorage.getItem("soulcul_currentUser") === "guest";
  const isLoggedIn = localStorage.getItem("soulcul_loggedIn") === "true";
  const navigate = useNavigate();
  const location = useLocation();
  const getActiveNav = () => {
    if (location.pathname === "/" || location.pathname === "/Map") return "Home";
    if (location.pathname === "/AboutUs") return "About Us";
    return "Products";
  };
  const [activeNav, setActiveNav] = useState(getActiveNav);

  useEffect(() => {
    setActiveNav(getActiveNav());
  }, [location.pathname]);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>

      <div className="navbar-left">
        {!hideBackButton && (
          <button className="btn-back" onClick={() => onGoHome ? onGoHome() : window.history.back()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
        )}
      </div>

      <div className="navbar-center glass-pill">
        {["Home", "Products", "About Us"].map((item) => (
          <span
            key={item}
            className={`nav-link${activeNav === item ? " active" : ""}`}
            onClick={() => {
              setActiveNav(item);
              if (item === "Home") { onGoHome ? onGoHome() : navigate("/Map"); }
              if (item === "Products") navigate("/Products");
              if (item === "About Us") navigate("/AboutUs");
            }}
          >
            {item}
          </span>
        ))}
      </div>

      <div className="navbar-right">

        {/* Search — its own glass pill */}
        <div className={`icon-pill search-pill${searchOpen ? " search-expanded" : ""}`}>
          {searchOpen ? (
            <div className="search-bar-wrapper">
              <SearchIcon />
              <input
                ref={inputRef}
                type="text"
                className="search-input"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && handleSearchClose()}
              />
              <button className="icon-btn search-close-btn" onClick={handleSearchClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button className="icon-btn" onClick={() => setSearchOpen(true)}>
              <SearchIcon />
            </button>
          )}
        </div>

        {/* Cart & Profile — their own glass pill */}
        <div className="icon-pill">
          <div className="cart-wrapper" onClick={() => {
            if (!isLoggedIn || isGuest) { setShowGuestMsg(true); setTimeout(() => setShowGuestMsg(false), 3000); return; }
            navigate("/Cart");
          }} style={{ cursor: "pointer" }}>
            <CartIcon size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </div>
          <div className="icon-pill-divider" />
          <button className="icon-btn" onClick={() => {
            if (!isLoggedIn || isGuest) { setShowGuestMsg(true); setTimeout(() => setShowGuestMsg(false), 3000); return; }
            navigate("/Profile");
          }}>
            <UserIcon />
          </button>
        </div>

      </div>

      {showGuestMsg && (
        <div className="guest-toast">
          <span>Please log in to access this feature.</span>
          <button className="guest-toast-btn" onClick={() => { setShowGuestMsg(false); navigate("/Login"); }}>Log In</button>
        </div>
      )}

    </nav>
  );
}