import { WorkspaceProvider } from "./features/auth/WorkspaceProvider.jsx";
import "./styles/app.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { StudioProvider } from "./state/StudioContext.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WorkspaceProvider>
      <StudioProvider>
        <App />
      </StudioProvider>
    </WorkspaceProvider>
  </React.StrictMode>,
);
