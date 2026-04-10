import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Components/Navbar";

// ── Asset Imports ──────────────────────────────────────────────────────────
import cloud1 from "./assets/2 1.png";
import cloud2 from "./assets/3 1.png";
import cloud3 from "./assets/3A.png";
import cloud4 from "./assets/4A.png";

import fallbackImage       from "./assets/Shirt.png";

// ── Data (database-driven) ────────────────────────────────────────────────
const CATEGORY_DESCRIPTIONS = {
  Handicrafts: "Keychains for memories, bringing a piece of the vacation spot with you.",
  Clothes: "Designs made by local artists for street wear and casual wear.",
  Decorations: "Designs made by local artists for street wear and casual wear.",
  Homeware: "Designs made by local artists for street wear and casual wear.",
  Delicacies: "Taste local food made with love and local ingredients.",
};

const CATEGORY_ORDER = ["Handicrafts", "Clothes", "Delicacies", "Decorations", "Homeware"];
const FEATURED_SIZE_PATTERN = ["lg", "md", "lg", "sm", "ml", "lg", "sm"];

function resolveImageUrl(rawUrl) {
  const value = String(rawUrl || "").trim();

  if (!value) return fallbackImage;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.startsWith("/")) return value;
  return `/${value.replace(/^\/+/, "")}`;
}

function mapProduct(row) {
  return {
    id: Number(row.id),
    name: row.name || "Product",
    location: row.location_name || "SouCul",
    price: Number(row.discount_price ?? row.price ?? 0),
    imageUrl: resolveImageUrl(row.featured_image_url),
    description: row.description || "",
    stock: Math.max(0, Number(row.quantity_in_stock ?? 0)),
    rating: Number(row.rating_average ?? 0),
    category: row.category_name || "Uncategorized",
    isFeatured: Boolean(Number(row.is_featured ?? 0)),
  };
}

// ── Icons ─────────────────────────────────────────────────────────────────
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TruckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const PP_PRODUCT_DETAILS_FALLBACK = {
  description: "A beautifully crafted item from the rich cultural heritage of the Philippines, made with traditional techniques passed down through generations.",
  rating: 0,
  reviews: 0,
  deliveryTime: "3–5 business days",
  material: "Locally sourced",
  seller: "Local Artisan Seller",
  stock: 0,
  tags: ["Handmade", "Authentic"],
};

function mapProductDetails(row, baseProduct) {
  const ratingRaw = Number(row.rating_average ?? row.rating ?? baseProduct.rating ?? PP_PRODUCT_DETAILS_FALLBACK.rating);
  const rating = Number.isFinite(ratingRaw) ? Math.max(0, Math.min(5, ratingRaw)) : PP_PRODUCT_DETAILS_FALLBACK.rating;

  const reviewsRaw = Number(row.review_count ?? row.reviews ?? PP_PRODUCT_DETAILS_FALLBACK.reviews);
  const reviews = Number.isFinite(reviewsRaw) ? Math.max(0, Math.floor(reviewsRaw)) : PP_PRODUCT_DETAILS_FALLBACK.reviews;

  const stockRaw = Number(row.quantity_in_stock ?? row.stock ?? baseProduct.stock ?? PP_PRODUCT_DETAILS_FALLBACK.stock);
  const stock = Number.isFinite(stockRaw) ? Math.max(0, Math.floor(stockRaw)) : PP_PRODUCT_DETAILS_FALLBACK.stock;

  const location = row.location || row.location_name || baseProduct.location || "Philippines";
  const category = row.category || row.category_name || baseProduct.category || "Product";
  const tags = Array.from(new Set([category, location, "Authentic"]))
    .filter(Boolean)
    .slice(0, 3);

  return {
    description: row.description || baseProduct.description || PP_PRODUCT_DETAILS_FALLBACK.description,
    rating,
    reviews,
    deliveryTime: row.delivery_time || PP_PRODUCT_DETAILS_FALLBACK.deliveryTime,
    material: row.material || PP_PRODUCT_DETAILS_FALLBACK.material,
    seller: row.seller_name || row.seller || PP_PRODUCT_DETAILS_FALLBACK.seller,
    stock,
    tags: tags.length ? tags : PP_PRODUCT_DETAILS_FALLBACK.tags,
  };
}

