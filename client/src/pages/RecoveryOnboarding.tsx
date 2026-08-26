import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Brain,
  MessageSquare,
  Heart,
  Lightbulb,
  Target,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";

type Domain = "physical" | "cognitive" | "speech" | "emotional" | "memory";

const DOMAINS: {
  key: Domain;
  label: string;
  icon: any;
  description: string;
  anchorLow: string;
  anchorHigh: string;
}[] = [
  {
    key: "physical",
    label: "Physical",
    icon: Activity,
    description: "Strength, balance, coordination, mobility on your affected side.",
    anchorLow: "Mostly bed-bound, minimal voluntary movement",
    anchorHigh: "Walking confidently, full functional strength",
  },
  {
    key: "cognitive",
    label: "Cognitive",
    icon: Brain,
    description: "Thinking speed, focus, problem solving, decision making.",
    anchorLow: "Heavy fog, can't follow simple instructions",
    anchorHigh: "Sharp focus, complex problem solving restored",
  },
  {
    key: "speech",
    label: "Speech",
    icon: MessageSquare,
    description: "Word finding, pronunciation, conversation flow.",
    anchorLow: "Severe word loss / aphasia, struggle to speak",
    anchorHigh: "Fluent conversation, no noticeable deficit",
  },
  {
    key: "emotional",
    label: "Emotional",
    icon: Heart,
    description: "Mood stability, motivation, anxiety, sense of hope.",
    anchorLow: "Daily despair, no motivation, dark thoughts",
    anchorHigh: "Steady, hopeful, motivated most days",
  },
  {
    key: "memory",
    label: "Memory",
    icon: Lightbulb,
    description: "Short-term recall, names, daily events, sequencing.",
    anchorLow: "Constantly forgetting recent events / names",
    anchorHigh: "Sharp recall of names, dates, conversations",
  },
];

interface GoalDraft {
  horizon: "short" | "long";
  domain: Domain | "other";
  goal: string;
}

