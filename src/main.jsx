import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SouCul from "./SouCul";
import "./index.css"; 

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SouCul />
  </StrictMode>
);