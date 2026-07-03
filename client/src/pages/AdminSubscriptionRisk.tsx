import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, ArrowDownCircle, CheckCircle2 } from "lucide-react";

type RiskRow = {
  userId: string;
  email: string | null;
  plan: string;
  status: string;
  paymentState: string;
  dunningAttempts: number;
  gracePeriodEnd: string | null;
  lastPaymentFailedAt: string | null;
  lastRecoveredAt: string | null;
  downgradedAt: string | null;
  currentPeriodEnd: string | null;
};

type Resp = {
  atRisk: RiskRow[];
  downgraded: RiskRow[];
  recovered: RiskRow[];
  counts: { atRisk: number; downgraded: number; recovered: number };
};

function fmt(d: string | null): string {
  if (!d) return "—";
  const t = Date.parse(d);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(d: string | null): string {
  if (!d) return "";
  const t = Date.parse(d);
  if (Number.isNaN(t)) return "";
  const days = Math.ceil((t - Date.now()) / 86400_000);
  if (days < 0) return "lapsed";
  if (days === 0) return "today";
  return `${days}d left`;
}

function planLabel(plan: string): string {
  if (plan === "annual") return "Annual";
  if (plan === "monthly") return "Monthly";
  return "—";
}

function RiskTable({
  rows,
  kind,
}: {
  rows: RiskRow[];
  kind: "atRisk" | "downgraded" | "recovered";
}) {
  if (rows.length === 0) {
    return (
      <div className="text-stone-500 text-sm py-6 text-center" data-testid={`empty-${kind}`}>
        Nobody here — heart's still thumpin'.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.userId}
          className="flex items-center justify-between gap-3 flex-wrap rounded-md bg-stone-950/60 border border-stone-800 px-3 py-2"
          data-testid={`row-${kind}-${r.userId}`}
        >
          <div className="min-w-0">
            <div className="font-semibold text-stone-100 truncate" data-testid={`text-email-${r.userId}`}>
              {r.email || r.userId}
            </div>
            <div className="text-stone-500 text-xs flex items-center gap-2 flex-wrap mt-0.5">
              <Badge className="bg-stone-800 text-stone-300 border-stone-700 text-[10px]">
                {planLabel(r.plan)}
              </Badge>
              <span>status: {r.status}</span>
            </div>
          </div>
          <div className="text-right text-xs text-stone-400">
            {kind === "atRisk" && (
              <>
                <div>
                  Grace ends{" "}
                  <span className="text-amber-400 font-semibold">{fmt(r.gracePeriodEnd)}</span>{" "}
                  <span className="text-stone-500">({daysUntil(r.gracePeriodEnd)})</span>
                </div>
                <div className="text-stone-500">
                  Attempts: {r.dunningAttempts} · failed {fmt(r.lastPaymentFailedAt)}
                </div>
              </>
            )}
            {kind === "downgraded" && (
              <>
                <div className="text-red-400 font-semibold">Paused {fmt(r.downgradedAt)}</div>
                <div className="text-stone-500">Attempts: {r.dunningAttempts}</div>
              </>
            )}
            {kind === "recovered" && (
              <>
                <div className="text-green-400 font-semibold">Recovered {fmt(r.lastRecoveredAt)}</div>
                <div className="text-stone-500">Renews {fmt(r.currentPeriodEnd)}</div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminSubscriptionRisk() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<Resp>({
    queryKey: ["/api/admin/subscriptions/risk"],
    queryFn: async () => {
      const r = await fetch("/api/admin/subscriptions/risk", { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-black mb-1" data-testid="text-risk-title">
              Subscription revenue durability
            </h1>
            <p className="text-stone-400 text-sm">
              At-risk = card failed, still inside the 7-day grace window. Paused =
              grace lapsed. Recovered = card cleared in the last 30 days. State is
              webhook-backed — Stripe truth.
            </p>
          </div>
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

        {isLoading && (
          <Card className="p-10 bg-stone-900 border-stone-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-stone-500" />
          </Card>
        )}

        {isError && !isLoading && (
          <Card className="p-6 bg-red-950/30 border-red-800 text-red-200" data-testid="card-error">
            Couldn't load the risk view. Check that you're signed in as an admin.
          </Card>
        )}

        {!isLoading && !isError && data && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="p-4 bg-stone-900 border-stone-800" data-testid="card-count-atrisk">
                <div className="text-stone-500 text-xs uppercase tracking-wide mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> At risk
                </div>
                <div className="text-2xl font-black text-amber-400">{data.counts.atRisk}</div>
              </Card>
              <Card className="p-4 bg-stone-900 border-stone-800" data-testid="card-count-downgraded">
                <div className="text-stone-500 text-xs uppercase tracking-wide mb-1 flex items-center gap-1">
                  <ArrowDownCircle className="w-3 h-3 text-red-400" /> Paused
                </div>
                <div className="text-2xl font-black text-red-400">{data.counts.downgraded}</div>
              </Card>
              <Card className="p-4 bg-stone-900 border-stone-800" data-testid="card-count-recovered">
                <div className="text-stone-500 text-xs uppercase tracking-wide mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-400" /> Recovered
                </div>
                <div className="text-2xl font-black text-green-400">{data.counts.recovered}</div>
              </Card>
            </div>

            <Card className="p-6 bg-stone-900 border-stone-800 mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> At risk — in grace
              </h2>
              <RiskTable rows={data.atRisk} kind="atRisk" />
            </Card>

            <Card className="p-6 bg-stone-900 border-stone-800 mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-red-400" /> Paused — grace lapsed
              </h2>
              <RiskTable rows={data.downgraded} kind="downgraded" />
            </Card>

            <Card className="p-6 bg-stone-900 border-stone-800">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> Recovered — last 30 days
              </h2>
              <RiskTable rows={data.recovered} kind="recovered" />
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
