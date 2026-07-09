import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Play, AlertTriangle, CheckCircle2 } from "lucide-react";

const ACCENT = "#E2741B";

type Job = {
  id: number;
  name: string;
  description: string | null;
  interval_seconds: number | null;
  cron: string | null;
  enabled: boolean;
  status: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_duration_ms: number | null;
  run_count: number;
  failure_count: number;
  locked_by: string | null;
  hasHandler: boolean;
};

type Run = {
  id: number;
  job_id: number;
  job_name: string;
  status: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  error: string | null;
};

function fmtTime(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function relative(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = d - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  if (mins < 1) return diff >= 0 ? "in <1m" : "<1m ago";
  if (mins < 60) return diff >= 0 ? `in ${mins}m` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return diff >= 0 ? `in ${hrs}h` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return diff >= 0 ? `in ${days}d` : `${days}d ago`;
}

function statusBadge(status: string) {
  const base = "text-[10px] border";
  switch (status) {
    case "running":
      return <Badge className={`${base} bg-amber-950/40 text-amber-300 border-amber-800`}>running</Badge>;
    case "success":
      return <Badge className={`${base} bg-green-950/40 text-green-300 border-green-800`}>success</Badge>;
    case "failed":
      return <Badge className={`${base} bg-red-950/40 text-red-300 border-red-800`}>failed</Badge>;
    default:
      return <Badge className={`${base} bg-stone-800 text-stone-400 border-stone-700`}>{status}</Badge>;
  }
}

export default function AdminScheduler() {
  const { toast } = useToast();

  const jobsQ = useQuery<{ jobs: Job[] }>({
    queryKey: ["/api/admin/scheduler/jobs"],
    queryFn: async () => {
      const r = await fetch("/api/admin/scheduler/jobs", { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    refetchInterval: 10000,
  });

  const runsQ = useQuery<{ runs: Run[] }>({
    queryKey: ["/api/admin/scheduler/runs"],
    queryFn: async () => {
      const r = await fetch("/api/admin/scheduler/runs?limit=50", { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    refetchInterval: 10000,
  });

  const runNow = useMutation({
    mutationFn: async (id: number) => {
      const r = await apiRequest("POST", `/api/admin/scheduler/jobs/${id}/run`);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Triggered", description: "Job queued to run on the next tick." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduler/jobs"] });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduler/jobs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduler/runs"] });
      }, 2000);
    },
    onError: (e: any) => {
      toast({ title: "Couldn't trigger", description: e?.message ?? "Failed", variant: "destructive" });
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const r = await apiRequest("POST", `/api/admin/scheduler/jobs/${id}/toggle`, { enabled });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduler/jobs"] });
    },
    onError: (e: any) => {
      toast({ title: "Couldn't toggle", description: e?.message ?? "Failed", variant: "destructive" });
    },
  });

  const jobs = jobsQ.data?.jobs ?? [];
  const runs = runsQ.data?.runs ?? [];
  const failing = jobs.filter((j) => j.last_status === "failed").length;
  const orphaned = jobs.filter((j) => !j.hasHandler).length;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-black mb-1" data-testid="text-scheduler-title">
              Automation scheduler
            </h1>
            <p className="text-stone-400 text-sm max-w-2xl">
              Durable, restart-safe recurring jobs. Each fires once across all
              instances via an atomic claim in Postgres. Times are your local
              timezone; cron schedules are UTC.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {failing > 0 && (
              <Badge className="bg-red-950/40 text-red-300 border-red-800" data-testid="badge-failing">
                {failing} failing
              </Badge>
            )}
            {orphaned > 0 && (
              <Badge className="bg-amber-950/40 text-amber-300 border-amber-800" data-testid="badge-orphaned">
                {orphaned} no handler
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                jobsQ.refetch();
                runsQ.refetch();
              }}
              disabled={jobsQ.isFetching}
              data-testid="button-refresh"
            >
              {jobsQ.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </div>

        {jobsQ.isLoading && (
          <Card className="p-10 bg-stone-900 border-stone-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-stone-500" />
          </Card>
        )}

        {jobsQ.isError && !jobsQ.isLoading && (
          <Card className="p-6 bg-red-950/30 border-red-800 text-red-200" data-testid="card-error">
            Couldn't load jobs. Check that you're signed in as an admin.
          </Card>
        )}

        {!jobsQ.isLoading && !jobsQ.isError && (
          <>
            <div className="space-y-3 mb-8">
              {jobs.length === 0 && (
                <Card className="p-6 bg-stone-900 border-stone-800 text-stone-400" data-testid="card-empty">
                  No jobs registered yet. They appear on first boot after the
                  scheduler bootstraps.
                </Card>
              )}
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-4 bg-stone-900 border-stone-800"
                  data-testid={`card-job-${job.name}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-stone-100" data-testid={`text-job-name-${job.name}`}>
                          {job.name}
                        </span>
                        {statusBadge(job.status)}
                        {!job.enabled && (
                          <Badge className="bg-stone-800 text-stone-500 border-stone-700 text-[10px]">
                            disabled
                          </Badge>
                        )}
                        {!job.hasHandler && (
                          <Badge className="bg-amber-950/40 text-amber-300 border-amber-800 text-[10px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> no handler
                          </Badge>
                        )}
                        <code className="text-xs text-stone-500">
                          {job.cron ?? (job.interval_seconds ? `every ${job.interval_seconds}s` : "—")}
                        </code>
                      </div>
                      {job.description && (
                        <p className="text-stone-400 text-sm mb-2">{job.description}</p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span className="text-stone-500">Next: </span>
                          <span className="text-stone-300" data-testid={`text-next-${job.name}`}>
                            {relative(job.next_run_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500">Last: </span>
                          <span className="text-stone-300">{fmtTime(job.last_run_at)}</span>
                        </div>
                        <div>
                          <span className="text-stone-500">Last run: </span>
                          <span className="text-stone-300">
                            {job.last_status ?? "—"}
                            {job.last_duration_ms != null && ` (${fmtDuration(job.last_duration_ms)})`}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500">Runs: </span>
                          <span className="text-stone-300">
                            {job.run_count}
                            {job.failure_count > 0 && (
                              <span className="text-red-400"> / {job.failure_count} failed</span>
                            )}
                          </span>
                        </div>
                      </div>
                      {job.last_error && (
                        <div className="mt-2 text-xs text-red-300 bg-red-950/30 border border-red-900 rounded-md p-2 break-words" data-testid={`text-error-${job.name}`}>
                          {job.last_error}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => runNow.mutate(job.id)}
                        disabled={runNow.isPending || job.status === "running" || !job.hasHandler}
                        style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
                        data-testid={`button-run-${job.name}`}
                      >
                        <Play className="w-3 h-3" /> Run now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggle.mutate({ id: job.id, enabled: !job.enabled })}
                        disabled={toggle.isPending}
                        data-testid={`button-toggle-${job.name}`}
                      >
                        {job.enabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <h2 className="text-lg font-bold mb-3">Recent runs</h2>
            <Card className="bg-stone-900 border-stone-800 overflow-hidden">
              {runsQ.isLoading ? (
                <div className="p-6 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-stone-500" />
                </div>
              ) : runs.length === 0 ? (
                <div className="p-6 text-stone-400 text-sm" data-testid="text-no-runs">
                  No runs recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-stone-800">
                  {runs.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between gap-3 px-4 py-2 flex-wrap"
                      data-testid={`row-run-${run.id}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {run.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <span className="font-medium text-stone-200 truncate">{run.job_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-stone-400 flex-wrap">
                        <span>{fmtTime(run.started_at)}</span>
                        <span>{fmtDuration(run.duration_ms)}</span>
                        {run.error ? (
                          <span className="text-red-400 max-w-xs truncate" title={run.error}>
                            {run.error}
                          </span>
                        ) : (
                          statusBadge(run.status)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
