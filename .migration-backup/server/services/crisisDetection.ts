/**
 * Crisis-keyword detection for the AI Sasquatch Coach.
 *
 * The coach is for stroke survivors — a population with significantly
 * elevated post-stroke depression and suicide risk. We MUST short-circuit
 * the LLM and route to professional crisis resources whenever a user
 * expresses suicidal ideation, self-harm, or violent intent toward others.
 *
 * Detection is intentionally conservative (favor false positives over
 * false negatives). A handful of these matches → crisis response, no LLM call.
 */

export type CrisisCategory = "suicide" | "self_harm" | "violence" | "abuse";

export interface CrisisMatch {
  detected: boolean;
  category?: CrisisCategory;
  matchedPhrase?: string;
}

/**
 * Phrase patterns are normalized lowercase substrings matched against the
 * normalized message. Word-boundary regex is used for short tokens to avoid
 * false positives ("kill" inside "skill").
 */
const SUICIDE_PHRASES: RegExp[] = [
  /\bkill myself\b/,
  /\bkilling myself\b/,
  /\bend(ing)? my life\b/,
  /\bend(ing)? it all\b/,
  /\btak(e|ing) my (own )?life\b/,
  /\bsuicide\b/,
  /\bsuicidal\b/,
  /\bwant to die\b/,
  /\bwanna die\b/,
  /\bdon'?t want to (be alive|live)\b/,
  /\bbetter off dead\b/,
  /\bno (point|reason) (in|to) liv/,
  /\bnothing to live for\b/,
  /\bplan(ning)? to (kill|hurt) myself\b/,
  /\boverdose\b.*\b(myself|on purpose|to die)\b/,
  /\bhang myself\b/,
  /\bshoot myself\b/,
];

const SELF_HARM_PHRASES: RegExp[] = [
  /\bcut myself\b/,
  /\bcutting myself\b/,
  /\bhurt myself\b/,
  /\bhurting myself\b/,
  /\bself[- ]harm\b/,
  /\bself[- ]injury\b/,
  /\bburn myself\b/,
];

const VIOLENCE_PHRASES: RegExp[] = [
  /\bkill (him|her|them|my (wife|husband|spouse|partner|kid|child|mom|dad))\b/,
  /\bhurt (him|her|them|someone)\b/,
  /\bshoot (up|him|her|them)\b/,
];

const ABUSE_PHRASES: RegExp[] = [
  /\bbeat(ing|s)? me\b/,
  /\babus(ing|es|ed)? me\b/,
  /\bhit(ting|s)? me\b/,
  /\bnot safe at home\b/,
];

function scan(message: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = message.match(p);
    if (m) return m[0];
  }
  return null;
}

export function detectCrisis(rawMessage: string): CrisisMatch {
  if (!rawMessage || typeof rawMessage !== "string") {
    return { detected: false };
  }
  // Normalize: lowercase, collapse whitespace, strip excessive punctuation.
  const message = rawMessage
    .toLowerCase()
    .replace(/[^a-z0-9'\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const suicide = scan(message, SUICIDE_PHRASES);
  if (suicide) return { detected: true, category: "suicide", matchedPhrase: suicide };

  const selfHarm = scan(message, SELF_HARM_PHRASES);
  if (selfHarm) return { detected: true, category: "self_harm", matchedPhrase: selfHarm };

  const violence = scan(message, VIOLENCE_PHRASES);
  if (violence) return { detected: true, category: "violence", matchedPhrase: violence };

  const abuse = scan(message, ABUSE_PHRASES);
  if (abuse) return { detected: true, category: "abuse", matchedPhrase: abuse };

  return { detected: false };
}

/**
 * Builds the structured response the coach returns INSTEAD of an LLM call
 * when a crisis is detected. The client renders this as a CrisisCard with
 * tap-to-call links.
 */
export function buildCrisisResponse(category: CrisisCategory): {
  response: string;
  crisis: true;
  category: CrisisCategory;
  resources: Array<{
    label: string;
    detail: string;
    action: { type: "tel" | "sms" | "url"; value: string };
  }>;
} {
  const baseResources = [
    {
      label: "988 Suicide & Crisis Lifeline",
      detail: "Call or text 988 — free, confidential, 24/7.",
      action: { type: "tel" as const, value: "988" },
    },
    {
      label: "Crisis Text Line",
      detail: "Text HOME to 741741 to reach a trained crisis counselor.",
      action: { type: "sms" as const, value: "741741?body=HOME" },
    },
    {
      label: "Veterans Crisis Line",
      detail: "Dial 988 then press 1, or text 838255.",
      action: { type: "tel" as const, value: "988" },
    },
    {
      label: "If you're in immediate danger",
      detail: "Call 911 or go to your nearest emergency room.",
      action: { type: "tel" as const, value: "911" },
    },
  ];

  const abuseResources = [
    {
      label: "National Domestic Violence Hotline",
      detail: "Call 1-800-799-7233 or text START to 88788.",
      action: { type: "tel" as const, value: "1-800-799-7233" },
    },
    {
      label: "Adult Protective Services",
      detail: "Call your local APS office to report elder or vulnerable-adult abuse.",
      action: { type: "url" as const, value: "https://www.napsa-now.org/get-help/help-in-your-area/" },
    },
    {
      label: "If you're in immediate danger",
      detail: "Call 911 or go to your nearest emergency room.",
      action: { type: "tel" as const, value: "911" },
    },
  ];

  const messages: Record<CrisisCategory, string> = {
    suicide:
      "I hear you, and I'm not going to brush past what you just said. I'm an AI — not a crisis counselor — and the right people for this moment are humans who do this work every single day. They're free, confidential, and reachable right now. Please reach out to one of them before we go any further.",
    self_harm:
      "What you described is serious, and you deserve real human support — not an AI script. The resources below are free, confidential, and available right now. Please reach out before we keep going.",
    violence:
      "I'm not the right tool for what you're describing. If you or anyone else is in danger, please reach a human who can actually help — the resources below are available 24/7.",
    abuse:
      "What you're describing is not okay, and you don't have to handle it alone. There are people trained specifically for this. Reach out — you deserve to be safe.",
  };

  return {
    response: messages[category],
    crisis: true,
    category,
    resources: category === "abuse" ? abuseResources : baseResources,
  };
}
