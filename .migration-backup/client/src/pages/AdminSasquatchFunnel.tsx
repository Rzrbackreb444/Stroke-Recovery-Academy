import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";

type Row = { event_type: string; plan: string; count: number };
type Resp = { days: number; summary: Row[] };

const EVENT_ORDER = [
  "premium_page_view",
  "checkout_click",
  "trial_start",
  "trial_converted",
  "trial_canceled",
] as const;
type EventKey = (typeof EVENT_ORDER)[number];

const EVENT_LABEL: Record<EventKey, string> = {
  premium_page_view: "Page views",
  checkout_click: "Checkout clicks",
  trial_start: "Trial starts",
  trial_converted: "Trial → paid",
  trial_canceled: "Trial canceled",
};

const PLAN_LABEL: Record<string, string> = {
  monthly: "Monthly",
  annual: "Annual",
  unknown: "Unknown",
};

const DAYS_OPTIONS = [7, 14, 30, 60, 90];

function totals(rows: Row[]): Record<EventKey, number> {
  const out: Record<string, number> = {};
  for (const e of EVENT_ORDER) out[e] = 0;
  for (const r of rows) {
    if (r.event_type in out) out[r.event_type] += r.count;
  }
  return out as Record<EventKey, number>;
}

function pct(num: number, den: number): string {
  if (!den) return "—";
  return `${((num / den) * 100).toFixed(1)}%`;
}

function planBreakdown(rows: Row[], event: EventKey) {
  const out: Record<string, number> = { monthly: 0, annual: 0, unknown: 0 };
  for (const r of rows) {
    if (r.event_type === event) out[r.plan] = (out[r.plan] || 0) + r.count;
  }
  return out;
}

export default function AdminSasquatchFunnel() {
  const [days, setDays] = useState<number>(30);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<Resp>({
    queryKey: ["/api/sasquatch-premium/funnel", days],
    queryFn: async () => {
      const r = await fetch(`/api/sasquatch-premium/funnel?days=${days}`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const rows = data?.summary ?? [];
  const t = totals(rows);

  const view2click = pct(t.checkout_click, t.premium_page_view);
  const click2trial = pct(t.trial_start, t.checkout_click);
  const trial2paid = pct(t.trial_converted, t.trial_start);
  const trialCancelRate = pct(t.trial_canceled, t.trial_start);

  // The funnel "max" is whatever the largest stage is — used to scale the bars.
  const maxCount = Math.max(
    ...EVENT_ORDER.map((e) => t[e]),
    1,
  );

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-black mb-1" data-testid="text-funnel-title">
              Sasquatch Premium funnel
            </h1>
            <p className="text-stone-400 text-sm">
              Last {data?.days ?? days} days. Counts are exact; percentages
              are stage-to-stage conversion. Trial → paid is webhook-backed
              (Stripe truth, not client-side).
            </p>
          </div>
          <div className="flex items-center gap-2" role="tablist" aria-label="Window">
            {DAYS_OPTIONS.map((d) => (
              <Button
                key={d}
                size="sm"
                variant={d === days ? "default" : "outline"}
                onClick={() => setDays(d)}
                data-testid={`button-window-${d}`}
              >
                {d}d
              </Button>
            ))}
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
            Couldn't load the funnel. Check that you're signed in as an admin.
          </Card>
        )}

        {!isLoading && !isError && (
          <>
            {/* Conversion ratio cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="p-4 bg-stone-900 border-stone-800" data-testid="card-ratio-view2click">
                <div className="text-stone-500 text-xs uppercase tracking-wide mb-1">
                  Page → checkout
                </div>
                <div className="text-2xl font-black text-amber-400">{view2click}</div>
                <div className="text-stone-500 text-xs mt-1">
                  {t.checkout_click} of {t.premium_page_view}
                </div>
              </Card>
              <Card className="p-4 bg-stone-900 border-stone-800" data-testid="card-ratio-click2trial">
                <div className="text-stone-500 text-xs uppercase tracking-wide mb-1">
                  Checkout → trial
                </div>
                <div className="text-2xl font-black text-amber-400">{click2trial}</div>
                <div className="text-stone-500 text-xs mt-1">
                  {t.trial_start} of {t.checkout_click}
                </div>
              </Card>
              <Card className="p-4 bg-stone-900 border-stone-800" data-testid="card-ratio-trial2paid">
                <div className="text-stone-500 text-xs uppercase tracking-wide mb-1 flex items-center gap-1">
                  Trial → paid <TrendingUp className="w-3 h-3 text-green-400" />
                </div>
                <div className="text-2xl font-black text-green-400">{trial2paid}</div>
                <div className="text-stone-500 text-xs mt-1">
                  {t.trial_converted} of {t.trial_start}
                </div>
              </Card>
              <Card className="p-4 bg-stone-900 border-stone-800" data-testid="card-ratio-trial-cancel">
                <div className="text-stone-500 text-xs uppercase tracking-wide mb-1 flex items-center gap-1">
                  Trial canceled <TrendingDown className="w-3 h-3 text-red-400" />
                </div>
                <div className="text-2xl font-black text-red-400">{trialCancelRate}</div>
                <div className="text-stone-500 text-xs mt-1">
                  {t.trial_canceled} of {t.trial_start}
                </div>
              </Card>
            </div>

            {/* Stepped funnel */}
            <Card className="p-6 bg-stone-900 border-stone-800 mb-6">
              <h2 className="text-lg font-bold mb-4">Stepped funnel</h2>
              <div className="space-y-3">
                {EVENT_ORDER.map((e) => {
                  const count = t[e];
                  const widthPct = Math.round((count / maxCount) * 100);
                  const breakdown = planBreakdown(rows, e);
                  const isCancel = e === "trial_canceled";
                  return (
                    <div key={e} data-testid={`row-event-${e}`}>
                      <div className="flex items-baseline justify-between mb-1 gap-2 flex-wrap">
                        <div className="font-semibold">{EVENT_LABEL[e]}</div>
                        <div className="text-stone-400 text-sm flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-stone-100" data-testid={`count-${e}`}>
                            {count}
                          </span>
                          <Badge className="bg-stone-800 text-stone-300 border-stone-700 text-[10px]">
                            {PLAN_LABEL.monthly}: {breakdown.monthly}
                          </Badge>
                          <Badge className="bg-stone-800 text-stone-300 border-stone-700 text-[10px]">
                            {PLAN_LABEL.annual}: {breakdown.annual}
                          </Badge>
                          {breakdown.unknown > 0 && (
                            <Badge className="bg-stone-800 text-stone-500 border-stone-700 text-[10px]">
                              {PLAN_LABEL.unknown}: {breakdown.unknown}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="h-3 rounded-md bg-stone-800 overflow-hidden">
                        <div
                          className={`h-full rounded-md ${
                            isCancel ? "bg-red-700/60" : "bg-amber-600"
                          }`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <p className="text-stone-500 text-xs">
              Data source: <code className="text-stone-400">subscription_funnel_events</code>.
              Page-view fires client-side, checkout-click is server-truth, trial-start fires
              from the post-Stripe redirect, trial-converted / trial-canceled fire from the
              Stripe <code className="text-stone-400">customer.subscription.updated</code> webhook.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
