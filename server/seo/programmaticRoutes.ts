// Programmatic SEO routes — generate hundreds of indexable pages from
// existing structured data (exercises, recovery weeks 1–52, US states with centers).
// Each route renders a full SsrPageConfig through the shared SSR shell so it
// pixel-matches the dark/gold brand and ships valid Article + FAQ + Breadcrumb JSON-LD.

import type { Express } from "express";
import { renderSsrPage, renderSsr404, type SsrPageConfig, type FAQItem } from "./ssrShell";
import { db } from "../db";
import { recoveryExercises } from "@shared/schema";
import { eq, and, ne } from "drizzle-orm";
import { METROS as TOP_METROS } from "./metros";

const SITE_URL = "https://strokerecoveryacademy.com";

// HTML-escape any DB-derived value before interpolating into rawHtml.
// ssrShell renders rawHtml unescaped, so we must escape here.
function esc(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ───────────────────────────── Exercise SSR ─────────────────────────────

function categoryLabel(c: string): string {
  switch (c) {
    case "upper": return "Upper Body";
    case "lower": return "Lower Body";
    case "hand": return "Hand & Fine Motor";
    case "core": return "Core & Trunk";
    case "balance": return "Balance & Gait";
    case "speech": return "Speech & Language";
    case "cognitive": return "Cognitive";
    default: return c.charAt(0).toUpperCase() + c.slice(1);
  }
}

function positionLabel(p: string | null | undefined): string {
  if (!p) return "Any position";
  if (p === "seated") return "Seated";
  if (p === "standing") return "Standing";
  if (p === "lying") return "Lying down";
  return p;
}

async function renderExerciseHtml(slug: string): Promise<string | null> {
  const [ex] = await db
    .select()
    .from(recoveryExercises)
    .where(eq(recoveryExercises.slug, slug));
  if (!ex) return null;

  // Sibling exercises in same category for related links.
  const siblings = await db
    .select({ slug: recoveryExercises.slug, name: recoveryExercises.name })
    .from(recoveryExercises)
    .where(and(eq(recoveryExercises.category, ex.category), ne(recoveryExercises.slug, ex.slug)))
    .limit(5);

  const cat = categoryLabel(String(ex.category));
  const pos = positionLabel(ex.position as string | undefined);

  const description = `${ex.name} — ${cat.toLowerCase()} exercise for stroke recovery. ${pos}, ${ex.level || "beginner"} level. Sets/reps and progression rule by Nick Kremers.`.slice(0, 158);

  const levelsTable: FAQItem[] = []; // unused — using a custom rawHtml block below instead

  // nosemgrep: javascript.lang.security.html-in-template-string
  const tableHtml = `
    <div style="overflow-x:auto;margin-top:14px">
      <table style="width:100%;border-collapse:collapse;color:#e7e7e7;font-size:.95rem">
        <thead>
          <tr style="background:#1a1a1a;text-align:left">
            <th style="padding:10px;border-bottom:1px solid #2a2a2a">Level</th>
            <th style="padding:10px;border-bottom:1px solid #2a2a2a">Sets</th>
            <th style="padding:10px;border-bottom:1px solid #2a2a2a">Reps</th>
            <th style="padding:10px;border-bottom:1px solid #2a2a2a">Hold (sec)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:10px;border-bottom:1px solid #1a1a1a"><strong style="color:#C9941A">Beginner</strong></td><td style="padding:10px;border-bottom:1px solid #1a1a1a">${esc(ex.beginnerSets ?? "—")}</td><td style="padding:10px;border-bottom:1px solid #1a1a1a">${esc(ex.beginnerReps ?? "—")}</td><td style="padding:10px;border-bottom:1px solid #1a1a1a">${esc(ex.beginnerHoldSec ?? 0)}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #1a1a1a"><strong style="color:#C9941A">Moderate</strong></td><td style="padding:10px;border-bottom:1px solid #1a1a1a">${esc(ex.moderateSets ?? "—")}</td><td style="padding:10px;border-bottom:1px solid #1a1a1a">${esc(ex.moderateReps ?? "—")}</td><td style="padding:10px;border-bottom:1px solid #1a1a1a">${esc(ex.moderateHoldSec ?? 0)}</td></tr>
          <tr><td style="padding:10px"><strong style="color:#C9941A">Advanced</strong></td><td style="padding:10px">${esc(ex.advancedSets ?? "—")}</td><td style="padding:10px">${esc(ex.advancedReps ?? "—")}</td><td style="padding:10px">${esc(ex.advancedHoldSec ?? 0)}</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const targetsLine = Array.isArray(ex.targets) && ex.targets.length > 0
    ? ex.targets.map((t: string) => t.replace(/_/g, " ")).join(" · ")
    : "general recovery";

  const cfg: SsrPageConfig = {
    url: `/recovery/exercise/${ex.slug}`,
    title: `${ex.name} — Stroke Recovery Exercise | ${cat}`.slice(0, 70),
    description,
    h1: ex.name,
    hero: {
      eyebrow: `${cat} · ${pos} · ${(ex.level || "beginner").toString()}`,
      subhead: `${ex.description?.slice(0, 200) || ""} Targets: ${targetsLine}.`,
      ctaPrimary: { href: "/recovery/exercises", label: "See all exercises" },
      ctaSecondary: { href: "/recovery/sasquatch-coach", label: "Ask Sasquatch Coach" },
    },
    sections: [
      {
        h2: "How to do it",
        paragraphs: [ex.description || "Slow, deliberate, controlled. Quality of movement matters more than rep count."],
      },
      {
        h2: "Sets, reps, and progression",
        paragraphs: [
          `Pick the level that lets you complete every rep with good form. If form breaks down before the last rep, drop down a level. If you finish all sets feeling like you have 5+ reps left in the tank, move up.`,
        ],
        rawHtml: tableHtml,
        bullets: ex.progressionRule ? [`Progression rule: ${ex.progressionRule}`] : undefined,
      },
      {
        h2: "Safety notes",
        paragraphs: [ex.safetyNotes || "Stop if you feel sharp pain, dizziness, or sudden weakness. Recovery is a long game — protect today so you can train tomorrow."],
      },
      {
        h2: "Where this fits in the Sasquatch Method",
        paragraphs: [
          `${ex.name} is part of a repetition-based neuroplasticity protocol. Neuroplasticity — the brain's ability to rewire — responds to high-volume, task-specific practice. A single set is ten times less effective than a daily session sustained over weeks.`,
          `Pair this exercise with at least two others in your daily routine. The full ${cat} catalog is at /recovery/exercises.`,
        ],
      },
    ],
    faqs: [
      { q: `Is ${ex.name} safe after a stroke?`, a: `For most survivors who can sit upright safely and have clearance from their care team, yes. ${ex.safetyNotes || "Stop on sharp pain, dizziness, or new weakness."} If you have any uncertainty, run this past your PT/OT first.` },
      { q: `How many days a week should I do ${ex.name}?`, a: `Most repetition-based stroke recovery protocols call for daily practice, 5–7 days per week. Recovery responds to consistency more than intensity. Even 5 minutes daily beats 35 minutes once a week.` },
      { q: `Can I do this on my weak side only?`, a: `Yes — and you generally should. Constraint-induced movement therapy (CIMT) research consistently shows that biasing practice toward the affected side produces better functional gains than bilateral practice. Use the strong side only as needed for safety.` },
      { q: `When will I see progress with ${ex.name}?`, a: `Most survivors notice subjective change in 2–4 weeks of consistent daily practice. Measurable change (better range of motion, more reps with good form, reduced effort) typically shows up by week 6–8. Recovery is non-linear — expect plateaus.` },
      { q: `How does this fit with my PT/OT program?`, a: `${ex.name} is designed as adjunct daily practice you do at home between therapy sessions. Bring this page to your therapist and ask whether the volume and progression rule fit your current plan. Stroke Recovery Academy is non-clinical lived-experience guidance, not a replacement for licensed therapy.` },
    ],
    related: siblings.map(s => ({
      href: `/recovery/exercise/${s.slug}`,
      label: s.name,
      blurb: `${cat} · same family.`,
    })).concat([
      { href: "/recovery/exercises", label: "Full exercise catalog", blurb: "All 22+ exercises." },
      { href: "/programs/sasquatch-method", label: "The Sasquatch Method", blurb: "Where this fits." },
      { href: "/programs/daily-routine", label: "Daily Recovery Routine", blurb: "5-level structured day." },
    ]),
    keywords: [
      ex.name,
      `${ex.name} stroke`,
      `${cat.toLowerCase()} stroke exercise`,
      `${ex.level || "beginner"} stroke recovery`,
      ...(Array.isArray(ex.targets) ? (ex.targets as string[]).slice(0, 3).map((t) => `${t.replace(/_/g, " ")} stroke`) : []),
    ],
    schemaType: "MedicalWebPage",
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: "Recovery", href: "/recovery" },
      { name: "Exercises", href: "/recovery/exercises" },
      { name: ex.name, href: `/recovery/exercise/${ex.slug}` },
    ],
  };

  // Add HowTo schema for AI extraction.
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: ex.name,
    description: ex.description?.slice(0, 200) || description,
    totalTime: `PT${(ex.beginnerSets ?? 2) * 2}M`,
    step: [
      { "@type": "HowToStep", name: "Set up", text: pos === "Seated" ? "Sit tall in a stable chair with feet flat." : "Stand with feet shoulder-width apart, support nearby." },
      { "@type": "HowToStep", name: "Execute", text: ex.description || "Perform the movement with control." },
      { "@type": "HowToStep", name: "Volume", text: `Beginner: ${ex.beginnerSets ?? 2} sets of ${ex.beginnerReps ?? 10} reps. Hold ${ex.beginnerHoldSec ?? 0}s if applicable.` },
      ...(ex.progressionRule ? [{ "@type": "HowToStep", name: "Progress", text: ex.progressionRule }] : []),
    ],
  };

  let html = renderSsrPage(cfg);
  // nosemgrep: javascript.lang.security.html-in-template-string
  const inject = `<script type="application/ld+json">${JSON.stringify(howToSchema).replace(/<\/script/gi, "<\\/script")}</script>\n</head>`;
  html = html.replace("</head>", inject);
  return html;
}

