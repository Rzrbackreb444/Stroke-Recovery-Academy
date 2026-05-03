/**
 * Lazy frontend Sentry init.
 *
 * Why lazy: the DSN lives in a server-side env var (SENTRY_DSN), not a
 * VITE_-prefixed build-time var, so we fetch it on boot. Errors that happen
 * before the DSN resolves will be lost — acceptable trade-off vs. duplicating
 * the secret as VITE_SENTRY_DSN.
 *
 * Why frontend-only: server already emits structured JSON error lines via
 * server/middleware/observability.ts that we can grep in Replit deployment
 * logs. The real blind spot was browser-side crashes (post-stroke users on
 * older browsers / assistive tech).
 */
export async function initSentry(): Promise<void> {
  try {
    const res = await fetch("/api/observability/client-config", {
      credentials: "same-origin",
    });
    if (!res.ok) return;
    const cfg = (await res.json()) as { sentryDsn: string | null; environment: string };
    if (!cfg.sentryDsn) return;

    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn: cfg.sentryDsn,
      environment: cfg.environment,
      // Conservative sampling — survivors care about working features, not
      // about us collecting telemetry. Bump tracesSampleRate manually if we
      // need to investigate a perf regression.
      tracesSampleRate: 0.0,
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 0.0,
      // Don't ship known-noise errors to Sentry.
      ignoreErrors: [
        // Browser extensions
        "ResizeObserver loop completed with undelivered notifications",
        "ResizeObserver loop limit exceeded",
        // Network blips that aren't actionable
        "Failed to fetch",
        "NetworkError when attempting to fetch resource",
        "Load failed",
      ],
      beforeSend(event) {
        // Strip query strings from URLs in case any clone_session_id /
        // subscribed=1 tokens leak through.
        if (event.request?.url) {
          try {
            const u = new URL(event.request.url);
            u.search = "";
            event.request.url = u.toString();
          } catch {
            /* not a parseable URL */
          }
        }
        return event;
      },
    });
  } catch {
    // Sentry init must never break the app. Swallow.
  }
}
