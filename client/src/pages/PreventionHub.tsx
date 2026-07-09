import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  ArrowLeft, HeartPulse, Pill, Activity, Check, X, Info,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MedicalDisclaimerCard } from "@/components/recovery/MedicalDisclaimerCard";
import FastWarningModule from "@/components/recovery/FastWarningModule";
import SEO from "@/components/SEO";

interface PreventionData {
  bp: {
    series: Array<{ date: string; systolic: number | null; diastolic: number | null; heartRate: number | null }>;
    latest: { date: string; systolic: number | null; diastolic: number | null; heartRate: number | null } | null;
    trend: "up" | "down" | "steady" | null;
    count: number;
  };
  medications: Array<{
    id: number;
    name: string;
    dosage: string;
    frequency: string;
    reminderTimes: string[];
    today: { taken: boolean; skipped: boolean };
  }>;
  adherence: {
    adherence7: number | null;
    adherence30: number | null;
    taken7: number;
    taken30: number;
    skipped30: number;
    expectedPerDay: number;
    lastLoggedAt: string | null;
  };
  activity: { activeDays30: number };
}

function trendLabel(trend: "up" | "down" | "steady" | null): string {
  if (trend === "up") return "Trending up lately";
  if (trend === "down") return "Trending down lately";
  if (trend === "steady") return "Holding steady lately";
  return "Not enough readings yet";
}

