import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./z80/presentation/ThemeContext";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./firebase";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);