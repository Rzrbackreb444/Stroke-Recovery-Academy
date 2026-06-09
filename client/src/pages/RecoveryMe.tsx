import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Sparkles,
  Target,
  Activity,
  Brain,
  MessageSquare,
  Heart,
  Lightbulb,
  RefreshCw,
  Calendar,
  Dumbbell,
  Apple,
  TrendingUp,
} from "lucide-react";

const DOMAIN_META: Record<
  string,
  { label: string; icon: any; key: string }
> = {
  physical: { label: "Physical", icon: Activity, key: "physical" },
  cognitive: { label: "Cognitive", icon: Brain, key: "cognitive" },
  speech: { label: "Speech", icon: MessageSquare, key: "speech" },
  emotional: { label: "Emotional", icon: Heart, key: "emotional" },
  memory: { label: "Memory", icon: Lightbulb, key: "memory" },
};

interface Plan {
  summary?: string;
  focusDomains?: string[];
  exercises?: { name: string; domain: string; sets: number; reps: number; notes?: string }[];
  brainGymMinutes?: number;
  mealTargets?: {
    omega3Servings?: number;
    leafyGreensServings?: number;
    hydrationOz?: number;
    limit?: string[];
  };
  weeklySchedule?: Record<string, string[]>;
  tips?: string[];
  safetyNote?: string;
}

interface MeState {
  hasOnboarded: boolean;
  latestAssessment: Record<string, any> | null;
  history: any[];
  goals: { id: number; horizon: string; domain: string; goal: string; status: string }[];
  plan: Plan | null;
  planGeneratedAt: string | null;
}

