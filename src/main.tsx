import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./z80/presentation/ThemeContext";
import { FeatureToggleProvider } from "./z80/presentation/FeatureToggleContext";
import { ToastProvider } from "./z80/presentation/ToastContext";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./firebase";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <FeatureToggleProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </FeatureToggleProvider>
  </ThemeProvider>
);