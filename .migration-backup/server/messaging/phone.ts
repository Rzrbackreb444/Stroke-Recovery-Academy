// Pure phone helpers for the messaging engine — no Twilio dependency so it's
// safe to import from request handlers without pulling the SDK into boot.

// Best-effort E.164 normalization. Twilio's inbound `From` is strict E.164
// (+15551234567), but users type all sorts of things (+1 555-123-4567,
// (555) 123 4567). Store the normalized form so the STOP matcher and the
// outbound send always agree on the same string. Returns null when the input
// can't be coerced into a plausible E.164 number.
export function normalizeE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  let e164: string;
  if (hasPlus) {
    e164 = "+" + digits;
  } else if (digits.length === 10) {
    e164 = "+1" + digits; // bare US/CA number
  } else {
    e164 = "+" + digits; // assume country code already present
  }
  const body = e164.slice(1);
  if (body.length < 8 || body.length > 15) return null; // E.164 length bounds
  return e164;
}
