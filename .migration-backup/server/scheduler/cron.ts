// Minimal 5-field cron evaluator (minute hour day-of-month month day-of-week).
// Supports: *, lists (a,b), ranges (a-b), steps (*/n, a-b/n, a/n). UTC-based.
//
// Used only to compute the *next* run time when a job completes (or at boot),
// so the O(minutes) minute-stepping search is cheap and bounded (<= ~370 days).
// No external dependency — we deliberately implement inline.

function parseField(field: string, min: number, max: number): Set<number> {
  const out = new Set<number>();
  for (const part of field.split(",")) {
    const [rangePart, stepPart] = part.split("/");
    const step = stepPart ? parseInt(stepPart, 10) : 1;
    if (!step || step < 1) throw new Error(`Invalid cron step in "${field}"`);
    let lo: number;
    let hi: number;
    if (rangePart === "*") {
      lo = min;
      hi = max;
    } else if (rangePart.includes("-")) {
      const [a, b] = rangePart.split("-").map((n) => parseInt(n, 10));
      lo = a;
      hi = b;
    } else {
      lo = parseInt(rangePart, 10);
      // "a/n" means a..max stepping by n; a bare "a" means exactly a.
      hi = stepPart ? max : lo;
    }
    if (Number.isNaN(lo) || Number.isNaN(hi) || lo < min || hi > max || lo > hi) {
      throw new Error(`Invalid cron field "${field}" (allowed ${min}-${max})`);
    }
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}

export function cronNextRun(expr: string, from: Date = new Date()): Date {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`Cron must have 5 fields, got ${fields.length}: "${expr}"`);
  }
  const [minF, hourF, domF, monF, dowF] = fields;
  const minutes = parseField(minF, 0, 59);
  const hours = parseField(hourF, 0, 23);
  const doms = parseField(domF, 1, 31);
  const months = parseField(monF, 1, 12);
  const dows = parseField(dowF, 0, 6); // 0 = Sunday
  const domRestricted = domF.trim() !== "*";
  const dowRestricted = dowF.trim() !== "*";

  const d = new Date(from.getTime());
  d.setUTCSeconds(0, 0);
  d.setUTCMinutes(d.getUTCMinutes() + 1); // strictly after `from`

  const limitMinutes = 370 * 24 * 60;
  for (let i = 0; i < limitMinutes; i++) {
    if (months.has(d.getUTCMonth() + 1)) {
      const dom = d.getUTCDate();
      const dow = d.getUTCDay();
      // Standard cron: when BOTH dom and dow are restricted, match is an OR.
      const dateOk =
        domRestricted && dowRestricted
          ? doms.has(dom) || dows.has(dow)
          : doms.has(dom) && dows.has(dow);
      if (dateOk && hours.has(d.getUTCHours()) && minutes.has(d.getUTCMinutes())) {
        return new Date(d.getTime());
      }
    }
    d.setUTCMinutes(d.getUTCMinutes() + 1);
  }
  throw new Error(`Could not compute next cron run within 370 days for "${expr}"`);
}

export interface JobSchedule {
  intervalSeconds?: number | null;
  cron?: string | null;
}

export function computeNextRun(sched: JobSchedule, from: Date = new Date()): Date {
  if (sched.cron) return cronNextRun(sched.cron, from);
  if (sched.intervalSeconds && sched.intervalSeconds > 0) {
    return new Date(from.getTime() + sched.intervalSeconds * 1000);
  }
  throw new Error("Job has neither cron nor intervalSeconds");
}
