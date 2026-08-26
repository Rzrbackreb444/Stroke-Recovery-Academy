import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Flame, Footprints,
  HeartPulse, Sparkles, Trophy, Calendar, AlertCircle, Mic,
} from "lucide-react";
import {
  LEVELS, getSequentialTasks, personalizeSequence, todayStr,
  type SequentialTask, type TodayRecommendation,
} from "@/lib/recoveryRoutine";
import { MedicalDisclaimerCard } from "@/components/recovery/MedicalDisclaimerCard";
import { WalkingCooldown } from "@/components/recovery/WalkingCooldown";

type Reaction = "good" | "hard" | "too_hard";
type Recommendation = TodayRecommendation;

export default function RecoveryToday() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [stage, setStage] = useState<"intro" | "session" | "walk" | "complete">("intro");
  const [chosenLevel, setChosenLevel] = useState<number | null>(null);
  const [taskIdx, setTaskIdx] = useState(0);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [showWalkModal, setShowWalkModal] = useState(false);
  const [walkLogged, setWalkLogged] = useState<null | {
    seconds: number;
    reaction: "good" | "hard" | "too_hard" | "skipped";
  }>(null);

  // Recommendation from backend.
  const { data: rec, isLoading: recLoading, isError: recError } = useQuery<Recommendation>({
    queryKey: ["/api/recovery/today/recommendation"],
    enabled: !!user,
    retry: 1,
  });

  // Hydrate chosenLevel from recommendation.
  // Hard safe fallback: if the recommendation API fails, default to Seated (level 2)
  // and show a warning so the user can still start a session.
  useEffect(() => {
    if (rec && chosenLevel === null) {
      setChosenLevel(rec.level);
    } else if (recError && chosenLevel === null) {
      setChosenLevel(2);
    }
  }, [rec, recError, chosenLevel]);

  const feedbackMutation = useMutation({
    mutationFn: (payload: { taskId: string; level: number; reaction: Reaction | "skipped"; date: string }) =>
      apiRequest("POST", "/api/recovery/today/feedback", payload),
  });

  const sequence: SequentialTask[] = useMemo(() => {
    if (chosenLevel === null) return [];
    if (rec?.personalization?.applied) {
      return personalizeSequence(chosenLevel, rec.personalization);
    }
    return getSequentialTasks(chosenLevel);
  }, [chosenLevel, rec?.personalization]);

  const goalCount = useMemo(
    () => sequence.filter((t) => t.priority === "goal").length,
    [sequence]
  );

  const current: SequentialTask | undefined = sequence[taskIdx];
  const total = sequence.length;
  const pct = total > 0 ? Math.round(((taskIdx) / total) * 100) : 0;

  const recordAndAdvance = (reaction: Reaction) => {
    if (!current || chosenLevel === null) return;
    setReactions((p) => ({ ...p, [current.id]: reaction }));
    feedbackMutation.mutate({
      taskId: current.id,
      level: chosenLevel,
      reaction,
      date: todayStr(),
    });

    const next = taskIdx + 1;
    if (next >= sequence.length) {
      // End of sequence — surface the walking cooldown only when the user's
      // CHOSEN level is ambulatory (>=3). The backend recommendation is
      // advisory; the user's manual override is the source of truth.
      const ambulatory = (chosenLevel ?? 0) >= 3;
      setStage(ambulatory ? "walk" : "complete");
    } else {
      setTaskIdx(next);
    }
  };

  const skipCurrent = () => {
    if (!current) return;
    feedbackMutation.mutate({
      taskId: current.id,
      level: chosenLevel ?? 2,
      reaction: "skipped",
      date: todayStr(),
    });
    const next = taskIdx + 1;
    if (next >= sequence.length) {
      const ambulatory = (chosenLevel ?? 0) >= 3;
      setStage(ambulatory ? "walk" : "complete");
    } else {
      setTaskIdx(next);
    }
  };

  const goBack = () => {
    if (taskIdx > 0) setTaskIdx(taskIdx - 1);
  };

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (authLoading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
        <Card className="bg-[#111] border-[#222] p-8 max-w-sm w-full text-center">
          <Flame className="h-10 w-10 text-[#E2741B] mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-2">Sign In to Light the Bonfire</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your daily session adapts to how yesterday went — sign in so we remember.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/recovery/login")}
            className="w-full bg-[#E2741B] text-black font-bold"
            data-testid="button-sign-in-bonfire"
          >
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  // ── INTRO STAGE: show recommendation, accept or change level ─────────────
  if (stage === "intro") {
    const lvl = chosenLevel !== null ? LEVELS[chosenLevel] : null;
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => setLocation("/recovery/today")}
            className="text-gray-500 hover:text-[#E2741B] text-sm mb-6 flex items-center gap-1 transition-colors"
            data-testid="link-back-dashboard"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </button>

          <p className="text-xs text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-4xl sm:text-5xl font-display text-white mb-2">
            Today
          </h1>
          <p className="text-gray-400 text-base mb-6">
            Today's session — one rep at a time. We'll listen to your body and adjust as we go.
          </p>

          <MedicalDisclaimerCard variant="full" />

          {recLoading && !lvl ? (
            <Card className="bg-[#111] border-[#222] p-8 mt-6 text-center">
              <p className="text-gray-500 text-sm">Reading yesterday's notes…</p>
            </Card>
          ) : !lvl ? (
            <Card className="bg-[#111] border-[#222] p-8 mt-6 text-center">
              <p className="text-gray-500 text-sm">Loading your session…</p>
            </Card>
          ) : (
            <Card className="bg-[#111] border-[#222] p-6 mt-6" data-testid="card-recommendation">
              {recError && (
                <div className="mb-4 rounded-md border border-amber-700/50 bg-amber-950/30 p-3 flex items-start gap-2" data-testid="banner-rec-fallback">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-100/90">
                    Couldn't reach yesterday's notes — defaulting to <strong>Seated</strong>.
                    Adjust below if today calls for a different level.
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                <Sparkles className="h-3 w-3 inline mr-1 text-[#E2741B]" />
                Recommended for today
              </p>
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="h-12 w-12 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${lvl.color}25`, border: `1px solid ${lvl.color}` }}
                >
                  <lvl.icon className="h-6 w-6" style={{ color: lvl.color }} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white" data-testid="text-rec-level">{lvl.name}</p>
                  <p className="text-sm text-gray-400">{lvl.description}</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed border-t border-[#222] pt-3" data-testid="text-rec-reason">
                {rec?.reason}
              </p>

              {/* Adjust level */}
              <div className="mt-5">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                  Want to adjust? Pick a different level
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {LEVELS.map((l) => {
                    const Icon = l.icon;
                    const active = chosenLevel === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setChosenLevel(l.id)}
                        data-testid={`button-pick-level-${l.id}`}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-md border transition-all ${
                          active ? `${l.accent} bg-[#191919]` : "border-[#1e1e1e] bg-[#0a0a0a] hover-elevate"
                        }`}
                      >
                        <Icon className="h-4 w-4" style={{ color: active ? l.color : "#555" }} />
                        <span className="text-[9px] font-bold uppercase leading-none text-center" style={{ color: active ? l.color : "#666" }}>
                          {l.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => { setStage("session"); setTaskIdx(0); }}
                className="w-full mt-6 bg-[#E2741B] text-black font-bold"
                data-testid="button-begin-bonfire"
              >
                <Flame className="h-4 w-4 mr-1.5" />
                Light the Bonfire — Begin {lvl.name}
              </Button>
              <p className="text-xs text-gray-600 text-center mt-2">
                {sequence.length} steps · about {Math.max(5, Math.round(sequence.length * 1.5))} minutes
              </p>

              {rec?.personalization?.applied && (
                <div
                  className="mt-4 rounded-md border border-[#E2741B]/30 bg-[#E2741B]/5 p-3 text-xs text-gray-300"
                  data-testid="banner-personalization"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#E2741B] mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Tailored from your intake
                  </p>
                  <ul className="space-y-1 leading-relaxed">
                    {rec.personalization.energyPattern && (
                      <li>
                        Sequence ordered for your <strong className="text-white">{rec.personalization.energyPattern}</strong> energy peak.
                      </li>
                    )}
                    {rec.personalization.timeBudgetMinutes ? (
                      <li>
                        Trimmed to fit your <strong className="text-white">{rec.personalization.timeBudgetMinutes}-minute</strong> daily time budget.
                      </li>
                    ) : null}
                    {goalCount > 0 && (
                      <li>
                        <strong className="text-[#E2741B]">{goalCount}</strong> {goalCount === 1 ? "task" : "tasks"} marked as <strong className="text-white">your goal</strong>.
                      </li>
                    )}
                    {rec.personalization.capReason && (
                      <li className="text-amber-300/90">{rec.personalization.capReason}</li>
                    )}
                  </ul>
                  <p className="text-[10px] text-gray-600 mt-2">
                    <Link href="/settings/profile" className="underline hover:text-[#E2741B]" data-testid="link-edit-intake">
                      Update your intake →
                    </Link>
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ── SESSION STAGE: one task at a time ────────────────────────────────────
  if (stage === "session" && current) {
    const Icon = current.icon || current.blockIcon;
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
        {/* Top progress bar */}
        <div className="px-4 pt-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={goBack}
              disabled={taskIdx === 0}
              className="text-gray-500 hover:text-[#E2741B] text-xs flex items-center gap-1 disabled:opacity-30"
              data-testid="button-back-task"
            >
              <ArrowLeft className="h-3 w-3" />
            </button>
            <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E2741B] transition-all duration-300"
                style={{ width: `${pct}%` }}
                data-testid="progress-bonfire"
              />
            </div>
            <span className="text-xs text-gray-500 tabular-nums" data-testid="text-step-count">
              {taskIdx + 1} / {total}
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-xl w-full">
            <p className="text-xs text-[#E2741B] uppercase tracking-widest mb-3 flex items-center gap-2 justify-center">
              <current.blockIcon className="h-3.5 w-3.5" />
              {current.blockLabel} · {current.blockTime}
            </p>

            <Card className="bg-[#111] border-[#1e1e1e] p-8 text-center" data-testid="card-current-task">
              {current.priority === "goal" && (
                <Badge
                  className="mb-4 bg-[#E2741B] text-black hover:bg-[#E2741B] border-0 gap-1"
                  data-testid="badge-goal-task"
                >
                  <Sparkles className="h-3 w-3" />
                  {current.goalReason || "Your goal"}
                </Badge>
              )}
              <div className="h-14 w-14 mx-auto mb-5 rounded-full bg-[#E2741B]/15 border border-[#E2741B]/40 flex items-center justify-center">
                <Icon className="h-7 w-7 text-[#E2741B]" />
              </div>
              <p
                className="text-2xl sm:text-3xl text-white leading-snug font-medium"
                data-testid="text-current-task"
              >
                {current.text}
              </p>
            </Card>

            <p className="text-xs text-gray-500 text-center mt-6 mb-3 uppercase tracking-widest">
              Done? Tell us how it felt
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                onClick={() => recordAndAdvance("good")}
                className="bg-emerald-700 hover:bg-emerald-700 text-white font-semibold"
                data-testid="button-react-good"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Felt strong
              </Button>
              <Button
                onClick={() => recordAndAdvance("hard")}
                className="bg-amber-700 hover:bg-amber-700 text-white font-semibold"
                data-testid="button-react-hard"
              >
                Hard but doable
              </Button>
              <Button
                onClick={() => recordAndAdvance("too_hard")}
                className="bg-red-800 hover:bg-red-800 text-white font-semibold"
                data-testid="button-react-too-hard"
              >
                Too much today
              </Button>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={skipCurrent}
                className="text-xs text-gray-500 hover:text-gray-300 underline-offset-2 hover:underline"
                data-testid="button-skip-task"
              >
                Skip this one
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pb-6">
          <div className="max-w-2xl mx-auto">
            <MedicalDisclaimerCard variant="compact" />
          </div>
        </div>
      </div>
    );
  }

  // ── WALK STAGE: open the walking modal automatically ─────────────────────
  if (stage === "walk") {
    if (!showWalkModal && !walkLogged) {
      setShowWalkModal(true);
    }
    return (
      <>
        <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-6">
          <Card className="bg-[#111] border-[#222] p-8 max-w-md w-full text-center">
            <Footprints className="h-10 w-10 text-[#E2741B] mx-auto mb-4" />
            <h2 className="text-white font-bold text-2xl mb-2">Time for the cooldown walk</h2>
            <p className="text-gray-400 text-sm mb-6">
              Open the supervised walking module to log your distance and how it felt.
            </p>
            <Button
              size="lg"
              onClick={() => setShowWalkModal(true)}
              className="w-full bg-[#E2741B] text-black font-bold"
              data-testid="button-open-walk"
            >
              <Footprints className="h-4 w-4 mr-1.5" /> Open Walking Cooldown
            </Button>
            <button
              onClick={() => { setWalkLogged({ seconds: 0, reaction: "skipped" }); setStage("complete"); }}
              className="text-xs text-gray-500 hover:text-gray-300 mt-3"
              data-testid="button-skip-walk-stage"
            >
              Skip — not safe to walk today
            </button>
          </Card>
        </div>
        <WalkingCooldown
          open={showWalkModal}
          onClose={() => setShowWalkModal(false)}
          onComplete={(result) => {
            setShowWalkModal(false);
            setWalkLogged(result);
            // Log walk as a special feedback row.
            feedbackMutation.mutate({
              taskId: "walk_cooldown",
              level: chosenLevel ?? 3,
              reaction: result.reaction,
              date: todayStr(),
            });
            queryClient.invalidateQueries({ queryKey: ["/api/recovery/today/recommendation"] });
            setStage("complete");
          }}
        />
      </>
    );
  }

  // ── COMPLETE STAGE: celebration + summary ────────────────────────────────
  const goodCount = Object.values(reactions).filter((r) => r === "good").length;
  const hardCount = Object.values(reactions).filter((r) => r === "hard").length;
  const tooHardCount = Object.values(reactions).filter((r) => r === "too_hard").length;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-gradient-to-br from-[#E2741B]/15 via-[#111] to-[#111] border-[#E2741B]/40 p-8 text-center" data-testid="card-complete">
          <Trophy className="h-12 w-12 text-[#E2741B] mx-auto mb-4" />
          <p className="text-xs text-[#E2741B] uppercase tracking-widest mb-2">Bonfire Complete</p>
          <h2 className="text-3xl sm:text-4xl font-display text-white mb-3">
            You showed up. That's the work.
          </h2>
          <p className="text-gray-300 text-sm">
            We'll use today's signal to shape tomorrow's session.
          </p>
        </Card>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Card className="bg-[#111] border-[#222] p-4 text-center">
            <p className="text-2xl font-black text-emerald-400 tabular-nums" data-testid="stat-good">{goodCount}</p>
            <p className="text-xs text-gray-500 mt-1">Felt strong</p>
          </Card>
          <Card className="bg-[#111] border-[#222] p-4 text-center">
            <p className="text-2xl font-black text-amber-400 tabular-nums" data-testid="stat-hard">{hardCount}</p>
            <p className="text-xs text-gray-500 mt-1">Hard</p>
          </Card>
          <Card className="bg-[#111] border-[#222] p-4 text-center">
            <p className="text-2xl font-black text-red-400 tabular-nums" data-testid="stat-too-hard">{tooHardCount}</p>
            <p className="text-xs text-gray-500 mt-1">Too much</p>
          </Card>
        </div>

        {walkLogged && walkLogged.reaction !== "skipped" && (
          <Card className="bg-[#111] border-[#222] p-4 mt-3 flex items-center gap-3" data-testid="card-walk-summary">
            <Footprints className="h-5 w-5 text-[#E2741B]" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-widest">Walking cooldown</p>
              <p className="text-white font-semibold">
                {Math.floor(walkLogged.seconds / 60)}m {walkLogged.seconds % 60}s ·{" "}
                <span className="text-gray-400 capitalize font-normal">{walkLogged.reaction.replace("_", " ")}</span>
              </p>
            </div>
          </Card>
        )}

        {tooHardCount >= 2 && (
          <Card className="bg-[#1a0f0f]/60 border-[#3a2222] p-4 mt-3 flex items-start gap-3" data-testid="card-back-off">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-red-300 mb-1">Heads up</p>
              <p>
                You hit "too much" {tooHardCount} times today. Tomorrow we'll suggest backing down a level. If pain or symptoms worsen, contact your therapist.
              </p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          <Link href="/recovery/today">
            <Button variant="outline" className="w-full" data-testid="button-back-dashboard-complete">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Today
            </Button>
          </Link>
          <Link href="/recovery/community">
            <Button className="w-full bg-[#E2741B] text-black font-bold" data-testid="button-share-win">
              <HeartPulse className="h-4 w-4 mr-1.5" /> Share a Win
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        <div className="mt-6">
          <MedicalDisclaimerCard variant="compact" />
        </div>
      </div>
    </div>
  );
}
