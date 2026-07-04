import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
};

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function pct(v: number | null): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function Stat({
  label,
  value,
  sub,
  testId,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  testId: string;
  accent?: string;
}) {
  return (
    <Card className="p-4 bg-stone-900 border-stone-800" data-testid={testId}>
      <div className="text-stone-500 text-xs uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-black ${accent ?? "text-stone-100"}`}>{value}</div>
      {sub && <div className="text-stone-500 text-xs mt-1">{sub}</div>}
    </Card>
  );
}

export default function AdminBusinessDashboard() {
  const { toast } = useToast();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<BusinessMetrics>({
    queryKey: ["/api/admin/business/metrics"],
    queryFn: async () => {
      const r = await fetch("/api/admin/business/metrics", { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const { data: trendData } = useQuery<{ days: number; trends: TrendRow[] }>({
    queryKey: ["/api/admin/business/trends"],
    queryFn: async () => {
      const r = await fetch("/api/admin/business/trends?days=30", { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const snapshot = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/admin/business/snapshot"),
    onSuccess: () => {
      toast({ title: "Snapshot captured" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/business/trends"] });
    },
    onError: () => toast({ title: "Snapshot failed", variant: "destructive" }),
  });

  const trends = trendData?.trends ?? [];
  const maxFunnel = Math.max(...(data?.funnel ?? []).map((f) => f.count), 1);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-black mb-1" data-testid="text-business-title">
              Business intelligence
            </h1>
            <p className="text-stone-400 text-sm">
              In-house funnel + revenue + engagement. Computed live from platform
              data. Trends come from the daily snapshot job.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => snapshot.mutate()}
              disabled={snapshot.isPending}
              data-testid="button-snapshot"
            >
              {snapshot.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Snapshot now"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh"
            >
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </div>

        {isLoading && (
          <Card className="p-10 bg-stone-900 border-stone-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-stone-500" />
          </Card>
        )}

        {isError && !isLoading && (
          <Card className="p-6 bg-red-950/30 border-red-800 text-red-200" data-testid="card-error">
            Couldn't load metrics. Check that you're signed in as an admin.
          </Card>
        )}

        {!isLoading && !isError && data && (
          <>
            {/* Revenue + engagement headline stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Stat
                label="MRR"
                value={usd(data.revenue.mrrCents)}
                sub={`ARR ${usd(data.revenue.arrCents)}`}
                testId="stat-mrr"
                accent="text-green-400"
              />
              <Stat
                label="Active subs"
                value={String(data.revenue.activeSubs)}
                sub={`${data.revenue.monthlySubs} mo · ${data.revenue.annualSubs} yr`}
                testId="stat-active-subs"
              />
              <Stat
                label="Trialing"
                value={String(data.revenue.trialingSubs)}
                sub={`${data.revenue.atRiskSubs} at risk`}
                testId="stat-trialing"
                accent="text-amber-400"
              />
              <Stat
                label="Activation rate"
                value={pct(data.engagement.activationRate)}
                sub={`${data.engagement.activatedTotal} of ${data.engagement.signupsTotal}`}
                testId="stat-activation"
              />
              <Stat
                label="DAU"
                value={String(data.engagement.dau)}
                testId="stat-dau"
              />
              <Stat
                label="WAU"
                value={String(data.engagement.wau)}
                sub={`DAU/WAU ${pct(data.engagement.dauWauRatio)}`}
                testId="stat-wau"
              />
              <Stat
                label="Trial → paid"
                value={pct(data.conversion.trialToPaid)}
                testId="stat-trial2paid"
                accent="text-green-400"
              />
              <Stat
                label="Churn (30d)"
                value={String(data.churn.downgradedLast30)}
                sub={`${data.churn.canceledTrialsLast30} trials canceled`}
                testId="stat-churn"
                accent="text-red-400"
              />
            </div>

            {/* Lifecycle funnel */}
            <Card className="p-6 bg-stone-900 border-stone-800 mb-6">
              <h2 className="text-lg font-bold mb-1">Survivor lifecycle funnel</h2>
              <p className="text-stone-500 text-xs mb-4">
                Signup → intake → activation → trial → paid → retained. Computed
                from source-of-truth tables.
              </p>
              <div className="space-y-3">
                {data.funnel.map((f) => {
                  const widthPct = Math.round((f.count / maxFunnel) * 100);
                  return (
                    <div key={f.key} data-testid={`row-funnel-${f.key}`}>
                      <div className="flex items-baseline justify-between mb-1 gap-2 flex-wrap">
                        <div className="font-semibold">{f.label}</div>
                        <span
                          className="font-bold text-stone-100"
                          data-testid={`count-funnel-${f.key}`}
                        >
                          {f.count}
                        </span>
                      </div>
                      <div className="h-3 rounded-md bg-stone-800 overflow-hidden">
                        <div
                          className="h-full rounded-md bg-amber-600"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* MRR / DAU trend (sparkline-style bars) */}
            <Card className="p-6 bg-stone-900 border-stone-800 mb-6" data-testid="card-trends">
              <h2 className="text-lg font-bold mb-1">Trend (last 30 snapshots)</h2>
              {trends.length === 0 ? (
                <p className="text-stone-500 text-sm mt-2">
                  No snapshots yet. The daily job writes one per day, or use
                  "Snapshot now" to capture the first data point.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  <TrendBars
                    label="MRR"
                    rows={trends}
                    value={(r) => r.mrr_cents}
                    format={(v) => usd(v)}
                    color="bg-green-600"
                  />
                  <TrendBars
                    label="DAU"
                    rows={trends}
                    value={(r) => r.dau}
                    format={(v) => String(v)}
                    color="bg-amber-600"
                  />
                </div>
              )}
            </Card>

            {/* Lifecycle message performance */}
            <Card className="p-6 bg-stone-900 border-stone-800 mb-6" data-testid="card-lifecycle">
              <h2 className="text-lg font-bold mb-4">Lifecycle messages (30d)</h2>
              {data.lifecycleMessages.length === 0 ? (
                <p className="text-stone-500 text-sm">No message deliveries in the window.</p>
              ) : (
                <div className="space-y-2">
                  {data.lifecycleMessages.map((m) => (
                    <div
                      key={m.category}
                      className="flex items-center justify-between gap-2 flex-wrap"
                      data-testid={`row-lifecycle-${m.category}`}
                    >
                      <span className="font-medium">{m.category}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-stone-800 text-stone-300 border-stone-700 text-[10px]">
                          sent: {m.sent}
                        </Badge>
                        {m.failed > 0 && (
                          <Badge className="bg-red-950 text-red-300 border-red-800 text-[10px]">
                            failed: {m.failed}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <p className="text-stone-500 text-xs">
              Activation = intake complete + ≥1 daily check-in + ≥1 coach message.
              Revenue reads the durable subscription-state table joined to Stripe
              price amounts. Generated {new Date(data.generatedAt).toLocaleString()}.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function TrendBars({
  label,
  rows,
  value,
  format,
  color,
}: {
  label: string;
  rows: TrendRow[];
  value: (r: TrendRow) => number;
  format: (v: number) => string;
  color: string;
}) {
  const max = Math.max(...rows.map(value), 1);
  const latest = rows[rows.length - 1];
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 gap-2 flex-wrap">
        <span className="text-stone-400 text-sm font-semibold">{label}</span>
        <span className="text-stone-100 font-bold text-sm">
          {latest ? format(value(latest)) : "—"}
        </span>
      </div>
      <div className="flex items-end gap-0.5 h-16">
        {rows.map((r) => {
          const h = Math.max(Math.round((value(r) / max) * 100), 2);
          return (
            <div
              key={r.snapshot_date}
              className={`flex-1 rounded-sm ${color}`}
              style={{ height: `${h}%` }}
              title={`${r.snapshot_date}: ${format(value(r))}`}
            />
          );
        })}
      </div>
    </div>
  );
}
