import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

import mapImg from "../assets/PhilippineMap.png";
import cloud1 from "../assets/2 1.png";
import cloud2 from "../assets/3 1.png";
import cloud3 from "../assets/3A.png";
import cloud4 from "../assets/4A.png";
import pinImg from "../assets/pin.png";

import viganImg from "../assets/vigan.png";
import baguioImg from "../assets/baguio.png";
import tagaytayImg from "../assets/tagaytay.png";
import boracayImg from "../assets/boracay.png";
import boholImg from "../assets/bohol.png";

const LOCATIONS = [
  {
    id: 1, left: "43%", top: "25%",
    name: "Vigan",
    description: "Is a historic city in the province of Ilocos Sur, located in the northern part of Philippines. It is famous for its well-preserved Spanish colonial architecture, especially along Calle Crisologo. Vigan is recognized as a UNESCO World Heritage Site for its unique blend of Asian and Spanish cultural influences.",
    image: viganImg,
    zoomScale: 2.5, zoomX: "35%", zoomY: "25%",
    route: "/Vigan/Clothes",
  },
  {
    id: 2, left: "42%", top: "32%",
    name: "Baguio",
    description: 'Baguio City, known as the "Summer Capital of the Philippines," is a cool mountain destination famous for its pine trees, scenic views, and vibrant culture. Visitors are welcomed by the iconic Lion\'s Head along Kennon Road and can explore popular spots like Burnham Park, Mines View Park, and Camp John Hay.',
    image: baguioImg,
    zoomScale: 2.5, zoomX: "38%", zoomY: "30%",
    route: "/Baguio/Clothes",
  },
  {
    id: 3, left: "44%", top: "43%",
    name: "Tagaytay",
    description: "Tagaytay is the Philippines' favorite cool-weather escape. Located just south of Manila, it offers a refreshing break from the tropical heat and some of the most iconic landscapes in the country.",
    image: tagaytayImg,
    zoomScale: 2.5, zoomX: "38%", zoomY: "40%",
    route: "/Tagaytay/Clothes",
  },
  {
    id: 4, left: "50%", top: "66%",
    name: "Boracay",
    description: "Boracay is a popular vacation spot, and well-known for its white-powder beaches, crystal-blue waters and vibrant, exotic atmosphere. Nature-lovers who enjoy hiking will also appreciate the island's tropical, hilly landscape, which is populated by a variety of species of wildlife.",
    image: boracayImg,
    zoomScale: 2.5, zoomX: "43%", zoomY: "50%",
    route: "/Boracay/Clothes",
  },
  {
    id: 5, left: "60%", top: "74%",
    name: "Bohol",
    description: "Bohol is a scenic island province in the Philippines known for its world-famous Chocolate Hills, crystal-clear waters, and rich marine life. It's also home to the tiny tarsier, centuries-old Spanish churches, and beautiful white-sand beaches like Panglao, making it a perfect mix of nature, history, and relaxation.",
    image: boholImg,
    zoomScale: 2.5, zoomX: "50%", zoomY: "60%",
    route: "/Bohol/Clothes",
  },
];

export default function HomePin({ cartCount }) {
  const [selectedId, setSelectedId] = useState(null);
  const [panelKey, setPanelKey] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const handleGoHome = () => {
    setLeaving(true);
    setTimeout(() => navigate("/"), 600);
  };

  const selectedLoc = LOCATIONS.find((l) => l.id === selectedId);

  const zoomStyle = selectedLoc
    ? {
        transform: `scale(${selectedLoc.zoomScale})`,
        transformOrigin: `${selectedLoc.zoomX} ${selectedLoc.zoomY}`,
      }
    : { transform: "scale(1)", transformOrigin: "center center" };

  const selectLocation = (id) => {
    setSelectedId(id);
    setPanelKey((k) => k + 1);
  };

  const closePanel = () => {
    setSelectedId(null);
  };

  return (
    <div className={`homepin-map-container${leaving ? " homepin-zoom-out" : ""}`}>
      <Navbar cartCount={cartCount} onGoHome={handleGoHome} />

      <div className="homepin-map-zoom" style={zoomStyle}>
        <img src={mapImg} alt="Philippines Map" className="homepin-map-img" />

        <img src={cloud1} alt="" className="homepin-cloud homepin-cloud-1" />
        <img src={cloud2} alt="" className="homepin-cloud homepin-cloud-2" />
        <img src={cloud3} alt="" className="homepin-cloud homepin-cloud-3" />
        <img src={cloud4} alt="" className="homepin-cloud homepin-cloud-4" />

        <div className="homepin-pin-container">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              className={`homepin-pin-btn${selectedId === loc.id ? " active-pin" : ""}${selectedId && selectedId !== loc.id ? " zoomed-mode" : ""}`}
              style={{ left: loc.left, top: loc.top }}
              aria-label={`View location: ${loc.name}`}
              onClick={() => selectLocation(loc.id)}
            >
              <img src={pinImg} alt="" className="homepin-pin-img" />
            </button>
          ))}
        </div>
      </div>

      {selectedLoc && (
        <div
          key={panelKey}
          className="homepin-info-panel"
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="homepin-btn-close" onClick={closePanel}>&#x2715;</button>

          <div className="homepin-panel-header homepin-stagger-1">
            <h2 className="homepin-panel-title">{selectedLoc.name}</h2>
            <button
              className="homepin-btn-products"
              onClick={() => navigate(selectedLoc.route)}
            >
              View Products
            </button>
          </div>

          <div className="homepin-panel-desc homepin-stagger-2">
            <p>{selectedLoc.description}</p>
          </div>

          <div className="homepin-panel-img-wrap homepin-stagger-3">
            <img src={selectedLoc.image} alt={selectedLoc.name} />
          </div>
        </div>
      )}
    </div>
  );
}
