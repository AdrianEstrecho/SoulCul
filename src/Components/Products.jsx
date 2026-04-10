import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CartIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

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

const TruckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const PRODUCT_DETAILS_FALLBACK = {
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
  const ratingRaw = Number(row.rating_average ?? row.rating ?? baseProduct.rating ?? PRODUCT_DETAILS_FALLBACK.rating);
  const rating = Number.isFinite(ratingRaw) ? Math.max(0, Math.min(5, ratingRaw)) : PRODUCT_DETAILS_FALLBACK.rating;

  const reviewsRaw = Number(row.review_count ?? row.reviews ?? PRODUCT_DETAILS_FALLBACK.reviews);
  const reviews = Number.isFinite(reviewsRaw) ? Math.max(0, Math.floor(reviewsRaw)) : PRODUCT_DETAILS_FALLBACK.reviews;

  const stockRaw = Number(row.quantity_in_stock ?? row.stock ?? baseProduct.stock ?? PRODUCT_DETAILS_FALLBACK.stock);
  const stock = Number.isFinite(stockRaw) ? Math.max(0, Math.floor(stockRaw)) : PRODUCT_DETAILS_FALLBACK.stock;

  const location = row.location || row.location_name || baseProduct.location || "Philippines";
  const category = row.category || row.category_name || baseProduct.category || "Product";
  const tags = Array.from(new Set([category, location, "Authentic"]))
    .filter(Boolean)
    .slice(0, 3);

  return {
    description: row.description || baseProduct.description || PRODUCT_DETAILS_FALLBACK.description,
    rating,
    reviews,
    deliveryTime: row.delivery_time || PRODUCT_DETAILS_FALLBACK.deliveryTime,
    material: row.material || PRODUCT_DETAILS_FALLBACK.material,
    seller: row.seller_name || row.seller || PRODUCT_DETAILS_FALLBACK.seller,
    stock,
    tags: tags.length ? tags : PRODUCT_DETAILS_FALLBACK.tags,
  };
}

function ProductModal({ product, onClose, onAddToCart, onCheckoutProduct }) {
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
      const productId = Number(product?.id);
      if (!Number.isFinite(productId) || productId <= 0) return;

      setLoadingDetails(true);

      try {
        const api = window.CustomerAPI || window.customerAPI;
        if (!api || typeof api.getProduct !== "function") {
          throw new Error("Customer API client is unavailable.");
        }

        const response = await api.getProduct(productId);
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
              <img src={product.image || product.imageUrl} alt={product.name} className="modal-product-img" />
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
                      <CartIcon size={16} />
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

export default function Products({ products, onAddToCart, onDirectCheckout }) {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleAddToCart = (product) => {
    onAddToCart(product);
  };

  const handleCheckout = (product) => {
    if (onDirectCheckout) {
      onDirectCheckout(product);
      navigate("/Checkout");
    }
  };

  return (
    <>
      <div className="product-grid">
        {products.map((product, i) => (
          <div key={`${product.id}-${i}`} className="product-card">
            <div className="product-img-wrapper" onClick={() => setSelectedProduct(product)} style={{ cursor: "pointer" }}>
              <img src={product.image} alt={product.name} className="product-img" />
            </div>
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-location">{product.location}</div>
            </div>
            <div className="product-actions">
              <button className="product-price-btn" onClick={() => setSelectedProduct(product)}>
                ₱{product.price.toLocaleString()}
              </button>
              <button className="product-cart-btn" onClick={() => setSelectedProduct(product)}>
                <CartIcon size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onCheckoutProduct={handleCheckout}
        />
      )}
    </>
  );
}
