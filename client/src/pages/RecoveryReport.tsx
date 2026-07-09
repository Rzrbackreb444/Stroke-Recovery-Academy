import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { useState } from "react";
import RecoveryHeader from "@/components/RecoveryHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { MedicalDisclaimerCard } from "@/components/recovery/MedicalDisclaimerCard";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  ChevronLeft, Download, Share2, Copy, Check, Trophy, Zap,
  Sparkles, Activity, Flame, FileText,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RecoveryReport as Report } from "@shared/reportTypes";

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

const SCALE_LINES: { key: keyof Report["deficitTrend"][number]; label: string; color: string }[] = [
  { key: "physical", label: "Physical", color: "#E2741B" },
  { key: "cognitive", label: "Cognitive", color: "#60a5fa" },
  { key: "speech", label: "Speech", color: "#34d399" },
  { key: "emotional", label: "Emotional", color: "#f472b6" },
  { key: "memory", label: "Memory", color: "#fbbf24" },
];

function StatCard({ icon: Icon, value, label, color }: { icon: any; value: string | number; label: string; color: string }) {
  return (
    <Card className="bg-[#111] border-[#222] p-4 text-center" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <Icon className="h-5 w-5 mx-auto mb-1" style={{ color }} />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</div>
    </Card>
  );
}

