/**
 * Route-level coverage for anonymous buying-guide analytics.
 *
 * Set DATABASE_URL to run this against a disposable or development database.
 * The fixture uses unique article slugs and removes its rows during teardown.
 */
import assert from "node:assert/strict";
import { type Server } from "node:http";
import { randomUUID } from "node:crypto";
import express from "express";
import test from "node:test";

const canRun = Boolean(process.env.DATABASE_URL);

function getCookie(response: Response): string {
  const setCookie =
    typeof (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()[0]
      : response.headers.get("set-cookie");
  assert.ok(setCookie, "login response did not set a session cookie");
  return setCookie.split(";", 1)[0];
}

async function jsonRequest(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  cookie?: string,
): Promise<{ response: Response; body: any }> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  // Production cookies are Secure because Replit terminates TLS at the proxy.
  headers.set("X-Forwarded-Proto", "https");
  if (cookie) headers.set("Cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const text = await response.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { response, body };
}

async function login(baseUrl: string, email: string, password: string): Promise<string> {
  const { response, body } = await jsonRequest(baseUrl, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, `login failed: ${JSON.stringify(body)}`);
  return getCookie(response);
}

test(
  "anonymous blog-view events and admin guide aggregation stay complete and identity-free",
  { skip: !canRun, timeout: 120_000 },
  async () => {
    const [{ db, pool }, { users }, { sql }] = await Promise.all([
      import("../server/db"),
      import("../shared/schema"),
      import("drizzle-orm"),
    ]);
    const { hashPassword } = await import("../server/multiProviderAuth");

    const suffix = randomUUID();
    const adminId = `blog-analytics-admin-${suffix}`;
    const adminEmail = `${adminId}@example.test`;
    const password = "blog-analytics-test-password";
    const viewsOnlySlug = `blog-guide-views-only-${suffix}`;
    const clickOnlySlug = `legacy-click-only-${suffix}`;
    const mixedSlug = `blog-guide-mixed-${suffix}`;
    const oldSlug = `blog-guide-old-only-${suffix}`;
    const slugs = [viewsOnlySlug, clickOnlySlug, mixedSlug, oldSlug];

    let appServer: Server | undefined;
    const activeIntervals: ReturnType<typeof setInterval>[] = [];
    const activeTimeouts: ReturnType<typeof setTimeout>[] = [];
    const originalSetInterval = globalThis.setInterval;
    const originalSetTimeout = globalThis.setTimeout;
    const originalFetch = globalThis.fetch;
    const previousIssuer = process.env.ISSUER_URL;
    const previousReplId = process.env.REPL_ID;
    const previousSessionSecret = process.env.SESSION_SECRET;

    try {
      await db.insert(users).values({
        id: adminId,
        email: adminEmail,
        passwordHash: hashPassword(password),
        authProvider: "local",
        role: "admin",
      });

      // setupAuth discovers the OIDC issuer during route registration. Keep
      // this test independent of the external Replit discovery endpoint.
      const issuer = `https://blog-analytics-${suffix}.invalid`;
      process.env.ISSUER_URL = issuer;
      process.env.REPL_ID = previousReplId || "blog-analytics-test-client";
      process.env.SESSION_SECRET = previousSessionSecret || "blog-analytics-test-session-secret";
      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url === `${issuer}/.well-known/openid-configuration`) {
          return new Response(
            JSON.stringify({
              issuer,
              authorization_endpoint: `${issuer}/authorize`,
              token_endpoint: `${issuer}/token`,
              userinfo_endpoint: `${issuer}/userinfo`,
              jwks_uri: `${issuer}/jwks`,
              response_types_supported: ["code"],
              subject_types_supported: ["public"],
              id_token_signing_alg_values_supported: ["RS256"],
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        }
        return originalFetch(input, init);
      }) as typeof fetch;

      globalThis.setInterval = ((...args: Parameters<typeof setInterval>) => {
        const handle = originalSetInterval(...args);
        activeIntervals.push(handle);
        handle.unref();
        return handle;
      }) as typeof setInterval;
      globalThis.setTimeout = ((...args: Parameters<typeof setTimeout>) => {
        const handle = originalSetTimeout(...args);
        activeTimeouts.push(handle);
        handle.unref();
        return handle;
      }) as typeof setTimeout;

      const { registerRoutes } = await import("../server/routes");
      const app = express();
      app.use(express.json());
      appServer = await registerRoutes(app);
      await new Promise<void>((resolve, reject) => {
        appServer!.once("error", reject);
        appServer!.listen(0, "127.0.0.1", resolve);
      });
      const address = appServer.address();
      assert.ok(address && typeof address !== "string");
      const baseUrl = `http://127.0.0.1:${address.port}`;
      const adminCookie = await login(baseUrl, adminEmail, password);

      // Exercise the public route with identity-shaped fields included in the
      // payload. The route must accept only the editorial article slug.
      const viewEvent = await jsonRequest(baseUrl, "/api/analytics/blog-view", {
        method: "POST",
        body: JSON.stringify({
          articleSlug: viewsOnlySlug,
          visitorId: "visitor-must-not-persist",
          userId: "user-must-not-persist",
          ip: "192.0.2.10",
          referrer: "https://example.test/referrer",
        }),
      });
      assert.equal(viewEvent.response.status, 204);

      // Seed the remaining event combinations at known timestamps. The
      // click-only row represents a guide created before view tracking existed.
      await db.execute(sql`
        INSERT INTO blog_guide_views (article_slug, created_at)
        VALUES
          (${viewsOnlySlug}, NOW() - INTERVAL '1 day'),
          (${mixedSlug}, NOW() - INTERVAL '2 days'),
          (${mixedSlug}, NOW() - INTERVAL '3 days'),
          (${oldSlug}, NOW() - INTERVAL '40 days')
      `);
      await db.execute(sql`
        INSERT INTO blog_outbound_clicks (article_slug, product_category, recommendation, created_at)
        VALUES
          (${clickOnlySlug}, 'legacy', 'Legacy recommendation', NOW() - INTERVAL '1 day'),
          (${clickOnlySlug}, 'legacy', 'Legacy recommendation', NOW() - INTERVAL '2 days'),
          (${mixedSlug}, 'mobility', 'Mixed recommendation', NOW() - INTERVAL '1 day'),
          (${oldSlug}, 'old', 'Expired recommendation', NOW() - INTERVAL '40 days')
      `);

      const report = await jsonRequest(
        baseUrl,
        "/api/admin/blog/outbound-clicks?days=7",
        {},
        adminCookie,
      );
      assert.equal(report.response.status, 200, `admin report failed: ${JSON.stringify(report.body)}`);
      assert.equal(report.body.rangeDays, 7);
      assert.deepEqual(report.body.totals, {
        views: 4,
        clicks: 3,
        clickThroughRate: 75,
        guides: 3,
        recommendations: 2,
      });

      const guides = new Map(report.body.guides.map((guide: any) => [guide.articleSlug, guide]));
      assert.deepEqual(guides.get(viewsOnlySlug), {
        articleSlug: viewsOnlySlug,
        views: 2,
        clicks: 0,
        clickThroughRate: 0,
        latestView: guides.get(viewsOnlySlug).latestView,
        latestClick: null,
      });
      assert.equal(guides.get(clickOnlySlug).views, 0);
      assert.equal(guides.get(clickOnlySlug).clicks, 2);
      assert.equal(guides.get(clickOnlySlug).clickThroughRate, null);
      assert.equal(guides.get(mixedSlug).views, 2);
      assert.equal(guides.get(mixedSlug).clicks, 1);
      assert.equal(guides.get(mixedSlug).clickThroughRate, 50);
      assert.equal(guides.has(oldSlug), false, "events outside the requested date range must be excluded");

      assert.deepEqual(report.body.rows, [
        {
          articleSlug: clickOnlySlug,
          productCategory: "legacy",
          recommendation: "Legacy recommendation",
          clicks: 2,
          latestClick: report.body.rows[0].latestClick,
        },
        {
          articleSlug: mixedSlug,
          productCategory: "mobility",
          recommendation: "Mixed recommendation",
          clicks: 1,
          latestClick: report.body.rows[1].latestClick,
        },
      ]);

      const storedView = await db.execute(sql`
        SELECT * FROM blog_guide_views WHERE article_slug = ${viewsOnlySlug}
      `);
      assert.equal(storedView.rows.length, 2);
      assert.deepEqual(Object.keys(storedView.rows[0]).sort(), ["article_slug", "created_at", "id"]);

      const viewColumns = await pool.query<{ column_name: string }>(`
        SELECT column_name
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'blog_guide_views'
         ORDER BY ordinal_position
      `);
      assert.deepEqual(
        viewColumns.rows.map((row) => row.column_name),
        ["id", "article_slug", "created_at"],
        "guide views must not gain visitor identity columns",
      );

      const responseKeys = new Set<string>();
      for (const guide of report.body.guides) {
        Object.keys(guide).forEach((key) => responseKeys.add(key));
      }
      for (const row of report.body.rows) {
        Object.keys(row).forEach((key) => responseKeys.add(key));
      }
      for (const identityKey of ["visitorId", "userId", "ip", "referrer", "browserId", "sessionId"]) {
        assert.equal(responseKeys.has(identityKey), false, `${identityKey} must not be returned by the report`);
      }
      assert.doesNotMatch(JSON.stringify(report.body), /visitor-must-not-persist|user-must-not-persist|192\.0\.2\.10/);
    } finally {
      if (appServer) {
        await new Promise<void>((resolve) => appServer!.close(() => resolve()));
      }
      for (const interval of activeIntervals) clearInterval(interval);
      for (const timeout of activeTimeouts) clearTimeout(timeout);
      globalThis.fetch = originalFetch;
      globalThis.setInterval = originalSetInterval;
      globalThis.setTimeout = originalSetTimeout;
      if (previousIssuer === undefined) delete process.env.ISSUER_URL;
      else process.env.ISSUER_URL = previousIssuer;
      if (previousReplId === undefined) delete process.env.REPL_ID;
      else process.env.REPL_ID = previousReplId;
      if (previousSessionSecret === undefined) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = previousSessionSecret;

      await db.execute(sql`DELETE FROM blog_guide_views WHERE article_slug IN (${sql.join(slugs.map((slug) => sql`${slug}`), sql`, `)})`);
      await db.execute(sql`DELETE FROM blog_outbound_clicks WHERE article_slug IN (${sql.join(slugs.map((slug) => sql`${slug}`), sql`, `)})`);
      await db.delete(users).where(sql`${users.id} = ${adminId}`);
      await pool.end();
      // The Neon pool can leave already-idle TLS sockets referenced after
      // end() resolves. They are not owned by this test, so do not keep the
      // test runner alive waiting for them.
      for (const handle of process._getActiveHandles()) {
        handle.unref?.();
      }
    }
  },
);