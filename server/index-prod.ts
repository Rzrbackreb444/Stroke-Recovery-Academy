import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import express, { type Express } from "express";
import runApp from "./app";

export async function serveStatic(app: Express, _server: Server) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (with per-route meta injection)
  const indexHtmlPath = path.resolve(distPath, "index.html");
  let indexHtmlCache: string | null = null;
  app.use("*", async (req, res) => {
    try {
      if (!indexHtmlCache) {
        indexHtmlCache = await fs.promises.readFile(indexHtmlPath, "utf-8");
      }
      const { applyRouteMeta } = await import("./seo/applyRouteMeta");
      const page = applyRouteMeta(indexHtmlCache, req.originalUrl, req.headers.host);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (err) {
      console.error("[serveStatic] meta inject failed, falling back to raw index.html:", err);
      res.sendFile(indexHtmlPath);
    }
  });
}

// Prevent crash-loops from unhandled rejections / uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  console.error("[process] Uncaught exception (non-fatal, keeping server alive):", err?.message ?? err);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("[process] Unhandled rejection (non-fatal, keeping server alive):", reason);
});

(async () => {
  try {
    await runApp(serveStatic);
  } catch (err: any) {
    console.error("[startup] runApp failed, attempting to serve static files only:", err?.message ?? err);
    // Last resort: serve static files even if full app initialization failed
    const fallbackApp = express();
    const distPath = path.resolve(import.meta.dirname, "public");
    if (fs.existsSync(distPath)) {
      fallbackApp.use(express.static(distPath));
      fallbackApp.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
      const port = parseInt(process.env.PORT || "5000", 10);
      fallbackApp.listen(port, "0.0.0.0", () => {
        console.log(`[startup] Fallback static server running on port ${port}`);
      });
    } else {
      console.error("[startup] No build directory found, cannot start fallback server.");
      process.exit(1);
    }
  }
})();
