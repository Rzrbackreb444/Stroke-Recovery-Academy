import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Target, Plus, Check, ChevronDown, ChevronRight, Trash2,
  ArrowLeft, Trophy, CheckCircle, Circle, Loader2, Pencil, X
} from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ORANGE = "#E2741B";

interface MicroGoal {
  id: number;
  goalId: number;
  title: string;
  targetWeek: string | null;
  status: "pending" | "completed" | "skipped";
  sortOrder: number;
  completedAt: string | null;
}

interface Goal {
  id: number;
  title: string;
  why: string | null;
  targetDate: string | null;
  status: "active" | "completed" | "abandoned";
  completedAt: string | null;
  createdAt: string;
  microGoals: MicroGoal[];
}

// ── New Goal Dialog ───────────────────────────────────────────────────────────
function NewGoalDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/recovery/goals", {
        title: title.trim(),
        why: why.trim() || undefined,
        targetDate: targetDate.trim() || undefined,
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recovery/goals"] });
      toast({ title: "Goal set." });
      setTitle(""); setWhy(""); setTargetDate("");
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Couldn't save", description: e?.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#111] border-[#222] text-white">
        <DialogHeader>
          <DialogTitle className="text-white font-black text-xl">What's your big goal?</DialogTitle>
          <p className="text-gray-400 text-sm">Set one meaningful target. You'll break it into steps next.</p>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-gray-400">Goal <span style={{ color: ORANGE }}>*</span></Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Walk to the mailbox without a cane"
              maxLength={200}
              className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600"
              data-testid="input-goal-title"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-gray-400">Why it matters (optional)</Label>
            <Textarea
              value={why}
              onChange={e => setWhy(e.target.value)}
              placeholder="Why does reaching this goal matter to you? Write it in your own words — you'll read this on hard days."
              className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600 min-h-[90px]"
              maxLength={1000}
              data-testid="textarea-goal-why"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-gray-400">Target (optional)</Label>
            <Input
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              placeholder="e.g. by summer, in 3 months, before my birthday"
              className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600"
              data-testid="input-goal-target"
            />
          </div>
          <Button
            onClick={() => mut.mutate()}
            disabled={!title.trim() || mut.isPending}
            className="w-full font-bold text-white"
            style={{ background: ORANGE }}
            data-testid="button-save-goal"
          >
            {mut.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : "Set This Goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Goal card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal }: { goal: Goal }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showWhy, setShowWhy] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [stepTitle, setStepTitle] = useState("");
  const [stepWeek, setStepWeek] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editWhy, setEditWhy] = useState(goal.why ?? "");
  const [editTarget, setEditTarget] = useState(goal.targetDate ?? "");

  const completed = goal.microGoals.filter(m => m.status === "completed").length;
  const total = goal.microGoals.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const nextStep = goal.microGoals.find(m => m.status === "pending");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["/api/recovery/goals"] });

  const toggleMicro = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/recovery/goals/${goal.id}/micro/${id}`, { status });
      if (!res.ok) throw new Error();
    },
    onSuccess: invalidate,
    onError: () => toast({ title: "Couldn't update step", variant: "destructive" }),
  });

  const deleteMicro = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/recovery/goals/${goal.id}/micro/${id}`);
      if (!res.ok) throw new Error();
    },
    onSuccess: invalidate,
  });

  const addMicro = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/recovery/goals/${goal.id}/micro`, {
        title: stepTitle.trim(),
        targetWeek: stepWeek.trim() || undefined,
        sortOrder: goal.microGoals.length,
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { invalidate(); setStepTitle(""); setStepWeek(""); setAddingStep(false); },
    onError: () => toast({ title: "Couldn't add step", variant: "destructive" }),
  });

  const updateGoal = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/recovery/goals/${goal.id}`, {
        title: editTitle.trim(),
        why: editWhy.trim() || undefined,
        targetDate: editTarget.trim() || undefined,
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { invalidate(); setEditing(false); },
    onError: () => toast({ title: "Couldn't update goal", variant: "destructive" }),
  });

  const completeGoal = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/recovery/goals/${goal.id}`, { status: "completed" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { invalidate(); toast({ title: "Goal completed.", description: "That's a real win." }); },
    onError: () => toast({ title: "Couldn't complete goal", variant: "destructive" }),
  });

  const abandonGoal = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/recovery/goals/${goal.id}`, { status: "abandoned" });
      if (!res.ok) throw new Error();
    },
    onSuccess: invalidate,
  });

  const isCompleted = goal.status === "completed";

  return (
    <Card className={`border-[#222] ${isCompleted ? "bg-[#0a0a0a] opacity-70" : "bg-[#111]"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          {editing ? (
            <div className="flex-1 space-y-2">
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="bg-[#1a1a1a] border-[#333] text-white font-bold text-base"
                data-testid={`input-edit-goal-${goal.id}`}
              />
              <Textarea
                value={editWhy}
                onChange={e => setEditWhy(e.target.value)}
                placeholder="Why it matters…"
                className="bg-[#1a1a1a] border-[#333] text-white text-sm min-h-[60px]"
              />
              <Input
                value={editTarget}
                onChange={e => setEditTarget(e.target.value)}
                placeholder="Target date…"
                className="bg-[#1a1a1a] border-[#333] text-white text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateGoal.mutate()} disabled={updateGoal.isPending}
                  style={{ background: ORANGE }} className="text-white text-xs">
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="text-gray-400 text-xs" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {isCompleted && (
                  <Badge variant="secondary" className="text-[10px] bg-green-900/40 text-green-400">Completed</Badge>
                )}
                <h3 className={`font-black text-lg leading-tight ${isCompleted ? "line-through text-gray-500" : "text-white"}`}>
                  {goal.title}
                </h3>
              </div>
              {goal.targetDate && (
                <p className="text-xs text-gray-500 mt-0.5">Target: {goal.targetDate}</p>
              )}
            </div>
          )}
          {!isCompleted && !editing && (
            <div className="flex gap-1.5">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500"
                onClick={() => setEditing(true)} data-testid={`button-edit-goal-${goal.id}`}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500"
                onClick={() => abandonGoal.mutate()} data-testid={`button-abandon-goal-${goal.id}`}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Why it matters */}
        {goal.why && !editing && (
          <button
            onClick={() => setShowWhy(v => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mt-1 transition-colors"
            data-testid={`button-toggle-why-${goal.id}`}
          >
            {showWhy ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Why it matters
          </button>
        )}
        {showWhy && goal.why && (
          <p className="text-sm text-gray-400 italic mt-1 border-l-2 pl-3" style={{ borderColor: ORANGE }}>
            "{goal.why}"
          </p>
        )}

        {/* Progress */}
        {total > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{completed}/{total} steps done</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5 bg-[#222]" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-1.5">
        {/* Micro-goals */}
        {goal.microGoals.map((mg) => (
          <div key={mg.id}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 ${mg.status === "completed" ? "opacity-50" : "hover:bg-[#1a1a1a]"} group transition-colors`}
            data-testid={`micro-goal-${mg.id}`}
          >
            <button
              onClick={() => toggleMicro.mutate({ id: mg.id, status: mg.status === "completed" ? "pending" : "completed" })}
              className="shrink-0 transition-colors"
              data-testid={`button-toggle-micro-${mg.id}`}
            >
              {mg.status === "completed"
                ? <CheckCircle className="w-4 h-4" style={{ color: ORANGE }} />
                : <Circle className="w-4 h-4 text-gray-600" />
              }
            </button>
            <span className={`flex-1 text-sm ${mg.status === "completed" ? "line-through text-gray-600" : "text-gray-200"}`}>
              {mg.title}
              {mg.targetWeek && (
                <span className="ml-2 text-[10px] text-gray-600">({mg.targetWeek})</span>
              )}
            </span>
            <button
              onClick={() => deleteMicro.mutate(mg.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-opacity"
              data-testid={`button-delete-micro-${mg.id}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Add step */}
        {!isCompleted && (
          addingStep ? (
            <div className="flex gap-2 mt-2 flex-wrap">
              <Input
                value={stepTitle}
                onChange={e => setStepTitle(e.target.value)}
                placeholder="Next step…"
                className="flex-1 bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600 text-sm h-8"
                data-testid={`input-new-step-${goal.id}`}
                onKeyDown={e => { if (e.key === "Enter" && stepTitle.trim()) addMicro.mutate(); }}
              />
              <Input
                value={stepWeek}
                onChange={e => setStepWeek(e.target.value)}
                placeholder="Week (optional)"
                className="w-32 bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600 text-sm h-8"
              />
              <Button size="sm" onClick={() => addMicro.mutate()} disabled={!stepTitle.trim() || addMicro.isPending}
                style={{ background: ORANGE }} className="text-white h-8 text-xs">
                Add
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-500 h-8 text-xs"
                onClick={() => { setAddingStep(false); setStepTitle(""); setStepWeek(""); }}>
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setAddingStep(true)}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 mt-2 transition-colors"
              data-testid={`button-add-step-${goal.id}`}
            >
              <Plus className="w-3 h-3" /> Add a step
            </button>
          )
        )}

        {/* Complete goal CTA */}
        {!isCompleted && total > 0 && completed === total && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border p-3" style={{ borderColor: `${ORANGE}40`, background: `${ORANGE}10` }}>
            <Trophy className="w-4 h-4 shrink-0" style={{ color: ORANGE }} />
            <span className="text-sm text-gray-300 flex-1">All steps done. Ready to mark this goal complete?</span>
            <Button size="sm" onClick={() => completeGoal.mutate()} disabled={completeGoal.isPending}
              style={{ background: ORANGE }} className="text-white text-xs shrink-0">
              Complete
            </Button>
          </div>
        )}
        {!isCompleted && total > 0 && completed < total && nextStep && (
          <p className="mt-2 text-[11px] text-gray-600">
            Next: <span className="text-gray-400">{nextStep.title}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RecoveryGoals() {
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/recovery/goals"],
  });

  const active = (goals ?? []).filter(g => g.status === "active");
  const done = (goals ?? []).filter(g => g.status === "completed");
  const [showDone, setShowDone] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="Recovery Goals — Stroke Recovery Academy"
        description="Set your big recovery goal, break it into steps, and track every win along the way."
        canonical="/recovery/goals"
        keywords={["stroke recovery goal", "recovery milestone", "rehabilitation plan"]}
      />
      <RecoveryHeader />
      <NewGoalDialog open={newGoalOpen} onOpenChange={setNewGoalOpen} />

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/recovery/dashboard">
            <Button variant="ghost" size="sm" className="mb-4 text-gray-400">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: ORANGE }}>
                Recovery Goals
              </p>
              <h1 className="text-3xl font-black text-white leading-tight">What are you fighting for?</h1>
              <p className="mt-2 text-gray-400 text-sm max-w-md">
                One big goal. Broken into steps you can actually hit. Every step completed
                is a rep toward recovery — not just physically, but mentally.
              </p>
            </div>
            <Button
              onClick={() => setNewGoalOpen(true)}
              style={{ background: ORANGE }}
              className="text-white font-bold shrink-0"
              data-testid="button-new-goal"
            >
              <Plus className="w-4 h-4 mr-2" /> Set a Goal
            </Button>
          </div>
        </div>

        {/* Active goals */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : active.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-[#222]">
            <Target className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="font-bold text-gray-400 mb-1">No active goals yet.</p>
            <p className="text-sm text-gray-600 mb-4 max-w-xs mx-auto">
              Set your first recovery goal — something real, something that matters.
              Then break it into 3–5 steps you can actually tackle.
            </p>
            <Button
              onClick={() => setNewGoalOpen(true)}
              style={{ background: ORANGE }}
              className="text-white font-bold"
              data-testid="button-new-goal-empty"
            >
              <Plus className="w-4 h-4 mr-2" /> Set Your First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {active.map(g => <GoalCard key={g.id} goal={g} />)}
            <Button
              variant="outline"
              onClick={() => setNewGoalOpen(true)}
              className="w-full border-dashed border-[#333] text-gray-500 hover:text-gray-300"
              data-testid="button-add-another-goal"
            >
              <Plus className="w-4 h-4 mr-2" /> Add another goal
            </Button>
          </div>
        )}

        {/* Completed goals */}
        {done.length > 0 && (
          <div className="mt-10">
            <button
              onClick={() => setShowDone(v => !v)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              data-testid="button-toggle-completed"
            >
              {showDone ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Check className="w-4 h-4 text-green-600" />
              {done.length} completed goal{done.length !== 1 ? "s" : ""}
            </button>
            {showDone && (
              <div className="mt-3 space-y-3">
                {done.map(g => <GoalCard key={g.id} goal={g} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
