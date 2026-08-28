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
  let finalizeAttempts = 0;
  let putAttempts = 0;
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
        const isFirstPut = putAttempts === 0;
        putAttempts += 1;
        await request.respond({
          status: isFirstPut ? failure.putStatus ?? 200 : 200,
          contentType: "text/plain",
          body: "",
        });
      } else if (
        request.method() === "POST" &&
        url.pathname === "/api/recovery/journal/photo/finalize"
      ) {
        const isFirstFinalize = finalizeAttempts === 0;
        finalizeAttempts += 1;
        await jsonResponse(
          request,
          isFirstFinalize ? failure.finalizeStatus : 200,
          isFirstFinalize ? failure.finalizeBody : {
            photoUrl: "/objects/uploads/browser-test-photo",
          },
        );
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

async function selectPhoto(
  page: Page,
  filePath: string,
  fileName: string,
  contentType: string,
): Promise<void> {
  const bytes = Array.from(await readFile(filePath));
  await page.evaluate(({ fileBytes, fileName, contentType }) => {
    const input = document.querySelector('[data-testid="input-photo-file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error("the journal photo input should be present");
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(fileBytes)], fileName, { type: contentType }));
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, { fileBytes: bytes, fileName, contentType });
}

async function uploadMismatchedPhoto(page: Page, filePath: string): Promise<string> {
  await selectPhoto(page, filePath, "selected-as-png.png", "image/png");
  await page.waitForFunction(
    () => document.body.innerText.includes("Couldn't add that photo"),
    { timeout: 5000 },
  );
  return page.evaluate(() => document.body.innerText);
}

