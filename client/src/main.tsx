import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Sentry init runs AFTER React mounts so its dynamic import can never
// interleave with React's first render (which is what surfaced as the
// "Invalid hook call" / dispatcher.useContext crash earlier when
// @sentry/react was eager-imported and pulled in a duplicate React peer).
// @sentry/browser has no React peer dep, but we keep the dynamic-import-
// after-mount pattern for defense in depth.
void (async () => {
  try {
    const { initSentry } = await import("./lib/sentry");
    await initSentry();
  } catch {
    /* Sentry must never break the app */
  }
})();
