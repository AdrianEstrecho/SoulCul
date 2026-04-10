import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./StyleSheet/ViganCss.css";

import LandingPage from "./Components/LandingPage";
import HomePin from "./Components/HomePin";

import ViganClothes from "./Vigan/Clothes";
import ViganHandicrafts from "./Vigan/Handicrafts";
import ViganDelicacies from "./Vigan/Delicacies";
import ViganDecorations from "./Vigan/Decorations";
import ViganHomeware from "./Vigan/Homeware";

import BaguioClothes from "./Baguio/Clothes";
import BaguioHandicrafts from "./Baguio/Handicrafts";
import BaguioDelicacies from "./Baguio/Delicacies";
import BaguioDecorations from "./Baguio/Decorations";
import BaguioHomeware from "./Baguio/Homeware";

import TagaytayClothes from "./Tagaytay/Clothes";
import TagaytayHandicrafts from "./Tagaytay/Handicrafts";
import TagaytayDelicacies from "./Tagaytay/Delicacies";
import TagaytayDecorations from "./Tagaytay/Decorations";
import TagaytayHomeware from "./Tagaytay/Homeware";

import BoracayClothes from "./Boracay/Clothes";
import BoracayHandicrafts from "./Boracay/Handicrafts";
import BoracayDelicacies from "./Boracay/Delicacies";
import BoracayDecorations from "./Boracay/Decorations";
import BoracayHomeware from "./Boracay/Homeware";

import BoholClothes from "./Bohol/Clothes";
import BoholHandicrafts from "./Bohol/Handicrafts";
import BoholDelicacies from "./Bohol/Delicacies";
import BoholDecorations from "./Bohol/Decorations";
import BoholHomeware from "./Bohol/Homeware";

import AboutUs from "./Components/AboutUs";
import Cart from "./Cart";
import ProductPage from "./Components/ProductPage";
import Checkout from "./Checkout";
import Profile from "./Profile";
import Login from "./Login";
import { getCookie, getJsonCookie, removeCookie, setCookie } from "./utils/cookieState";

const GUEST_PROFILE = { name: "Guest", email: "", phone: "", birthday: "", gender: "", profileImage: "", createdAt: "" };

// ── Login Required Modal ──
function LoginRequiredModal({ onClose, onGoToLogin }) {
  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffb3b3" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h3 className="login-modal-title">Login Required</h3>
        <p className="login-modal-text">You need to log in with an account to add items to your cart and checkout.</p>
        <div className="login-modal-btns">
          <button className="login-modal-btn login-modal-btn-outline" onClick={onClose}>Cancel</button>
          <button className="login-modal-btn login-modal-btn-solid" onClick={onGoToLogin}>Go to Login</button>
        </div>
      </div>
    </div>
  );
}

// Seed default account on first load


