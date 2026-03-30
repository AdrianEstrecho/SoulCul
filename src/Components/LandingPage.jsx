import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import mapBg from "../assets/PhilippineMap.png";
import cloud1 from "../assets/2 1.png";
import cloud2 from "../assets/3 1.png";
import cloud3 from "../assets/3A.png";
import cloud4 from "../assets/4A.png";

import viganImg from "../assets/vigan.png";
import boholImg from "../assets/bohol.png";
import boracayImg from "../assets/boracay.png";
import tagaytayImg from "../assets/tagaytay.png";
import baguioImg from "../assets/baguio.png";
import handwovenImg from "../assets/handwovenbaskets.png";
import burnayImg from "../assets/burnaypottery.jpg";
import kalesaImg from "../assets/kalesa.jpg";

const carouselImages = [
  viganImg, boholImg, boracayImg, tagaytayImg,
  baguioImg, handwovenImg, burnayImg, kalesaImg,
];

const categories = [
  { name: "Clothes", desc: "Designs made by local artists for street wear and casual wear.", path: "/Clothes" },
  { name: "Handicrafts", desc: "Keychains for memories, bringing a piece of the vacation spot with you.", path: "/Handicrafts" },
  { name: "Decorations", desc: "Designs made by local artists for street wear and casual wear.", path: "/Decorations" },
  { name: "Delicacies", desc: "Authentic Filipino treats and delicacies from different regions.", path: "/Delicacies" },
  { name: "Homeware", desc: "Handcrafted homeware pieces that bring Filipino culture to your home.", path: "/Homeware" },
];

export default function LandingPage({ cartCount }) {
  const navigate = useNavigate();
  const [zooming, setZooming] = useState(false);

  const handleHeroClick = () => {
    setZooming(true);
    setTimeout(() => navigate("/Map"), 600);
  };

  // Duplicate arrays for seamless infinite scroll
  const doubledImages = [...carouselImages, ...carouselImages];
  const doubledCategories = [...categories, ...categories];

  return (
    <div className="soucul-app landing">
      <Navbar cartCount={cartCount} hideBackButton />

      {/* Hero section */}
      <section className={`landing-hero${zooming ? " hero-zoom-out" : ""}`} onClick={handleHeroClick} style={{ cursor: "pointer" }}>
        <img src={mapBg} alt="Philippines Map" className="landing-map" />
        <img src={cloud1} alt="" className="landing-cloud landing-cloud-1" />
        <img src={cloud2} alt="" className="landing-cloud landing-cloud-2" />
        <img src={cloud3} alt="" className="landing-cloud landing-cloud-3" />
        <img src={cloud4} alt="" className="landing-cloud landing-cloud-4" />

        <div className="landing-title-group">
          <h1 className="landing-title">SoulCul</h1>
          <span className="landing-badge">SOUVENIER</span>
        </div>
      </section>

      {/* Explore section */}
      <section className="explore-section">
        <img src={cloud1} alt="" className="explore-cloud explore-cloud-left" />
        <img src={cloud2} alt="" className="explore-cloud explore-cloud-right" />

        <div className="explore-header">
          <h2 className="explore-title">
            Explore different <br />
            <span className="explore-highlight">Products</span> in Philippines
          </h2>
          <p className="explore-subtitle">
            The Philippines is rich in diverse cultures, traditions, and languages.
          </p>
          <button className="btn-explore" onClick={() => navigate("/Clothes")}>Explore</button>
        </div>

        {/* Image carousel */}
        <div className="carousel-wrapper">
          <div className="carousel-track">
            {doubledImages.map((img, i) => (
              <div className="carousel-card" key={i}>
                <img src={img} alt="" className="carousel-img" />
              </div>
            ))}
          </div>
        </div>

        {/* Category carousel */}
        <div className="carousel-wrapper category-carousel-wrapper">
          <div className="carousel-track category-track">
            {doubledCategories.map((cat, i) => (
              <div
                className="category-card"
                key={i}
                onClick={() => navigate(cat.path)}
              >
                <h3 className="category-card-title">{cat.name}</h3>
                <p className="category-card-desc">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
