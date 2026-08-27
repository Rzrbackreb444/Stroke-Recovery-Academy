import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const RECOVERY_RETURN_PATHS = [
  "/recovery/today",
  "/recovery/onboarding",
  "/recovery/community",
  "/recovery/journal",
  "/recovery/me",
  "/recovery/dashboard",
  "/recovery/activity",
  "/recovery/welcome",
];

export function safeRecoveryReturnTo(value: unknown, fallback = "/recovery/today"): string {
  if (typeof value !== "string") return fallback;
  const decoded = value.trim();
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) return fallback;
  return RECOVERY_RETURN_PATHS.some((path) => decoded === path || decoded.startsWith(`${path}?`))
    ? decoded
    : fallback;
}

/**
 * Recovery is complete only after both the survivor assessment and the
 * generated plan exist. If the check cannot be read, keep the survivor in
 * onboarding rather than allowing a transient database failure to bypass it.
 */
export async function getRecoveryAuthRedirect(userId: string, requestedReturnTo: unknown): Promise<string> {
  const returnTo = safeRecoveryReturnTo(requestedReturnTo);

  try {
    const { db: authDb } = await import("./db");
    const { sasquatchAssessments, survivorPlans } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    const [[assessment], [plan]] = await Promise.all([
      authDb.select({ id: sasquatchAssessments.id })
        .from(sasquatchAssessments)
        .where(eq(sasquatchAssessments.userId, userId))
        .limit(1),
      authDb.select({ id: survivorPlans.id })
        .from(survivorPlans)
        .where(eq(survivorPlans.userId, userId))
        .limit(1),
    ]);

    return assessment && plan ? returnTo : "/recovery/onboarding";
  } catch {
    return "/recovery/onboarding";
  }
}

/**
 * Finish any social provider callback with the same recovery-first routing
 * contract. Provider callbacks should only be responsible for verifying the
 * provider response and finding/creating the local user.
 */
export function completeRecoverySocialLogin(
  req: any,
  res: any,
  user: { id?: string; claims?: { sub?: string } },
  failureRedirect: string,
): void {
  const userId = user.id || user.claims?.sub;
  if (!userId) {
    return res.redirect(failureRedirect);
  }

  req.logIn(user, (loginErr: any) => {
    if (loginErr) {
      return res.redirect(failureRedirect);
    }

    void (async () => {
      const requestedReturnTo = (req.session as any)?.returnTo;
      delete (req.session as any).returnTo;
      res.redirect(await getRecoveryAuthRedirect(userId, requestedReturnTo));
    })();
  });
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      // 'lax' allows the OIDC callback (top-level navigation from Replit's
      // login page back to /api/callback) while blocking cross-site POSTs —
      // closing the residual CSRF gap on every authenticated mutation.
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Register Local + Google strategies (serialize/deserialize stays below,
  // owned by this file, compatible with both OIDC sessions and DB user rows).
  const { configurePassport } = await import('./multiProviderAuth');
  configurePassport();

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  const safeReturnTo = (value: unknown) => {
    if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
      return "/recovery/today";
    }
    const allowed = ["/recovery/today", "/recovery/onboarding", "/recovery/community", "/recovery/journal", "/recovery/me"];
    return allowed.some((path) => value === path || value.startsWith(`${path}?`)) ? value : "/recovery/today";
  };

  app.get("/api/login", (req, res, next) => {
    (req.session as any).returnTo = safeReturnTo(req.query.returnTo || req.query.next);
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      failureRedirect: "/api/login",
    }, (err: any, user: any) => {
      if (err || !user) {
        return res.redirect("/api/login");
      }
      completeRecoverySocialLogin(req, res, user, "/api/login");
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // Bridge: email/password/OTP users sign in via req.session.userId.
  // Synthesize a Passport-shaped req.user so downstream code that reads
  // req.user.claims.sub keeps working unchanged.
  const sessionUserId = (req.session as any)?.userId as string | undefined;
  if (sessionUserId && (!req.user || !req.user?.claims?.sub)) {
    req.user = { claims: { sub: sessionUserId }, _viaSession: true };
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated || !req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
