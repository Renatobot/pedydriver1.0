import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA self-heal: if the app fails to boot (blank screen from a stale
// Service Worker cache), unregister SWs, clear caches, and reload once.
// Also bump this version to force-invalidate stale caches on all clients.
const APP_VERSION = "2026-07-05-1";
const VERSION_KEY = "__pedy_app_version";
const HEALED_KEY = "__pedy_sw_healed_at";

async function purgeServiceWorkersAndCaches() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    console.warn("[self-heal] purge failed", e);
  }
}

// Version bump → force one-time cleanup + reload
try {
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored !== APP_VERSION) {
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    const lastHeal = Number(localStorage.getItem(HEALED_KEY) || 0);
    if (Date.now() - lastHeal > 60_000) {
      localStorage.setItem(HEALED_KEY, String(Date.now()));
      purgeServiceWorkersAndCaches().finally(() => window.location.reload());
    }
  }
} catch {
  // ignore
}

// Safety net: if nothing renders within 8s (blank screen), self-heal once.
const HEAL_FLAG = "__pedy_boot_healed";
setTimeout(() => {
  const root = document.getElementById("root");
  const isEmpty = !root || root.childElementCount === 0;
  if (isEmpty && !sessionStorage.getItem(HEAL_FLAG)) {
    sessionStorage.setItem(HEAL_FLAG, "1");
    console.warn("[self-heal] Blank app detected, purging SW/caches and reloading");
    purgeServiceWorkersAndCaches().finally(() => window.location.reload());
  }
}, 8000);

createRoot(document.getElementById("root")!).render(<App />);
