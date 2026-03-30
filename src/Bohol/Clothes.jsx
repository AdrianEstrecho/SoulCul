import { useState } from "react";
import Navbar from "../Components/Navbar";
import Hero from "../Components/Hero";
import Categories from "../Components/Categories";
import Products from "../Components/Products";
import Footer from "../Components/Footer";

import shirtImg from "../assets/shirt.png";

const allProducts = [
  { id: 1, name: "Shirt", location: "Bohol", price: 1500, image: shirtImg },
];

const HeroSection = [
  { title: "Clothes", place: "Bohol" },
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
      <Categories activeCategory={activeCategory} onSelect={setActiveCategory} location="Bohol" />
      <Products
        products={allProducts}
        onAddToCart={handleAddToCart} onDirectCheckout={onDirectCheckout}
      />
      <Footer />
    </div>
  );
}
