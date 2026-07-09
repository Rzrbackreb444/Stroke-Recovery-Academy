import { type ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import {
  Dumbbell, MessageCircle, Brain, Battery, Eye, Heart,
  Fingerprint, Waves, ChevronRight, ClipboardList,
} from "lucide-react";

// ── Severity helpers ────────────────────────────────────────────────────────
const SEVERITY_LABEL = ["none", "mild", "moderate", "severe", "complete"] as const;

// ── Per-deficit prescription data ───────────────────────────────────────────
type DeficitKey = "motor" | "speech" | "cognitive" | "fatigue" | "vision" | "swallowing" | "emotional" | "sensory";

const DEFICIT_META: Record<DeficitKey, {
  label: string;
  icon: ElementType;
  color: string;
  reps: Array<{ name: string; why: string; duration: string }>;
}> = {
  motor: {
    label: "Motor function",
    icon: Dumbbell,
    color: "#C06B3E",
    reps: [
      { name: "Affected-side arm circles", why: "Forces the limb to relearn the movement pattern", duration: "3 min" },
      { name: "Weight shifting in place", why: "Rebuilds proprioception — the brain's position sense", duration: "5 min" },
      { name: "Mirror therapy (hand)", why: "Visual feedback tricks the motor cortex into firing", duration: "10 min" },
    ],
  },
  speech: {
    label: "Speech / language",
    icon: MessageCircle,
    color: "#7C6A5A",
    reps: [
      { name: "Read one paragraph aloud", why: "Activates Broca's area through production, not just reception", duration: "5 min" },
      { name: "Word retrieval drills", why: "Category fluency tasks rebuild lexical access pathways", duration: "5 min" },
      { name: "Tongue and lip movements", why: "Oral motor control is foundational before speech returns", duration: "3 min" },
    ],
  },
  cognitive: {
    label: "Cognitive processing",
    icon: Brain,
    color: "#9B7E6A",
    reps: [
      { name: "10-minute focus task", why: "Sustained attention is trainable — short windows compound fast", duration: "10 min" },
      { name: "Memory card sequence", why: "Working memory responds quickly to daily repetition", duration: "5 min" },
      { name: "Task planning exercise", why: "Executive function rebuilds through low-stakes planning practice", duration: "5 min" },
    ],
  },
  fatigue: {
    label: "Fatigue management",
    icon: Battery,
    color: "#A8A29E",
    reps: [
      { name: "Energy pacing log", why: "Tracking output-vs-rest teaches the brain to self-regulate", duration: "2 min" },
      { name: "Diaphragmatic breathing", why: "Activates the parasympathetic system — genuine rest, not passive waiting", duration: "5 min" },
      { name: "1 rep at peak energy", why: "One well-timed rep beats three reps at the wrong hour", duration: "5 min" },
    ],
  },
  vision: {
    label: "Vision",
    icon: Eye,
    color: "#C06B3E",
    reps: [
      { name: "Eye tracking left-right", why: "Saccadic eye movement training reactivates neglect pathways", duration: "5 min" },
      { name: "Visual scanning grid", why: "Systematic scan patterns compensate for field cuts", duration: "5 min" },
      { name: "High-contrast reading", why: "Contrast sensitivity exercises preserve remaining acuity", duration: "5 min" },
    ],
  },
  swallowing: {
    label: "Swallowing",
    icon: Waves,
    color: "#7C6A5A",
    reps: [
      { name: "Chin-tuck swallow drill", why: "Reduces aspiration risk during the pharyngeal phase", duration: "5 min" },
      { name: "Tongue base retraction", why: "Strengthens the muscle group that clears the vallecular space", duration: "3 min" },
      { name: "Effortful swallow practice", why: "Increases posterior tongue pressure — the key movement in dysphagia", duration: "5 min" },
    ],
  },
  emotional: {
    label: "Emotional regulation",
    icon: Heart,
    color: "#9B7E6A",
    reps: [
      { name: "One page in your journal", why: "Externalizing the inner state reduces its grip — every time", duration: "10 min" },
      { name: "Name 3 physical sensations", why: "Somatic grounding interrupts the anxiety loop before it escalates", duration: "3 min" },
      { name: "Talk to Coach", why: "Vocalized reflection processes emotion differently than silent rumination", duration: "open" },
    ],
  },
  sensory: {
    label: "Sensory processing",
    icon: Fingerprint,
    color: "#C06B3E",
    reps: [
      { name: "Texture discrimination", why: "Passive sensory input reactivates the somatosensory cortex", duration: "5 min" },
      { name: "Temperature contrast touch", why: "Temperature receptors and touch fibers share recovery pathways", duration: "3 min" },
      { name: "Body scan meditation", why: "Interoception training rebuilds the brain's map of the body", duration: "10 min" },
    ],
  },
};

// ── Derive today's top 3 reps from the deficit profile ─────────────────────
function buildPrescription(deficits: Record<string, number>): Array<{
  deficitKey: DeficitKey;
  rep: { name: string; why: string; duration: string };
  severity: number;
}> {
  return Object.entries(deficits)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key, severity]) => {
      const meta = DEFICIT_META[key as DeficitKey];
      if (!meta) return null;
      // Pick rep based on severity: mild=0, moderate=1, severe/complete=2
      const repIdx = severity >= 3 ? 2 : severity === 2 ? 1 : 0;
      return { deficitKey: key as DeficitKey, rep: meta.reps[repIdx], severity };
    })
    .filter(Boolean) as Array<{ deficitKey: DeficitKey; rep: { name: string; why: string; duration: string }; severity: number }>;
}

