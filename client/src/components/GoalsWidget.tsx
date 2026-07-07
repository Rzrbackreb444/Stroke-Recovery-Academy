// Compact goals widget for the Recovery Dashboard.
// Shows the active goal, step progress, and next step to take.
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Target, CheckCircle, Circle, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const ORANGE = "#E2741B";

interface MicroGoal {
  id: number;
  title: string;
  status: "pending" | "completed" | "skipped";
}

interface Goal {
  id: number;
  title: string;
  status: string;
  microGoals: MicroGoal[];
}

export default function GoalsWidget() {
  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/recovery/goals"],
  });

  const active = (goals ?? []).filter(g => g.status === "active");
  const topGoal = active[0];

  if (isLoading) {
    return (
      <Card className="border-[#1a1a1a] bg-[#0f0f0f]">
        <CardContent className="p-4 flex items-center gap-2 text-gray-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading goals…
        </CardContent>
      </Card>
    );
  }

  if (!topGoal) {
    return (
      <Card className="border-[#1a1a1a] bg-[#0f0f0f]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-600 shrink-0" />
              <span className="text-sm text-gray-600">No recovery goal set yet.</span>
            </div>
            <Link href="/recovery/goals">
              <span className="text-xs font-bold flex items-center gap-1" style={{ color: ORANGE }}>
                Set a goal <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completed = topGoal.microGoals.filter(m => m.status === "completed").length;
  const total = topGoal.microGoals.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const nextStep = topGoal.microGoals.find(m => m.status === "pending");

  return (
    <Card className="border-[#1a1a1a] bg-[#0f0f0f]">
      <CardContent className="p-4 space-y-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ORANGE }} />
            <p className="text-sm font-bold text-white leading-tight line-clamp-2">{topGoal.title}</p>
          </div>
          <Link href="/recovery/goals">
            <span className="text-[10px] font-bold shrink-0 flex items-center gap-0.5 text-gray-500 hover:text-gray-300 transition-colors">
              All goals <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </Link>
        </div>

        {/* Progress */}
        {total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>{completed} of {total} steps</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-1 bg-[#222]" />
          </div>
        )}

        {/* Steps preview (up to 3) */}
        <div className="space-y-1">
          {topGoal.microGoals.slice(0, 3).map(mg => (
            <div key={mg.id} className="flex items-center gap-1.5">
              {mg.status === "completed"
                ? <CheckCircle className="w-3 h-3 shrink-0" style={{ color: ORANGE }} />
                : <Circle className="w-3 h-3 shrink-0 text-gray-700" />
              }
              <span className={`text-xs leading-tight ${mg.status === "completed" ? "line-through text-gray-700" : "text-gray-400"}`}>
                {mg.title}
              </span>
            </div>
          ))}
          {total > 3 && (
            <p className="text-[10px] text-gray-700 pl-4">{total - 3} more step{total - 3 !== 1 ? "s" : ""}</p>
          )}
        </div>

        {/* Next action */}
        {nextStep && (
          <div className="pt-1 border-t border-[#1a1a1a]">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Next step</p>
            <p className="text-xs text-white font-medium">{nextStep.title}</p>
          </div>
        )}
        {!nextStep && total > 0 && (
          <div className="pt-1 border-t border-[#1a1a1a]">
            <p className="text-xs text-green-400 font-medium">All steps done — ready to complete this goal.</p>
          </div>
        )}
        {total === 0 && (
          <Link href="/recovery/goals">
            <p className="text-xs" style={{ color: ORANGE }}>Break it into steps →</p>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
