// Shared Sasquatch Recovery routine definitions.
// Used by both /recovery/routine (checklist mode) and /recovery/today (Bonfire mode).
// Tasks are CUMULATIVE: each level inherits everything from the levels below it.

import {
  Sun, Zap, BookOpen, Moon, Flame, Target, TrendingUp,
  Activity, Droplets, Brain, Users, Star, Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type RoutineTask = {
  id: string;
  text: string;
  icon?: LucideIcon;
};

export type RoutineBlock = {
  id: string;
  label: string;
  time: string;
  icon: LucideIcon;
  tasks: Record<number, RoutineTask[]>;
};

export type RoutineLevel = {
  id: number;
  code: "SURVIVAL" | "BED" | "SEATED" | "ASSISTED" | "FULL";
  name: string;
  description: string;
  color: string;
  accent: string;
  badgeClass: string;
  icon: LucideIcon;
  isAmbulatory: boolean; // can the survivor walk in this level?
};

export const LEVELS: RoutineLevel[] = [
  {
    id: 0,
    code: "SURVIVAL",
    name: "Survival Mode",
    description: "Your worst day. One thing is enough. Never Zero counts.",
    color: "#666",
    accent: "border-[#555]",
    badgeClass: "bg-[#333] text-gray-300",
    icon: Flame,
    isAmbulatory: false,
  },
  {
    id: 1,
    code: "BED",
    name: "Bed-Based",
    description: "Low energy, high resistance. Horizontal reps still count.",
    color: "#7a6535",
    accent: "border-[#7a6535]",
    badgeClass: "bg-[#7a6535]/20 text-[#a8892f]",
    icon: Moon,
    isAmbulatory: false,
  },
  {
    id: 2,
    code: "SEATED",
    name: "Seated",
    description: "Chair is your gym. Speech is your barbell.",
    color: "#956b0f",
    accent: "border-[#956b0f]",
    badgeClass: "bg-[#956b0f]/20 text-[#C9941A]",
    icon: Target,
    isAmbulatory: false,
  },
  {
    id: 3,
    code: "ASSISTED",
    name: "Assisted Standing",
    description: "On your feet — whatever it takes to get there.",
    color: "#b07c12",
    accent: "border-[#b07c12]",
    badgeClass: "bg-[#b07c12]/20 text-[#d4a020]",
    icon: TrendingUp,
    isAmbulatory: true,
  },
  {
    id: 4,
    code: "FULL",
    name: "Full Power",
    description: "All systems operational. Go get it.",
    color: "#C9941A",
    accent: "border-[#C9941A]",
    badgeClass: "bg-[#C9941A]/20 text-[#C9941A]",
    icon: Zap,
    isAmbulatory: true,
  },
];

export const BLOCKS: RoutineBlock[] = [
  {
    id: "morning",
    label: "Morning",
    time: "6–9 AM",
    icon: Sun,
    tasks: {
      0: [
        { id: "m0_breath", text: "Three deep breaths — 4 count in, hold 4, out 4", icon: Activity },
        { id: "m0_water", text: "Drink a full glass of water", icon: Droplets },
        { id: "m0_gratitude", text: "Say one thing you're grateful for — aloud", icon: Star },
      ],
      1: [
        { id: "m1_meds", text: "Take your medications (if applicable)" },
        { id: "m1_handstretch", text: "Gentle hand/finger stretches — 10 reps each hand" },
        { id: "m1_wrist", text: "Wrist circles — 10 each direction" },
      ],
      2: [
        { id: "m2_teeth", text: "Brush teeth (adaptive grip if needed)" },
        { id: "m2_face", text: "Wash face and groom" },
        { id: "m2_dress", text: "Dress yourself — however long it takes" },
      ],
      3: [
        { id: "m3_shower", text: "Shower with adaptations" },
        { id: "m3_balance", text: "Stand at counter or wall for 30 seconds — balance check" },
      ],
      4: [
        { id: "m4_stretch", text: "10-minute morning stretch routine" },
        { id: "m4_intention", text: "Set your Full Power intention for the day — write it down" },
      ],
    },
  },
  {
    id: "midday",
    label: "Midday Movement",
    time: "12–2 PM",
    icon: Zap,
    tasks: {
      0: [
        { id: "d0_water", text: "Drink another full glass of water", icon: Droplets },
        { id: "d0_check", text: "Check in: rate your mood, pain, and energy 1–10" },
      ],
      1: [
        { id: "d1_ankles", text: "Ankle pumps — 20 reps" },
        { id: "d1_shoulders", text: "Shoulder rolls — 10 forward, 10 back" },
        { id: "d1_legs", text: "Assisted leg lifts or any bed exercises you can manage" },
      ],
      2: [
        { id: "d2_marches", text: "Seated marches — 20 reps each leg" },
        { id: "d2_pushups", text: "Chair push-ups — 10 reps" },
        { id: "d2_rotation", text: "Seated trunk rotation — 10 each side" },
        { id: "d2_speech", text: "5-minute speech drill: read anything aloud, slowly", icon: Brain },
        { id: "d2_creed", text: "Say the S.A.S.C.H. creed once" },
      ],
      3: [
        { id: "d3_walk", text: "Assisted walk — however far you safely can go" },
        { id: "d3_balance", text: "Standing balance holds — 5 reps, hold as long as safe" },
        { id: "d3_resistance", text: "Resistance band work (only if cleared by your therapist)" },
      ],
      4: [
        { id: "d4_workout", text: "Full workout session or outdoor walk", icon: TrendingUp },
        { id: "d4_cognitive", text: "Cognitive challenge: Brain Gym, crossword, or memory match", icon: Brain },
        { id: "d4_hydration", text: "Hydration check: 64+ oz of water today", icon: Droplets },
      ],
    },
  },
  {
    id: "evening",
    label: "Evening Reflection",
    time: "6–8 PM",
    icon: BookOpen,
    tasks: {
      0: [
        { id: "e0_win", text: "Name ONE win from today — say it aloud. It counts.", icon: Trophy },
        { id: "e0_neverZero", text: "Confirm Never Zero: you showed up today." },
      ],
      1: [
        { id: "e1_fail", text: "Name 1 thing you'd approach differently — no self-judgment" },
        { id: "e1_connect", text: "Text or call one person" },
      ],
      2: [
        { id: "e2_journal", text: "Write in your journal — even one sentence counts" },
        { id: "e2_community", text: "Post something in the Survivor Community", icon: Users },
        { id: "e2_3wins", text: "Name 3 wins — big or small, all count equally" },
      ],
      3: [
        { id: "e3_deepJournal", text: "Full journal entry: progress, feelings, what's next" },
        { id: "e3_tomorrow", text: "Set tomorrow's routine level — choose your intensity" },
      ],
      4: [
        { id: "e4_video", text: "Record a 60-second update video — for yourself or TikTok" },
        { id: "e4_mentor", text: "Encourage someone newer in the community than you", icon: Users },
        { id: "e4_weekly", text: "Review this week's progress vs last week" },
      ],
    },
  },
  {
    id: "winddown",
    label: "Wind-Down",
    time: "9–10 PM",
    icon: Moon,
    tasks: {
      0: [
        { id: "w0_proud", text: "Think of one thing you're proud of from today" },
        { id: "w0_sleep", text: "Sleep at the same time as yesterday — consistency is neuroplasticity" },
      ],
      1: [
        { id: "w1_screen", text: "No screens 30 minutes before sleep — or blue light filter on" },
      ],
      2: [
        { id: "w2_dim", text: "Dim lights 30–45 minutes before sleep" },
        { id: "w2_breathe", text: "Three slow breaths before your head hits the pillow" },
      ],
      3: [
        { id: "w3_tomorrow", text: "Look at tomorrow's routine — know what's coming" },
      ],
      4: [
        { id: "w4_flicker", text: "Note any new movement or sensation that wasn't there last week", icon: Brain },
      ],
    },
  },
];

// Build cumulative task list for a given level.
export function getTasksForLevel(
  blockTasks: Record<number, RoutineTask[]>,
  level: number
): (RoutineTask & { addedAt: number })[] {
  const all: (RoutineTask & { addedAt: number })[] = [];
  for (let l = 0; l <= level; l++) {
    (blockTasks[l] || []).forEach((t) => all.push({ ...t, addedAt: l }));
  }
  return all;
}

// Flatten all blocks into a single sequential list for Bonfire walkthrough.
export type SequentialTask = RoutineTask & {
  blockId: string;
  blockLabel: string;
  blockIcon: LucideIcon;
  blockTime: string;
  addedAt: number;
  priority?: "goal" | "normal";
  goalReason?: string;
};

export function getSequentialTasks(level: number): SequentialTask[] {
  const out: SequentialTask[] = [];
  for (const block of BLOCKS) {
    const tasks = getTasksForLevel(block.tasks, level);
    for (const t of tasks) {
      out.push({
        ...t,
        blockId: block.id,
        blockLabel: block.label,
        blockIcon: block.icon,
        blockTime: block.time,
      });
    }
  }
  return out;
}

// ─── Intake-driven personalization ──────────────────────────────────────────
// The server's /api/recovery/today/recommendation returns the user's intake
// signals on `personalization`. The client uses them to:
//   1. Reorder blocks so the user's peak-energy block runs first.
//   2. Trim the sequence to fit their daily time budget (estimate 1.5 min/task).
//   3. Tag goal-aligned tasks with a "your goal" priority badge.
// Pure function — fully covered by tests/personalizeSequence.test.ts.

// Shared shape returned by GET /api/recovery/today/recommendation. Imported
// by both RecoveryToday (the session view) and RecoveryDashboard (the preview
// chip block) so the two surfaces never drift apart.
export type TodayRecommendation = {
  level: number;
  reason: string;
  basis: "yesterday_too_hard" | "yesterday_good" | "first_session" | "steady";
  ambulatoryToday: boolean;
  personalization?: {
    applied: boolean;
    startLevel?: number | null;
    startReason?: string | null;
    capLevel?: number | null;
    capReason?: string | null;
    timeBudgetMinutes?: number | null;
    energyPattern?: string | null;
    goals?: string[] | null;
    equipment?: string[] | null;
    mobilityAids?: string[] | null;
  };
};

export type PersonalizationInput = {
  applied: boolean;
  timeBudgetMinutes?: number | null;
  energyPattern?: string | null; // "morning" | "afternoon" | "evening" | "variable"
  goals?: string[] | null;
};

const TASK_MINUTES = 1.5;

// Map block ids to the energy pattern that peaks in that block.
const ENERGY_TO_BLOCK_ORDER: Record<string, string[]> = {
  morning: ["morning", "midday", "evening", "winddown"],
  afternoon: ["midday", "morning", "evening", "winddown"],
  evening: ["evening", "midday", "morning", "winddown"],
  variable: ["morning", "midday", "evening", "winddown"],
};

// Lightweight goal-keyword index. Each goal substring (case-insensitive) maps
// to the task ids it amplifies. Keep small and explicit — no fuzzy matching.
const GOAL_KEYWORDS: { match: string; taskIds: string[]; reason: string }[] = [
  { match: "speech",     taskIds: ["d2_speech", "d2_creed"],                          reason: "Speech goal" },
  { match: "talk",       taskIds: ["d2_speech", "d2_creed"],                          reason: "Speech goal" },
  { match: "language",   taskIds: ["d2_speech"],                                      reason: "Language goal" },
  { match: "walk",       taskIds: ["d3_walk", "d3_balance", "d4_workout"],            reason: "Walking goal" },
  { match: "balance",    taskIds: ["d3_balance", "m3_balance"],                       reason: "Balance goal" },
  { match: "hand",       taskIds: ["m1_handstretch", "m1_wrist"],                     reason: "Hand goal" },
  { match: "arm",        taskIds: ["m1_handstretch", "m1_wrist", "d2_pushups"],       reason: "Arm goal" },
  { match: "memory",     taskIds: ["d4_cognitive", "d2_speech"],                      reason: "Memory goal" },
  { match: "cognitive",  taskIds: ["d4_cognitive"],                                   reason: "Cognitive goal" },
  { match: "brain",      taskIds: ["d4_cognitive"],                                   reason: "Brain goal" },
  { match: "energy",     taskIds: ["m0_breath", "d0_check"],                          reason: "Energy goal" },
  { match: "fatigue",    taskIds: ["m0_breath", "d0_check", "w2_breathe"],            reason: "Fatigue goal" },
  { match: "mood",       taskIds: ["m0_gratitude", "e2_3wins", "e0_win"],             reason: "Mood goal" },
  { match: "community",  taskIds: ["e2_community", "e1_connect", "e4_mentor"],        reason: "Community goal" },
  { match: "journal",    taskIds: ["e2_journal", "e3_deepJournal"],                   reason: "Journaling goal" },
  { match: "sleep",      taskIds: ["w0_sleep", "w2_dim", "w2_breathe"],               reason: "Sleep goal" },
];

export function personalizeSequence(
  level: number,
  input: PersonalizationInput | null | undefined
): SequentialTask[] {
  // Build per-block lists once so we can reorder cheaply.
  const byBlock = new Map<string, SequentialTask[]>();
  for (const block of BLOCKS) {
    const tasks = getTasksForLevel(block.tasks, level).map((t) => ({
      ...t,
      blockId: block.id,
      blockLabel: block.label,
      blockIcon: block.icon,
      blockTime: block.time,
      priority: "normal" as const,
    }));
    byBlock.set(block.id, tasks);
  }

  // 1. Block order driven by energy pattern.
  const order = ENERGY_TO_BLOCK_ORDER[input?.energyPattern ?? "morning"]
    ?? ENERGY_TO_BLOCK_ORDER.morning;
  let seq: SequentialTask[] = [];
  for (const blockId of order) {
    const tasks = byBlock.get(blockId);
    if (tasks) seq.push(...tasks);
  }

  // 2. Goal tagging — flip priority to "goal" + attach reason.
  const goals = (input?.goals ?? []).map((g) => g.toLowerCase());
  if (goals.length > 0) {
    seq = seq.map((task) => {
      for (const { match, taskIds, reason } of GOAL_KEYWORDS) {
        if (taskIds.includes(task.id) && goals.some((g) => g.includes(match))) {
          return { ...task, priority: "goal", goalReason: reason };
        }
      }
      return task;
    });
  }

  // 3. Time budget trim. Always keep every "goal" task — survivors should
  //    always see what they came for. NOTE: this means a survivor with many
  //    goal-tagged tasks may exceed their stated time budget. That is
  //    intentional: missing a survivor's stated goals to enforce a soft
  //    minute target is worse than a slightly longer session.
  const budget = input?.timeBudgetMinutes ?? 0;
  if (budget > 0) {
    const maxTasks = Math.max(1, Math.floor(budget / TASK_MINUTES));
    if (seq.length > maxTasks) {
      const goalTasks = seq.filter((t) => t.priority === "goal");
      const nonGoal = seq.filter((t) => t.priority !== "goal");
      const keepNonGoal = Math.max(0, maxTasks - goalTasks.length);
      seq = [...goalTasks, ...nonGoal.slice(0, keepNonGoal)];
      // Restore the original block order after slicing so the walkthrough
      // still flows energy → wind-down rather than goals-then-everything-else.
      const indexInOrder = (id: string) => order.indexOf(id);
      seq.sort((a, b) => indexInOrder(a.blockId) - indexInOrder(b.blockId));
    }
  }

  return seq;
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
