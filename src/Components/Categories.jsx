import { useNavigate } from "react-router-dom";

const categories = ["Clothes", "Handicrafts", "Delicacies", "Decorations", "Homeware"];

export default function Categories({ activeCategory, onSelect, location = "Vigan" }) {
  const navigate = useNavigate();

  const handleClick = (cat) => {
    onSelect(cat);
    navigate(`/${location}/${cat}`);
  };

  return (
    <div className="category-bar">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-btn ${activeCategory === cat ? "active" : ""}`}
          onClick={() => handleClick(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}