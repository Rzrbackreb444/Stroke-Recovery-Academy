// Run: npx tsx tests/recoveryAnchorSchema.test.ts
//
// Validates the Recovery Anchor zod schemas + safeParseJson defenses
// against the LLM payload shapes the engine accepts.

import {
  anchorOutputSchema,
  passOneOutputSchema,
  clarificationOutputSchema,
  refusalOutputSchema,
  crisisOutputSchema,
  safeParseJson,
} from "../server/services/recoveryAnchor/recoveryAnchorSchema";

let passed = 0;
let failed = 0;

function ok(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e: any) {
    failed++;
    console.error(`  ✗ ${name}\n    ${e?.message ?? e}`);
  }
}

function eq<T>(a: T, b: T, msg = "values differ") {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`${msg}\n  expected: ${JSON.stringify(b)}\n  got:      ${JSON.stringify(a)}`);
  }
}

function shouldThrow(fn: () => void, msg: string) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  if (!threw) throw new Error(msg);
}

console.log("\n[recoveryAnchorSchema] safeParseJson");
ok("parses plain JSON", () => {
  const out = safeParseJson('{"a":1}') as any;
  eq(out.a, 1);
});
ok("strips ```json fences", () => {
  const out = safeParseJson('```json\n{"a":2}\n```') as any;
  eq(out.a, 2);
});
ok("strips bare ``` fences", () => {
  const out = safeParseJson('```\n{"a":3}\n```') as any;
  eq(out.a, 3);
});
ok("isolates JSON from prose", () => {
  const out = safeParseJson('Sure, here is the JSON:\n{"a":4, "b":[1,2]}\nLet me know.') as any;
  eq(out.a, 4);
  eq(out.b, [1, 2]);
});
ok("throws on empty input", () => {
  shouldThrow(() => safeParseJson(""), "should throw on empty");
});
ok("throws when no JSON object present", () => {
  shouldThrow(() => safeParseJson("hello world no braces"), "should throw on no braces");
});

console.log("\n[recoveryAnchorSchema] anchorOutputSchema");
ok("accepts a minimal affirmation anchor", () => {
  const a = anchorOutputSchema.parse({
    shape: "anchor",
    anchorType: "affirmation",
    title: "I rebuild",
    lines: ["Line one", "Line two", "Line three", "Line four"],
    callResponse: null,
    mnemonic: null,
    producerNotes: "4 lines, walking pace, downbeat on stressed syllables.",
    realityFooter: "Repetition over weeks, not one listen.",
  });
  eq(a.anchorType, "affirmation");
  eq(a.lines.length, 4);
});

ok("accepts a speech anchor with callResponse", () => {
  const a = anchorOutputSchema.parse({
    shape: "anchor",
    anchorType: "speech",
    title: "My name",
    lines: ["My name is Nick.", "I live on Main Street.", "I want some water."],
    callResponse: {
      sasquatch: ["My name is Nick.", "I live on Main Street.", "I want some water."],
      you: ["My name is Nick.", "I live on Main Street.", "I want some water."],
    },
    mnemonic: null,
    producerNotes: "Slow tempo. Hard consonants on stressed syllables.",
    realityFooter: "Practice once a day with a quiet room.",
  });
  eq(a.callResponse?.sasquatch.length, 3);
});

ok("accepts a memory anchor with mnemonic", () => {
  const a = anchorOutputSchema.parse({
    shape: "anchor",
    anchorType: "memory",
    title: "Morning meds",
    lines: ["Aspirin first at eight.", "Statin in the kitchen.", "Pressure pill last."],
    callResponse: null,
    mnemonic: {
      facts: ["8am: aspirin", "8am: statin", "8am: blood-pressure"],
      hookStamp: "Eight AM, three pills.",
    },
    producerNotes: "Sequential cipher with alliteration on the trigger phrase.",
    realityFooter: "Pair with a real visual cue (your pill organizer).",
  });
  eq(a.mnemonic?.facts.length, 3);
});

