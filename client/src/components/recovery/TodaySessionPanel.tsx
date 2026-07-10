import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dumbbell, Footprints, Target, Activity, MessageCircle,
  PenLine, Heart, TrendingUp, Play, Pause, RotateCcw,
  Check, ChevronRight, Timer, Flame, Bell, BellOff, Trash2,
  Pill, Droplets, Moon, Brain, PhoneCall,
} from "lucide-react";

// ── Exercise definitions with suggested durations (seconds)
const EXERCISES = [
  { id: "arm",        label: "Arm exercises",   icon: Dumbbell,       duration: 180, color: "#C06B3E" },
  { id: "leg",        label: "Leg exercises",   icon: Footprints,     duration: 180, color: "#7C6A5A" },
  { id: "balance",    label: "Balance",          icon: Target,         duration: 120, color: "#9B7E6A" },
  { id: "walking",    label: "Walking",          icon: Activity,       duration: 600, color: "#C06B3E" },
  { id: "speech",     label: "Speech practice", icon: MessageCircle,  duration: 300, color: "#7C6A5A" },
  { id: "fine_motor", label: "Fine motor",      icon: PenLine,        duration: 300, color: "#9B7E6A" },
  { id: "stretching", label: "Stretching",      icon: Heart,          duration: 300, color: "#C06B3E" },
  { id: "cardio",     label: "Cardio",           icon: TrendingUp,     duration: 300, color: "#7C6A5A" },
];

const HABITS = [
  { id: "meds",      label: "Meds",     icon: Pill },
  { id: "water",     label: "Water",    icon: Droplets },
  { id: "sleep",     label: "Sleep 7h", icon: Moon },
  { id: "meditated", label: "Meditate", icon: Brain },
  { id: "squad",     label: "Squad",    icon: PhoneCall },
];

// ── SVG progress ring
function Ring({ pct, size = 80, stroke = 7, color = "#C06B3E", label, sub }: {
  pct: number; size?: number; stroke?: number; color?: string; label: string; sub?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 1);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F5F0EB" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span className="text-[11px] font-black text-[#1C1917] -mt-1" style={{ marginTop: `-${size * 0.52}px`, position: "relative", zIndex: 1 }}>
        {label}
      </span>
      {sub && <span className="text-[9px] uppercase tracking-wider text-[#A8A29E]">{sub}</span>}
    </div>
  );
}

function RingWithLabel({ pct, size = 80, stroke = 7, color = "#C06B3E", centerLabel, sub }: {
  pct: number; size?: number; stroke?: number; color?: string; centerLabel: string; sub?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 1);
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F5F0EB" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black text-[#1C1917]">{centerLabel}</span>
        </div>
      </div>
      {sub && <span className="text-[9px] uppercase tracking-wider text-[#A8A29E] mt-1">{sub}</span>}
    </div>
  );
}

