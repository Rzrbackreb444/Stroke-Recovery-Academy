import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Camera,
  ExternalLink,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FunnelStage {
  key: string;
  label: string;
  count: number;
}

interface BusinessMetrics {
  generatedAt: string;
  funnel: FunnelStage[];
  revenue: {
    mrrCents: number;
    arrCents: number;
    activeSubs: number;
    trialingSubs: number;
    atRiskSubs: number;
    downgradedSubs: number;
    monthlySubs: number;
    annualSubs: number;
    founderSubs: number;
  };
  conversion: {
    signupToIntake: number | null;
    intakeToActivation: number | null;
    trialToPaid: number | null;
    trialCancelRate: number | null;
  };
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    dauWauRatio: number | null;
    activationRate: number | null;
    activatedTotal: number;
    signupsTotal: number;
  };
  churn: { downgradedLast30: number; canceledTrialsLast30: number };
  depth: {
    loopCompletionRate: number | null;
    loopCompletedToday: number;
    returnRate: number | null;
    priorCohort: number;
    returnedCohort: number;
  };
  lifecycleMessages: Array<{ category: string; sent: number; failed: number }>;
}

type TrendRow = {
  snapshot_date: string;
  mrr_cents: number;
  active_subs: number;
  dau: number;
  wau: number;
  activation_rate: number;
  signups_total: number;
  loop_completion_rate: number | null;
  return_rate: number | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function pct(v: number | null, decimals = 1): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(decimals)}%`;
}
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// Return the conversion % change from first to last trend row for a given metric
function trendDelta(rows: TrendRow[], field: keyof TrendRow): number | null {
  if (rows.length < 2) return null;
  const first = Number(rows[0][field] ?? 0);
  const last = Number(rows[rows.length - 1][field] ?? 0);
  if (!first) return null;
  return (last - first) / first;
}

// ─── Auto-insight: find the weakest conversion step ──────────────────────────
interface FocusArea {
  title: string;
  metric: string;
  suggestion: string;
  severity: "warn" | "ok";
}

function getFocusArea(data: BusinessMetrics): FocusArea | null {
  const candidates: { title: string; val: number | null; suggestion: string }[] = [
    {
      title: "Signup → Intake",
      val: data.conversion.signupToIntake,
      suggestion:
        "Most signups are not completing intake. Consider shortening further or surfacing intake immediately after account creation.",
    },
    {
      title: "Intake → Activation",
      val: data.conversion.intakeToActivation,
      suggestion:
        "Survivors finish intake but don't touch the core loops. Push a Day-1 prompt to open Coach + log a check-in — that's the activation gate.",
    },
    {
      title: "Trial → Paid",
      val: data.conversion.trialToPaid,
      suggestion:
        "Trial conversion is the direct revenue lever. Add a Day-6 email + in-app win summary before the trial ends — show them what they've built.",
    },
  ];

  const valid = candidates.filter((c) => c.val !== null) as {
    title: string;
    val: number;
    suggestion: string;
  }[];
  if (!valid.length) return null;

  const worst = valid.reduce((a, b) => (a.val < b.val ? a : b));

  return {
    title: worst.title,
    metric: pct(worst.val),
    suggestion: worst.suggestion,
    severity: worst.val < 0.35 ? "warn" : "ok",
  };
}

// ─── Custom dark tooltip ──────────────────────────────────────────────────────
const DarkTooltip = ({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-stone-900 border border-stone-700 rounded-md px-3 py-2 text-xs shadow-xl">
      <div className="text-stone-400 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

// ─── KPI hero card ────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  delta,
  accent,
  testId,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  accent?: string;
  testId: string;
}) {
  return (
    <Card
      className="p-5 bg-stone-900 border-stone-800 flex flex-col gap-1"
      data-testid={testId}
    >
      <div className="text-stone-500 text-xs uppercase tracking-widest font-semibold">
        {label}
      </div>
      <div className={`text-3xl font-black leading-none ${accent ?? "text-stone-100"}`}>
        {value}
      </div>
      {sub && <div className="text-stone-500 text-xs">{sub}</div>}
      {delta != null && (
        <div
          className={`flex items-center gap-1 text-xs font-semibold mt-0.5 ${
            delta >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {delta >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {delta >= 0 ? "+" : ""}
          {(delta * 100).toFixed(1)}% vs 30d ago
        </div>
      )}
    </Card>
  );
}