// ── Product Modal ─────────────────────────────────────────────────────────
function PPProductModal({ product, onClose, onAddToCart, onCheckoutProduct }) {
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [details, setDetails] = useState(() => mapProductDetails({}, product));
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setAdded(false);
    setQty(1);
    setDetails(mapProductDetails({}, product));

    const loadProductDetails = async () => {
      setLoadingDetails(true);

      try {
        const api = window.CustomerAPI || window.customerAPI;
        if (!api || typeof api.getProduct !== "function") {
          throw new Error("Customer API client is unavailable.");
        }

        const response = await api.getProduct(product.id);
        const row = response?.data && typeof response.data === "object" ? response.data : {};

        if (!isMounted) return;
        setDetails(mapProductDetails(row, product));
      } catch (error) {
        console.error("Failed to load product details:", error);
        if (!isMounted) return;
        setDetails(mapProductDetails({}, product));
      } finally {
        if (isMounted) {
          setLoadingDetails(false);
        }
      }
    };

    loadProductDetails();

    return () => {
      isMounted = false;
    };
  }, [product]);

  const stockCount = Math.max(0, Number(details.stock) || 0);
  const isOutOfStock = stockCount <= 0;
  const ratingValue = Number.isFinite(Number(details.rating)) ? Number(details.rating) : 0;

  useEffect(() => {
    setQty((prevQty) => {
      if (stockCount <= 0) return 0;
      const minQty = 1;
      const normalized = Math.max(minQty, Number(prevQty) || minQty);
      return Math.min(normalized, stockCount);
    });
  }, [stockCount]);

  const price = `₱${product.price.toLocaleString()}`;
  const totalPrice = `₱${(product.price * Math.max(0, qty)).toLocaleString()}`;

  const handleAdd = () => {
    if (isOutOfStock || qty < 1) return;
    onAddToCart({ ...product, qty });
    setAdded(true);
  };

  const handleCheckout = () => {
    if (isOutOfStock || qty < 1) return;
    onClose();
    onCheckoutProduct({ ...product, qty });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        <div className="modal-body">
          <div className="modal-image-side">
            <div className="modal-image-wrapper">
              <img src={product.imageUrl} alt={product.name} className="modal-product-img" />
            </div>
            <div className="modal-tags">
              {details.tags.map((tag) => (
                <span key={tag} className="modal-tag">{tag}</span>
              ))}
            </div>
          </div>
          <div className="modal-details-side">
            <div className="modal-location">
              <LocationIcon />
              <span>{product.location}, Philippines</span>
            </div>
            <h2 className="modal-product-name">{product.name}</h2>
            <div className="modal-rating">
              <div className="modal-stars">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={s <= Math.round(ratingValue) ? "star-filled" : "star-empty"}>
                    <StarIcon filled={s <= Math.round(ratingValue)} />
                  </span>
                ))}
              </div>
              <span className="modal-rating-score">{ratingValue.toFixed(1)}</span>
              <span className="modal-review-count">({details.reviews} reviews)</span>
            </div>
            <p className="modal-description">{loadingDetails ? "Loading product details..." : details.description}</p>
            <div className="modal-info-grid">
              <div className="modal-info-item">
                <span className="modal-info-label">Seller</span>
                <span className="modal-info-value">{details.seller}</span>
              </div>
              <div className="modal-info-item">
                <span className="modal-info-label">Material</span>
                <span className="modal-info-value">{details.material}</span>
              </div>
              <div className="modal-info-item">
                <span className="modal-info-label">Stock</span>
                <span className="modal-info-value">{isOutOfStock ? "Out of stock" : `${stockCount} left`}</span>
              </div>
              <div className="modal-info-item">
                <span className="modal-info-label">Origin</span>
                <span className="modal-info-value">{product.location}, Philippines</span>
              </div>
            </div>
            <div className="modal-delivery">
              <TruckIcon />
              <span>Estimated delivery: <strong>{details.deliveryTime}</strong></span>
            </div>
            <div className="modal-qty-row">
              <span className="modal-qty-label">Quantity</span>
              <div className="modal-qty-controls">
                <button type="button" className="modal-qty-btn" disabled={isOutOfStock || qty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="modal-qty-value">{qty}</span>
                <button type="button" className="modal-qty-btn" disabled={isOutOfStock || qty >= stockCount} onClick={() => setQty(q => Math.min(stockCount, q + 1))}>+</button>
              </div>
            </div>
            <div className="modal-footer">
              <div>
                <div className="modal-price">{totalPrice}</div>
                {qty > 1 && <div className="modal-price-each">{price} each</div>}
              </div>
              <div className="modal-btn-group">
                {added ? (
                  <>
                    <span className="modal-added-confirm">Added to cart!</span>
                    <button className="modal-checkout-btn" disabled={isOutOfStock || qty < 1} onClick={handleCheckout}>
                      <span>Checkout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="modal-add-btn" disabled={isOutOfStock || qty < 1} onClick={handleAdd}>
                      <CartIcon size={16} color="#fff" />
                      <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                    </button>
                    <button className="modal-checkout-btn" disabled={isOutOfStock || qty < 1} onClick={handleCheckout}>
                      <span>Checkout</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cart Icon ──────────────────────────────────────────────────────────────
function CartIcon({ size = 20, color = "#000" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

// ── Marquee (categories only) ──────────────────────────────────────────────
// BUG FIX: Was using margin-right on cards inside a max-content flex container —
// this caused the seam to be visible when the animation looped. Fixed by using
// a gap on the flex container instead, and padding the duplicated set so the
// loop is seamless.
function Marquee({ children, speed = 30, className = "" }) {
  const [paused, setPaused] = useState(false);
  return (
    <div
      className={`marquee-outer ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ overflow: "hidden", width: "100%" }}
    >
      <div
        style={{
          display: "flex",
          gap: "24px",           // BUG FIX: moved gap here from individual card margin
          width: "max-content",
          animation: `marquee ${speed}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

// ── Featured Card ─────────────────────────────────────────────────────────
const sizeMap = {
  lg: { height: 436, imgH: 321 },
  md: { height: 380, imgH: 265 },
  sm: { height: 340, imgH: 225 },
  ml: { height: 400, imgH: 285 },
};

function FeatCard({ product, onSelect }) {
  const s = sizeMap[product.size] || sizeMap.md;
  return (
    <div className="feat-card" style={{ height: s.height }}>
      <div className="feat-card-img" style={{ height: s.imgH }}>
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        <div className="feat-card-overlay" />
        <div className="feat-card-label">
          <h3>{product.name}</h3>
          <p>{product.location}</p>
        </div>
      </div>
      <div className="feat-card-actions">
        <button className="feat-price-btn" onClick={() => onSelect(product)}>₱{product.price.toLocaleString()}</button>
        <button className="feat-cart-btn" onClick={() => onSelect(product)}>
          <CartIcon size={20} color="#000" />
        </button>
      </div>
    </div>
  );
}

// ── Featured Carousel (Infinite scroll, cards peek from edges) ────────────
function FeaturedCarousel({ products, onSelect }) {
  const doubled = [...products, ...products];
  return (
    <div className="pp-carousel-wrapper">
      <div className="pp-carousel-track">
        {doubled.map((p, i) => (
          <div key={i} className="pp-carousel-card-slot">
            <FeatCard product={p} onSelect={onSelect} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────
function ProdCard({ product, onSelect }) {
  return (
    <div className="prod-card">
      <div className="prod-img-wrap" onClick={() => onSelect(product)} style={{ cursor: "pointer" }}>
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
      </div>
      <div className="prod-info">
        <h3>{product.name}</h3>
        <p>{product.location}</p>
      </div>
      <div className="prod-actions">
        <button className="prod-price-btn" onClick={() => onSelect(product)}>₱{product.price.toLocaleString()}</button>
        <button className="prod-cart-btn" onClick={() => onSelect(product)}>
          <CartIcon size={18} color="#000" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ProductPage({ cartCount, onAddToCart, onDirectCheckout }) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");

  const filterOptions = useMemo(() => {
    const seen = new Set();
    const unique = [];

    for (const product of products) {
      const name = String(product.category || "").trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      unique.push(name);
    }

    const prioritized = CATEGORY_ORDER.filter((name) => seen.has(name));
    const dynamic = unique.filter((name) => !CATEGORY_ORDER.includes(name)).sort((a, b) => a.localeCompare(b));
    return [...prioritized, ...dynamic];
  }, [products]);

  const featuredCarouselProducts = useMemo(() => {
    return featuredProducts.map((product, index) => ({
      ...product,
      size: FEATURED_SIZE_PATTERN[index % FEATURED_SIZE_PATTERN.length],
    }));
  }, [featuredProducts]);

  const categoryCards = useMemo(
    () => filterOptions.map((name) => ({
      name,
      description: CATEGORY_DESCRIPTIONS[name] || "Discover locally crafted products from this category.",
    })),
    [filterOptions]
  );

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setLoadingProducts(true);
      setProductError("");

      try {
        const api = window.CustomerAPI || window.customerAPI;
        if (!api || typeof api.getProducts !== "function") {
          throw new Error("Customer API client is unavailable.");
        }

        const [allResponse, featuredResponse] = await Promise.all([
          api.getProducts({ page: 1, per_page: 500 }),
          api.getProducts({ featured: 1, page: 1, per_page: 20 }),
        ]);

        const allRows = Array.isArray(allResponse?.data) ? allResponse.data : [];
        const featuredRows = Array.isArray(featuredResponse?.data) ? featuredResponse.data : [];
        const mapped = allRows.map(mapProduct);
        const mappedFeatured = featuredRows.map(mapProduct);

        if (!isMounted) return;
        setProducts(mapped);
        setFeaturedProducts(mappedFeatured);
      } catch (error) {
        console.error("Failed to load products from database:", error);
        if (!isMounted) return;
        setProducts([]);
        setFeaturedProducts([]);
        setProductError("Unable to load products from the database right now.");
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!filterOptions.length) {
      if (activeFilter) setActiveFilter("");
      return;
    }

    if (!activeFilter || !filterOptions.includes(activeFilter)) {
      setActiveFilter(filterOptions[0]);
    }
  }, [filterOptions, activeFilter]);

  const addToCart = (product) => {
    onAddToCart({ ...product, image: product.imageUrl });
  };

  const handleCheckout = (product) => {
    onDirectCheckout({ ...product, image: product.imageUrl });
    navigate("/Checkout");
  };

  const filtered = products.filter(p =>
    (!activeFilter || p.category === activeFilter) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --teal-main:    #0091A9;
          --teal-dark:    #006884;
          --teal-darkest: #00485C;
          --teal-card:    #004C59;
          --teal-image:   #008FA8;
          --green-accent: #20FF27;
          --blue-active:  #0082D9;
          --blue-inactive:#4D7C9C;
          --shadow-green: 0 4px 7px rgba(0,0,0,0.25);
        }

        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }


        /* ── Hero ── */
        .pp-hero {
          position: relative;
          width: 100%;
          background: var(--teal-main);
          overflow: hidden;
          padding-top: 64px;
          padding-bottom: 0;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .pp-cloud {
          position: absolute;
          z-index: 2;
          pointer-events: none;
          object-fit: contain;
        }
        .pp-cloud-1 { top: -5%; left: -8%; width: 45%; opacity: 0.95; animation: ppCloudRight 18s ease-in-out infinite; }
        .pp-cloud-2 { top: -45%; right: -5%; width: 50%; opacity: 0.9; animation: ppCloudLeft 22s ease-in-out infinite; }
        .pp-cloud-3 { bottom: -40%; left: -20%; width: 75%; opacity: 0.95; z-index: 10; animation: ppCloudRight 20s ease-in-out infinite; }
        .pp-cloud-4 { bottom: -25%; right: -30%; width: 80%; opacity: 0.9; z-index: 10; animation: ppCloudLeft 24s ease-in-out infinite; }

        @keyframes ppCloudRight {
          0% { transform: translate(-80px, 0) scale(1); }
          25% { transform: translate(0px, -10px) scale(1.02); }
          50% { transform: translate(80px, 0) scale(1); }
          75% { transform: translate(0px, 10px) scale(0.98); }
          100% { transform: translate(-80px, 0) scale(1); }
        }
        @keyframes ppCloudLeft {
          0% { transform: translate(80px, 0) scale(1); }
          25% { transform: translate(0px, 10px) scale(0.98); }
          50% { transform: translate(-80px, 0) scale(1); }
          75% { transform: translate(0px, -10px) scale(1.02); }
          100% { transform: translate(80px, 0) scale(1); }
        }

        .hero-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
          margin-top: 32px;
        }

        .hero-inner {
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-h1 { font-family: 'Instrument Serif', serif; font-size: clamp(40px, 6vw, 77px); color: #fff; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 8px; }
        .hero-h2 { font-weight: 700; font-size: clamp(32px, 5vw, 64px); color: #fff; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 24px; }
        .hero-h2 span { color: #FACC15; }
        .hero-p  { font-weight: 500; font-size: clamp(18px, 2vw, 24px); color: #fff; max-width: 720px; margin-bottom: 40px; }
        .hero-btn {
          background: #fff; color: #000; font-weight: 500; font-size: 18px;
          padding: 12px 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          margin-bottom: 64px; cursor: pointer; border: none; font-family: 'Inter', sans-serif;
          transition: background 0.2s, transform 0.1s;
        }
        .hero-btn:hover { background: #f3f4f6; }
        .hero-btn:active { transform: scale(0.97); }

        /* ── Carousel ── */
        .pp-carousel-outer {
          position: relative;
          z-index: 10;
          width: 100%;
          overflow: hidden;
          padding-bottom: 56px;
        }

        .pp-carousel-wrapper {
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        .pp-carousel-track {
          display: flex;
          gap: 24px;
          width: max-content;
          animation: ppCarouselScroll 30s linear infinite;
          padding: 8px 24px 32px;
        }

        .pp-carousel-track:hover {
          animation-play-state: paused;
        }

        .pp-carousel-card-slot {
          flex-shrink: 0;
          width: 280px;
        }

        .pp-carousel-card-slot .feat-card {
          width: 100%;
        }

        @keyframes ppCarouselScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ── Featured Card ── */
        .feat-card {
          background: var(--teal-card);
          border-radius: 33px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
          transition: transform 0.3s;
        }
        .feat-card:hover { transform: translateY(-8px); }
        .feat-card-img { position: relative; width: 100%; border-radius: 27px; overflow: hidden; margin-bottom: 16px; flex: 1; }
        .feat-card-img img { width: 100%; height: 100%; object-fit: cover; border-radius: 27px; transition: transform 0.5s; }
        .feat-card-img:hover img { transform: scale(1.05); }
        .feat-card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%); border-radius: 27px; }
        .feat-card-label { position: absolute; bottom: 24px; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 16px; }
        .feat-card-label h3 { color: #fff; font-weight: 500; font-size: 18px; margin-bottom: 4px; }
        .feat-card-label p  { color: #fff; font-weight: 500; font-size: 15px; }
        .feat-card-actions  { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 0 4px; margin-top: auto; flex-shrink: 0; }
        .feat-price-btn { flex: 1; height: 45px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 17px; color: #000; border: none; cursor: pointer; transition: background 0.2s; font-family: 'Inter', sans-serif; }
        .feat-price-btn:hover { background: #f3f4f6; }
        .feat-cart-btn { width: 50px; height: 45px; background: var(--green-accent); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-green); border: none; cursor: pointer; flex-shrink: 0; transition: filter 0.2s, transform 0.1s; }
        .feat-cart-btn:hover { filter: brightness(1.1); }
        .feat-cart-btn:active { transform: scale(0.95); }

        /* ── Category Section ── */
        .cat-section { width: 100%; background: #fff; padding: 32px 0; overflow: hidden; }
        /* BUG FIX: Removed margin-right from .cat-card; gap is now handled on the flex container in Marquee */
        .cat-card { width: 365px; height: 164px; background: #D9D9D9; border-radius: 25px; padding: 32px; display: flex; flex-direction: column; justify-content: center; flex-shrink: 0; cursor: pointer; transition: transform 0.3s; }
        .cat-card:hover { transform: translateY(-4px); }
        .cat-card h3 { font-weight: 600; font-size: 24px; color: #000; margin-bottom: 8px; letter-spacing: -0.02em; font-family: 'Inter', sans-serif; }
        .cat-card p  { font-weight: 500; font-size: 17px; color: #000; line-height: 1.35; font-family: 'Inter', sans-serif; }

        /* ── Filter Section ── */
        .filter-section { width: 100%; background: var(--teal-darkest); min-height: 95px; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .filter-inner { max-width: 1400px; width: 100%; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 16px; }
        .filter-btn { height: 50px; padding: 0 32px; border-radius: 12px; font-size: 18px; color: #fff; border: none; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.3s; }
        .filter-btn-active   { background: var(--blue-active); font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        .filter-btn-inactive { background: var(--blue-inactive); font-weight: 500; }
        .filter-btn-inactive:hover { background: rgba(0,130,217,0.8); }
        .search-box { height: 50px; width: 190px; background: var(--blue-inactive); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; transition: box-shadow 0.2s; }
        .search-box:focus-within { box-shadow: 0 0 0 2px var(--blue-active); }
        .search-box input { background: transparent; border: none; outline: none; color: #fff; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 18px; width: 100%; }
        .search-box input::placeholder { color: rgba(255,255,255,0.8); }

        /* ── Products Section ── */
        .products-section { width: 100%; background: var(--teal-dark); padding: 64px 0; }
        .products-inner { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
        .products-header { margin-bottom: 40px; }
        .products-header h2 { font-weight: 500; font-size: 35px; color: #fff; margin-bottom: 16px; font-family: 'Inter', sans-serif; }
        .products-divider { width: 100%; height: 3px; background: #fff; border-radius: 9999px; }
        .products-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; row-gap: 48px; }

        .prod-card { width: 100%; max-width: 274px; height: 342px; background: #fff; border-radius: 47px; padding: 12px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 16px rgba(0,0,0,0.15); margin: 0 auto; transition: transform 0.3s; }
        .prod-card:hover { transform: translateY(-8px); }
        .prod-img-wrap { width: 100%; height: 182px; background: var(--teal-image); border-radius: 47px; overflow: hidden; margin-bottom: 12px; }
        .prod-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .prod-card:hover .prod-img-wrap img { transform: scale(1.1); }
        .prod-info { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: auto; padding: 0 8px; }
        .prod-info h3 { font-weight: 500; font-size: 18px; color: #000; line-height: 1.2; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; font-family: 'Inter', sans-serif; }
        .prod-info p  { font-weight: 500; font-size: 15px; color: #000; font-family: 'Inter', sans-serif; }
        .prod-actions { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 4px 4px; gap: 8px; }
        .prod-price-btn { flex: 1; height: 40px; background: var(--green-accent); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 18px; color: #000; box-shadow: var(--shadow-green); border: none; cursor: pointer; font-family: 'Inter', sans-serif; transition: filter 0.2s, transform 0.1s; }
        .prod-price-btn:hover { filter: brightness(1.1); }
        .prod-cart-btn { width: 45px; height: 40px; background: var(--green-accent); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-green); flex-shrink: 0; border: none; cursor: pointer; transition: filter 0.2s, transform 0.1s; }
        .prod-cart-btn:hover { filter: brightness(1.1); }
        .prod-cart-btn:active, .prod-price-btn:active { transform: scale(0.95); }

        /* ── Province Groups ── */
        .province-group { margin-bottom: 56px; }
        .province-group:last-child { margin-bottom: 0; }
        .province-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 2px solid rgba(255,255,255,0.25);
        }
        .province-pin { font-size: 20px; line-height: 1; }
        .province-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(22px, 3vw, 32px);
          color: #fff;
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        /* ── Empty state ── */
        .empty-state { color: rgba(255,255,255,0.5); font-size: 18px; font-family: 'Inter', sans-serif; text-align: center; padding: 64px 0; grid-column: 1/-1; }

        /* ── Footer ── */
        .pp-footer { width: 100%; background: var(--teal-main); border-top: 1px solid #000; padding: 64px 0 96px; }
        .footer-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 64px; }
        .footer-brand h2 { font-weight: 600; font-size: 24px; color: #fff; letter-spacing: -0.02em; margin-bottom: 8px; font-family: 'Inter', sans-serif; }
        .footer-brand p  { font-weight: 500; font-size: 16px; color: #FFF9F9; font-family: 'Inter', sans-serif; }
        .footer-socials  { display: flex; align-items: center; gap: 24px; margin-top: 32px; }
        .footer-socials a { color: #fff; transition: opacity 0.2s; text-decoration: none; }
        .footer-socials a:hover { opacity: 0.8; }
        .footer-cols { display: flex; flex-wrap: wrap; gap: 48px; }
        .footer-col  { display: flex; flex-direction: column; gap: 16px; }
        .footer-col h3 { font-weight: 600; font-size: 16px; color: #fff; margin-bottom: 8px; font-family: 'Inter', sans-serif; }
        .footer-col a  { font-weight: 500; font-size: 16px; color: #FFF9F9; transition: color 0.2s; text-decoration: none; font-family: 'Inter', sans-serif; }
        .footer-col a:hover { color: #fff; }
        .footer-svg { fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .products-grid { grid-template-columns: repeat(3, 1fr); }
          .pp-carousel-card-slot { width: 260px; }
        }
        @media (max-width: 768px) {
          .products-grid { grid-template-columns: repeat(2, 1fr); }
          .search-box { width: 100%; }
          .pp-carousel-card-slot { width: 240px; }
        }
        @media (max-width: 480px) {
          .products-grid { grid-template-columns: 1fr; }
          .pp-carousel-card-slot { width: 220px; }
        }
      `}</style>

      <Navbar cartCount={cartCount} hideBackButton />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pp-hero">
        <img src={cloud1} alt="" className="pp-cloud pp-cloud-1" />
        <img src={cloud2} alt="" className="pp-cloud pp-cloud-2" />
        <img src={cloud3} alt="" className="pp-cloud pp-cloud-3" />
        <img src={cloud4} alt="" className="pp-cloud pp-cloud-4" />

        <div className="hero-content">
          <div className="hero-inner">
            <h1 className="hero-h1">Explore different</h1>
            <h2 className="hero-h2"><span>Products</span> in philippines</h2>
            <p className="hero-p">The Philippines is rich in diverse cultures, traditions, and languages.</p>
          </div>
        </div>

        <div className="pp-carousel-outer">
          {featuredCarouselProducts.length > 0 ? (
            <FeaturedCarousel products={featuredCarouselProducts} onSelect={setSelectedProduct} />
          ) : (
            <div className="empty-state">{loadingProducts ? "Loading featured products from database..." : "No featured products available yet."}</div>
          )}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────── */}
      <section className="cat-section">
        <Marquee speed={30}>
          {categoryCards.map((c, i) => (
            <div key={i} className="cat-card">
              <h3>{c.name}</h3>
              <p>{c.description}</p>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <section className="filter-section">
        <div className="filter-inner">
          {filterOptions.map(f => (
            <button
              key={f}
              className={`filter-btn ${activeFilter === f ? "filter-btn-active" : "filter-btn-inactive"}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
          <div className="search-box">
            <input
              type="text"
              placeholder="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── Products ─────────────────────────────────────────────────── */}
      <section className="products-section">
        <div className="products-inner">
          <div className="products-header">
            <h2>{activeFilter || "Products"}</h2>
            <div className="products-divider" />
          </div>
          {loadingProducts
            ? <div className="empty-state">Loading products from database...</div>
            : productError
            ? <div className="empty-state">{productError}</div>
            : filtered.length > 0
            ? (() => {
                const byProvince = filtered.reduce((acc, p) => {
                  if (!acc[p.location]) acc[p.location] = [];
                  acc[p.location].push(p);
                  return acc;
                }, {});
                return Object.entries(byProvince).map(([province, items]) => (
                  <div key={province} className="province-group">
                    <div className="province-header">
                      <span className="province-pin">📍</span>
                      <h3 className="province-title">{province}</h3>
                    </div>
                    <div className="products-grid">
                      {items.map((p, i) => <ProdCard key={i} product={p} onSelect={setSelectedProduct} />)}
                    </div>
                  </div>
                ));
              })()
            : <div className="empty-state">No products found.</div>
          }
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="pp-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <h2>SouCul</h2>
            <p>Descriptive line about what your company does.</p>
            <div className="footer-socials">
              <a href="#" aria-label="Instagram">
                <svg className="footer-svg" width="24" height="24" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg className="footer-svg" width="24" height="24" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="#" aria-label="Twitter">
                <svg className="footer-svg" width="24" height="24" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h3>Features</h3>
              <a href="#">Core features</a>
              <a href="#">Pro experience</a>
              <a href="#">Integrations</a>
            </div>
            <div className="footer-col">
              <h3>Learn more</h3>
              <a href="#">Blog</a>
              <a href="#">Case studies</a>
              <a href="#">Best practices</a>
              <a href="#">Customer stories</a>
            </div>
            <div className="footer-col">
              <h3>Support</h3>
              <a href="#">Contact</a>
              <a href="#">Support</a>
              <a href="#">Legal</a>
            </div>
          </div>
        </div>
      </footer>

      {selectedProduct && (
        <PPProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          onCheckoutProduct={handleCheckout}
        />
      )}

</>
  );
}
