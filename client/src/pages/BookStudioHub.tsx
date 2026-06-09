import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Clock, Zap, ChevronRight, Lock, Loader2, Pencil, Trash2, Star, ArrowRight, BarChart2, Upload, FileText } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { usePlatform } from "@/lib/hooks/usePlatform";

interface BookProject { id: number; title: string; subtitle?: string; status: string; wordCount: number; chapterCount: number; readinessScore: number; coverImageUrl?: string; lastEditedAt: string; }
interface TierInfo { tierName: string; displayName: string; maxProjects: number; dailyAiGenerations: number; currentProjectCount: number; dailyAiUsed: number; }

const GENRES = [
  { value: "memoir", label: "Memoir" }, { value: "self-help", label: "Self-Help" },
  { value: "health", label: "Health & Wellness" }, { value: "biography", label: "Biography" },
  { value: "fiction", label: "Fiction" }, { value: "non-fiction", label: "Non-Fiction" },
  { value: "guide", label: "How-To Guide" }, { value: "other", label: "Other" },
];

const STATUS_BADGE: Record<string, string> = { draft: "bg-gray-100 text-gray-600", in_progress: "bg-blue-100 text-blue-700", ready: "bg-green-100 text-green-700", published: "bg-amber-100 text-amber-700" };
const STATUS_LABEL: Record<string, string> = { draft: "Draft", in_progress: "In Progress", ready: "Ready", published: "Published" };

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`; if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}
function readinessColor(n: number) { return n >= 80 ? "text-green-600" : n >= 50 ? "text-amber-500" : "text-red-500"; }
function quotaPct(used: number, max: number) { return max === -1 ? 8 : Math.min(100, Math.round((used / max) * 100)); }

export default function BookStudioHub() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const platform = usePlatform();
  const Header = platform === "recovery" ? RecoveryHeader : GlobalHeader;
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGenre, setNewGenre] = useState("memoir");
  const [deleteTarget, setDeleteTarget] = useState<BookProject | null>(null);

  const { data: projects = [], isLoading: projLoading } = useQuery<BookProject[]>({ queryKey: ["/api/book-projects"], enabled: isAuthenticated });
  const { data: tier } = useQuery<TierInfo>({ queryKey: ["/api/book-studio/tier-info"], enabled: isAuthenticated });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; genre: string }) => {
      const res = await apiRequest("POST", "/api/book-projects", data);
      if (!res.ok) { const b = await res.json(); throw new Error(b.message || "Failed to create project"); }
      return res.json();
    },
    onSuccess: (proj: BookProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/book-studio/tier-info"] });
      setShowNew(false); setNewTitle("");
      toast({ title: "Project created", description: `"${proj.title}" is ready.` });
      navigate(`/book-studio/${proj.id}`);
    },
    onError: (err: Error) => toast({ title: "Cannot create project", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("DELETE", `/api/book-projects/${id}`); if (!res.ok) throw new Error("Failed to delete"); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/book-studio/tier-info"] });
      setDeleteTarget(null); toast({ title: "Project deleted" });
    },
  });

  const atLimit = tier && tier.maxProjects !== -1 && projects.length >= tier.maxProjects;

  if (authLoading) return <div className="min-h-screen bg-[#FAF8F3]"><Header /><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#C9941A]" /></div></div>;

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO title="Book Studio | Stroke Recovery Academy" description="Create and publish your book with AI." />
      <Header />
      <div className="flex items-center justify-center py-24">
        <Card className="p-10 max-w-md w-full text-center border-0 shadow-sm">
          <BookOpen className="w-10 h-10 text-[#C9941A] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to access Book Studio</h2>
          <p className="text-gray-500 mb-6 text-sm">Create, edit, and publish professional books with AI assistance.</p>
          <Button onClick={() => window.location.href = "/api/login"} className="bg-[#C9941A] text-white">Sign In to Continue</Button>
        </Card>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO title="Book Studio | Stroke Recovery Academy" description="Create and publish your book with AI." />
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Book Studio</h1>
            <p className="text-sm text-gray-500 mt-1">Write, polish, and publish — all in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            {tier && <Badge variant="outline" className="text-xs gap-1.5 py-1 px-3"><Zap className="w-3 h-3 text-amber-500" />{tier.displayName} Plan</Badge>}
            <Button onClick={() => { if (!atLimit) setShowNew(true); }} disabled={!!atLimit} className="bg-[#C9941A] text-white" data-testid="button-new-project">
              <Plus className="w-4 h-4 mr-2" />New Book
            </Button>
          </div>
        </div>

        {tier && (
          <Card className="border-0 bg-white shadow-sm">
            <div className="px-6 py-4 flex flex-wrap gap-6 items-center">
              <div className="flex-1 min-w-[160px]">
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Projects</span><span className="font-medium text-gray-700">{projects.length}&nbsp;/&nbsp;{tier.maxProjects === -1 ? "∞" : tier.maxProjects}</span></div>
                <Progress value={quotaPct(projects.length, tier.maxProjects)} className="h-1.5" />
              </div>
              <div className="flex-1 min-w-[160px]">
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>AI today</span><span className="font-medium text-gray-700">{tier.dailyAiUsed}&nbsp;/&nbsp;{tier.dailyAiGenerations === -1 ? "∞" : tier.dailyAiGenerations}</span></div>
                <Progress value={quotaPct(tier.dailyAiUsed, tier.dailyAiGenerations)} className="h-1.5" />
              </div>
              {tier.tierName === "free" && (
                <Button variant="outline" size="sm" onClick={() => navigate("/pricing")} className="text-[#C9941A] border-[#C9941A]/40 whitespace-nowrap">
                  <ArrowRight className="w-3.5 h-3.5 mr-1" />Upgrade
                </Button>
              )}
            </div>
          </Card>
        )}

        {atLimit && (
          <Card className="border-amber-200 bg-amber-50/60">
            <div className="p-6 flex flex-col sm:flex-row items-center gap-4">
              <Lock className="w-8 h-8 text-amber-500 shrink-0" />
              <div className="flex-1 text-center sm:text-left">
                <p className="font-semibold text-gray-900">Project limit reached</p>
                <p className="text-sm text-gray-600 mt-0.5">You've used all {tier!.maxProjects} projects on the {tier!.displayName} plan.</p>
              </div>
              <Button className="bg-[#C9941A] text-white shrink-0" onClick={() => navigate("/pricing")}><Star className="w-4 h-4 mr-2" />Upgrade Plan</Button>
            </div>
          </Card>
        )}

        {projLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{[1, 2, 3].map(i => <div key={i} className="h-52 rounded-xl bg-gray-100 animate-pulse" />)}</div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 bg-transparent">
            <div className="py-20 flex flex-col items-center gap-5 text-center">
              <BookOpen className="w-14 h-14 text-gray-200" />
              <div><p className="font-semibold text-gray-700">No books yet</p><p className="text-sm text-gray-400 mt-1">Create your first project to get started.</p></div>
              <Button onClick={() => setShowNew(true)} className="bg-[#C9941A] text-white" data-testid="button-first-project"><Plus className="w-4 h-4 mr-2" />Create Your First Book</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(proj => (
              <Card key={proj.id} className="group hover-elevate cursor-pointer bg-white border border-gray-100 overflow-hidden" onClick={() => navigate(`/book-studio/${proj.id}`)} data-testid={`card-project-${proj.id}`}>
                <div className="h-24 bg-gradient-to-br from-[#C9941A]/20 to-[#8B5E3C]/20 relative"
                  style={proj.coverImageUrl ? { backgroundImage: `url(${proj.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
                  {!proj.coverImageUrl && <BookOpen className="absolute inset-0 m-auto w-8 h-8 text-[#C9941A]/30" />}
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[proj.status] || STATUS_BADGE.draft}`}>{STATUS_LABEL[proj.status] || "Draft"}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div><h3 className="font-semibold text-gray-900 leading-snug truncate">{proj.title}</h3>{proj.subtitle && <p className="text-xs text-gray-400 truncate">{proj.subtitle}</p>}</div>
                  <div className="grid grid-cols-3 text-center text-xs gap-1">
                    <div><p className="font-semibold text-gray-800">{(proj.wordCount || 0).toLocaleString()}</p><p className="text-gray-400">words</p></div>
                    <div><p className="font-semibold text-gray-800">{proj.chapterCount || 0}</p><p className="text-gray-400">chapters</p></div>
                    <div><p className={`font-semibold ${readinessColor(proj.readinessScore || 0)}`}>{proj.readinessScore || 0}%</p><p className="text-gray-400">ready</p></div>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400"><Clock className="w-3 h-3" />{timeAgo(proj.lastEditedAt)}</div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" onClick={e => { e.stopPropagation(); navigate("/book-perfection-suite"); }} title="Polish" data-testid={`button-polish-${proj.id}`}><BarChart2 className="w-3.5 h-3.5" /></button>
                      <button className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" onClick={e => { e.stopPropagation(); setDeleteTarget(proj); }} title="Delete" data-testid={`button-delete-${proj.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                      <ChevronRight className="w-4 h-4 text-[#C9941A] ml-0.5" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Pencil, label: "Perfection Suite", desc: "Deep editing, consistency checks", href: "/book-perfection-suite" },
            { icon: Upload, label: "Publish & Export", desc: "KDP, print, marketplace", href: "/book-studio/publish" },
            { icon: FileText, label: "Author Dashboard", desc: "Sales, analytics, royalties", href: "/author-dashboard" },
          ].map(item => (
            <Card key={item.label} className="hover-elevate cursor-pointer bg-white border border-gray-100" onClick={() => navigate(item.href)}>
              <div className="p-4 flex items-center gap-3">
                <div className="rounded-md bg-[#C9941A]/10 p-2 shrink-0"><item.icon className="w-4 h-4 text-[#C9941A]" /></div>
                <div className="min-w-0"><p className="text-sm font-semibold text-gray-800">{item.label}</p><p className="text-xs text-gray-400 truncate">{item.desc}</p></div>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Footer />

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Book Project</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-title">Book Title</Label>
              <Input id="new-title" placeholder="e.g. My Recovery Story" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newTitle.trim()) createMutation.mutate({ title: newTitle.trim(), genre: newGenre }); }}
                data-testid="input-new-title" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Genre</Label>
              <Select value={newGenre} onValueChange={setNewGenre}>
                <SelectTrigger data-testid="select-genre"><SelectValue /></SelectTrigger>
                <SelectContent>{GENRES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ title: newTitle.trim(), genre: newGenre })} disabled={!newTitle.trim() || createMutation.isPending} className="bg-[#C9941A] text-white" data-testid="button-create-confirm">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete project?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">"<span className="font-medium">{deleteTarget?.title}</span>" and all its content will be permanently removed.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} data-testid="button-delete-confirm">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
