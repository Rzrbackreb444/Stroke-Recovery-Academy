/**
 * Post-publish, authenticated smoke check for the canonical survivor profile.
 *
 * Required environment:
 *   SURVIVOR_PROFILE_SMOKE_URL
 *   SURVIVOR_PROFILE_SMOKE_EMAIL
 *   SURVIVOR_PROFILE_SMOKE_PASSWORD
 *
 * Use a dedicated survivor account. The profile is restored in finally after
 * the round-trip so the check does not leave its marker data behind.
 */

type JsonResult = {
  response: Response;
  body: any;
};

const migration = "0014_canonical_survivor_profile.sql";
const baseUrl = (process.env.SURVIVOR_PROFILE_SMOKE_URL ?? "").replace(/\/+$/, "");
const email = process.env.SURVIVOR_PROFILE_SMOKE_EMAIL;
const password = process.env.SURVIVOR_PROFILE_SMOKE_PASSWORD;

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[survivor-profile smoke] ${name} is required; refusing to run an unauthenticated release check`,
    );
  }
  return value;
}

function cookieFrom(response: Response): string {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const setCookie = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()[0]
    : response.headers.get("set-cookie");
  if (!setCookie) throw new Error("[survivor-profile smoke] login did not set a session cookie");
  return setCookie.split(";", 1)[0];
}

async function requestJson(
  url: string,
  path: string,
  init: RequestInit = {},
  cookie?: string,
): Promise<JsonResult> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Forwarded-Proto", "https");
  if (cookie) headers.set("Cookie", cookie);
  const response = await fetch(`${url}${path}`, { ...init, headers });
  const text = await response.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { response, body };
}

function assertSuccessful(path: string, result: JsonResult): void {
  if (result.response.ok) return;
  const details = typeof result.body === "string"
    ? result.body
    : JSON.stringify(result.body);
  const migrationHint = result.body?.error === "canonical_survivor_profile_migration_required"
    ? ` Apply ${migration} to the published database.`
    : "";
  throw new Error(
    `[survivor-profile smoke] ${path} returned HTTP ${result.response.status}: ${details}.${migrationHint}`,
  );
}

function profileValues(profile: any): {
  preferredName: string;
  recoveryGoals: string[];
  assessmentNotes: string | null;
  dailyTimeBudgetMinutes: number | null;
  energyPattern: string | null;
} {
  return {
    preferredName: profile?.preferredName ?? "",
    recoveryGoals: Array.isArray(profile?.recoveryGoals) ? profile.recoveryGoals : [],
    assessmentNotes: profile?.assessmentNotes ?? null,
    dailyTimeBudgetMinutes: profile?.dailyTimeBudgetMinutes ?? null,
    energyPattern: profile?.energyPattern ?? null,
  };
}

async function main(): Promise<void> {
  required("SURVIVOR_PROFILE_SMOKE_URL", baseUrl);
  required("SURVIVOR_PROFILE_SMOKE_EMAIL", email);
  required("SURVIVOR_PROFILE_SMOKE_PASSWORD", password);

  const login = await requestJson(baseUrl, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assertSuccessful("/api/auth/login", login);
  const cookie = cookieFrom(login.response);

  const before = await requestJson(baseUrl, "/api/survivor/profile", {}, cookie);
  assertSuccessful("GET /api/survivor/profile", before);
  const original = before.body?.profile ?? {};
  const originalValues = profileValues(original);
  const marker = `profile-smoke-${Date.now()}`;
  const smokeValues = {
    preferredName: `Smoke ${marker}`.slice(0, 80),
    recoveryGoals: [`Verify ${marker}`.slice(0, 80)],
    assessmentNotes: marker,
    dailyTimeBudgetMinutes: 17,
    energyPattern: "afternoon",
  };
  let patched = false;

  try {
    const patch = await requestJson(baseUrl, "/api/survivor/profile", {
      method: "PATCH",
      body: JSON.stringify({
        profileSource: "survivor_profile_settings",
        ...smokeValues,
      }),
    }, cookie);
    assertSuccessful("PATCH /api/survivor/profile", patch);
    patched = true;

    const saved = await requestJson(baseUrl, "/api/survivor/profile", {}, cookie);
    assertSuccessful("GET /api/survivor/profile after PATCH", saved);
    if (JSON.stringify(profileValues(saved.body?.profile)) !== JSON.stringify(smokeValues)) {
      throw new Error(
        `[survivor-profile smoke] GET /api/survivor/profile did not return the PATCH values; ${migration} may be missing or the canonical write path drifted`,
      );
    }

    const today = await requestJson(baseUrl, "/api/recovery/today/recommendation", {}, cookie);
    assertSuccessful("GET /api/recovery/today/recommendation", today);
    if (JSON.stringify(today.body?.personalization?.goals ?? []) !== JSON.stringify(smokeValues.recoveryGoals)
      || today.body?.personalization?.timeBudgetMinutes !== smokeValues.dailyTimeBudgetMinutes
      || today.body?.personalization?.energyPattern !== smokeValues.energyPattern) {
      throw new Error("[survivor-profile smoke] Today did not read the saved canonical profile values");
    }

    const journey = await requestJson(baseUrl, "/api/recovery/journey", {}, cookie);
    assertSuccessful("GET /api/recovery/journey", journey);
    if (JSON.stringify(profileValues(journey.body?.profile)) !== JSON.stringify(smokeValues)) {
      throw new Error("[survivor-profile smoke] Journey did not read the saved canonical profile values");
    }

    const state = await requestJson(baseUrl, "/api/recovery/me/state", {}, cookie);
    assertSuccessful("GET /api/recovery/me/state", state);
    if (JSON.stringify(profileValues(state.body?.profile)) !== JSON.stringify(smokeValues)) {
      throw new Error("[survivor-profile smoke] recovery state did not read the saved canonical profile values");
    }

    const coach = await requestJson(baseUrl, "/api/coach/chat", {
      method: "POST",
      body: JSON.stringify({
        message: `Use my saved recovery goal ${smokeValues.recoveryGoals[0]} when answering.`,
        history: [],
        skipAudio: true,
      }),
    }, cookie);
    assertSuccessful("POST /api/coach/chat", coach);
    if (typeof coach.body?.response !== "string" || coach.body.response.length === 0) {
      throw new Error("[survivor-profile smoke] Coach returned no response using the saved profile context");
    }

    console.log(
      "[survivor-profile smoke] PASS: authenticated GET/PATCH, Today, Journey, recovery state, and Coach completed against the published app",
    );
  } finally {
    if (patched) {
      const restore = await requestJson(baseUrl, "/api/survivor/profile", {
        method: "PATCH",
        body: JSON.stringify({
          profileSource: "survivor_profile_settings",
          preferredName: originalValues.preferredName || null,
          recoveryGoals: originalValues.recoveryGoals,
          assessmentNotes: originalValues.assessmentNotes,
          dailyTimeBudgetMinutes: originalValues.dailyTimeBudgetMinutes,
          energyPattern: originalValues.energyPattern,
        }),
      }, cookie);
      assertSuccessful("PATCH /api/survivor/profile restore", restore);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});