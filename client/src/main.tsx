import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { logEnvironmentInfo } from "./lib/debug";

// 환경 정보 로깅 (개발 환경)
logEnvironmentInfo();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);
