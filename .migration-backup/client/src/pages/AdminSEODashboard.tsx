import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Send, FileCode, Globe2, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RegistryRow {
  pattern: string;
  canonical: string | null;
  category: string;
  intent: string;
  schemaType: string;
  title: string;
  description: string;
  author: { name: string; url?: string } | null;
  noindex: boolean;
  ssrHandled: boolean;
  changefreq: string | null;
  priority: number | null;
}

interface RegistryResp {
  stats: {
    total: number;
    indexable: number;
    noindex: number;
    ssrHandled: number;
    byCategory: Record<string, number>;
    byIntent: Record<string, number>;
    bySchemaType: Record<string, number>;
  };
  sitemapStaticCount: number;
  routes: RegistryRow[];
}

interface InspectResp {
  path: string;
  matched: boolean;
  entry?: RegistryRow;
  fullUrl?: string;
  schemas?: any[];
}

export default function AdminSEODashboard() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [inspectPath, setInspectPath] = useState("/recovery/coach");

  const { data, isLoading } = useQuery<RegistryResp>({ queryKey: ["/api/admin/seo/registry"] });

  const inspect = useMutation({
    mutationFn: async (path: string) => {
      const r = await apiRequest("GET", `/api/admin/seo/inspect?path=${encodeURIComponent(path)}`);
      return (await r.json()) as InspectResp;
    },
  });

  const ping = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/seo/submit");
      return (await r.json()) as {
        urlCount: number;
        indexNow: { batches: { batch: number; status: number; ok: boolean; count: number }[]; covers: string[] };
        google: { note: string };
      };
    },
    onSuccess: (d) => {
      const okBatches = d.indexNow.batches.filter((b) => b.ok).length;
      toast({
        title: `Submitted ${d.urlCount} URLs`,
        description: `IndexNow (${d.indexNow.covers.join(", ")}): ${okBatches}/${d.indexNow.batches.length} batches OK`,
      });
    },
    onError: () => toast({ title: "Submit failed", variant: "destructive" }),
  });

  const filteredRoutes = useMemo(() => {
    if (!data) return [];
    const f = filter.trim().toLowerCase();
    if (!f) return data.routes;
    return data.routes.filter(
      (r) =>
        r.pattern.toLowerCase().includes(f) ||
        (r.canonical ?? "").toLowerCase().includes(f) ||
        r.category.toLowerCase().includes(f) ||
        r.intent.toLowerCase().includes(f) ||
        r.title.toLowerCase().includes(f),
    );
  }, [data, filter]);

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const { stats, sitemapStaticCount } = data;

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-seo-dashboard-title">
          SEO Command Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Single-source-of-truth registry powering metadata, JSON-LD, and the sitemap.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={<Layers className="h-4 w-4" />} label="Total routes" value={stats.total} testId="stat-total" />
        <StatCard
          icon={<Globe2 className="h-4 w-4" />}
          label="Indexable"
          value={stats.indexable}
          testId="stat-indexable"
        />
        <StatCard
          icon={<FileCode className="h-4 w-4" />}
          label="Noindex (private)"
          value={stats.noindex}
          testId="stat-noindex"
        />
        <StatCard
          icon={<Send className="h-4 w-4" />}
          label="Static sitemap entries"
          value={sitemapStaticCount}
          testId="stat-sitemap"
        />
      </div>

      <Tabs defaultValue="routes">
        <TabsList>
          <TabsTrigger value="routes" data-testid="tab-routes">
            Registry
          </TabsTrigger>
          <TabsTrigger value="inspector" data-testid="tab-inspector">
            Per-route inspector
          </TabsTrigger>
          <TabsTrigger value="distribution" data-testid="tab-distribution">
            Distribution
          </TabsTrigger>
          <TabsTrigger value="submit" data-testid="tab-submit">
            Submit to search engines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All registered routes ({filteredRoutes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by pattern, category, intent, or title…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  data-testid="input-filter-routes"
                />
              </div>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Pattern / Canonical</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Intent</th>
                      <th className="px-3 py-2 text-left">Schema</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((r, i) => (
                      <tr
                        key={`${r.pattern}-${i}`}
                        className="border-t hover-elevate"
                        data-testid={`row-route-${i}`}
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="font-mono text-xs">{r.canonical ?? r.pattern}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{r.title}</div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Badge variant="outline">{r.category}</Badge>
                        </td>
                        <td className="px-3 py-2 align-top text-xs">{r.intent}</td>
                        <td className="px-3 py-2 align-top text-xs">{r.schemaType}</td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-wrap gap-1">
                            {r.noindex ? (
                              <Badge variant="secondary">noindex</Badge>
                            ) : (
                              <Badge>indexable</Badge>
                            )}
                            {r.ssrHandled && <Badge variant="outline">SSR</Badge>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspector" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inspect a path</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="max-w-sm"
                  placeholder="/recovery/coach"
                  value={inspectPath}
                  onChange={(e) => setInspectPath(e.target.value)}
                  data-testid="input-inspect-path"
                />
                <Button
                  onClick={() => inspect.mutate(inspectPath)}
                  disabled={inspect.isPending}
                  data-testid="button-inspect"
                >
                  {inspect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Inspect"}
                </Button>
              </div>
              {inspect.data && (
                <div className="space-y-3 text-sm" data-testid="result-inspect">
                  {!inspect.data.matched ? (
                    <div className="text-muted-foreground">No registry entry matched.</div>
                  ) : (
                    <>
                      <div>
                        <span className="text-muted-foreground">Canonical: </span>
                        <span className="font-mono text-xs">{inspect.data.fullUrl}</span>
                      </div>
                      <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                        {JSON.stringify(inspect.data.entry, null, 2)}
                      </pre>
                      <div className="text-xs font-medium">JSON-LD blocks ({inspect.data.schemas?.length ?? 0})</div>
                      <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                        {JSON.stringify(inspect.data.schemas, null, 2)}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DistributionCard title="By category" map={stats.byCategory} testId="dist-category" />
            <DistributionCard title="By intent" map={stats.byIntent} testId="dist-intent" />
            <DistributionCard title="By schema type" map={stats.bySchemaType} testId="dist-schema" />
          </div>
        </TabsContent>

        <TabsContent value="submit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submit sitemap to Google + Bing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pings <span className="font-mono">https://strokerecoveryacademy.com/sitemap-index.xml</span> to Google
                and Bing. For full GSC integration (URL inspection, performance), connect a Google Search Console
                service account.
              </p>
              <Button onClick={() => ping.mutate()} disabled={ping.isPending} data-testid="button-ping">
                {ping.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ping search engines"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  testId: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-muted p-2">{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold tabular-nums" data-testid={`text-${testId}`}>
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DistributionCard({
  title,
  map,
  testId,
}: {
  title: string;
  map: Record<string, number>;
  testId: string;
}) {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2 text-sm" data-testid={`${testId}-${k}`}>
            <span className="text-muted-foreground">{k}</span>
            <Badge variant="outline">{v}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
