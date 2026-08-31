import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SEARCH_CONSOLE_PROPERTY = "https://strokerecoveryacademy.com";

export const PRIORITY_URLS = [
  `${SEARCH_CONSOLE_PROPERTY}/blog/best-ankle-brace-stroke-survivor`,
  `${SEARCH_CONSOLE_PROPERTY}/blog/best-massage-gun-stroke-spasticity`,
  `${SEARCH_CONSOLE_PROPERTY}/blog/best-stationary-bike-stroke-recovery`,
  `${SEARCH_CONSOLE_PROPERTY}/blog/best-shoes-stroke-survivors`,
  `${SEARCH_CONSOLE_PROPERTY}/blog/best-walker-stroke-survivor`,
  `${SEARCH_CONSOLE_PROPERTY}/blog/hot-tub-hydrotherapy-stroke-recovery`,
  `${SEARCH_CONSOLE_PROPERTY}/blog/best-adjustable-bed-wedge-pillow-stroke-recovery`,
  `${SEARCH_CONSOLE_PROPERTY}/blog/adaptive-eating-utensils-stroke`,
  `${SEARCH_CONSOLE_PROPERTY}/blog/best-resistance-bands-stroke-recovery`,
  `${SEARCH_CONSOLE_PROPERTY}/blog/best-hand-therapy-tools-stroke-recovery`,
  `${SEARCH_CONSOLE_PROPERTY}/blog/best-exercise-bike-stroke-patient`,
] as const;

type CsvRow = Record<string, string>;

export interface SearchConsoleMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface ComparisonRow {
  url: string;
  baseline: SearchConsoleMetrics;
  observed: SearchConsoleMetrics;
  delta: SearchConsoleMetrics;
}

export interface ComparisonSummary {
  baseline: SearchConsoleMetrics;
  observed: SearchConsoleMetrics;
  delta: SearchConsoleMetrics;
}

export interface SearchConsoleComparison {
  property: string;
  searchType: string;
  recordedDays: string[];
  dayCount: number;
  baselineSource: string;
  observedSource: string;
  rows: ComparisonRow[];
  summary: ComparisonSummary;
}

export class SearchConsoleValidationError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    super(`Search Console export validation failed:\n${problems.map(problem => `- ${problem}`).join("\n")}`);
    this.name = "SearchConsoleValidationError";
    this.problems = problems;
  }
}

function parseCsv(text: string, source: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some(value => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) {
    throw new SearchConsoleValidationError([`${source} contains an unterminated quoted field`]);
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    if (row.some(value => value.trim() !== "")) rows.push(row);
  }
  if (rows.length === 0) {
    throw new SearchConsoleValidationError([`${source} is empty`]);
  }

  const headers = rows[0].map((header, index) => {
    const cleaned = header.replace(/^\uFEFF/, "").trim();
    return cleaned || `column_${index + 1}`;
  });
  const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicates.length > 0) {
    throw new SearchConsoleValidationError([
      `${source} has duplicate column headers: ${[...new Set(duplicates)].join(", ")}`,
    ]);
  }

  return rows.slice(1).map((values, rowIndex) => {
    if (values.length > headers.length) {
      throw new SearchConsoleValidationError([
        `${source} row ${rowIndex + 2} has more fields than its header`,
      ]);
    }
    return Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()]));
  });
}

function findColumn(row: CsvRow, names: string[]): string | undefined {
  const wanted = new Set(names.map(name => name.toLowerCase()));
  const key = Object.keys(row).find(candidate => wanted.has(candidate.toLowerCase()));
  return key ? row[key] : undefined;
}

function requiredColumn(row: CsvRow, names: string[], source: string): string {
  const value = findColumn(row, names);
  if (value === undefined) {
    throw new SearchConsoleValidationError([
      `${source} is missing a required column: ${names[0]}`,
    ]);
  }
  return value;
}

function parseNonNegativeInteger(value: string, label: string): number {
  if (!/^\d+$/.test(value)) {
    throw new SearchConsoleValidationError([`${label} must be a non-negative integer; received "${value}"`]);
  }
  return Number(value);
}

function parseNumber(value: string, label: string, allowBlank = false): number {
  if (allowBlank && value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new SearchConsoleValidationError([`${label} must be a non-negative number; received "${value}"`]);
  }
  return parsed;
}

