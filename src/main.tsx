import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";
import { toFriendlyMessage } from "./lib/errors";

// Global safety nets for uncaught errors and unhandled promise rejections.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    console.error("[unhandledrejection]", event.reason);
    try {
      toast.error(toFriendlyMessage(event.reason));
    } catch {
      /* ignore toast failures */
    }
  });
  window.addEventListener("error", (event) => {
    // Ignore ResizeObserver noise which is benign
    if (event.message?.includes("ResizeObserver")) return;
    console.error("[window.error]", event.error || event.message);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
