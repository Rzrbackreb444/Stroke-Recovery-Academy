import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

// ── Milestone definitions ────────────────────────────────────────────────────
const MILESTONES = [30, 60, 90, 180, 365] as const;
type MilestoneDay = typeof MILESTONES[number];

const MILESTONE_COPY: Record<MilestoneDay, { headline: string; body: string }> = {
  30: {
    headline: "Day 30.",
    body: "One month of not giving in. The brain is literally different than it was when you started — every rep you logged rewired something. That's not a pep talk. That's neuroscience.",
  },
  60: {
    headline: "Day 60.",
    body: "Two months. The research says habit circuits lock in around 66 days. You're close. A few more reps and this stops being something you do — it becomes who you are.",
  },
  90: {
    headline: "Day 90.",
    body: "Three months of choosing this. Most people quit in the first week. You're in a different category now — and your streak is proof, not a promise.",
  },
  180: {
    headline: "Half a year.",
    body: "Six months. Survivors who reach 180 days almost never stop. You're past the crisis point. What started as survival is starting to look like a comeback.",
  },
  365: {
    headline: "One year.",
    body: "A full year. You've outlasted the doubt, the bad days, the 'what's the point' moments. This is no longer a recovery. It's a life you built back from scratch.",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function findActiveMilestone(days: number): MilestoneDay | null {
  for (const m of MILESTONES) {
    if (Math.abs(days - m) <= 4) return m;
  }
  return null;
}

function nextMilestone(days: number): MilestoneDay | null {
  return MILESTONES.find((m) => m > days) ?? null;
}

function daysUntil(target: number, current: number): number {
  return Math.max(0, target - current);
}

// ── Streak pill ───────────────────────────────────────────────────────────────
function StreakPip({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-1`}
    >
      <div
        className={`h-2 w-2 rounded-full transition-colors ${
          active ? "bg-[#C06B3E]" : "bg-[#E2C2A4]/50"
        }`}
      />
      <span className={`text-[9px] uppercase tracking-wider ${active ? "text-[#C06B3E]" : "text-[#A8A29E]"}`}>
        {label}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RecoveryArcCard() {
  const { user } = useAuth();

  const { data: profileData } = useQuery<{ profile: any }>({
    queryKey: ["/api/survivor/profile"],
    enabled: !!user,
    staleTime: 10 * 60_000,
  });

  const { data: dashboard } = useQuery<any>({
    queryKey: ["/api/recovery/dashboard"],
    staleTime: 5 * 60_000,
  });

  const profile = profileData?.profile;
  const strokeDate = profile?.strokeDate ?? null;
  // Fall back to join date if stroke date not set
  const anchorDate = strokeDate ?? (user as any)?.createdAt ?? null;
  const days = daysSince(anchorDate);

  if (!days || days < 25) return null;

  const activeMilestone = findActiveMilestone(days);
  const next = nextMilestone(days);
  const streak = dashboard?.streak?.current ?? 0;
  const totalCheckins = dashboard?.checkins?.total ?? 0;

  // Only render if we're at a milestone window OR next milestone is close (within 5 days)
  const nearNext = next && daysUntil(next, days) <= 5;
  if (!activeMilestone && !nearNext) return null;

  // If we're near the NEXT milestone but haven't hit one, show a "coming up" version
  if (!activeMilestone && nearNext && next) {
    const daysLeft = daysUntil(next, days);
    return (
      <section className="mb-6" data-testid="card-recovery-arc-approaching">
        <div className="rounded-2xl border border-[#E2C2A4]/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C06B3E] mb-1">Recovery milestone approaching</p>
          <p className="text-base font-bold text-[#1C1917] mb-1">
            {daysLeft === 0 ? "Tomorrow:" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} to Day ${next}.`}
          </p>
          <p className="text-sm text-[#78716C] leading-relaxed">
            Keep the streak alive. Every rep between now and then is a brick in the foundation.
          </p>
        </div>
      </section>
    );
  }

  if (!activeMilestone) return null;

  const copy = MILESTONE_COPY[activeMilestone];
  const isStrokeDate = !!strokeDate;
  const deficits = profile?.deficits ?? {};
  const activeDeficitCount = Object.values(deficits).filter((v: any) => v > 0).length;

  return (
    <section className="mb-6" data-testid="card-recovery-arc">
      <div
        className="rounded-2xl border border-[#C06B3E]/25 shadow-[0_1px_4px_rgba(192,107,62,0.08)] p-6"
        style={{ background: "linear-gradient(135deg, #FDFBF7 0%, #FDF6EF 100%)" }}
      >
        {/* Eyebrow */}
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#C06B3E] mb-3">
          Recovery milestone — {isStrokeDate ? "post-stroke" : "since you joined"}
        </p>

        {/* Big milestone number */}
        <div className="flex items-baseline gap-3 mb-4">
          <span
            className="text-6xl font-black leading-none"
            style={{ color: "#C06B3E", fontVariantNumeric: "tabular-nums" }}
          >
            {activeMilestone}
          </span>
          <span className="text-xl font-bold text-[#78716C]">days.</span>
        </div>

        {/* Narrative body — Sasquatch voice */}
        <p className="text-sm text-[#1C1917] leading-relaxed mb-5 max-w-xl">
          {copy.body}
        </p>

        {/* Stats strip */}
        {(streak > 0 || totalCheckins > 0 || activeDeficitCount > 0) && (
          <div className="flex flex-wrap gap-6 mb-5">
            {streak > 0 && (
              <div>
                <p className="text-2xl font-black text-[#1C1917]" data-testid="text-arc-streak">{streak}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#A8A29E]">day streak</p>
              </div>
            )}
            {totalCheckins > 0 && (
              <div>
                <p className="text-2xl font-black text-[#1C1917]">{totalCheckins}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#A8A29E]">total check-ins</p>
              </div>
            )}
            {activeDeficitCount > 0 && (
              <div>
                <p className="text-2xl font-black text-[#1C1917]">{activeDeficitCount}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#A8A29E]">areas in recovery</p>
              </div>
            )}
          </div>
        )}

        {/* Timeline strip */}
        <div className="flex items-center gap-2 mb-5">
          {MILESTONES.map((m, i) => {
            const hit = days >= m - 4;
            const isActive = m === activeMilestone;
            return (
              <div key={m} className="flex items-center gap-2">
                <div className={`flex flex-col items-center`}>
                  <div
                    className={`rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "h-5 w-5 border-2 border-[#C06B3E] bg-[#C06B3E]"
                        : hit
                        ? "h-4 w-4 border-2 border-[#C06B3E] bg-[#C06B3E]/20"
                        : "h-3.5 w-3.5 border border-[#E2C2A4] bg-[#F5F0EB]"
                    }`}
                  >
                    {isActive && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <span className={`text-[9px] mt-1 font-bold ${isActive ? "text-[#C06B3E]" : hit ? "text-[#A8A29E]" : "text-[#D4C9BE]"}`}>
                    {m}
                  </span>
                </div>
                {i < MILESTONES.length - 1 && (
                  <div className={`h-px flex-1 min-w-[16px] transition-colors ${hit && days >= MILESTONES[i + 1] - 4 ? "bg-[#C06B3E]" : hit ? "bg-[#E2C2A4]" : "bg-[#F0EBE5]"}`} />
                )}
              </div>
            );
          })}
          <span className="text-[9px] text-[#A8A29E] ml-1 uppercase tracking-wider">days</span>
        </div>

        {/* Closer — quote style */}
        <p className="text-[11px] text-[#A8A29E] italic border-t border-[#E2C2A4]/30 pt-4">
          — Every damn day you show up, you win. Period.
        </p>
      </div>
    </section>
  );
}
