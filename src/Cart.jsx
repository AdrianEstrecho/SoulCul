import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";

const PhilippinesMapBg = () => (
  <svg
    viewBox="0 0 400 500"
    style={{
      position: "absolute", bottom: 0, right: "5%",
      width: "55%", opacity: 0.08, pointerEvents: "none",
    }}
    fill="currentColor"
  >
    <path d="M200,50 C180,60 160,80 155,100 C150,120 165,135 170,155 C175,175 160,190 155,210 C150,230 160,250 170,265 C180,280 175,300 165,315 C155,330 140,340 135,355 C130,370 140,385 150,395 C160,405 155,420 145,430 C135,440 120,445 115,458 C180,470 220,465 250,450 C280,435 300,410 305,385 C310,360 295,340 290,315 C285,290 295,270 300,248 C305,226 298,205 285,190 C272,175 268,155 272,135 C276,115 290,100 288,80 C286,60 268,45 250,42 C232,39 215,45 200,50Z" />
    <path d="M120,200 C105,210 95,228 98,245 C101,262 115,272 118,288 C121,304 110,318 112,333 C114,348 128,355 130,368 C108,362 92,348 85,330 C78,312 82,290 88,272 C94,254 98,235 92,218 C86,201 72,190 70,174 C68,158 78,143 90,138 C102,133 116,140 120,152 C124,164 118,185 120,200Z" />
    <path d="M280,150 C295,145 312,150 320,163 C328,176 322,193 318,207 C314,221 315,237 308,248 C301,259 288,262 282,272 C276,282 278,296 272,305 C288,298 302,285 308,268 C314,251 310,232 316,215 C322,198 335,185 334,168 C333,151 320,138 306,135 C292,132 278,140 275,152 C272,164 278,155 280,150Z" />
  </svg>
);

export default function Cart({ cartItems, onUpdateQty, onRemove, cartCount, onCartClick }) {
  const navigate = useNavigate();
  const [checkedAll, setCheckedAll] = useState(false);
  const [voucher, setVoucher] = useState("");

  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const selectedItems = cartItems.filter((i) => i.checked);
  const selectedTotal = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const toggleAll = () => {
    const next = !checkedAll;
    setCheckedAll(next);
    cartItems.forEach((item) => onUpdateQty(item.cartId, item.qty, next));
  };

  return (
    <div className="soucul-app" style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0d7377 0%, #14a085 50%, #0a5c61 100%)", position: "relative", overflow: "hidden" }}>
      
      <PhilippinesMapBg />

      <Navbar cartCount={cartCount} onCartClick={onCartClick} />

      <div style={{ padding: "100px 32px 180px", maxWidth: 760, margin: "0 auto", position: "relative", zIndex: 1 }}>

        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, marginBottom: 24, letterSpacing: "-0.01em" }}>
          Cart
        </h1>
        <div style={{ height: 2, background: "rgba(255,255,255,0.25)", marginBottom: 20, borderRadius: 2 }} />

        {cartItems.length === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", padding: "60px 0", fontSize: 16 }}>
            Your cart is empty.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {cartItems.map((item) => (
              <div key={item.cartId} style={{
                background: "#fff",
                borderRadius: 18,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              }}>
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={!!item.checked}
                  onChange={(e) => onUpdateQty(item.cartId, item.qty, e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#4ade80", flexShrink: 0, cursor: "pointer" }}
                />

                {/* Image */}
                <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a", marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>{item.location}</div>
                  <span style={{
                    background: "#4ade80", color: "#fff", fontWeight: 800,
                    fontSize: 13, padding: "4px 14px", borderRadius: 8,
                  }}>
                    ₱{item.price.toLocaleString()}
                  </span>
                </div>

                {/* Qty controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <button
                    onClick={() => item.qty > 1 ? onUpdateQty(item.cartId, item.qty - 1, item.checked) : onRemove(item.cartId)}
                    style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#f0f0f0", fontWeight: 800, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >−</button>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#4ade80", color: "#fff", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.cartId, item.qty + 1, item.checked)}
                    style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#f0f0f0", fontWeight: 800, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#0a3d40",
        padding: "20px 32px 28px",
        zIndex: 100,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.25)",
      }}>
        {/* Voucher */}
        <div style={{ maxWidth: 760, margin: "0 auto 16px", color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 600 }}>
          SoulCul Voucher
          <input
            value={voucher}
            onChange={(e) => setVoucher(e.target.value)}
            placeholder="Enter voucher code"
            style={{
              marginLeft: 16, padding: "6px 14px", borderRadius: 8,
              border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)",
              color: "#fff", fontSize: 13, outline: "none", width: 180,
            }}
          />
        </div>

        {/* Select all + total + checkout */}
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: 14 }}>
            <div
              onClick={toggleAll}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: "2.5px solid rgba(255,255,255,0.5)",
                background: checkedAll ? "#4ade80" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "background 0.2s",
              }}
            >
              {checkedAll && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </div>
            All
          </label>

          <div style={{ flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
            {selectedItems.length > 0 && (
              <span>Total: <strong style={{ color: "#4ade80", fontSize: 16 }}>₱{selectedTotal.toLocaleString()}</strong></span>
            )}
          </div>

          <button
            onClick={() => navigate("/Checkout")}
            disabled={selectedItems.length === 0}
            style={{
              background: selectedItems.length === 0 ? "rgba(255,255,255,0.2)" : "#4ade80",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "13px 32px",
              fontSize: 15,
              fontWeight: 800,
              cursor: selectedItems.length === 0 ? "not-allowed" : "pointer",
              boxShadow: selectedItems.length === 0 ? "none" : "0 4px 16px rgba(74,222,128,0.4)",
              transition: "transform 0.1s, background 0.2s",
              opacity: selectedItems.length === 0 ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { if (selectedItems.length > 0) e.target.style.background = "#22c55e"; }}
            onMouseLeave={(e) => { if (selectedItems.length > 0) e.target.style.background = "#4ade80"; }}
          >
            Check Out{selectedItems.length > 0 ? ` (${selectedItems.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}