import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";
import { VisionUIControllerProvider } from "context";
import { AuthProvider } from "context/AuthContext";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <BrowserRouter>
    <VisionUIControllerProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </VisionUIControllerProvider>
  </BrowserRouter>
);
