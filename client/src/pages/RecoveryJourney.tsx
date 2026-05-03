import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import { RecommendationCards } from "@/components/RecommendationCard";
import {
  Sun,
  Flame,
  MessageCircle,
  Music,
  Brain,
  Pencil,
  Check,
  ArrowRight,
  Trophy,
  CalendarCheck,
  Sparkles,
} from "lucide-react";

type Step = {
  key: "checkin" | "bonfire" | "coach" | "anchor" | "braingym" | "journal";
  title: string;
  subtitle: string;
  href: string;
  icon: string;
  completed: boolean;
};

type Journey = {
  date: string;
  streak: { current: number; longest: number; totalActive: number };
  steps: Step[];
  completedCount: number;
  totalCount: number;
  nextStep: Step | null;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  flame: Flame,
  messageCircle: MessageCircle,
  music: Music,
  brain: Brain,
  pencil: Pencil,
};

export default function RecoveryJourney() {
  const { data, isLoading } = useQuery<Journey>({
    queryKey: ["/api/recovery/journey"],
    refetchOnWindowFocus: true,
  });

  const completedCount = data?.completedCount ?? 0;
  const totalCount = data?.totalCount ?? 6;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount && totalCount > 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <RecoverySEO
        title="Daily Journey — Stroke Recovery Academy"
        description="Your full survivor day in one page. 6 steps, one streak, never zero."
        canonical="/recovery/journey"
      />
      <RecoveryHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* ── Streak header ───────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
            <h1
              className="text-3xl md:text-4xl font-black"
              data-testid="text-journey-title"
            >
              Today.
            </h1>
            <div className="flex items-center gap-2 text-sm text-stone-400">
              <CalendarCheck className="w-4 h-4 text-amber-500" />
              <span data-testid="text-date">{data?.date ?? "—"}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card
              className="p-4 bg-stone-900 border-stone-800"
              data-testid="card-streak-current"
            >
              <div className="text-stone-500 text-xs uppercase tracking-wide mb-1">
                Current streak
              </div>
              <div className="text-2xl font-black text-amber-400">
                {data?.streak.current ?? 0}
                <span className="text-stone-500 text-sm font-normal ml-1">
                  days
                </span>
              </div>
            </Card>
            <Card
              className="p-4 bg-stone-900 border-stone-800"
              data-testid="card-streak-longest"
            >
              <div className="text-stone-500 text-xs uppercase tracking-wide mb-1">
                Longest
              </div>
              <div className="text-2xl font-black text-stone-200">
                {data?.streak.longest ?? 0}
              </div>
            </Card>
            <Card
              className="p-4 bg-stone-900 border-stone-800"
              data-testid="card-streak-total"
            >
              <div className="text-stone-500 text-xs uppercase tracking-wide mb-1">
                Total active days
              </div>
              <div className="text-2xl font-black text-stone-200">
                {data?.streak.totalActive ?? 0}
              </div>
            </Card>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Progress
              value={pct}
              className="h-2 flex-1 bg-stone-900"
              data-testid="progress-day"
            />
            <span
              className="text-sm font-bold text-stone-300"
              data-testid="text-progress-counter"
            >
              {completedCount}/{totalCount}
            </span>
          </div>
          <p className="text-stone-500 text-xs">
            Six steps. One streak. Never zero. Even one step today keeps the
            fire warm.
          </p>
        </div>

        {/* ── Next-up callout ─────────────────────────────────────────── */}
        {!isLoading && data?.nextStep && !allDone && (
          <Card
            className="p-5 mb-6 bg-gradient-to-br from-amber-900/30 to-stone-900 border-amber-700/40"
            data-testid="card-next-up"
          >
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-amber-600 text-white border-amber-700">
                <Sparkles className="w-3 h-3 mr-1" />
                Next up
              </Badge>
              <span className="text-stone-500 text-xs">
                Step {completedCount + 1} of {totalCount}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3
                  className="font-bold text-lg text-stone-100"
                  data-testid="text-next-title"
                >
                  {data.nextStep.title}
                </h3>
                <p className="text-stone-400 text-sm">{data.nextStep.subtitle}</p>
              </div>
              <Link href={data.nextStep.href}>
                <Button
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  data-testid="button-next-cta"
                >
                  Start <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* ── All-done celebration ────────────────────────────────────── */}
        {!isLoading && allDone && (
          <Card
            className="p-6 mb-6 bg-gradient-to-br from-green-900/30 to-stone-900 border-green-700/40 text-center"
            data-testid="card-all-done"
          >
            <Trophy className="w-10 h-10 mx-auto mb-2 text-green-400" />
            <h2 className="text-2xl font-black mb-1">Six for six.</h2>
            <p className="text-stone-300">
              Every step done. The fire is warm tonight. Tomorrow it resets —
              your streak grows by one.
            </p>
          </Card>
        )}

        {/* ── Stepped funnel ──────────────────────────────────────────── */}
        <section className="mb-8" data-testid="section-steps">
          <div className="space-y-2">
            {(data?.steps ?? []).map((step, i) => {
              const Icon = ICONS[step.icon] ?? Sun;
              return (
                <Link key={step.key} href={step.href}>
                  <Card
                    className={`p-4 hover-elevate cursor-pointer transition-colors ${
                      step.completed
                        ? "bg-stone-900/60 border-green-700/40"
                        : "bg-stone-900 border-stone-800"
                    }`}
                    data-testid={`step-${step.key}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                          step.completed
                            ? "bg-green-700 text-white"
                            : "bg-stone-800 text-stone-400"
                        }`}
                      >
                        {step.completed ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 ${
                              step.completed ? "text-green-400" : "text-amber-500"
                            }`}
                          />
                          <h3
                            className={`font-bold ${
                              step.completed
                                ? "text-stone-300 line-through decoration-green-700/40 decoration-1"
                                : "text-stone-100"
                            }`}
                            data-testid={`step-title-${step.key}`}
                          >
                            {step.title}
                          </h3>
                          {step.completed && (
                            <Badge className="bg-green-700/30 text-green-300 border-green-700/40 text-[10px]">
                              Done
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-stone-400">{step.subtitle}</p>
                      </div>
                      {!step.completed && (
                        <ArrowRight className="w-5 h-5 text-stone-500 flex-shrink-0" />
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Gemini-powered recommendations ──────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-stone-300">
            For you, today.
          </h2>
          <RecommendationCards surface="journey" />
        </section>

        <p className="text-center text-stone-500 text-xs">
          Stroke Recovery Academy is non-clinical. In crisis, call 988 or 911.
        </p>
      </main>
    </div>
  );
}
