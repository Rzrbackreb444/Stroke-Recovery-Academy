import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Circle, AlertCircle, Download, Printer, ShoppingBag, Loader2, BookOpen, RefreshCw, ExternalLink, Lock, Star, ChevronRight, FileText, Layers } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { usePlatform } from "@/lib/hooks/usePlatform";
import { useBookProject } from "@/lib/hooks/useBookProject";

interface ReadinessItem { item: string; passed: boolean; weight: number; details?: string; }
interface ReadinessReport { score: number; checklist: ReadinessItem[]; }
interface TierInfo { tierName: string; displayName: string; maxExportsPerDay: number; dailyExportsUsed: number; }

const TRIM_SIZES = [
  { value: "5x8", label: '5" × 8"' }, { value: "5.5x8.5", label: '5.5" × 8.5"' },
  { value: "6x9", label: '6" × 9" (KDP default)' }, { value: "7x10", label: '7" × 10"' }, { value: "8.5x11", label: '8.5" × 11"' },
];
const MARGIN_PRESETS = [
  { value: "kdp-standard", label: "KDP Standard" }, { value: "kdp-wide", label: "KDP Wide" },
  { value: "novel", label: "Novel" }, { value: "academic", label: "Academic" },
];

function ReadinessRow({ item }: { item: ReadinessItem }) {
  const Icon = item.passed ? CheckCircle : item.weight >= 15 ? AlertCircle : Circle;
  const color = item.passed ? "text-green-500" : item.weight >= 15 ? "text-amber-500" : "text-gray-300";
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${item.passed ? "text-gray-700" : "text-gray-500"}`}>{item.item}</p>
        {item.details && <p className="text-xs text-gray-400 mt-0.5">{item.details}</p>}
      </div>
      <span className={`text-[10px] font-medium shrink-0 ${item.passed ? "text-green-500" : "text-gray-300"}`}>{item.weight}pt</span>
    </div>
  );
}

export default function BookPublishFlow() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const platform = usePlatform();
  const Header = platform === "recovery" ? RecoveryHeader : GlobalHeader;
  const { project, projects, loadProject } = useBookProject();
  const [trimSize, setTrimSize] = useState("6x9");
  const [marginPreset, setMarginPreset] = useState("kdp-standard");
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const selectedId = project?.id ?? null;

  const { data: readiness, isLoading: readinessLoading, refetch } = useQuery<ReadinessReport>({
    queryKey: ["/api/book-projects", selectedId, "analyze"],
    queryFn: async () => { const res = await apiRequest("POST", `/api/book-projects/${selectedId}/analyze`, {}); if (!res.ok) throw new Error("Analyze failed"); return res.json(); },
    enabled: !!selectedId && isAuthenticated,
    staleTime: 30000,
  });
  const { data: tier } = useQuery<TierInfo>({ queryKey: ["/api/book-studio/tier-info"], enabled: isAuthenticated });
  const atExportLimit = tier && tier.maxExportsPerDay !== -1 && (tier.dailyExportsUsed ?? 0) >= tier.maxExportsPerDay;

  async function handleExportKdp() {
    if (!selectedId || !project) return;
    if (atExportLimit) { toast({ title: "Export limit reached", description: "Upgrade for more exports.", variant: "destructive" }); return; }
    setIsExporting(true); setExportedUrl(null);
    try {
      const res = await apiRequest("POST", "/api/book-studio/export-kdp", { projectId: selectedId, title: project.title, author: project.authorName || "Unknown Author", chapters: [], format: "pdf", trimSize, marginPreset, includeGutterMargin: true });
      if (!res.ok) { const b = await res.json(); throw new Error(b.message || "Export failed"); }
      const blob = await res.blob();
      setExportedUrl(URL.createObjectURL(blob));
      queryClient.invalidateQueries({ queryKey: ["/api/book-studio/tier-info"] });
      toast({ title: "Export ready", description: "KDP-formatted PDF ready to download." });
    } catch (err: any) { toast({ title: "Export failed", description: err.message, variant: "destructive" }); }
    finally { setIsExporting(false); }
  }

  if (authLoading) return <div className="min-h-screen bg-[#FAF8F3]"><Header /><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#C9941A]" /></div></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#FAF8F3]"><Header />
      <div className="flex items-center justify-center py-24">
        <Card className="p-10 max-w-md w-full text-center border-0 shadow-sm">
          <Lock className="w-10 h-10 text-[#C9941A] mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">Sign in to publish</h2>
          <Button onClick={() => window.location.href = "/api/login"} className="bg-[#C9941A] text-white mt-2">Sign In</Button>
        </Card>
      </div><Footer />
    </div>
  );

  const score = readiness?.score ?? 0;
  const scoreColor = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-500" : "text-red-500";

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO title="Publish & Export | Book Studio" description="Publish your book to KDP, print, or the SRA marketplace." />
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div><h1 className="text-3xl font-bold text-gray-900">Publish & Export</h1><p className="text-sm text-gray-500 mt-1">KDP-ready PDF, print ordering, and marketplace listing.</p></div>

        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-6 space-y-3">
            <Label>Select your book project</Label>
            <Select value={selectedId ? String(selectedId) : ""} onValueChange={v => { loadProject(Number(v)); setExportedUrl(null); }}>
              <SelectTrigger data-testid="select-project"><SelectValue placeholder="Choose a project…" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-[#C9941A]" />{p.title}{p.wordCount ? <span className="text-xs text-gray-400">· {p.wordCount.toLocaleString()} words</span> : null}</div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedId && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between"><CardTitle className="text-base">Readiness Score</CardTitle><button onClick={() => refetch()} className="text-gray-400 hover:text-gray-600"><RefreshCw className="w-4 h-4" /></button></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {readinessLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#C9941A]" /></div> : readiness ? (
                    <>
                      <div className="text-center py-2"><p className={`text-5xl font-bold ${scoreColor}`}>{score}</p><p className="text-xs text-gray-400 mt-1">out of 100</p></div>
                      <Progress value={score} className="h-2" />
                      <p className="text-xs text-center text-gray-500">{score >= 80 ? "Ready to publish." : score >= 50 ? "Almost there — a few items left." : "Complete the checklist before publishing."}</p>
                      <Separator />
                      <div className="divide-y divide-gray-50">{readiness.checklist.map((item, i) => <ReadinessRow key={i} item={item} />)}</div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-4">
              {atExportLimit && (
                <Card className="border-amber-200 bg-amber-50/60">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="flex-1 text-sm"><span className="font-medium">Export limit reached</span><span className="text-gray-600"> — {tier!.dailyExportsUsed} of {tier!.maxExportsPerDay} used today.</span></div>
                    <Button size="sm" className="bg-[#C9941A] text-white shrink-0" onClick={() => window.location.href = "/pricing"}><Star className="w-3.5 h-3.5 mr-1.5" />Upgrade</Button>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-md bg-[#C9941A]/10 p-2"><FileText className="w-4 h-4 text-[#C9941A]" /></div>
                    <div><CardTitle className="text-base">KDP PDF Export</CardTitle><CardDescription className="text-xs">Print-ready PDF to Amazon KDP specs</CardDescription></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-xs">Trim Size</Label>
                      <Select value={trimSize} onValueChange={setTrimSize}><SelectTrigger className="text-sm" data-testid="select-trim"><SelectValue /></SelectTrigger><SelectContent>{TRIM_SIZES.map(t => <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Margins</Label>
                      <Select value={marginPreset} onValueChange={setMarginPreset}><SelectTrigger className="text-sm" data-testid="select-margins"><SelectValue /></SelectTrigger><SelectContent>{MARGIN_PRESETS.map(m => <SelectItem key={m.value} value={m.value} className="text-sm">{m.label}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  {exportedUrl ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700 flex-1">Export ready!</p>
                      <Button size="sm" className="bg-green-600 text-white shrink-0" onClick={() => { const a = document.createElement("a"); a.href = exportedUrl; a.download = `${project?.title || "book"}-kdp.pdf`; a.click(); }} data-testid="button-download-pdf"><Download className="w-3.5 h-3.5 mr-1.5" />Download PDF</Button>
                    </div>
                  ) : (
                    <Button className="w-full bg-[#C9941A] text-white" onClick={handleExportKdp} disabled={isExporting || !!atExportLimit} data-testid="button-export-kdp">
                      {isExporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</> : <><Download className="w-4 h-4 mr-2" />Export KDP PDF</>}
                    </Button>
                  )}
                  {tier && tier.maxExportsPerDay !== -1 && <p className="text-xs text-gray-400 text-center">{tier.dailyExportsUsed ?? 0} of {tier.maxExportsPerDay} exports used today</p>}
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5"><div className="rounded-md bg-blue-50 p-2"><Printer className="w-4 h-4 text-blue-600" /></div><div><CardTitle className="text-base">Order Print Copies</CardTitle><CardDescription className="text-xs">Professional print-on-demand via Lulu</CardDescription></div></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">Order author copies at print cost — no minimum. Ships in 3–5 days.</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[["6×9 paperback (100pp)", "$4.39"], ["Hardcover (100pp)", "$9.89"], ["Color interior", "+$0.07/pg"], ["Ships in", "3–5 days"]].map(([l, v]) => (
                      <div key={l} className="p-2.5 rounded-md bg-gray-50 flex justify-between"><span className="text-gray-500">{l}</span><span className="font-semibold text-gray-800">{v}</span></div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => window.open("https://www.lulu.com/create/books", "_blank")} data-testid="button-order-print"><ExternalLink className="w-4 h-4 mr-2" />Order on Lulu</Button>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5"><div className="rounded-md bg-purple-50 p-2"><ShoppingBag className="w-4 h-4 text-purple-600" /></div><div><CardTitle className="text-base">Sell on SRA Marketplace</CardTitle><CardDescription className="text-xs">Reach survivors and caregivers directly</CardDescription></div></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">List your digital book to 10,000+ survivors in the SRA community. 70% royalty on every sale.</p>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    {[["Royalty", "70%"], ["Payout", "Monthly"], ["Formats", "PDF + ePub"]].map(([l, v]) => (
                      <div key={l} className="p-2.5 rounded-md bg-gray-50"><p className="font-semibold text-gray-800 text-sm">{v}</p><p className="text-gray-400 mt-0.5">{l}</p></div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => window.location.href = "/sell-books"} data-testid="button-list-marketplace">
                    <ShoppingBag className="w-4 h-4 mr-2" />List My Book<ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!selectedId && projects.length === 0 && (
          <Card className="border-dashed border-2 border-gray-200 bg-transparent">
            <div className="py-16 text-center">
              <Layers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="font-semibold text-gray-600">No book projects yet</p><p className="text-sm text-gray-400 mt-1">Create a project in Book Studio first.</p>
              <Button className="mt-6 bg-[#C9941A] text-white" onClick={() => window.location.href = "/book-studio"}><BookOpen className="w-4 h-4 mr-2" />Go to Book Studio</Button>
            </div>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
