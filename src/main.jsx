import "./styles/app.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { StudioProvider } from "./state/StudioContext.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StudioProvider>
      <App />
    </StudioProvider>
  </React.StrictMode>,
);
