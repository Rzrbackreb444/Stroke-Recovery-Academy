import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { 
  Flame, Trophy, BookOpen, MessageCircle, Grid3X3, ShoppingBag, Users, Sparkles,
  CheckCircle2, Target, Star, TrendingUp, Calendar, Heart, Zap, LogOut,
  Plus, UserPlus, DoorOpen, Smile, Activity, Quote, RefreshCw, ArrowRight,
  Play, Brain, ChevronDown, Footprints, Anchor, Sun, ClipboardList, Loader2,
  Check, Dumbbell, Pill, Droplets, Moon, PenLine, PhoneCall, ChevronRight,
  LayoutDashboard, Video, Music2, ExternalLink
} from "lucide-react";
import SixtyDayTracker from "@/components/recovery/SixtyDayTracker";
import TodaySessionPanel from "@/components/recovery/TodaySessionPanel";
import DeficitPrescriptionCard from "@/components/recovery/DeficitPrescriptionCard";
import RecoveryArcCard from "@/components/recovery/RecoveryArcCard";
import ProgressArcChart from "@/components/recovery/ProgressArcChart";
import PushOptInBanner from "@/components/PushOptInBanner";
import { RecommendationCards } from "@/components/RecommendationCard";
import { TodaysSpark } from "@/components/TodaysSpark";
import GoalsWidget from "@/components/GoalsWidget";
import MyPathRecommender from "@/components/recovery/MyPathRecommender";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import FadeUpSection from "@/components/FadeUpSection";
import SasquatchQuoteModal from "@/components/SasquatchQuoteModal";
import { LEVELS, type TodayRecommendation } from "@/lib/recoveryRoutine";

const MOOD_OPTIONS = [
  { value: 2, label: "Rough" },
  { value: 4, label: "Low" },
  { value: 6, label: "Okay" },
  { value: 8, label: "Good" },
  { value: 10, label: "Great" },
];
const ENERGY_OPTIONS = [
  { value: 2, label: "Empty" },
  { value: 4, label: "Low" },
  { value: 6, label: "Okay" },
  { value: 8, label: "Good" },
  { value: 10, label: "Charged" },
];
const PAIN_OPTIONS = [
  { value: 2, label: "None" },
  { value: 4, label: "Mild" },
  { value: 6, label: "Moderate" },
  { value: 8, label: "High" },
  { value: 10, label: "Severe" },
];

