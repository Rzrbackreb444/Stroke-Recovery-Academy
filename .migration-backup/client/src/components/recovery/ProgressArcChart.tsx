import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp } from "lucide-react";

interface ArcPoint {
  date: string;
  mood: number | null;
  energy: number | null;
  reps: number;
}

interface ArcData {
  arc: ArcPoint[];
  totalDays: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs border"
      style={{ background: "#1A1512", borderColor: "rgba(192,107,62,0.3)", color: "#FDFBF7" }}
    >
      <p className="font-semibold text-[#C06B3E] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value ?? "—"}
        </p>
      ))}
    </div>
  );
}

export default function ProgressArcChart() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<ArcData>({
    queryKey: ["/api/recovery/progress-arc"],
    enabled: isAuthenticated,
    staleTime: 10 * 60_000,
  });

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <section className="mb-6" data-testid="section-progress-arc-loading">
        <div className="rounded-2xl border border-[#E2C2A4]/30 bg-white p-5 h-40 flex items-center justify-center">
          <span className="text-xs text-[#A8A29E] uppercase tracking-widest">Loading progress arc…</span>
        </div>
      </section>
    );
  }

  const arc = data?.arc ?? [];
  if (arc.length === 0) return null;

  const hasReps = arc.some((p) => p.reps > 0);
  const hasMood = arc.some((p) => p.mood != null);
  const totalReps = arc.reduce((s, p) => s + p.reps, 0);
  const avgMood = hasMood
    ? (arc.filter((p) => p.mood != null).reduce((s, p) => s + (p.mood ?? 0), 0) /
        arc.filter((p) => p.mood != null).length).toFixed(1)
    : null;

  const displayData = arc.slice(-60);

  return (
    <section className="mb-6" data-testid="section-progress-arc">
      <div className="rounded-2xl border border-[#E2C2A4]/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-md bg-[#C06B3E] flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-black" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#C06B3E] font-bold">90-Day Progress Arc</p>
            </div>
            <p className="text-xs text-[#A8A29E]">
              {displayData.length} days of data · The trend is more important than any single day.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {totalReps > 0 && (
              <div className="text-right">
                <p className="text-xl font-bold text-[#1C1917]">{totalReps}</p>
                <p className="text-[10px] text-[#A8A29E] uppercase tracking-widest">total reps</p>
              </div>
            )}
            {avgMood && (
              <div className="text-right">
                <p className="text-xl font-bold text-[#1C1917]">{avgMood}</p>
                <p className="text-[10px] text-[#A8A29E] uppercase tracking-widest">avg mood</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={displayData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#A8A29E" }}
                tickLine={false}
                axisLine={false}
                interval={Math.ceil(displayData.length / 6)}
              />
              <YAxis
                yAxisId="reps"
                orientation="left"
                tick={{ fontSize: 9, fill: "#A8A29E" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              {hasMood && (
                <YAxis
                  yAxisId="mood"
                  orientation="right"
                  domain={[0, 10]}
                  tick={{ fontSize: 9, fill: "#A8A29E" }}
                  tickLine={false}
                  axisLine={false}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              {hasReps && (
                <Bar
                  yAxisId="reps"
                  dataKey="reps"
                  name="Reps"
                  fill="rgba(192,107,62,0.35)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={16}
                />
              )}
              {hasMood && (
                <Line
                  yAxisId="mood"
                  type="monotone"
                  dataKey="mood"
                  name="Mood"
                  stroke="#C06B3E"
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                />
              )}
              <ReferenceLine yAxisId="reps" y={0} stroke="rgba(0,0,0,0.1)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 justify-end">
          {hasReps && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: "rgba(192,107,62,0.35)" }} />
              <span className="text-[10px] text-[#A8A29E]">Reps logged</span>
            </div>
          )}
          {hasMood && (
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded" style={{ background: "#C06B3E" }} />
              <span className="text-[10px] text-[#A8A29E]">Mood (0–10)</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
