import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { RecoverySafetyFooter } from "@/components/recovery/RecoverySafetyFooter";
import {
  ChevronLeft,
  ShieldCheck,
  TrendingUp,
  Activity,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface Exercise {
  id: number;
  slug: string;
  name: string;
  category: string;
  position: string;
  level: string;
  domain: string;
  targets: string[];
  description: string;
  beginnerSets: number | null;
  beginnerReps: number | null;
  beginnerHoldSec: number | null;
  moderateSets: number | null;
  moderateReps: number | null;
  moderateHoldSec: number | null;
  advancedSets: number | null;
  advancedReps: number | null;
  advancedHoldSec: number | null;
  safetyNotes: string | null;
  progressionRule: string | null;
  saschPhase: string | null;
}

const SASCH_LABELS: Record<string, string> = {
  S: "Seize your current level",
  A: "Absorb feedback",
  C: "Combine with other exercises",
  H: "Hammer daily with consistency",
};

export default function RecoveryExerciseDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: ex, isLoading } = useQuery<Exercise>({
    queryKey: ["/api/recovery/exercises", slug],
  });

  useEffect(() => {
    if (ex?.name) document.title = `${ex.name} | Recovery Library`;
  }, [ex?.name]);

  const [chosenLevel, setChosenLevel] = useState<"beginner" | "moderate" | "advanced">("beginner");
  const [sets, setSets] = useState(2);
  const [reps, setReps] = useState(10);
  const [hold, setHold] = useState(0);
  const [effort, setEffort] = useState<number[]>([5]);
  const [spasticity, setSpasticity] = useState<number[]>([5]);
  const [notes, setNotes] = useState("");

  // Hydrate inputs from chosen level whenever exercise data or level changes.
  useEffect(() => {
    if (!ex) return;
    const cfg =
      chosenLevel === "beginner"
        ? { s: ex.beginnerSets, r: ex.beginnerReps, h: ex.beginnerHoldSec }
        : chosenLevel === "moderate"
          ? { s: ex.moderateSets, r: ex.moderateReps, h: ex.moderateHoldSec }
          : { s: ex.advancedSets, r: ex.advancedReps, h: ex.advancedHoldSec };
    setSets(cfg.s ?? 2);
    setReps(cfg.r ?? 10);
    setHold(cfg.h ?? 0);
  }, [ex, chosenLevel]);

  const logMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/recovery/exercise-logs", {
        exerciseId: ex!.id,
        sets,
        reps,
        holdSec: hold,
        perceivedEffort: effort[0],
        spasticityAfter: spasticity[0],
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/exercise-logs/recent"] });
      toast({
        title: "Logged. Never zero.",
        description: `${sets} × ${reps}${hold ? ` (${hold}s holds)` : ""} banked.`,
      });
      setNotes("");
    },
    onError: () =>
      toast({ title: "Couldn't log set", variant: "destructive" }),
  });

  if (isLoading || !ex) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-4">
          <Skeleton className="h-8 w-48 bg-[#1a1a1a]" />
          <Skeleton className="h-64 w-full bg-[#1a1a1a]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <Link
          href="/recovery/exercises"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover-elevate rounded-md px-2 py-1 mb-4"
          data-testid="link-back-exercises"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to library
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#E2741B] mb-1">
              {ex.category.replace(/_/g, " ")} · {ex.position}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{ex.name}</h1>
          </div>
          {ex.saschPhase && SASCH_LABELS[ex.saschPhase] && (
            <Badge className="bg-[#E2741B] text-black hover:bg-[#E2741B]" data-testid="badge-sasch">
              S.A.S.C.H · {SASCH_LABELS[ex.saschPhase]}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-6">
          {ex.targets.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="text-[11px] capitalize border-[#E2741B]/40 text-[#E2741B]"
            >
              {t.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: Description + progressions */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="bg-[#1a1a1a] border-[#333] p-5">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                How to perform
              </p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {ex.description}
              </p>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#333] p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-[#E2741B]" />
                <p className="text-xs uppercase tracking-widest text-gray-300 font-semibold">
                  Three Progression Levels
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Progression
                  label="Beginner"
                  sets={ex.beginnerSets}
                  reps={ex.beginnerReps}
                  hold={ex.beginnerHoldSec}
                  active={chosenLevel === "beginner"}
                  onClick={() => setChosenLevel("beginner")}
                  testId="progression-beginner"
                />
                <Progression
                  label="Moderate"
                  sets={ex.moderateSets}
                  reps={ex.moderateReps}
                  hold={ex.moderateHoldSec}
                  active={chosenLevel === "moderate"}
                  onClick={() => setChosenLevel("moderate")}
                  testId="progression-moderate"
                />
                <Progression
                  label="Advanced"
                  sets={ex.advancedSets}
                  reps={ex.advancedReps}
                  hold={ex.advancedHoldSec}
                  active={chosenLevel === "advanced"}
                  onClick={() => setChosenLevel("advanced")}
                  testId="progression-advanced"
                />
              </div>
              {ex.progressionRule && (
                <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                  <span className="text-[#E2741B] font-semibold">When to advance: </span>
                  {ex.progressionRule}
                </p>
              )}
            </Card>

            {ex.safetyNotes && (
              <Card className="bg-[#1a1a1a] border-[#E2741B]/40 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#E2741B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#E2741B] font-semibold mb-1">
                      Form & Safety
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed">{ex.safetyNotes}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT: Logger */}
          <div>
            <Card className="bg-[#1a1a1a] border-[#333] p-5 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-[#E2741B]" />
                <p className="text-sm font-bold text-white uppercase tracking-wide">Log this set</p>
              </div>

              {!isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400">
                    Sign in to log sets and feed your monthly Sasquatch Scale re-score.
                  </p>
                  <Link href="/recovery/login?next=/recovery/exercises">
                    <Button className="w-full bg-[#E2741B] text-black hover:bg-[#E2741B]/90">
                      Sign in
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <NumField label="Sets" value={sets} setValue={setSets} testId="input-sets" />
                    <NumField label="Reps" value={reps} setValue={setReps} testId="input-reps" />
                    <NumField label="Hold (s)" value={hold} setValue={setHold} testId="input-hold" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500">
                        Effort (RPE)
                      </p>
                      <p className="text-[10px] text-[#E2741B] font-mono">{effort[0]}/10</p>
                    </div>
                    <Slider
                      value={effort}
                      onValueChange={setEffort}
                      min={1}
                      max={10}
                      step={1}
                      data-testid="slider-effort"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500">
                        Spasticity after
                      </p>
                      <p className="text-[10px] text-[#E2741B] font-mono">{spasticity[0]}/10</p>
                    </div>
                    <Slider
                      value={spasticity}
                      onValueChange={setSpasticity}
                      min={1}
                      max={10}
                      step={1}
                      data-testid="slider-spasticity"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      1 = loose &amp; fluid · 10 = locked tight
                    </p>
                  </div>

                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (optional) — what did you feel?"
                    rows={3}
                    className="resize-none border-[#333] bg-[#0D0D0D] text-sm text-white placeholder:text-gray-500"
                    data-testid="input-notes"
                  />

                  <Button
                    className="w-full bg-[#E2741B] text-black hover:bg-[#E2741B]/90 font-bold"
                    disabled={logMutation.isPending}
                    onClick={() => logMutation.mutate()}
                    data-testid="button-log-set"
                  >
                    {logMutation.isPending ? "Logging…" : (
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Log Set
                      </span>
                    )}
                  </Button>

                  <Link
                    href="/recovery/me"
                    className="block text-center text-[11px] text-gray-500 hover:text-[#E2741B] mt-1"
                  >
                    <Sparkles className="inline h-3 w-3 mr-1" />
                    View your plan & weekly volume
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <RecoverySafetyFooter />
        </div>
      </div>
    </div>
  );
}

function Progression({
  label,
  sets,
  reps,
  hold,
  active,
  onClick,
  testId,
}: {
  label: string;
  sets: number | null;
  reps: number | null;
  hold: number | null;
  active: boolean;
  onClick: () => void;
  testId: string;
}) {
  const has = sets && reps;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={[
        "rounded-lg border p-3 text-left transition-all hover-elevate",
        active ? "border-[#E2741B] bg-[#E2741B]/10" : "border-[#333] bg-[#0D0D0D]",
      ].join(" ")}
    >
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      {has ? (
        <>
          <p className="text-lg font-bold text-white font-mono">
            {sets} × {reps}
          </p>
          {hold ? (
            <p className="text-[11px] text-[#E2741B] mt-0.5 font-mono">{hold}s hold</p>
          ) : (
            <p className="text-[11px] text-gray-500 mt-0.5">no hold</p>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-500">Not prescribed</p>
      )}
    </button>
  );
}

function NumField({
  label,
  value,
  setValue,
  testId,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  testId: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <Input
        type="number"
        min={0}
        max={999}
        value={value}
        onChange={(e) => setValue(Math.max(0, parseInt(e.target.value) || 0))}
        className="bg-[#0D0D0D] border-[#333] text-white text-center font-mono"
        data-testid={testId}
      />
    </div>
  );
}