async function withPhotoRetryAfterTypeWarning(): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: findBrowserExecutable(),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const tempDir = await mkdtemp(path.join(tmpdir(), "recovery-journal-browser-"));
  const mismatchedPhoto = path.join(tempDir, "selected-as-png.png");
  const validPhoto = path.join(tempDir, "valid-photo.png");

  try {
    // The first upload has a PDF signature despite being declared as PNG.
    await writeFile(mismatchedPhoto, Buffer.from("%PDF-1.7\n", "ascii"));
    // A real 1x1 PNG keeps this test independent of an object-storage fixture.
    await writeFile(
      validPhoto,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    );
    await mockJournalApi(page, {
      finalizeStatus: 415,
      finalizeBody: {
        message: "Uploaded file contents do not match the declared type.",
      },
    });
    await openPhotoComposer(page);

    const warningText = await uploadMismatchedPhoto(page, mismatchedPhoto);
    assert.match(warningText, /Couldn't add that photo/);
    assert.match(warningText, /Choose a different photo and try again\./);

    await selectPhoto(page, validPhoto, "valid-photo.png", "image/png");
    await page.waitForFunction(
      () => document.body.innerText.includes("Photo added."),
      { timeout: 5000 },
    );

    const preview = await page.$eval('[data-testid="img-photo-preview"]', (element) => {
      const bounds = element.getBoundingClientRect();
      return {
        src: (element as HTMLImageElement).src,
        width: bounds.width,
        height: bounds.height,
      };
    });
    assert.match(preview.src, /^blob:/);
    assert.ok(preview.width > 0);
    assert.ok(preview.height > 0);
  } finally {
    await browser.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function withPhotoRetryAfterPutFailure(): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: findBrowserExecutable(),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const tempDir = await mkdtemp(path.join(tmpdir(), "recovery-journal-browser-"));
  const interruptedPhoto = path.join(tempDir, "interrupted-photo.png");
  const replacementPhoto = path.join(tempDir, "replacement-photo.png");

  try {
    const validPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );
    await writeFile(interruptedPhoto, validPng);
    await writeFile(replacementPhoto, validPng);
    await mockJournalApi(page, {
      putStatus: 503,
      finalizeStatus: 200,
      finalizeBody: { message: "unused" },
    });
    await openPhotoComposer(page);

    await selectPhoto(page, interruptedPhoto, "interrupted-photo.png", "image/png");
    await page.waitForFunction(
      () => document.body.innerText.includes("Couldn't add that photo"),
      { timeout: 5000 },
    );
    assert.match(await page.evaluate(() => document.body.innerText), /Try again\./);

    await selectPhoto(page, replacementPhoto, "replacement-photo.png", "image/png");
    await page.waitForFunction(
      () => document.body.innerText.includes("Photo added."),
      { timeout: 5000 },
    );

    const preview = await page.$eval('[data-testid="img-photo-preview"]', (element) => {
      const bounds = element.getBoundingClientRect();
      return {
        src: (element as HTMLImageElement).src,
        width: bounds.width,
        height: bounds.height,
      };
    });
    assert.match(preview.src, /^blob:/);
    assert.ok(preview.width > 0);
    assert.ok(preview.height > 0);
  } finally {
    await browser.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function withPhotoPreviewCleanup(): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: findBrowserExecutable(),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const tempDir = await mkdtemp(path.join(tmpdir(), "recovery-journal-browser-"));
  const firstPhoto = path.join(tempDir, "first-photo.png");
  const replacementPhoto = path.join(tempDir, "replacement-photo.png");
  const finalPhoto = path.join(tempDir, "final-photo.png");
  const revokedUrlsKey = "__test_recovery_journal_revoked_urls";

  try {
    const validPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );
    await writeFile(firstPhoto, validPng);
    await writeFile(replacementPhoto, validPng);
    await writeFile(finalPhoto, validPng);

    await page.evaluateOnNewDocument((storageKey) => {
      const originalRevokeObjectURL = URL.revokeObjectURL.bind(URL);
      URL.revokeObjectURL = (url: string) => {
        const revokedUrls = JSON.parse(localStorage.getItem(storageKey) || "[]") as string[];
        localStorage.setItem(storageKey, JSON.stringify([...revokedUrls, url]));
        originalRevokeObjectURL(url);
      };
    }, revokedUrlsKey);
    await mockJournalApi(page, {
      finalizeStatus: 200,
      finalizeBody: { message: "unused" },
    });
    await openPhotoComposer(page);

    await selectPhoto(page, firstPhoto, "first-photo.png", "image/png");
    await page.waitForFunction(
      () => document.querySelector<HTMLImageElement>('[data-testid="img-photo-preview"]')?.src.startsWith("blob:"),
      { timeout: 5000 },
    );
    await page.waitForFunction(
      () => document.body.innerText.includes("Photo added."),
      { timeout: 5000 },
    );
    const firstPreview = await page.$eval(
      '[data-testid="img-photo-preview"]',
      (element) => (element as HTMLImageElement).src,
    );
    assert.deepEqual(
      await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) || "[]"), revokedUrlsKey),
      [],
    );

    await selectPhoto(page, replacementPhoto, "replacement-photo.png", "image/png");
    await page.waitForFunction(
      ({ previousPreview, storageKey }) => {
        const preview = document.querySelector<HTMLImageElement>('[data-testid="img-photo-preview"]');
        const revokedUrls = JSON.parse(localStorage.getItem(storageKey) || "[]") as string[];
        return Boolean(preview?.src.startsWith("blob:")) &&
          preview?.src !== previousPreview &&
          revokedUrls.includes(previousPreview);
      },
      { timeout: 5000 },
      { previousPreview: firstPreview, storageKey: revokedUrlsKey },
    );
    await page.waitForFunction(
      () => document.body.innerText.includes("Photo added."),
      { timeout: 5000 },
    );
    const replacementPreview = await page.$eval(
      '[data-testid="img-photo-preview"]',
      (element) => (element as HTMLImageElement).src,
    );
    const revokedAfterReplacement = await page.evaluate(
      (storageKey) => JSON.parse(localStorage.getItem(storageKey) || "[]") as string[],
      revokedUrlsKey,
    );
    assert.deepEqual(revokedAfterReplacement, [firstPreview]);
    assert.notEqual(replacementPreview, firstPreview);

    await page.waitForSelector('[data-testid="button-remove-photo"]', { timeout: 5000 });
    await page.$eval(
      '[data-testid="button-remove-photo"]',
      (element) => (element as HTMLButtonElement).click(),
    );
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="img-photo-preview"]'),
      { timeout: 5000 },
    );
    await page.waitForFunction(
      ({ preview, storageKey }) => {
        const revokedUrls = JSON.parse(localStorage.getItem(storageKey) || "[]") as string[];
        return revokedUrls.includes(preview);
      },
      { timeout: 5000 },
      { preview: replacementPreview, storageKey: revokedUrlsKey },
    );
    assert.deepEqual(
      await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) || "[]"), revokedUrlsKey),
      [firstPreview, replacementPreview],
    );

    await selectPhoto(page, finalPhoto, "final-photo.png", "image/png");
    await page.waitForFunction(
      () => document.querySelector<HTMLImageElement>('[data-testid="img-photo-preview"]')?.src.startsWith("blob:"),
      { timeout: 5000 },
    );
    await page.waitForFunction(
      () => document.body.innerText.includes("Photo added."),
      { timeout: 5000 },
    );
    const finalPreview = await page.$eval(
      '[data-testid="img-photo-preview"]',
      (element) => (element as HTMLImageElement).src,
    );
    await page.$eval(
      '[data-testid="link-recovery-home"]',
      (element) => (element as HTMLAnchorElement).click(),
    );
    await page.waitForFunction(
      () => window.location.pathname === "/recovery/today",
      { timeout: 5000 },
    );
    await page.waitForFunction(
      ({ preview, storageKey }) => {
        const revokedUrls = JSON.parse(localStorage.getItem(storageKey) || "[]") as string[];
        return revokedUrls.includes(preview);
      },
      { timeout: 5000 },
      { preview: finalPreview, storageKey: revokedUrlsKey },
    );
    assert.deepEqual(
      await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) || "[]"), revokedUrlsKey),
      [firstPreview, replacementPreview, finalPreview],
    );
  } finally {
    await browser.close();
    await rm(tempDir, { recursive: true, force: true });
  }
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

test("a survivor can choose a valid photo after a type warning", async () => {
  await withPhotoRetryAfterTypeWarning();
});

test("a survivor can retry after an interrupted photo upload", async () => {
  await withPhotoRetryAfterPutFailure();
});

test("replacing, clearing, and leaving the journal photo preview releases its object URL", async () => {
  await withPhotoPreviewCleanup();
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