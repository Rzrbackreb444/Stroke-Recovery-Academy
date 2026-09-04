import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Personalization = {
  applied?: boolean;
  timeBudgetMinutes?: number | null;
  energyPattern?: string | null;
  goals?: string[];
  capReason?: string | null;
};

type TodayRecommendation = {
  level: number;
  reason: string;
  basis?: string;
  personalization?: Personalization;
};

type CoachNextStepCardProps = {
  signedIn: boolean;
  onPrompt: (prompt: string) => void;
};

const LEVEL_NAMES = ["Survival", "Bed-Based", "Seated", "Assisted Standing", "Full Power"];

export function CoachNextStepCard({ signedIn, onPrompt }: CoachNextStepCardProps) {
  const { data, isLoading, isError } = useQuery<TodayRecommendation>({
    queryKey: ["/api/recovery/today/recommendation"],
    enabled: signedIn,
    retry: 1,
  });

  if (!signedIn) {
    return (
      <Card className="mb-6 border-[#E2741B]/25 bg-[#17120d] p-4" data-testid="card-coach-signin-next-step">
        <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E2741B]">
          <Sparkles className="h-3 w-3" />
          Your recovery thread
        </p>
        <p className="text-sm leading-relaxed text-gray-300">
          Sign in and Coach can use your Today feedback to help shape a manageable next step instead of starting from scratch each time.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="mb-6 border-[#E2741B]/20 bg-[#141414] p-4" data-testid="card-coach-next-step-loading">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin text-[#E2741B]" />
          Reading your latest recovery signals…
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="mb-6 border-[#2a2a2a] bg-[#111] p-4" data-testid="card-coach-next-step-fallback">
        <p className="mb-2 text-sm font-semibold text-white">Today is still yours to set.</p>
        <p className="mb-3 text-sm leading-relaxed text-gray-400">
          Coach could not read your latest Today signal. You can open the guided rep and choose the starting point yourself.
        </p>
        <Button asChild variant="outline" size="sm" className="border-[#333] text-gray-200">
          <Link href="/recovery/today">
            Open Today <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </Card>
    );
  }

  const personalization = data.personalization;
  const levelName = LEVEL_NAMES[Math.max(0, Math.min(LEVEL_NAMES.length - 1, data.level))] ?? "Seated";
  const contextLine = [
    personalization?.timeBudgetMinutes
      ? `${personalization.timeBudgetMinutes}-minute window`
      : null,
    personalization?.energyPattern
      ? `${personalization.energyPattern} energy pattern`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card
      className="mb-6 border-[#E2741B]/35 bg-gradient-to-br from-[#1b160f] to-[#111] p-4"
      data-testid="card-coach-next-step"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E2741B]">
            <Sparkles className="h-3 w-3" />
            Your next safe rep
          </p>
          <h2 className="text-lg font-semibold text-white">
            Start at {levelName}
          </h2>
        </div>
        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#E2741B]" />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-300" data-testid="text-coach-next-step-reason">
        {data.reason}
      </p>

      {(contextLine || personalization?.capReason) && (
        <div className="mt-3 space-y-1 text-xs text-gray-500">
          {contextLine && <p>{contextLine}</p>}
          {personalization?.capReason && (
            <p className="text-amber-300/80">{personalization.capReason}</p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm" className="bg-[#E2741B] font-semibold text-black hover:bg-[#c96112]">
          <Link href="/recovery/today">
            Open Today <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-[#333] text-gray-200 hover:bg-white/5"
          onClick={() =>
            onPrompt("Help me choose how to approach today's suggested recovery rep without overdoing it.")
          }
          data-testid="button-coach-next-step-discuss"
        >
          Talk it through
        </Button>
      </div>
      <p className="mt-3 text-[11px] text-gray-600">
        This is a starting point, not a medical instruction. You choose, adjust, or skip.
      </p>
    </Card>
  );
}