export default function SoulCul() {
  const SESSION_MAX_AGE_DAYS = 15;

  // Ctrl+Alt+. shortcut to open admin panel
  useEffect(() => {
    const handleAdminShortcut = (e) => {
      if (e.ctrlKey && e.altKey && e.key === ".") {
        e.preventDefault();
        window.location.href = "/admin/";
      }
    };
    window.addEventListener("keydown", handleAdminShortcut);
    return () => window.removeEventListener("keydown", handleAdminShortcut);
  }, []);

  const [authReady, setAuthReady] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [directCheckoutItem, setDirectCheckoutItem] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const legacyFlag = getCookie("soulcul_loggedIn") === "true";
    const hasToken = !!getCookie("customer_token");
    return legacyFlag || hasToken;
  });
  const [isGuest, setIsGuest] = useState(() => getCookie("soulcul_currentUser") === "guest");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userProfile, setUserProfile] = useState(() => {
    const currentUser = getCookie("soulcul_currentUser");
    const tokenUser = getJsonCookie("customer_user", null);

    if (tokenUser) {
      const firstName = tokenUser?.first_name || "";
      const lastName = tokenUser?.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();

      return {
        name: fullName || tokenUser?.email || "Customer",
        email: tokenUser?.email || "",
        phone: "",
        birthday: "",
        gender: "",
        profileImage: tokenUser?.profile_image_url || "",
        createdAt: "",
      };
    }

    if (currentUser) {
      return {
        name: currentUser,
        email: currentUser,
        phone: "",
        birthday: "",
        gender: "",
        profileImage: "",
        createdAt: "",
      };
    }
    return GUEST_PROFILE;
  });

  const getCustomerApi = () => window.CustomerAPI;

  const clearCustomerSession = () => {
    removeCookie("soulcul_loggedIn");
    removeCookie("soulcul_currentUser");
    removeCookie("customer_token");
    removeCookie("customer_user");
    removeCookie("customer_last_activity_at");
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      clearCustomerSession();
      setIsLoggedIn(false);
      setIsGuest(false);
      setUserProfile(GUEST_PROFILE);
      setCartItems([]);
      setDirectCheckoutItem(null);
      setShowLoginModal(false);
      setAuthReady(true);
    };

    window.addEventListener("soucul:customer-session-expired", handleSessionExpired);
    return () => window.removeEventListener("soucul:customer-session-expired", handleSessionExpired);
  }, []);

  const resolveImageUrl = (rawUrl) => {
    const value = String(rawUrl || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
    if (value.startsWith("/")) return value;
    return `/${value.replace(/^\/+/, "")}`;
  };

  const toCartItem = (row) => ({
    cartId: Number(row.id),
    id: Number(row.product_id),
    name: row.name || "Product",
    location: row.location_name || "SouCul",
    image: resolveImageUrl(row.featured_image_url),
    price: Number(row.discount_price ?? row.price ?? 0),
    qty: Math.max(1, Number(row.quantity || 1)),
    checked: false,
  });

  const hydrateCartFromAPI = async () => {
    const api = getCustomerApi();
    if (!api || typeof api.getCart !== "function") return;

    const result = await api.getCart();
    const rows = Array.isArray(result?.data) ? result.data : [];
    setCartItems(rows.map(toCartItem));
  };

  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      const api = getCustomerApi();
      const token = getCookie("customer_token");
      const guestMode = getCookie("soulcul_currentUser") === "guest";

      if (guestMode) {
        if (!active) return;
        setIsLoggedIn(true);
        setIsGuest(true);
        setUserProfile(GUEST_PROFILE);
        setAuthReady(true);
        return;
      }

      if (!token) {
        clearCustomerSession();
        if (!active) return;
        setIsLoggedIn(false);
        setIsGuest(false);
        setUserProfile(GUEST_PROFILE);
        setCartItems([]);
        setAuthReady(true);
        return;
      }

      setCookie("soulcul_loggedIn", "true", { maxAgeDays: SESSION_MAX_AGE_DAYS });
      if (!active) return;
      setIsLoggedIn(true);
      setIsGuest(false);

      try {
        if (api && typeof api.getProfile === "function") {
          const profileRes = await api.getProfile();
          const p = profileRes?.data || {};
          const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim();
          const mappedProfile = {
            name: fullName || p.email || "Customer",
            email: p.email || "",
            phone: p.phone || "",
            birthday: p.birthday || "",
            gender: p.gender || "",
            profileImage: resolveImageUrl(p.profile_image_url),
            createdAt: p.created_at || "",
          };
          if (active) setUserProfile(mappedProfile);
          if (p.email) setCookie("soulcul_currentUser", p.email, { maxAgeDays: SESSION_MAX_AGE_DAYS });
        }

        await hydrateCartFromAPI();
      } catch (error) {
        console.error("Failed to restore customer session:", error);
        clearCustomerSession();
        if (active) {
          setIsLoggedIn(false);
          setIsGuest(false);
          setUserProfile(GUEST_PROFILE);
          setCartItems([]);
        }
      } finally {
        if (active) setAuthReady(true);
      }
    };

    hydrateSession();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (profile) => {
    setCookie("soulcul_loggedIn", "true", { maxAgeDays: SESSION_MAX_AGE_DAYS });
    if (profile?.email) {
      setCookie("soulcul_currentUser", profile.email, { maxAgeDays: SESSION_MAX_AGE_DAYS });
    }

    setIsLoggedIn(true);
    setIsGuest(false);
    setUserProfile({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      birthday: profile.birthday || "",
      gender: profile.gender || "",
      profileImage: profile.profileImage || profile.profile_image_url || "",
      createdAt: profile.createdAt || "",
    });

    hydrateCartFromAPI().catch((error) => {
      console.error("Failed to hydrate cart after login:", error);
    });
  };

  const handleGuestLogin = () => {
    setCookie("soulcul_loggedIn", "true", { maxAgeDays: SESSION_MAX_AGE_DAYS });
    setCookie("soulcul_currentUser", "guest", { maxAgeDays: SESSION_MAX_AGE_DAYS });
    setIsLoggedIn(true);
    setIsGuest(true);
    setUserProfile(GUEST_PROFILE);
    setCartItems([]);
  };

  const handleLogout = () => {
    const api = getCustomerApi();
    if (api && typeof api.logout === "function") {
      api.logout();
    }

    clearCustomerSession();
    setIsLoggedIn(false);
    setIsGuest(false);
    setUserProfile(GUEST_PROFILE);
    setCartItems([]);
    setDirectCheckoutItem(null);
  };

  // Add a product to the cart — requires real login (not guest)
  const handleAddToCart = async (product) => {
    if (!isLoggedIn || isGuest) {
      setShowLoginModal(true);
      return;
    }

    try {
      const api = getCustomerApi();
      await api.addToCart(product.id, product.qty || 1);
      await hydrateCartFromAPI();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  // Update qty or checked state
  const handleUpdateQty = async (cartId, qty, checked) => {
    let previousQty = qty;

    setCartItems((prev) => {
      const target = prev.find((i) => i.cartId === cartId);
      previousQty = target ? target.qty : qty;
      return prev.map((i) => i.cartId === cartId ? { ...i, qty, checked } : i);
    });

    if (!isLoggedIn || isGuest || qty === previousQty) return;

    try {
      const api = getCustomerApi();
      await api.updateCartItem(cartId, qty);
    } catch (error) {
      console.error("Failed to sync cart quantity:", error);
      try {
        await hydrateCartFromAPI();
      } catch (refreshError) {
        console.error("Failed to refresh cart after quantity sync error:", refreshError);
      }
    }
  };

  // Remove item from cart
  const handleRemove = async (cartId) => {
    const previous = cartItems;
    setCartItems((prev) => prev.filter((i) => i.cartId !== cartId));

    if (!isLoggedIn || isGuest) return;

    try {
      const api = getCustomerApi();
      await api.removeCartItem(cartId);
    } catch (error) {
      console.error("Failed to remove cart item:", error);
      setCartItems(previous);
    }
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const handleDirectCheckout = (product) => {
    if (!isLoggedIn || isGuest) {
      setShowLoginModal(true);
      return;
    }
    setDirectCheckoutItem({ ...product, qty: product.qty || 1 });
  };

  const handleOrderPlaced = async () => {
    setDirectCheckoutItem(null);
    try {
      await hydrateCartFromAPI();
    } catch (error) {
      console.error("Failed to refresh cart after order placement:", error);
      setCartItems([]);
    }
  };

  const renderProtected = (element) => {
    if (!authReady) {
      return (
        <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", fontWeight: 600, color: "#5c5c5c" }}>
          Loading your account...
        </div>
      );
    }

    return (!isLoggedIn || isGuest) ? <Navigate to="/Login" replace /> : element;
  };

  // Shared props to pass to every page
  const cartProps = { cartCount, onAddToCart: handleAddToCart, onDirectCheckout: handleDirectCheckout, isGuest };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<LandingPage {...cartProps} />} />
        <Route path="/Map"         element={<HomePin {...cartProps} />} />
        <Route path="/Products"    element={
          <ProductPage
            userProfile={userProfile}
            onUpdateProfile={setUserProfile}
            cartCount={cartCount}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
        } />
        <Route path="/AboutUs"     element={<AboutUs {...cartProps} />} />

        {/* Vigan */}
        <Route path="/Vigan/Clothes"      element={<ViganClothes      {...cartProps} />} />
        <Route path="/Vigan/Handicrafts"  element={<ViganHandicrafts  {...cartProps} />} />
        <Route path="/Vigan/Delicacies"   element={<ViganDelicacies   {...cartProps} />} />
        <Route path="/Vigan/Decorations"  element={<ViganDecorations  {...cartProps} />} />
        <Route path="/Vigan/Homeware"     element={<ViganHomeware     {...cartProps} />} />

        {/* Baguio */}
        <Route path="/Baguio/Clothes"     element={<BaguioClothes     {...cartProps} />} />
        <Route path="/Baguio/Handicrafts" element={<BaguioHandicrafts {...cartProps} />} />
        <Route path="/Baguio/Delicacies"  element={<BaguioDelicacies  {...cartProps} />} />
        <Route path="/Baguio/Decorations" element={<BaguioDecorations {...cartProps} />} />
        <Route path="/Baguio/Homeware"    element={<BaguioHomeware    {...cartProps} />} />

        {/* Tagaytay */}
        <Route path="/Tagaytay/Clothes"      element={<TagaytayClothes      {...cartProps} />} />
        <Route path="/Tagaytay/Handicrafts"  element={<TagaytayHandicrafts  {...cartProps} />} />
        <Route path="/Tagaytay/Delicacies"   element={<TagaytayDelicacies   {...cartProps} />} />
        <Route path="/Tagaytay/Decorations"  element={<TagaytayDecorations  {...cartProps} />} />
        <Route path="/Tagaytay/Homeware"     element={<TagaytayHomeware     {...cartProps} />} />

        {/* Boracay */}
        <Route path="/Boracay/Clothes"      element={<BoracayClothes      {...cartProps} />} />
        <Route path="/Boracay/Handicrafts"  element={<BoracayHandicrafts  {...cartProps} />} />
        <Route path="/Boracay/Delicacies"   element={<BoracayDelicacies   {...cartProps} />} />
        <Route path="/Boracay/Decorations"  element={<BoracayDecorations  {...cartProps} />} />
        <Route path="/Boracay/Homeware"     element={<BoracayHomeware     {...cartProps} />} />

        {/* Bohol */}
        <Route path="/Bohol/Clothes"      element={<BoholClothes      {...cartProps} />} />
        <Route path="/Bohol/Handicrafts"  element={<BoholHandicrafts  {...cartProps} />} />
        <Route path="/Bohol/Delicacies"   element={<BoholDelicacies   {...cartProps} />} />
        <Route path="/Bohol/Decorations"  element={<BoholDecorations  {...cartProps} />} />
        <Route path="/Bohol/Homeware"     element={<BoholHomeware     {...cartProps} />} />

        <Route path="/Cart" element={
          renderProtected(
          <Cart
            cartItems={cartItems}
            onUpdateQty={handleUpdateQty}
            onRemove={handleRemove}
            cartCount={cartCount}
          />
          )
        } />
        <Route path="/Checkout" element={
          renderProtected(
          <Checkout
            cartItems={cartItems}
            onRemove={handleRemove}
            cartCount={cartCount}
            userProfile={userProfile}
            directCheckoutItem={directCheckoutItem}
            onClearDirectCheckout={() => setDirectCheckoutItem(null)}
            onOrderPlaced={handleOrderPlaced}
          />
          )
        } />
        <Route path="/Profile" element={
          renderProtected(
          <Profile
            userProfile={userProfile}
            onUpdateProfile={setUserProfile}
            cartCount={cartCount}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
          )
        } />
        <Route path="/Login" element={
          authReady && isLoggedIn && !isGuest
            ? <Navigate to="/" replace />
            :
          <Login onLogin={handleLogin} onGuestLogin={handleGuestLogin} />
        } />
      </Routes>

      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          onGoToLogin={() => {
            setShowLoginModal(false);
            window.location.href = "/Login";
          }}
        />
      )}
    </BrowserRouter>
  );
}