ok("rejects unknown anchor type", () => {
  shouldThrow(
    () =>
      anchorOutputSchema.parse({
        shape: "anchor",
        anchorType: "telepathy",
        title: "x",
        lines: ["x"],
        producerNotes: "x",
        realityFooter: "x",
      }),
    "should reject unknown anchorType"
  );
});

ok("rejects empty lines array", () => {
  shouldThrow(
    () =>
      anchorOutputSchema.parse({
        shape: "anchor",
        anchorType: "affirmation",
        title: "x",
        lines: [],
        producerNotes: "x",
        realityFooter: "x",
      }),
    "should reject empty lines"
  );
});

ok("rejects oversized title", () => {
  shouldThrow(
    () =>
      anchorOutputSchema.parse({
        shape: "anchor",
        anchorType: "affirmation",
        title: "x".repeat(200),
        lines: ["x"],
        producerNotes: "x",
        realityFooter: "x",
      }),
    "should reject 200-char title"
  );
});

console.log("\n[recoveryAnchorSchema] passOneOutputSchema");
ok("accepts disposition=clear with preview lines", () => {
  const p = passOneOutputSchema.parse({
    disposition: "clear",
    purposeAnchor: "Anchor the survivor's belief that they rebuild faster every week.",
    previewLines: ["I rebuild faster", "every week", "even when nobody sees"],
    previewProducerNotes: "Walking pace, 4-line skeleton.",
  });
  eq(p.disposition, "clear");
  eq(p.previewLines?.length, 3);
});

ok("accepts disposition=personal_crisis with category", () => {
  const p = passOneOutputSchema.parse({
    disposition: "personal_crisis",
    crisisCategory: "suicide",
  });
  eq(p.crisisCategory, "suicide");
});

ok("accepts disposition=needs_clarification", () => {
  const p = passOneOutputSchema.parse({
    disposition: "needs_clarification",
    clarificationQuestion: "What word do you want to recover first?",
  });
  eq(p.disposition, "needs_clarification");
});

ok("accepts disposition=refused", () => {
  const p = passOneOutputSchema.parse({
    disposition: "refused",
    refusalReason: "Cannot encode harmful content.",
  });
  eq(p.disposition, "refused");
});

ok("rejects unknown disposition", () => {
  shouldThrow(
    () => passOneOutputSchema.parse({ disposition: "maybe" }),
    "should reject unknown disposition"
  );
});

console.log("\n[recoveryAnchorSchema] crisisOutputSchema");
ok("accepts a well-formed crisis", () => {
  const c = crisisOutputSchema.parse({
    shape: "crisis",
    category: "suicide",
    message: "Please reach out for real human support right now.",
    resources: [
      { label: "988", detail: "Suicide & Crisis Lifeline", action: { type: "tel", value: "988" } },
    ],
  });
  eq(c.resources.length, 1);
});

console.log("\n[recoveryAnchorSchema] clarification + refusal shapes");
ok("clarification requires a question", () => {
  const c = clarificationOutputSchema.parse({
    shape: "needs_clarification",
    question: "Which name do you want to anchor first?",
  });
  eq(c.shape, "needs_clarification");
});
ok("refusal requires a reason", () => {
  const r = refusalOutputSchema.parse({ shape: "refused", reason: "Won't encode this." });
  eq(r.shape, "refused");
});

console.log("\n[recoveryAnchorSchema] safeParseJson + zod end-to-end");
ok("handles fenced LLM output through to anchorOutputSchema", () => {
  const raw = '```json\n{"shape":"anchor","anchorType":"affirmation","title":"Rebuild","lines":["I rebuild faster"],"callResponse":null,"mnemonic":null,"producerNotes":"x","realityFooter":"y"}\n```';
  const parsed = anchorOutputSchema.parse(safeParseJson(raw));
  eq(parsed.title, "Rebuild");
});

ok("handles prose-wrapped LLM output through passOneOutputSchema", () => {
  const raw = 'Of course! Here is the JSON:\n{"disposition":"clear","purposeAnchor":"x","previewLines":["a","b"],"previewProducerNotes":"x"}\nLet me know if you need more.';
  const parsed = passOneOutputSchema.parse(safeParseJson(raw));
  eq(parsed.disposition, "clear");
  eq(parsed.previewLines?.length, 2);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