function parsePageMetrics(row: CsvRow, source: string, rowNumber: number): SearchConsoleMetrics {
  const url = requiredColumn(row, ["Top pages", "URL"], source);
  const clicks = parseNonNegativeInteger(
    requiredColumn(row, ["Clicks"], source),
    `${source} row ${rowNumber} clicks`,
  );
  const impressions = parseNonNegativeInteger(
    requiredColumn(row, ["Impressions"], source),
    `${source} row ${rowNumber} impressions`,
  );
  const position = parseNumber(
    requiredColumn(row, ["Position"], source),
    `${source} row ${rowNumber} position`,
    impressions === 0,
  );

  return {
    clicks,
    impressions,
    ctr: impressions === 0 ? 0 : clicks / impressions,
    position,
  };
}

function parsePages(text: string, source: string): Map<string, SearchConsoleMetrics> {
  const rows = parseCsv(text, source);
  const pages = new Map<string, SearchConsoleMetrics>();
  const duplicateUrls: string[] = [];

  rows.forEach((row, index) => {
    const url = requiredColumn(row, ["Top pages", "URL"], source);
    if (pages.has(url)) duplicateUrls.push(url);
    pages.set(url, parsePageMetrics(row, source, index + 2));
  });

  if (duplicateUrls.length > 0) {
    throw new SearchConsoleValidationError([
      `${source} contains duplicate URL rows: ${[...new Set(duplicateUrls)].join(", ")}`,
    ]);
  }
  return pages;
}

function assertPriorityUrls(pages: Map<string, SearchConsoleMetrics>, source: string): void {
  const missing = PRIORITY_URLS.filter(url => !pages.has(url));
  if (missing.length > 0) {
    throw new SearchConsoleValidationError([
      `${source} is missing ${missing.length} required priority URL(s):\n  ${missing.join("\n  ")}`,
    ]);
  }
}

function parseFilterValues(text: string, source: string): Map<string, string> {
  const rows = parseCsv(text, source);
  const filters = new Map<string, string>();
  rows.forEach((row, index) => {
    const filter = findColumn(row, ["Filter"]);
    const value = findColumn(row, ["Value"]);
    if (filter === undefined || value === undefined) {
      throw new SearchConsoleValidationError([
        `${source} row ${index + 2} must contain Filter and Value columns`,
      ]);
    }
    filters.set(filter.toLowerCase(), value);
  });
  return filters;
}

