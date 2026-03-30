import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SoulCul from "./SoulCul";
import "./index.css"; 

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SoulCul />
  </StrictMode>
);