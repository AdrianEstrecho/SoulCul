import { useState } from "react";
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

const productDetails = {
  default: {
    description: "A beautifully crafted item from the rich cultural heritage of the Philippines, made with traditional techniques passed down through generations.",
    rating: 4.8,
    reviews: 124,
    deliveryTime: "3–5 business days",
    material: "Locally sourced",
    seller: "Philippine Heritage Crafts",
    stock: 12,
    tags: ["Handmade", "Cultural", "Authentic"],
  },
};

function ProductModal({ product, onClose, onAddToCart, onCheckoutProduct }) {
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const details = productDetails[product.id] || productDetails.default;
  const price = `₱${product.price.toLocaleString()}`;
  const totalPrice = `₱${(product.price * qty).toLocaleString()}`;

  const handleAdd = () => {
    onAddToCart({ ...product, qty });
    setAdded(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        <div className="modal-body">
          <div className="modal-image-side">
            <div className="modal-image-wrapper">
              <img src={product.image} alt={product.name} className="modal-product-img" />
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
                  <span key={s} className={s <= Math.round(details.rating) ? "star-filled" : "star-empty"}>
                    <StarIcon filled={s <= Math.round(details.rating)} />
                  </span>
                ))}
              </div>
              <span className="modal-rating-score">{details.rating}</span>
              <span className="modal-review-count">({details.reviews} reviews)</span>
            </div>
            <p className="modal-description">{details.description}</p>
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
                <span className="modal-info-value">{details.stock} left</span>
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
                <button type="button" className="modal-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="modal-qty-value">{qty}</span>
                <button type="button" className="modal-qty-btn" onClick={() => setQty(q => Math.min(details.stock, q + 1))}>+</button>
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
                    <button className="modal-checkout-btn" onClick={() => { onClose(); onCheckoutProduct({ ...product, qty }); }}>
                      <span>Checkout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="modal-add-btn" onClick={handleAdd}>
                      <CartIcon size={16} />
                      <span>Add to Cart</span>
                    </button>
                    <button className="modal-checkout-btn" onClick={() => { onClose(); onCheckoutProduct({ ...product, qty }); }}>
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
