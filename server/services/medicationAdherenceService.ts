// ============================================================================
// MEDICATION-ADHERENCE LOOP (second-stroke prevention track)
// ----------------------------------------------------------------------------
// Two static, survivor-voice journeys routed through the lifecycle messaging
// engine (sendMessage) so consent, channel prefs, and quiet-hours are all
// respected and every send is idempotent via message_deliveries dedupe:
//
//   1. survivor daily loop : survivors with active meds who logged nothing
//      today get ONE gentle "did you take them?" nudge pointing at the
//      Prevention Hub to tap Took it / Skipped. Complements — does not
//      duplicate — the exact-time push in pushNotificationService (that fires
//      AT each reminder time; this is a single daily catch-all recap).
//
//   2. caregiver missed-meds nudge : when a survivor has explicitly enabled
//      caregiver sharing (notification_preferences.caregiver_share_enabled),
//      has an ACTIVE caregiver link, and has logged no doses for 3+ days, the
//      caregiver gets a gentle weekly heads-up. Consent-gated on the survivor
//      side; the caregiver's own channel prefs still apply inside sendMessage.
//
// SAFETY CONTRACT: all copy is STATIC, pre-written, no AI generation, no user
// text echoed. Never tells anyone to start/stop/change a medication — only to
// stay consistent and talk to their doctor. No clinical scoring anywhere.
// ============================================================================

import { db } from "../db";
import { sql } from "drizzle-orm";
import { renderEmail } from "../emailTemplate";
import { redactEmail } from "../lib/redact";
import { sendMessage } from "../messaging";
import { buildGlobalUnsubscribeUrl } from "../messaging/unsubscribe";

const SITE = process.env.PUBLIC_SITE_URL || "https://strokerecoveryacademy.com";