// ─── Funnel step ──────────────────────────────────────────────────────────────
function FunnelStep({
  stage,
  prev,
  isLast,
}: {
  stage: FunnelStage;
  prev: FunnelStage | null;
  isLast: boolean;
}) {
  const conversion =
    prev && prev.count > 0 ? (stage.count / prev.count) * 100 : null;
  const convColor =
    conversion == null
      ? "text-stone-600"
      : conversion >= 60
      ? "text-green-400"
      : conversion >= 30
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
        <div className="w-full bg-stone-800 rounded-md px-3 py-2.5 text-center">
          <div className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">
            {stage.label}
          </div>
          <div
            className="text-xl font-black text-stone-100"
            data-testid={`count-funnel-${stage.key}`}
          >
            {stage.count.toLocaleString()}
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <div className={`text-[10px] font-bold ${convColor}`}>
            {conversion != null ? `${conversion.toFixed(0)}%` : ""}
          </div>
          <ArrowRight className="w-4 h-4 text-stone-600" />
        </div>
      )}
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-stone-200">{children}</h2>
      {sub && <p className="text-stone-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function AdminBusinessDashboard() {
  const { toast } = useToast();

  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<BusinessMetrics>({
      queryKey: ["/api/admin/business/metrics"],
      queryFn: async () => {
        const r = await fetch("/api/admin/business/metrics", {
          credentials: "include",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      },
    });

  const { data: trendData } = useQuery<{ days: number; trends: TrendRow[] }>({
    queryKey: ["/api/admin/business/trends"],
    queryFn: async () => {
      const r = await fetch("/api/admin/business/trends?days=60", {
        credentials: "include",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const snapshot = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/admin/business/snapshot"),
    onSuccess: () => {
      toast({ title: "Snapshot captured" });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/business/trends"],
      });
    },
    onError: () =>
      toast({ title: "Snapshot failed", variant: "destructive" }),
  });

  const trends = trendData?.trends ?? [];
  const mrrDelta = trendDelta(trends, "mrr_cents");
  const dauDelta = trendDelta(trends, "dau");

  const focusArea = data ? getFocusArea(data) : null;

  // Chart-ready trend data
  const chartTrends = trends.map((r) => ({
    date: shortDate(r.snapshot_date),
    MRR: Math.round(r.mrr_cents / 100),
    DAU: r.dau,
    WAU: r.wau,
    "Active subs": r.active_subs,
    "Loop %": Math.round((r.loop_completion_rate ?? 0) * 1000) / 10,
    "Return %": Math.round((r.return_rate ?? 0) * 1000) / 10,
  }));

  // Subscription breakdown for bar chart
  const subBreakdown = data
    ? [
        { name: "Monthly active", value: data.revenue.monthlySubs, color: "#E2741B" },
        { name: "Annual active", value: data.revenue.annualSubs, color: "#f59e0b" },
        { name: "Founder active", value: data.revenue.founderSubs, color: "#d97706" },
        { name: "Trialing", value: data.revenue.trialingSubs, color: "#6366f1" },
        { name: "At risk", value: data.revenue.atRiskSubs, color: "#ef4444" },
        { name: "Churned (30d)", value: data.churn.downgradedLast30, color: "#78716c" },
      ]
    : [];

  // Lifecycle message chart
  const msgChart = (data?.lifecycleMessages ?? []).map((m) => ({
    name: m.category.replace(/_/g, " "),
    Sent: m.sent,
    Failed: m.failed,
  }));

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1
              className="text-3xl font-black text-stone-100 mb-1"
              data-testid="text-business-title"
            >
              Business intelligence
            </h1>
            <p className="text-stone-500 text-sm">
              Live funnel · revenue · engagement · email — all computed from
              platform data, no third-party vendor.
              {data && (
                <span className="ml-2 text-stone-600">
                  Updated {new Date(data.generatedAt).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/admin/subscriptions/risk">
              <Button size="sm" variant="outline" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                Sub risk
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => snapshot.mutate()}
              disabled={snapshot.isPending}
              data-testid="button-snapshot"
              className="gap-1.5"
            >
              {snapshot.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              Snapshot now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh"
              className="gap-1.5"
            >
              {isFetching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Loading / Error ── */}
        {isLoading && (
          <Card className="p-12 bg-stone-900 border-stone-800 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-stone-500" />
          </Card>
        )}
        {isError && !isLoading && (
          <Card
            className="p-6 bg-red-950/30 border-red-800 text-red-200"
            data-testid="card-error"
          >
            Couldn't load metrics. Check that you're signed in as admin.
          </Card>
        )}

        {!isLoading && !isError && data && (
          <div className="space-y-6">

            {/* ── KPI strip ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard
                label="MRR"
                value={usd(data.revenue.mrrCents)}
                sub={`ARR ${usd(data.revenue.arrCents)}`}
                delta={mrrDelta}
                accent="text-green-400"
                testId="stat-mrr"
              />
              <KpiCard
                label="Active subscribers"
                value={String(data.revenue.activeSubs)}
                sub={`${data.revenue.monthlySubs} monthly · ${data.revenue.annualSubs} annual · ${data.revenue.founderSubs} founder`}
                testId="stat-active-subs"
                accent="text-stone-100"
              />
              <KpiCard
                label="In free trial"
                value={String(data.revenue.trialingSubs)}
                sub={`${data.revenue.atRiskSubs} at risk · ${data.revenue.downgradedSubs} churned`}
                accent="text-amber-400"
                testId="stat-trialing"
              />
              <KpiCard
                label="Trial → paid"
                value={pct(data.conversion.trialToPaid)}
                sub={`Cancel rate ${pct(data.conversion.trialCancelRate)}`}
                accent={
                  (data.conversion.trialToPaid ?? 0) >= 0.4
                    ? "text-green-400"
                    : "text-red-400"
                }
                testId="stat-trial2paid"
              />
              <KpiCard
                label="DAU"
                value={String(data.engagement.dau)}
                sub={`WAU ${data.engagement.wau} · MAU ${data.engagement.mau}`}
                delta={dauDelta}
                testId="stat-dau"
              />
              <KpiCard
                label="DAU / WAU"
                value={pct(data.engagement.dauWauRatio)}
                sub="Stickiness ratio"
                accent={
                  (data.engagement.dauWauRatio ?? 0) >= 0.3
                    ? "text-green-400"
                    : "text-amber-400"
                }
                testId="stat-dau-wau"
              />
              <KpiCard
                label="Activation rate"
                value={pct(data.engagement.activationRate)}
                sub={`${data.engagement.activatedTotal} of ${data.engagement.signupsTotal} signups`}
                accent={
                  (data.engagement.activationRate ?? 0) >= 0.4
                    ? "text-green-400"
                    : "text-amber-400"
                }
                testId="stat-activation"
              />
              <KpiCard
                label="Churn (30d)"
                value={String(data.churn.downgradedLast30)}
                sub={`${data.churn.canceledTrialsLast30} trials canceled`}
                accent={
                  data.churn.downgradedLast30 === 0
                    ? "text-green-400"
                    : "text-red-400"
                }
                testId="stat-churn"
              />
            </div>

            {/* ── Focus callout ── */}
            {focusArea && (
              <div
                className={`flex items-start gap-4 rounded-lg border px-5 py-4 ${
                  focusArea.severity === "warn"
                    ? "bg-amber-950/30 border-amber-800/50"
                    : "bg-stone-900 border-stone-800"
                }`}
                data-testid="card-focus"
              >
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    focusArea.severity === "warn"
                      ? "text-amber-400"
                      : "text-stone-500"
                  }`}
                />
                <div>
                  <div className="font-bold text-stone-100 text-sm mb-0.5">
                    Focus here:{" "}
                    <span className="text-amber-400">{focusArea.title}</span>{" "}
                    is your weakest step at{" "}
                    <span className="text-red-400">{focusArea.metric}</span>
                  </div>
                  <p className="text-stone-400 text-sm">{focusArea.suggestion}</p>
                </div>
              </div>
            )}

            {/* ── MRR trend + Sub breakdown ── */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 bg-stone-900 border-stone-800">
                <SectionHeading sub="Daily snapshot history">
                  MRR trend
                </SectionHeading>
                {chartTrends.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-stone-600 text-sm">
                    No snapshots yet — click "Snapshot now" to capture the first data point.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartTrends} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                      <XAxis dataKey="date" tick={{ fill: "#78716c", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => `$${v}`} tick={{ fill: "#78716c", fontSize: 10 }} tickLine={false} axisLine={false} width={48} />
                      <Tooltip content={(p) => <DarkTooltip {...p} formatter={(v) => `$${v.toLocaleString()}`} />} />
                      <Area type="monotone" dataKey="MRR" stroke="#22c55e" strokeWidth={2} fill="url(#mrrGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card className="p-5 bg-stone-900 border-stone-800">
                <SectionHeading sub="Current subscriber state">
                  Subscriber breakdown
                </SectionHeading>
                <div className="space-y-2.5 mt-2">
                  {subBreakdown.map((item) => {
                    const total = Math.max(
                      subBreakdown.reduce((s, i) => s + i.value, 0),
                      1
                    );
                    const w = Math.round((item.value / total) * 100);
                    return (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-stone-400">{item.name}</span>
                          <span className="font-bold text-stone-200">
                            {item.value}
                          </span>
                        </div>
                        <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${w}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* ── Survivor funnel ── */}
            <Card className="p-5 bg-stone-900 border-stone-800">
              <SectionHeading sub="Signup → intake → activation → trial → paid → retained. Conversion % shown between each step.">
                Survivor lifecycle funnel
              </SectionHeading>
              <div className="flex items-stretch gap-1 overflow-x-auto">
                {data.funnel.map((stage, i) => (
                  <FunnelStep
                    key={stage.key}
                    stage={stage}
                    prev={i > 0 ? data.funnel[i - 1] : null}
                    isLast={i === data.funnel.length - 1}
                  />
                ))}
              </div>
              {/* Conversion rate row */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[
                  { label: "Signup → intake", val: data.conversion.signupToIntake },
                  { label: "Intake → activation", val: data.conversion.intakeToActivation },
                  { label: "Trial → paid", val: data.conversion.trialToPaid },
                  { label: "Trial cancel rate", val: data.conversion.trialCancelRate },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="bg-stone-800 rounded-md px-3 py-2 text-center"
                  >
                    <div className="text-[10px] text-stone-500 uppercase tracking-wide mb-1">
                      {c.label}
                    </div>
                    <div
                      className={`text-lg font-black ${
                        c.val == null
                          ? "text-stone-600"
                          : c.val >= 0.5
                          ? "text-green-400"
                          : c.val >= 0.25
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {pct(c.val)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ── DAU/WAU trend + Engagement depth ── */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 bg-stone-900 border-stone-800">
                <SectionHeading sub="Distinct survivors active in rolling window">
                  Daily vs weekly actives
                </SectionHeading>
                {chartTrends.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-stone-600 text-sm">
                    No snapshots yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartTrends} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                      <XAxis dataKey="date" tick={{ fill: "#78716c", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#78716c", fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                      <Tooltip content={(p) => <DarkTooltip {...p} />} />
                      <Legend wrapperStyle={{ fontSize: 10, color: "#78716c" }} />
                      <Line type="monotone" dataKey="DAU" stroke="#E2741B" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="WAU" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card className="p-5 bg-stone-900 border-stone-800">
                <SectionHeading sub="How deeply survivors engage each day">
                  Engagement depth
                </SectionHeading>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    {
                      label: "Loop completion",
                      value: pct(data.depth.loopCompletionRate),
                      sub: `${data.depth.loopCompletedToday} closed the loop today`,
                      accent:
                        (data.depth.loopCompletionRate ?? 0) >= 0.4
                          ? "text-green-400"
                          : "text-amber-400",
                    },
                    {
                      label: "Return rate",
                      value: pct(data.depth.returnRate),
                      sub: `${data.depth.returnedCohort} of ${data.depth.priorCohort} came back`,
                      accent:
                        (data.depth.returnRate ?? 0) >= 0.4
                          ? "text-green-400"
                          : "text-amber-400",
                    },
                    {
                      label: "Activation rate",
                      value: pct(data.engagement.activationRate),
                      sub: `${data.engagement.activatedTotal} activated`,
                      accent:
                        (data.engagement.activationRate ?? 0) >= 0.4
                          ? "text-green-400"
                          : "text-amber-400",
                    },
                    {
                      label: "DAU / WAU",
                      value: pct(data.engagement.dauWauRatio),
                      sub: "Stickiness",
                      accent:
                        (data.engagement.dauWauRatio ?? 0) >= 0.3
                          ? "text-green-400"
                          : "text-amber-400",
                    },
                  ].map((item) => (
                    <div key={item.label} className="bg-stone-800 rounded-md p-3 text-center">
                      <div className="text-[10px] text-stone-500 uppercase tracking-wide mb-1">
                        {item.label}
                      </div>
                      <div className={`text-2xl font-black ${item.accent}`}>
                        {item.value}
                      </div>
                      <div className="text-[10px] text-stone-600 mt-0.5">{item.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Loop + return trend sparkline */}
                {chartTrends.length > 1 && (
                  <div className="mt-4">
                    <div className="text-[10px] text-stone-500 mb-1 uppercase tracking-wide">
                      30-day trend
                    </div>
                    <ResponsiveContainer width="100%" height={70}>
                      <LineChart data={chartTrends} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                        <Tooltip content={(p) => <DarkTooltip {...p} formatter={(v) => `${v}%`} />} />
                        <Line type="monotone" dataKey="Loop %" stroke="#E2741B" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="Return %" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </div>

            {/* ── Lifecycle email performance ── */}
            {msgChart.length > 0 && (
              <Card className="p-5 bg-stone-900 border-stone-800" data-testid="card-lifecycle">
                <SectionHeading sub="Delivery counts by lifecycle category (last 30 days)">
                  Email performance
                </SectionHeading>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={msgChart}
                    layout="vertical"
                    margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#78716c", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: "#a8a29e", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={110}
                    />
                    <Tooltip content={(p) => <DarkTooltip {...p} />} />
                    <Legend wrapperStyle={{ fontSize: 10, color: "#78716c" }} />
                    <Bar dataKey="Sent" fill="#E2741B" radius={[0, 3, 3, 0]} />
                    <Bar dataKey="Failed" fill="#ef4444" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
            {msgChart.length === 0 && (
              <Card className="p-5 bg-stone-900 border-stone-800" data-testid="card-lifecycle">
                <SectionHeading sub="Delivery counts by lifecycle category (last 30 days)">
                  Email performance
                </SectionHeading>
                <p className="text-stone-600 text-sm">No lifecycle messages sent in the last 30 days.</p>
              </Card>
            )}

            {/* ── Footer legend ── */}
            <p className="text-stone-600 text-xs pb-4">
              Activation = intake complete + ≥1 daily check-in + ≥1 coach message. MRR = active/trialing subs × Stripe price (annual ÷ 12). Snapshot history stored in{" "}
              <code className="font-mono">bi_daily_snapshots</code> — daily job at 04:45 UTC. All numbers computed from source-of-truth tables, not client events.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
