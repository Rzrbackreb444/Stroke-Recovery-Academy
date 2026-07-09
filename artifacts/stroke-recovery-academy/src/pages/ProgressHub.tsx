import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import RecoveryHeader from "@/components/RecoveryHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import SEO from "@/components/SEO";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Flame, TrendingUp, Calendar, Target, Award, Activity,
  ArrowRight, Settings, ChevronLeft,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

type ProgressData = {
  streak: { current: number; longest: number; totalActive: number; lastActivityDate: string | null };
  goal: { weeklyReps: number; thisWeekReps: number };
  last90Days: { date: string; reps: number; checkinDone: boolean; moodScore: number; energyScore: number }[];
  allTime: { totalReps: number; totalDays: number };
};

function dateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function weekLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// GitHub-style heatmap — 13 weeks × 7 days = 91 cells
function Heatmap({ days }: { days: ProgressData["last90Days"] }) {
  const padded = [...Array(Math.max(0, 91 - days.length)).fill(null), ...days].slice(-91);
  const weeks: (typeof days[0] | null)[][] = [];
  for (let w = 0; w < 13; w++) weeks.push(padded.slice(w * 7, w * 7 + 7));

  function cellColor(reps: number) {
    if (reps === 0) return "#1a1a1a";
    if (reps === 1) return "#7c3a0a";
    if (reps <= 3) return "#b85012";
    if (reps <= 6) return "#E2741B";
    return "#f9a05a";
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] min-w-[260px]" title="Daily reps heatmap — last 90 days">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) =>
              day ? (
                <div
                  key={di}
                  title={`${day.date}: ${day.reps} rep${day.reps !== 1 ? "s" : ""}`}
                  className="h-[11px] w-[11px] rounded-sm transition-all"
                  style={{ backgroundColor: cellColor(day.reps) }}
                />
              ) : (
                <div key={di} className="h-[11px] w-[11px] rounded-sm bg-transparent" />
              )
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2">
        <span className="text-[10px] text-gray-600">Less</span>
        {[0, 1, 3, 5, 7].map((v) => (
          <div
            key={v}
            className="h-[11px] w-[11px] rounded-sm"
            style={{ backgroundColor: v === 0 ? "#1a1a1a" : v === 1 ? "#7c3a0a" : v === 3 ? "#b85012" : v === 5 ? "#E2741B" : "#f9a05a" }}
          />
        ))}
        <span className="text-[10px] text-gray-600">More</span>
      </div>
    </div>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: "#111",
  border: "1px solid #333",
  borderRadius: 6,
  fontSize: 12,
  color: "#ddd",
};

