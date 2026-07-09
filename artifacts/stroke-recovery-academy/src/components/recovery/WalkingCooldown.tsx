import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Footprints, Play, Square, X } from "lucide-react";
import { MedicalDisclaimerCard } from "./MedicalDisclaimerCard";

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete: (result: { seconds: number; reaction: "good" | "hard" | "too_hard" | "skipped" }) => void;
};

// Hard safety gate before any walking exercise begins.
// User MUST acknowledge they are not alone and have clearance before timer starts.
export function WalkingCooldown({ open, onClose, onComplete }: Props) {
  const [stage, setStage] = useState<"gate" | "running" | "rate">("gate");
  const [hasSpotter, setHasSpotter] = useState(false);
  const [hasClearance, setHasClearance] = useState(false);
  const [hasDevice, setHasDevice] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  // Reset whenever the modal opens fresh.
  useEffect(() => {
    if (open) {
      setStage("gate");
      setHasSpotter(false);
      setHasClearance(false);
      setHasDevice(false);
      setSeconds(0);
      setRunning(false);
    }
  }, [open]);

  // Timer tick.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!open) return null;

  const allChecked = hasSpotter && hasClearance && hasDevice;

  const startTimer = () => {
    // Hard runtime gate — even if a malicious DOM mutation enabled the button,
    // the timer cannot start until all three safety checks are confirmed.
    if (!hasSpotter || !hasClearance || !hasDevice) return;
    setStage("running");
    setRunning(true);
  };

  const stopTimer = () => {
    setRunning(false);
    setStage("rate");
  };

  const submit = (reaction: "good" | "hard" | "too_hard") => {
    onComplete({ seconds, reaction });
  };

  const skip = () => {
    onComplete({ seconds: 0, reaction: "skipped" });
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      data-testid="walking-cooldown-modal"
    >
      <Card className="bg-[#0d0d0d] border-[#2a2a2a] max-w-lg w-full p-6 my-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Footprints className="h-5 w-5 text-[#E2741B]" />
            <h2 className="text-white font-bold text-xl">Supervised Walking Cooldown</h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-walking"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {stage === "gate" && (
          <div className="space-y-4">
            <MedicalDisclaimerCard variant="modal" />

            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                Before the timer starts, please confirm all three are true right now:
              </p>

              <label className="flex items-start gap-3 cursor-pointer rounded-md border border-[#222] p-3 hover-elevate">
                <Checkbox
                  checked={hasSpotter}
                  onCheckedChange={(v) => setHasSpotter(v === true)}
                  data-testid="checkbox-spotter"
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-200">
                  A trained partner, caregiver, or therapist is in the room with me right now and
                  can catch me if I fall.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer rounded-md border border-[#222] p-3 hover-elevate">
                <Checkbox
                  checked={hasClearance}
                  onCheckedChange={(v) => setHasClearance(v === true)}
                  data-testid="checkbox-clearance"
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-200">
                  My licensed therapist has cleared me to attempt assisted walking exercises at
                  this stage of recovery.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer rounded-md border border-[#222] p-3 hover-elevate">
                <Checkbox
                  checked={hasDevice}
                  onCheckedChange={(v) => setHasDevice(v === true)}
                  data-testid="checkbox-device"
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-200">
                  I have my walker, cane, or AFO ready as prescribed, and the floor is clear of
                  trip hazards.
                </span>
              </label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                onClick={skip}
                className="flex-1"
                data-testid="button-skip-walk"
              >
                Skip — I'm not safe to walk today
              </Button>
              <Button
                onClick={startTimer}
                disabled={!allChecked}
                className="flex-1 bg-[#E2741B] text-black font-bold disabled:opacity-40"
                data-testid="button-start-walk"
              >
                <Play className="h-4 w-4 mr-1" /> All three are true — Start
              </Button>
            </div>
          </div>
        )}

        {stage === "running" && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Walk at your safe pace</p>
            <div
              className="text-6xl font-black text-[#E2741B] tabular-nums"
              data-testid="text-walking-timer"
            >
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <p className="text-sm text-gray-400">
              Stop immediately if you feel dizzy, weak, or short of breath.
            </p>
            <Button
              onClick={stopTimer}
              size="lg"
              className="w-full bg-red-700 hover:bg-red-700 text-white font-bold"
              data-testid="button-stop-walk"
            >
              <Square className="h-4 w-4 mr-1" /> Stop Timer
            </Button>
          </div>
        )}

        {stage === "rate" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Cooldown logged</p>
              <p className="text-4xl font-black text-white tabular-nums" data-testid="text-walked-time">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </p>
              <p className="text-sm text-gray-400 mt-2">How did that feel?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                onClick={() => submit("good")}
                className="bg-emerald-700 hover:bg-emerald-700 text-white font-semibold"
                data-testid="button-walk-good"
              >
                Felt strong
              </Button>
              <Button
                onClick={() => submit("hard")}
                className="bg-amber-700 hover:bg-amber-700 text-white font-semibold"
                data-testid="button-walk-hard"
              >
                Hard but doable
              </Button>
              <Button
                onClick={() => submit("too_hard")}
                className="bg-red-800 hover:bg-red-800 text-white font-semibold"
                data-testid="button-walk-too-hard"
              >
                Too much today
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
