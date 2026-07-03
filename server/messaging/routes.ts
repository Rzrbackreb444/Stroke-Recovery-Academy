// Public messaging routes: global unsubscribe (email) and the Twilio inbound
// SMS webhook (STOP/HELP). Both are public (no session). Unsubscribe is
// HMAC-verified and the opt-out itself is a rate-limited POST (the GET only
// renders a confirm page, so corporate link-scanner prefetch can't unsubscribe
// anyone). The SMS webhook is Twilio-signature-verified and rate-limited.

import type { Express } from "express";
import { publicPostLimiter, smsWebhookLimiter } from "../middleware/publicRateLimit";
import { verifyUnsubToken, optOutAll } from "./unsubscribe";
import { normalizeE164 } from "./phone";
import { db } from "../db";
import { sql } from "drizzle-orm";

const SITE = process.env.PUBLIC_SITE_URL || "https://strokerecoveryacademy.com";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@strokerecoveryacademy.com";

const STOP_WORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "REVOKE", "OPTOUT"]);
const HELP_WORDS = new Set(["HELP", "INFO"]);

function unsubPage(message: string, ok: boolean): string {
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${ok ? "Unsubscribed" : "Unsubscribe"}</title></head>` +
    `<body style="margin:0;background:#0E0D0C;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">` +
    `<div style="max-width:520px;margin:0 auto;padding:64px 24px;text-align:center;">` +
    `<div style="font-size:15px;line-height:1.6;color:#e5e5e5;">${message}</div>` +
    `<p style="margin-top:32px;"><a href="${SITE}/recovery/notifications" style="color:#E2741B;text-decoration:none;font-weight:700;">Manage all notification settings →</a></p>` +
    `</div></body></html>`
  );
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// GET renders this confirm page instead of opting out, so email link-scanners
// (which prefetch GETs) can't unsubscribe a user. The button POSTs the same
// token to actually opt out.
function confirmPage(uid: string, t: string): string {
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>Unsubscribe</title></head>` +
    `<body style="margin:0;background:#0E0D0C;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">` +
    `<div style="max-width:520px;margin:0 auto;padding:64px 24px;text-align:center;">` +
    `<div style="font-size:15px;line-height:1.6;color:#e5e5e5;">Unsubscribe from lifecycle emails? Transactional emails (receipts, security) will still send.</div>` +
    `<form method="POST" action="/api/messaging/unsubscribe" style="margin-top:32px;">` +
    `<input type="hidden" name="uid" value="${escapeAttr(uid)}">` +
    `<input type="hidden" name="t" value="${escapeAttr(t)}">` +
    `<button type="submit" style="background:#E2741B;color:#0E0D0C;border:0;border-radius:6px;padding:12px 24px;font-size:15px;font-weight:700;cursor:pointer;">Confirm unsubscribe</button>` +
    `</form>` +
    `<p style="margin-top:24px;"><a href="${SITE}/recovery/notifications" style="color:#E2741B;text-decoration:none;font-weight:700;">Manage all notification settings →</a></p>` +
    `</div></body></html>`
  );
}

function twiml(messageText?: string): string {
  const inner = messageText ? `<Message>${messageText}</Message>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
}

export function registerMessagingRoutes(app: Express) {
  // ── Global unsubscribe (email footer link + RFC 8058 one-click) ──────────────
  // GET only shows a confirm page — link-scanner prefetch (GET) can't opt anyone
  // out. The opt-out happens on POST: both the confirm button and RFC 8058
  // List-Unsubscribe-Post one-click clients POST the token here.
  app.get("/api/messaging/unsubscribe", async (req, res) => {
    const uid = String(req.query.uid || "");
    const t = String(req.query.t || "");
    if (!uid || !verifyUnsubToken(uid, t)) {
      return res.status(400).send(unsubPage("This unsubscribe link is invalid or expired.", false));
    }
    return res.status(200).send(confirmPage(uid, t));
  });

  app.post("/api/messaging/unsubscribe", publicPostLimiter, async (req, res) => {
    const uid = String(req.body?.uid || req.query.uid || "");
    const t = String(req.body?.t || req.query.t || "");
    if (!uid || !verifyUnsubToken(uid, t)) {
      return res.status(400).send(unsubPage("This unsubscribe link is invalid or expired.", false));
    }
    try {
      await optOutAll(uid);
      return res
        .status(200)
        .send(unsubPage("You're unsubscribed. You won't get lifecycle emails from Stroke Recovery Academy anymore. Transactional emails (receipts, security) still send.", true));
    } catch (e) {
      console.error("[messaging] unsubscribe failed:", (e as any)?.message ?? e);
      return res.status(500).send(unsubPage("Something went wrong. Try again later.", false));
    }
  });

  // ── Twilio inbound SMS webhook (STOP / HELP + carrier compliance) ────────────
  // Ships inert: when SMS is not enabled we accept-and-noop so Twilio (if ever
  // pointed here by mistake) doesn't retry. When enabled we verify the Twilio
  // signature against the exact configured URL before doing anything.
  app.post("/api/sms/inbound", smsWebhookLimiter, async (req, res) => {
    const { isSmsEnabled, validateInboundSignature } = await import("./smsProvider");

    res.type("text/xml");

    if (!isSmsEnabled()) {
      return res.status(200).send(twiml());
    }

    const signature = req.header("X-Twilio-Signature");
    const url = `${SITE}/api/sms/inbound`;
    if (!validateInboundSignature(signature, url, req.body || {})) {
      return res.status(403).send(twiml());
    }

    // Twilio sends E.164 in `From`; normalize both sides so the stored
    // (also-normalized) sms_phone matches on STOP.
    const from = normalizeE164(String(req.body?.From || "")) ?? "";
    const text = String(req.body?.Body || "").trim().toUpperCase();

    try {
      if (STOP_WORDS.has(text)) {
        // Flip SMS off for whoever owns this number. Empty TwiML — Twilio's
        // Advanced Opt-Out sends the carrier-required confirmation itself.
        if (from) {
          await db.execute(sql`
            UPDATE notification_preferences SET sms_enabled = FALSE, updated_at = NOW()
            WHERE sms_phone = ${from}
          `);
        }
        return res.status(200).send(twiml());
      }

      if (HELP_WORDS.has(text)) {
        return res
          .status(200)
          .send(
            twiml(
              `Stroke Recovery Academy alerts. Reply STOP to opt out. Help: ${SUPPORT_EMAIL}. Msg&amp;data rates may apply.`,
            ),
          );
      }

      // Anything else: acknowledge without replying (we don't run an SMS
      // conversation surface — inbound is opt-out/help only).
      return res.status(200).send(twiml());
    } catch (e) {
      console.error("[messaging] sms inbound failed:", (e as any)?.message ?? e);
      return res.status(200).send(twiml());
    }
  });
}
