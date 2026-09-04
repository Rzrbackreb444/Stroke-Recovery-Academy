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
  planVersion?: 2;
  planType?: "education_and_clinician_review";
  summary?: string;
  focusDomains?: string[];
  exercises?: {
    exerciseId: number;
    slug: string;
    name: string;
    domain: string;
    description: string;
    safetyNotes: string;
    clinicianReviewRequired: true;
  }[];
  education?: { brainGym: string; nutrition: string[] };
  weeklyReflection?: Record<string, string>;
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
  clinicianReview: {
    status: "pending" | "approved" | "rejected" | "changes_requested";
    reviewedBy: string | null;
    reviewedAt: string | null;
    notes: string | null;
    history: {
      id: number;
      status: "approved" | "rejected" | "changes_requested";
      actorId: string;
      actorType: "clinician" | "admin";
      notes: string | null;
      createdAt: string;
    }[];
  } | null;
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
      toast({ title: "Education draft regenerated." });
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
  const todayReflection = data?.plan?.weeklyReflection?.[todayName];

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
            personal education draft with approved library options, reflection
            prompts, and questions to take to your care team.
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
  const review = data.clinicianReview;
  const reviewCopy = review?.status === "approved"
    ? {
        label: "Reviewed by your care team",
        detail: "This education draft was explicitly approved by a verified clinician.",
        color: "text-green-300",
      }
    : review?.status === "rejected"
      ? {
          label: "Not approved by your care team",
          detail: "Your care team did not approve this draft. Do not use it to guide changes.",
          color: "text-red-300",
        }
      : review?.status === "changes_requested"
        ? {
            label: "Changes requested by your care team",
            detail: "Your care team asked for changes before this draft can be approved.",
            color: "text-amber-300",
          }
        : {
            label: "Educational draft — awaiting care team review",
            detail: "This is education only. It has not been reviewed or approved by your care team.",
            color: "text-amber-300",
          };

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
            <h1 className="font-serif text-3xl sm:text-4xl">Your recovery education draft</h1>
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
              onClick={() => setLocation("/settings/profile")}
              className="border-[#333] bg-transparent text-gray-300"
              data-testid="button-edit-survivor-profile"
            >
              Edit survivor profile
            </Button>
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

        {plan && reviewCopy && (
          <Card
            className="bg-[#111] border-[#2a2a1a] p-5 rounded-md"
            data-testid="card-clinician-review-status"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`text-xs uppercase tracking-widest ${reviewCopy.color}`}>
                  Clinician review status
                </p>
                <p className="mt-2 text-lg font-serif">{reviewCopy.label}</p>
                <p className="mt-1 text-sm text-gray-400">{reviewCopy.detail}</p>
                {review?.reviewedAt && (
                  <p className="mt-2 text-xs text-gray-500">
                    Last recorded {new Date(review.reviewedAt).toLocaleString()}
                  </p>
                )}
              </div>
              {review?.history?.length ? (
                <div className="text-right text-xs text-gray-500">
                  {review.history.length} recorded review{review.history.length === 1 ? "" : "s"}
                </div>
              ) : null}
            </div>
            {review?.notes && (
              <p className="mt-4 border-t border-[#222] pt-3 text-sm text-gray-300">
                Care team note: {review.notes}
              </p>
            )}
          </Card>
        )}

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
              <h2 className="font-serif text-xl">Today's reflection</h2>
            </div>
            {todayReflection ? (
              <p
                className="rounded-md border border-[#222] bg-[#0a0a0a] p-3 text-sm text-gray-200"
                data-testid="text-today-reflection"
              >
                {todayReflection}
              </p>
            ) : (
              <p className="text-sm text-gray-500">No reflection prompt is available today.</p>
            )}
            {plan?.education?.brainGym ? (
              <div className="mt-5 flex items-center justify-between rounded-md border border-[#222] bg-[#0a0a0a] p-3">
                <span className="text-sm text-gray-300">Brain Gym education</span>
                <Link href="/recovery/brain-gym">
                  <Button size="sm" className="text-black" style={{ backgroundColor: "#E2741B" }}>
                    Explore
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
              <h2 className="font-serif text-xl">Approved library options</h2>
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
                      <span className="text-[10px] uppercase tracking-widest text-gray-500">
                        Review first
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">{ex.name}</p>
                    <p className="text-xs text-gray-400 mt-2 leading-snug">{ex.description}</p>
                    <p className="text-xs text-amber-300/80 mt-2 leading-snug">
                      Safety note: {ex.safetyNotes}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Nutrition education */}
        {plan?.education?.nutrition?.length ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5" style={{ color: "#E2741B" }} />
              <h2 className="font-serif text-xl">Nutrition education</h2>
            </div>
            <Card className="bg-[#111] border-[#222] p-5 rounded-md">
              <ul className="space-y-2">
                {plan.education.nutrition.map((item, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-2">
                    <span style={{ color: "#E2741B" }}>›</span> {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
         ) : null}

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
