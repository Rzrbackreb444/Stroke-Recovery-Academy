import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Brain, Plus, Clock, Trash2, Loader2, ArrowRight, Lock } from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import type { PuzzleBook } from "@shared/schema";

const TRIM_SIZES = [
  { value: "8.5x11", label: '8.5" × 11" — Letter' },
  { value: "7x10", label: '7" × 10"' },
  { value: "6x9", label: '6" × 9" — Trade' },
];

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  published: "Published",
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function PuzzleStudioHub() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [trimSize, setTrimSize] = useState("8.5x11");

  const { data: books, isLoading } = useQuery<PuzzleBook[]>({
    queryKey: ["/api/puzzle/books"],
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/puzzle/books", {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        authorName: authorName.trim() || undefined,
        trimSize,
      });
      return res.json();
    },
    onSuccess: (book: PuzzleBook) => {
      queryClient.invalidateQueries({ queryKey: ["/api/puzzle/books"] });
      setCreateOpen(false);
      setTitle(""); setSubtitle(""); setAuthorName("");
      navigate(`/puzzle-studio/${book.id}`);
    },
    onError: async (err: any) => {
      toast({ title: "Could not create book", description: err?.message || "Try again.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/puzzle/books/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/puzzle/books"] }),
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
      <SEO title="Brain Games Studio — Stroke Recovery Academy" description="Build custom puzzle books — word search, crossword, sudoku, maze and more. Export print-ready and digital PDFs." />
      <RecoveryHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="mb-10">
          <p className="text-xs text-gold uppercase tracking-[0.28em] mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4" /> Brain Games
          </p>
          <h1 className="text-4xl sm:text-6xl font-display text-white mb-3">
            Puzzle Studio
          </h1>
          <p className="text-gray-400 text-base max-w-2xl">
            Build custom puzzle books for recovery — word search, crossword, word scramble, sudoku, maze, and memory match. Organize, preview, and export print-ready and digital PDFs.
          </p>
        </div>

        {!authLoading && !isAuthenticated ? (
          <Card className="bg-[#111] border-[#1e1e1e] p-10 text-center">
            <Lock className="h-10 w-10 text-gold mx-auto mb-4" />
            <h2 className="text-2xl font-display text-white mb-2">Sign in to build puzzle books</h2>
            <p className="text-gray-400 mb-6">Your puzzle books are saved to your account.</p>
            <Button asChild className="bg-gold text-black hover:bg-gold">
              <a href="/api/login" data-testid="link-signin">Sign In</a>
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
              <h2 className="text-xl font-bold text-white">Your puzzle books</h2>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gold text-black hover:bg-gold" data-testid="button-new-book">
                    <Plus className="h-4 w-4 mr-2" /> New Puzzle Book
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#111] border-[#1e1e1e] text-white">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl">New Puzzle Book</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label htmlFor="pz-title" className="text-gray-300">Title</Label>
                      <Input id="pz-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Recovery Brain Games Vol. 1" className="bg-[#0D0D0D] border-[#1e1e1e] text-white mt-1" data-testid="input-book-title" />
                    </div>
                    <div>
                      <Label htmlFor="pz-subtitle" className="text-gray-300">Subtitle (optional)</Label>
                      <Input id="pz-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="50 puzzles to rewire and rebuild" className="bg-[#0D0D0D] border-[#1e1e1e] text-white mt-1" data-testid="input-book-subtitle" />
                    </div>
                    <div>
                      <Label htmlFor="pz-author" className="text-gray-300">Author (optional)</Label>
                      <Input id="pz-author" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Your name" className="bg-[#0D0D0D] border-[#1e1e1e] text-white mt-1" data-testid="input-book-author" />
                    </div>
                    <div>
                      <Label className="text-gray-300">Trim size</Label>
                      <Select value={trimSize} onValueChange={setTrimSize}>
                        <SelectTrigger className="bg-[#0D0D0D] border-[#1e1e1e] text-white mt-1" data-testid="select-trim-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIM_SIZES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      className="bg-gold text-black hover:bg-gold"
                      disabled={!title.trim() || createMutation.isPending}
                      onClick={() => createMutation.mutate()}
                      data-testid="button-create-book"
                    >
                      {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !books || books.length === 0 ? (
              <Card className="bg-[#111] border-[#1e1e1e] p-12 text-center">
                <Brain className="h-12 w-12 text-gold mx-auto mb-4" />
                <h3 className="text-2xl font-display text-white mb-2">No puzzle books yet</h3>
                <p className="text-gray-400 mb-6">Create your first book and start adding puzzles.</p>
                <Button className="bg-gold text-black hover:bg-gold" onClick={() => setCreateOpen(true)} data-testid="button-empty-new">
                  <Plus className="h-4 w-4 mr-2" /> New Puzzle Book
                </Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {books.map((b) => (
                  <Card
                    key={b.id}
                    className="group bg-[#111] border-[#1e1e1e] p-5 hover-elevate cursor-pointer flex flex-col"
                    onClick={() => navigate(`/puzzle-studio/${b.id}`)}
                    data-testid={`card-book-${b.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge className="bg-gold/15 text-gold border-gold/30">{STATUS_LABEL[b.status] || b.status}</Badge>
                      <button
                        className="text-gray-600 hover:text-red-400 p-1 rounded"
                        onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${b.title}"? This cannot be undone.`)) deleteMutation.mutate(b.id); }}
                        title="Delete"
                        data-testid={`button-delete-book-${b.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="text-xl font-display text-white leading-tight mb-1" data-testid={`text-book-title-${b.id}`}>{b.title}</h3>
                    {b.subtitle && <p className="text-sm text-gray-400 mb-3 line-clamp-2">{b.subtitle}</p>}
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(b.lastEditedAt as unknown as string)}</span>
                      <span className="flex items-center gap-1 text-gold group-hover:translate-x-0.5 transition-transform">Open <ArrowRight className="h-3 w-3" /></span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