// ───────────────────────────── Week N SSR ─────────────────────────────

interface WeekPhase {
  label: string;
  framing: string;
  focus: string[];
  pitfalls: string[];
}

function weekPhase(n: number): WeekPhase {
  if (n <= 2) return {
    label: "Acute",
    framing: "You're still in the first window of natural recovery — the body is doing rapid biological repair. Your job is to protect, sleep, and start gentle, frequent movement.",
    focus: ["Sleep 8+ hours", "Gentle range of motion 4-6× per day", "Hydration and protein at every meal", "Simple breath work to reset the nervous system"],
    pitfalls: ["Over-exerting and crashing", "Skipping movement because of fatigue", "Comparing yourself to other survivors"],
  };
  if (n <= 12) return {
    label: "Sub-acute (the golden window)",
    framing: "Weeks 3–12 is the highest-leverage period in stroke recovery. Neuroplasticity is at its peak. Volume and consistency now compounds for years.",
    focus: ["Daily structured exercise routine", "Task-specific repetition on the affected side", "Tracking small wins in a journal", "Building a 5–7 day weekly rhythm"],
    pitfalls: ["Coasting through PT sessions instead of pushing intensity", "Inconsistency", "Letting depression go untreated"],
  };
  if (n <= 24) return {
    label: "Late sub-acute",
    framing: "Past the steepest curve but still highly plastic. This is where most survivors plateau because they slow down — exactly when they need to push harder.",
    focus: ["Higher intensity in your daily routine", "Add a balance / gait challenge", "Begin community engagement", "Set a 6-month measurable goal"],
    pitfalls: ["Stopping home program because PT discharged you", "Believing the 'six-month plateau' myth", "Withdrawing socially"],
  };
  if (n <= 52) return {
    label: "Chronic recovery (year one)",
    framing: "The medical system often abandons survivors after six months. The biology hasn't. Survivors continue to make functional gains for years with sustained, intentional practice.",
    focus: ["Re-commit to a daily routine", "Find a survivor community", "Push intensity past comfort", "Set a 12-month identity goal"],
    pitfalls: ["Believing recovery has stopped just because the clinic discharged you", "Isolation", "Lowering expectations"],
  };
  return { label: "Chronic", framing: "", focus: [], pitfalls: [] };
}

