// Fuzzy answer matching + SM-2 spaced repetition helpers.
// Shared by attempt grading and voice-answer endpoints.

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s]/gi, "").replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

// Returns similarity 0..1. 1.0 exact, anything ≥ threshold is considered correct.
export function fuzzySimilarity(user: string, expected: string): number {
  const a = normalize(user);
  const b = normalize(expected);
  if (!a || !b) return 0;
  if (a === b) return 1;
  // Also accept if user's answer *contains* the expected phrase (common for voice).
  if (a.includes(b) || b.includes(a)) return 0.92;
  const dist = levenshtein(a, b);
  const max = Math.max(a.length, b.length);
  return 1 - dist / max;
}

export function isFuzzyMatch(user: string, expected: string, threshold = 0.82): boolean {
  return fuzzySimilarity(user, expected) >= threshold;
}

// Grades one answer against a question row. Returns {correct, score 0..1, matchedAnswer?}.
export function gradeAnswer(
  question: { questionType: string; correctAnswer: string | null; options: any },
  userAnswer: any,
): { correct: boolean; score: number; matchedAnswer?: string } {
  const type = question.questionType || "multiple_choice";
  const correct = question.correctAnswer || "";

  if (type === "multiple_choice" || type === "mcq" || type === "true_false") {
    // options: [{id,text,isCorrect}] — correctAnswer holds the correct id (or text)
    const ua = String(userAnswer ?? "").trim();
    if (Array.isArray(question.options)) {
      const picked = question.options.find((o: any) => String(o.id) === ua || o.text === ua);
      const ok = picked?.isCorrect === true || String(picked?.id) === correct || picked?.text === correct;
      return { correct: !!ok, score: ok ? 1 : 0 };
    }
    return { correct: ua === correct, score: ua === correct ? 1 : 0 };
  }

  if (type === "fill_in" || type === "short_answer") {
    const sim = fuzzySimilarity(String(userAnswer ?? ""), correct);
    return { correct: sim >= 0.82, score: Math.max(0, Math.min(1, sim)) };
  }

  if (type === "drag_order") {
    // correctAnswer is a JSON array of ordered option ids (or comma-separated).
    let expected: string[] = [];
    try { expected = JSON.parse(correct); } catch { expected = correct.split(",").map(s => s.trim()); }
    const got = Array.isArray(userAnswer) ? userAnswer.map(String) : [];
    if (got.length !== expected.length) return { correct: false, score: 0 };
    const hits = got.filter((v, i) => v === expected[i]).length;
    const score = hits / expected.length;
    return { correct: score === 1, score };
  }

  if (type === "voice_record") {
    // userAnswer is already a transcript string from the voice endpoint.
    const sim = fuzzySimilarity(String(userAnswer ?? ""), correct);
    return { correct: sim >= 0.78, score: sim, matchedAnswer: correct };
  }

  // Unknown type → never correct.
  return { correct: false, score: 0 };
}

// SM-2 lite: returns next {intervalDays, ease, repetitions}.
// `quality` 0-5 (0-2 wrong, 3-5 correct).
export function sm2Update(
  prev: { intervalDays: number; ease: number; repetitions: number },
  quality: number,
): { intervalDays: number; ease: number; repetitions: number } {
  const q = Math.max(0, Math.min(5, quality));
  let ease = prev.ease + Math.round((0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)) * 100);
  if (ease < 130) ease = 130;

  if (q < 3) {
    return { intervalDays: 1, ease, repetitions: 0 };
  }
  let reps = prev.repetitions + 1;
  let interval: number;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 3;
  else interval = Math.max(1, Math.round(prev.intervalDays * (ease / 100)));
  return { intervalDays: interval, ease, repetitions: reps };
}
