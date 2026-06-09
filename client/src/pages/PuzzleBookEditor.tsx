import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Plus, Trash2, Loader2, RefreshCw, Download, Printer,
  ChevronUp, ChevronDown, Eye, EyeOff, Shuffle, Save,
} from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import {
  renderPuzzleHtml, PUZZLE_CSS, PUZZLE_TYPE_LABELS, type PuzzleType,
} from "@shared/puzzleEngine";
import type { Puzzle, PuzzleBook } from "@shared/schema";

type BookDetail = PuzzleBook & { puzzles: Puzzle[] };

const PUZZLE_TYPES: PuzzleType[] = [
  "word_search", "crossword", "word_scramble", "sudoku", "maze", "memory_match",
];

const DIFFICULTIES: { value: "easy" | "medium" | "hard"; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const NEEDS_WORDS: PuzzleType[] = ["word_search", "word_scramble"];
const NEEDS_CLUES: PuzzleType[] = ["crossword"];
const NEEDS_PAIRS: PuzzleType[] = ["memory_match"];
const NEEDS_SIZE: PuzzleType[] = ["word_search", "maze"];

function linesToArray(text: string): string[] {
  return text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
}

interface EditState {
  title: string;
  instructions: string;
  difficulty: "easy" | "medium" | "hard";
  wordsText: string;
  size: number;
  clues: { answer: string; clue: string }[];
  pairs: { left: string; right: string }[];
}

function stateFromPuzzle(p: Puzzle): EditState {
  const cfg = (p.config as any) || {};
  return {
    title: p.title || "",
    instructions: p.instructions || "",
    difficulty: (p.difficulty as any) || "easy",
    wordsText: Array.isArray(cfg.words) ? cfg.words.join("\n") : "",
    size: typeof cfg.size === "number" ? cfg.size : 12,
    clues: Array.isArray(cfg.clues) && cfg.clues.length ? cfg.clues : [{ answer: "", clue: "" }],
    pairs: Array.isArray(cfg.pairs) && cfg.pairs.length ? cfg.pairs : [{ left: "", right: "" }],
  };
}

export default function PuzzleBookEditor() {
  const [, params] = useRoute("/puzzle-studio/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const bookId = Number(params?.id);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState<PuzzleType>("word_search");
  const [newTitle, setNewTitle] = useState("");
  const [exporting, setExporting] = useState<"digital" | "print" | null>(null);

  const { data: book, isLoading } = useQuery<BookDetail>({
    queryKey: ["/api/puzzle/books", bookId],
    enabled: Number.isFinite(bookId),
  });

  const puzzles = book?.puzzles ?? [];
  const selected = useMemo(() => puzzles.find((p) => p.id === selectedId) || null, [puzzles, selectedId]);
  console.log("[puzzle-dbg] render", { bookId, puzzles: puzzles.length, selectedId, hasBook: !!book });

  // Default-select first puzzle once the book loads.
  useEffect(() => {
    if (selectedId == null && puzzles.length > 0) setSelectedId(puzzles[0].id);
  }, [puzzles, selectedId]);

  // Sync the edit form when the selected puzzle's identity changes. Keying on
  // `selected?.id` (not `selectedId`) means the effect re-runs once the freshly
  // created/refetched puzzle object actually arrives in cache — fixing the case
  // where add sets selectedId before the puzzle exists — without resyncing (and
  // clobbering unsaved edits) on content-only refetches of the same puzzle.
  useEffect(() => {
    if (selected) setEdit(stateFromPuzzle(selected));
    else setEdit(null);
    setShowSolution(false);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/puzzle/books", bookId] });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/puzzle/books/${bookId}/puzzles`, {
        type: newType,
        title: newTitle.trim() || PUZZLE_TYPE_LABELS[newType],
        difficulty: "easy",
        config: { difficulty: "easy" },
      });
      return res.json();
    },
    onSuccess: async (p: Puzzle) => {
      console.log("[puzzle-dbg] add onSuccess", p?.id);
      await invalidate();
      console.log("[puzzle-dbg] add invalidate done");
      setAddOpen(false);
      setNewTitle("");
      setSelectedId(p.id);
    },
    onError: (err: any) => toast({ title: "Could not add puzzle", description: err?.message, variant: "destructive" }),
  });

  function buildConfig(s: EditState, type: PuzzleType) {
    const config: Record<string, unknown> = { difficulty: s.difficulty };
    if (NEEDS_WORDS.includes(type)) config.words = linesToArray(s.wordsText).slice(0, 60);
    if (NEEDS_SIZE.includes(type)) config.size = Math.min(25, Math.max(5, s.size || 12));
    if (NEEDS_CLUES.includes(type)) {
      config.clues = s.clues
        .map((c) => ({ answer: c.answer.trim(), clue: c.clue.trim() }))
        .filter((c) => c.answer);
    }
    if (NEEDS_PAIRS.includes(type)) {
      config.pairs = s.pairs
        .map((p) => ({ left: p.left.trim(), right: p.right.trim() }))
        .filter((p) => p.left && p.right);
    }
    return config;
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selected || !edit) return;
      const config = buildConfig(edit, selected.type as PuzzleType);
      const res = await apiRequest("PATCH", `/api/puzzle/puzzles/${selected.id}`, {
        title: edit.title,
        instructions: edit.instructions,
        difficulty: edit.difficulty,
        config,
        regenerate: true,
      });
      return res.json();
    },
    onSuccess: () => { invalidate(); toast({ title: "Puzzle updated" }); },
    onError: (err: any) => toast({ title: "Update failed", description: err?.message, variant: "destructive" }),
  });

  const regenMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      await apiRequest("POST", `/api/puzzle/puzzles/${selected.id}/regenerate`);
    },
    onSuccess: () => invalidate(),
    onError: () => toast({ title: "Regenerate failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/puzzle/puzzles/${id}`); },
    onSuccess: (_d, id) => {
      if (selectedId === id) setSelectedId(null);
      invalidate();
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      await apiRequest("POST", `/api/puzzle/books/${bookId}/reorder`, { orderedIds });
    },
    onSuccess: () => invalidate(),
  });

  function move(idx: number, dir: -1 | 1) {
    const ids = puzzles.map((p) => p.id);
    const target = idx + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    reorderMutation.mutate(ids);
  }

  async function exportPdf(format: "digital" | "print") {
    setExporting(format);
    try {
      const url = `/api/puzzle/books/${bookId}/export${format === "print" ? "?format=print" : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.message || "Export failed");
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `${(book?.title || "puzzle-book").replace(/[^a-zA-Z0-9]/g, "_")}${format === "print" ? "_print" : ""}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch (err: any) {
      toast({ title: "Export failed", description: err?.message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  }

  const previewHtml = useMemo(() => {
    if (!selected) return "";
    return renderPuzzleHtml(
      {
        type: selected.type as PuzzleType,
        title: edit?.title ?? selected.title ?? "",
        instructions: edit?.instructions ?? selected.instructions ?? "",
        content: selected.content as any,
      },
      { showSolution },
    );
  }, [selected, showSolution, edit?.title, edit?.instructions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
        <RecoveryHeader />
        <div className="flex-1 flex items-center justify-center text-gray-500"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
        <RecoveryHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-gray-400">Puzzle book not found.</p>
          <Button className="bg-gold text-black hover:bg-gold" onClick={() => navigate("/puzzle-studio")}>Back to Puzzle Studio</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const type = selected?.type as PuzzleType | undefined;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
      <SEO title={`${book.title} — Puzzle Studio`} description="Edit your puzzle book." />
      <RecoveryHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <button onClick={() => navigate("/puzzle-studio")} className="text-sm text-gray-400 hover:text-gold flex items-center gap-1 mb-2" data-testid="link-back">
              <ArrowLeft className="h-4 w-4" /> Puzzle Studio
            </button>
            <h1 className="text-3xl sm:text-4xl font-display text-white" data-testid="text-book-title">{book.title}</h1>
            {book.subtitle && <p className="text-gray-400 text-sm mt-1">{book.subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" className="border-[#1e1e1e] text-white" disabled={exporting !== null || puzzles.length === 0} onClick={() => exportPdf("digital")} data-testid="button-export-digital">
              {exporting === "digital" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Digital PDF
            </Button>
            <Button className="bg-gold text-black hover:bg-gold" disabled={exporting !== null || puzzles.length === 0} onClick={() => exportPdf("print")} data-testid="button-export-print">
              {exporting === "print" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />} Print-Ready PDF
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Puzzle list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Puzzles ({puzzles.length})</h2>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gold text-black hover:bg-gold" data-testid="button-add-puzzle">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#111] border-[#1e1e1e] text-white">
                  <DialogHeader><DialogTitle className="font-display text-2xl">Add a puzzle</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label className="text-gray-300">Type</Label>
                      <Select value={newType} onValueChange={(v) => setNewType(v as PuzzleType)}>
                        <SelectTrigger className="bg-[#0D0D0D] border-[#1e1e1e] text-white mt-1" data-testid="select-puzzle-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PUZZLE_TYPES.map((t) => <SelectItem key={t} value={t}>{PUZZLE_TYPE_LABELS[t]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Title (optional)</Label>
                      <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={PUZZLE_TYPE_LABELS[newType]} className="bg-[#0D0D0D] border-[#1e1e1e] text-white mt-1" data-testid="input-new-puzzle-title" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className="bg-gold text-black hover:bg-gold" disabled={addMutation.isPending} onClick={() => addMutation.mutate()} data-testid="button-confirm-add">
                      {addMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} Add Puzzle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {puzzles.length === 0 ? (
              <Card className="bg-[#111] border-[#1e1e1e] p-6 text-center text-sm text-gray-500">
                No puzzles yet. Click <span className="text-gold">Add</span> to start.
              </Card>
            ) : (
              <div className="space-y-2">
                {puzzles.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`group rounded-md border p-3 cursor-pointer transition-colors ${selectedId === p.id ? "border-gold bg-gold/10" : "border-[#1e1e1e] bg-[#111] hover-elevate"}`}
                    onClick={() => setSelectedId(p.id)}
                    data-testid={`item-puzzle-${p.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{idx + 1}. {p.title || PUZZLE_TYPE_LABELS[p.type as PuzzleType]}</p>
                        <p className="text-xs text-gray-500">{PUZZLE_TYPE_LABELS[p.type as PuzzleType]}</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button className="p-1 text-gray-500 hover:text-gold disabled:opacity-30" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); move(idx, -1); }} data-testid={`button-up-${p.id}`}><ChevronUp className="h-4 w-4" /></button>
                        <button className="p-1 text-gray-500 hover:text-gold disabled:opacity-30" disabled={idx === puzzles.length - 1} onClick={(e) => { e.stopPropagation(); move(idx, 1); }} data-testid={`button-down-${p.id}`}><ChevronDown className="h-4 w-4" /></button>
                        <button className="p-1 text-gray-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); if (confirm("Delete this puzzle?")) deleteMutation.mutate(p.id); }} data-testid={`button-delete-puzzle-${p.id}`}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Config + preview */}
          {selected && edit && type ? (
            <div className="grid xl:grid-cols-2 gap-6">
              {/* Config */}
              <Card className="bg-[#111] border-[#1e1e1e] p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge className="bg-gold/15 text-gold border-gold/30">{PUZZLE_TYPE_LABELS[type]}</Badge>
                  <Button size="sm" variant="ghost" className="text-gray-400" onClick={() => regenMutation.mutate()} disabled={regenMutation.isPending} data-testid="button-regenerate">
                    {regenMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Shuffle className="h-4 w-4 mr-1" />} Shuffle
                  </Button>
                </div>

                <div>
                  <Label className="text-gray-300">Title</Label>
                  <Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className="bg-[#0D0D0D] border-[#1e1e1e] text-white mt-1" data-testid="input-puzzle-title" />
                </div>
                <div>
                  <Label className="text-gray-300">Instructions</Label>
                  <Input value={edit.instructions} onChange={(e) => setEdit({ ...edit, instructions: e.target.value })} placeholder="Find all the hidden words." className="bg-[#0D0D0D] border-[#1e1e1e] text-white mt-1" data-testid="input-puzzle-instructions" />
                </div>
                <div>
                  <Label className="text-gray-300">Difficulty</Label>
                  <Select value={edit.difficulty} onValueChange={(v) => setEdit({ ...edit, difficulty: v as any })}>
                    <SelectTrigger className="bg-[#0D0D0D] border-[#1e1e1e] text-white mt-1" data-testid="select-difficulty"><SelectValue /></SelectTrigger>
                    <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {NEEDS_WORDS.includes(type) && (
                  <div>
                    <Label className="text-gray-300">Words (one per line)</Label>
                    <Textarea value={edit.wordsText} onChange={(e) => setEdit({ ...edit, wordsText: e.target.value })} rows={6} placeholder={"RECOVERY\nREWIRE\nREBUILD\nRESILIENCE"} className="bg-[#0D0D0D] border-[#1e1e1e] text-white mt-1 font-mono text-sm" data-testid="input-words" />
                  </div>
                )}

                {NEEDS_SIZE.includes(type) && (
                  <div>
                    <Label className="text-gray-300">Grid size ({edit.size})</Label>
                    <Input type="number" min={5} max={25} value={edit.size} onChange={(e) => setEdit({ ...edit, size: Number(e.target.value) })} className="bg-[#0D0D0D] border-[#1e1e1e] text-white mt-1" data-testid="input-size" />
                  </div>
                )}

                {NEEDS_CLUES.includes(type) && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Clues</Label>
                    {edit.clues.map((c, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={c.answer} onChange={(e) => { const clues = [...edit.clues]; clues[i] = { ...clues[i], answer: e.target.value }; setEdit({ ...edit, clues }); }} placeholder="Answer" className="bg-[#0D0D0D] border-[#1e1e1e] text-white w-1/3" data-testid={`input-clue-answer-${i}`} />
                        <Input value={c.clue} onChange={(e) => { const clues = [...edit.clues]; clues[i] = { ...clues[i], clue: e.target.value }; setEdit({ ...edit, clues }); }} placeholder="Clue" className="bg-[#0D0D0D] border-[#1e1e1e] text-white flex-1" data-testid={`input-clue-text-${i}`} />
                        <button className="p-2 text-gray-500 hover:text-red-400" onClick={() => setEdit({ ...edit, clues: edit.clues.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="border-[#1e1e1e] text-gray-300" onClick={() => setEdit({ ...edit, clues: [...edit.clues, { answer: "", clue: "" }] })} data-testid="button-add-clue"><Plus className="h-3 w-3 mr-1" /> Add clue</Button>
                  </div>
                )}

                {NEEDS_PAIRS.includes(type) && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Matching pairs</Label>
                    {edit.pairs.map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={p.left} onChange={(e) => { const pairs = [...edit.pairs]; pairs[i] = { ...pairs[i], left: e.target.value }; setEdit({ ...edit, pairs }); }} placeholder="Left" className="bg-[#0D0D0D] border-[#1e1e1e] text-white flex-1" data-testid={`input-pair-left-${i}`} />
                        <Input value={p.right} onChange={(e) => { const pairs = [...edit.pairs]; pairs[i] = { ...pairs[i], right: e.target.value }; setEdit({ ...edit, pairs }); }} placeholder="Right" className="bg-[#0D0D0D] border-[#1e1e1e] text-white flex-1" data-testid={`input-pair-right-${i}`} />
                        <button className="p-2 text-gray-500 hover:text-red-400" onClick={() => setEdit({ ...edit, pairs: edit.pairs.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="border-[#1e1e1e] text-gray-300" onClick={() => setEdit({ ...edit, pairs: [...edit.pairs, { left: "", right: "" }] })} data-testid="button-add-pair"><Plus className="h-3 w-3 mr-1" /> Add pair</Button>
                  </div>
                )}

                <Button className="w-full bg-gold text-black hover:bg-gold" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-puzzle">
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Generate & Save
                </Button>
              </Card>

              {/* Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Preview</h2>
                  <Button size="sm" variant="ghost" className="text-gray-400" onClick={() => setShowSolution((s) => !s)} data-testid="button-toggle-solution">
                    {showSolution ? <><EyeOff className="h-4 w-4 mr-1" /> Hide solution</> : <><Eye className="h-4 w-4 mr-1" /> Show solution</>}
                  </Button>
                </div>
                <div className="bg-white rounded-md p-6 overflow-auto max-h-[70vh]" data-testid="preview-puzzle">
                  <style>{PUZZLE_CSS}</style>
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>
            </div>
          ) : (
            <Card className="bg-[#111] border-[#1e1e1e] p-12 text-center flex flex-col items-center justify-center">
              <p className="text-gray-400 mb-2">Select a puzzle to edit, or add a new one.</p>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