function renderWeekHtml(n: number): string | null {
  if (!Number.isInteger(n) || n < 1 || n > 52) return null;
  const phase = weekPhase(n);
  const ordinal = n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

  const cfg: SsrPageConfig = {
    url: `/recovery/week/${n}`,
    title: `Week ${n} of Stroke Recovery: What to Expect`,
    description: `Week ${n} after stroke — what is normal, what to focus on, common pitfalls. Survivor-led guidance by Nick Kremers (7-year survivor).`.slice(0, 158),
    h1: `Week ${n} of Stroke Recovery: What to Expect`,
    hero: {
      eyebrow: phase.label,
      subhead: phase.framing,
      ctaPrimary: { href: "/programs/daily-routine", label: "Build today's routine" },
      ctaSecondary: { href: "/recovery/sasquatch-coach", label: "Ask Sasquatch Coach" },
    },
    sections: [
      {
        h2: "TL;DR — Direct answer",
        paragraphs: [
          `Week ${n} after stroke sits in the **${phase.label}** phase. ${phase.framing} The single most important variable now is daily consistency — not intensity, not perfection. A 30-minute structured session done 6 days a week beats a 2-hour blitz done once.`,
        ],
      },
      {
        h2: "What is normal at this stage",
        paragraphs: [
          `Recovery is non-linear. Two days forward, one day back is the standard pattern. Energy will dip without warning. Emotional regulation is harder — frustration, tears, and unexplained anger are normal. None of this means you are failing.`,
          `By the ${ordinal} week, most survivors notice their effort cost is dropping for tasks they have practiced consistently. Tasks they have not practiced will feel as hard as they did at week 1.`,
        ],
      },
      {
        h2: "What to focus on this week",
        paragraphs: [],
        bullets: phase.focus,
      },
      {
        h2: "Common pitfalls to avoid",
        paragraphs: [],
        bullets: phase.pitfalls,
      },
      {
        h2: "Recommended daily structure for week " + n,
        paragraphs: [
          `Anchor your day around three movement blocks (morning, midday, evening) and one mental-recovery block. Each block is 10–25 minutes. Rest aggressively between blocks. Track completion in a simple journal.`,
        ],
        bullets: [
          "Morning: gentle range-of-motion + hydration",
          "Midday: task-specific repetition on the affected side",
          "Evening: balance, gait, or strength work appropriate to your level",
          "One mental-recovery block: meditation, breath work, gratitude journaling, or a walk outside",
        ],
      },
    ],
    faqs: [
      { q: `What should I expect at week ${n} after a stroke?`, a: `Week ${n} sits in the ${phase.label} phase of stroke recovery. ${phase.framing} Recovery remains non-linear — expect both gains and dips this week.` },
      { q: `Am I behind if I don't see big gains in week ${n}?`, a: `No. Recovery is measured in months and years, not weeks. Survivors routinely make meaningful functional gains 6 months, 1 year, even 5+ years post-stroke. The variables that predict long-term recovery are consistency, sleep, and willingness to push intensity — not how fast you started.` },
      { q: `How many hours should I exercise in week ${n}?`, a: `Aim for 60–90 minutes total per day broken into 3–4 short blocks, not one long block. Quality of repetition matters more than duration. If a single block is leaving you wrecked for the rest of the day, it is too long.` },
      { q: `When will I be back to normal?`, a: `"Normal" is the wrong frame. Most survivors build a new normal that is in many ways better than the old one — more intentional, more grateful, more disciplined. The clinical answer: most measurable gain happens in the first 6 months, but functional improvement continues for years with sustained practice.` },
      { q: `Should I push through fatigue in week ${n}?`, a: `Push through low-level "I'd rather not" — yes. Push through dizziness, sudden weakness, or fatigue that feels heavier than yesterday at the same time of day — no. Recovery requires you to learn the difference between resistance (push through) and a safety signal (rest, hydrate, eat, sleep).` },
    ],
    related: [
      ...(n > 1 ? [{ href: `/recovery/week/${n - 1}`, label: `Week ${n - 1}`, blurb: "What just happened." }] : []),
      ...(n < 52 ? [{ href: `/recovery/week/${n + 1}`, label: `Week ${n + 1}`, blurb: "What's next." }] : []),
      { href: "/programs/daily-routine", label: "Daily Recovery Routine", blurb: "Plug in today." },
      { href: "/programs/sasquatch-method", label: "The Sasquatch Method", blurb: "Phase-based system." },
      { href: "/recovery/exercises", label: "Exercise catalog", blurb: "Pick today's work." },
      { href: "/learn/neuroplasticity-after-stroke", label: "How Neuroplasticity Works", blurb: "Why the work matters." },
    ],
    keywords: [
      `week ${n} after stroke`,
      `${n} weeks post stroke recovery`,
      `stroke recovery week ${n}`,
      `${phase.label.toLowerCase()} stroke recovery`,
    ],
    schemaType: "MedicalWebPage",
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: "Recovery", href: "/recovery" },
      { name: "Recovery timeline", href: "/learn/stroke-recovery-timeline" },
      { name: `Week ${n}`, href: `/recovery/week/${n}` },
    ],
  };

  return renderSsrPage(cfg);
}

