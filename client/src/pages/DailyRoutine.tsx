import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [navigationWarning, setNavigationWarning] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const pendingPayloadRef = useRef<{ level: number; completedTasks: string[]; notes: string } | null>(null);
  const latestPayloadRef = useRef<{ level: number; completedTasks: string[]; notes: string } | null>(null);
  const saveRevisionRef = useRef(0);
  const lastSavedRevisionRef = useRef(0);
  const hydratedRef = useRef(false);

  // Load today's saved routine
  const { data: todayData, isFetched: todayDataFetched } = useQuery<{
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
    if (todayDataFetched) hydratedRef.current = true;
  }, [todayData, todayDataFetched]);

  const flushRoutineSave = async () => {
    if (saveInFlightRef.current || !pendingPayloadRef.current) return;
    const payload = pendingPayloadRef.current;
    pendingPayloadRef.current = null;
    const revision = saveRevisionRef.current;
    saveInFlightRef.current = true;
    setSaveStatus("saving");
    setSaved(false);
    let failed = false;

    try {
      await apiRequest("PUT", "/api/recovery/routine/today", payload);
      if (revision === saveRevisionRef.current && !pendingPayloadRef.current) {
        lastSavedRevisionRef.current = revision;
        setSaveStatus("saved");
        setSaved(true);
        setSaveError(null);
        setNavigationWarning(null);
        window.setTimeout(() => {
          if (revision === saveRevisionRef.current) setSaved(false);
        }, 2000);
      }
    } catch (error: unknown) {
      failed = true;
      if (revision === saveRevisionRef.current && !pendingPayloadRef.current) {
        pendingPayloadRef.current = payload;
        setSaveStatus("error");
        setSaved(false);
        setSaveError(error instanceof Error ? error.message : "Your routine could not be saved. Please try again.");
      }
    } finally {
      saveInFlightRef.current = false;
      if (pendingPayloadRef.current && (!failed || revision !== saveRevisionRef.current)) {
        void flushRoutineSave();
      }
    }
  };

  const queueRoutineSave = (payload: { level: number; completedTasks: string[]; notes: string }) => {
    saveRevisionRef.current += 1;
    const waitingForRetry = !!saveError;
    latestPayloadRef.current = payload;
    pendingPayloadRef.current = payload;
    setSaveStatus("saving");
    setSaved(false);
    if (!saveError) setSaveError(null);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    if (waitingForRetry) return;
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void flushRoutineSave();
    }, 800);
  };

  const retryRoutineSave = () => {
    const payload = latestPayloadRef.current;
    if (!payload) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingPayloadRef.current = payload;
    setSaveStatus("saving");
    setSaveError(null);
    void flushRoutineSave();
  };

  // Auto-save whenever anything changes (debounced)
  useEffect(() => {
    if (!user || !hydratedRef.current) return;
    queueRoutineSave({ level, completedTasks: Array.from(completed), notes });
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [level, completed, notes, user]);

  const hasUnsavedChanges = saveRevisionRef.current > lastSavedRevisionRef.current
    || saveStatus === "saving"
    || saveStatus === "error";

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const warnBeforeNavigation = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor || !anchor.href.startsWith(window.location.origin)) return;
      event.preventDefault();
      event.stopPropagation();
      setNavigationWarning("Your routine changes are not saved yet. Retry the save before leaving this page.");
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", warnBeforeNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", warnBeforeNavigation, true);
    };
  }, [hasUnsavedChanges]);

  const guardedNavigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasUnsavedChanges) {
      event.preventDefault();
      setNavigationWarning("Your routine changes are not saved yet. Retry the save before leaving this page.");
    }
  };

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
          <HeartPulse className="h-10 w-10 text-[#E2741B] mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-2">Sign In to Track Your Routine</h2>
          <p className="text-gray-500 text-sm mb-6">Your progress saves automatically every day.</p>
          <Button size="lg" onClick={() => setLocation("/recovery/login")} className="w-full bg-[#E2741B] text-black font-bold" data-testid="button-sign-in-routine">
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
            <p className="text-gray-500 text-sm mt-1">Educational routine support — pause when needed and check changes with your care team.</p>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="text-center">
                <p className="text-2xl font-black text-[#E2741B]">{streak}</p>
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
            style={{ width: `${pct}%`, backgroundColor: "#E2741B" }}
          />
        </div>

        {/* Level selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Today's Intensity Level</h2>
            <button
              data-testid="button-bad-day"
              onClick={() => setShowBadDayModal(true)}
              className="text-xs text-gray-600 hover:text-[#E2741B] transition-colors flex items-center gap-1"
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
                  aria-pressed={active}
                  aria-label={`Intensity level ${l.name}`}
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
                  aria-expanded={isOpen}
                  aria-controls={`routine-block-${block.id}`}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <BlockIcon className="h-4 w-4 text-[#E2741B] shrink-0" />
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
                            backgroundColor: blockPct === 100 ? "#22c55e" : "#E2741B",
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
                  <div id={`routine-block-${block.id}`} className="px-4 pb-4 space-y-2">
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
                          aria-pressed={done}
                          aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${task.text}`}
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
                              <span className="ml-2 text-[10px] font-bold uppercase text-[#E2741B] opacity-70">
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
          <label htmlFor="routine-notes" className="block text-xs text-gray-600 uppercase tracking-widest mb-2">Notes for today (optional)</label>
          <Textarea
            id="routine-notes"
            data-testid="input-routine-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How did today go? Anything new? Any flickers of movement?"
            className="bg-[#0f0f0f] border-[#1e1e1e] text-gray-300 placeholder:text-gray-700 resize-none focus:border-[#E2741B]/40 min-h-[80px]"
          />
        </div>

        {/* Save status */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {saveError ? (
              <span role="alert" data-testid="routine-save-error" className="flex items-center gap-2 text-red-400 text-xs">
                <span>Your routine was not saved. {saveError}</span>
                <Button type="button" size="sm" variant="outline" onClick={retryRoutineSave} data-testid="button-retry-routine-save">
                  Retry save
                </Button>
              </span>
            ) : saveStatus === "saving" ? (
              <span role="status" className="text-gray-400 text-xs">Saving…</span>
            ) : saved ? (
              <span className="text-green-500 text-xs flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Saved
              </span>
            ) : (
              <span className="text-gray-700 text-xs">Auto-saves as you check off</span>
            )}
          </div>
          {pct === 100 && (
            <Badge className="bg-[#E2741B]/20 text-[#E2741B] border border-[#E2741B]/30">
              <Trophy className="h-3 w-3 mr-1" /> Day Complete
            </Badge>
          )}
        </div>
        {navigationWarning && (
          <div role="alert" data-testid="routine-navigation-warning" className="mb-6 rounded-md border border-[#E2741B]/50 bg-[#E2741B]/10 px-3 py-2 text-sm text-[#F2B37A]">
            {navigationWarning}
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-10">
            <a
            href="/recovery/exercises"
              onClick={guardedNavigate}
            data-testid="link-exercises"
            className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#333] transition-colors"
          >
            <Activity className="h-4 w-4 text-[#E2741B] shrink-0" />
            <span className="text-sm text-gray-400">Exercise Library</span>
            <ArrowRight className="h-3 w-3 text-gray-700 ml-auto shrink-0" />
          </a>
          <a
            href="/recovery/brain-gym"
            onClick={guardedNavigate}
            data-testid="link-braingym"
            className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#333] transition-colors"
          >
            <Brain className="h-4 w-4 text-[#E2741B] shrink-0" />
            <span className="text-sm text-gray-400">Brain Gym</span>
            <ArrowRight className="h-3 w-3 text-gray-700 ml-auto shrink-0" />
          </a>
          <a
            href="/recovery/community"
            onClick={guardedNavigate}
            data-testid="link-community"
            className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#333] transition-colors"
          >
            <Users className="h-4 w-4 text-[#E2741B] shrink-0" />
            <span className="text-sm text-gray-400">Survivor Community</span>
            <ArrowRight className="h-3 w-3 text-gray-700 ml-auto shrink-0" />
          </a>
          <a
            href="/recovery/journal"
            onClick={guardedNavigate}
            data-testid="link-journal"
            className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#333] transition-colors"
          >
            <BookOpen className="h-4 w-4 text-[#E2741B] shrink-0" />
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
            <AlertTriangle className="h-8 w-8 text-[#E2741B] mb-4" />
            <h2 className="text-white font-black text-xl mb-2">Bad Day Protocol</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Nick built this for himself. Some days he could barely lift his arm. Those days count the same.
            </p>
            <p className="text-gray-300 text-sm font-semibold mb-1">Never Zero means this:</p>
            <ul className="text-sm text-gray-400 space-y-1 mb-6 list-none">
              <li className="flex items-start gap-2"><span className="text-[#E2741B] shrink-0 mt-0.5">→</span> Three breaths. That's one rep. It counts.</li>
              <li className="flex items-start gap-2"><span className="text-[#E2741B] shrink-0 mt-0.5">→</span> One glass of water. That's recovery.</li>
              <li className="flex items-start gap-2"><span className="text-[#E2741B] shrink-0 mt-0.5">→</span> One thing you're grateful for. That's a win.</li>
            </ul>
            <p className="text-xs text-gray-500 mb-6 italic">
              A hard day is a reason to pause, use a saved routine, or contact your care team — not a reason to push through.
            </p>
            <div className="flex gap-3">
              <Button
                data-testid="button-bad-day-survival"
                onClick={() => { setLevel(0); setShowBadDayModal(false); }}
                className="flex-1 bg-[#E2741B] text-black font-bold"
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
