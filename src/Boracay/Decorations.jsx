import { useState } from "react";
import Navbar from "../Components/Navbar";
import Hero from "../Components/Hero";
import Categories from "../Components/Categories";
import Products from "../Components/Products";
import Footer from "../Components/Footer";

import burnayartprintsImg from "../assets/burnayartprints.png";

const allProducts = [
  { id: 1, name: "Burnay art prints", location: "Boragay", price: 1500, image: burnayartprintsImg },
];

const HeroSection = [
  { title: "Decorations", place: "Boragay" },
];

export default function Clothes({ cartCount, onAddToCart, onDirectCheckout }) {
  const [activeCategory, setActiveCategory] = useState("Decorations");

  const handleAddToCart = (product) => {
    onAddToCart(product);
  };

  return (
    <div className="soucul-app">
      <Navbar cartCount={cartCount} />
      <Hero hero={HeroSection} />
      <Categories activeCategory={activeCategory} onSelect={setActiveCategory} location="Boracay" />
      <Products
        products={allProducts}
        onAddToCart={handleAddToCart} onDirectCheckout={onDirectCheckout}
      />
      <Footer />
    </div>
  );
}
