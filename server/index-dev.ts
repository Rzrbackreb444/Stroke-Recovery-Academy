import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import { nanoid } from "nanoid";
import express, { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";

import viteConfig from "../vite.config";
import runApp from "./app";

export async function setupVite(app: Express, server: Server) {
  // The blog and recovery catalogs use the repository-level public/images
  // directory. Mount it before Vite's SPA fallback so missing assets never
  // receive index.html as a 200 response.
  app.use("/images", express.static(path.resolve(import.meta.dirname, "..", "public", "images")));

  const viteLogger = createLogger();
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // SEO: if the request is from a search-engine crawler AND the path looks
      // like a definitively-bad URL (asset extensions, common probes, deeply
      // nested gibberish), return a real 404 so we don't soft-404 every miss.
      const { isBotRequest } = await import("./seo/landingRoutes");
      const { renderSsr404 } = await import("./seo/ssrShell");
      const ua = req.headers["user-agent"];
      const path404 = url.split("?")[0];
      const looksLikeBadPath =
        /\.(php|asp|jsp|env|git|sql|bak|old|swp)$/i.test(path404) ||
        /\/(wp-admin|wp-login|xmlrpc|administrator|cgi-bin)/i.test(path404);
      if (isBotRequest(ua) && looksLikeBadPath) {
        res.status(404).set({ "Content-Type": "text/html" }).end(renderSsr404());
        return;
      }

      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      let page = await vite.transformIndexHtml(url, template);
      const { applyRouteMeta } = await import("./seo/applyRouteMeta");
      page = applyRouteMeta(page, url, req.headers.host);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

(async () => {
  await runApp(setupVite);
})();