function ctaButton(label: string, path: string): string {
  return (
    `<p class="body-text" style="text-align:center;margin-top:28px;">` +
    `<a href="${SITE}${path}" style="display:inline-block;background:#E2741B;color:#0E0D0C;font-weight:800;padding:14px 28px;border-radius:6px;text-decoration:none;">${label}</a>` +
    `</p>`
  );
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoWeekKey(d: Date = new Date()): string {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((dt.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${dt.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ─── 1. Survivor daily adherence loop ────────────────────────────────────────
interface SurvivorRow {
  user_id: string;
  email: string;
  first_name: string | null;
}

// Active meds (with reminder_times set) but nothing logged today — the survivor
// still needs to close the loop.
export async function selectSurvivorAdherenceCandidates(): Promise<SurvivorRow[]> {
  const result = await db.execute(sql`
    SELECT DISTINCT u.id AS user_id, u.email, u.first_name
    FROM medications m
    JOIN users u ON u.id = m.user_id
    WHERE m.is_active = true
      AND m.reminder_times IS NOT NULL
      AND array_length(m.reminder_times, 1) >= 1
      AND u.email IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM medication_logs ml
        WHERE ml.user_id = u.id
          AND ml.skipped = false
          AND ml.taken_at >= CURRENT_DATE
      )
  `).catch(() => ({ rows: [] as any[] }));
  return ((result.rows ?? result) as any[]) as SurvivorRow[];
}

async function runSurvivorLoop() {
  const rows = await selectSurvivorAdherenceCandidates();
  const dayKey = todayKey();
  for (const r of rows) {
    const hey = r.first_name ? `Hey ${r.first_name} — ` : "";
    const headline = "Did you take your meds today?";
    const preview = "Two taps closes the loop — Took it or Skipped. Consistency is the whole point.";
    const body =
      `<p class="body-text">${hey}quick gut-check: your meds for today aren't marked yet.</p>` +
      `<p class="body-text">The pills only work if they actually get taken. That's not nagging — it's the single most boring, most powerful thing you can do to lower the odds of a repeat. Two taps and you're logged.</p>` +
      `<p class="body-text">Already took them? Just tap Took it. Missed one? Mark it and move on — no shame, just data. Never start, stop, or change a medication without your doctor.</p>`;
    const html = renderEmail({
      previewText: preview,
      eyebrow: "Prevention track",
      headline,
      subheadline: "Two taps closes the loop.",
      showCrisisCallout: true,
      bodyHtml: body + ctaButton("Log your meds", "/recovery/prevention"),
      unsubscribeUrl: buildGlobalUnsubscribeUrl(r.user_id),
      whyReceiving: "You're receiving this because you track medications at Stroke Recovery Academy. One click below stops these.",
    });
    const text =
      `${headline}\n\n${preview}\n\n` +
      `Log your meds: ${SITE}/recovery/prevention\n\n` +
      `Stop these emails: ${buildGlobalUnsubscribeUrl(r.user_id)}`;
    try {
      const res = await sendMessage({
        userId: r.user_id,
        toEmail: r.email,
        channel: "email",
        category: "med-adherence",
        dedupeKey: `med-adherence:email:${r.user_id}:${dayKey}`,
        subject: "Meds not marked yet — two taps to log",
        html,
        text,
      });
      if (res.status === "sent") console.log(`[med-adherence] survivor → ${redactEmail(r.email)}`);
    } catch (e) {
      console.error(`[med-adherence] survivor email failed for ${r.user_id}:`, e);
    }
    try {
      await sendMessage({
        userId: r.user_id,
        channel: "push",
        category: "med-adherence",
        dedupeKey: `med-adherence:push:${r.user_id}:${dayKey}`,
        push: {
          title: "Meds not marked yet",
          body: "Two taps closes the loop — Took it or Skipped.",
          url: "/recovery/prevention",
          type: "med_adherence",
        },
      });
    } catch (e) {
      console.warn(`[med-adherence] survivor push failed for ${r.user_id}:`, e);
    }
    await new Promise((res) => setTimeout(res, 120));
  }
}

// ─── 2. Caregiver missed-meds nudge (consent-gated) ──────────────────────────
interface CaregiverNudgeRow {
  caregiver_id: string;
  caregiver_email: string;
  caregiver_first_name: string | null;
  survivor_first_name: string | null;
}

// Survivors who: opted into caregiver sharing, have an active caregiver link,
// have active meds, and have NOT logged a single (non-skipped) dose in 3 days.
export async function selectCaregiverNudgeCandidates(): Promise<CaregiverNudgeRow[]> {
  const result = await db.execute(sql`
    SELECT cl.caregiver_id AS caregiver_id,
           cg.email        AS caregiver_email,
           cg.first_name   AS caregiver_first_name,
           sv.first_name   AS survivor_first_name
    FROM caregiver_links cl
    JOIN notification_preferences np ON np.user_id = cl.survivor_id
    JOIN users cg ON cg.id = cl.caregiver_id
    JOIN users sv ON sv.id = cl.survivor_id
    WHERE cl.status = 'active'
      AND np.caregiver_share_enabled = true
      AND cg.email IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM medications m
        WHERE m.user_id = cl.survivor_id AND m.is_active = true
      )
      AND NOT EXISTS (
        SELECT 1 FROM medication_logs ml
        WHERE ml.user_id = cl.survivor_id
          AND ml.skipped = false
          AND ml.taken_at >= NOW() - INTERVAL '3 days'
      )
  `).catch(() => ({ rows: [] as any[] }));
  return ((result.rows ?? result) as any[]) as CaregiverNudgeRow[];
}

export async function runCaregiverNudge() {
  const rows = await selectCaregiverNudgeCandidates();
  const week = isoWeekKey();
  for (const r of rows) {
    const who = r.survivor_first_name || "your survivor";
    const hey = r.caregiver_first_name ? `Hey ${r.caregiver_first_name} — ` : "";
    const headline = `A gentle heads-up about ${who}`;
    const preview = `No meds have been logged in a few days. A soft nudge from you might be all it takes.`;
    const body =
      `<p class="body-text">${hey}${who} hasn't logged any medications in the last few days. That doesn't mean anything's wrong — logs get forgotten all the time — but you asked to be in the loop, so here's the loop.</p>` +
      `<p class="body-text">A quick, kind check-in tends to work better than a lecture. "Hey, need a hand staying on top of the pills?" goes a long way.</p>` +
      `<p class="body-text">If you're worried about a new or worsening symptom, that's a call to their doctor — or 911 for any stroke warning sign. This nudge is about consistency, not a medical alert.</p>`;
    const html = renderEmail({
      previewText: preview,
      eyebrow: "Caregiver heads-up",
      headline,
      subheadline: "You asked to be in the loop.",
      showCrisisCallout: true,
      bodyHtml: body + ctaButton("Open your caregiver view", "/recovery/caregiver"),
      unsubscribeUrl: buildGlobalUnsubscribeUrl(r.caregiver_id),
      whyReceiving: "You're receiving this because a survivor shared their recovery with you at Stroke Recovery Academy. One click below stops these.",
    });
    const text =
      `${headline}\n\n${preview}\n\n` +
      `Caregiver view: ${SITE}/recovery/caregiver\n\n` +
      `Stop these emails: ${buildGlobalUnsubscribeUrl(r.caregiver_id)}`;
    try {
      const res = await sendMessage({
        userId: r.caregiver_id,
        toEmail: r.caregiver_email,
        channel: "email",
        category: "caregiver-med-nudge",
        // One nudge per caregiver+survivor per week. survivor name isn't a stable
        // id, but the pair is 1:1 per active link in practice for this surface.
        dedupeKey: `caregiver-med-nudge:email:${r.caregiver_id}:${who}:${week}`,
        subject: `Gentle heads-up about ${who}'s meds`,
        html,
        text,
      });
      if (res.status === "sent") console.log(`[med-adherence] caregiver → ${redactEmail(r.caregiver_email)}`);
    } catch (e) {
      console.error(`[med-adherence] caregiver email failed for ${r.caregiver_id}:`, e);
    }
    await new Promise((res) => setTimeout(res, 120));
  }
}

// ─── Entry point (invoked by the durable scheduler) ──────────────────────────
export async function runMedicationAdherence(): Promise<void> {
  const results = await Promise.allSettled([runSurvivorLoop(), runCaregiverNudge()]);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[med-adherence] ${["survivor-loop", "caregiver-nudge"][i]} failed:`, r.reason);
    }
  });
}
