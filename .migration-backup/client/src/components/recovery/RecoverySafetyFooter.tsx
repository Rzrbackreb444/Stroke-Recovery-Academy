import { AlertTriangle, Phone } from "lucide-react";

interface Props {
  variant?: "default" | "compact";
}

export function RecoverySafetyFooter({ variant = "default" }: Props) {
  if (variant === "compact") {
    return (
      <div
        className="rounded-lg border border-[#E2741B]/40 bg-[#1a1a1a] p-3 text-xs text-gray-300"
        data-testid="recovery-safety-footer-compact"
      >
        <p className="font-semibold text-[#E2741B] mb-1">Not medical advice.</p>
        <p>
          Stop if you feel pain, dizziness, or shortness of breath. In a medical emergency call{" "}
          <span className="font-bold text-white">911</span>. For mental health crisis call or text{" "}
          <span className="font-bold text-white">988</span>.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-[#E2741B]/40 bg-gradient-to-br from-[#1a1a1a] to-[#141414] p-5"
      data-testid="recovery-safety-footer"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-md bg-[#E2741B] flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-black" />
        </div>
        <div>
          <p className="text-sm font-bold text-white uppercase tracking-wide">
            Safety First — Not Medical Advice
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Read before every session.
          </p>
        </div>
      </div>
      <ul className="text-xs text-gray-300 space-y-1.5 leading-relaxed mb-4 ml-12">
        <li>
          <span className="text-[#E2741B] font-semibold">Stop immediately</span> if you feel sharp pain,
          dizziness, shortness of breath, or unusual symptoms.
        </li>
        <li>
          Every stroke recovery is unique. Confirm new exercises with your doctor, PT, or OT.
        </li>
        <li>
          Quality over quantity. Exhale during effort. Use support (chair, wall, table, caregiver) as
          needed.
        </li>
        <li>
          2–3 short sessions (10–20 min) often beat one long session. Rest as needed.
        </li>
      </ul>
      <div className="flex flex-wrap gap-2 ml-12">
        <a
          href="tel:911"
          className="inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover-elevate"
          data-testid="link-911"
        >
          <Phone className="h-3 w-3" />
          Emergency 911
        </a>
        <a
          href="tel:988"
          className="inline-flex items-center gap-2 rounded-md border border-[#E2741B]/40 bg-[#E2741B]/10 px-3 py-1.5 text-xs font-semibold text-[#E2741B] hover-elevate"
          data-testid="link-988"
        >
          <Phone className="h-3 w-3" />
          988 Crisis Line
        </a>
      </div>
    </div>
  );
}
