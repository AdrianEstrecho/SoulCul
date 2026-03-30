import { useState } from "react";
import Navbar from "../Components/Navbar";
import Hero from "../Components/Hero";
import Categories from "../Components/Categories";
import Products from "../Components/Products";
import Footer from "../Components/Footer";

import shirtImg from "../assets/shirt.png";

const allProducts = [
  { id: 1, name: "Shirt", location: "Tagaytay", price: 1500, image: shirtImg },
];

const HeroSection = [
  { title: "Clothes", place: "Tagaytay" },
];

export default function Clothes({ cartCount, onAddToCart, onDirectCheckout }) {
  const [activeCategory, setActiveCategory] = useState("Clothes");

  const handleAddToCart = (product) => {
    onAddToCart(product);
  };

  return (
    <div className="soucul-app">
      <Navbar cartCount={cartCount} />
      <Hero hero={HeroSection} />
      <Categories activeCategory={activeCategory} onSelect={setActiveCategory} location="Tagaytay" />
      <Products
        products={allProducts}
        onAddToCart={handleAddToCart} onDirectCheckout={onDirectCheckout}
      />
      <Footer />
    </div>
  );
}