export default function ProgressHub() {
  const { user } = useAuth();
  const [range, setRange] = useState<30 | 60 | 90>(30);

  const { data, isLoading } = useQuery<ProgressData>({
    queryKey: ["/api/recovery/progress"],
    staleTime: 1000 * 60 * 5,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Sign in to view your progress.</p>
      </div>
    );
  }

  const chartDays = data?.last90Days.slice(-(range)) ?? [];
  const last30 = data?.last90Days.slice(-30) ?? [];

  // Filter to days with a checkin for mood/energy chart
  const moodData = chartDays.filter(d => d.moodScore > 0).map(d => ({
    date: dateLabel(d.date),
    Mood: d.moodScore,
    Energy: d.energyScore,
  }));

  const repData = chartDays.map(d => ({
    date: chartDays.length <= 30 ? weekLabel(d.date) : dateLabel(d.date),
    Reps: d.reps,
  }));

  const goalPct = data ? Math.min(100, Math.round((data.goal.thisWeekReps / (data.goal.weeklyReps || 21)) * 100)) : 0;
  const activeDaysInRange = chartDays.filter(d => d.reps > 0).length;
  const adherencePct = chartDays.length ? Math.round((activeDaysInRange / chartDays.length) * 100) : 0;

  const avgMood = last30.filter(d => d.moodScore > 0).length
    ? (last30.filter(d => d.moodScore > 0).reduce((s, d) => s + d.moodScore, 0) / last30.filter(d => d.moodScore > 0).length).toFixed(1)
    : "—";
  const avgEnergy = last30.filter(d => d.energyScore > 0).length
    ? (last30.filter(d => d.energyScore > 0).reduce((s, d) => s + d.energyScore, 0) / last30.filter(d => d.energyScore > 0).length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <SEO
        title="My Progress | Stroke Recovery Academy"
        description="Track your daily reps, streak, mood and energy trends over time."
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/recovery">
            <Button variant="ghost" size="icon" className="text-gray-400" data-testid="button-back-dashboard">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">My Progress</h1>
            <p className="text-xs text-gray-500">Reps logged. Days earned. Proof of work.</p>
          </div>
          <div className="ml-auto">
            <Link href="/recovery/notifications">
              <Button variant="ghost" size="sm" className="text-gray-400 gap-1.5">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Goals &amp; Alerts</span>
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-xl bg-[#1a1a1a] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Streak summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                {
                  icon: Flame,
                  label: "Current Streak",
                  value: data?.streak.current ?? 0,
                  suffix: "days",
                  color: "#E2741B",
                  testId: "stat-streak-current",
                },
                {
                  icon: Award,
                  label: "Longest Streak",
                  value: data?.streak.longest ?? 0,
                  suffix: "days",
                  color: "#fbbf24",
                  testId: "stat-streak-longest",
                },
                {
                  icon: Calendar,
                  label: "Active Days",
                  value: data?.streak.totalActive ?? 0,
                  suffix: "total",
                  color: "#60a5fa",
                  testId: "stat-active-days",
                },
              ].map(({ icon: Icon, label, value, suffix, color, testId }) => (
                <Card key={label} className="bg-[#111] border-[#222] p-4 text-center" data-testid={testId}>
                  <Icon className="h-5 w-5 mx-auto mb-1" style={{ color }} />
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{suffix}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{label}</div>
                </Card>
              ))}
            </div>

            {/* Weekly goal */}
            <Card className="bg-[#111] border-[#222] p-5 mb-6" data-testid="card-weekly-goal">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#E2741B]" />
                  <span className="text-sm font-semibold text-white">Weekly Rep Goal</span>
                </div>
                <span className="text-sm text-gray-400 font-mono">
                  {data?.goal.thisWeekReps ?? 0} / {data?.goal.weeklyReps ?? 21} reps
                </span>
              </div>
              <Progress value={goalPct} className="h-2 mb-2" />
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>{goalPct}% complete this week</span>
                <Link href="/recovery/notifications">
                  <span className="text-[#E2741B] hover:text-amber-400 cursor-pointer">Change goal →</span>
                </Link>
              </div>
            </Card>

            {/* Heatmap */}
            <Card className="bg-[#111] border-[#222] p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-[#E2741B]" />
                <span className="text-sm font-semibold text-white">90-Day Activity</span>
                <span className="ml-auto text-[10px] text-gray-600">
                  {data?.allTime.totalReps ?? 0} total reps all-time
                </span>
              </div>
              <Heatmap days={data?.last90Days ?? []} />
            </Card>

            {/* Range toggle + charts */}
            <Card className="bg-[#111] border-[#222] p-5 mb-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#E2741B]" />
                  <span className="text-sm font-semibold text-white">Daily Reps</span>
                </div>
                <div className="flex items-center gap-1">
                  {([30, 60, 90] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      data-testid={`button-range-${r}`}
                      className={`px-2 py-1 text-[11px] rounded font-medium transition-colors ${
                        range === r ? "bg-[#E2741B] text-black" : "text-gray-500 hover:text-white"
                      }`}
                    >
                      {r}d
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#555" }} interval={Math.floor(repData.length / 6)} />
                    <YAxis tick={{ fontSize: 9, fill: "#555" }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="Reps" fill="#E2741B" radius={[2, 2, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-2">
                <span>{adherencePct}% active days in {range}-day window</span>
                <span>{activeDaysInRange} / {chartDays.length} days logged</span>
              </div>
            </Card>

            {/* Mood + Energy trend */}
            {moodData.length > 2 && (
              <Card className="bg-[#111] border-[#222] p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-[#60a5fa]" />
                  <span className="text-sm font-semibold text-white">Mood &amp; Energy Trend</span>
                  <div className="ml-auto flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#60a5fa] inline-block" /> Mood</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#34d399] inline-block" /> Energy</span>
                  </div>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moodData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#555" }} interval={Math.floor(moodData.length / 5)} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: "#555" }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="Mood" stroke="#60a5fa" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="Energy" stroke="#34d399" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 mt-2">
                  <span>30-day avg mood: <span className="text-gray-400">{avgMood}</span>/10</span>
                  <span>30-day avg energy: <span className="text-gray-400">{avgEnergy}</span>/10</span>
                </div>
              </Card>
            )}

            {/* All-time + CTAs */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <Card className="bg-[#111] border-[#222] p-4 text-center">
                <div className="text-3xl font-bold text-[#E2741B]">{data?.allTime.totalReps ?? 0}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Total Reps</div>
              </Card>
              <Card className="bg-[#111] border-[#222] p-4 text-center">
                <div className="text-3xl font-bold text-[#E2741B]">{data?.allTime.totalDays ?? 0}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Days Active</div>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/recovery#today" className="flex-1">
                <Button className="w-full bg-[#E2741B] text-black font-bold gap-2" data-testid="button-log-reps">
                  <Flame className="h-4 w-4" />
                  Log today's reps
                </Button>
              </Link>
              <Link href="/recovery/notifications" className="flex-1">
                <Button variant="outline" className="w-full border-[#333] text-gray-300 gap-2" data-testid="button-set-goal">
                  <Target className="h-4 w-4" />
                  Set weekly goal
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
