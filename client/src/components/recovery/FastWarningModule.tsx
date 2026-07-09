import { Phone, AlertTriangle } from "lucide-react";

// ============================================================================
// FAST WARNING-SIGN MODULE — stroke recurrence education + emergency escalation.
// ----------------------------------------------------------------------------
// Static, accessible content. NOT clinical assessment — it teaches the FAST
// signs and routes any suspected stroke straight to 911. Rendered prominently
// on the Prevention Hub and, in compact form, on the dashboard.
// ============================================================================

const SIGNS: Array<{ letter: string; title: string; body: string }> = [
  { letter: "F", title: "Face drooping", body: "One side of the face droops or goes numb. Ask them to smile — is it uneven?" },
  { letter: "A", title: "Arm weakness", body: "One arm is weak or numb. Ask them to raise both arms — does one drift down?" },
  { letter: "S", title: "Speech difficulty", body: "Speech is slurred or hard to understand. Ask them to repeat a simple sentence." },
  { letter: "T", title: "Time to call 911", body: "If you see any of these signs — even if they pass — call 911 now. Note the time symptoms started." },
];

export default function FastWarningModule({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div
        className="rounded-2xl border border-red-500/40 bg-red-500/5 p-4"
        role="region"
        aria-label="Stroke warning signs and emergency guidance"
        data-testid="module-fast-compact"
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" aria-hidden="true" />
          <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Know the signs — FAST</span>
        </div>
        <p className="text-sm text-[#78716C] mb-3">
          Face drooping. Arm weakness. Speech trouble. Time to call 911. Recurrence is real — spot it fast, act faster.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="tel:911"
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
            data-testid="link-call-911-compact"
          >
            <Phone className="h-4 w-4" aria-hidden="true" /> Call 911
          </a>
          <a
            href="/recovery/prevention"
            className="text-sm text-[#E2741B] hover:underline"
            data-testid="link-prevention-from-dashboard"
          >
            Prevention track →
          </a>
        </div>
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl border border-red-500/40 bg-red-500/[0.06] p-5 sm:p-6"
      role="region"
      aria-label="Stroke warning signs and emergency guidance"
      data-testid="module-fast"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-bold text-white">Warning signs — act FAST</h2>
            <p className="text-sm text-[#78716C]">About 1 in 4 strokes is a repeat. Knowing the signs saves brain — and lives.</p>
          </div>
        </div>
        <a
          href="tel:911"
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
          data-testid="link-call-911"
        >
          <Phone className="h-4 w-4" aria-hidden="true" /> Call 911 now
        </a>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2" data-testid="list-fast-signs">
        {SIGNS.map((s) => (
          <li
            key={s.letter}
            className="flex gap-3 rounded-xl border border-[#2a2a2a] bg-[#141414] p-4"
            data-testid={`fast-sign-${s.letter.toLowerCase()}`}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-600 text-base font-black text-white"
              aria-hidden="true"
            >
              {s.letter}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{s.title}</p>
              <p className="text-sm text-[#78716C] leading-snug mt-0.5">{s.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-[#a8a29e] leading-relaxed">
        Don't wait it out. Don't drive yourself. Don't "sleep it off." If a sign shows up — even briefly — call 911 and
        tell them you suspect a stroke. Time lost is brain lost.
      </p>
    </section>
  );
}
