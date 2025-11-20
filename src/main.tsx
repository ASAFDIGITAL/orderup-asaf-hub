import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/hooks/use-debug-logger";

createRoot(document.getElementById("root")!).render(<App />);
