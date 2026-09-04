import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Mic,
  MicOff,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useSurvivorProfile, type SurvivorProfile } from "@/hooks/useSurvivorProfile";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Draft = Partial<SurvivorProfile>;

const STEPS = [
  "welcome",
  "identity",
  "stroke",
  "deficits",
  "goals",
  "equipment",
  "daily-life",
  "caregiver",
  "accessibility",
  "story",
  "review",
] as const;

const TOTAL_STEPS = STEPS.length;

const STROKE_TYPES: { value: NonNullable<SurvivorProfile["strokeType"]>; label: string; help: string }[] = [
  { value: "ischemic", label: "Ischemic", help: "Blocked artery — about 87% of strokes" },
  { value: "hemorrhagic", label: "Hemorrhagic", help: "Bleed in the brain" },
  { value: "tia", label: "TIA / Mini-stroke", help: "Brief, no permanent damage" },
  { value: "unknown", label: "I'm not sure", help: "That's okay — we can adapt" },
];

const SIDES: { value: NonNullable<SurvivorProfile["affectedSide"]>; label: string }[] = [
  { value: "left", label: "Left side" },
  { value: "right", label: "Right side" },
  { value: "both", label: "Both sides" },
  { value: "none", label: "Neither" },
  { value: "unsure", label: "Not sure" },
];

const DEFICIT_LABELS: { key: keyof NonNullable<SurvivorProfile["deficits"]>; label: string; hint: string }[] = [
  { key: "motor", label: "Movement / weakness", hint: "Arm, hand, leg, foot strength" },
  { key: "speech", label: "Speech / aphasia", hint: "Finding words, speaking, understanding" },
  { key: "cognitive", label: "Memory / focus", hint: "Concentration, problem solving" },
  { key: "fatigue", label: "Fatigue", hint: "Energy, stamina through the day" },
  { key: "vision", label: "Vision", hint: "Field cuts, double vision" },
  { key: "swallowing", label: "Swallowing", hint: "Dysphagia, choking risk" },
  { key: "emotional", label: "Mood / emotions", hint: "Depression, frustration, PBA" },
  { key: "sensory", label: "Sensation", hint: "Numbness, tingling, neuropathy" },
];

const SEVERITY_LABEL = ["None", "Mild", "Moderate", "Severe", "Complete"];

const GOAL_OPTIONS = [
  "Walk independently",
  "Speak clearly",
  "Use my hand again",
  "Drive again",
  "Return to work",
  "Play with my kids/grandkids",
  "Exercise daily",
  "Sleep better",
  "Manage fatigue",
  "Find community",
  "Tell my story",
  "Travel again",
];

const EQUIPMENT_OPTIONS = [
  "Resistance bands",
  "Light weights",
  "Treadmill",
  "Stationary bike",
  "Yoga mat",
  "Therapy putty",
  "Theraband",
  "Pool access",
  "Standing desk",
  "Smartwatch / fitness tracker",
];

const MOBILITY_OPTIONS = [
  "Wheelchair",
  "Walker",
  "Cane",
  "AFO / ankle brace",
  "Hand splint",
  "Shower chair",
  "Grab bars",
  "None",
];

const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse / partner" },
  { value: "child", label: "Adult child" },
  { value: "parent", label: "Parent" },
  { value: "friend", label: "Friend" },
  { value: "professional", label: "Professional caregiver" },
  { value: "other", label: "Other" },
];

