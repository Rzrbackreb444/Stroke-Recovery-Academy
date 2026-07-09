import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  Activity, AlertCircle, ExternalLink, Flame, Trophy, Sparkles, Zap, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import type { PublicRecoveryReport } from "@shared/reportTypes";

const TOOLTIP_STYLE = {
  backgroundColor: "#111",
  border: "1px solid #333",
  borderRadius: 6,
  fontSize: 12,
  color: "#ddd",
};

function d(iso: string) {
  if (!iso) return "";
  const dt = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SCALE_LINES: { key: keyof PublicRecoveryReport["deficitTrend"][number]; label: string; color: string }[] = [
  { key: "physical", label: "Physical", color: "#E2741B" },
  { key: "cognitive", label: "Cognitive", color: "#60a5fa" },
  { key: "speech", label: "Speech", color: "#34d399" },
  { key: "emotional", label: "Emotional", color: "#f472b6" },
  { key: "memory", label: "Memory", color: "#fbbf24" },
];

function Stat({ icon: Icon, value, label, color }: { icon: any; value: string | number; label: string; color: string }) {
  return (
    <div className="rounded-lg border border-[#222] bg-[#111] p-3 text-center" data-testid={`share-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <Icon className="h-4 w-4 mx-auto mb-1" style={{ color }} />
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

export default function RecoveryReportShare() {
  const [, params] = useRoute<{ shareId: string }>("/report/s/:shareId");
  const shareId = params?.shareId ?? "";

  const { data, isLoading, isError } = useQuery<PublicRecoveryReport>({
    queryKey: ["/api/recovery/report/share", shareId],
    queryFn: async () => {
      const res = await fetch(`/api/recovery/report/share/${encodeURIComponent(shareId)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return (await res.json()) as PublicRecoveryReport;
    },
    enabled: !!shareId,
    retry: false,
  });

  const deficitData = (data?.deficitTrend ?? []).map((p) => ({ date: d(p.date), ...p }));
  const consistencyData = (data?.consistency ?? []).slice(-90).map((p) => ({ date: d(p.date), Reps: p.reps }));
  const volumeData = (data?.exerciseVolume ?? []).map((p) => ({ week: d(p.weekStart), Reps: p.reps, Sessions: p.sessions }));
  const vitalsData = (data?.vitals ?? []).map((p) => ({ date: d(p.date), Systolic: p.systolic, Diastolic: p.diastolic, HR: p.heartRate }));

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <SEO
        title="A survivor's recovery report · Stroke Recovery Academy"
        description="Recovery outcomes over time, shared by a stroke survivor on Stroke Recovery Academy."
      />
      <main className="max-w-3xl mx-auto px-4 py-10">
        {isLoading && (
          <div className="text-center space-y-3 py-16">
            <Activity className="h-8 w-8 text-[#E2741B] mx-auto animate-pulse" />
            <p className="text-sm text-gray-500">Loading the report…</p>
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-[#222] bg-[#111] p-6 text-center space-y-3" data-testid="report-share-not-found">
            <AlertCircle className="h-8 w-8 text-gray-500 mx-auto" />
            <h1 className="text-xl font-bold text-white">This report isn't public</h1>
            <p className="text-sm text-gray-500">
              The link may be wrong, or the survivor took it private. Both are okay.
            </p>
            <Button asChild className="bg-[#E2741B] hover:bg-[#c9631a] text-black">
              <Link href="/" data-testid="link-report-share-home">Visit Stroke Recovery Academy</Link>
            </Button>
          </div>
        )}

        {data && (
          <article data-testid="report-share-card" className="space-y-6">
            <header className="text-center space-y-2">
              <Badge variant="outline" className="border-[#E2741B]/50 text-[#E2741B] bg-[#E2741B]/10 text-[10px]">
                Recovery Report
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                A survivor's recovery, over time
              </h1>
              <p className="text-xs text-gray-500">
                {data.tenure.memberSince
                  ? `Tracking since ${new Date(data.tenure.memberSince + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long" })} · ${data.tenure.daysTracked} days`
                  : "Recovery in progress"}
              </p>
            </header>

            {!data.hasData ? (
              <p className="text-center text-gray-500 text-sm py-8">This survivor is just getting started.</p>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2">
                  <Stat icon={Flame} value={data.summary.currentStreak} label="Streak" color="#E2741B" />
                  <Stat icon={Zap} value={data.summary.totalReps.toLocaleString()} label="Reps" color="#34d399" />
                  <Stat icon={Sparkles} value={data.summary.breakthroughCount} label="Breakthroughs" color="#f9a05a" />
                  <Stat icon={Trophy} value={data.summary.milestoneCount} label="Milestones" color="#fbbf24" />
                </div>

                {deficitData.length > 0 && (
                  <section className="rounded-lg border border-[#222] bg-[#111] p-5" data-testid="share-deficit">
                    <h2 className="text-sm font-semibold text-white mb-1">Sasquatch Scale over time</h2>
                    <p className="text-[11px] text-gray-500 mb-3">Higher is stronger — 1 is lowest, 10 is highest.</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={deficitData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="date" stroke="#666" fontSize={11} />
                        <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke="#666" fontSize={11} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {SCALE_LINES.map((l) => (
                          <Line key={l.key} type="monotone" dataKey={l.key} name={l.label} stroke={l.color} strokeWidth={2} dot={false} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {consistencyData.length > 0 && (
                  <section className="rounded-lg border border-[#222] bg-[#111] p-5" data-testid="share-consistency">
                    <h2 className="text-sm font-semibold text-white mb-3">Daily reps — consistency</h2>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={consistencyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="date" stroke="#666" fontSize={10} interval="preserveStartEnd" />
                        <YAxis stroke="#666" fontSize={11} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="Reps" fill="#E2741B" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {volumeData.length > 0 && (
                  <section className="rounded-lg border border-[#222] bg-[#111] p-5" data-testid="share-volume">
                    <h2 className="text-sm font-semibold text-white mb-3">Weekly exercise volume</h2>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={volumeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="week" stroke="#666" fontSize={10} interval="preserveStartEnd" />
                        <YAxis stroke="#666" fontSize={11} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Reps" fill="#60a5fa" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Sessions" fill="#a78bfa" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {vitalsData.length > 0 && (
                  <section className="rounded-lg border border-[#222] bg-[#111] p-5" data-testid="share-vitals">
                    <h2 className="text-sm font-semibold text-white mb-3">Vitals trend</h2>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={vitalsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="date" stroke="#666" fontSize={10} interval="preserveStartEnd" />
                        <YAxis stroke="#666" fontSize={11} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="Systolic" stroke="#E2741B" strokeWidth={2} dot={false} connectNulls />
                        <Line type="monotone" dataKey="Diastolic" stroke="#fbbf24" strokeWidth={2} dot={false} connectNulls />
                        <Line type="monotone" dataKey="HR" stroke="#60a5fa" strokeWidth={2} dot={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {data.milestones.length > 0 && (
                  <section className="rounded-lg border border-[#222] bg-[#111] p-5" data-testid="share-milestones">
                    <h2 className="text-sm font-semibold text-white mb-3">Milestones</h2>
                    <div className="space-y-2">
                      {data.milestones.slice().reverse().map((m, i) => (
                        <div key={i} className="flex items-center gap-3 flex-wrap">
                          <Trophy className="h-4 w-4 text-[#fbbf24] shrink-0" />
                          <span className="text-sm text-white">{m.name}</span>
                          <Badge variant="outline" className="border-[#333] text-gray-400 text-[10px]">{m.category}</Badge>
                          <span className="text-xs text-gray-600 ml-auto">{d(m.date)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {data.flickers.length > 0 && (
                  <section className="rounded-lg border border-[#222] bg-[#111] p-5" data-testid="share-flickers">
                    <h2 className="text-sm font-semibold text-white mb-1">First returns &amp; flickers</h2>
                    <p className="text-[11px] text-gray-500 mb-3">{data.summary.flickerCount} logged · {data.summary.breakthroughCount} breakthroughs</p>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {data.flickers.slice().reverse().map((f, i) => (
                        <div key={i} className="flex items-center gap-3 flex-wrap text-sm">
                          <Sparkles className={`h-4 w-4 shrink-0 ${f.isBreakthrough ? "text-[#f9a05a]" : "text-gray-600"}`} />
                          <span className="text-xs text-gray-600 w-16 shrink-0">{d(f.date)}</span>
                          {f.bodyPart && <Badge variant="outline" className="border-[#333] text-gray-400 text-[10px]">{f.bodyPart}</Badge>}
                          <span className="text-xs text-gray-600 ml-auto">{f.intensity}/5</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            <div className="rounded-md border border-[#2a1f1f] bg-[#1a0f0f]/60 px-4 py-3 text-xs text-gray-400 flex items-start gap-2" data-testid="share-disclaimer">
              <ShieldAlert className="h-4 w-4 text-red-400/80 shrink-0 mt-0.5" />
              <span>
                This is one survivor's logged progress — education and encouragement, not a clinical
                assessment, diagnosis, or medical advice. It reflects what they chose to share; no
                journal text or medical notes are included.
              </span>
            </div>

            <div className="border-t border-[#222] pt-5 text-center">
              <p className="text-[11px] uppercase tracking-widest text-[#E2741B]/70 mb-2">Made on Stroke Recovery Academy</p>
              <Link href="/recovery" className="inline-flex items-center gap-2 text-sm text-[#E2741B] font-semibold hover:text-[#f9a05a]" data-testid="link-share-cta">
                Start your own recovery
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
