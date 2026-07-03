// ============================================================================
// SMS PROVIDER (Twilio) — SHIPS INERT BEHIND A FLAG
// ============================================================================
// SMS stays fully dormant until SMS_ENABLED === "true" AND the three Twilio
// secrets are present. Until then sendSms() short-circuits to a "skipped" result
// and the inbound webhook no-ops, so nothing here can send, cost money, or throw
// on a box that hasn't been configured for SMS. When enabled, this is the only
// place that talks to Twilio.

import twilio from "twilio";

export interface SmsResult {
  status: "sent" | "skipped" | "failed";
  providerId?: string;
  reason?: string;
  error?: string;
}

export function isSmsEnabled(): boolean {
  return (
    process.env.SMS_ENABLED === "true" &&
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_FROM_NUMBER
  );
}

let client: ReturnType<typeof twilio> | null = null;
function getClient() {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  }
  return client;
}

export async function sendSms({ to, body }: { to: string; body: string }): Promise<SmsResult> {
  if (!isSmsEnabled()) return { status: "skipped", reason: "sms_disabled_flag" };
  if (!to) return { status: "skipped", reason: "no_phone" };
  if (!body) return { status: "skipped", reason: "empty_body" };
  try {
    const msg = await getClient().messages.create({
      to,
      from: process.env.TWILIO_FROM_NUMBER!,
      body,
    });
    return { status: "sent", providerId: msg.sid };
  } catch (e: any) {
    return { status: "failed", error: String(e?.message ?? e) };
  }
}

// Validate an inbound Twilio webhook against X-Twilio-Signature. The URL must be
// the exact public URL configured in the Twilio console (we build it from
// PUBLIC_SITE_URL so it doesn't depend on proxy-rewritten req.protocol/host).
export function validateInboundSignature(
  signature: string | undefined,
  url: string,
  params: Record<string, any>,
): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !signature) return false;
  try {
    return twilio.validateRequest(token, signature, url, params);
  } catch {
    return false;
  }
}
