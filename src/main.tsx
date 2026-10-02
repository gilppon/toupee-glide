import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { soundFX } from "./audio/SoundEffects";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary
      gameName="Toupee Glide"
      accent="#fbbf24"
      saveKeys={["flying_toupee_glider_save_v1"]}
      onCrash={() => soundFX.stopMusic()}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
);
