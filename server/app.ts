/**
 * APEX INFRASTRUCTURE GATEWAY
 * Hardened Express setup with Graceful Shutdown, Payload Compression, 
 * Proxy Trust, and High-Performance Logging.
 */

import { type Server } from "node:http";
import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";
import compression from "compression";

import { registerRoutes } from "./routes";
import { WebhookHandlers } from "./webhookHandlers";
import { requestId, structuredErrorLogger, registerHealthRoutes } from "./middleware/observability";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

// ============================================================================
// 1. INFRASTRUCTURE & SECURITY
// ============================================================================
// CRITICAL: Trust the reverse proxy (Replit/Cloudflare) to get real Client IPs
// Without this, rate limiters will block the load balancer instead of the attacker.
app.set('trust proxy', 1);

// Compress all responses. Massive performance boost for Core Web Vitals.
app.use(compression());

// ============================================================================
// 2. STRIPE WEBHOOKS (Must precede global body parsers)
// ============================================================================
app.post(
  '/api/stripe/webhook/:uuid?',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      log('Rejected webhook: Missing signature', 'stripe-security');
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        log('Rejected webhook: Body is not a Buffer', 'stripe-security');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      const uuid = req.params.uuid || 'default';
      await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);
      res.status(200).json({ received: true });
    } catch (error: any) {
      log(`Webhook verification failed: ${error.message}`, 'stripe-security');
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// ============================================================================
// 3. PAYLOAD GUARDS
// ============================================================================
// Voice clone uploads carry base64 audio (30-180s WebM ~= 1-10MB).
app.use('/api/voice-clones', express.json({ limit: '15mb' }));

// Global 5mb cap for all other endpoints to prevent memory-exhaustion DoS.
app.use(express.json({
  limit: '5mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// Gracefully handle malformed JSON requests so they don't crash the server
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    log(`Malformed JSON blocked from IP: ${req.ip}`, 'security');
    return res.status(400).json({ error: 'Bad Request: Invalid JSON' });
  }
  next();
});

// ============================================================================
// 4. OBSERVABILITY & ROUTING
// ============================================================================
app.use(requestId);
registerHealthRoutes(app);

// High-Performance Request Logger
// Calculates exact duration and payload size without mutating the response object.
app.use((req, res, next) => {
  const start = process.hrtime();
  
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const diff = process.hrtime(start);
      const durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
      const size = res.getHeader('content-length') || 0;
      
      log(`${req.method} ${req.path} [${res.statusCode}] - ${durationMs}ms - ${size}b`, 'network');
    }
  });

  next();
});

// ============================================================================
// 5. SERVER INITIALIZATION & GRACEFUL SHUTDOWN
// ============================================================================
export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  let server: Server;
  try {
    server = await registerRoutes(app);
  } catch (err: any) {
    console.error("[app] registerRoutes failed:", err?.message ?? err);
    throw err;
  }

  // Keep the survivor's first-session destination protected before the SPA
  // shell is served. Client-side guards are still useful for in-app
  // navigation, but direct requests must not render Today anonymously.
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();

    const requestedPath = req.path;
    const isToday = requestedPath === "/recovery/today";
    const isLegacyTodayAlias = requestedPath === "/recovery/dashboard";
    if (!isToday && !isLegacyTodayAlias) return next();

    const authenticated = typeof req.isAuthenticated === "function" && req.isAuthenticated();
    if (isLegacyTodayAlias) {
      if (authenticated) return res.redirect(302, "/recovery/today");
      return res.redirect(302, `/recovery/login?next=${encodeURIComponent("/recovery/today")}`);
    }
    if (!authenticated) {
      return res.redirect(302, `/recovery/login?next=${encodeURIComponent(req.originalUrl)}`);
    }
    next();
  });

  // Structured error logger runs first
  app.use(structuredErrorLogger);

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (status === 500) {
      console.error('[Unhandled Exception]:', err);
    }
    res.status(status).json({ message });
  });

  await setup(app, server);

  const port = parseInt(process.env.PORT || '5000', 10);
  const runningServer = server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Apex Infrastructure active on port ${port}`, 'system');
  });

  // --- GRACEFUL SHUTDOWN HANDLER ---
  // Ensures active voice clone uploads and Stripe webhooks finish processing 
  // before the server kills the process during a deployment or restart.
  const shutdown = (signal: string) => {
    log(`${signal} received: closing HTTP server gracefully...`, 'system');
    runningServer.close(() => {
      log('HTTP server closed. Exiting process.', 'system');
      process.exit(0);
    });

    // Force close after 15 seconds if connections are hanging
    setTimeout(() => {
      log('Forcefully terminating process after 15s timeout.', 'system');
      process.exit(1);
    }, 15000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}