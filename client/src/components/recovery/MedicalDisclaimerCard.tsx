import { Card } from "@/components/ui/card";
import { ShieldAlert, Phone } from "lucide-react";

type Variant = "compact" | "full" | "modal";

interface MedicalDisclaimerCardProps {
  variant?: Variant;
  /**
   * Optional context-specific addendum appended below the standard
   * survivor-not-medical-advice copy. Used by surfaces like the Motivation
   * Studio and Survivor Shop to scope the warning to their use case
   * (e.g. "Motivation tools are not therapy" / "Confirm assistive devices
   * with your therapist").
   */
  extraContext?: string;
}

export function MedicalDisclaimerCard({ variant = "compact", extraContext }: MedicalDisclaimerCardProps) {
  if (variant === "modal") {
    return (
      <div
        className="rounded-md border border-red-700/50 bg-red-950/30 p-4 text-left"
        data-testid="disclaimer-modal"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm text-red-100/95 leading-relaxed">
            <p className="font-bold mb-1 text-red-300">Stop and read before you stand up.</p>
            <p>
              Walking after a stroke carries fall, blood pressure, and seizure risk. Only attempt a
              walking exercise with a licensed therapist, caregiver, or trained partner present, on
              a non-slip surface, with a stable assistive device. If you feel dizzy, weak, or
              short-of-breath, sit down immediately.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <Card
        className="bg-[#0f0f0f] border-[#3a2222] p-5"
        data-testid="disclaimer-full"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300 leading-relaxed">
            <p className="font-bold text-red-300 mb-2 uppercase tracking-wider text-xs">
              Survivor-to-Survivor — Not Medical Advice
            </p>
            <p className="mb-2">
              The Sasquatch Recovery System was built by a stroke survivor for stroke survivors. It
              is education and motivation, not medical care. Nothing here replaces your
              physician, neurologist, physical therapist, occupational therapist, or
              speech-language pathologist.
            </p>
            <p className="mb-2">
              Talk to your care team before starting, changing, or stopping any exercise, diet,
              medication, or routine. If a movement causes pain, dizziness, weakness, vision change,
              slurred speech, or numbness — stop immediately.
            </p>
            <p className="flex items-center gap-2 text-red-300 font-semibold">
              <Phone className="h-3.5 w-3.5" />
              If you suspect a new stroke, call 911 (or your local emergency number) right now.
            </p>
            {extraContext && (
              <p className="mt-3 pt-3 border-t border-red-900/30 text-gray-400 italic" data-testid="disclaimer-extra-context">
                {extraContext}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // compact (default)
  return (
    <div
      className="rounded-md border border-[#2a1f1f] bg-[#1a0f0f]/60 px-3 py-2 text-xs text-gray-400 flex items-start gap-2"
      data-testid="disclaimer-compact"
    >
      <ShieldAlert className="h-3.5 w-3.5 text-red-400/80 shrink-0 mt-0.5" />
      <span>
        Survivor-built — not medical advice. Clear new exercises with your therapist.
        Suspect a new stroke?{" "}
        <span className="text-red-300 font-semibold">Call 911.</span>
        {extraContext && (
          <span className="block mt-1 italic text-gray-500" data-testid="disclaimer-extra-context">
            {extraContext}
          </span>
        )}
      </span>
    </div>
  );
}