// ───────────────────────────── State centers SSR ─────────────────────────────

const US_STATES: Record<string, string> = {
  al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas", ca: "California",
  co: "Colorado", ct: "Connecticut", de: "Delaware", fl: "Florida", ga: "Georgia",
  hi: "Hawaii", id: "Idaho", il: "Illinois", in: "Indiana", ia: "Iowa",
  ks: "Kansas", ky: "Kentucky", la: "Louisiana", me: "Maine", md: "Maryland",
  ma: "Massachusetts", mi: "Michigan", mn: "Minnesota", ms: "Mississippi", mo: "Missouri",
  mt: "Montana", ne: "Nebraska", nv: "Nevada", nh: "New Hampshire", nj: "New Jersey",
  nm: "New Mexico", ny: "New York", nc: "North Carolina", nd: "North Dakota", oh: "Ohio",
  ok: "Oklahoma", or: "Oregon", pa: "Pennsylvania", ri: "Rhode Island", sc: "South Carolina",
  sd: "South Dakota", tn: "Tennessee", tx: "Texas", ut: "Utah", vt: "Vermont",
  va: "Virginia", wa: "Washington", wv: "West Virginia", wi: "Wisconsin", wy: "Wyoming",
  dc: "District of Columbia",
};

function statesWithMetros(): string[] {
  const set = new Set<string>();
  for (const m of TOP_METROS) set.add(m.state.toLowerCase());
  return Array.from(set).sort();
}