function parseRecordedDays(text: string, source: string): string[] {
  const rows = parseCsv(text, source);
  const firstRow = rows[0];
  const dateColumn = Object.keys(firstRow).find(key => /^(date|time\b)/i.test(key));
  if (!dateColumn) {
    throw new SearchConsoleValidationError([
      `${source} is missing a Date or Time column needed to validate recorded days`,
    ]);
  }

  const days = new Set<string>();
  rows.forEach((row, index) => {
    const timestamp = row[dateColumn].trim();
    const match = /^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/.exec(timestamp);
    if (!match) {
      throw new SearchConsoleValidationError([
        `${source} row ${index + 2} has an invalid date/time: "${timestamp}"`,
      ]);
    }
    const parsed = new Date(`${match[1]}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== match[1]) {
      throw new SearchConsoleValidationError([
        `${source} row ${index + 2} has an invalid calendar date: "${match[1]}"`,
      ]);
    }
    days.add(match[1]);
  });

  return [...days].sort();
}

interface ExportFiles {
  filters: string;
  chart: string;
  pages: string;
}

function archiveEntryNames(inputPath: string): string[] {
  try {
    return execFileSync("unzip", ["-Z1", inputPath], { encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    throw new SearchConsoleValidationError([
      `could not inspect "${inputPath}" as a ZIP export; provide a Search Console ZIP or extracted export directory`,
    ]);
  }
}

function readArchiveEntry(inputPath: string, entryName: string, names: string[]): string {
  const match = names.find(name => basename(name).toLowerCase() === entryName.toLowerCase());
  if (!match) {
    throw new SearchConsoleValidationError([
      `"${inputPath}" is missing ${entryName}; export the complete Search Console performance archive`,
    ]);
  }
  try {
    return execFileSync("unzip", ["-p", inputPath, match], { encoding: "utf8" });
  } catch {
    throw new SearchConsoleValidationError([`could not read ${entryName} from "${inputPath}"`]);
  }
}

function readExportFiles(inputPath: string): ExportFiles {
  const absolutePath = resolve(inputPath);
  if (!existsSync(absolutePath)) {
    throw new SearchConsoleValidationError([`export path does not exist: "${inputPath}"`]);
  }

  if (statSync(absolutePath).isDirectory()) {
    const entries = readdirSync(absolutePath);
    const getFile = (expected: string): string => {
      const match = entries.find(entry => entry.toLowerCase() === expected.toLowerCase());
      if (!match) {
        throw new SearchConsoleValidationError([
          `"${inputPath}" is missing ${expected}; export the complete Search Console performance archive`,
        ]);
      }
      return readFileSync(resolve(absolutePath, match), "utf8");
    };
    return { filters: getFile("Filters.csv"), chart: getFile("Chart.csv"), pages: getFile("Pages.csv") };
  }

  if (extname(absolutePath).toLowerCase() === ".csv") {
    throw new SearchConsoleValidationError(
      [`"${inputPath}" is only a Pages.csv file; provide the full export ZIP or directory so Web search and date coverage can be validated`],
    );
  }

  const names = archiveEntryNames(absolutePath);
  return {
    filters: readArchiveEntry(absolutePath, "Filters.csv", names),
    chart: readArchiveEntry(absolutePath, "Chart.csv", names),
    pages: readArchiveEntry(absolutePath, "Pages.csv", names),
  };
}

function readPagesSource(inputPath: string): Map<string, SearchConsoleMetrics> {
  const absolutePath = resolve(inputPath);
  if (!existsSync(absolutePath)) {
    throw new SearchConsoleValidationError([`baseline path does not exist: "${inputPath}"`]);
  }
  if (statSync(absolutePath).isDirectory() || extname(absolutePath).toLowerCase() !== ".csv") {
    return parsePages(readExportFiles(inputPath).pages, inputPath);
  }
  return parsePages(readFileSync(absolutePath, "utf8"), inputPath);
}

function subtract(observed: SearchConsoleMetrics, baseline: SearchConsoleMetrics): SearchConsoleMetrics {
  return {
    clicks: observed.clicks - baseline.clicks,
    impressions: observed.impressions - baseline.impressions,
    ctr: observed.ctr - baseline.ctr,
    position: observed.position - baseline.position,
  };
}

function aggregate(metrics: SearchConsoleMetrics[]): SearchConsoleMetrics {
  const clicks = metrics.reduce((total, metric) => total + metric.clicks, 0);
  const impressions = metrics.reduce((total, metric) => total + metric.impressions, 0);
  const weightedPositionTotal = metrics.reduce(
    (total, metric) => total + metric.position * metric.impressions,
    0,
  );
  return {
    clicks,
    impressions,
    ctr: impressions === 0 ? 0 : clicks / impressions,
    position: impressions === 0 ? 0 : weightedPositionTotal / impressions,
  };
}

export function compareSearchConsoleExport(
  observedPath: string,
  baselinePath: string,
): SearchConsoleComparison {
  const files = readExportFiles(observedPath);
  const filters = parseFilterValues(files.filters, `${observedPath}/Filters.csv`);
  const searchType = filters.get("search type");
  const problems: string[] = [];
  if (!searchType || searchType.toLowerCase() !== "web") {
    problems.push(`Search type must be Web; received "${searchType ?? "(missing)"}"`);
  }

  const recordedDays = parseRecordedDays(files.chart, `${observedPath}/Chart.csv`);
  if (recordedDays.length < 7) {
    problems.push(
      `date range must contain at least 7 recorded days; found ${recordedDays.length} (${recordedDays.join(", ") || "none"})`,
    );
  }

  let observedPages: Map<string, SearchConsoleMetrics>;
  let baselinePages: Map<string, SearchConsoleMetrics>;
  try {
    observedPages = parsePages(files.pages, `${observedPath}/Pages.csv`);
    assertPriorityUrls(observedPages, `${observedPath}/Pages.csv`);
    baselinePages = readPagesSource(baselinePath);
    assertPriorityUrls(baselinePages, baselinePath);
  } catch (error) {
    if (error instanceof SearchConsoleValidationError) problems.push(...error.problems);
    else throw error;
    throw new SearchConsoleValidationError(problems);
  }
  if (problems.length > 0) throw new SearchConsoleValidationError(problems);

  const rows = PRIORITY_URLS.map(url => {
    const baseline = baselinePages.get(url)!;
    const observed = observedPages.get(url)!;
    return { url, baseline, observed, delta: subtract(observed, baseline) };
  });
  const baseline = aggregate(rows.map(row => row.baseline));
  const observed = aggregate(rows.map(row => row.observed));

  return {
    property: SEARCH_CONSOLE_PROPERTY,
    searchType: searchType!,
    recordedDays,
    dayCount: recordedDays.length,
    baselineSource: baselinePath,
    observedSource: observedPath,
    rows,
    summary: { baseline, observed, delta: subtract(observed, baseline) },
  };
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function renderMarkdown(comparison: SearchConsoleComparison): string {
  const lines = [
    "# Search Console priority-page comparison",
    "",
    `- **Property:** ${comparison.property}`,
    `- **Search type:** ${comparison.searchType}`,
    `- **Recorded days:** ${comparison.dayCount} (${comparison.recordedDays[0]} through ${comparison.recordedDays.at(-1)})`,
    `- **Baseline:** ${comparison.baselineSource}`,
    `- **Observed export:** ${comparison.observedSource}`,
    "",
    "| URL | Baseline clicks | Observed clicks | Δ clicks | Baseline impressions | Observed impressions | Δ impressions | Baseline CTR | Observed CTR | Δ CTR | Baseline position | Observed position | Δ position |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const row of comparison.rows) {
    lines.push(
      `| ${row.url} | ${row.baseline.clicks} | ${row.observed.clicks} | ${row.delta.clicks} | ${row.baseline.impressions} | ${row.observed.impressions} | ${row.delta.impressions} | ${formatPercent(row.baseline.ctr)} | ${formatPercent(row.observed.ctr)} | ${formatPercent(row.delta.ctr)} | ${formatNumber(row.baseline.position)} | ${formatNumber(row.observed.position)} | ${formatNumber(row.delta.position)} |`,
    );
  }
  const { baseline, observed, delta } = comparison.summary;
  lines.push(
    `| **Total / weighted average** | **${baseline.clicks}** | **${observed.clicks}** | **${delta.clicks}** | **${baseline.impressions}** | **${observed.impressions}** | **${delta.impressions}** | **${formatPercent(baseline.ctr)}** | **${formatPercent(observed.ctr)}** | **${formatPercent(delta.ctr)}** | **${formatNumber(baseline.position)}** | **${formatNumber(observed.position)}** | **${formatNumber(delta.position)}** |`,
  );
  return `${lines.join("\n")}\n`;
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function renderCsv(comparison: SearchConsoleComparison): string {
  const header = [
    "url",
    "baseline_clicks",
    "baseline_impressions",
    "baseline_ctr",
    "baseline_position",
    "observed_clicks",
    "observed_impressions",
    "observed_ctr",
    "observed_position",
    "delta_clicks",
    "delta_impressions",
    "delta_ctr",
    "delta_position",
  ];
  const values = comparison.rows.map(row => [
    row.url,
    String(row.baseline.clicks),
    String(row.baseline.impressions),
    String(row.baseline.ctr),
    String(row.baseline.position),
    String(row.observed.clicks),
    String(row.observed.impressions),
    String(row.observed.ctr),
    String(row.observed.position),
    String(row.delta.clicks),
    String(row.delta.impressions),
    String(row.delta.ctr),
    String(row.delta.position),
  ]);
  return [header, ...values].map(row => row.map(csvEscape).join(",")).join("\n") + "\n";
}

function usage(): string {
  return [
    "Usage: npm run compare:search-console -- --export <zip-or-directory> [options]",
    "",
    "Options:",
    "  --export <path>    Required Search Console ZIP or extracted export directory",
    "  --baseline <path>  Pages.csv or export ZIP/directory with the baseline 11 URLs",
    "                     (default: exports/search-console-baseline-2026-08-31.csv)",
    "  --format <name>    markdown (default), csv, or json",
    "  --out <path>       Write the report to a file instead of stdout",
  ].join("\n");
}

function parseArgs(args: string[]): {
  exportPath: string;
  baselinePath: string;
  format: "markdown" | "csv" | "json";
  outputPath?: string;
} {
  let exportPath: string | undefined;
  let baselinePath = "exports/search-console-baseline-2026-08-31.csv";
  let format: "markdown" | "csv" | "json" = "markdown";
  let outputPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];
    if (argument === "--export" && value) {
      exportPath = value;
      index += 1;
    } else if (argument === "--baseline" && value) {
      baselinePath = value;
      index += 1;
    } else if (argument === "--format" && value && ["markdown", "csv", "json"].includes(value)) {
      format = value as typeof format;
      index += 1;
    } else if (argument === "--out" && value) {
      outputPath = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      throw new Error(usage());
    } else {
      throw new Error(`unknown or incomplete argument "${argument}"\n\n${usage()}`);
    }
  }
  if (!exportPath) throw new Error(`--export is required\n\n${usage()}`);
  return { exportPath, baselinePath, format, outputPath };
}

function runCli(): void {
  try {
    const options = parseArgs(process.argv.slice(2));
    const comparison = compareSearchConsoleExport(options.exportPath, options.baselinePath);
    const output =
      options.format === "json"
        ? `${JSON.stringify(comparison, null, 2)}\n`
        : options.format === "csv"
          ? renderCsv(comparison)
          : renderMarkdown(comparison);
    if (options.outputPath) writeFileSync(options.outputPath, output);
    else process.stdout.write(output);
  } catch (error) {
    if (error instanceof SearchConsoleValidationError) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
      return;
    }
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runCli();
}