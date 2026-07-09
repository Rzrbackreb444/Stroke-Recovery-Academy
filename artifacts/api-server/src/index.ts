import type { Express } from "express";

import runApp from "./app";

async function noopSetup(app: Express) {
  // Frontend is served by the separate stroke-recovery-academy artifact
  // (Vite dev server on port 3001, which proxies /api, /auth, /objects and
  // /anchor back to this process). This api-server only handles those API
  // routes and intentionally does NOT run Vite or serve any HTML.
  //
  // A minimal root handler keeps the platform webview health-check (which
  // pings `/` for an HTTP 200) green even though there is no frontend here.
  app.get("/", (_req, res) => {
    res.status(200).json({
      service: "api-server",
      status: "ok",
      note: "Frontend is served by the stroke-recovery-academy artifact on port 3001.",
    });
  });
}

(async () => {
  await runApp(noopSetup);
})();
