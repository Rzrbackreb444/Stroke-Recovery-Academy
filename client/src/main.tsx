import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import { initSentry } from "./lib/sentry";

// Fire-and-forget — don't block first paint on Sentry config fetch.
void initSentry();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
