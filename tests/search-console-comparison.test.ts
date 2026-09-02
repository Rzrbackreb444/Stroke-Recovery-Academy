import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  PRIORITY_URLS,
  SearchConsoleValidationError,
  compareSearchConsoleExport,
} from "../scripts/searchConsoleComparison";

const BASELINE = "exports/search-console-baseline-2026-08-31.csv";

function createExport(options: { omitUrl?: string; searchType?: string; days?: number } = {}): string {
  const directory = mkdtempSync(join(tmpdir(), "search-console-export-"));
  const days = options.days ?? 7;
  const searchType = options.searchType ?? "Web";
  const filters = `Filter,Value\nSearch type,${searchType}\nTime range,Last 7 days\n`;
  const chart = [
    "Date,Clicks,Impressions,CTR,Position",
    ...Array.from({ length: days }, (_, index) => {
      const day = String(1 + index).padStart(2, "0");
      return `2026-08-${day},0,10,0%,8`;
    }),
  ].join("\n") + "\n";
  const pages = [
    "Top pages,Clicks,Impressions,CTR,Position",
    ...PRIORITY_URLS.filter(url => url !== options.omitUrl).map((url, index) => {
      const isMassageGun = index === 1;
      return `${url},${isMassageGun ? 1 : 0},${isMassageGun ? 26 : 10},${isMassageGun ? "3.85%" : "0%"},${isMassageGun ? 4.5 : 8}`;
    }),
    "https://strokerecoveryacademy.com/blog/not-a-priority-page,0,3,0%,20",
  ].join("\n") + "\n";
  writeFileSync(join(directory, "Filters.csv"), filters);
  writeFileSync(join(directory, "Chart.csv"), chart);
  writeFileSync(join(directory, "Pages.csv"), pages);
  return directory;
}

test("compares all 11 exact URLs and computes CTR and weighted position deltas", () => {
  const exportPath = createExport();
  try {
    const comparison = compareSearchConsoleExport(exportPath, BASELINE);
    const massageGun = comparison.rows.find(
      row => row.url.endsWith("/best-massage-gun-stroke-spasticity"),
    );

    assert.equal(comparison.dayCount, 7);
    assert.deepEqual(comparison.recordedDays, [
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
      "2026-08-06",
      "2026-08-07",
    ]);
    assert.equal(comparison.rows.length, 11);
    assert.ok(massageGun);
    assert.equal(massageGun.observed.clicks, 1);
    assert.equal(massageGun.observed.impressions, 26);
    assert.equal(massageGun.observed.ctr, 1 / 26);
    assert.equal(massageGun.delta.position, -1.12);
    assert.equal(comparison.summary.observed.clicks, 1);
    assert.equal(comparison.summary.observed.impressions, 126);
    assert.equal(comparison.summary.observed.ctr, 1 / 126);
    assert.equal(comparison.summary.delta.position, comparison.summary.observed.position - comparison.summary.baseline.position);
  } finally {
    rmSync(exportPath, { recursive: true, force: true });
  }
});


test("rejects the supplied one-day archive instead of treating it as a qualifying follow-up", () => {
  assert.throws(
    () =>
      compareSearchConsoleExport(
        "attached_assets/https___strokerecoveryacademy.com_-Performance-on-Search-2026-_1788198386149.zip",
        BASELINE,
      ),
    (error: unknown) => {
      assert.ok(error instanceof SearchConsoleValidationError);
      assert.match(error.message, /at least 7 recorded days; found 2/);
      assert.doesNotMatch(error.message, /Search type must be Web/);
      return true;
    },
  );
});

test("reports every missing required URL, including an exact substituted URL", () => {
  const missingUrl = PRIORITY_URLS[10];
  const exportPath = createExport({ omitUrl: missingUrl });
  try {
    assert.throws(
      () => compareSearchConsoleExport(exportPath, BASELINE),
      (error: unknown) => {
        assert.ok(error instanceof SearchConsoleValidationError);
        assert.match(error.message, /missing 1 required priority URL/);
        assert.match(error.message, new RegExp(missingUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        return true;
      },
    );
  } finally {
    rmSync(exportPath, { recursive: true, force: true });
  }
});

test("reports non-Web search and insufficient recorded days as validation failures", () => {
  const exportPath = createExport({ searchType: "Image", days: 6 });
  try {
    assert.throws(
      () => compareSearchConsoleExport(exportPath, BASELINE),
      (error: unknown) => {
        assert.ok(error instanceof SearchConsoleValidationError);
        assert.match(error.message, /Search type must be Web; received "Image"/);
        assert.match(error.message, /at least 7 recorded days; found 6/);
        return true;
      },
    );
  } finally {
    rmSync(exportPath, { recursive: true, force: true });
  }
});