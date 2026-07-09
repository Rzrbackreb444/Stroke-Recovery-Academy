// HubSpot CRM integration — contact sync + behavioral event tracking.
// Uses the Replit HubSpot connector; gracefully no-ops if the connector
// is not configured (dev / self-hosted environments).

let _hubspotToken: string | null | undefined = undefined; // undefined = not yet fetched

async function getHubSpotToken(): Promise<string | null> {
  if (_hubspotToken !== undefined) return _hubspotToken;
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
      ? "repl " + process.env.REPL_IDENTITY
      : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;
    if (!hostname || !xReplitToken) { _hubspotToken = null; return null; }

    const data = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=hubspot`,
      { headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken } },
    ).then((r) => r.json());

    const conn = data?.items?.[0];
    const token =
      conn?.settings?.access_token ||
      conn?.settings?.oauth?.credentials?.access_token ||
      null;
    _hubspotToken = token;
    return token;
  } catch {
    _hubspotToken = null;
    return null;
  }
}

export function isHubSpotConfigured(): boolean {
  return !!(process.env.REPLIT_CONNECTORS_HOSTNAME && (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL));
}

async function hubspotFetch(path: string, method: string, body?: object): Promise<any> {
  const token = await getHubSpotToken();
  if (!token) return null;
  const res = await fetch(`https://api.hubapi.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn(`[hubspot] ${method} ${path} → ${res.status}`, text.slice(0, 200));
    return null;
  }
  return res.json().catch(() => null);
}

// ── Contact upsert ────────────────────────────────────────────────────────────
// Creates or updates a HubSpot contact by email. Properties are merged so
// repeated calls are idempotent. Returns the HubSpot contact id or null.
export async function upsertHubSpotContact(params: {
  email: string;
  firstName?: string;
  lastName?: string;
  strokeDate?: string;       // ISO date — user's stroke date
  signupDate?: string;       // ISO date — platform join date
  currentStreak?: number;
  totalActiveDays?: number;
  lifecycleStage?: "subscriber" | "lead" | "customer";
}): Promise<string | null> {
  const { email, firstName, lastName, strokeDate, signupDate, currentStreak, totalActiveDays, lifecycleStage } = params;
  const properties: Record<string, string> = {};
  if (firstName)        properties.firstname           = firstName;
  if (lastName)         properties.lastname            = lastName;
  if (strokeDate)       properties.stroke_date         = strokeDate;
  if (signupDate)       properties.sra_signup_date     = signupDate;
  if (currentStreak != null) properties.sra_current_streak = String(currentStreak);
  if (totalActiveDays != null) properties.sra_total_active_days = String(totalActiveDays);
  if (lifecycleStage)   properties.lifecyclestage      = lifecycleStage;

  const result = await hubspotFetch("/crm/v3/contacts/batch/upsert", "POST", {
    inputs: [{ idProperty: "email", id: email, properties }],
  });
  return result?.results?.[0]?.id ?? null;
}

// ── Behavioral event tracking ─────────────────────────────────────────────────
// Records a custom behavioral event in HubSpot against a contact email.
// eventName must be a fully-qualified event name registered in your HubSpot
// portal (e.g. "pe12345_sra_streak_milestone").
export async function trackHubSpotEvent(params: {
  email: string;
  eventName: string;
  properties?: Record<string, string | number>;
}): Promise<void> {
  const { email, eventName, properties } = params;
  await hubspotFetch("/events/v3/send", "POST", {
    eventName,
    email,
    properties: properties ?? {},
  });
}

// ── Behavioral trigger: quiet survivor ────────────────────────────────────────
// Finds users who haven't checked in for ≥ 3 days and updates their
// HubSpot lifecycle stage + logs a quiet_survivor event.
export async function syncQuietSurvivorSignals(users: Array<{
  email: string;
  daysSinceLastCheckin: number;
  streak: number;
  totalActiveDays: number;
}>): Promise<void> {
  for (const u of users) {
    try {
      await upsertHubSpotContact({
        email: u.email,
        currentStreak: u.streak,
        totalActiveDays: u.totalActiveDays,
        lifecycleStage: "subscriber",
      });
      await trackHubSpotEvent({
        email: u.email,
        eventName: "pe_sra_quiet_survivor",
        properties: { days_since_last_checkin: u.daysSinceLastCheckin },
      });
    } catch (err) {
      console.warn("[hubspot] syncQuietSurvivorSignals:", (err as Error).message);
    }
  }
}

// ── Behavioral trigger: streak milestone ─────────────────────────────────────
// Called when a survivor hits a milestone streak (30, 60, 90, 180, 365 days).
export async function syncStreakMilestone(params: {
  email: string;
  streakDays: number;
  totalActiveDays: number;
}): Promise<void> {
  try {
    await upsertHubSpotContact({
      email: params.email,
      currentStreak: params.streakDays,
      totalActiveDays: params.totalActiveDays,
      lifecycleStage: "customer",
    });
    await trackHubSpotEvent({
      email: params.email,
      eventName: "pe_sra_streak_milestone",
      properties: { streak_days: params.streakDays },
    });
  } catch (err) {
    console.warn("[hubspot] syncStreakMilestone:", (err as Error).message);
  }
}

// ── Behavioral trigger: onboarding abandoned ─────────────────────────────────
// Called when a user signed up but never completed the survivor intake.
export async function syncOnboardingAbandoned(params: {
  email: string;
  signupDate: string;
  hoursSinceSignup: number;
}): Promise<void> {
  try {
    await upsertHubSpotContact({
      email: params.email,
      signupDate: params.signupDate,
      lifecycleStage: "lead",
    });
    await trackHubSpotEvent({
      email: params.email,
      eventName: "pe_sra_onboarding_abandoned",
      properties: { hours_since_signup: params.hoursSinceSignup },
    });
  } catch (err) {
    console.warn("[hubspot] syncOnboardingAbandoned:", (err as Error).message);
  }
}