function renderStateHubHtml(stateCode: string): string | null {
  const code = stateCode.toLowerCase();
  const stateName = US_STATES[code];
  if (!stateName) return null;

  const metrosInState = TOP_METROS.filter(m => m.state.toLowerCase() === code);
  if (metrosInState.length === 0) return null;

  const cardsHtml = `
    <div style="display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));margin-top:16px">
      ${metrosInState.map(m => `
        <a href="/recovery/centers/${esc(m.slug)}" style="display:block;background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:18px;text-decoration:none">
          <div style="color:#C9941A;font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">${esc(m.state)}</div>
          <div style="color:#f5f5f5;font-size:1.15rem;font-weight:700;margin-bottom:6px">${esc(m.city)}</div>
          <div style="color:#999;font-size:.85rem">Stroke rehab, neurology, PT, OT, SLP &rarr;</div>
        </a>`).join("")}
    </div>
  `;

  const cfg: SsrPageConfig = {
    url: `/recovery/centers/state/${code}`,
    title: `Stroke Recovery Centers in ${stateName} | Find Rehab & Therapy`.slice(0, 70),
    description: `Stroke recovery centers across ${stateName} — rehab, neurology, PT, OT, and SLP. ${metrosInState.length} metros, refreshed every 30 days from Google Places.`.slice(0, 158),
    h1: `Stroke Recovery Centers in ${stateName}`,
    hero: {
      eyebrow: "State directory",
      subhead: `Find verified stroke rehab centers, neurologists, and outpatient PT/OT/SLP teams across ${metrosInState.length} ${stateName} metros. Sourced from Google Places, refreshed every 30 days.`,
      ctaPrimary: { href: "/recovery/center-finder", label: "Search by ZIP" },
      ctaSecondary: { href: "/recovery/sasquatch-coach", label: "Ask Sasquatch Coach" },
    },
    sections: [
      {
        h2: `Browse stroke recovery centers by ${stateName} metro`,
        paragraphs: [`Click any metro to see verified stroke rehab centers in that area, with ratings, services, and contact details.`],
        rawHtml: cardsHtml,
      },
      {
        h2: "How to choose a stroke recovery center",
        paragraphs: [
          `Inside the first 90 days post-stroke, prioritize an inpatient or comprehensive outpatient stroke rehab program. Past 90 days, the right team is usually a neurologist plus an outpatient PT/OT/SLP combination.`,
          `If your closest center isn't a stroke specialist, you build the team yourself: a general neurologist, a PT and OT willing to learn stroke-specific protocols, and a strong daily home program. The Stroke Recovery Academy daily routine is built for exactly this scenario.`,
        ],
        bullets: [
          `"How many stroke survivors do you currently treat?"`,
          `"What stroke-specific outcome measures do you track?"`,
          `"Do you offer high-repetition task-specific training?"`,
          `"What happens at discharge — do I get a long-term home program?"`,
        ],
      },
    ],
    faqs: [
      { q: `Where are the best stroke recovery centers in ${stateName}?`, a: `${stateName} has stroke recovery centers in ${metrosInState.length} major metros: ${metrosInState.map(m => m.city).join(", ")}. Browse the cards above to see verified centers in each metro. Always call ahead to confirm hours, insurance, and stroke-specific programs.` },
      { q: `Does insurance cover stroke rehab in ${stateName}?`, a: `Most major insurers, Medicare, and ${stateName} Medicaid (program rules vary) cover stroke rehabilitation when ordered by a physician. Coverage details change frequently — confirm directly with the center and your plan before scheduling.` },
      { q: `What if there is no stroke specialist near me in ${stateName}?`, a: `Many ${stateName} survivors don't have a dedicated stroke specialist nearby. Build your team — a general neurologist, a PT and OT willing to learn stroke-specific protocols, plus a strong home program. The Stroke Recovery Academy daily routine and 66-Day Challenge are designed for this exact scenario.` },
      { q: `How current is this center data?`, a: `Center data is sourced from Google Places (the same data Google Maps uses) and refreshed every 30 days. Hours and phone numbers can still change between refreshes — always call ahead.` },
    ],
    related: [
      { href: "/recovery/center-finder", label: "Live Center Finder", blurb: "Search any U.S. ZIP." },
      { href: "/programs/sasquatch-method", label: "The Sasquatch Method", blurb: "Build your own program." },
      { href: "/programs/daily-routine", label: "Daily Recovery Routine", blurb: "5-level structured day." },
      { href: "/learn/stroke-recovery-timeline", label: "Recovery timeline", blurb: "What to expect over 12 months." },
    ],
    keywords: [
      `stroke recovery centers ${stateName}`,
      `stroke rehab ${stateName}`,
      `neurologist ${stateName} stroke`,
      ...metrosInState.slice(0, 5).map(m => `stroke rehab ${m.city}`),
    ],
    schemaType: "MedicalWebPage",
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: "Recovery", href: "/recovery" },
      { name: "Center Finder", href: "/recovery/center-finder" },
      { name: stateName, href: `/recovery/centers/state/${code}` },
    ],
  };

  // ItemList schema for the centers grid
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Stroke Recovery Centers in ${stateName}`,
    numberOfItems: metrosInState.length,
    itemListElement: metrosInState.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/recovery/centers/${m.slug}`,
      name: `${m.city}, ${m.state} stroke recovery centers`,
    })),
  };

  let html = renderSsrPage(cfg);
  // nosemgrep: javascript.lang.security.html-in-template-string
  const inject = `<script type="application/ld+json">${JSON.stringify(itemList).replace(/<\/script/gi, "<\\/script")}</script>\n</head>`;
  return html.replace("</head>", inject);
}