export default function RecoveryMe() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/recovery/login?next=/recovery/me");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data, isLoading } = useQuery<MeState>({
    queryKey: ["/api/recovery/me/state"],
    enabled: isAuthenticated,
  });

  const regenerate = useMutation({
    mutationFn: () => apiRequest("POST", "/api/recovery/plan/generate", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/me/state"] });
      toast({ title: "Plan regenerated." });
    },
    onError: () =>
      toast({ title: "Couldn't regenerate plan", variant: "destructive" }),
  });

  const radarData = useMemo(() => {
    if (!data?.latestAssessment) return [];
    return Object.keys(DOMAIN_META).map((k) => ({
      domain: DOMAIN_META[k].label,
      score: Number(data.latestAssessment![k] ?? 0),
    }));
  }, [data]);

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "short" });
  const todayPlan = data?.plan?.weeklySchedule?.[todayName] || [];

  if (authLoading || !isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
          <Skeleton className="h-8 w-48 bg-[#1a1a1a]" />
          <Skeleton className="h-64 w-full bg-[#1a1a1a]" />
        </div>
      </div>
    );
  }

  if (!data?.hasOnboarded) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#111] border-[#222] p-10 max-w-lg text-center space-y-5 rounded-md">
          <Sparkles
            className="mx-auto h-10 w-10"
            style={{ color: "#E2741B" }}
            strokeWidth={1.5}
          />
          <h1 className="font-serif text-3xl">Take the Sasquatch Scale</h1>
          <p className="text-gray-400">
            Five domains, four minutes. We turn your scores into a real
            personal recovery plan with exercises, brain gym minutes, and meal
            targets.
          </p>
          <Button
            size="lg"
            className="text-black"
            style={{ backgroundColor: "#E2741B" }}
            onClick={() => setLocation("/recovery/onboarding")}
            data-testid="button-start-onboarding"
          >
            Start now
          </Button>
        </Card>
      </div>
    );
  }

  const plan = data.plan;
  const score = data.latestAssessment;
  const totalScore =
    score
      ? (score.physical + score.cognitive + score.speech + score.emotional + score.memory)
      : 0;
  const lastTakenDays = score?.takenAt
    ? Math.floor((Date.now() - new Date(score.takenAt).getTime()) / 86_400_000)
    : null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="text-xs uppercase tracking-[0.3em] mb-1"
              style={{ color: "#E2741B" }}
            >
              Survivor OS
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl">Your recovery plan</h1>
            {data.planGeneratedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Plan generated {new Date(data.planGeneratedAt).toLocaleDateString()} ·
                {lastTakenDays !== null && ` last assessment ${lastTakenDays}d ago`}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/recovery/onboarding")}
              className="border-[#333] bg-transparent text-gray-300"
              data-testid="button-rescore"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Re-score
            </Button>
            <Button
              size="sm"
              onClick={() => regenerate.mutate()}
              disabled={regenerate.isPending}
              className="text-black"
              style={{ backgroundColor: "#E2741B" }}
              data-testid="button-regenerate-plan"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${regenerate.isPending ? "animate-spin" : ""}`}
              />
              Regenerate plan
            </Button>
          </div>
        </div>

        {/* Top row: scores + today */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sasquatch Scale radar */}
          <Card className="bg-[#111] border-[#222] p-6 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl">Sasquatch Scale</h2>
              <span
                className="text-xs uppercase tracking-widest"
                style={{ color: "#E2741B" }}
              >
                {totalScore} / 50
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="78%">
                  <PolarGrid stroke="#2a2a2a" />
                  <PolarAngleAxis
                    dataKey="domain"
                    tick={{ fill: "#aaa", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fill: "#555", fontSize: 10 }}
                    stroke="#2a2a2a"
                  />
                  <Radar
                    dataKey="score"
                    stroke="#E2741B"
                    fill="#E2741B"
                    fillOpacity={0.45}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {radarData.map((d) => (
                <div key={d.domain} className="text-center">
                  <div
                    className="text-xl font-serif tabular-nums"
                    style={{ color: "#E2741B" }}
                  >
                    {d.score}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500">
                    {d.domain}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Today */}
          <Card className="bg-[#111] border-[#222] p-6 rounded-md">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5" style={{ color: "#E2741B" }} />
              <h2 className="font-serif text-xl">Today's prescription</h2>
            </div>
            {todayPlan.length > 0 ? (
              <ul className="space-y-3">
                {todayPlan.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-md border border-[#222] bg-[#0a0a0a] p-3"
                    data-testid={`text-today-item-${i}`}
                  >
                    <div
                      className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: "#E2741B" }}
                    />
                    <span className="text-sm text-gray-200">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Rest day — keep hydrated, sleep early, hammer it tomorrow.
              </p>
            )}
            {plan?.brainGymMinutes ? (
              <div className="mt-5 flex items-center justify-between rounded-md border border-[#222] bg-[#0a0a0a] p-3">
                <span className="text-sm text-gray-300">Brain Gym minutes</span>
                <Link href="/recovery/brain-gym">
                  <Button size="sm" className="text-black" style={{ backgroundColor: "#E2741B" }}>
                    {plan.brainGymMinutes} min
                  </Button>
                </Link>
              </div>
            ) : null}
          </Card>
        </div>

        {/* Plan summary */}
        {plan?.summary && (
          <Card
            className="border-[#2a2a1a] p-6 rounded-md"
            style={{ background: "linear-gradient(180deg,#1a1610,#111)" }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: "#E2741B" }}
            >
              From Sasquatch
            </p>
            <p className="text-lg font-serif leading-snug">{plan.summary}</p>
          </Card>
        )}

        {/* Goals */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5" style={{ color: "#E2741B" }} />
            <h2 className="font-serif text-xl">Goals</h2>
          </div>
          {data.goals.length === 0 ? (
            <p className="text-sm text-gray-500">No goals set yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.goals.map((g) => (
                <Card
                  key={g.id}
                  className="bg-[#111] border-[#222] p-4 rounded-md"
                  data-testid={`card-goal-${g.id}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(226,116,27,0.18)",
                        color: "#E2741B",
                      }}
                    >
                      {g.horizon === "short" ? "30 days" : "1 year"}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">
                      {g.domain}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200">{g.goal}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Exercises */}
        {plan?.exercises?.length ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="h-5 w-5" style={{ color: "#E2741B" }} />
              <h2 className="font-serif text-xl">Prescribed exercises</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plan.exercises.map((ex, i) => {
                const Icon = DOMAIN_META[ex.domain]?.icon || Activity;
                return (
                  <Card
                    key={i}
                    className="bg-[#111] border-[#222] p-4 rounded-md"
                    data-testid={`card-exercise-${i}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: "#E2741B" }} />
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                          {ex.domain}
                        </span>
                      </div>
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: "#E2741B" }}
                      >
                        {ex.sets}×{ex.reps}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">{ex.name}</p>
                    {ex.notes && (
                      <p className="text-xs text-gray-500 mt-1 leading-snug">
                        {ex.notes}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Meal targets */}
        {plan?.mealTargets && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Apple className="h-5 w-5" style={{ color: "#E2741B" }} />
              <h2 className="font-serif text-xl">Weekly meal targets</h2>
            </div>
            <Card className="bg-[#111] border-[#222] p-5 rounded-md">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {plan.mealTargets.omega3Servings != null && (
                  <Stat
                    label="Omega-3 servings"
                    value={`${plan.mealTargets.omega3Servings}/wk`}
                  />
                )}
                {plan.mealTargets.leafyGreensServings != null && (
                  <Stat
                    label="Leafy greens"
                    value={`${plan.mealTargets.leafyGreensServings}/wk`}
                  />
                )}
                {plan.mealTargets.hydrationOz != null && (
                  <Stat
                    label="Water"
                    value={`${plan.mealTargets.hydrationOz} oz / day`}
                  />
                )}
              </div>
              {plan.mealTargets.limit?.length ? (
                <p className="text-xs text-gray-500 mt-4">
                  Limit: {plan.mealTargets.limit.join(", ")}
                </p>
              ) : null}
            </Card>
          </div>
        )}

        {/* Tips */}
        {plan?.tips?.length ? (
          <Card className="bg-[#111] border-[#222] p-5 rounded-md">
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: "#E2741B" }}
            >
              Sasquatch tips
            </p>
            <ul className="space-y-2">
              {plan.tips.map((t, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span style={{ color: "#E2741B" }}>›</span> {t}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {/* Safety */}
        <p className="text-xs text-gray-500 text-center max-w-2xl mx-auto leading-relaxed">
          {plan?.safetyNote ||
            "Not medical advice. This plan is generated from your self-assessment and should be confirmed with your doctor or therapist. In a crisis, call 988 (Suicide & Crisis Lifeline) or 911."}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-serif tabular-nums" style={{ color: "#E2741B" }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">
        {label}
      </p>
    </div>
  );
}
