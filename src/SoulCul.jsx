import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./StyleSheet/ViganCss.css";

import LandingPage from "./Components/LandingPage";
import HomePin from "./Components/HomePin";
import ProductPage from "./ProductPage";

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
import Checkout from "./Checkout";
import Profile from "./Profile";
import Login from "./Login";

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
  // Ctrl+Alt+. shortcut to open admin panel
  useEffect(() => {
    const handleAdminShortcut = (e) => {
      if (e.ctrlKey && e.altKey && e.key === ".") {
        e.preventDefault();
        window.location.href = "/admin.html";
      }
    };
    window.addEventListener("keydown", handleAdminShortcut);
    return () => window.removeEventListener("keydown", handleAdminShortcut);
  }, []);

  const [cartItems, setCartItems] = useState([]);
  const [directCheckoutItem, setDirectCheckoutItem] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("soulcul_loggedIn") === "true");
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem("soulcul_currentUser") === "guest");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userProfile, setUserProfile] = useState(() => {
    const currentUser = localStorage.getItem("soulcul_currentUser");
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem("soulcul_users") || "{}");
      const u = users[currentUser];
      if (u) return { name: u.firstname + " " + u.lastname, email: u.email, phone: u.phone || "", birthday: u.birthday || "", gender: u.gender || "" };
    }
    return { name: "Guest", email: "", phone: "", birthday: "", gender: "" };
  });

  const handleLogin = (profile) => {
    setIsLoggedIn(true);
    setIsGuest(false);
    setUserProfile({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      birthday: profile.birthday || "",
      gender: profile.gender || "",
    });
  };

  const handleGuestLogin = () => {
    localStorage.setItem("soulcul_loggedIn", "true");
    localStorage.setItem("soulcul_currentUser", "guest");
    setIsLoggedIn(true);
    setIsGuest(true);
    setUserProfile({ name: "Guest", email: "", phone: "", birthday: "", gender: "" });
  };

  const handleLogout = () => {
    localStorage.removeItem("soulcul_loggedIn");
    localStorage.removeItem("soulcul_currentUser");
    setIsLoggedIn(false);
    setIsGuest(false);
    setUserProfile({ name: "Guest", email: "", phone: "", birthday: "", gender: "" });
    setCartItems([]);
  };

  // Add a product to the cart — requires real login (not guest)
  const handleAddToCart = async (product) => {
    if (!isLoggedIn || isGuest) {
      setShowLoginModal(true);
      return;
    }
    try {
      const api = window.CustomerAPI;
      await api.addToCart(product.id, product.qty || 1);
      const addQty = product.qty || 1;
      setCartItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.id === product.id ? { ...i, qty: i.qty + addQty } : i
          );
        }
        return [...prev, { ...product, cartId: Date.now(), qty: addQty, checked: false }];
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  // Update qty or checked state
  const handleUpdateQty = (cartId, qty, checked) => {
    setCartItems((prev) =>
      prev.map((i) => i.cartId === cartId ? { ...i, qty, checked } : i)
    );
  };

  // Remove item from cart
  const handleRemove = (cartId) => {
    setCartItems((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const handleDirectCheckout = (product) => {
    if (!isLoggedIn || isGuest) {
      setShowLoginModal(true);
      return;
    }
    setDirectCheckoutItem({ ...product, qty: product.qty || 1 });
  };

  // Shared props to pass to every page
  const cartProps = { cartCount, onAddToCart: handleAddToCart, onDirectCheckout: handleDirectCheckout, isGuest };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<LandingPage {...cartProps} />} />
        <Route path="/Map"         element={<HomePin {...cartProps} />} />
        <Route path="/Products"    element={<ProductPage {...cartProps} onDirectCheckout={handleDirectCheckout} />} />
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
          !isLoggedIn || isGuest ? <Navigate to="/Login" replace /> :
          <Cart
            cartCount={cartCount}
          />
        } />
        <Route path="/Checkout" element={
          !isLoggedIn || isGuest ? <Navigate to="/Login" replace /> :
          <Checkout
            cartItems={cartItems}
            onRemove={handleRemove}
            cartCount={cartCount}
            userProfile={userProfile}
            directCheckoutItem={directCheckoutItem}
            onClearDirectCheckout={() => setDirectCheckoutItem(null)}
          />
        } />
        <Route path="/Profile" element={
          !isLoggedIn || isGuest ? <Navigate to="/Login" replace /> :
          <Profile
            userProfile={userProfile}
            onUpdateProfile={setUserProfile}
            cartCount={cartCount}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
        } />
        <Route path="/Login" element={
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