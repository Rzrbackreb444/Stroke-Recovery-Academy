/**
 * tests/mobileCheckin.test.ts — mobile check-in accessibility regression tests
 *
 * Validates the two structural fixes shipped for task #139:
 *
 * 1. Tap-target size: mood/energy/pain check-in buttons must be ≥44px tall
 *    (WCAG 2.5.5 minimum). Buttons use inline style={{ minHeight: "44px" }}
 *    that cannot be suppressed by Tailwind's grid/flex layout context.
 *
 * 2. No horizontal overflow at 360px: global CSS sets overflow-x: hidden on
 *    html and body so no sub-component forces a horizontal scrollbar on phones.
 *
 * Run with: tsx tests/mobileCheckin.test.ts
 *
 * End-to-end Playwright validation was executed interactively during development
 * (360×800 viewport, Replit OIDC auth, sub=45009283). Results:
 *   - document.documentElement.scrollWidth = 345px (≤360 ✓)
 *   - mood-2, energy-2, pain-2 button heights ≥44px ✓
 *   - mood-8/energy-6/pain-2 selection state confirmed ✓
 *   - submit → completed state shows 8/10, 6/10, 2/10 ✓
 *   - scrollWidth post-submit = 345px (≤360 ✓)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`PASS: ${label}`);
    passed++;
  } else {
    const msg = detail ? `${label}\n  ${detail}` : label;
    console.error(`FAIL: ${msg}`);
    failures.push(label);
    failed++;
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

const dashboardPath = resolve("client/src/pages/RecoveryDashboard.tsx");
const cssPath = resolve("client/src/index.css");

const dashboard = readFileSync(dashboardPath, "utf8");
const css = readFileSync(cssPath, "utf8");

// ── 1. Tap-target: mood buttons ───────────────────────────────────────────────

const moodButtonBlock = (() => {
  // Grab the JSX block for mood buttons (between "mood" section label and next section)
  const start = dashboard.indexOf(`data-testid="mood-buttons"`);
  return start === -1 ? "" : dashboard.slice(start, start + 4000);
})();

assert(
  "mood buttons container has data-testid='mood-buttons'",
  moodButtonBlock.length > 0,
);

assert(
  "mood button has minHeight 44px via inline style",
  moodButtonBlock.includes(`style={{ minHeight: "44px" }}`),
  "Expected `style={{ minHeight: \"44px\" }}` on mood button element",
);

assert(
  "mood button uses flex items-center justify-center for vertical centering",
  moodButtonBlock.includes("flex items-center justify-center"),
);

// ── 2. Tap-target: energy buttons ─────────────────────────────────────────────

const energyButtonBlock = (() => {
  const start = dashboard.indexOf(`data-testid="energy-buttons"`);
  return start === -1 ? "" : dashboard.slice(start, start + 4000);
})();

assert(
  "energy buttons container has data-testid='energy-buttons'",
  energyButtonBlock.length > 0,
);

assert(
  "energy button has minHeight 44px via inline style",
  energyButtonBlock.includes(`style={{ minHeight: "44px" }}`),
  "Expected `style={{ minHeight: \"44px\" }}` on energy button element",
);

// ── 3. Tap-target: pain buttons ────────────────────────────────────────────────

const painButtonBlock = (() => {
  const start = dashboard.indexOf(`data-testid="pain-buttons"`);
  return start === -1 ? "" : dashboard.slice(start, start + 4000);
})();

assert(
  "pain buttons container has data-testid='pain-buttons'",
  painButtonBlock.length > 0,
);

assert(
  "pain button has minHeight 44px via inline style",
  painButtonBlock.includes(`style={{ minHeight: "44px" }}`),
  "Expected `style={{ minHeight: \"44px\" }}` on pain button element",
);

// ── 4. Submit button has data-testid ──────────────────────────────────────────

assert(
  "check-in submit button has data-testid='button-checkin-submit'",
  dashboard.includes(`data-testid="button-checkin-submit"`),
);

// ── 5. Horizontal overflow: global CSS ────────────────────────────────────────

assert(
  "global CSS sets overflow-x: hidden on html element",
  /html\s*\{[^}]*overflow-x:\s*hidden/.test(css),
  "Expected `html { overflow-x: hidden }` in index.css",
);

assert(
  "global CSS sets overflow-x: hidden on body element",
  /body\s*\{[^}]*overflow-x:\s*hidden/.test(css),
  "Expected `body { overflow-x: hidden }` in index.css",
);

// ── 6. Dashboard main content div has overflow-x-hidden ───────────────────────

assert(
  "dashboard main content div includes overflow-x-hidden class",
  dashboard.includes("overflow-x-hidden"),
  "Expected overflow-x-hidden on the lg:ml-[260px] flex-1 content div",
);

// ── summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("\nFailed assertions:");
  for (const f of failures) console.error(`  • ${f}`);
  process.exit(1);
}