export default function SurvivorIntake() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, patch, complete, isLoading } = useSurvivorProfile();
  const { toast } = useToast();
  const [stepIdx, setStepIdx] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const initialized = useRef(false);

  // Hydrate draft + resume from saved currentIntakeStep
  useEffect(() => {
    if (initialized.current) return;
    if (isLoading || authLoading) return;
    if (profile) {
      setDraft(profile);
      const resume = Math.max(0, Math.min(profile.currentIntakeStep ?? 0, TOTAL_STEPS - 1));
      setStepIdx(resume);
    }
    initialized.current = true;
  }, [profile, isLoading, authLoading]);

  // Bounce unauthenticated visitors to login (preserve return path)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/api/login?returnTo=/recovery/intake";
    }
  }, [authLoading, isAuthenticated]);

  // Debounced save-as-you-go
  const debounceRef = useRef<number | null>(null);
  const queueSave = (next: Draft) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const { id, userId, intakeCompletedAt, intakeComplete, updatedAt, ...patchable } = next as any;
       patch({ ...patchable, profileSource: "survivor_intake" }).catch(() => {});
    }, 700);
  };

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      queueSave(next);
      return next;
    });
  };

  const updateDeficit = (key: keyof NonNullable<SurvivorProfile["deficits"]>, value: number) => {
    setDraft((prev) => {
      const next = {
        ...prev,
        deficits: { ...(prev.deficits || {}), [key]: value },
      };
      queueSave(next);
      return next;
    });
  };

  const toggleArrayValue = (key: keyof Draft, value: string) => {
    setDraft((prev) => {
      const list = (prev[key] as string[] | null | undefined) || [];
      const exists = list.includes(value);
      const nextList = exists ? list.filter((v) => v !== value) : [...list, value];
      const next = { ...prev, [key]: nextList } as Draft;
      queueSave(next);
      return next;
    });
  };

  const stepName = STEPS[stepIdx];
  const progress = Math.round(((stepIdx + 1) / TOTAL_STEPS) * 100);
  const isFinal = stepIdx === TOTAL_STEPS - 1;

  const goNext = async () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const next = Math.min(stepIdx + 1, TOTAL_STEPS - 1);
    const { id, userId, intakeCompletedAt, intakeComplete, updatedAt, ...patchable } = draft as any;
    try {
       await patch({ ...patchable, currentIntakeStep: next, profileSource: "survivor_intake" });
    } catch (e: any) {
      toast({
        title: "Couldn't save your last step",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
      return;
    }
    setStepIdx(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStepIdx((s) => Math.max(0, s - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleComplete = async () => {
    try {
      await complete();
      toast({
        title: "Profile complete",
        description: "Your dashboard is now tuned to your recovery.",
      });
      navigate("/recovery/dashboard");
    } catch (e: any) {
      toast({
        title: "Couldn't finish",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-gray-300 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#E2741B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#E2741B]">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider font-semibold">Survivor Intake</span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/recovery/dashboard")}
            className="text-xs text-gray-500 hover:text-gray-300 underline-offset-2 hover:underline"
            data-testid="link-skip-intake"
          >
            Skip for now
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1.5 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
            <div
              className="h-full bg-[#E2741B] transition-all duration-500"
              style={{ width: `${progress}%` }}
              data-testid="progress-intake"
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] uppercase tracking-wide text-gray-500">
            <span data-testid="text-step-counter">Step {stepIdx + 1} of {TOTAL_STEPS}</span>
            <span>Auto-saving</span>
          </div>
        </div>

        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-6 sm:p-8">
            {stepName === "welcome" && <WelcomeStep userName={user?.firstName || user?.email?.split("@")[0]} />}
            {stepName === "identity" && (
              <IdentityStep
                preferredName={draft.preferredName}
                pronouns={draft.pronouns}
                onChange={(k, v) => update(k as any, v)}
              />
            )}
            {stepName === "stroke" && (
              <StrokeStep
                strokeType={draft.strokeType ?? null}
                strokeDate={draft.strokeDate ?? null}
                affectedSide={draft.affectedSide ?? null}
                onChange={(k, v) => update(k as any, v)}
              />
            )}
            {stepName === "deficits" && (
              <DeficitsStep deficits={draft.deficits || {}} onChange={updateDeficit} />
            )}
            {stepName === "goals" && (
              <GoalsStep
                selected={draft.recoveryGoals || []}
                customGoal={draft.customGoal}
                challenges={draft.currentChallenges || []}
                onToggleGoal={(v) => toggleArrayValue("recoveryGoals", v)}
                onToggleChallenge={(v) => toggleArrayValue("currentChallenges", v)}
                onCustomChange={(v) => update("customGoal", v)}
              />
            )}
            {stepName === "equipment" && (
              <EquipmentStep
                equipment={draft.equipment || []}
                aids={draft.mobilityAids || []}
                onToggleEquip={(v) => toggleArrayValue("equipment", v)}
                onToggleAid={(v) => toggleArrayValue("mobilityAids", v)}
              />
            )}
            {stepName === "daily-life" && (
              <DailyLifeStep
                minutes={draft.dailyTimeBudgetMinutes ?? 20}
                energy={draft.energyPattern ?? "morning"}
                onMinutes={(v) => update("dailyTimeBudgetMinutes", v)}
                onEnergy={(v) => update("energyPattern", v as any)}
              />
            )}
            {stepName === "caregiver" && (
              <CaregiverStep
                hasCaregiver={!!draft.hasCaregiver}
                email={draft.caregiverEmail}
                relationship={draft.caregiverRelationship}
                onHas={(v) => update("hasCaregiver", v)}
                onEmail={(v) => update("caregiverEmail", v)}
                onRelationship={(v) => update("caregiverRelationship", v)}
              />
            )}
            {stepName === "accessibility" && (
              <AccessibilityStep
                bigButtonMode={!!draft.bigButtonMode}
                dyslexiaFont={!!draft.dyslexiaFont}
                reducedMotion={!!draft.reducedMotion}
                voicePrefersTts={!!draft.voicePrefersTts}
                onChange={(k, v) => update(k as any, v)}
              />
            )}
            {stepName === "story" && (
              <StoryStep
                story={draft.story}
                onChange={(v) => update("story", v)}
              />
            )}
            {stepName === "review" && (
              <ReviewStep draft={draft} onJump={(idx) => setStepIdx(idx)} />
            )}
          </CardContent>
        </Card>

        {/* Footer nav */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={stepIdx === 0}
            className="text-gray-400 hover:text-white"
            data-testid="button-intake-back"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {!isFinal ? (
            <Button
              onClick={goNext}
              className="bg-[#E2741B] hover:bg-[#B8851A] text-black font-bold"
              data-testid="button-intake-next"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="bg-[#E2741B] hover:bg-[#B8851A] text-black font-bold"
              data-testid="button-intake-complete"
            >
              <Check className="w-4 h-4 mr-1" /> Finish profile
            </Button>
          )}
        </div>

        <p className="mt-6 text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3 h-3" /> Stored in your account to personalize recovery. See our Privacy Policy for AI processing, retention, deletion, and support access.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step components
// ─────────────────────────────────────────────────────────────────────────────

function WelcomeStep({ userName }: { userName?: string }) {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#E2741B]/15 border border-[#E2741B]/40 flex items-center justify-center">
        <Heart className="w-7 h-7 text-[#E2741B]" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black mb-3" data-testid="text-intake-title">
        {userName ? `Welcome, ${userName}.` : "Welcome, survivor."}
      </h1>
      <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
        Five minutes here gives every screen, exercise, and Coach reply something to work with.
        Your answers are saved to your account. When you use the AI Coach, the information you choose to share may be processed by our AI provider to generate a reply. Support staff may access account information when needed to provide support, safety, or prevent abuse. You can skip anything that doesn't feel right.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
        <Stat label="Total time" value="~5 min" />
        <Stat label="Steps" value="10" />
        <Stat label="Save" value="As you go" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#333] bg-[#0D0D0D] p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-base font-bold text-white">{value}</div>
    </div>
  );
}

function IdentityStep({
  preferredName,
  pronouns,
  onChange,
}: {
  preferredName: string | null | undefined;
  pronouns: string | null | undefined;
  onChange: (k: "preferredName" | "pronouns", v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader title="What should we call you?" subtitle="Coach uses this everywhere." />
      <div className="space-y-2">
        <Label htmlFor="preferred-name">Preferred name</Label>
        <Input
          id="preferred-name"
          value={preferredName ?? ""}
          onChange={(e) => onChange("preferredName", e.target.value)}
          placeholder="Nick"
          className="bg-[#0D0D0D] border-[#333]"
          data-testid="input-preferred-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pronouns">Pronouns (optional)</Label>
        <Input
          id="pronouns"
          value={pronouns ?? ""}
          onChange={(e) => onChange("pronouns", e.target.value)}
          placeholder="he/him, she/her, they/them"
          className="bg-[#0D0D0D] border-[#333]"
          data-testid="input-pronouns"
        />
      </div>
    </div>
  );
}

function StrokeStep({
  strokeType,
  strokeDate,
  affectedSide,
  onChange,
}: {
  strokeType: SurvivorProfile["strokeType"];
  strokeDate: SurvivorProfile["strokeDate"];
  affectedSide: SurvivorProfile["affectedSide"];
  onChange: (k: "strokeType" | "strokeDate" | "affectedSide", v: any) => void;
}) {
  const dateValue = strokeDate ? new Date(strokeDate).toISOString().slice(0, 10) : "";
  return (
    <div className="space-y-6">
      <StepHeader title="Your stroke" subtitle="Skip anything you don't want to share." />
      <div className="space-y-3">
        <Label>Type of stroke</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STROKE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange("strokeType", t.value)}
              className={`text-left rounded-md border p-3 hover-elevate transition-colors ${
                strokeType === t.value
                  ? "border-[#E2741B] bg-[#E2741B]/10"
                  : "border-[#333] bg-[#0D0D0D]"
              }`}
              data-testid={`option-stroke-type-${t.value}`}
            >
              <div className="font-semibold text-sm">{t.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{t.help}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stroke-date">When did it happen? (optional)</Label>
        <Input
          id="stroke-date"
          type="date"
          value={dateValue}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onChange("strokeDate", e.target.value || null)}
          className="bg-[#0D0D0D] border-[#333]"
          data-testid="input-stroke-date"
        />
      </div>

      <div className="space-y-3">
        <Label>Side affected</Label>
        <div className="flex flex-wrap gap-2">
          {SIDES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange("affectedSide", s.value)}
              className={`rounded-md border px-3 py-1.5 text-sm hover-elevate transition-colors ${
                affectedSide === s.value
                  ? "border-[#E2741B] bg-[#E2741B]/10 text-white"
                  : "border-[#333] bg-[#0D0D0D] text-gray-300"
              }`}
              data-testid={`option-side-${s.value}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeficitsStep({
  deficits,
  onChange,
}: {
  deficits: NonNullable<SurvivorProfile["deficits"]>;
  onChange: (k: keyof NonNullable<SurvivorProfile["deficits"]>, v: number) => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        title="What are you working with?"
        subtitle="Drag each slider. None → Mild → Moderate → Severe → Complete."
      />
      <div className="space-y-5">
        {DEFICIT_LABELS.map(({ key, label, hint }) => {
          const v = deficits[key] ?? 0;
          return (
            <div key={key} className="space-y-2" data-testid={`deficit-row-${key}`}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-xs text-gray-500">{hint}</div>
                </div>
                <div className="text-xs font-semibold text-[#E2741B] whitespace-nowrap" data-testid={`deficit-value-${key}`}>
                  {SEVERITY_LABEL[v]}
                </div>
              </div>
              <Slider
                value={[v]}
                min={0}
                max={4}
                step={1}
                onValueChange={(arr) => onChange(key, arr[0] ?? 0)}
                data-testid={`slider-deficit-${key}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalsStep({
  selected,
  customGoal,
  challenges,
  onToggleGoal,
  onToggleChallenge,
  onCustomChange,
}: {
  selected: string[];
  customGoal: string | null | undefined;
  challenges: string[];
  onToggleGoal: (v: string) => void;
  onToggleChallenge: (v: string) => void;
  onCustomChange: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader title="What do you want back?" subtitle="Pick anything that matters. Add your own at the end." />
      <ChipGroup
        options={GOAL_OPTIONS}
        selected={selected}
        onToggle={onToggleGoal}
        testIdPrefix="chip-goal"
      />
      <div className="space-y-2">
        <Label htmlFor="custom-goal">Your own words (optional)</Label>
        <Input
          id="custom-goal"
          value={customGoal ?? ""}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="e.g. Hold my granddaughter on my left arm again"
          className="bg-[#0D0D0D] border-[#333]"
          data-testid="input-custom-goal"
        />
      </div>

      <div>
        <div className="text-sm font-semibold mb-2 mt-2">What's hardest right now?</div>
        <ChipGroup
          options={[
            "Fatigue crashes",
            "Losing words",
            "Hand stiffness (spasticity)",
            "Sleep",
            "Mood / depression",
            "Isolation",
            "Insurance / cost",
            "Driving",
          ]}
          selected={challenges}
          onToggle={onToggleChallenge}
          testIdPrefix="chip-challenge"
        />
      </div>
    </div>
  );
}

function EquipmentStep({
  equipment,
  aids,
  onToggleEquip,
  onToggleAid,
}: {
  equipment: string[];
  aids: string[];
  onToggleEquip: (v: string) => void;
  onToggleAid: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader title="What do you have at home?" subtitle="So we never recommend gear you don't own." />
      <div>
        <div className="text-sm font-semibold mb-2">Equipment</div>
        <ChipGroup options={EQUIPMENT_OPTIONS} selected={equipment} onToggle={onToggleEquip} testIdPrefix="chip-equip" />
      </div>
      <div>
        <div className="text-sm font-semibold mb-2">Mobility aids</div>
        <ChipGroup options={MOBILITY_OPTIONS} selected={aids} onToggle={onToggleAid} testIdPrefix="chip-aid" />
      </div>
    </div>
  );
}

function DailyLifeStep({
  minutes,
  energy,
  onMinutes,
  onEnergy,
}: {
  minutes: number;
  energy: string;
  onMinutes: (v: number) => void;
  onEnergy: (v: string) => void;
}) {
  return (
    <div className="space-y-7">
      <StepHeader title="A realistic day" subtitle="We'll match recovery work to what you've actually got." />
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <Label>How many minutes per day for recovery?</Label>
          <div className="text-base font-bold text-[#E2741B]" data-testid="text-time-budget">
            {minutes} min
          </div>
        </div>
        <Slider
          value={[minutes]}
          min={5}
          max={120}
          step={5}
          onValueChange={(arr) => onMinutes(arr[0] ?? 20)}
          data-testid="slider-time-budget"
        />
        <div className="flex justify-between text-[11px] text-gray-500">
          <span>5 min</span>
          <span>30 min</span>
          <span>60 min</span>
          <span>2 hr</span>
        </div>
      </div>

      <div className="space-y-3">
        <Label>When are you sharpest?</Label>
        <RadioGroup value={energy} onValueChange={onEnergy} className="grid grid-cols-2 gap-2">
          {[
            { v: "morning", l: "Mornings" },
            { v: "afternoon", l: "Afternoons" },
            { v: "evening", l: "Evenings" },
            { v: "variable", l: "It varies" },
          ].map((o) => (
            <Label
              key={o.v}
              htmlFor={`energy-${o.v}`}
              className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer hover-elevate ${
                energy === o.v ? "border-[#E2741B] bg-[#E2741B]/10" : "border-[#333] bg-[#0D0D0D]"
              }`}
              data-testid={`option-energy-${o.v}`}
            >
              <RadioGroupItem value={o.v} id={`energy-${o.v}`} />
              <span className="text-sm">{o.l}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

function CaregiverStep({
  hasCaregiver,
  email,
  relationship,
  onHas,
  onEmail,
  onRelationship,
}: {
  hasCaregiver: boolean;
  email: string | null | undefined;
  relationship: string | null | undefined;
  onHas: (v: boolean) => void;
  onEmail: (v: string) => void;
  onRelationship: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader title="Caregiver loop" subtitle="If someone helps you day-to-day, we can include them later." />
      <div className="flex items-center justify-between rounded-md border border-[#333] bg-[#0D0D0D] p-4">
        <div>
          <div className="text-sm font-semibold">Someone helps me with recovery</div>
          <div className="text-xs text-gray-500">Spouse, family, friend, or pro</div>
        </div>
        <Switch
          checked={hasCaregiver}
          onCheckedChange={onHas}
          data-testid="switch-has-caregiver"
        />
      </div>
      {hasCaregiver && (
        <div className="space-y-4 rounded-md border border-[#333] bg-[#0D0D0D] p-4">
          <div className="space-y-2">
            <Label htmlFor="caregiver-email">Their email (optional)</Label>
            <Input
              id="caregiver-email"
              type="email"
              value={email ?? ""}
              onChange={(e) => onEmail(e.target.value)}
              placeholder="caregiver@email.com"
              className="bg-[#1a1a1a] border-[#333]"
              data-testid="input-caregiver-email"
            />
            <p className="text-[11px] text-gray-500">
              We won't email anyone until you invite them in the Caregiver tab.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Relationship</Label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => onRelationship(r.value)}
                  className={`rounded-md border px-3 py-1.5 text-xs hover-elevate ${
                    relationship === r.value
                      ? "border-[#E2741B] bg-[#E2741B]/10 text-white"
                      : "border-[#333] bg-[#1a1a1a] text-gray-300"
                  }`}
                  data-testid={`option-relationship-${r.value}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccessibilityStep({
  bigButtonMode,
  dyslexiaFont,
  reducedMotion,
  voicePrefersTts,
  onChange,
}: {
  bigButtonMode: boolean;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  voicePrefersTts: boolean;
  onChange: (k: string, v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <StepHeader title="Make it easier" subtitle="Turn these on if they help. You can change them anytime." />
      <ToggleRow
        label="Big buttons + larger text"
        hint="Helps with one-handed use and vision changes"
        checked={bigButtonMode}
        onCheckedChange={(v) => onChange("bigButtonMode", v)}
        testId="switch-big-button"
      />
      <ToggleRow
        label="Dyslexia-friendly font"
        hint="Easier to read after stroke"
        checked={dyslexiaFont}
        onCheckedChange={(v) => onChange("dyslexiaFont", v)}
        testId="switch-dyslexia-font"
      />
      <ToggleRow
        label="Reduce motion"
        hint="Removes animations that can trigger fatigue"
        checked={reducedMotion}
        onCheckedChange={(v) => onChange("reducedMotion", v)}
        testId="switch-reduced-motion"
      />
      <ToggleRow
        label="Read pages out loud by default"
        hint="Coach replies + lessons play as audio"
        checked={voicePrefersTts}
        onCheckedChange={(v) => onChange("voicePrefersTts", v)}
        testId="switch-voice-tts"
      />
    </div>
  );
}

function StoryStep({
  story,
  onChange,
}: {
  story: string | null | undefined;
  onChange: (v: string) => void;
}) {
  const baseRef = useRef<string>("");
  const { listening, start, stop, supported, error } = useVoiceInput({
    continuous: true,
    onResult: (text, isFinal) => {
      const merged = baseRef.current ? `${baseRef.current} ${text}`.trim() : text;
      onChange(merged);
      if (isFinal) baseRef.current = merged;
    },
  });

  const toggleMic = () => {
    if (listening) {
      stop();
    } else {
      baseRef.current = story ?? "";
      start();
    }
  };

  return (
    <div className="space-y-4">
      <StepHeader title="Your story (optional)" subtitle="A few sentences. Coach will remember this." />
      <div className="relative">
        <Textarea
          value={story ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Where you were when it happened, what you've fought through, what you hope for…"
          className="bg-[#0D0D0D] border-[#333] min-h-[160px] pr-12"
          data-testid="textarea-story"
        />
        {supported && (
          <button
            type="button"
            onClick={toggleMic}
            className={`absolute right-2 top-2 rounded-md border p-2 hover-elevate ${
              listening
                ? "border-[#E2741B] bg-[#E2741B]/20 text-[#E2741B]"
                : "border-[#333] bg-[#1a1a1a] text-gray-400"
            }`}
            aria-label={listening ? "Stop dictation" : "Start dictation"}
            data-testid="button-mic-story"
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
      </div>
      {supported ? (
        <p className="text-[11px] text-gray-500">
          {listening ? "Listening… speak naturally. Tap mic again to stop." : "Tap the mic to dictate instead of typing."}
        </p>
      ) : (
        <p className="text-[11px] text-gray-500">Voice dictation works in Chrome and Edge.</p>
      )}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function ReviewStep({ draft, onJump }: { draft: Draft; onJump: (idx: number) => void }) {
  const yearsSince = useMemo(() => {
    if (!draft.strokeDate) return null;
    const ms = Date.now() - new Date(draft.strokeDate).getTime();
    if (ms < 0) return null;
    const days = Math.round(ms / (1000 * 60 * 60 * 24));
    if (days < 60) return `${days} days ago`;
    const months = Math.round(days / 30);
    if (months < 18) return `${months} months ago`;
    return `${Math.round((days / 365) * 10) / 10} years ago`;
  }, [draft.strokeDate]);

  return (
    <div className="space-y-5">
      <StepHeader title="Looks right?" subtitle="Tap any row to edit. Then finish to unlock your dashboard." />
      <Row label="Name" value={draft.preferredName || "—"} onClick={() => onJump(1)} />
      <Row
        label="Stroke"
        value={
          [
            draft.strokeType ? STROKE_TYPES.find((t) => t.value === draft.strokeType)?.label : null,
            yearsSince,
            draft.affectedSide ? `${SIDES.find((s) => s.value === draft.affectedSide)?.label}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "—"
        }
        onClick={() => onJump(2)}
      />
      <Row
        label="Top deficits"
        value={
          DEFICIT_LABELS
            .filter((d) => (draft.deficits?.[d.key] ?? 0) >= 2)
            .map((d) => d.label)
            .slice(0, 3)
            .join(", ") || "None reported"
        }
        onClick={() => onJump(3)}
      />
      <Row
        label="Goals"
        value={(draft.recoveryGoals || []).slice(0, 4).join(", ") || "—"}
        onClick={() => onJump(4)}
      />
      <Row
        label="Daily time"
        value={`${draft.dailyTimeBudgetMinutes ?? 20} min · sharpest in the ${draft.energyPattern ?? "morning"}`}
        onClick={() => onJump(6)}
      />
      <Row
        label="Caregiver"
        value={draft.hasCaregiver ? `Yes${draft.caregiverEmail ? ` · ${draft.caregiverEmail}` : ""}` : "Just me"}
        onClick={() => onJump(7)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny shared bits
// ─────────────────────────────────────────────────────────────────────────────

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
  testIdPrefix,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isOn = selected.includes(opt);
        const slug = opt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`rounded-md border px-3 py-1.5 text-sm hover-elevate transition-colors ${
              isOn
                ? "border-[#E2741B] bg-[#E2741B]/10 text-white"
                : "border-[#333] bg-[#0D0D0D] text-gray-300"
            }`}
            data-testid={`${testIdPrefix}-${slug}`}
          >
            {isOn && <Check className="inline w-3 h-3 mr-1" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onCheckedChange,
  testId,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#333] bg-[#0D0D0D] p-4">
      <div className="pr-3">
        <div className="text-sm font-semibold">{label}</div>
        {hint && <div className="text-xs text-gray-500 mt-0.5">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} data-testid={testId} />
    </div>
  );
}

function Row({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-md border border-[#333] bg-[#0D0D0D] p-3 hover-elevate flex items-start gap-3"
      data-testid={`review-row-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-gray-500 w-24 shrink-0 pt-0.5">{label}</div>
      <div className="text-sm text-white flex-1">{value}</div>
      <div className="text-xs text-[#E2741B] shrink-0">Edit</div>
    </button>
  );
}
