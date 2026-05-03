/**
 * Verifies the safeJsonLd helper neutralizes every known JSON-LD-in-script-tag
 * breakout vector. Runnable directly with: `tsx tests/safeJsonLd.test.ts`
 *
 * No vitest required — exit code is non-zero on any failure.
 */

import { safeJsonLd } from "../client/src/lib/safeJsonLd";

type Case = {
  label: string;
  input: unknown;
  mustNotContain: string[];
};

const cases: Case[] = [
  {
    label: "literal </script> in a string field cannot break out",
    input: { name: "</script><script>alert(1)</script>" },
    mustNotContain: ["</script", "</SCRIPT"],
  },
  {
    label: "case-variant </Script> is also escaped",
    input: { description: "</Script><img src=x onerror=alert(1)>" },
    mustNotContain: ["</script", "</Script"],
  },
  {
    label: "raw < and > are unicode-escaped (defense in depth)",
    input: { headline: "5 < 10 and 20 > 15" },
    mustNotContain: ["<", ">"],
  },
  {
    label: "raw & is unicode-escaped",
    input: { brand: "Tom & Jerry" },
    mustNotContain: ["&"],
  },
  {
    label: "U+2028 line separator is escaped (JS-string-literal hazard if reused)",
    input: { quote: "line one\u2028line two" },
    mustNotContain: ["\u2028"],
  },
  {
    label: "U+2029 paragraph separator is escaped",
    input: { quote: "para one\u2029para two" },
    mustNotContain: ["\u2029"],
  },
  {
    label: "nested object with </script> in deep field is also escaped",
    input: { author: { bio: "</script>" }, tags: ["</script>"] },
    mustNotContain: ["</script"],
  },
  {
    label: "round-trip preserves semantic content (JSON.parse can decode back)",
    input: { name: "</script><b>x</b>", n: 42 },
    mustNotContain: [],
  },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const out = safeJsonLd(c.input);
  let ok = true;
  for (const bad of c.mustNotContain) {
    if (out.includes(bad)) {
      console.error(`FAIL: ${c.label}\n  output contained forbidden token ${JSON.stringify(bad)}\n  output: ${out}`);
      ok = false;
      break;
    }
  }
  // Round-trip integrity for the last case
  if (ok && c.label.startsWith("round-trip")) {
    try {
      const parsed = JSON.parse(out
        .replace(/\\u003c/g, "<")
        .replace(/\\u003e/g, ">")
        .replace(/\\u0026/g, "&"));
      if (JSON.stringify(parsed) !== JSON.stringify(c.input)) {
        console.error(`FAIL: ${c.label}\n  round-trip lost data\n  in:  ${JSON.stringify(c.input)}\n  out: ${JSON.stringify(parsed)}`);
        ok = false;
      }
    } catch (e) {
      console.error(`FAIL: ${c.label}\n  round-trip threw: ${(e as Error).message}`);
      ok = false;
    }
  }
  if (ok) {
    pass++;
    console.log(`PASS: ${c.label}`);
  } else {
    fail++;
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