const motivationalQuotes = [
  "The impossible is only impossible until someone proves it's not.",
  "Every day you show up, you win. Every rep you complete, you rewire.",
  "I took what the stroke gave me and turned it into rocket fuel.",
  "You are not your diagnosis. You are your determination.",
  "0% to 90% wasn't luck. It was relentless action, every single day.",
  "When doctors said 'never,' I heard 'prove them wrong.'",
  "The comeback is always stronger than the setback.",
  "Your recovery is your superpower. Keep pushing.",
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function AdminSignupWidget() {
  const { data, isLoading } = useQuery<{
    total: number;
    today: number;
    week: number;
    recent: { id: string; email: string; name: string; subscriptionStatus: string | null; createdAt: string }[];
  }>({
    queryKey: ["/api/admin/stats/signups"],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !data) return null;

  return (
    <div className="mb-5 rounded-xl border border-[#C06B3E]/25 bg-[#C06B3E]/5 overflow-hidden" data-testid="admin-signup-widget">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover-elevate"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl font-display font-bold text-[#C06B3E]">{data.total}</span>
          <span className="text-sm font-medium text-[#2A2421]">survivors</span>
          <span className="h-4 w-px bg-[#E2C2A4]" />
          <span className="text-sm text-[#78716C]">+{data.today} today</span>
          <span className="text-sm text-[#78716C]">· +{data.week} this week</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className="text-sm bg-[#C06B3E]/15 text-[#C06B3E] border-[#C06B3E]/30 no-default-hover-elevate no-default-active-elevate">
            ADMIN
          </Badge>
          <ChevronDown className={`h-4 w-4 text-[#78716C] transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#E2C2A4]/40 divide-y divide-[#E2C2A4]/20">
          {data.recent.length === 0 ? (
            <p className="px-4 py-3 text-base text-[#78716C]">No signups yet.</p>
          ) : data.recent.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-7 h-7 rounded-full bg-[#C06B3E]/15 flex items-center justify-center text-[#C06B3E] text-xs font-bold shrink-0">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-[#2A2421] truncate">{u.name}</p>
                <p className="text-base text-[#78716C] truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.subscriptionStatus === "active" && (
                  <Badge className="text-sm bg-[#C06B3E] text-white border-none no-default-hover-elevate no-default-active-elevate">PRO</Badge>
                )}
                <span className="text-sm text-[#A8A29E]">{timeAgo(u.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecoveryDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: personaData } = useQuery<{ persona: { name: string; creed: string; archetypeKey: string; accentColor: string; triggerCue: string | null } | null }>({
    queryKey: ['/api/persona/me'],
  });
  const persona = personaData?.persona ?? null;
  const personaAccent = persona?.accentColor || "#C06B3E";
  const [checkinForm, setCheckinForm] = useState({
    moodScore: 6,
    energyScore: 6,
    painScore: 2,
    winsToday: "",
    challengesToday: "",
    gratitude: "",
    tomorrowsTarget: "",
  });
  const [showNotes, setShowNotes] = useState(false);
  const [checkinReward, setCheckinReward] = useState<{ quote: any; creditsEarned: number; streakBonusLabel?: string | null; streak?: number } | null>(null);
  const [createPodOpen, setCreatePodOpen] = useState(false);
  const [newPodName, setNewPodName] = useState("");
  const [newPodDescription, setNewPodDescription] = useState("");
  const [newPodFocus, setNewPodFocus] = useState("");
  // Zen Mode — neuro-fatigue accommodation. Hides everything except the single
  // "do this one thing next" focal card (NeverZeroAuditHero). Persists in
  // localStorage so the choice survives reloads. Default off so the full
  // dashboard stays the canonical experience for survivors who want it.
  const [zenMode, setZenMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("sra:zen-mode") === "1";
  });
  const toggleZenMode = () => {
    setZenMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sra:zen-mode", next ? "1" : "0");
      }
      return next;
    });
  };

  const { data: dashboard, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/recovery/dashboard"],
  });

  const { data: userPod } = useQuery<any>({
    queryKey: ["/api/user/pod"],
  });

  const { data: openPods } = useQuery<any[]>({
    queryKey: ["/api/pods"],
    enabled: !userPod,
  });

  const { data: podActivity } = useQuery<any[]>({
    queryKey: ["/api/pods", userPod?.id, "activity"],
    enabled: !!userPod?.id,
  });

  const { data: communityVideos } = useQuery<{ videos: any[]; hasMore: boolean }>({
    queryKey: ["/api/community/videos", 0],
    queryFn: () => fetch("/api/community/videos?page=0").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const checkinMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", "/api/recovery/checkin", data);
      return r.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      if (data?.quote) {
        setCheckinReward({
          quote: data.quote,
          creditsEarned: data.creditsEarned || 10,
          streakBonusLabel: data.streakBonusLabel,
          streak: data.streak?.current,
        });
      } else {
        toast({ title: "Check-in complete!", description: "Great job staying consistent!" });
      }
    },
    onError: (e: any) => {
      const msg = e?.message?.includes("Already checked in") ? "You already checked in today. Come back tomorrow." : "Could not save check-in";
      toast({ title: "Check-in", description: msg, variant: "destructive" });
    },
  });

  const habitLogMutation = useMutation({
    mutationFn: async (userHabitId: number) => {
      return apiRequest("POST", `/api/recovery/habits/${userHabitId}/log`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/dashboard"] });
    },
  });

  const createPodMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; focusArea: string }) => {
      return apiRequest("POST", "/api/pods", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/pod"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pods"] });
      setCreatePodOpen(false);
      setNewPodName("");
      setNewPodDescription("");
      setNewPodFocus("");
      toast({ title: "Pod created!", description: "You are now the leader of your pod." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not create pod", variant: "destructive" });
    },
  });

  const joinPodMutation = useMutation({
    mutationFn: async (podId: number) => {
      return apiRequest("POST", `/api/pods/${podId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/pod"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pods"] });
      toast({ title: "Joined pod!", description: "You're now part of an accountability pod." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Could not join pod", variant: "destructive" });
    },
  });

  const leavePodMutation = useMutation({
    mutationFn: async (podId: number) => {
      return apiRequest("POST", `/api/pods/${podId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/pod"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pods"] });
      toast({ title: "Left pod", description: "You've left the accountability pod." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not leave pod", variant: "destructive" });
    },
  });

  const handleCreatePod = () => {
    if (!newPodName.trim()) return;
    createPodMutation.mutate({
      name: newPodName,
      description: newPodDescription,
      focusArea: newPodFocus,
    });
  };

  const handleCheckinSubmit = () => {
    checkinMutation.mutate(checkinForm);
  };

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#C06B3E]/30 border-t-[#C06B3E] animate-spin" />
          <div className="text-[#C06B3E]/70 text-base font-medium">Loading your command center...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-[#2A2421] font-semibold mb-2">Couldn't load your dashboard</p>
          <p className="text-[#5C534D] text-base mb-5">Your session may have expired. Sign in again to continue.</p>
          <Button
            size="sm"
            className="bg-[#C06B3E] text-white"
            onClick={() => window.location.assign("/api/login")}
            data-testid="button-dashboard-signin"
          >
            Sign in again
          </Button>
        </div>
      </div>
    );
  }

  const streak = dashboard?.streak || { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  const enrollment = dashboard?.enrollment;
  const habits = dashboard?.habits || [];
  const milestones = dashboard?.milestones || [];
  const todayCheckin = dashboard?.todayCheckin;
  const recoveryScore = dashboard?.recoveryScore || 0;
  const totalPoints = dashboard?.totalPoints || 0;

  // ── Coherent daily journey loop ──────────────────────────────────────────
  // One honest thread through the day, morning to night: check in → move →
  // stay accountable → your squad → reflect. Completion is read from the same
  // dashboard payload the rest of the page uses, so it never drifts from the
  // detail cards below.
  const repsDoneToday = Array.isArray(habits) && habits.some((h: any) =>
    Array.isArray(h.logs) && h.logs.some((l: any) =>
      l?.isCompleted && new Date(l.logDate).toDateString() === new Date().toDateString()
    )
  );
  const inSquad = !!userPod;
  // Evening reflection is "done" once the survivor has logged today's win —
  // the reflective field of the daily check-in. Closes the loop for the day.
  const reflectedToday = !!(todayCheckin && (todayCheckin as any).winsToday);
  const journeySteps: Array<{
    key: string; label: string; desc: string; href: string;
    done?: boolean; Icon: any;
  }> = [
    { key: "checkin", label: "Check in", desc: "Mood & energy", href: "#mission-checkin", done: !!todayCheckin, Icon: Calendar },
    { key: "reps", label: "Daily reps", desc: "Move your body", href: "/recovery/today", done: repsDoneToday, Icon: Dumbbell },
    { key: "coach", label: "Talk to Coach", desc: "Stay accountable", href: "/recovery/sasquatch-coach", Icon: MessageCircle },
    { key: "squad", label: "Your squad", desc: inSquad ? "Check the fire" : "Join a squad", href: "/recovery/community", done: inSquad, Icon: Users },
    { key: "reflect", label: "Reflect", desc: reflectedToday ? "Win logged" : "Name today's win", href: "#mission-checkin", done: reflectedToday, Icon: Sparkles },
  ];
  const trackableSteps = journeySteps.filter((s) => s.done !== undefined);
  const loopDone = trackableSteps.filter((s) => s.done).length;
  const loopTotal = trackableSteps.length;

  return (
    <div className="min-h-screen flex bg-[#FDFBF7] text-[#1C1917]">

        {/* ── SIDEBAR ── dark refined, warm accent ── */}
        <aside className="hidden lg:flex w-[260px] flex-col bg-[#2A2421] border-r border-[#3E322C] fixed left-0 top-0 h-screen z-40 overflow-y-auto">
          <div className="p-6">
            <Link href="/recovery/dashboard" className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-full bg-[#C06B3E] flex items-center justify-center">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-[#FDFBF7] text-sm tracking-tight">SRA</span>
            </Link>

            <nav className="space-y-1">
              {[
                { href: "/recovery/dashboard", label: "Dashboard", icon: LayoutDashboard },
                { href: "/recovery/today", label: "Daily Reps", icon: Dumbbell },
                { href: "/recovery/sasquatch-coach", label: "Coach", icon: MessageCircle },
                { href: "/recovery/community", label: "Community", icon: Users },
                { href: "/recovery/my-story", label: "My Story", icon: BookOpen },
                { href: "/recovery/progress", label: "Progress", icon: TrendingUp },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#D8CFCD] hover:text-[#FDFBF7] hover:bg-[#3E322C] transition-colors text-sm"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-[#3E322C]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#C06B3E]/20 border border-[#C06B3E]/40 flex items-center justify-center text-xs font-bold text-[#E8B986] overflow-hidden">
                {(user as any)?.avatarUrl
                  ? <img src={(user as any).avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : ((user as any)?.displayName || user?.firstName || "Y")[0].toUpperCase()
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#FDFBF7] truncate">{(user as any)?.displayName || user?.firstName || "Warrior"}</p>
                <p className="text-sm text-[#D8CFCD]/60">{streak.currentStreak} day streak</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-[#D8CFCD] hover:text-[#FDFBF7] hover:bg-[#3E322C] text-sm"
              onClick={() => { window.location.href = "/api/logout"; }}
            >
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
            </Button>
          </div>
        </aside>
        <div className="lg:ml-[260px] flex-1 min-h-screen">
      <SEO
        title="Recovery Dashboard | Stroke Recovery Academy"
        description="Track your stroke recovery progress with comprehensive metrics, daily check-ins, habit tracking, and personalized recovery programs designed by medical professionals."
        canonical="/recovery/dashboard"
        keywords="stroke recovery tracking, recovery progress dashboard, rehabilitation progress, stroke survivor tools"
        author="Stroke Recovery Academy"
        type="website"
        expertise={["Stroke recovery protocols", "Neuroplasticity-based rehabilitation", "Medical oversight"]}
        experience="Supporting stroke survivors since 2024"
        trustSignals={["Evidence-based recovery programs", "Trusted by healthcare professionals", "Medical expert-reviewed content"]}
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Recovery Dashboard", url: "/recovery/dashboard" }]}
      />

      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <PushOptInBanner />
        {user?.role === 'admin' && <AdminSignupWidget />}
        {/* Zen Mode toggle — neuro-fatigue accommodation. When on, the dashboard
            collapses to a single focal card (the daily audit) so survivors who
            log in exhausted aren't drowned in a menu. */}
        <div className="flex justify-end mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleZenMode}
            className={`border-[#E2C2A4]/30 text-sm uppercase tracking-widest ${zenMode ? "bg-[#C06B3E]/10 text-[#C06B3E] border-[#C06B3E]/40" : "text-[#78716C]"}`}
            data-testid="button-zen-mode-toggle"
            aria-pressed={zenMode}
          >
            {zenMode ? "Zen Mode: ON — show full dashboard" : "Zen Mode — just the next rep"}
          </Button>
        </div>
        <TodaysSpark />

        {/* RECOVERY ARC — milestone card at 30/60/90/180/365 days. Renders only
            when within the ±4-day window of a milestone. Hidden in Zen Mode so
            the milestone doesn't compete with the single focal audit card. */}
        {!zenMode && <RecoveryArcCard />}

        {/* 90-DAY PROGRESS ARC — reps + mood trend over the last 90 days.
            Hidden in Zen Mode. Only renders once the user has logged data. */}
        {!zenMode && <ProgressArcChart />}

        {!zenMode && (<>
        {/* ── Today's loop ── coherent daily journey strip ── */}
        <section className="mb-6" data-testid="section-daily-loop">
          <div className="rounded-2xl bg-white border border-[#E2C2A4]/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div>
                <div className="text-sm uppercase tracking-[0.2em] text-[#78716C]">Today's loop</div>
                <div className="text-sm text-[#78716C]">
                  {loopDone >= loopTotal
                    ? "Loop closed. Heart's still thumpin'."
                    : "One thread through the day — check in, move, stay accountable."}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-2xl font-black text-[#C06B3E]" data-testid="text-loop-progress">{loopDone}</span>
                <span className="text-sm text-[#78716C]">/ {loopTotal} done</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {journeySteps.map((step) => {
                const done = step.done === true;
                const isHash = step.href.startsWith("#");
                const cls = `group flex items-start gap-3 rounded-xl border p-3 transition-colors hover-elevate ${
                  done
                    ? "bg-[#C06B3E]/10 border-[#C06B3E]/40"
                    : "bg-[#FDFBF7] border-[#E2C2A4]/40"
                }`;
                const inner = (
                  <>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      done ? "bg-[#C06B3E]/20 text-[#C06B3E]" : "bg-[#F5F0EB] text-[#A8A29E]"
                    }`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <step.Icon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#1C1917] truncate">{step.label}</div>
                      <div className="text-base text-[#78716C] truncate">
                        {done ? "Done" : step.desc}
                      </div>
                    </div>
                  </>
                );
                return isHash ? (
                  <a
                    key={step.key}
                    href={step.href}
                    data-testid={`step-loop-${step.key}`}
                    className={cls}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(step.href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    key={step.key}
                    href={step.href}
                    data-testid={`step-loop-${step.key}`}
                    className={cls}
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        <div className="mb-6">
          <RecommendationCards surface="dashboard" />
        </div>
        <FadeUpSection>
        <section className="mb-8">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <h1 className="text-4xl md:text-5xl font-display mb-3" data-testid="text-dashboard-title">
                Welcome back,{" "}
                <span style={{ color: personaAccent }}>
                  {persona?.name || (user as any)?.displayName || user?.firstName || "Warrior"}
                </span>
              </h1>
              {persona?.creed ? (
                <p className="text-[#78716C] text-lg italic" data-testid="text-persona-creed">"{persona.creed}"</p>
              ) : (
                <p className="text-[#78716C] text-lg italic" data-testid="text-quote">"{randomQuote}"</p>
              )}
              {persona?.triggerCue && (
                <p className="text-base text-[#78716C] mt-2" data-testid="text-persona-trigger">
                  <span className="uppercase tracking-wide" style={{ color: personaAccent }}>Trigger:</span> {persona.triggerCue}
                </p>
              )}
              <div className="mt-3">
                <Link href="/recovery/forge">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#E2C2A4]/30 hover:bg-white"
                    style={{ color: personaAccent, borderColor: `${personaAccent}66` }}
                    data-testid={persona ? "button-reforge-persona" : "button-forge-persona"}
                  >
                    {persona ? "Re-forge your beast" : "Forge Your Beast"}
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white border border-[#E2C2A4]/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-center">
                <div className="text-sm uppercase tracking-[0.2em] text-[#78716C] mb-1">Recovery Score</div>
                <div className="text-3xl font-black text-[#1C1917]" data-testid="text-recovery-score">{recoveryScore}</div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[#F5F0EB] overflow-hidden">
                  <div className="h-full rounded-full bg-[#C06B3E] transition-all" style={{ width: `${Math.min(recoveryScore, 100)}%` }} />
                </div>
              </div>
              <div className="rounded-2xl bg-white border border-[#E2C2A4]/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-center">
                <div className="text-sm uppercase tracking-[0.2em] text-[#78716C] mb-1">Day Streak</div>
                <div className="text-3xl font-black text-[#C06B3E]" data-testid="text-streak">{streak.currentStreak}</div>
                <p className="text-sm text-[#78716C] mt-1 uppercase tracking-wider">Never Zero</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-[#C06B3E]/8 border border-[#C06B3E]/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#C06B3E]/15 flex items-center justify-center">
                    <Flame className="h-4 w-4 text-[#C06B3E]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1C1917]">Keep the signal alive</p>
                    <p className="text-base text-[#78716C]">{totalPoints.toLocaleString()} total reps logged</p>
                  </div>
                </div>
                <Link href="/recovery/today" className="inline-flex min-h-[44px] items-center">
                  <span className="text-sm font-semibold text-[#C06B3E] uppercase tracking-widest">Log rep →</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SURVIVOR OS PLAN CTA */}
        <section className="mb-6">
          <Link
            href="/recovery/me"
            className="block rounded-2xl border border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover-elevate"
            data-testid="link-recovery-me"
          >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-md bg-[#C06B3E] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E]">Survivor OS</p>
                    <p className="text-base font-bold text-[#1C1917]">Open your personal recovery plan</p>
                    <p className="text-base text-[#78716C]">Sasquatch Scale, AI plan, today's prescription</p>
                  </div>
                </div>
                <span className="text-sm text-[#C06B3E] font-semibold uppercase tracking-widest">Open →</span>
              </div>
          </Link>
        </section>

        </FadeUpSection>
        </>)}
        {/* DEFICIT PRESCRIPTION — Personalized daily reps built from the survivor's
            deficit profile. Always rendered (including Zen Mode) so the "what do I
            do today?" answer is never more than one scroll away. Shows an intake CTA
            if the profile hasn't been filled out yet. */}
        <DeficitPrescriptionCard />

        {/* TODAY SESSION — Exercise queue with inline timer, rings, reminders. Always rendered. */}
        <TodaySessionPanel />

        {/* DAILY LOOP — Morning brief + structured exercise/habit log. Always rendered. */}
        <div id="today">
          <DailyLoopCard />
        </div>

        {/* PREMIUM UPSELL — compact teaser card for free users. Hidden for premium subscribers. */}
        <PremiumUpgradeCard />

        {/* YOUR STORY — persistent teaser: every rep/journal entry becomes book material. */}
        <YourStoryCard />

        {/* COMMUNITY PULSE — "X survivors logged a rep today." Social proof. */}
        <CommunityPulse />

        {/* WEEKLY GOAL — inline progress bar, links to Progress Hub */}
        <WeeklyGoalCard />

        {/* RECOVERY GOALS — active goal + micro-goal progress. */}
        <GoalsWidget />

        {/* NEVER ZERO AUDIT — Rep-level accountability + Gemini audit after reps are logged. */}
        <NeverZeroAuditHero />

        {!zenMode && (<>
        <FadeUpSection delay={50}>
        {/* BONFIRE — Today's adaptive session (with personalization preview) */}
        <BonfireHeroCard />

        {/* SQUAD — Accountability Pod hero CTA. Survivors don't fail because of
            missing information; they fail because nobody is watching the days
            in between. The pod IS the watch. Surfaced here as a hero card
            (not buried below) because peer-to-peer accountability is the
            stickiest retention feature on the platform. */}
        <section className="mb-8" data-testid="section-squad-hero">
          {userPod ? (
            <div className="block rounded-2xl border border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-md bg-[#C06B3E] flex items-center justify-center">
                    <Users className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E]">Your Squad</p>
                    <p className="text-base font-bold text-[#1C1917]" data-testid="text-squad-hero-name">{userPod.name}</p>
                    <p className="text-base text-[#78716C]">
                      {userPod.memberCount}/{userPod.maxMembers} survivors checking in together — your day is somebody else's reason to show up
                    </p>
                  </div>
                </div>
                <a href="#pod-section" className="text-sm text-[#C06B3E] font-semibold uppercase tracking-widest hover-elevate px-3 py-2 rounded-md min-h-[44px] inline-flex items-center">Open squad →</a>
              </div>
            </div>
          ) : (
            <div className="block rounded-2xl border border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-md bg-[#C06B3E] flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E]">Draft your team</p>
                    <p className="text-base font-bold text-[#1C1917]">3–5 survivors. Daily check-ins. Nobody walks alone.</p>
                    <p className="text-base text-[#78716C]">The accountability pod is the stickiest retention feature on the platform — because the days in between are where recovery actually happens.</p>
                  </div>
                </div>
                <a href="#pod-section" className="text-sm text-[#C06B3E] font-semibold uppercase tracking-widest hover-elevate px-3 py-2 rounded-md min-h-[44px] inline-flex items-center" data-testid="link-squad-hero-join">Find your squad →</a>
              </div>
            </div>
          )}
        </section>

        {/* RECOVERY VIDEOS — Community video feed */}
        <section className="mb-8" data-testid="section-recovery-videos">
          <Link
            href="/sparks"
            className="block rounded-2xl border border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover-elevate overflow-hidden"
            data-testid="link-recovery-videos"
            aria-label="Watch Sparks"
          >
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-md bg-[#C06B3E] flex items-center justify-center flex-shrink-0">
                    <Video className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E]">Sparks</p>
                    <p className="text-base font-bold text-[#1C1917]">See how others are doing it</p>
                    <p className="text-base text-[#78716C]">Real reps. Real progress. Your people, on camera.</p>
                  </div>
                </div>
                <span className="text-sm text-[#C06B3E] font-semibold uppercase tracking-widest shrink-0">Watch →</span>
              </div>
            </div>
            {(communityVideos?.videos?.length ?? 0) > 0 && (
              <div className="px-5 pb-5">
                <div className="grid grid-cols-4 gap-2">
                  {communityVideos!.videos.slice(0, 4).map((v: any) => (
                    <div key={v.id} className="relative aspect-[9/16] rounded-lg overflow-hidden bg-zinc-100">
                      {v.thumbnailUrl
                        ? <img src={v.thumbnailUrl} alt={v.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        : <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300" />
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center">
                          <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <p className="absolute bottom-1 left-1 right-1 text-white text-[8px] font-semibold line-clamp-2 leading-tight">{v.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Link>
        </section>

        {/* Music intentionally not surfaced here. Anchor + Anthem live in the
            Music nav so the dashboard stays focused on accountability + community.
            Re-enable AnchorHeroCard if music ever returns to the home loop. */}

        {/* SURVIVOR SHOP — Curated Amazon affiliate gear */}
        <section className="mb-8" data-testid="section-survivor-shop">
          <Link
            href="/recovery/shop"
            className="block rounded-2xl border border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover-elevate"
            data-testid="link-survivor-shop"
            aria-label="Open the Survivor Shop"
          >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-md bg-[#C06B3E] flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E]">Survivor Shop</p>
                    <p className="text-base font-bold text-[#1C1917]">The gear that actually helped</p>
                    <p className="text-base text-[#78716C]">AFOs, putty, grab bars, wedge pillows — survivor-curated, never prescriptive</p>
                  </div>
                </div>
                <span className="text-sm text-[#C06B3E] font-semibold uppercase tracking-widest">Browse →</span>
              </div>
          </Link>
        </section>

        {/* MOTIVATION STUDIO — Anthem Maker, Vision Card, Daily Quote */}
        <section className="mb-8" data-testid="section-motivation-studio">
          <Link
            href="/recovery/motivation"
            className="block rounded-2xl border border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover-elevate"
            data-testid="link-motivation-studio"
            aria-label="Open the Motivation Studio"
          >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-md bg-[#C06B3E] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E]">Motivation Studio</p>
                    <p className="text-base font-bold text-[#1C1917]">The fuel for tomorrow</p>
                    <p className="text-base text-[#78716C]">Anthem maker · vision card · daily Sasquatch quote</p>
                  </div>
                </div>
                <span className="text-sm text-[#C06B3E] font-semibold uppercase tracking-widest">Create →</span>
              </div>
          </Link>
        </section>

        {/* SQUATCHY ANTHEM HERO */}
        <section className="mb-8" data-testid="section-anthem-hero">
          <Link
            href="/recovery/anthem"
            className="block group rounded-2xl border border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover-elevate active-elevate-2"
            data-testid="link-anthem-hero"
            aria-label="Squatchy — the recovery anthem. Watch the video."
          >
              <div className="grid md:grid-cols-[280px_1fr] gap-0">
                <div className="relative bg-white aspect-video md:aspect-auto md:min-h-[180px] rounded-t-xl md:rounded-l-xl md:rounded-tr-none overflow-hidden">
                  <img
                    src="/videos/squatchy-poster.jpg"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#F5F0EB]/40 pointer-events-none" />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-[#C06B3E] text-black font-bold tracking-widest text-sm no-default-hover-elevate no-default-active-elevate">
                      <Play className="h-3 w-3 mr-1" /> NEW ANTHEM
                    </Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-[#C06B3E]/95 group-hover:bg-[#C06B3E] flex items-center justify-center shadow-lg transition-colors">
                      <Play className="h-6 w-6 text-black ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="p-6 flex flex-col justify-center">
                  <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E] font-bold mb-2">
                    Stroked-Out Sasquatch · Rock Anthem
                  </p>
                  <h2
                    className="text-3xl sm:text-4xl font-display text-[#1C1917] leading-tight mb-2"
                  >
                    Squatchy
                  </h2>
                  <p className="text-base text-[#78716C] leading-relaxed mb-4 max-w-xl">
                    From wheelchair to warrior. Heart still thumpin'? Life still pumpin'.{" "}
                    <span className="text-[#C06B3E] font-semibold">Get up. Get loud. Get Squatchy.</span>
                  </p>
                  <div className="flex items-center gap-2 text-[#C06B3E] text-sm font-semibold uppercase tracking-widest">
                    Watch & Share
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
          </Link>
        </section>

        </FadeUpSection>

        {/* CHALLENGE COMMAND CENTER */}
        <FadeUpSection delay={100}>
        <section className="mb-8" data-testid="section-challenge-command">
          <div className="bg-white border border-[#E2C2A4]/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C06B3E] flex items-center justify-center">
                  <Flame className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1C1917]">66-Day Challenge Command Center</h2>
                  <p className="text-base text-[#78716C]">Your daily mission — no excuses, no exceptions.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-center px-4 py-2 rounded-xl bg-white border border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="text-2xl font-black text-[#C06B3E]" data-testid="text-command-streak">{streak.currentStreak}</div>
                  <div className="text-sm text-[#78716C] uppercase tracking-wider">Day Streak</div>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-white border border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="text-2xl font-black text-[#1C1917]" data-testid="text-command-score">{recoveryScore}</div>
                  <div className="text-sm text-[#78716C] uppercase tracking-wider">Score</div>
                </div>
              </div>
            </div>

            {/* Daily Mission Cards */}
            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              <div id="mission-checkin" className={`rounded-lg p-4 border ${todayCheckin ? "bg-[#C06B3E]/10 border-[#C06B3E]/40" : "bg-[#FDFBF7] border-[#E2C2A4]/30"}`} data-testid="mission-checkin">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className={`h-4 w-4 ${todayCheckin ? "text-[#C06B3E]" : "text-[#A8A29E]"}`} />
                  <span className="text-sm font-bold text-[#1C1917]">Daily Check-in</span>
                  {todayCheckin && <CheckCircle2 className="h-4 w-4 text-[#C06B3E] ml-auto" />}
                </div>
                <p className="text-base text-[#78716C] mb-3">Log mood, energy, pain. Run your audit.</p>
                {!todayCheckin && (
                  <button
                    className="text-base text-[#C06B3E] font-bold flex items-center gap-1 min-h-[44px] px-3 rounded-lg"
                    onClick={() => {
                      const el = document.querySelector('[data-testid="card-checkin"]');
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    data-testid="button-go-checkin"
                  >
                    Do it now <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                {todayCheckin && <span className="text-sm text-[#C06B3E] font-bold">Complete</span>}
              </div>

              <div className={`rounded-lg p-4 border ${habits.some((h: any) => h.logs?.some((l: any) => new Date(l.logDate).toDateString() === new Date().toDateString() && l.isCompleted)) ? "bg-[#C06B3E]/10 border-[#C06B3E]/40" : "bg-[#FDFBF7] border-[#E2C2A4]/30"}`} data-testid="mission-habits">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-[#A8A29E]" />
                  <span className="text-sm font-bold text-[#1C1917]">Habit Stack</span>
                </div>
                <p className="text-base text-[#78716C] mb-3">Complete your tracked recovery habits.</p>
                <Link href="/recovery/builder">
                  <span className="text-base text-[#C06B3E] font-bold flex items-center gap-1 min-h-[44px] py-2">
                    Manage habits <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>

              <div className="rounded-lg p-4 border bg-[#FDFBF7] border-[#E2C2A4]/30" data-testid="mission-lesson">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="h-4 w-4 text-[#A8A29E]" />
                  <span className="text-sm font-bold text-[#1C1917]">Today's Lesson</span>
                </div>
                <p className="text-base text-[#78716C] mb-3">Continue your Sasquatch curriculum.</p>
                <Link href="/recovery/academy">
                  <span className="text-base text-[#C06B3E] font-bold flex items-center gap-1 min-h-[44px] py-2">
                    Go to Academy <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Phase Progress Banner */}
            <div className="bg-[#FDFBF7] rounded-lg p-4 border border-[#E2C2A4]/30 flex flex-wrap items-center gap-4">
              {[
                { name: "SURVIVAL PHASE", days: "Days 1–22", color: "#C06B3E", icon: Target },
                { name: "BREAKTHROUGH PHASE", days: "Days 23–44", color: "#FF6B35", icon: Flame },
                { name: "OPTIMIZATION PHASE", days: "Days 45–66", color: "#22C55E", icon: Trophy },
              ].map(({ name, days, color, icon: Icon }) => {
                const totalDays = streak.totalActiveDays || 0;
                const [start, end] = name === "SURVIVAL PHASE" ? [1, 22] : name === "BREAKTHROUGH PHASE" ? [23, 44] : [45, 66];
                const isActive = totalDays >= start - 1 && totalDays < end;
                const isComplete = totalDays >= end;
                return (
                  <div key={name} className={`flex items-center gap-2 text-sm flex-1 min-w-fit ${isActive ? "opacity-100" : isComplete ? "opacity-60" : "opacity-30"}`} data-testid={`phase-status-${name.toLowerCase().split(" ")[0]}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center`} style={{ background: isComplete ? color : isActive ? `${color}33` : "#E2C2A430", border: `1px solid ${color}50` }}>
                      {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color }} /> : <Icon className="h-3 w-3" style={{ color }} />}
                    </div>
                    <div>
                      <div className="font-bold" style={{ color: isActive || isComplete ? color : "#666" }}>{name}</div>
                      <div className="text-[#A8A29E]">{days}</div>
                    </div>
                    {isActive && <Badge className="ml-auto text-sm border" style={{ background: `${color}20`, color, borderColor: `${color}40` }}>Active</Badge>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        </FadeUpSection>

        <FadeUpSection delay={150}>
        <section className="mb-8" data-testid="section-66day-tracker">
          <SixtyDayTracker />
        </section>
        </FadeUpSection>

        <FadeUpSection delay={175}>
        <section className="mb-8" data-testid="section-my-path">
          <MyPathRecommender />
        </section>
        </FadeUpSection>

        <FadeUpSection delay={200}>
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white border-[#E2C2A4]/30 p-6" data-testid="card-checkin">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#C06B3E]" />
                Today's Check-in
              </h2>
              {todayCheckin && (
                <Badge className="bg-[#C06B3E]/20 text-[#C06B3E] border-[#C06B3E]/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                </Badge>
              )}
            </div>
            
            {todayCheckin ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Heart className="h-5 w-5 text-[#C06B3E] mx-auto mb-1" />
                    <div className="text-2xl font-bold text-[#1C1917]">{todayCheckin.moodScore}/10</div>
                    <div className="text-base text-[#78716C]">Mood</div>
                  </div>
                  <div className="text-center">
                    <Zap className="h-5 w-5 text-[#C06B3E] mx-auto mb-1" />
                    <div className="text-2xl font-bold text-[#1C1917]">{todayCheckin.energyScore}/10</div>
                    <div className="text-base text-[#78716C]">Energy</div>
                  </div>
                  <div className="text-center">
                    <Activity className="h-5 w-5 text-[#C06B3E] mx-auto mb-1" />
                    <div className="text-2xl font-bold text-[#1C1917]">{todayCheckin.painScore}/10</div>
                    <div className="text-base text-[#78716C]">Pain</div>
                  </div>
                </div>
                {todayCheckin.winsToday && (
                  <div className="bg-[#FDFBF7] rounded p-3 border border-[#E2C2A4]/30">
                    <span className="text-sm text-[#78716C] uppercase">Wins:</span>
                    <p className="text-base text-[#78716C]">{todayCheckin.winsToday}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Skip escape hatch */}
                <Link href="/recovery/community" className="block">
                  <div className="text-center text-base text-[#78716C] hover:text-[#C06B3E] cursor-pointer transition-colors min-h-[44px] flex items-center justify-center" data-testid="link-skip-checkin">
                    Skip for now → Explore Community
                  </div>
                </Link>

                {/* MOOD tap buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-base font-medium text-[#78716C] flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-[#C06B3E]" /> Mood
                    </label>
                    <span className="text-[#C06B3E] font-bold text-base">
                      {MOOD_OPTIONS.find(o => o.value === checkinForm.moodScore)?.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5" data-testid="mood-buttons">
                    {MOOD_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCheckinForm({ ...checkinForm, moodScore: opt.value })}
                        className={`py-3 rounded-lg text-base font-bold border transition-colors ${
                          checkinForm.moodScore === opt.value
                            ? "bg-[#C06B3E] text-black border-[#C06B3E]"
                            : "bg-[#FDFBF7] text-[#78716C] border-[#E2C2A4]/30 hover:border-[#C06B3E]/50"
                        }`}
                        data-testid={`mood-${opt.value}`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* ENERGY tap buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-base font-medium text-[#78716C] flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-[#C06B3E]" /> Energy
                    </label>
                    <span className="text-[#C06B3E] font-bold text-base">
                      {ENERGY_OPTIONS.find(o => o.value === checkinForm.energyScore)?.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5" data-testid="energy-buttons">
                    {ENERGY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCheckinForm({ ...checkinForm, energyScore: opt.value })}
                        className={`py-3 rounded-lg text-base font-bold border transition-colors ${
                          checkinForm.energyScore === opt.value
                            ? "bg-[#C06B3E] text-black border-[#C06B3E]"
                            : "bg-[#FDFBF7] text-[#78716C] border-[#E2C2A4]/30 hover:border-[#C06B3E]/50"
                        }`}
                        data-testid={`energy-${opt.value}`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* PAIN tap buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-base font-medium text-[#78716C] flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-[#C06B3E]" /> Pain
                    </label>
                    <span className={`font-bold text-base ${
                      checkinForm.painScore >= 8 ? "text-red-400" : checkinForm.painScore >= 6 ? "text-orange-400" : "text-[#C06B3E]"
                    }`}>
                      {PAIN_OPTIONS.find(o => o.value === checkinForm.painScore)?.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5" data-testid="pain-buttons">
                    {PAIN_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCheckinForm({ ...checkinForm, painScore: opt.value })}
                        className={`py-3 rounded-lg text-base font-bold border transition-colors ${
                          checkinForm.painScore === opt.value
                            ? opt.value >= 8 ? "bg-red-500 text-[#1C1917] border-red-500"
                              : opt.value >= 6 ? "bg-orange-500 text-[#1C1917] border-orange-500"
                              : "bg-[#C06B3E] text-black border-[#C06B3E]"
                            : "bg-[#FDFBF7] text-[#78716C] border-[#E2C2A4]/30 hover:border-[#C06B3E]/50"
                        }`}
                        data-testid={`pain-${opt.value}`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* Quick submit */}
                <Button
                  size="lg"
                  onClick={handleCheckinSubmit}
                  disabled={checkinMutation.isPending}
                  className="w-full bg-[#C06B3E] text-black font-bold"
                  data-testid="button-checkin-submit"
                >
                  {checkinMutation.isPending ? "Saving..." : "Submit Check-in"}
                </Button>

                {/* Optional notes toggle */}
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className="w-full flex items-center justify-center gap-1.5 text-base text-[#78716C] hover:text-[#57534E] transition-colors py-1 min-h-[44px]"
                  data-testid="button-toggle-notes"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showNotes ? "rotate-180" : ""}`} />
                  {showNotes ? "Hide notes" : "Add notes (optional)"}
                </button>

                {/* Optional Sasquatch Daily Audit */}
                {showNotes && (
                  <div className="space-y-3 pt-2 border-t border-[#E2C2A4]/30">
                    <div className="bg-[#C06B3E]/10 border border-[#C06B3E]/30 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-[#C06B3E] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Flame className="w-4 h-4" />
                        Sasquatch Daily Audit
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-base text-[#78716C] mb-1.5 block">1. What did I BUILD today?</label>
                          <Textarea
                            placeholder="Every small action counts — a flicker is still progress..."
                            value={checkinForm.winsToday}
                            onChange={(e) => setCheckinForm({ ...checkinForm, winsToday: e.target.value })}
                            className="bg-white border-[#E2C2A4]/30 text-[#1C1917] text-base min-h-[60px]"
                            data-testid="input-wins"
                          />
                        </div>
                        <div>
                          <label className="text-base text-[#78716C] mb-1.5 block">2. What BROKE?</label>
                          <Textarea
                            placeholder="Honesty heals faster than denial..."
                            value={checkinForm.challengesToday}
                            onChange={(e) => setCheckinForm({ ...checkinForm, challengesToday: e.target.value })}
                            className="bg-white border-[#E2C2A4]/30 text-[#1C1917] text-base min-h-[60px]"
                            data-testid="input-challenges"
                          />
                        </div>
                        <div>
                          <label className="text-base text-[#78716C] mb-1.5 block">3. Tomorrow's target?</label>
                          <Textarea
                            placeholder="Your next rep, your next step..."
                            value={checkinForm.tomorrowsTarget}
                            onChange={(e) => setCheckinForm({ ...checkinForm, tomorrowsTarget: e.target.value })}
                            className="bg-white border-[#E2C2A4]/30 text-[#1C1917] text-base min-h-[60px]"
                            data-testid="input-target"
                          />
                        </div>
                        <div>
                          <label className="text-base text-[#78716C] mb-1.5 block">Gratitude</label>
                          <Textarea
                            placeholder="One thing I'm grateful for..."
                            value={checkinForm.gratitude}
                            onChange={(e) => setCheckinForm({ ...checkinForm, gratitude: e.target.value })}
                            className="bg-white border-[#E2C2A4]/30 text-[#1C1917] text-base min-h-[60px]"
                            data-testid="input-gratitude"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleCheckinSubmit}
                      disabled={checkinMutation.isPending}
                      className="w-full bg-[#C06B3E] text-black font-bold"
                      data-testid="button-checkin-submit-notes"
                    >
                      {checkinMutation.isPending ? "Saving..." : "Submit with Notes"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="bg-white border-[#E2C2A4]/30 p-6" data-testid="card-program">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#C06B3E]" />
                Program Progress
              </h2>
            </div>
            
            {enrollment ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#1C1917]">{enrollment.program?.name || "Recovery Program"}</span>
                    <Badge className="bg-[#C06B3E]/20 text-[#C06B3E] border-[#C06B3E]/30">
                      {enrollment.program?.tier || "Active"}
                    </Badge>
                  </div>
                  <Progress value={enrollment.progressPercentage || 0} className="h-3 bg-[#E2C2A4]/30 [&>div]:bg-[#C06B3E]" />
                  <div className="flex justify-between mt-1 text-sm text-[#78716C]">
                    <span>{enrollment.progressPercentage || 0}% complete</span>
                    <span>{enrollment.program?.estimatedWeeks || 12} weeks</span>
                  </div>
                </div>
                
                {enrollment.currentModule && (
                  <div className="bg-[#FDFBF7] rounded-lg p-4 border border-[#E2C2A4]/30">
                    <div className="text-sm text-[#78716C] uppercase mb-1">Current Module</div>
                    <div className="font-semibold text-[#1C1917]">{enrollment.currentModule.title}</div>
                    {enrollment.currentLesson && (
                      <div className="text-base text-[#78716C] mt-1">Lesson: {enrollment.currentLesson.title}</div>
                    )}
                  </div>
                )}
                
                <Link href="/recovery/academy">
                  <Button className="w-full bg-[#C06B3E] text-black font-bold" data-testid="button-continue-learning">
                    Continue Learning
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-[#A8A29E] mx-auto mb-4" />
                <p className="text-[#78716C] mb-4">Start your personalized recovery journey</p>
                <Link href="/recovery/builder">
                  <Button className="bg-[#C06B3E] text-black font-bold" data-testid="button-start-program">
                    Build Your Program
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
        </FadeUpSection>

        <FadeUpSection delay={250}>
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white border-[#E2C2A4]/30 p-6" data-testid="card-habits">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#C06B3E]" />
                66-Day Habit Tracker
              </h2>
              <Badge className="bg-[#FDFBF7] text-[#78716C] border-[#E2C2A4]/30">{streak.totalActiveDays}/66 days</Badge>
            </div>
            
            <div className="grid grid-cols-11 gap-1 mb-6">
              {Array.from({ length: 66 }).map((_, i) => {
                const isComplete = i < streak.totalActiveDays;
                return (
                  <div 
                    key={i}
                    className={`w-5 h-5 rounded-sm ${isComplete ? 'bg-[#C06B3E]' : 'bg-[#E2C2A4]/40'}`}
                    title={`Day ${i + 1}`}
                    data-testid={`habit-day-${i + 1}`}
                  />
                );
              })}
            </div>
            
            {habits.length > 0 ? (
              <div className="space-y-3">
                <div className="text-base text-[#78716C] mb-2">Today's Habits</div>
                {habits.map((habit: any) => {
                  const todayLog = habit.logs?.find((l: any) => {
                    const logDate = new Date(l.logDate);
                    const today = new Date();
                    return logDate.toDateString() === today.toDateString();
                  });
                  const isCompleted = todayLog?.isCompleted;
                  
                  return (
                    <div 
                      key={habit.id}
                      className="flex items-center gap-3 p-3 bg-[#FDFBF7] rounded-lg border border-[#E2C2A4]/30"
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => habitLogMutation.mutate(habit.id)}
                        disabled={habitLogMutation.isPending}
                        data-testid={`checkbox-habit-${habit.id}`}
                        className="border-[#C06B3E] data-[state=checked]:bg-[#C06B3E]"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isCompleted ? 'line-through text-[#A8A29E]' : 'text-[#1C1917]'}`}>
                          {habit.customName || habit.habitName}
                        </div>
                        <div className="text-sm text-[#78716C]">{habit.totalCompletions} completions</div>
                      </div>
                      <div className="text-sm text-[#C06B3E]">{habit.currentStreak} day streak</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-[#78716C] mb-3">No habits tracked yet</p>
                <Link href="/recovery/builder">
                  <Button variant="outline" className="border-[#C06B3E] text-[#C06B3E]" data-testid="button-add-habit">
                    Add New Habit
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="bg-white border-[#E2C2A4]/30 p-6" data-testid="card-milestones">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#C06B3E]" />
                Milestones & Achievements
              </h2>
              <Badge className="bg-[#C06B3E]/20 text-[#C06B3E] border-[#C06B3E]/30">
                <Star className="h-3 w-3 mr-1" /> {totalPoints} pts
              </Badge>
            </div>
            
            {milestones.length > 0 ? (
              <div className="space-y-3">
                {milestones.slice(0, 5).map((milestone: any) => (
                  <div 
                    key={milestone.id}
                    className="flex items-center gap-3 p-3 bg-[#FDFBF7] rounded-lg border border-[#E2C2A4]/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#C06B3E]/20 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-[#C06B3E]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[#1C1917]">{milestone.name}</div>
                      <div className="text-base text-[#78716C]">{milestone.description}</div>
                    </div>
                    <Badge className="bg-[#F5F0EB] text-[#78716C] border-[#E2C2A4]/40">+{milestone.pointsAwarded}</Badge>
                  </div>
                ))}
                <Link href="/recovery/achievements">
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-[#C06B3E] text-[#C06B3E]"
                    data-testid="button-view-achievements"
                  >
                    View All Achievements
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-[#A8A29E] mx-auto mb-4" />
                <p className="text-[#78716C]">Complete check-ins and habits to earn milestones!</p>
                <Link href="/recovery/achievements">
                  <Button 
                    variant="outline" 
                    className="mt-4 border-[#C06B3E] text-[#C06B3E]"
                    data-testid="button-view-achievements-empty"
                  >
                    View Achievement Center
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
        </FadeUpSection>

        {/* Accountability Pod Section — full management surface (the hero CTA above
            scrolls here via #pod-section). Stays in the deeper page so the
            create/join/leave + member list + activity stream lives in one place. */}
        <FadeUpSection delay={300}>
        <Card id="pod-section" className="bg-white border-[#E2C2A4]/30 p-6 mb-8" data-testid="card-accountability-pod">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#C06B3E]" />
              My Accountability Pod
            </h2>
            {userPod && (
              <Badge className="bg-[#C06B3E]/20 text-[#C06B3E] border-[#C06B3E]/30">
                {userPod.memberCount}/{userPod.maxMembers} members
              </Badge>
            )}
          </div>

          {userPod ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#1C1917] mb-1" data-testid="text-pod-name">{userPod.name}</h3>
                {userPod.description && (
                  <p className="text-base text-[#78716C] mb-3">{userPod.description}</p>
                )}
                {userPod.focusArea && (
                  <Badge className="bg-[#FDFBF7] text-[#78716C] border-[#E2C2A4]/30 mb-4">{userPod.focusArea}</Badge>
                )}
              </div>

              {/* Pod Members */}
              <div>
                <div className="text-base text-[#78716C] mb-3">Pod Members</div>
                <div className="flex flex-wrap gap-3" data-testid="pod-members-list">
                  {userPod.members?.map((member: any) => (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-2 bg-[#FDFBF7] rounded-full pr-3 border border-[#E2C2A4]/30"
                      data-testid={`pod-member-${member.id}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profileImageUrl} />
                        <AvatarFallback className="bg-[#C06B3E]/20 text-[#C06B3E] text-xs">
                          {member.firstName?.[0] || "?"}{member.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-base text-[#1C1917]">
                        {member.firstName || "Member"}
                        {member.role === "leader" && (
                          <Star className="h-3 w-3 inline ml-1 text-[#C06B3E]" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pod Activity Feed */}
              {podActivity && podActivity.length > 0 && (
                <div>
                  <div className="text-base text-[#78716C] mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Activity
                  </div>
                  <div className="space-y-2" data-testid="pod-activity-feed">
                    {podActivity.slice(0, 5).map((activity: any) => (
                      <div 
                        key={activity.id} 
                        className="flex items-center gap-3 p-3 bg-[#FDFBF7] rounded-lg border border-[#E2C2A4]/30"
                        data-testid={`activity-${activity.id}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.profileImageUrl} />
                          <AvatarFallback className="bg-[#C06B3E]/20 text-[#C06B3E] text-xs">
                            {activity.firstName?.[0] || "?"}{activity.lastName?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-medium text-[#1C1917]">{activity.firstName || "Member"}</span>
                            {activity.type === "checkin" && (
                              <Badge className="bg-[#C06B3E]/20 text-[#C06B3E] text-sm border-[#C06B3E]/30">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Checked in
                              </Badge>
                            )}
                          </div>
                          {activity.winsToday && (
                            <p className="text-base text-[#78716C] truncate">{activity.winsToday}</p>
                          )}
                          {activity.moodScore && (
                            <div className="flex items-center gap-2 text-sm text-[#78716C] mt-1">
                              <Smile className="h-3 w-3" />
                              Mood: {activity.moodScore}/10
                              <Zap className="h-3 w-3 ml-2" />
                              Energy: {activity.energyScore}/10
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => leavePodMutation.mutate(userPod.id)}
                disabled={leavePodMutation.isPending}
                className="border-[#E2C2A4]/30 text-[#78716C]"
                data-testid="button-leave-pod"
              >
                <DoorOpen className="h-4 w-4 mr-2" />
                {leavePodMutation.isPending ? "Leaving..." : "Leave Pod"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-4">
                <Users className="h-12 w-12 text-[#A8A29E] mx-auto mb-4" />
                <p className="text-[#78716C] mb-2">Join an accountability pod for peer support</p>
                <p className="text-base text-[#78716C]">Stay motivated with fellow recovery warriors</p>
              </div>

              {/* Open Pods to Join */}
              {openPods && openPods.length > 0 && (
                <div>
                  <div className="text-base text-[#78716C] mb-3">Available Pods</div>
                  <div className="space-y-2" data-testid="open-pods-list">
                    {openPods.slice(0, 3).map((pod: any) => (
                      <div 
                        key={pod.id}
                        className="flex items-center justify-between p-3 bg-[#FDFBF7] rounded-lg border border-[#E2C2A4]/30"
                        data-testid={`open-pod-${pod.id}`}
                      >
                        <div>
                          <div className="font-medium text-[#1C1917]">{pod.name}</div>
                          <div className="text-base text-[#78716C]">
                            {pod.memberCount}/{pod.maxMembers} members
                            {pod.focusArea && ` • ${pod.focusArea}`}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => joinPodMutation.mutate(pod.id)}
                          disabled={joinPodMutation.isPending}
                          className="bg-[#C06B3E] text-black"
                          data-testid={`button-join-pod-${pod.id}`}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Pod */}
              <div className="flex justify-center gap-3">
                <Dialog open={createPodOpen} onOpenChange={setCreatePodOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-[#C06B3E] text-black"
                      data-testid="button-create-pod"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create a Pod
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-[#E2C2A4]/30 text-[#1C1917]">
                    <DialogHeader>
                      <DialogTitle className="text-[#1C1917]">Create Accountability Pod</DialogTitle>
                      <DialogDescription className="text-[#78716C]">
                        Start a pod and invite other warriors to join your recovery journey.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-base text-[#78716C] mb-2 block">Pod Name *</label>
                        <Input
                          placeholder="e.g., Morning Warriors"
                          value={newPodName}
                          onChange={(e) => setNewPodName(e.target.value)}
                          className="bg-white border-[#E2C2A4]/30 text-[#1C1917]"
                          data-testid="input-pod-name"
                        />
                      </div>
                      <div>
                        <label className="text-base text-[#78716C] mb-2 block">Description</label>
                        <Textarea
                          placeholder="What's your pod about?"
                          value={newPodDescription}
                          onChange={(e) => setNewPodDescription(e.target.value)}
                          className="bg-white border-[#E2C2A4]/30 text-[#1C1917]"
                          data-testid="input-pod-description"
                        />
                      </div>
                      <div>
                        <label className="text-base text-[#78716C] mb-2 block">Focus Area</label>
                        <Input
                          placeholder="e.g., Physical Therapy, Mindfulness"
                          value={newPodFocus}
                          onChange={(e) => setNewPodFocus(e.target.value)}
                          className="bg-white border-[#E2C2A4]/30 text-[#1C1917]"
                          data-testid="input-pod-focus"
                        />
                      </div>
                      <Button
                        onClick={handleCreatePod}
                        disabled={createPodMutation.isPending || !newPodName.trim()}
                        className="w-full bg-[#C06B3E] text-black"
                        data-testid="button-confirm-create-pod"
                      >
                        {createPodMutation.isPending ? "Creating..." : "Create Pod"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </Card>
        </FadeUpSection>

        <FadeUpSection delay={350}>
        <Card className="bg-white border-[#E2C2A4]/30 p-6 mb-8" data-testid="card-ai-coach">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#C06B3E]" />
              AI Coach Insight
            </h2>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-[#78716C] mb-4">
              {todayCheckin 
                ? `Great check-in today! Your mood is at ${todayCheckin.moodScore}/10 and energy at ${todayCheckin.energyScore}/10. ${todayCheckin.moodScore >= 7 ? "You're doing amazing - keep that momentum going!" : "Remember, recovery isn't linear. Every day you show up matters."}`
                : "Hey warrior! Don't forget to complete your daily check-in. Tracking your progress is key to seeing how far you've come."}
            </p>
            <Button variant="outline" className="border-[#C06B3E] text-[#C06B3E]" data-testid="button-chat-coach">
              Chat with Sasquatch Coach
            </Button>
          </div>
        </Card>
        </FadeUpSection>

        <FadeUpSection delay={400}>
        <section className="mb-8">
          <Card className="bg-[#FFF8F0] border-[#C06B3E]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6" data-testid="card-donation-cta">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#1C1917] mb-2">Gift the Rebuild</h3>
                <p className="text-[#78716C] text-base">
                  Every donation to The Stroke Recovery Academy funds coaching for a survivor who needs a builder's blueprint.
                  Gift a survivor one-on-one accountability coaching, motivation, and nutrition-focused advice from the Stroked-Out Sasquatch himself.
                </p>
              </div>
              <div className="flex gap-3">
                <a href="https://strokelyfe.org" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#C06B3E] text-black font-bold" data-testid="button-donate">
                    <Heart className="w-4 h-4 mr-2" />
                    Donate Now
                  </Button>
                </a>
                <a href="https://strokerecoveryacademy.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-[#C06B3E]/50 text-[#C06B3E]" data-testid="button-coaching">
                    Book Coaching
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </section>
        </FadeUpSection>

        <FadeUpSection delay={450}>
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-[#1C1917]">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/recovery/survival-grid">
              <Card className="bg-white border-[#E2C2A4]/30 p-4 hover-elevate cursor-pointer" data-testid="action-survival-grid">
                <Grid3X3 className="h-8 w-8 text-[#C06B3E] mb-2" />
                <div className="font-semibold text-[#1C1917]">Survival Grid</div>
                <div className="text-base text-[#78716C]">Exercises & Protocols</div>
              </Card>
            </Link>

            <Link href="/recovery/brain-gym">
              <Card className="bg-white border-[#E2C2A4]/30 p-4 hover-elevate cursor-pointer" data-testid="action-brain-gym">
                <Brain className="h-8 w-8 text-[#C06B3E] mb-2" />
                <div className="font-semibold text-[#1C1917]">Brain Gym</div>
                <div className="text-base text-[#78716C]">Word Search · Crossword · Memory</div>
              </Card>
            </Link>

            <Link href="/recovery/community">
              <Card className="bg-white border-[#E2C2A4]/30 p-4 hover-elevate cursor-pointer" data-testid="action-community">
                <Users className="h-8 w-8 text-[#C06B3E] mb-2" />
                <div className="font-semibold text-[#1C1917]">Community</div>
                <div className="text-base text-[#78716C]">Share Your Progress</div>
              </Card>
            </Link>
            
            <Link href="/recovery/academy">
              <Card className="bg-white border-[#E2C2A4]/30 p-4 hover-elevate cursor-pointer" data-testid="action-academy">
                <BookOpen className="h-8 w-8 text-[#C06B3E] mb-2" />
                <div className="font-semibold text-[#1C1917]">Academy</div>
                <div className="text-base text-[#78716C]">Courses & Learning</div>
              </Card>
            </Link>
            
            <Link href="/marketplace">
              <Card className="bg-white border-[#E2C2A4]/30 p-4 hover-elevate cursor-pointer" data-testid="action-marketplace">
                <ShoppingBag className="h-8 w-8 text-[#C06B3E] mb-2" />
                <div className="font-semibold text-[#1C1917]">Marketplace</div>
                <div className="text-base text-[#78716C]">Recovery Tools</div>
              </Card>
            </Link>
          </div>
        </section>
        </FadeUpSection>

        <SasquatchChatWidget />
        <SasquatchQuoteModal
          open={!!checkinReward}
          onClose={() => setCheckinReward(null)}
          quote={checkinReward?.quote || null}
          creditsEarned={checkinReward?.creditsEarned || 0}
          streakBonusLabel={checkinReward?.streakBonusLabel}
          streak={checkinReward?.streak}
        />
        </>)}
      </main>
      </div>
    </div>
  );
}

// Keys must match the `energy_pattern` text column in `user_profiles`
// (morning | afternoon | evening | variable). Anything else falls through
// to the raw value below.
const ENERGY_LABEL: Record<string, string> = {
  morning: "Morning energy",
  afternoon: "Afternoon energy",
  evening: "Evening energy",
  variable: "Variable energy",
};

interface AnchorHeroResponse {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string | null;
  todayAnchor: {
    id: number;
    anchorType: string;
    anchorData: { title: string; lines: string[] };
  } | null;
}

function AnchorHeroCard() {
  const { data, isLoading } = useQuery<AnchorHeroResponse>({
    queryKey: ["/api/recovery/anchor/today"],
    staleTime: 60_000,
  });

  return (
    <section className="mb-8" data-testid="section-anchor-hero">
      <Link
        href="/recovery/anchor/today"
        className="block group rounded-2xl border border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover-elevate active-elevate-2 p-6"
        data-testid="link-anchor-hero"
        aria-label="Open today's recovery anchor"
      >
          <div className="flex items-start gap-5">
            <div className="hidden sm:flex h-16 w-16 rounded-full bg-[#C06B3E] items-center justify-center shrink-0 shadow-[0_0_24px_rgba(192,107,62,0.35)]">
              <Anchor className="h-8 w-8 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E] font-bold mb-1">
                Today's Anchor · Recovery Anchor Studio
              </p>
              <h2
                className="text-2xl sm:text-3xl font-black text-[#1C1917] leading-tight mb-2"
                style={{ fontFamily: "Playfair Display, Georgia, serif" }}
              >
                The words your stroke tried to take.
              </h2>

              {isLoading || !data ? (
                <p className="text-base text-[#78716C] leading-relaxed mb-3">
                  Encode an affirmation, a speech-recovery phrase, or a memory
                  list as a sung anchor. <span className="text-[#C06B3E] font-semibold">Practice once a day.</span>
                </p>
              ) : (
                <div className="mb-3" data-testid="preview-anchor-today">
                  {data.todayAnchor ? (
                    <p className="text-base text-[#78716C] leading-relaxed mb-2">
                      Today's anchor:{" "}
                      <span className="text-[#1C1917] font-semibold" data-testid="text-anchor-today-title">
                        {data.todayAnchor.anchorData.title}
                      </span>
                    </p>
                  ) : (
                    <p className="text-base text-[#78716C] leading-relaxed mb-2">
                      No anchor for today yet.{" "}
                      <span className="text-[#C06B3E] font-semibold">Pick one or render a new one.</span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className="border-[#C06B3E]/50 text-[#C06B3E] bg-[#C06B3E]/10 text-sm"
                      data-testid="chip-anchor-streak"
                    >
                      <Flame className="h-3 w-3 mr-1" />
                      {data.currentStreak} day streak
                    </Badge>
                    {data.longestStreak > 0 && (
                      <Badge
                        variant="outline"
                        className="border-[#C06B3E]/30 text-[#C06B3E]/80 bg-[#C06B3E]/5 text-sm"
                        data-testid="chip-anchor-longest"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        Best: {data.longestStreak}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-[#C06B3E] text-sm font-semibold uppercase tracking-widest">
                <Anchor className="h-4 w-4" />
                Open Today's Anchor
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
      </Link>
    </section>
  );
}

// Free-user premium upgrade teaser card. Hidden for premium users and unauthenticated visitors.
function PremiumUpgradeCard() {
  const { isAuthenticated } = useAuth();
  const { data: premiumStatus } = useQuery<{ active: boolean }>({
    queryKey: ["/api/sasquatch-premium/status"],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  if (!isAuthenticated || premiumStatus?.active) return null;

  return (
    <Link href="/recovery/premium">
      <div
        className="mx-1 mb-3 rounded-2xl border border-[#E2C2A4]/25 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 hover-elevate"
        data-testid="card-premium-upsell"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C06B3E]/15 border border-[#C06B3E]/25 flex items-center justify-center flex-shrink-0">
            <Flame className="w-3.5 h-3.5 text-[#C06B3E]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1C1917] leading-tight">Unlimited Coach · Daily AI reports · Voice Cloning</p>
            <p className="text-base text-[#78716C] mt-0.5">7-day free trial · $19/mo or $190/yr</p>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#C06B3E] text-black text-sm font-bold">
              <Sparkles className="h-3 w-3" />
              Try free
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Your Story card — always visible. Every entry is book material.
// No extra API call; just a persistent CTA to /recovery/my-story.
function YourStoryCard() {
  return (
    <Link href="/recovery/my-story">
      <div
        className="mx-1 mb-3 rounded-2xl border border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 hover-elevate"
        data-testid="card-your-story"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F5F0EB] border border-[#E2C2A4]/40 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-[#78716C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1C1917] leading-tight">Your Recovery Story</p>
            <p className="text-base text-[#78716C] mt-0.5">Every rep you log is material. Mark the chapters. Write the book.</p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-base text-[#78716C] font-medium">See story →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Community pulse — "X survivors active today. You're one of them."
// Public endpoint, no auth required. Only renders when count > 0.
function CommunityPulse() {
  const { data } = useQuery<{ todayActive: number; weekActive: number }>({
    queryKey: ["/api/recovery/community-stats"],
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const count = data?.todayActive ?? 0;
  if (count < 1) return null;

  return (
    <div
      className="mx-1 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      data-testid="section-community-pulse"
    >
      <div className="flex -space-x-1">
        {[...Array(Math.min(count, 4))].map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border border-white bg-[#C06B3E]/20 flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#C06B3E]/60" />
          </div>
        ))}
      </div>
      <p className="text-base text-[#78716C] leading-tight">
        <span className="text-[#C06B3E] font-semibold">{count.toLocaleString()}</span>
        {" "}survivor{count !== 1 ? "s" : ""} logged a rep today.{" "}
        <span className="text-[#78716C]">You're one of them.</span>
      </p>
    </div>
  );
}

// Weekly goal card — compact progress bar anchored between DailyLoopCard and NeverZeroAuditHero.
// Pulls from /api/recovery/progress (shared cache with Progress Hub, staleTime 5min).
function WeeklyGoalCard() {
  const { data } = useQuery<{
    goal: { weeklyReps: number; thisWeekReps: number };
    streak: { current: number };
  }>({
    queryKey: ["/api/recovery/progress"],
    staleTime: 1000 * 60 * 5,
  });

  if (!data) return null;

  const { weeklyReps, thisWeekReps } = data.goal;
  const pct = Math.min(100, Math.round((thisWeekReps / (weeklyReps || 21)) * 100));
  const done = thisWeekReps >= weeklyReps;

  return (
    <section className="mb-4 mt-3 px-1" data-testid="section-weekly-goal">
      <Link href="/recovery/progress">
        <div className="rounded-xl border border-[#E2C2A4]/30 bg-white px-4 py-3 hover-elevate cursor-pointer">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-[#C06B3E]" />
              <span className="text-sm font-semibold text-[#1C1917]">
                {done ? "Weekly goal hit" : "Weekly goal"}
              </span>
            </div>
            <span className="text-sm text-[#78716C] font-mono">
              {thisWeekReps} / {weeklyReps} reps{done ? " ✓" : ""}
            </span>
          </div>
          <Progress value={pct} className="h-1.5" />
          <div className="flex justify-between mt-1.5 text-sm text-[#78716C]">
            <span>{pct}% this week</span>
            <span className="text-[#C06B3E]/60">View progress →</span>
          </div>
        </div>
      </Link>
    </section>
  );
}

type NeverZeroAuditHeroPayload = {
  auditDate: string;
  message: string;
  streak: number;
  todayCount: number;
  verdict: string | null;
  tomorrow: string | null;
  streakBand: 'spark' | 'ember' | 'blaze' | 'wildfire' | 'legend';
};

function NeverZeroAuditHero() {
  const { isAuthenticated } = useAuth();
  const tierColor: Record<NeverZeroAuditHeroPayload['streakBand'], string> = {
    spark: "#C06B3E", ember: "#E07B00", blaze: "#F97316", wildfire: "#EF4444", legend: "#FACC15",
  };
  const tierLabel: Record<NeverZeroAuditHeroPayload['streakBand'], string> = {
    spark: "Spark", ember: "Ember", blaze: "Blaze", wildfire: "Wildfire", legend: "Legend",
  };

  // Hits the cached audit — won't burn a Gemini call if today's already saved.
  const { data: audit, isLoading } = useQuery<NeverZeroAuditHeroPayload>({
    queryKey: ["/api/recovery/never-zero/report", "hero"],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/recovery/never-zero/report", { force: false });
      return await res.json();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  const color = audit ? tierColor[audit.streakBand] : "#C06B3E";
  const tier = audit ? tierLabel[audit.streakBand] : "Spark";
  const hasReps = (audit?.todayCount ?? 0) > 0;

  return (
    <section className="mb-8" data-testid="section-never-zero-audit-hero">
      <Link
        href="/recovery/never-zero"
        className="block group rounded-xl border-2 hover-elevate active-elevate-2 p-6"
        style={{ borderColor: color, background: `linear-gradient(135deg, ${color}22, #FFF8F0 60%, #FFF8F0)` }}
        data-testid="link-never-zero-hero"
        aria-label="Open today's Sasquatch audit"
      >
        <div className="flex items-start gap-5">
          <div
            className="hidden sm:flex h-16 w-16 rounded-full items-center justify-center shrink-0"
            style={{ background: color, boxShadow: `0 0 24px ${color}73` }}
          >
            <Flame className="h-8 w-8 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm uppercase tracking-[0.3em] font-bold" style={{ color }}>
                The Heart · Never Zero Audit
              </p>
              <Badge className="text-sm border" style={{ background: `${color}25`, color, borderColor: `${color}66` }}>
                {tier} · Day {audit?.streak ?? 0}
              </Badge>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-black text-[#1C1917] leading-tight mb-2"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}
            >
              {hasReps ? "Sasquatch audited your day." : "Sasquatch is waiting on your rep."}
            </h2>
            {isLoading ? (
              <p className="text-base text-[#78716C] italic">Loading today's audit…</p>
            ) : audit && hasReps && audit.verdict ? (
              <>
                <p className="text-base text-[#1C1917] leading-relaxed mb-2 line-clamp-3" data-testid="text-audit-verdict">
                  {audit.verdict}
                </p>
                {audit.tomorrow && (
                  <p className="text-base text-[#78716C] italic flex items-center gap-1 mb-3">
                    <ArrowRight className="h-3 w-3" /> Tomorrow: {audit.tomorrow}
                  </p>
                )}
              </>
            ) : audit && !hasReps ? (
              <p className="text-base text-[#78716C] leading-relaxed mb-3">
                One stretch. One step. One word. Anything saves the streak — and Sasquatch will audit your day in seconds.
              </p>
            ) : (
              <p className="text-base text-[#78716C] leading-relaxed mb-3">
                Daily check-in with honest feedback from a 7-year survivor. The accountability loop.
              </p>
            )}
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest" style={{ color }}>
              <Zap className="h-4 w-4" />
              {hasReps ? "Open today's audit" : "Log my 1 rep"}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

function BonfireHeroCard() {
  const { data: rec, isLoading } = useQuery<TodayRecommendation>({
    queryKey: ["/api/recovery/today/recommendation"],
    staleTime: 60_000,
  });

  const level = rec ? LEVELS.find((l) => l.id === rec.level) : null;
  const p = rec?.personalization;
  const goalCount = p?.goals?.length ?? 0;
  const showPersonalization = !!(p?.applied && (p?.energyPattern || p?.timeBudgetMinutes || goalCount > 0 || p?.capReason));

  return (
    <section className="mb-8" data-testid="section-bonfire-hero">
      <Link
        href="/recovery/today"
        className="block group rounded-2xl border border-[#C06B3E]/40 bg-[#FFF8F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover-elevate active-elevate-2 p-6"
        data-testid="link-bonfire-hero"
        aria-label="Start today's Bonfire session"
      >
          <div className="flex items-start gap-5">
            <div className="hidden sm:flex h-16 w-16 rounded-full bg-[#C06B3E] items-center justify-center shrink-0 shadow-[0_0_24px_rgba(192,107,62,0.45)]">
              <Flame className="h-8 w-8 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E] font-bold mb-1">
                Today's Session · The Bonfire
              </p>
              <h2
                className="text-2xl sm:text-3xl font-black text-[#1C1917] leading-tight mb-2"
                style={{ fontFamily: "Playfair Display, Georgia, serif" }}
              >
                What to do, right now.
              </h2>

              {isLoading || !rec ? (
                <p className="text-base text-[#78716C] leading-relaxed mb-3">
                  One adaptive walkthrough, tuned to how yesterday felt. Ends with a
                  supervised walking cooldown <span className="text-[#C06B3E] font-semibold">when you're ready for it.</span>
                </p>
              ) : (
                <div className="mb-3" data-testid="preview-today-recommendation">
                  <p className="text-base text-[#78716C] leading-relaxed mb-2">
                    Today's plan: <span className="text-[#1C1917] font-semibold" data-testid="text-today-level">{level?.name ?? `Level ${rec.level}`}</span>
                    <span className="text-[#78716C]"> · </span>
                    <span className="text-[#78716C]">{rec.reason}</span>
                  </p>
                  {showPersonalization && (
                    <div className="flex flex-wrap gap-2 mt-2" data-testid="preview-personalization-chips">
                      {p?.energyPattern && (
                        <Badge
                          variant="outline"
                          className="border-[#C06B3E]/50 text-[#C06B3E] bg-[#C06B3E]/10 text-sm"
                          data-testid="chip-energy"
                        >
                          {ENERGY_LABEL[p.energyPattern] ?? p.energyPattern}
                        </Badge>
                      )}
                      {p?.timeBudgetMinutes ? (
                        <Badge
                          variant="outline"
                          className="border-[#C06B3E]/50 text-[#C06B3E] bg-[#C06B3E]/10 text-sm"
                          data-testid="chip-time-budget"
                        >
                          {p.timeBudgetMinutes} min budget
                        </Badge>
                      ) : null}
                      {goalCount > 0 && (
                        <Badge
                          variant="outline"
                          className="border-[#C06B3E]/50 text-[#C06B3E] bg-[#C06B3E]/10 text-sm"
                          data-testid="chip-goal-count"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {goalCount} goal{goalCount === 1 ? "" : "s"} highlighted
                        </Badge>
                      )}
                      {p?.capReason && (
                        <Badge
                          variant="outline"
                          className="border-[#C06B3E]/50 text-[#C06B3E] bg-[#C06B3E]/10 text-sm"
                          data-testid="chip-cap-reason"
                        >
                          Capped: {p.capReason}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-[#C06B3E] text-sm font-semibold uppercase tracking-widest">
                <Footprints className="h-4 w-4" />
                Begin Today's Session
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
      </Link>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY LOOP CARD
// Morning brief (AI trend read) → structured log (exercises, habits, mood) →
// completion badge. Sits above the NeverZero audit hero so the loop flows
// naturally: brief → log → rep → audit → tomorrow.
// ─────────────────────────────────────────────────────────────────────────────

const LOOP_EXERCISES = [
  { id: "arm", label: "Arm exercises", icon: Dumbbell },
  { id: "leg", label: "Leg exercises", icon: Footprints },
  { id: "balance", label: "Balance", icon: Target },
  { id: "walking", label: "Walking", icon: Activity },
  { id: "speech", label: "Speech practice", icon: MessageCircle },
  { id: "fine_motor", label: "Fine motor", icon: PenLine },
  { id: "stretching", label: "Stretching", icon: Heart },
  { id: "cardio", label: "Cardio", icon: TrendingUp },
];

const LOOP_HABITS = [
  { id: "meds", label: "Took meds", icon: Pill },
  { id: "water", label: "Drank water", icon: Droplets },
  { id: "sleep", label: "Slept 7+ hrs", icon: Moon },
  { id: "meditated", label: "Meditated", icon: Brain },
  { id: "journaled", label: "Journaled", icon: PenLine },
  { id: "squad", label: "Called my squad", icon: PhoneCall },
];

const ENERGY_LABELS = ["Empty", "Low", "Okay", "Good", "Charged"];
const MOOD_LABELS   = ["Rough", "Hard", "Okay", "Good", "Great"];

type DailyBrief = { brief: string; focusItems: string[]; fromCache: boolean; isPremium?: boolean };

// ── Spotify Daily Reps banner — shows inside the log form ─────────────────
// Queries Spotify for 3 recovery-focus tracks and renders quick-open links.
// Renders null when Spotify isn't configured or returns no results.
function SpotifyRepsBanner() {
  const { data: status } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/spotify/status"],
    staleTime: Infinity,
  });

  const { data: tracks } = useQuery<any[]>({
    queryKey: ["/api/spotify/search/tracks", "recovery-reps"],
    queryFn: async () => {
      const res = await fetch("/api/spotify/search/tracks?q=stroke+recovery+focus+motivation&limit=3", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: status?.configured === true,
    staleTime: 30 * 60_000,
    retry: false,
  });

  if (!status?.configured || !tracks?.length) return null;

  return (
    <div className="mb-5 rounded-lg border border-[#1DB95433] bg-[#1DB95408] p-3" data-testid="spotify-reps-banner">
      <div className="flex items-center gap-2 mb-2.5">
        <Music2 className="h-3.5 w-3.5 text-[#1DB954]" />
        <p className="text-sm font-semibold uppercase tracking-widest text-[#1DB954]">Sound for your reps</p>
      </div>
      <div className="space-y-1.5">
        {tracks.slice(0, 3).map((t: any) => (
          <a
            key={t.id}
            href={t.spotifyUrl || `https://open.spotify.com/track/${t.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md hover:bg-[#1DB95415] transition-colors group"
            data-testid={`spotify-track-${t.id}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {t.albumArt && (
                <img src={t.albumArt} alt="" className="w-7 h-7 rounded shrink-0 object-cover" />
              )}
              <div className="min-w-0">
                <p className="text-base font-medium text-[#1C1917] truncate">{t.name}</p>
                <p className="text-base text-[#78716C] truncate">{t.artist}</p>
              </div>
            </div>
            <ExternalLink className="h-3 w-3 text-[#1DB954] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  );
}


function DailyLoopCard() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [logOpen, setLogOpen]                     = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits]       = useState<string[]>([]);
  const [focusChecked, setFocusChecked]            = useState([false, false, false]);
  const [energy, setEnergy]                        = useState(3); // 1-5
  const [mood, setMood]                            = useState(3); // 1-5
  const [winText, setWinText]                      = useState("");
  const [sosState, setSosState]                    = useState<"survive" | "organize" | "strive" | null>(null);

  const { data: brief, isLoading: briefLoading } = useQuery<DailyBrief>({
    queryKey: ["/api/recovery/daily-loop/brief"],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/recovery/daily-loop/brief", {});
      return res.json();
    },
    enabled: isAuthenticated,
    staleTime: 60 * 60_000,
    retry: false,
  });

  const { data: todayCheckin, isLoading: checkinLoading } = useQuery<any>({
    queryKey: ["/api/recovery/checkin/today"],
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  const { data: audit } = useQuery<{ verdict: string | null; tomorrow: string | null; streak: number; streakBand: string; todayCount: number }>({
    queryKey: ["/api/recovery/never-zero/report", "hero"],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/recovery/never-zero/report", { force: false });
      return res.json();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  const logMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/recovery/checkin", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/checkin/today"] });
      setLogOpen(false);
      toast({ title: "Day logged", description: "Sasquatch has your data. Go log your reps." });
    },
    onError: () => {
      toast({ title: "Error", description: "Couldn't save — try again.", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    logMutation.mutate({
      exercisesLogged: selectedExercises.map((name) => ({ name })),
      habitsCompleted: selectedHabits,
      moodScore:   mood   * 2,
      energyScore: energy * 2,
      winsToday: winText.trim() || undefined,
      sosState: sosState || undefined,
    });
  };

  const toggleExercise = (id: string) =>
    setSelectedExercises((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleHabit = (id: string) =>
    setSelectedHabits((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  if (!isAuthenticated) return null;
  if (briefLoading || checkinLoading) {
    return (
      <section className="mb-6" data-testid="section-daily-loop-loading">
        <div className="rounded-xl border border-[#E2C2A4]/30 bg-white p-5 flex items-center gap-3">
          <Loader2 className="h-4 w-4 text-[#C06B3E] animate-spin shrink-0" />
          <span className="text-sm text-[#78716C] uppercase tracking-widest">Sasquatch is reading your week…</span>
        </div>
      </section>
    );
  }

  const hasCheckin = !!todayCheckin;
  const hasAuditVerdict = !!(audit?.verdict && (audit?.todayCount ?? 0) > 0);
  const checkinExercises: string[] = Array.isArray(todayCheckin?.exercisesLogged)
    ? todayCheckin.exercisesLogged.map((e: any) => e.name)
    : [];
  const checkinHabits: string[] = Array.isArray(todayCheckin?.habitsCompleted)
    ? todayCheckin.habitsCompleted
    : [];
  const checkinSos: string | null =
    (todayCheckin as any)?.sosState ?? (todayCheckin as any)?.sos_state ?? null;
  const focusItems = brief?.focusItems ?? [];

  // ── STATE: Day fully complete (checkin + audit)
  if (hasCheckin && hasAuditVerdict) {
    return (
      <section className="mb-6" data-testid="section-daily-loop-complete">
        <div
          className="rounded-xl border-2 p-5"
          style={{ borderColor: "#22c55e44", background: "linear-gradient(135deg, #22c55e11, #FDFBF7 60%)" }}
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm uppercase tracking-[0.3em] text-green-400 font-bold mb-1">Daily Loop Complete</p>
              {audit?.verdict && (
                <p className="text-base text-[#1C1917] leading-relaxed mb-2" data-testid="text-loop-verdict">{audit.verdict}</p>
              )}
              {audit?.tomorrow && (
                <p className="text-base text-[#78716C] italic flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-[#C06B3E]" />
                  Tomorrow: {audit.tomorrow}
                </p>
              )}
              {(checkinExercises.length > 0 || checkinHabits.length > 0 || checkinSos) && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {checkinSos && (
                    <span className="text-sm px-2 py-1 rounded-full bg-[#1C1917] text-[#E2C2A4] border border-[#1C1917] uppercase tracking-wide" data-testid="badge-sos-state">
                      {checkinSos} day
                    </span>
                  )}
                  {checkinExercises.map((ex) => (
                    <span key={ex} className="text-sm px-2 py-1 rounded-full bg-[#C06B3E]/15 text-[#C06B3E] border border-[#C06B3E]/25">{ex}</span>
                  ))}
                  {checkinHabits.map((h) => (
                    <span key={h} className="text-sm px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{h}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── STATE: Checkin logged, waiting on reps/audit
  if (hasCheckin && !hasAuditVerdict) {
    return (
      <section className="mb-6" data-testid="section-daily-loop-logged">
        <div className="rounded-xl border border-[#C06B3E]/30 bg-[#C06B3E]/05 p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#C06B3E]" />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E] font-bold">
                  Day logged{checkinSos ? ` — ${checkinSos} day` : ''}
                </p>
                <p className="text-base text-[#78716C] mt-0.5">
                  {checkinExercises.length > 0 ? checkinExercises.join(', ') : 'Exercises recorded'}
                  {checkinHabits.length > 0 ? ` · ${checkinHabits.length} habit${checkinHabits.length !== 1 ? 's' : ''}` : ''}
                </p>
              </div>
            </div>
            <Link
              href="/recovery/never-zero"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#C06B3E] uppercase tracking-widest"
              data-testid="link-log-reps"
            >
              Log your reps <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ── STATE: Inline log form open
  if (logOpen) {
    return (
      <section className="mb-6" data-testid="section-daily-loop-form">
        <div className="rounded-xl border-2 border-[#C06B3E] bg-white p-6">
          <div className="flex items-center gap-2 mb-5">
            <ClipboardList className="h-4 w-4 text-[#C06B3E]" />
            <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E] font-bold">Log today's progress</p>
          </div>

          {/* S.O.S. state — doctrine: name the day before you fight it */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-[#78716C] uppercase tracking-widest mb-2">What kind of day is it? (S.O.S.)</p>
            <div className="flex flex-wrap gap-2">
              {([
                { id: "survive",  label: "Survive",  hint: "Bare minimum. Don't quit." },
                { id: "organize", label: "Organize", hint: "Rebuild structure." },
                { id: "strive",   label: "Strive",   hint: "Attack. Push edges." },
              ] as const).map(({ id, label, hint }) => {
                const active = sosState === id;
                return (
                  <button
                    key={id}
                    data-testid={`toggle-sos-${id}`}
                    onClick={() => setSosState(active ? null : id)}
                    title={hint}
                    className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C06B3E] focus-visible:ring-offset-2 ${
                      active
                        ? "bg-[#C06B3E] text-black border-[#C06B3E]"
                        : "bg-transparent text-[#78716C] border-[#E2C2A4]/30 hover:border-[#C06B3E]/50"
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                    {label}
                  </button>
                );
              })}
            </div>
            {sosState && (
              <p className="text-sm text-[#78716C] mt-1.5 italic">
                {sosState === "survive" && "Survive day: the only mission is don't quit. One rep counts."}
                {sosState === "organize" && "Organize day: line up the systems. Steady beats heroic."}
                {sosState === "strive" && "Strive day: add a rep, chase a flicker, push an edge."}
              </p>
            )}
          </div>

          {/* Exercises */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-[#78716C] uppercase tracking-widest mb-2">Exercises done</p>
            <div className="flex flex-wrap gap-2">
              {LOOP_EXERCISES.map(({ id, label }) => {
                const active = selectedExercises.includes(id);
                return (
                  <button
                    key={id}
                    data-testid={`toggle-exercise-${id}`}
                    onClick={() => toggleExercise(id)}
                    className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C06B3E] focus-visible:ring-offset-2 ${
                      active
                        ? "bg-[#C06B3E] text-black border-[#C06B3E]"
                        : "bg-transparent text-[#78716C] border-[#E2C2A4]/30 hover:border-[#C06B3E]/50"
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habits */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-[#78716C] uppercase tracking-widest mb-2">Habits completed</p>
            <div className="flex flex-wrap gap-2">
              {LOOP_HABITS.map(({ id, label }) => {
                const active = selectedHabits.includes(id);
                return (
                  <button
                    key={id}
                    data-testid={`toggle-habit-${id}`}
                    onClick={() => toggleHabit(id)}
                    className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
                      active
                        ? "bg-green-500 text-black border-green-500"
                        : "bg-transparent text-[#78716C] border-[#E2C2A4]/30 hover:border-green-500/50"
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy + Mood */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-sm font-semibold text-[#78716C] uppercase tracking-widest mb-2">Energy</p>
              <div className="flex gap-1.5">
                {ENERGY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    data-testid={`energy-${i + 1}`}
                    onClick={() => setEnergy(i + 1)}
                    title={label}
                    className={`min-h-[44px] min-w-[44px] rounded-md text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C06B3E] focus-visible:ring-offset-2 ${
                      energy === i + 1
                        ? "bg-[#C06B3E] text-black border-[#C06B3E]"
                        : "bg-transparent text-[#A8A29E] border-[#E2C2A4]/30 hover:border-[#C06B3E]/50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <p className="text-base text-[#78716C] mt-1">{ENERGY_LABELS[energy - 1]}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#78716C] uppercase tracking-widest mb-2">Mood</p>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_LABELS.map((label, i) => (
                  <button
                    key={i}
                    data-testid={`mood-${i + 1}`}
                    onClick={() => setMood(i + 1)}
                    title={label}
                    className={`min-h-[44px] min-w-[44px] rounded-md text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C06B3E] focus-visible:ring-offset-2 ${
                      mood === i + 1
                        ? "bg-[#C06B3E] text-black border-[#C06B3E]"
                        : "bg-transparent text-[#A8A29E] border-[#E2C2A4]/30 hover:border-[#C06B3E]/50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <p className="text-base text-[#78716C] mt-1">{MOOD_LABELS[mood - 1]}</p>
            </div>
          </div>

          {/* Spotify Daily Reps — offer recovery playlist when logging reps */}
          <SpotifyRepsBanner />

          {/* Win */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-[#78716C] uppercase tracking-widest mb-2">Win today (optional)</p>
            <input
              data-testid="input-win-today"
              type="text"
              placeholder="One thing that moved — any size"
              value={winText}
              onChange={(e) => setWinText(e.target.value)}
              maxLength={200}
              className="w-full bg-white border border-[#E2C2A4]/30 rounded-lg px-3 py-2 text-base text-[#1C1917] placeholder-gray-600 focus:outline-none focus:border-[#C06B3E]/50 focus-visible:ring-2 focus-visible:ring-[#C06B3E] focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex gap-3">
            <Button
              data-testid="button-save-day"
              onClick={handleSubmit}
              disabled={logMutation.isPending}
              className="bg-[#C06B3E] hover:bg-[#C06B3E] text-black font-bold"
            >
              {logMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save my day"}
            </Button>
            <Button
              data-testid="button-cancel-log"
              variant="ghost"
              onClick={() => setLogOpen(false)}
              className="text-[#A8A29E]"
            >
              Cancel
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // ── STATE: Morning brief (default — no checkin yet)
  return (
    <section className="mb-6" data-testid="section-daily-loop-brief">
      <div
        className="rounded-xl border-2 p-5"
        style={{ borderColor: "#C06B3E44", background: "linear-gradient(135deg, #C06B3E0d, #FDFBF7 55%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-[#C06B3E]" />
            <p className="text-sm uppercase tracking-[0.3em] text-[#C06B3E] font-bold">Daily Accountability Loop</p>
          </div>
          {audit && (
            <Badge className="text-sm border" style={{ background: "#C06B3E15", color: "#C06B3E", borderColor: "#C06B3E44" }}>
              Day {audit.streak ?? 0}
            </Badge>
          )}
        </div>

        {/* Morning brief */}
        {brief?.brief && (
          <div className="mb-4">
            <p className="text-sm uppercase tracking-widest text-[#78716C] mb-1.5">Sasquatch's morning read</p>
            <p className="text-base text-[#1C1917] leading-relaxed italic" data-testid="text-morning-brief">
              "{brief.brief}"
            </p>
            {brief.isPremium === false && (
              <Link href="/recovery/premium" className="inline-flex min-h-[44px] items-center mt-1">
                <span className="text-sm uppercase tracking-widest text-[#C06B3E]/70 hover:text-[#C06B3E] transition-colors">
                  Upgrade for personalized briefs →
                </span>
              </Link>
            )}
          </div>
        )}

        {/* Focus items */}
        {focusItems.length > 0 && (
          <div className="mb-5">
            <p className="text-sm uppercase tracking-widest text-[#78716C] mb-2">Today's focus</p>
            <div className="space-y-2">
              {focusItems.map((item, i) => (
                <button
                  key={i}
                  data-testid={`focus-item-${i}`}
                  onClick={() => setFocusChecked((prev) => {
                    const next = [...prev];
                    next[i] = !next[i];
                    return next;
                  })}
                  className="flex items-center gap-3 w-full text-left min-h-[44px] py-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C06B3E] focus-visible:ring-offset-2 rounded"
                >
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      focusChecked[i]
                        ? "bg-[#C06B3E] border-[#C06B3E]"
                        : "border-[#555] group-hover:border-[#C06B3E]/60"
                    }`}
                  >
                    {focusChecked[i] && <Check className="h-2.5 w-2.5 text-black" />}
                  </div>
                  <span className={`text-base transition-all ${focusChecked[i] ? "line-through text-[#A8A29E]" : "text-[#78716C]"}`}>
                    {item}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          data-testid="button-log-today"
          onClick={() => setLogOpen(true)}
          className="flex items-center gap-2 min-h-[44px] text-sm font-semibold text-[#C06B3E] uppercase tracking-widest hover-elevate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C06B3E] focus-visible:ring-offset-2 rounded"
        >
          <ClipboardList className="h-4 w-4" />
          Log today's progress
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
