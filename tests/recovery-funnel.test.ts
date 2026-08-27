/**
 * Regression coverage for the survivor account → onboarding → Today funnel.
 *
 * The project does not currently ship a browser test runner, so these tests
 * pin the routing and interaction contracts at their boundaries. Keeping the
 * assertions close to the source makes a route alias or redirect change fail
 * in the normal test command instead of silently breaking a new survivor's
 * first session.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [serverApp, serverRoutes, clientApp, recoveryLogin, recoveryToday] = await Promise.all([
  readFile(new URL("../server/app.ts", import.meta.url), "utf8"),
  readFile(new URL("../server/routes.ts", import.meta.url), "utf8"),
  readFile(new URL("../client/src/App.tsx", import.meta.url), "utf8"),
  readFile(new URL("../client/src/pages/RecoveryLogin.tsx", import.meta.url), "utf8"),
  readFile(new URL("../client/src/pages/RecoveryToday.tsx", import.meta.url), "utf8"),
]);

function sourceBetween(source: string, start: string, end: string): string {
  const startAt = source.indexOf(start);
  const endAt = source.indexOf(end, startAt + start.length);
  assert.notEqual(startAt, -1, `missing source anchor: ${start}`);
  assert.notEqual(endAt, -1, `missing source anchor: ${end}`);
  return source.slice(startAt, endAt);
}

test("anonymous Today requests redirect to login with the exact requested URL", () => {
  const guard = sourceBetween(
    serverApp,
    "// Keep the survivor's first-session destination protected",
    "// Structured error logger runs first",
  );

  assert.match(guard, /if \(req\.method !== "GET"\) return next\(\);/);
  assert.match(guard, /const isToday = requestedPath === "\/recovery\/today";/);
  assert.match(
    guard,
    /return res\.redirect\(302, `\/recovery\/login\?next=\$\{encodeURIComponent\(req\.originalUrl\)\}`\);/,
  );

  const requestedUrl = "/recovery/today?from=invite";
  assert.equal(
    `/recovery/login?next=${encodeURIComponent(requestedUrl)}`,
    "/recovery/login?next=%2Frecovery%2Ftoday%3Ffrom%3Dinvite",
  );
});

test("legacy recovery dashboard and routine URLs resolve to canonical Today", () => {
  for (const alias of ["/recovery/dashboard", "/recovery/routine"]) {
    const route = new RegExp(
      `<Route path="${alias.replaceAll("/", "\\/")}">\\s*<RecoveryRouteRedirect to="\\/recovery\\/today"`,
    );
    assert.match(clientApp, route, `${alias} should redirect in the SPA`);
  }

  const guard = sourceBetween(
    serverApp,
    "// Keep the survivor's first-session destination protected",
    "// Structured error logger runs first",
  );
  assert.match(
    guard,
    /const isLegacyTodayAlias =\s*requestedPath === "\/recovery\/dashboard" \|\| requestedPath === "\/recovery\/routine"/,
  );
  assert.match(
    guard,
    /if \(authenticated\) return res\.redirect\(302, "\/recovery\/today"\);/,
  );
});

test("new-account signup always enters onboarding, ignoring the public destination", () => {
  const signupMutation = sourceBetween(
    recoveryLogin,
    "const signUpMut = useMutation",
    "const otpSendMut = useMutation",
  );

  assert.match(
    signupMutation,
    /onSuccess: \(\) => \{ window\.location\.href = "\/recovery\/onboarding"; \}/,
  );
  assert.doesNotMatch(
    signupMutation,
    /safeNext/,
    "signup must not skip onboarding by using the requested destination",
  );
});

test("Google auth sends new survivors to onboarding and completed survivors to next", () => {
  const googleCallback = sourceBetween(
    serverRoutes,
    "app.get('/api/auth/google/callback'",
    "app.get('/api/auth/facebook'",
  );

  assert.match(googleCallback, /const returnTo = safeRecoveryReturnTo/);
  assert.match(googleCallback, /const \[\[assessment\], \[plan\]\] = await Promise\.all/);
  assert.match(googleCallback, /sasquatchAssessments\.userId, user\.id/);
  assert.match(googleCallback, /survivorPlans\.userId, user\.id/);
  assert.match(
    googleCallback,
    /res\.redirect\(assessment && plan \? returnTo : "\/recovery\/onboarding"\)/,
  );
  assert.match(
    googleCallback,
    /catch \{\s*\/\/ If the completion check is unavailable[\s\S]*?res\.redirect\("\/recovery\/onboarding"\)/,
  );
  assert.match(
    recoveryLogin,
    /href=\{`\/api\/auth\/google\?next=\$\{encodeURIComponent\(safeNext\)\}`\}/,
  );
});

test("OTP auth uses the same new-versus-onboarded routing contract", () => {
  const postAuthRouting = sourceBetween(
    recoveryLogin,
    "async function routeAfterAuth()",
    "const signInMut = useMutation",
  );
  const otpVerification = sourceBetween(
    recoveryLogin,
    "const otpVerifyMut = useMutation",
    "const forgotMut = useMutation",
  );

  assert.match(postAuthRouting, /fetch\("\/api\/recovery\/me\/state", \{ credentials: "include" \}\)/);
  assert.match(postAuthRouting, /if \(state\?\.hasOnboarded\)/);
  assert.match(postAuthRouting, /window\.location\.href = safeNext/);
  assert.match(postAuthRouting, /window\.location\.href = "\/recovery\/onboarding"/);
  assert.match(otpVerification, /apiRequest\("POST", "\/api\/auth\/otp\/verify", data\)/);
  assert.match(otpVerification, /onSuccess: \(\) => \{ routeAfterAuth\(\); \}/);
});

test("a completed Today reaction posts feedback and exposes the next-action state", () => {
  const recordAndAdvance = sourceBetween(
    recoveryToday,
    "const recordAndAdvance =",
    "const skipCurrent =",
  );

  assert.match(
    recoveryToday,
    /apiRequest\("POST", "\/api\/recovery\/today\/feedback", payload\)/,
  );
  assert.match(recordAndAdvance, /taskId: current\.id/);
  assert.match(recordAndAdvance, /level: chosenLevel/);
  assert.match(recordAndAdvance, /reaction,/);
  assert.match(recordAndAdvance, /date: todayStr\(\)/);
  assert.match(
    recordAndAdvance,
    /setStage\(ambulatory \? "walk" : "complete"\);/,
  );

  const completion = sourceBetween(
    recoveryToday,
    'data-testid="card-complete"',
    'data-testid="button-next-rep"',
  );
  assert.match(completion, /data-testid="card-next-action"/);
  assert.match(completion, /Come back to Today tomorrow/);
  assert.match(completion, /Your first recovery rep is recorded/);
});