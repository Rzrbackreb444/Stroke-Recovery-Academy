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
export type SafetyCategory = CrisisCategory | "medical_emergency" | "medical_concern";

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
  /\b(can'?t|cannot|don'?t) go on\b/,
  /\b(done|finished) with (my )?life\b/,
  /\bwant (everything|it all|this) to end\b/,
  /\bwant to disappear\b/,
  /\bwish i (was|were) dead\b/,
  /\bwish i wasn'?t here\b/,
  /\bnot worth living\b/,
  /\bno way out\b/,
  /\bmake it stop\b/,
  /\bsuicide attempt\b/,
  /\bplan(ning)? to (kill|hurt) myself\b/,
  /\boverdose\b.*\b(myself|on purpose|to die)\b/,
  /\bhang myself\b/,
  /\bshoot myself\b/,
  /\bcan't keep myself safe\b/,
  /\bcannot keep myself safe\b/,
  /\bcan't stay safe\b/,
  /\bcannot stay safe\b/,
  /\bbetter off without me\b/,
  /\bpeople would be better without me\b/,
  /\beveryone would be better without me\b/,
  /\bi('m| am) a burden\b/,
  /\b(?:i'm|i am) saying goodbye\b/,
  /\bsaying my final goodbye\b/,
  /\b(?:won't|will not) be here tomorrow\b/,
  /\bnot going to be here tomorrow\b/,
  /\bhave a plan to (?:die|kill|end|hurt)\b/,
  /\baccess to (?:pills|a gun|firearm|a weapon)\b.*\b(?:die|kill|hurt)\b/,
];

const SELF_HARM_PHRASES: RegExp[] = [
  /\bcut myself\b/,
  /\bcutting myself\b/,
  /\bhurt myself\b/,
  /\bhurting myself\b/,
  /\bself[- ]harm\b/,
  /\bself[- ]injury\b/,
  /\bburn myself\b/,
  /\binjure myself\b/,
  /\bharm myself\b/,
  /\bhurt myself or someone\b/,
  /\btake too many\b/,
  /\bcutting\b.*\bmyself\b/,
];

const VIOLENCE_PHRASES: RegExp[] = [
  /\bkill (him|her|them|my (wife|husband|spouse|partner|kid|child|mom|dad))\b/,
  /\bhurt (him|her|them|someone)\b/,
  /\bhurt (other people|others|everyone)\b/,
  /\bkill everyone\b/,
  /\bviolence against\b/,
  /\bshoot (up|him|her|them)\b/,
];

const ABUSE_PHRASES: RegExp[] = [
  /\bbeat(ing|s)? me\b/,
  /\babus(ing|es|ed)? me\b/,
  /\bhit(ting|s)? me\b/,
  /\bnot safe at home\b/,
  /\bbeing abused\b/,
  /\bthreaten(ing|s)? me\b/,
  /\bcontrol(ling)? me\b/,
  /\bforced sex\b/,
  /\bsexual(ly)? abus/,
  /\bfinancial(ly)? abus/,
];

// These are intentionally high-signal phrases rather than single translated
// words. A standalone word like "hurt", "plan", or "disappear" is too common
// in ordinary recovery conversations to intercept safely.
const SUICIDE_TRANSLATED_PHRASES = [
  // Spanish
  "quiero morir", "quiero matarme", "quitarme la vida", "acabar con mi vida",
  "no quiero vivir", "no hay razón para vivir", "sería mejor sin mí", "soy una carga",
  "no puedo mantenerme a salvo",
  // French
  "je veux mourir", "je veux me tuer", "mettre fin à ma vie", "je ne veux pas vivre",
  "aucune raison de vivre", "ce serait mieux sans moi", "je suis un fardeau",
  "je ne peux pas rester en sécurité",
  // German
  "ich will sterben", "ich will mich umbringen", "mein leben beenden",
  "ich will nicht leben", "kein grund zu leben", "besser ohne mich", "ich bin eine last",
  "ich kann mich nicht sicher halten",
  // Portuguese
  "quero morrer", "quero me matar", "acabar com a minha vida", "tirar minha vida",
  "não quero viver", "não há razão para viver", "melhor sem mim", "sou um fardo",
  "não consigo me manter seguro",
  // Italian
  "voglio morire", "voglio uccidermi", "farla finita", "togliere la mia vita",
  "non voglio vivere", "nessun motivo per vivere", "meglio senza di me", "sono un peso",
  // Japanese, Korean, and Chinese
  "死にたい", "自殺したい", "命を絶つ", "生きたくない", "自分を安全に保てない",
  "죽고 싶어", "자살하고 싶어", "살고 싶지 않아", "내 자신을 안전하게 지킬 수 없어",
  "想死", "想自杀", "不想活", "结束自己的生命", "我无法保护自己的安全",
  // Arabic
  "أريد أن أموت", "أريد الانتحار", "لا أريد أن أعيش", "لا أستطيع الحفاظ على سلامتي",
];

const SELF_HARM_TRANSLATED_PHRASES = [
  "hacerme daño", "hacerme cortes", "cortarme", "me quiero lastimar",
  "me faire du mal", "me couper", "je veux me blesser",
  "mir selbst weh tun", "mich selbst verletzen", "mi ferire", "tagliarmi",
  "me machucar", "me cortar", "自分を傷つけ", "リストカット",
  "자신을 해치", "伤害自己", "割腕", "أؤذي نفسي",
];

const VIOLENCE_TRANSLATED_PHRASES = [
  "quiero matar a alguien", "quiero hacer daño a alguien",
  "je veux tuer quelqu'un", "je veux faire du mal à quelqu'un",
  "ich will jemanden umbringen", "ich will jemandem weh tun",
  "quero matar alguém", "quero machucar alguém",
  "voglio uccidere qualcuno", "誰かを殺したい", "누군가를 죽이고 싶어",
  "想杀人", "أريد قتل شخص",
];

const ABUSE_TRANSLATED_PHRASES = [
  "no estoy a salvo en casa", "me golpea", "me maltrata",
  "je ne suis pas en sécurité chez moi", "il me frappe", "on me maltraite",
  "ich bin zu hause nicht sicher", "er schlägt mich", "ich werde missbraucht",
  "não estou seguro em casa", "ele me bate", "estou sendo abusado",
  "non sono al sicuro a casa", "mi picchia", "家で安全ではない",
  "집에서 안전하지 않아", "我在家不安全", "لست آمنا في المنزل",
];

const MEDICAL_EMERGENCY_PHRASES = [
  // English stroke and acute medical red flags.
  "sudden weakness", "new weakness", "suddenly weak", "one side is weak",
  "face is drooping", "facial droop", "slurred speech", "can't speak",
  "cannot speak", "trouble speaking", "sudden numbness", "new numbness",
  "sudden confusion", "severe sudden headache", "worst headache",
  "chest pain", "chest pressure", "can't breathe", "cannot breathe",
  "trouble breathing", "having a seizure", "i had a seizure", "passed out",
  "fainted", "unconscious", "serious fall", "hit my head",
  // Common supported-language equivalents.
  "debilidad repentina", "cara caída", "dificultad para hablar", "dolor de pecho",
  "no puedo respirar", "convulsión", "me desmayé",
  "faiblesse soudaine", "visage qui tombe", "difficulté à parler", "douleur à la poitrine",
  "je ne peux pas respirer", "convulsion", "je me suis évanoui",
  "plötzliche schwäche", "gesicht hängt", "sprachstörung", "brustschmerz",
  "ich kann nicht atmen", "krampfanfall", "ohnmächtig",
  "fraqueza súbita", "rosto caído", "dificuldade para falar", "dor no peito",
  "não consigo respirar", "convulsão", "desmaiei",
  "突然の力が入らない", "顔が下がる", "ろれつが回らない", "胸の痛み",
  "息ができない", "発作", "気を失った",
  "突然无力", "脸歪", "说话困难", "胸痛", "无法呼吸", "抽搐", "晕倒",
  "갑작스러운 힘 빠짐", "얼굴 처짐", "말하기 어려움", "가슴 통증",
  "숨을 쉴 수 없어", "발작", "기절",
];

const MEDICAL_CONCERN_PHRASES = [
  "new symptom", "new symptoms", "worsening symptom", "worsening symptoms",
  "symptoms are getting worse", "pain during exercise", "dizzy during exercise",
  "short of breath during exercise", "unusual pain", "new severe pain",
  "debilidad nueva", "síntomas nuevos", "síntomas empeoran", "dolor durante el ejercicio",
  "nouveau symptôme", "symptômes nouveaux", "symptômes s'aggravent", "douleur pendant l'exercice",
  "neues symptom", "neue symptome", "symptome werden schlimmer", "schmerzen beim training",
  "sintoma novo", "novos sintomas", "sintomas piorando", "dor durante o exercício",
  "新しい症状", "症状が悪化", "運動中の痛み", "新的症状", "症状越来越严重",
  "새로운 증상", "증상이 악화", "운동 중 통증",
];

function normalize(rawMessage: string): string {
  return rawMessage
    .normalize("NFKC")
    .toLocaleLowerCase()
    // Keep letters/numbers from every script. Punctuation becomes a
    // separator so "I-can't" and "I can't" are treated alike.
    .replace(/[^\p{L}\p{N}'\-\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function withoutDiacritics(message: string): string {
  return message.normalize("NFD").replace(/\p{M}/gu, "");
}

function scan(message: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = message.match(p);
    if (m) return m[0];
  }
  return null;
}

function scanPhrases(messages: string[], phrases: string[]): string | null {
  for (const phrase of phrases) {
    for (const message of messages) {
      if (message.includes(phrase)) return phrase;
    }
  }
  return null;
}

function normalizedMessages(rawMessage: string): string[] {
  const message = normalize(rawMessage);
  const plain = withoutDiacritics(message);
  return plain === message ? [message] : [message, plain];
}

function detectCrisisFromMessages(messages: string[]): CrisisMatch {
  const message = messages[0];
  const translated = (phrases: string[]) => scanPhrases(messages, phrases);

  const suicide = scan(message, SUICIDE_PHRASES) || translated(SUICIDE_TRANSLATED_PHRASES);
  if (suicide) return { detected: true, category: "suicide", matchedPhrase: suicide };

  const selfHarm = scan(message, SELF_HARM_PHRASES) || translated(SELF_HARM_TRANSLATED_PHRASES);
  if (selfHarm) return { detected: true, category: "self_harm", matchedPhrase: selfHarm };

  const violence = scan(message, VIOLENCE_PHRASES) || translated(VIOLENCE_TRANSLATED_PHRASES);
  if (violence) return { detected: true, category: "violence", matchedPhrase: violence };

  const abuse = scan(message, ABUSE_PHRASES) || translated(ABUSE_TRANSLATED_PHRASES);
  if (abuse) return { detected: true, category: "abuse", matchedPhrase: abuse };

  return { detected: false };
}

export function detectCrisis(rawMessage: string): CrisisMatch {
  if (!rawMessage || typeof rawMessage !== "string") {
    return { detected: false };
  }
  return detectCrisisFromMessages(normalizedMessages(rawMessage));
}

export interface SafetyMatch {
  detected: boolean;
  category?: SafetyCategory;
  matchedPhrase?: string;
}

/**
 * Detects both crisis intent and urgent medical disclosures without involving
 * an LLM or a translation API. This must remain deterministic and available
 * before quotas, Gemini, or text-to-speech are touched.
 */
export function detectSafetyRisk(rawMessage: string): SafetyMatch {
  if (!rawMessage || typeof rawMessage !== "string") {
    return { detected: false };
  }

  const crisis = detectCrisis(rawMessage);
  if (crisis.detected) return crisis;

  const messages = normalizedMessages(rawMessage);
  const medicalEmergency = scanPhrases(messages, MEDICAL_EMERGENCY_PHRASES);
  if (medicalEmergency) {
    return { detected: true, category: "medical_emergency", matchedPhrase: medicalEmergency };
  }

  const medicalConcern = scanPhrases(messages, MEDICAL_CONCERN_PHRASES);
  if (medicalConcern) {
    return { detected: true, category: "medical_concern", matchedPhrase: medicalConcern };
  }

  return { detected: false };
}

/**
 * Builds the structured response the coach returns INSTEAD of an LLM call
 * when a crisis is detected. The client renders this as a CrisisCard with
 * tap-to-call links.
 */
export function buildSafetyResponse(category: SafetyCategory): {
  response: string;
  crisis: true;
  category: SafetyCategory;
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
      label: "Immediate danger",
      detail: "Call your local emergency number (911 in the U.S./Canada, 112 in many countries) or go to an emergency room.",
      action: { type: "tel" as const, value: "911" },
    },
    {
      label: "Find help where you are",
      detail: "Find a verified local crisis line at findahelpline.com.",
      action: { type: "url" as const, value: "https://findahelpline.com/" },
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
      detail: "Call your local emergency number (911 in the U.S./Canada, 112 in many countries) or go to an emergency room.",
      action: { type: "tel" as const, value: "911" },
    },
    {
      label: "Find help where you are",
      detail: "Find a verified local crisis and safety service at findahelpline.com.",
      action: { type: "url" as const, value: "https://findahelpline.com/" },
    },
  ];

  const localEmergencyResource = {
    label: "Local emergency services",
    detail: "Call your local emergency number now (911 in the U.S./Canada, 112 in many countries), or have someone take you to emergency care.",
    action: { type: "tel" as const, value: "911" },
  };
  const medicalResources = [
    localEmergencyResource,
    {
      label: "Your healthcare team",
      detail: "Contact your clinician or care team promptly for guidance. Do not drive yourself if you feel faint, confused, or unsafe.",
      action: { type: "url" as const, value: "https://www.stroke.org/en/about-stroke/stroke-symptoms" },
    },
  ];

  const messages: Record<SafetyCategory, string> = {
    suicide:
      "I hear you, and I'm not going to brush past what you just said. I'm an AI — not a crisis counselor — and the right people for this moment are humans who do this work every single day. They're free, confidential, and reachable right now. Please reach out to one of them before we go any further.",
    self_harm:
      "What you described is serious, and you deserve real human support — not an AI script. The resources below are free, confidential, and available right now. Please reach out before we keep going.",
    violence:
      "I'm not the right tool for what you're describing. If you or anyone else is in danger, please reach a human who can actually help — the resources below are available 24/7.",
    abuse:
      "What you're describing is not okay, and you don't have to handle it alone. There are people trained specifically for this. Reach out — you deserve to be safe.",
    medical_emergency:
      "Please stop what you are doing and rest now. Sudden or severe symptoms can be an emergency, and I cannot assess you safely. Call your local emergency number now or have someone take you to emergency care; do not drive yourself.",
    medical_concern:
      "Please pause the activity now — do not push through pain, dizziness, weakness, breathing changes, or any new or worsening symptom. Contact your healthcare team promptly; if symptoms are sudden, severe, or getting worse, call your local emergency number now.",
  };

  return {
    response: messages[category],
    crisis: true,
    category,
    resources:
      category === "abuse"
        ? abuseResources
        : category === "medical_emergency" || category === "medical_concern"
        ? medicalResources
        : baseResources,
  };
}

export function buildCrisisResponse(category: CrisisCategory) {
  return buildSafetyResponse(category);
}
