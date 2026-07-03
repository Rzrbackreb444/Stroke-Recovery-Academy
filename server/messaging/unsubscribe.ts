// Global unsubscribe for the lifecycle messaging engine. HMAC-signed token (no
// DB row needed to validate) flips notification_preferences.unsubscribed_all,
// which loadPrefs() honors to skip ALL non-transactional sends across every
// channel. Mirrors the journal-nudge unsubscribe pattern but engine-wide.

import crypto from "crypto";
import { db } from "../db";
import { sql } from "drizzle-orm";

const SITE = process.env.PUBLIC_SITE_URL || "https://strokerecoveryacademy.com";

function unsubSecret(): string {
  return process.env.SESSION_SECRET || "sra-messaging-unsub-fallback";
}

export function signUnsubToken(userId: string): string {
  return crypto.createHmac("sha256", unsubSecret()).update(`messaging-unsub:${userId}`).digest("hex").slice(0, 32);
}

export function verifyUnsubToken(userId: string, token: string): boolean {
  const expected = signUnsubToken(userId);
  if (!token || token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function buildGlobalUnsubscribeUrl(userId: string): string {
  return `${SITE}/api/messaging/unsubscribe?uid=${encodeURIComponent(userId)}&t=${signUnsubToken(userId)}`;
}

export async function optOutAll(userId: string): Promise<void> {
  // Ensure a prefs row exists, then set the global flag.
  await db.execute(sql`
    INSERT INTO notification_preferences (user_id, unsubscribed_all)
    VALUES (${userId}, TRUE)
    ON CONFLICT (user_id) DO UPDATE SET unsubscribed_all = TRUE, updated_at = NOW()
  `);
}