// ── Format seconds to mm:ss
function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ── Weekly bar chart (7 days)
function WeeklyBars({ data }: { data: { day: string; done: boolean }[] }) {
  return (
    <div className="flex items-end gap-1.5 h-10">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-sm transition-all"
            style={{
              height: d.done ? 32 : 8,
              background: d.done ? "#C06B3E" : "#F5F0EB",
            }}
          />
          <span className="text-[9px] text-[#A8A29E]">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

export default function TodaySessionPanel() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // ── Exercise state
  const [done, setDone] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"countdown" | "stopwatch">("countdown");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Habit state
  const [habits, setHabits] = useState<string[]>([]);

  // ── Reminder state
  const [reminderTime, setReminderTime] = useState("08:00");
  const [reminderSaving, setReminderSaving] = useState(false);

  // ── Queries
  const { data: todayCheckin } = useQuery<any>({
    queryKey: ["/api/recovery/checkin/today"],
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  const { data: remindersData } = useQuery<any[]>({
    queryKey: ["/api/reminders"],
    enabled: isAuthenticated,
    staleTime: 10 * 60_000,
  });

  const { data: dashboard } = useQuery<any>({
    queryKey: ["/api/recovery/dashboard"],
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  const { data: weeklyActivity } = useQuery<{ days: { date: string; label: string; hasSession: boolean; exercisesDone: number; moodScore: number | null }[] }>({
    queryKey: ["/api/recovery/weekly-activity"],
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  // Hydrate from today's checkin
  useEffect(() => {
    if (todayCheckin?.exercisesLogged) {
      const logged: string[] = todayCheckin.exercisesLogged.map((e: any) => e.name ?? e.id ?? e);
      setDone((prev) => {
        const merged = [...new Set([...prev, ...logged])];
        return merged;
      });
    }
    if (todayCheckin?.habitsCompleted) {
      setHabits(todayCheckin.habitsCompleted);
    }
  }, [todayCheckin]);

  // ── Timer logic
  const activeEx = EXERCISES.find((e) => e.id === active);
  const targetDuration = activeEx?.duration ?? 0;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((s) => {
          if (mode === "countdown" && s >= targetDuration) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            // Auto-complete
            if (active) handleComplete(active);
            return targetDuration;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, targetDuration, active]);

  const handleSelect = (id: string) => {
    if (done.includes(id)) return;
    if (running) {
      setRunning(false);
    }
    setActive(id);
    setElapsed(0);
    setRunning(false);
  };

  const handleComplete = (id: string) => {
    setDone((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActive(null);
    setElapsed(0);
    setRunning(false);
  };

  const logMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/recovery/checkin", {
        exercisesLogged: done.map((id) => ({ name: id })),
        habitsCompleted: habits,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/checkin/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/dashboard"] });
      toast({ title: "Session logged", description: "Sasquatch sees you." });
    },
  });

  const saveReminder = async () => {
    if (!reminderTime) return;
    setReminderSaving(true);
    try {
      await apiRequest("POST", "/api/reminders", {
        type: "daily_exercise",
        time: reminderTime,
        channel: "email",
        message: "Time to move. Your recovery doesn't take days off.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({ title: "Reminder set", description: `Daily nudge at ${reminderTime}` });
    } catch {
      toast({ title: "Error", description: "Could not save reminder", variant: "destructive" });
    } finally {
      setReminderSaving(false);
    }
  };

  const deleteReminder = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/reminders/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    } catch {
      toast({ title: "Error", description: "Could not delete reminder", variant: "destructive" });
    }
  };

  // ── Derived stats
  const streak = dashboard?.streak?.currentStreak ?? 0;
  const completionPct = done.length / EXERCISES.length;
  const weeklyTarget = 5;

  // Weekly bars — real per-day data from API, fallback to empty skeleton
  const weekBars = weeklyActivity?.days
    ? weeklyActivity.days.map((d) => ({ day: d.label, done: d.hasSession, exercisesDone: d.exercisesDone }))
    : Array.from({ length: 7 }, (_, i) => ({ day: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i], done: false, exercisesDone: 0 }));
  const weeklyDone = weekBars.filter((d) => d.done).length;

  const displayElapsed = mode === "countdown" ? Math.max(0, targetDuration - elapsed) : elapsed;
  const timerPct = mode === "countdown"
    ? 1 - elapsed / (targetDuration || 1)
    : Math.min(elapsed / (targetDuration || 300), 1);

  if (!isAuthenticated) return null;

  return (
    <div className="mb-8 space-y-4">

      {/* ── ROW 1: Three rings + weekly bars ── */}
      <div className="rounded-2xl border border-[#E2C2A4]/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Rings */}
          <div className="flex items-center gap-6">
            <RingWithLabel
              pct={completionPct}
              size={76}
              stroke={7}
              color="#C06B3E"
              centerLabel={`${done.length}/${EXERCISES.length}`}
              sub="Today"
            />
            <RingWithLabel
              pct={Math.min(streak / 30, 1)}
              size={76}
              stroke={7}
              color="#9B7E6A"
              centerLabel={`${streak}`}
              sub="Streak"
            />
            <RingWithLabel
              pct={Math.min(weeklyDone / weeklyTarget, 1)}
              size={76}
              stroke={7}
              color="#7C6A5A"
              centerLabel={`${weeklyDone}/${weeklyTarget}`}
              sub="This week"
            />
          </div>

          {/* Weekly bars */}
          <div className="flex-1 min-w-[140px]">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#A8A29E] mb-2">7-day activity</p>
            <WeeklyBars data={weekBars} />
          </div>

          {/* Log session CTA */}
          {done.length > 0 && (
            <Button
              size="sm"
              onClick={() => logMutation.mutate()}
              disabled={logMutation.isPending}
              className="bg-[#C06B3E] text-black font-bold text-xs self-center"
              data-testid="button-log-session"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Save session
            </Button>
          )}
        </div>
      </div>

      {/* ── ROW 2: Exercise queue + inline timer ── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Exercise queue */}
        <div className="rounded-2xl border border-[#E2C2A4]/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#C06B3E] font-bold">Today's exercises</p>
            <span className="text-[10px] text-[#A8A29E]">{done.length} of {EXERCISES.length}</span>
          </div>
          <div className="space-y-2">
            {EXERCISES.map((ex) => {
              const isDone = done.includes(ex.id);
              const isActive = active === ex.id;
              const Icon = ex.icon;
              return (
                <button
                  key={ex.id}
                  data-testid={`exercise-row-${ex.id}`}
                  onClick={() => isDone ? null : handleSelect(ex.id)}
                  disabled={isDone}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    isDone
                      ? "bg-[#C06B3E]/08 border-[#C06B3E]/20 opacity-70"
                      : isActive
                      ? "bg-[#C06B3E]/10 border-[#C06B3E]/50"
                      : "bg-transparent border-[#E2C2A4]/30 hover:border-[#C06B3E]/40 hover-elevate"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isDone ? "bg-[#C06B3E]/20" : isActive ? "bg-[#C06B3E]" : "bg-[#F5F0EB]"
                  }`}>
                    {isDone
                      ? <Check className="h-3.5 w-3.5 text-[#C06B3E]" />
                      : <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-[#7C6A5A]"}`} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDone ? "line-through text-[#A8A29E]" : "text-[#1C1917]"}`}>
                      {ex.label}
                    </p>
                    <p className="text-[10px] text-[#A8A29E]">{fmt(ex.duration)} suggested</p>
                  </div>
                  {!isDone && !isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-[#C06B3E]/50 shrink-0" />
                  )}
                  {isActive && (
                    <Timer className="h-3.5 w-3.5 text-[#C06B3E] shrink-0 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inline timer + habits */}
        <div className="flex flex-col gap-4">

          {/* Timer */}
          <div className="rounded-2xl border border-[#E2C2A4]/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex-1">
            {active && activeEx ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#C06B3E] font-bold">Active</p>
                    <p className="text-base font-bold text-[#1C1917]">{activeEx.label}</p>
                  </div>
                  <button
                    onClick={() => setMode(m => m === "countdown" ? "stopwatch" : "countdown")}
                    className="text-[10px] uppercase tracking-widest text-[#A8A29E] hover:text-[#C06B3E] transition-colors"
                    data-testid="toggle-timer-mode"
                  >
                    {mode === "countdown" ? "Switch to stopwatch" : "Switch to countdown"}
                  </button>
                </div>

                {/* Big timer display */}
                <div className="flex flex-col items-center py-4">
                  <div
                    className="text-6xl font-black tracking-tight tabular-nums"
                    style={{ color: elapsed > 0 && !running ? "#C06B3E" : "#1C1917" }}
                    data-testid="timer-display"
                  >
                    {fmt(displayElapsed)}
                  </div>
                  {mode === "countdown" && (
                    <div className="w-full mt-4 h-2 rounded-full bg-[#F5F0EB] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C06B3E] transition-all"
                        style={{ width: `${(1 - elapsed / targetDuration) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex gap-2 mt-2">
                  <Button
                    className="flex-1 bg-[#C06B3E] text-black font-bold"
                    onClick={() => setRunning(!running)}
                    data-testid="button-timer-toggle"
                  >
                    {running ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => { setElapsed(0); setRunning(false); }}
                    className="border-[#E2C2A4]/40"
                    data-testid="button-timer-reset"
                  >
                    <RotateCcw className="h-4 w-4 text-[#7C6A5A]" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleComplete(active)}
                    className="border-[#C06B3E]/40 text-[#C06B3E] font-semibold"
                    data-testid="button-timer-done"
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F5F0EB] flex items-center justify-center">
                  <Timer className="h-5 w-5 text-[#C06B3E]" />
                </div>
                <p className="text-sm font-semibold text-[#1C1917]">Select an exercise to start the timer</p>
                <p className="text-xs text-[#A8A29E]">Tap any exercise on the left to activate</p>
              </div>
            )}
          </div>

          {/* Habits quick-toggles */}
          <div className="rounded-2xl border border-[#E2C2A4]/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#C06B3E] font-bold mb-3">Daily habits</p>
            <div className="flex flex-wrap gap-2">
              {HABITS.map((h) => {
                const on = habits.includes(h.id);
                const Icon = h.icon;
                return (
                  <button
                    key={h.id}
                    data-testid={`habit-toggle-${h.id}`}
                    onClick={() => setHabits((prev) =>
                      prev.includes(h.id) ? prev.filter((x) => x !== h.id) : [...prev, h.id]
                    )}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      on
                        ? "bg-[#C06B3E] text-black border-[#C06B3E]"
                        : "bg-transparent text-[#78716C] border-[#E2C2A4]/30 hover:border-[#C06B3E]/40"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {h.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Reminders ── */}
      <div className="rounded-2xl border border-[#E2C2A4]/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#C06B3E] font-bold">Daily reminders</p>
            <p className="text-xs text-[#A8A29E] mt-0.5">Email nudges via Resend</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              data-testid="input-reminder-time"
              className="border border-[#E2C2A4]/40 rounded-lg px-3 py-1.5 text-sm text-[#1C1917] bg-white focus:outline-none focus:border-[#C06B3E]/50"
            />
            <Button
              size="sm"
              onClick={saveReminder}
              disabled={reminderSaving}
              className="bg-[#C06B3E] text-black font-bold"
              data-testid="button-add-reminder"
            >
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Add reminder
            </Button>
          </div>
        </div>

        {/* Existing reminders */}
        {remindersData && remindersData.length > 0 ? (
          <div className="space-y-2">
            {remindersData.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F5F0EB]">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-[#C06B3E]" />
                  <span className="text-sm font-medium text-[#1C1917]">{r.time ?? r.scheduledFor ?? "Daily"}</span>
                  <span className="text-[10px] text-[#A8A29E] uppercase tracking-wide">{r.channel ?? "email"}</span>
                </div>
                <button
                  onClick={() => deleteReminder(r.id)}
                  data-testid={`delete-reminder-${r.id}`}
                  className="text-[#A8A29E] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F5F0EB]">
            <BellOff className="h-3.5 w-3.5 text-[#A8A29E]" />
            <span className="text-xs text-[#A8A29E]">No reminders set — add one above to stay accountable</span>
          </div>
        )}
      </div>

    </div>
  );
}
