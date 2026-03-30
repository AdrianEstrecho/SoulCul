import { useState } from "react";
import Navbar from "../Components/Navbar";
import Hero from "../Components/Hero";
import Categories from "../Components/Categories";
import Products from "../Components/Products";
import Footer from "../Components/Footer";

import bibingkaImg from "../assets/bibingka.png";

const allProducts = [
  { id: 1, name: "Royal Bibingka", location: "Baguio", price: 1500, image: bibingkaImg },
];

const HeroSection = [
  { title: "Delicacies", place: "Baguio" },
];

export default function Clothes({ cartCount, onAddToCart, onDirectCheckout }) {
  const [activeCategory, setActiveCategory] = useState("Delicacies");

  const handleAddToCart = (product) => {
    onAddToCart(product);
  };

  return (
    <div className="soucul-app">
      <Navbar cartCount={cartCount} />
      <Hero hero={HeroSection} />
      <Categories activeCategory={activeCategory} onSelect={setActiveCategory} location="Baguio" />
      <Products
        products={allProducts}
        onAddToCart={handleAddToCart} onDirectCheckout={onDirectCheckout}
      />
      <Footer />
    </div>
  );
}
