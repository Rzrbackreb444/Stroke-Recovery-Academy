/**
 * redact — PII redaction helpers for log lines.
 *
 * HoundDog flagged 6 LOW-severity findings where survivor PII (emails,
 * physical addresses) was being written to stdout / stderr via console.log
 * or console.error. Per GDPR Article 5 §3.2 ("storage limitation") and CCPA
 * §1798.100, transient debug logs that contain identifiers count as
 * "processing of personal data" — even though they're not persisted to a
 * database, they end up in cloud-provider log aggregation that often retains
 * them for 30+ days outside the user's control.
 *
 * The naive remediation HoundDog suggests is "delete the log line", but
 * that strips operationally useful diagnostics (we DO need to know that the
 * welcome email failed, or which subscriber the broadcast crashed on).
 * These helpers preserve the diagnostic value (first char + domain for
 * emails, prefix-only for zip codes) while making the logs no longer
 * personally identifying.
 */

/** Redact an email so it stays useful in logs but no longer identifies the survivor. */
export function redactEmail(email?: string | null): string {
  if (!email || typeof email !== "string") return "<no-email>";
  const at = email.indexOf("@");
  if (at <= 0 || at === email.length - 1) return "<malformed-email>";
  const head = email.slice(0, 1);
  const domain = email.slice(at + 1);
  return `${head}***@${domain}`;
}

/** Redact a postal/ZIP code (keep 2-3 leading chars for region debugging). */
export function redactZip(zip?: string | null): string {
  if (!zip || typeof zip !== "string") return "<no-zip>";
  if (zip.length <= 3) return "***";
  return `${zip.slice(0, 3)}**`;
}
