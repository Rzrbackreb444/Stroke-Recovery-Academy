import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle, Circle, ChevronDown, ChevronUp, AlertTriangle,
  Trophy, Calendar, ArrowRight, HeartPulse,
  Activity, Brain, Users, BookOpen,
} from "lucide-react";
import { RecoverySafetyFooter } from "@/components/recovery/RecoverySafetyFooter";
import { LEVELS, BLOCKS, getTasksForLevel, todayStr } from "@/lib/recoveryRoutine";


// ─── Main Component ──────────────────────────────────────────────────────────
export default function DailyRoutine() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [level, setLevel] = useState<number>(2);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [openBlocks, setOpenBlocks] = useState<Set<string>>(new Set(["morning"]));
  const [showBadDayModal, setShowBadDayModal] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load today's saved routine
  const { data: todayData } = useQuery<{
    level: number;
    completedTasks: string[];
    notes: string | null;
    streak: number;
  }>({
    queryKey: ["/api/recovery/routine/today"],
    enabled: !!user,
  });

  useEffect(() => {
    if (todayData) {
      setLevel(todayData.level ?? 2);
      setCompleted(new Set(todayData.completedTasks ?? []));
      setNotes(todayData.notes ?? "");
    }
  }, [todayData]);

  const saveMutation = useMutation({
    mutationFn: (payload: { level: number; completedTasks: string[]; notes: string }) =>
      apiRequest("PUT", "/api/recovery/routine/today", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/routine/today"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  // Auto-save whenever anything changes (debounced)
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      saveMutation.mutate({ level, completedTasks: Array.from(completed), notes });
    }, 800);
    return () => clearTimeout(timer);
  }, [level, completed, notes, user]);

  // Compute all tasks for current level
  const allTaskIds = BLOCKS.flatMap(b => getTasksForLevel(b.tasks, level).map(t => t.id));
  const totalTasks = allTaskIds.length;
  const doneCount = allTaskIds.filter(id => completed.has(id)).length;
  const pct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const toggleTask = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleBlock = (id: string) => {
    setOpenBlocks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const activeLevel = LEVELS[level];
  const LevelIcon = activeLevel.icon;
  const streak = todayData?.streak ?? 0;

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
        <Card className="bg-[#111] border-[#222] p-8 max-w-sm w-full text-center">
          <HeartPulse className="h-10 w-10 text-[#C9941A] mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-2">Sign In to Track Your Routine</h2>
          <p className="text-gray-500 text-sm mb-6">Your progress saves automatically every day.</p>
          <Button size="lg" onClick={() => setLocation("/recovery/login")} className="w-full bg-[#C9941A] text-black font-bold" data-testid="button-sign-in-routine">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">
              <Calendar className="h-3 w-3 inline mr-1" />
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-2xl font-black text-white">Your Daily Routine</h1>
            <p className="text-gray-500 text-sm mt-1">Never Zero. Every rep counts.</p>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="text-center">
                <p className="text-2xl font-black text-[#C9941A]">{streak}</p>
                <p className="text-xs text-gray-600">day streak</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-2xl font-black text-white">{pct}%</p>
              <p className="text-xs text-gray-600">done today</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-[#1a1a1a] rounded-full mb-8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: "#C9941A" }}
          />
        </div>

        {/* Level selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Today's Intensity Level</h2>
            <button
              data-testid="button-bad-day"
              onClick={() => setShowBadDayModal(true)}
              className="text-xs text-gray-600 hover:text-[#C9941A] transition-colors flex items-center gap-1"
            >
              <AlertTriangle className="h-3 w-3" />
              Bad day?
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {LEVELS.map(l => {
              const Icon = l.icon;
              const active = l.id === level;
              return (
                <button
                  key={l.id}
                  data-testid={`level-${l.id}`}
                  onClick={() => setLevel(l.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-200 ${
                    active
                      ? `${l.accent} bg-[#111]`
                      : "border-[#1e1e1e] bg-[#0a0a0a] hover:border-[#333]"
                  }`}
                >
                  <Icon
                    className="h-5 w-5 shrink-0"
                    style={{ color: active ? l.color : "#555" }}
                  />
                  <span
                    className="text-[10px] font-bold uppercase leading-none text-center"
                    style={{ color: active ? l.color : "#555" }}
                  >
                    {l.code}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-[#0f0f0f] border border-[#1a1a1a]">
            <div className="flex items-center gap-2 mb-1">
              <LevelIcon className="h-4 w-4 shrink-0" style={{ color: activeLevel.color }} />
              <span className="font-bold text-sm" style={{ color: activeLevel.color }}>
                Level {level} — {activeLevel.name}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{activeLevel.description}</p>
          </div>
        </div>

        {/* Task blocks */}
        <div className="space-y-3 mb-8">
          {BLOCKS.map(block => {
            const tasks = getTasksForLevel(block.tasks, level);
            const doneTasks = tasks.filter(t => completed.has(t.id)).length;
            const blockPct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
            const isOpen = openBlocks.has(block.id);
            const BlockIcon = block.icon;

            return (
              <Card key={block.id} className="bg-[#0f0f0f] border-[#1e1e1e]">
                {/* Block header */}
                <button
                  data-testid={`block-toggle-${block.id}`}
                  onClick={() => toggleBlock(block.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <BlockIcon className="h-4 w-4 text-[#C9941A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{block.label}</span>
                      <span className="text-xs text-gray-600">{block.time}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${blockPct}%`,
                            backgroundColor: blockPct === 100 ? "#22c55e" : "#C9941A",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">
                        {doneTasks}/{tasks.length}
                      </span>
                    </div>
                  </div>
                  {blockPct === 100 ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-600 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-600 shrink-0" />
                  )}
                </button>

                {/* Task list */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    <div className="border-t border-[#1a1a1a] mb-3" />
                    {tasks.map(task => {
                      const done = completed.has(task.id);
                      const isNew = task.addedAt === level && level > 0;
                      const TaskIcon = task.icon;
                      return (
                        <button
                          key={task.id}
                          data-testid={`task-${task.id}`}
                          onClick={() => toggleTask(task.id)}
                          className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-150 ${
                            done
                              ? "bg-[#0a1a0a] border-green-900/40"
                              : "bg-[#111] border-[#1e1e1e] hover:border-[#333]"
                          }`}
                        >
                          {done ? (
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-700 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm leading-snug ${done ? "text-gray-500 line-through" : "text-gray-200"}`}>
                              {task.text}
                            </span>
                            {isNew && (
                              <span className="ml-2 text-[10px] font-bold uppercase text-[#C9941A] opacity-70">
                                L{task.addedAt}+
                              </span>
                            )}
                          </div>
                          {TaskIcon && !done && <TaskIcon className="h-3.5 w-3.5 text-gray-700 shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Notes */}
        <div className="mb-8">
          <label className="block text-xs text-gray-600 uppercase tracking-widest mb-2">Notes for today (optional)</label>
          <Textarea
            data-testid="input-routine-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How did today go? Anything new? Any flickers of movement?"
            className="bg-[#0f0f0f] border-[#1e1e1e] text-gray-300 placeholder:text-gray-700 resize-none focus:border-[#C9941A]/40 min-h-[80px]"
          />
        </div>

        {/* Save status */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {saved ? (
              <span className="text-green-500 text-xs flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Saved
              </span>
            ) : (
              <span className="text-gray-700 text-xs">Auto-saves as you check off</span>
            )}
          </div>
          {pct === 100 && (
            <Badge className="bg-[#C9941A]/20 text-[#C9941A] border border-[#C9941A]/30">
              <Trophy className="h-3 w-3 mr-1" /> Day Complete
            </Badge>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          <a
            href="/recovery/exercises"
            data-testid="link-exercises"
            className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#333] transition-colors"
          >
            <Activity className="h-4 w-4 text-[#C9941A] shrink-0" />
            <span className="text-sm text-gray-400">Exercise Library</span>
            <ArrowRight className="h-3 w-3 text-gray-700 ml-auto shrink-0" />
          </a>
          <a
            href="/recovery/brain-gym"
            data-testid="link-braingym"
            className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#333] transition-colors"
          >
            <Brain className="h-4 w-4 text-[#C9941A] shrink-0" />
            <span className="text-sm text-gray-400">Brain Gym</span>
            <ArrowRight className="h-3 w-3 text-gray-700 ml-auto shrink-0" />
          </a>
          <a
            href="/recovery/community"
            data-testid="link-community"
            className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#333] transition-colors"
          >
            <Users className="h-4 w-4 text-[#C9941A] shrink-0" />
            <span className="text-sm text-gray-400">Survivor Community</span>
            <ArrowRight className="h-3 w-3 text-gray-700 ml-auto shrink-0" />
          </a>
          <a
            href="/recovery/journal"
            data-testid="link-journal"
            className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#333] transition-colors"
          >
            <BookOpen className="h-4 w-4 text-[#C9941A] shrink-0" />
            <span className="text-sm text-gray-400">Recovery Journal</span>
            <ArrowRight className="h-3 w-3 text-gray-700 ml-auto shrink-0" />
          </a>
        </div>

        {/* Safety footer */}
        <RecoverySafetyFooter />
      </div>

      {/* Bad Day Modal */}
      {showBadDayModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#111] border-[#333] max-w-sm w-full p-6">
            <AlertTriangle className="h-8 w-8 text-[#C9941A] mb-4" />
            <h2 className="text-white font-black text-xl mb-2">Bad Day Protocol</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Nick built this for himself. Some days he could barely lift his arm. Those days count the same.
            </p>
            <p className="text-gray-300 text-sm font-semibold mb-1">Never Zero means this:</p>
            <ul className="text-sm text-gray-400 space-y-1 mb-6 list-none">
              <li className="flex items-start gap-2"><span className="text-[#C9941A] shrink-0 mt-0.5">→</span> Three breaths. That's one rep. It counts.</li>
              <li className="flex items-start gap-2"><span className="text-[#C9941A] shrink-0 mt-0.5">→</span> One glass of water. That's recovery.</li>
              <li className="flex items-start gap-2"><span className="text-[#C9941A] shrink-0 mt-0.5">→</span> One thing you're grateful for. That's a win.</li>
            </ul>
            <p className="text-xs text-gray-600 mb-6 italic">
              "The day you do nothing is the day the stroke wins. One rep. Always one rep." — Nick
            </p>
            <div className="flex gap-3">
              <Button
                data-testid="button-bad-day-survival"
                onClick={() => { setLevel(0); setShowBadDayModal(false); }}
                className="flex-1 bg-[#C9941A] text-black font-bold"
              >
                Set to Survival Mode
              </Button>
              <Button
                data-testid="button-bad-day-close"
                variant="ghost"
                onClick={() => setShowBadDayModal(false)}
                className="text-gray-500"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
