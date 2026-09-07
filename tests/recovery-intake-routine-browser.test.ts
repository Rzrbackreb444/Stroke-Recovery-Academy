import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import puppeteer, { type HTTPRequest, type Page } from "puppeteer";

const baseUrl = process.env.RECOVERY_INTAKE_ROUTINE_BROWSER_URL ?? "http://127.0.0.1:5000";
const survivor = {
  id: "browser-test-survivor",
  email: "survivor@example.test",
  firstName: "Test",
  lastName: "Survivor",
};

function findBrowserExecutable(): string {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  return execFileSync(
    "sh",
    ["-c", "command -v chromium || command -v chromium-browser || command -v google-chrome"],
    { encoding: "utf8" },
  ).trim();
}

async function respondJson(request: HTTPRequest, status: number, body: unknown): Promise<void> {
  await request.respond({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function intakeProfile() {
  return {
    id: 1,
    userId: survivor.id,
    preferredName: null,
    pronouns: null,
    strokeDate: null,
    strokeType: null,
    affectedSide: null,
    deficits: null,
    recoveryGoals: [],
    currentChallenges: [],
    customGoal: null,
    goalDetails: null,
    assessmentScores: null,
    assessmentNotes: null,
    equipment: [],
    mobilityAids: [],
    dailyTimeBudgetMinutes: null,
    energyPattern: null,
    hasCaregiver: null,
    caregiverEmail: null,
    caregiverRelationship: null,
    bigButtonMode: false,
    dyslexiaFont: false,
    reducedMotion: false,
    voicePrefersTts: false,
    bio: null,
    story: null,
    location: null,
    timeZone: null,
    intakeCompletedAt: null,
    currentIntakeStep: 1,
    updatedAt: new Date().toISOString(),
    intakeComplete: false,
    profileProvenance: {},
  };
}

async function mockIntakeApi(page: Page) {
  const patchBodies: Record<string, unknown>[] = [];
  let patchAttempts = 0;
  const profile = intakeProfile();

  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    if (request.isInterceptResolutionHandled()) return;
    const url = new URL(request.url());
    try {
      if (request.method() === "GET" && url.pathname === "/api/auth/user") {
        await respondJson(request, 200, survivor);
      } else if (request.method() === "GET" && url.pathname === "/api/survivor/profile") {
        await respondJson(request, 200, { profile });
      } else if (request.method() === "PATCH" && url.pathname === "/api/survivor/profile") {
        const body = JSON.parse(request.postData() ?? "{}") as Record<string, unknown>;
        patchBodies.push(body);
        patchAttempts += 1;
        if (patchAttempts === 1) {
          await respondJson(request, 503, { message: "The recovery profile service is temporarily unavailable." });
        } else {
          Object.assign(profile, body);
          await respondJson(request, 200, { profile });
        }
      } else {
        await request.continue();
      }
    } catch {
      if (!request.isInterceptResolutionHandled()) await request.abort();
    }
  });

  return patchBodies;
}

async function mockRoutineApi(page: Page) {
  const putBodies: Record<string, unknown>[] = [];
  let putAttempts = 0;
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    if (request.isInterceptResolutionHandled()) return;
    const url = new URL(request.url());
    try {
      if (request.method() === "GET" && url.pathname === "/api/auth/user") {
        await respondJson(request, 200, survivor);
      } else if (request.method() === "GET" && url.pathname === "/api/recovery/routine/today") {
        await respondJson(request, 200, {
          level: 2,
          completedTasks: [],
          notes: "",
          streak: 0,
        });
      } else if (request.method() === "PUT" && url.pathname === "/api/recovery/routine/today") {
        const body = JSON.parse(request.postData() ?? "{}") as Record<string, unknown>;
        putBodies.push(body);
        putAttempts += 1;
        if (putAttempts === 1) {
          await respondJson(request, 503, { message: "Routine storage is temporarily unavailable." });
        } else {
          await respondJson(request, 200, { ok: true });
        }
      } else {
        await request.continue();
      }
    } catch {
      if (!request.isInterceptResolutionHandled()) await request.abort();
    }
  });

  return putBodies;
}

async function launchPage(): Promise<{ browser: puppeteer.Browser; page: Page }> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: findBrowserExecutable(),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  return { browser, page };
}

test("intake makes a failed autosave visible, blocks leaving, and retries the newest answer", async () => {
  const { browser, page } = await launchPage();
  const patchBodies = await mockIntakeApi(page);

  try {
    await page.goto(`${baseUrl}/recovery/intake?browserTest=1`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="input-preferred-name"]');
    await page.type('[data-testid="input-preferred-name"]', "First answer");
    await page.waitForSelector('[data-testid="intake-save-error"]', { timeout: 5000 });

    const errorIsAccessible = await page.$eval(
      '[data-testid="intake-save-error"]',
      (element) => element.getAttribute("role") === "alert" && (element.textContent ?? "").includes("not saved"),
    );
    assert.equal(errorIsAccessible, true);

    await page.click('[data-testid="link-skip-intake"]');
    await page.waitForSelector('[data-testid="intake-navigation-warning"]');
    assert.equal(new URL(page.url()).pathname, "/recovery/intake");

    await page.click('[data-testid="input-preferred-name"]');
    await page.keyboard.down("Control");
    await page.keyboard.press("A");
    await page.keyboard.up("Control");
    await page.type('[data-testid="input-preferred-name"]', "Newest answer");
    await page.click('[data-testid="button-retry-intake-save"]');
    await page.waitForFunction(
      () => document.querySelector('[role="status"]')?.textContent?.includes("Saved") === true,
      { timeout: 5000 },
    );

    assert.equal(patchBodies.length, 2, "retry should replace the failed save, not create another delayed save");
    assert.equal(patchBodies[1]?.preferredName, "Newest answer");
    assert.equal(await page.$('[data-testid="intake-save-error"]'), null);
  } finally {
    await browser.close();
  }
});

test("routine makes a failed autosave accessible, protects navigation, and retries without losing newer notes", async () => {
  const { browser, page } = await launchPage();
  const putBodies = await mockRoutineApi(page);

  try {
    await page.goto(`${baseUrl}/recovery/routine?browserTest=1`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.body.innerText.length > 0, { timeout: 5000 });
    await page.waitForSelector('[data-testid^="task-"]');
    await page.click('[data-testid^="task-"]');
    await page.waitForSelector('[data-testid="routine-save-error"]', { timeout: 5000 });

    const errorIsAccessible = await page.$eval(
      '[data-testid="routine-save-error"]',
      (element) => element.getAttribute("role") === "alert" && (element.textContent ?? "").includes("not saved"),
    );
    assert.equal(errorIsAccessible, true);

    await page.click('[data-testid="input-routine-notes"]');
    await page.type('[data-testid="input-routine-notes"]', "Newest routine note");
    await page.click('[data-testid="link-exercises"]');
    await page.waitForSelector('[data-testid="routine-navigation-warning"]');
    assert.equal(new URL(page.url()).pathname, "/recovery/routine");

    await page.click('[data-testid="button-retry-routine-save"]');
    await page.waitForFunction(
      () => document.body.innerText.includes("Saved"),
      { timeout: 5000 },
    );

    assert.equal(putBodies.length, 2, "retry should not be followed by the original debounce timer");
    assert.equal(putBodies[1]?.notes, "Newest routine note");
    assert.equal(await page.$('[data-testid="routine-save-error"]'), null);
  } finally {
    await browser.close();
  }
});