export default function RecoveryReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery<Report>({
    queryKey: ["/api/recovery/report"],
    staleTime: 1000 * 60 * 5,
  });

  const { data: share } = useQuery<{ isShared: boolean; shareId: string | null }>({
    queryKey: ["/api/recovery/report/share"],
    staleTime: 1000 * 60,
  });

  const toggleShare = useMutation({
    mutationFn: async (isShared: boolean) => {
      const res = await apiRequest("POST", "/api/recovery/report/share", { isShared });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/report/share"] });
    },
    onError: () => toast({ title: "Couldn't update share link", variant: "destructive" }),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Sign in to view your recovery report.</p>
      </div>
    );
  }

  const shareUrl = share?.shareId ? `${window.location.origin}/report/s/${share.shareId}` : "";

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Copy failed", description: shareUrl });
    }
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/recovery/report/pdf", { credentials: "include" });
      if (!res.ok) throw new Error("failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-recovery-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "PDF export failed", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const deficitData = (data?.deficitTrend ?? []).map((p) => ({ date: d(p.date), ...p }));
  const consistencyData = (data?.consistency ?? []).slice(-90).map((p) => ({ date: d(p.date), Reps: p.reps }));
  const volumeData = (data?.exerciseVolume ?? []).map((p) => ({ week: d(p.weekStart), Reps: p.reps, Sessions: p.sessions }));
  const moodData = (data?.moodEnergy ?? []).slice(-90).filter((p) => p.mood != null).map((p) => ({ date: d(p.date), Mood: p.mood, Energy: p.energy }));
  const vitalsData = (data?.vitals ?? []).map((p) => ({ date: d(p.date), Systolic: p.systolic, Diastolic: p.diastolic, HR: p.heartRate }));

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <SEO
        title="My Recovery Report | Stroke Recovery Academy"
        description="Your recovery outcomes over time — Sasquatch Scale, streaks, exercise volume, flickers, vitals, and milestones."
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link href="/recovery/progress">
            <Button variant="ghost" size="icon" className="text-gray-400" data-testid="button-back-progress">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">My Recovery Report</h1>
            <p className="text-xs text-gray-500">The long arc. Proof of work you can hold in your hand.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={downloadPdf}
              disabled={downloading || !data?.hasData}
              className="bg-[#E2741B] hover:bg-[#c9631a] text-black gap-1.5"
              data-testid="button-download-pdf"
            >
              <Download className="h-4 w-4" />
              {downloading ? "Building…" : "Export PDF"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-[#1a1a1a] animate-pulse" />
            ))}
          </div>
        ) : !data?.hasData ? (
          <Card className="bg-[#111] border-[#222] p-8 text-center" data-testid="report-empty">
            <FileText className="h-10 w-10 mx-auto mb-3 text-gray-600" />
            <h2 className="text-lg font-bold text-white mb-1">Nothing to report yet</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              This report fills itself in as you log reps, check-ins, flickers, and assessments.
              Start with one rep today — the arc builds from there.
            </p>
            <Link href="/recovery/never-zero">
              <Button className="mt-4 bg-[#E2741B] hover:bg-[#c9631a] text-black" data-testid="button-start-logging">
                Log your first rep
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Tenure line */}
            <p className="text-xs text-gray-500 mb-4" data-testid="text-tenure">
              {data.tenure.memberSince
                ? `Tracking since ${new Date(data.tenure.memberSince + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · ${data.tenure.daysTracked} days`
                : "Recovery in progress"}
            </p>

            {/* Summary grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
              <StatCard icon={Flame} value={data.summary.currentStreak} label="Current Streak" color="#E2741B" />
              <StatCard icon={Trophy} value={data.summary.longestStreak} label="Longest Streak" color="#fbbf24" />
              <StatCard icon={Activity} value={data.summary.totalActiveDays} label="Active Days" color="#60a5fa" />
              <StatCard icon={Zap} value={data.summary.totalReps.toLocaleString()} label="Total Reps" color="#34d399" />
              <StatCard icon={Activity} value={data.summary.exerciseSessions} label="Sessions" color="#a78bfa" />
              <StatCard icon={Sparkles} value={data.summary.flickerCount} label="Flickers" color="#f472b6" />
              <StatCard icon={Sparkles} value={data.summary.breakthroughCount} label="Breakthroughs" color="#f9a05a" />
              <StatCard icon={Trophy} value={data.summary.milestoneCount} label="Milestones" color="#fbbf24" />
            </div>

            {/* Sasquatch Scale trend */}
            {deficitData.length > 0 && (
              <Card className="bg-[#111] border-[#222] p-5 mb-6" data-testid="card-deficit-trend">
                <h2 className="text-sm font-semibold text-white mb-1">Sasquatch Scale over time</h2>
                <p className="text-[11px] text-gray-500 mb-3">Higher is stronger — 1 is lowest, 10 is highest. Your self-rated function across five domains.</p>
                <ResponsiveContainer width="100%" height={220}>
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
              </Card>
            )}

            {/* Consistency */}
            {consistencyData.length > 0 && (
              <Card className="bg-[#111] border-[#222] p-5 mb-6" data-testid="card-consistency">
                <h2 className="text-sm font-semibold text-white mb-3">Daily reps — consistency</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={consistencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" stroke="#666" fontSize={10} interval="preserveStartEnd" />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="Reps" fill="#E2741B" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Exercise volume */}
            {volumeData.length > 0 && (
              <Card className="bg-[#111] border-[#222] p-5 mb-6" data-testid="card-volume">
                <h2 className="text-sm font-semibold text-white mb-3">Weekly exercise volume</h2>
                <ResponsiveContainer width="100%" height={180}>
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
              </Card>
            )}

            {/* Mood / energy */}
            {moodData.length > 0 && (
              <Card className="bg-[#111] border-[#222] p-5 mb-6" data-testid="card-mood">
                <h2 className="text-sm font-semibold text-white mb-3">Mood &amp; energy</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={moodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" stroke="#666" fontSize={10} interval="preserveStartEnd" />
                    <YAxis domain={[0, 5]} stroke="#666" fontSize={11} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Mood" stroke="#f472b6" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="Energy" stroke="#34d399" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Vitals */}
            {vitalsData.length > 0 && (
              <Card className="bg-[#111] border-[#222] p-5 mb-6" data-testid="card-vitals">
                <h2 className="text-sm font-semibold text-white mb-3">Vitals trend</h2>
                <ResponsiveContainer width="100%" height={180}>
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
              </Card>
            )}

            {/* Milestones */}
            {data.milestones.length > 0 && (
              <Card className="bg-[#111] border-[#222] p-5 mb-6" data-testid="card-milestones">
                <h2 className="text-sm font-semibold text-white mb-3">Milestones</h2>
                <div className="space-y-2">
                  {data.milestones.slice().reverse().map((m, i) => (
                    <div key={i} className="flex items-center gap-3 flex-wrap" data-testid={`milestone-${i}`}>
                      <Trophy className="h-4 w-4 text-[#fbbf24] shrink-0" />
                      <span className="text-sm text-white">{m.name}</span>
                      <Badge variant="outline" className="border-[#333] text-gray-400 text-[10px]">{m.category}</Badge>
                      <span className="text-xs text-gray-600 ml-auto">{d(m.date)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Flickers timeline */}
            {data.flickers.length > 0 && (
              <Card className="bg-[#111] border-[#222] p-5 mb-6" data-testid="card-flickers">
                <h2 className="text-sm font-semibold text-white mb-1">First returns &amp; flickers</h2>
                <p className="text-[11px] text-gray-500 mb-3">{data.summary.flickerCount} logged · {data.summary.breakthroughCount} breakthroughs</p>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {data.flickers.slice().reverse().map((f, i) => (
                    <div key={i} className="flex items-start gap-3 flex-wrap text-sm" data-testid={`flicker-${i}`}>
                      {f.isBreakthrough ? <Sparkles className="h-4 w-4 text-[#f9a05a] shrink-0 mt-0.5" /> : <Sparkles className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />}
                      <span className="text-xs text-gray-600 w-16 shrink-0">{d(f.date)}</span>
                      <span className="text-gray-300 flex-1 min-w-[8rem]">
                        {f.bodyPart && <Badge variant="outline" className="border-[#333] text-gray-400 text-[10px] mr-2">{f.bodyPart}</Badge>}
                        {f.moment || <span className="text-gray-500 italic">flicker logged</span>}
                      </span>
                      <span className="text-xs text-gray-600">{f.intensity}/5</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Share controls */}
            <Card className="bg-[#111] border-[#222] p-5 mb-6" data-testid="card-share">
              <div className="flex items-start gap-3">
                <Share2 className="h-5 w-5 text-[#E2741B] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-white mb-1">Share this report</h2>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Private by default. When you turn it on, anyone with the link sees your trends and milestones —
                    never your journal text, notes, or medical details. Turn it off and the link dies instantly.
                  </p>
                  {share?.isShared ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          readOnly
                          value={shareUrl}
                          className="flex-1 min-w-[12rem] bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-xs text-gray-300 font-mono"
                          data-testid="input-share-url"
                        />
                        <Button variant="outline" size="sm" onClick={copyLink} className="border-[#333] gap-1.5" data-testid="button-copy-link">
                          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleShare.mutate(false)}
                        disabled={toggleShare.isPending}
                        className="text-red-400 hover:text-red-300"
                        data-testid="button-revoke-share"
                      >
                        Turn off &amp; revoke link
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => toggleShare.mutate(true)}
                      disabled={toggleShare.isPending}
                      className="bg-[#E2741B] hover:bg-[#c9631a] text-black gap-1.5"
                      data-testid="button-create-share"
                    >
                      <Share2 className="h-4 w-4" />
                      Create private share link
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <MedicalDisclaimerCard
              variant="full"
              extraContext="This report reflects what you logged — it is not a clinical assessment or diagnosis. Bring it to your care team to inform, not replace, their guidance."
            />
          </>
        )}
      </div>
    </div>
  );
}