export default function RecoveryOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [scores, setScores] = useState<Record<Domain, number>>({
    physical: 5,
    cognitive: 5,
    speech: 5,
    emotional: 5,
    memory: 5,
  });
  const [notes, setNotes] = useState("");
  const [shortGoal, setShortGoal] = useState<GoalDraft>({
    horizon: "short",
    domain: "physical",
    goal: "",
  });
  const [longGoal, setLongGoal] = useState<GoalDraft>({
    horizon: "long",
    domain: "physical",
    goal: "",
  });
  const [draftLoaded, setDraftLoaded] = useState(false);

  // The browser draft is deliberately kept until the plan has been saved. This
  // lets a guest authenticate with any supported provider and resume safely.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("onboarding_draft");
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.scores) setScores((current) => ({ ...current, ...draft.scores }));
        if (typeof draft.notes === "string") setNotes(draft.notes);
        if (draft.shortGoal) setShortGoal((current) => ({ ...current, ...draft.shortGoal }));
        if (draft.longGoal) setLongGoal((current) => ({ ...current, ...draft.longGoal }));
        if (typeof draft.step === "number") setStep(Math.max(0, Math.min(totalSteps - 2, draft.step)));
      }
    } catch {
      sessionStorage.removeItem("onboarding_draft");
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    sessionStorage.setItem("onboarding_draft", JSON.stringify({ scores, notes, shortGoal, longGoal, step }));
  }, [draftLoaded, scores, notes, shortGoal, longGoal, step]);

  const totalSteps = DOMAINS.length + 3; // welcome + 5 domains + goals + generating
  const progressPct = Math.round((step / (totalSteps - 1)) * 100);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const assessmentRes = await apiRequest("POST", "/api/recovery/assessment", {
        ...scores,
        notes,
      });
      const assessment = await assessmentRes.json();
      const goals = [shortGoal, longGoal].filter((g) => g.goal.trim().length >= 3);
      if (goals.length > 0) {
        await apiRequest("POST", "/api/recovery/goals", { goals });
      }
      const planRes = await apiRequest("POST", "/api/recovery/plan/generate", {});
      const planData = await planRes.json();
      return { assessment, plan: planData };
    },
    onSuccess: () => {
      sessionStorage.removeItem("onboarding_draft");
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/me/state"] });
      toast({ title: "Plan ready.", description: "Welcome to your recovery OS." });
      setLocation("/recovery/today");
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't finish setup",
        description: err?.message || "Try once more.",
        variant: "destructive",
      });
      setStep(DOMAINS.length + 1); // back to goals
    },
  });

  function next() {
    if (step === totalSteps - 2) {
      if (!isAuthenticated) {
        setShowLoginPrompt(true);
        return;
      }
      setStep(totalSteps - 1);
      submitMutation.mutate();
      return;
    }
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Guest login prompt — shown when quiz is complete but not signed in */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#111] border border-[#E2741B]/30 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
            <Sparkles className="mx-auto h-10 w-10 mb-4" style={{ color: "#E2741B" }} strokeWidth={1.5} />
              <h2 className="text-2xl font-bold text-white mb-2">Save your answers</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Create your free account to save your answers and continue to your first daily action.
              It takes 30 seconds — no credit card.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-[#E2741B] text-black font-bold text-base py-3"
                onClick={() => (window.location.href = "/recovery/login?tab=signup&next=/recovery/onboarding")}
                data-testid="button-onboarding-signup"
              >
                Create Free Account
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-400 text-sm"
                onClick={() => (window.location.href = "/recovery/login?next=/recovery/onboarding")}
                data-testid="button-onboarding-signin"
              >
                Already have an account? Sign in
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-8">
          <p
            className="text-xs uppercase tracking-[0.3em] mb-2"
            style={{ color: "#E2741B" }}
          >
            Sasquatch Scale · Onboarding
          </p>
          <Progress
            value={progressPct}
            className="h-1.5 bg-[#1a1a1a]"
            data-testid="progress-onboarding"
          />
        </div>

        <Card className="bg-[#111] border-[#222] p-6 sm:p-10 rounded-md">
          {step === 0 && (
            <div className="space-y-6 text-center">
              <Sparkles
                className="mx-auto h-12 w-12"
                style={{ color: "#E2741B" }}
                strokeWidth={1.5}
              />
              <h1 className="font-serif text-3xl sm:text-4xl">Let's build your plan.</h1>
              <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
                Five quick scores. Two goals. Then your personal AI recovery
                plan — exercises, brain gym minutes, meal targets, and a weekly
                schedule. Takes about four minutes. We re-score every month so
                you can see your progress in black and white.
              </p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Not medical advice. Confirm anything new with your doctor or therapist.
              </p>
              <Button
                onClick={next}
                size="lg"
                className="text-black"
                style={{ backgroundColor: "#E2741B" }}
                data-testid="button-onboarding-start"
              >
                Start the Sasquatch Scale
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step >= 1 && step <= DOMAINS.length && (
            <DomainStep
              key={DOMAINS[step - 1].key}
              domain={DOMAINS[step - 1]}
              value={scores[DOMAINS[step - 1].key]}
              onChange={(v) =>
                setScores((s) => ({ ...s, [DOMAINS[step - 1].key]: v }))
              }
              stepNum={step}
              total={DOMAINS.length}
              notes={step === DOMAINS.length ? notes : undefined}
              onNotesChange={step === DOMAINS.length ? setNotes : undefined}
            />
          )}

          {step === DOMAINS.length + 1 && (
            <GoalsStep
              shortGoal={shortGoal}
              longGoal={longGoal}
              onShortChange={setShortGoal}
              onLongChange={setLongGoal}
            />
          )}

          {step === totalSteps - 1 && (
            <div className="py-12 text-center space-y-6">
              <Loader2
                className="mx-auto h-10 w-10 animate-spin"
                style={{ color: "#E2741B" }}
              />
              <h2 className="font-serif text-2xl">
                Sasquatch is building your plan…
              </h2>
              <p className="text-gray-400 max-w-md mx-auto">
                Crunching your scores, your goals, and what works for your phase
                of recovery. Hang tight.
              </p>
            </div>
          )}

          {step > 0 && step < totalSteps - 1 && (
            <div className="mt-10 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={back}
                className="border-[#333] bg-transparent text-gray-300"
                data-testid="button-onboarding-back"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={next}
                className="text-black"
                style={{ backgroundColor: "#E2741B" }}
                  disabled={
                    step === DOMAINS.length + 1 &&
                    shortGoal.goal.trim().length < 3
                  }
                data-testid="button-onboarding-next"
              >
                {step === DOMAINS.length + 1 ? "Generate my plan" : "Next"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function DomainStep({
  domain,
  value,
  onChange,
  stepNum,
  total,
  notes,
  onNotesChange,
}: {
  domain: (typeof DOMAINS)[number];
  value: number;
  onChange: (v: number) => void;
  stepNum: number;
  total: number;
  notes?: string;
  onNotesChange?: (v: string) => void;
}) {
  const Icon = domain.icon;
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-md"
          style={{ backgroundColor: "rgba(226,116,27,0.12)" }}
        >
          <Icon className="h-5 w-5" style={{ color: "#E2741B" }} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500">
            {stepNum} of {total}
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl">{domain.label}</h2>
        </div>
      </div>

      <p className="text-gray-400 leading-relaxed">{domain.description}</p>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-gray-500">
            Your score
          </span>
          <span
            className="text-4xl font-serif tabular-nums"
            style={{ color: "#E2741B" }}
            data-testid={`text-score-${domain.key}`}
          >
            {value}
          </span>
        </div>
        <Slider
          value={[value]}
          min={1}
          max={10}
          step={1}
          onValueChange={(v) => onChange(v[0])}
          aria-label={`${domain.label} score, 1 to 10`}
          data-testid={`slider-${domain.key}`}
        />
        <div className="flex justify-between text-xs text-gray-500 leading-snug gap-4">
          <span className="max-w-[45%]">1 — {domain.anchorLow}</span>
          <span className="max-w-[45%] text-right">10 — {domain.anchorHigh}</span>
        </div>
      </div>

      {onNotesChange !== undefined && (
        <div className="space-y-2 pt-4 border-t border-[#222]">
          <label className="text-xs uppercase tracking-widest text-gray-500">
            Anything Sasquatch should know? (optional)
          </label>
          <Textarea
            value={notes || ""}
            onChange={(e) => onNotesChange(e.target.value)}
            maxLength={1000}
            placeholder="Affected side, time since stroke, current therapy, what's hardest right now…"
            className="bg-[#0a0a0a] border-[#222] text-white"
            rows={4}
            data-testid="input-onboarding-notes"
          />
        </div>
      )}
    </div>
  );
}

function GoalsStep({
  shortGoal,
  longGoal,
  onShortChange,
  onLongChange,
}: {
  shortGoal: GoalDraft;
  longGoal: GoalDraft;
  onShortChange: (g: GoalDraft) => void;
  onLongChange: (g: GoalDraft) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-md"
          style={{ backgroundColor: "rgba(226,116,27,0.12)" }}
        >
          <Target className="h-5 w-5" style={{ color: "#E2741B" }} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Goals
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl">
                    What would feel useful next?
          </h2>
        </div>
      </div>

      <p className="text-gray-400 leading-relaxed">
        A small target can help us make today useful. A longer-term target is
        optional — you can add it when it feels right.
      </p>

      <GoalCard
        title="30-day target"
        goal={shortGoal}
        onChange={onShortChange}
        placeholder="e.g. Stand up from chair 10x without using my hand"
      />
      <GoalCard
        title="Longer-term target (optional)"
        goal={longGoal}
        onChange={onLongChange}
        placeholder="e.g. Walk a full mile outside, conversation pace"
      />
    </div>
  );
}

function GoalCard({
  title,
  goal,
  onChange,
  placeholder,
}: {
  title: string;
  goal: GoalDraft;
  onChange: (g: GoalDraft) => void;
  placeholder: string;
}) {
  const domains: Array<GoalDraft["domain"]> = [
    "physical",
    "cognitive",
    "speech",
    "emotional",
    "memory",
    "other",
  ];
  return (
    <div className="rounded-md border border-[#222] bg-[#0a0a0a] p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p
          className="text-sm font-semibold uppercase tracking-widest"
          style={{ color: "#E2741B" }}
        >
          {title}
        </p>
        <div className="flex flex-wrap gap-1">
          {domains.map((d) => {
            const isOn = goal.domain === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ ...goal, domain: d })}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide border transition-colors ${
                  isOn
                    ? "border-[#E2741B] text-black"
                    : "border-[#333] text-gray-400 hover-elevate"
                }`}
                style={isOn ? { backgroundColor: "#E2741B" } : undefined}
                data-testid={`button-goal-domain-${goal.horizon}-${d}`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
      <Input
        value={goal.goal}
        onChange={(e) => onChange({ ...goal, goal: e.target.value })}
        maxLength={240}
        placeholder={placeholder}
        className="bg-[#0a0a0a] border-[#333] text-white"
        data-testid={`input-goal-${goal.horizon}`}
      />
      <p className="text-xs text-gray-500">{goal.goal.length}/240</p>
    </div>
  );
}