export default function PreventionHub() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<PreventionData>({ queryKey: ["/api/recovery/prevention"] });

  const logMed = useMutation({
    mutationFn: async ({ id, skipped }: { id: number; skipped: boolean }) =>
      apiRequest("POST", `/api/medications/${id}/log`, { skipped }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/prevention"] });
    },
    onError: () => {
      toast({ title: "Couldn't save that", description: "Try again in a moment.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#FDFBF7]">
      <SEO
        title="Prevention Track | Stroke Recovery Academy"
        description="Awareness and consistency tools to help lower second-stroke risk — blood pressure trends, medication reminders, activity, and the FAST warning signs. Non-clinical."
        canonical="/recovery/prevention"
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            href="/recovery/dashboard"
            className="inline-flex items-center gap-2 text-sm text-[#78716C] hover:text-[#FDFBF7] transition-colors"
            data-testid="link-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>

        <header>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Prevention track</h1>
          <p className="text-sm text-[#a8a29e] mt-1 max-w-2xl">
            A repeat stroke isn't a sentence — it's a set of odds you can nudge. This is about awareness and
            consistency, not scores or diagnoses. Keep the reps. Know the signs. Talk to your doctor about the rest.
          </p>
        </header>

        {/* FAST first — safety before data. */}
        <FastWarningModule />

        <MedicalDisclaimerCard
          variant="compact"
          extraContext="This track shows your own logged data as awareness — it is not a medical risk score, diagnosis, or treatment advice. Blood pressure, medication, and activity decisions belong with your doctor."
        />

        {/* ── Blood pressure trend ── */}
        <section
          className="rounded-2xl border border-[#222] bg-[#111] p-5"
          data-testid="section-bp"
        >
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse className="h-4 w-4 text-[#E2741B]" />
            <h2 className="text-base font-bold">Blood pressure — awareness trend</h2>
          </div>

          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-[#1a1a1a]" />
          ) : !data || data.bp.count === 0 ? (
            <div className="rounded-lg border border-dashed border-[#2a2a2a] p-6 text-center" data-testid="empty-bp">
              <p className="text-sm text-[#78716C]">
                No blood pressure readings yet. Log a few in your vitals and your trend will show up here.
              </p>
              <Link href="/recovery/vitals" className="mt-2 inline-block text-sm text-[#E2741B] hover:underline">
                Log vitals →
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-4 mb-4">
                <div>
                  <div className="text-sm text-[#78716C]">Most recent</div>
                  <div className="text-2xl font-black" data-testid="text-bp-latest">
                    {data.bp.latest?.systolic ?? "–"}/{data.bp.latest?.diastolic ?? "–"}
                    <span className="text-sm font-normal text-[#78716C] ml-1">mmHg</span>
                  </div>
                </div>
                <div className="text-sm text-[#a8a29e]" data-testid="text-bp-trend">{trendLabel(data.bp.trend)}</div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.bp.series} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#78716C", fontSize: 11 }}
                      tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    />
                    <YAxis tick={{ fill: "#78716C", fontSize: 11 }} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8, color: "#FDFBF7" }}
                      labelFormatter={(d) => new Date(d as string).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#E2741B" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#8B9DC3" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 flex items-start gap-2 text-sm text-[#78716C]">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Consistently high readings are worth a conversation with your doctor — this chart doesn't interpret them for you.
              </p>
            </>
          )}
        </section>

        {/* ── Medication adherence loop ── */}
        <section
          className="rounded-2xl border border-[#222] bg-[#111] p-5"
          data-testid="section-adherence"
        >
          <div className="flex items-center gap-2 mb-4">
            <Pill className="h-4 w-4 text-[#E2741B]" />
            <h2 className="text-base font-bold">Medications — staying consistent</h2>
          </div>

          {isLoading ? (
            <div className="h-32 animate-pulse rounded-lg bg-[#1a1a1a]" />
          ) : !data || data.medications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#2a2a2a] p-6 text-center" data-testid="empty-meds">
              <p className="text-sm text-[#78716C]">
                No active medications tracked. Add yours to turn on reminders and see your consistency.
              </p>
              <Link href="/recovery/medications" className="mt-2 inline-block text-sm text-[#E2741B] hover:underline">
                Add medications →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 mb-5">
                <div className="rounded-xl bg-[#161616] border border-[#222] p-4">
                  <div className="text-sm text-[#78716C]">Last 7 days</div>
                  <div className="text-2xl font-black" data-testid="text-adherence-7">
                    {data.adherence.adherence7 != null ? `${data.adherence.adherence7}%` : "–"}
                  </div>
                  <div className="text-sm text-[#78716C]">doses logged vs planned</div>
                </div>
                <div className="rounded-xl bg-[#161616] border border-[#222] p-4">
                  <div className="text-sm text-[#78716C]">Last 30 days</div>
                  <div className="text-2xl font-black" data-testid="text-adherence-30">
                    {data.adherence.adherence30 != null ? `${data.adherence.adherence30}%` : "–"}
                  </div>
                  <div className="text-sm text-[#78716C]">doses logged vs planned</div>
                </div>
              </div>

              <div className="text-sm uppercase tracking-widest text-[#78716C] mb-2">Did you take it today?</div>
              <ul className="space-y-2" data-testid="list-meds">
                {data.medications.map((m) => {
                  const done = m.today.taken;
                  const skipped = m.today.skipped;
                  return (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#222] bg-[#161616] p-3"
                      data-testid={`row-med-${m.id}`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{m.name}</div>
                        <div className="text-sm text-[#78716C] truncate">
                          {[m.dosage, m.frequency, m.reminderTimes.join(", ")].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400" data-testid={`status-med-${m.id}`}>
                          <Check className="h-4 w-4" /> Logged
                        </span>
                      ) : skipped ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#78716C]" data-testid={`status-med-${m.id}`}>
                          <X className="h-4 w-4" /> Skipped
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => logMed.mutate({ id: m.id, skipped: false })}
                            disabled={logMed.isPending}
                            className="inline-flex items-center gap-1 rounded-md bg-[#E2741B] px-3 py-1.5 text-sm font-bold text-black hover:bg-[#c9631a] transition-colors disabled:opacity-50"
                            data-testid={`button-med-taken-${m.id}`}
                          >
                            <Check className="h-3.5 w-3.5" /> Took it
                          </button>
                          <button
                            onClick={() => logMed.mutate({ id: m.id, skipped: true })}
                            disabled={logMed.isPending}
                            className="inline-flex items-center gap-1 rounded-md border border-[#333] px-3 py-1.5 text-sm text-[#a8a29e] hover:bg-[#1e1e1e] transition-colors disabled:opacity-50"
                            data-testid={`button-med-skipped-${m.id}`}
                          >
                            Skipped
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-sm text-[#78716C]">
                Reminders come through your notification settings — consent and quiet hours respected. Never stop or
                change a medication without your doctor.
              </p>
            </>
          )}
        </section>

        {/* ── Activity consistency ── */}
        <section
          className="rounded-2xl border border-[#222] bg-[#111] p-5"
          data-testid="section-activity"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-[#E2741B]" />
            <h2 className="text-base font-bold">Movement — active days</h2>
          </div>
          {isLoading ? (
            <div className="h-20 animate-pulse rounded-lg bg-[#1a1a1a]" />
          ) : (
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-black" data-testid="text-active-days">{data?.activity.activeDays30 ?? 0}</div>
              <div className="text-sm text-[#78716C]">active days in the last 30 — every one counts</div>
            </div>
          )}
          <Link href="/recovery/today" className="mt-3 inline-block text-sm text-[#E2741B] hover:underline">
            Log today's reps →
          </Link>
        </section>
      </div>
    </div>
  );
}