// ── Component ───────────────────────────────────────────────────────────────
export default function DeficitPrescriptionCard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<{ profile: any }>({
    queryKey: ["/api/survivor/profile"],
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const profile = data?.profile;
  const deficits: Record<string, number> | null = profile?.deficits ?? null;
  const hasDeficits = deficits && Object.values(deficits).some((v) => v > 0);

  // ── Skeleton ──
  if (isLoading) {
    return (
      <section className="mb-6">
        <div className="rounded-2xl bg-white border border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 animate-pulse">
          <div className="h-3 w-32 rounded bg-[#F5F0EB] mb-3" />
          <div className="h-5 w-56 rounded bg-[#F5F0EB] mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl bg-[#FDFBF7] border border-[#E2C2A4]/30 p-4">
                <div className="h-8 w-8 rounded-full bg-[#F5F0EB] mb-3" />
                <div className="h-4 w-28 rounded bg-[#F5F0EB] mb-2" />
                <div className="h-3 w-full rounded bg-[#F5F0EB]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── No profile / intake not done ──
  if (!profile || !hasDeficits) {
    return (
      <section className="mb-6">
        <Link
          href="/recovery/me"
          className="block rounded-2xl border border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover-elevate"
          data-testid="card-prescription-no-profile"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-md bg-[#F5F0EB] flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-[#C06B3E]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#C06B3E]">Your prescription</p>
                <p className="text-base font-bold text-[#1C1917]">Tell us your deficits — get a personal plan</p>
                <p className="text-xs text-[#A8A29E]">30 seconds in Survivor OS unlocks a daily rep prescription built for you</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#C06B3E] shrink-0" />
          </div>
        </Link>
      </section>
    );
  }

  const prescription = buildPrescription(deficits);
  const topDeficitKey = prescription[0]?.deficitKey;
  const topMeta = topDeficitKey ? DEFICIT_META[topDeficitKey] : null;
  const severityLabel = prescription[0] ? SEVERITY_LABEL[prescription[0].severity] ?? "active" : "active";
  const affectedSide = profile.affectedSide && profile.affectedSide !== "unsure" ? profile.affectedSide : null;
  const timeBudget = profile.dailyTimeBudgetMinutes ?? 20;

  return (
    <section className="mb-6" data-testid="card-deficit-prescription">
      <div className="rounded-2xl bg-white border border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C06B3E] mb-0.5">Your daily prescription</p>
            <p className="text-base font-bold text-[#1C1917]">
              {prescription.length} rep{prescription.length !== 1 ? "s" : ""} built for your deficits
            </p>
            <p className="text-xs text-[#78716C] mt-0.5">
              {affectedSide ? `${affectedSide.charAt(0).toUpperCase() + affectedSide.slice(1)}-side focus` : "Personalised"}
              {topMeta ? ` · leading with ${topMeta.label.toLowerCase()}` : ""}
              {" "}· fits in {timeBudget} min
            </p>
          </div>
          {topMeta && (
            <div
              className="h-10 w-10 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${topMeta.color}18` }}
            >
              <topMeta.icon className="h-5 w-5" style={{ color: topMeta.color }} />
            </div>
          )}
        </div>

        {/* Prescription cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {prescription.map(({ deficitKey, rep, severity }, idx) => {
            const meta = DEFICIT_META[deficitKey];
            const Icon = meta.icon;
            return (
              <div
                key={deficitKey}
                className="rounded-xl border border-[#E2C2A4]/30 bg-[#FDFBF7] p-4"
                data-testid={`card-prescription-rep-${idx}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${meta.color}18` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: meta.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: meta.color }}>
                      {meta.label} · {SEVERITY_LABEL[severity]}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-[#1C1917] mb-1 leading-snug">{rep.name}</p>
                <p className="text-xs text-[#78716C] leading-relaxed mb-3">{rep.why}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#A8A29E] uppercase tracking-wider">{rep.duration}</span>
                  <Link
                    href="#today"
                    className="text-[10px] font-semibold uppercase tracking-widest hover-elevate px-2 py-1 rounded"
                    style={{ color: meta.color }}
                  >
                    Log it →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-[#A8A29E] mt-4 leading-relaxed">
          Prescription updates automatically as your deficit profile changes.{" "}
          <Link href="/recovery/me" className="underline hover:text-[#78716C] transition-colors">
            Update your profile
          </Link>
        </p>
      </div>
    </section>
  );
}