// ───────────────────────────── Sitemap helpers ─────────────────────────────

export async function getProgrammaticSeoUrls(): Promise<{ url: string; priority: string; changefreq: string }[]> {
  const out: { url: string; priority: string; changefreq: string }[] = [];

  // Exercise URLs from DB
  try {
    const rows = await db.select({ slug: recoveryExercises.slug }).from(recoveryExercises);
    for (const r of rows) out.push({ url: `/recovery/exercise/${r.slug}`, priority: "0.78", changefreq: "monthly" });
  } catch (e) {
    // table may not be seeded yet; skip silently
  }

  // 52 weeks
  for (let n = 1; n <= 52; n++) out.push({ url: `/recovery/week/${n}`, priority: n <= 12 ? "0.82" : "0.72", changefreq: "monthly" });

  // States with metro coverage
  for (const code of statesWithMetros()) out.push({ url: `/recovery/centers/state/${code}`, priority: "0.75", changefreq: "monthly" });

  return out;
}

// ───────────────────────────── Routing ─────────────────────────────

export function registerProgrammaticSeoRoutes(app: Express): void {
  app.get("/recovery/exercise/:slug", async (req, res) => {
    try {
      const slug = String(req.params.slug || "").toLowerCase().slice(0, 100);
      if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).send("Invalid slug");
      const html = await renderExerciseHtml(slug);
      if (!html) {
        res.status(404);
        return res.send(renderSsr404());
      }
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(html);
    } catch (e) {
      console.error("Exercise SSR error:", e);
      res.status(500).send("Internal error");
    }
  });

  app.get("/recovery/week/:n", (req, res) => {
    try {
      const n = parseInt(req.params.n, 10);
      const html = renderWeekHtml(n);
      if (!html) {
        res.status(404);
        return res.send(renderSsr404());
      }
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=86400");
      res.send(html);
    } catch (e) {
      console.error("Week SSR error:", e);
      res.status(500).send("Internal error");
    }
  });

  app.get("/recovery/centers/state/:state", (req, res) => {
    try {
      const code = String(req.params.state || "").toLowerCase().slice(0, 4);
      if (!/^[a-z]+$/.test(code)) return res.status(400).send("Invalid state");
      const html = renderStateHubHtml(code);
      if (!html) {
        res.status(404);
        return res.send(renderSsr404());
      }
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=86400");
      res.send(html);
    } catch (e) {
      console.error("State centers SSR error:", e);
      res.status(500).send("Internal error");
    }
  });
}
