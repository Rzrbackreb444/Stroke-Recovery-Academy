import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import puppeteer, { type Page } from "puppeteer";

const baseUrl = process.env.RECOVERY_JOURNAL_BROWSER_URL ?? "http://127.0.0.1:5000";
const testUploadUrl = `${baseUrl}/__test-journal-photo-upload`;
const survivor = {
  id: "browser-test-survivor",
  email: "survivor@example.test",
  firstName: "Test",
  lastName: "Survivor",
};

function findBrowserExecutable(): string {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  return execFileSync("sh", ["-c", "command -v chromium || command -v chromium-browser || command -v google-chrome"], {
    encoding: "utf8",
  }).trim();
}

type UploadFailure = {
  finalizeStatus: number;
  finalizeBody: { message: string };
  putStatus?: number;
};

async function jsonResponse(
  request: puppeteer.HTTPRequest,
  status: number,
  body: unknown,
): Promise<void> {
  await request.respond({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockJournalApi(page: Page, failure: UploadFailure): Promise<void> {
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    if (request.isInterceptResolutionHandled()) return;

    const url = new URL(request.url());
    try {
      if (request.method() === "GET" && url.pathname === "/api/auth/user") {
        await jsonResponse(request, 200, survivor);
      } else if (
        request.method() === "GET" &&
        [
          "/api/recovery/journal",
          "/api/recovery/journal/insights",
          "/api/recovery/journal/impact",
          "/api/recovery/journal/community",
        ].includes(url.pathname)
      ) {
        await jsonResponse(request, 200, url.pathname.endsWith("/impact") ? {
          userEarningsCents: 0,
          globalGivebackCents: 0,
          accountsFunded: 0,
        } : []);
      } else if (
        request.method() === "POST" &&
        url.pathname === "/api/recovery/journal/photo/upload-url"
      ) {
        await jsonResponse(request, 200, {
          uploadURL: testUploadUrl,
          objectPath: "/objects/uploads/browser-test-photo",
        });
      } else if (request.method() === "PUT" && url.pathname === new URL(testUploadUrl).pathname) {
        await request.respond({
          status: failure.putStatus ?? 200,
          contentType: "text/plain",
          body: "",
        });
      } else if (
        request.method() === "POST" &&
        url.pathname === "/api/recovery/journal/photo/finalize"
      ) {
        await jsonResponse(request, failure.finalizeStatus, failure.finalizeBody);
      } else {
        await request.continue();
      }
    } catch {
      if (!request.isInterceptResolutionHandled()) await request.abort();
    }
  });
}

async function openPhotoComposer(page: Page): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("sra:onboarding-complete", "true");
  });
  await page.goto(`${baseUrl}/recovery/journal`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="button-toggle-reflection-formats"]');
  await page.click('[data-testid="button-toggle-reflection-formats"]');
  await page.click('[data-testid="button-mode-photo"]');
}

async function uploadMismatchedPhoto(page: Page, filePath: string): Promise<string> {
  const bytes = Array.from(await readFile(filePath));
  await page.evaluate((fileBytes) => {
    const input = document.querySelector('[data-testid="input-photo-file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error("the journal photo input should be present");
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(fileBytes)], "selected-as-png.png", { type: "image/png" }));
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, bytes);
  await page.waitForFunction(
    () => document.body.innerText.includes("Couldn't add that photo"),
    { timeout: 5000 },
  );
  return page.evaluate(() => document.body.innerText);
}

async function withPhotoFailure(
  failure: UploadFailure,
  assertion: (toastText: string) => void,
): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: findBrowserExecutable(),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const tempDir = await mkdtemp(path.join(tmpdir(), "recovery-journal-browser-"));
  const mismatchedPhoto = path.join(tempDir, "selected-as-png.png");

  try {
    // A PDF signature in a .png upload exercises the selected image type
    // without requiring a real image or object-storage fixture.
    await writeFile(mismatchedPhoto, Buffer.from("%PDF-1.7\n", "ascii"));
    await mockJournalApi(page, failure);
    await openPhotoComposer(page);
    assertion(await uploadMismatchedPhoto(page, mismatchedPhoto));
  } finally {
    await browser.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("a mismatched journal photo shows the specific explanation and retry guidance", async () => {
  await withPhotoFailure(
    {
      finalizeStatus: 415,
      finalizeBody: {
        message: "Uploaded file contents do not match the declared type.",
      },
    },
    (toastText) => {
      assert.match(toastText, /Couldn't add that photo/);
      assert.match(toastText, /Uploaded file contents do not match the declared type\./);
      assert.match(toastText, /Choose a different photo and try again\./);
    },
  );
});

test("an ordinary journal photo failure keeps the generic retry message", async () => {
  await withPhotoFailure(
    {
      finalizeStatus: 500,
      finalizeBody: { message: "Couldn't save that photo — try again." },
    },
    (toastText) => {
      assert.match(toastText, /Couldn't add that photo/);
      assert.match(toastText, /Try again\./);
      assert.doesNotMatch(toastText, /Choose a different photo/);
    },
  );
});