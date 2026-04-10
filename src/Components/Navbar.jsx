import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCookie } from "../utils/cookieState";

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

const BellIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function Navbar({ cartCount, onGoHome, hideBackButton }) {
  const [showGuestMsg, setShowGuestMsg] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);
  const isGuest = getCookie("soucul_currentUser") === "guest";
  const isLoggedIn = getCookie("soucul_loggedIn") === "true" || !!getCookie("customer_token");
  const navigate = useNavigate();
  const location = useLocation();
  const getActiveNav = useCallback(() => {
    if (location.pathname === "/") return "Home";
    if (location.pathname === "/Products" || location.pathname === "/ProductPage") return "Products";
    if (location.pathname === "/Map") return null;
    if (location.pathname === "/AboutUs") return "About Us";
    if (location.pathname === "/Profile" || location.pathname === "/Cart" || location.pathname === "/Checkout") return null;
    return null;
  }, [location.pathname]);
  const [activeNav, setActiveNav] = useState(getActiveNav);

  useEffect(() => {
    setActiveNav(getActiveNav());
  }, [getActiveNav]);
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatNotificationTime = useCallback((value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, []);

  const formatStatusLabel = useCallback((value) => {
    return String(value || "")
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!isLoggedIn || isGuest) {
      setNotifications([]);
      return;
    }

    const api = window.CustomerAPI;
    if (!api || typeof api.getNotifications !== "function") {
      setNotifications([]);
      return;
    }

    setNotifLoading(true);
    try {
      const response = await api.getNotifications({ limit: 20 });
      const rows = Array.isArray(response?.data) ? response.data : [];

      const mapped = rows.map((row) => ({
        ...row,
        id: row.id,
        text: (() => {
          const statusLabel = formatStatusLabel(row?.meta?.status);
          const orderNumber = row?.meta?.order_number;

          if (String(row.type || "").toLowerCase() === "order_status" && orderNumber && statusLabel) {
            return `Order ${orderNumber} is now ${statusLabel}.`;
          }

          if (String(row.type || "").toLowerCase() === "order_created" && orderNumber) {
            return `Order ${orderNumber} has been placed successfully.`;
          }

          return row.title ? `${row.title}: ${row.message}` : row.message;
        })(),
        time: formatNotificationTime(row.created_at),
        read: Boolean(row.is_read),
      }));

      setNotifications(mapped);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setNotifLoading(false);
    }
  }, [isLoggedIn, isGuest, formatNotificationTime, formatStatusLabel]);

  const markAsRead = async (id) => {
    const updated = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);

    const api = window.CustomerAPI;
    if (!api || typeof api.markNotificationRead !== "function") {
      return;
    }

    try {
      await api.markNotificationRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      await loadNotifications();
    }
  };

  const markAllRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);

    const api = window.CustomerAPI;
    if (!api || typeof api.markAllNotificationsRead !== "function") {
      return;
    }

    try {
      await api.markAllNotificationsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      await loadNotifications();
    }
  };

  useEffect(() => {
    if (isLoggedIn && !isGuest) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [isLoggedIn, isGuest, loadNotifications]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`} onClick={(e) => e.stopPropagation()}>

      <div className="navbar-left">
        {!hideBackButton && (
          <button className="btn-back" onClick={() => onGoHome ? onGoHome() : navigate("/")}>
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
              if (item === "Home") { onGoHome ? onGoHome() : navigate("/"); }
              if (item === "Products") navigate("/ProductPage");
              if (item === "About Us") navigate("/AboutUs");
            }}
            onMouseDown={(e) => e.stopPropagation()}
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

        {/* Notification Bell */}
        <div className="icon-pill notif-pill" ref={notifRef}>
          <button className="icon-btn notif-btn" onClick={() => {
            if (!isLoggedIn || isGuest) { setShowGuestMsg(true); setTimeout(() => setShowGuestMsg(false), 3000); return; }
            setNotifOpen((prev) => {
              const next = !prev;
              if (next) {
                loadNotifications();
              }
              return next;
            });
          }}>
            <BellIcon size={22} />
            {isLoggedIn && !isGuest && unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-title">Notifications</span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
                )}
              </div>
              <div className="notif-list">
                {notifLoading ? (
                  <div className="notif-empty">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="notif-empty">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item${n.read ? "" : " notif-unread"}`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div className="notif-dot-wrapper">
                        {!n.read && <span className="notif-dot" />}
                      </div>
                      <div className="notif-content">
                        <p className="notif-text">{n.text}</p>
                        <span className="notif-time">{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cart & Profile — their own glass pill */}
        <div className="icon-pill">
          <div className="cart-wrapper" onClick={() => {
            if (!isLoggedIn) { setShowGuestMsg(true); setTimeout(() => setShowGuestMsg(false), 3000); return; }
            navigate("/Cart");
          }} style={{ cursor: "pointer" }}>
            <CartIcon size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </div>
          <div className="icon-pill-divider" />
          <button className="icon-btn" onClick={() => {
            if (!isLoggedIn) { setShowGuestMsg(true); setTimeout(() => setShowGuestMsg(false), 3000); return; }
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
