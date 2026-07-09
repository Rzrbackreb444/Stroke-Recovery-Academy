export const STROKE_DATE = { year: 2018, month: 12, day: 3 };

export function yearsSinceStroke(now: Date = new Date()): number {
  const y = now.getFullYear() - STROKE_DATE.year;
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const passedAnniversary =
    m > STROKE_DATE.month || (m === STROKE_DATE.month && d >= STROKE_DATE.day);
  return Math.max(0, passedAnniversary ? y : y - 1);
}
