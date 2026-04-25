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
  Play, Brain, ChevronDown, Footprints
} from "lucide-react";
import SixtyDayTracker from "@/components/recovery/SixtyDayTracker";
import MyPathRecommender from "@/components/recovery/MyPathRecommender";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import FadeUpSection from "@/components/FadeUpSection";
import SasquatchQuoteModal from "@/components/SasquatchQuoteModal";

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

export default function RecoveryDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: personaData } = useQuery<{ persona: { name: string; creed: string; archetypeKey: string; accentColor: string; triggerCue: string | null } | null }>({
    queryKey: ['/api/persona/me'],
  });
  const persona = personaData?.persona ?? null;
  const personaAccent = persona?.accentColor || "#C9941A";
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

  const { data: dashboard, isLoading } = useQuery<any>({
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
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="animate-pulse text-[#C9941A] text-xl">Loading your command center...</div>
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

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeUpSection>
        <section className="mb-8">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <h1 className="text-4xl md:text-5xl font-black mb-3" data-testid="text-dashboard-title">
                Welcome back,{" "}
                <span style={{ color: personaAccent }}>
                  {persona?.name || user?.firstName || "Warrior"}
                </span>
              </h1>
              {persona?.creed ? (
                <p className="text-gray-300 text-lg italic" data-testid="text-persona-creed">"{persona.creed}"</p>
              ) : (
                <p className="text-gray-300 text-lg italic" data-testid="text-quote">"{randomQuote}"</p>
              )}
              {persona?.triggerCue && (
                <p className="text-xs text-gray-500 mt-2" data-testid="text-persona-trigger">
                  <span className="uppercase tracking-wide" style={{ color: personaAccent }}>Trigger:</span> {persona.triggerCue}
                </p>
              )}
              <div className="mt-3">
                <Link href="/recovery/forge">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#333] hover:bg-[#1a1a1a]"
                    style={{ color: personaAccent, borderColor: `${personaAccent}66` }}
                    data-testid={persona ? "button-reforge-persona" : "button-forge-persona"}
                  >
                    {persona ? "Re-forge your beast" : "Forge Your Beast"}
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-[#333] bg-[#1a1a1a]">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="#333" strokeWidth="8" fill="none" />
                  <circle 
                    cx="50" cy="50" r="45" 
                    stroke="#C9941A" strokeWidth="8" fill="none"
                    strokeDasharray={`${recoveryScore * 2.83} 283`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white" data-testid="text-recovery-score">{recoveryScore}</span>
                  <span className="text-xs text-gray-400 uppercase">Recovery Score</span>
                </div>
              </div>
              
              <div className="mt-4 bg-[#C9941A]/10 border border-[#C9941A]/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="h-6 w-6 text-[#C9941A]" />
                  <span className="text-2xl font-bold text-white" data-testid="text-streak">{streak.currentStreak}</span>
                  <span className="text-gray-300">day streak</span>
                </div>
                <p className="text-xs text-[#C9941A] font-semibold uppercase tracking-wider">
                  NEVER ZERO - Keep the signal alive
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SURVIVOR OS PLAN CTA */}
        <section className="mb-6">
          <Link href="/recovery/me">
            <a
              className="block rounded-xl border border-[#C9941A]/40 bg-gradient-to-r from-[#1a1610] via-[#141414] to-[#1a1610] p-5 hover-elevate"
              data-testid="link-recovery-me"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-md bg-[#C9941A] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9941A]">Survivor OS</p>
                    <p className="text-base font-bold text-white">Open your personal recovery plan</p>
                    <p className="text-xs text-gray-500">Sasquatch Scale, AI plan, today's prescription</p>
                  </div>
                </div>
                <span className="text-xs text-[#C9941A] font-semibold uppercase tracking-widest">Open →</span>
              </div>
            </a>
          </Link>
        </section>

        {/* BONFIRE — Today's adaptive session */}
        <section className="mb-8" data-testid="section-bonfire-hero">
          <Link href="/recovery/today">
            <a
              className="block group rounded-xl border-2 border-[#C9941A] bg-gradient-to-br from-[#C9941A]/20 via-[#1a1a1a] to-[#1a1a1a] hover-elevate active-elevate-2 p-6"
              data-testid="link-bonfire-hero"
              aria-label="Start today's Bonfire session"
            >
              <div className="flex items-start gap-5">
                <div className="hidden sm:flex h-16 w-16 rounded-full bg-[#C9941A] items-center justify-center shrink-0 shadow-[0_0_24px_rgba(201,148,26,0.45)]">
                  <Flame className="h-8 w-8 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9941A] font-bold mb-1">
                    Today's Session · The Bonfire
                  </p>
                  <h2
                    className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2"
                    style={{ fontFamily: "Playfair Display, Georgia, serif" }}
                  >
                    What to do, right now.
                  </h2>
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">
                    One adaptive walkthrough, tuned to how yesterday felt. Ends with a
                    supervised walking cooldown <span className="text-[#C9941A] font-semibold">when you're ready for it.</span>
                  </p>
                  <div className="flex items-center gap-2 text-[#C9941A] text-sm font-semibold uppercase tracking-widest">
                    <Footprints className="h-4 w-4" />
                    Begin Today's Session
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </a>
          </Link>
        </section>

        {/* SURVIVOR SHOP — Curated Amazon affiliate gear */}
        <section className="mb-8" data-testid="section-survivor-shop">
          <Link href="/recovery/shop">
            <a
              className="block rounded-xl border border-[#C9941A]/40 bg-gradient-to-r from-[#1a1610] via-[#141414] to-[#1a1610] p-5 hover-elevate"
              data-testid="link-survivor-shop"
              aria-label="Open the Survivor Shop"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-md bg-[#C9941A] flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9941A]">Survivor Shop</p>
                    <p className="text-base font-bold text-white">The gear that actually helped</p>
                    <p className="text-xs text-gray-500">AFOs, putty, grab bars, wedge pillows — survivor-curated, never prescriptive</p>
                  </div>
                </div>
                <span className="text-xs text-[#C9941A] font-semibold uppercase tracking-widest">Browse →</span>
              </div>
            </a>
          </Link>
        </section>

        {/* SQUATCHY ANTHEM HERO */}
        <section className="mb-8" data-testid="section-anthem-hero">
          <Link href="/recovery/anthem">
            <a
              className="block group rounded-xl border border-[#C9941A]/40 bg-gradient-to-br from-[#C9941A]/15 via-[#1a1a1a] to-[#1a1a1a] hover-elevate active-elevate-2"
              data-testid="link-anthem-hero"
              aria-label="Squatchy — the recovery anthem. Watch the video."
            >
              <div className="grid md:grid-cols-[280px_1fr] gap-0">
                <div className="relative bg-black aspect-video md:aspect-auto md:min-h-[180px] rounded-t-xl md:rounded-l-xl md:rounded-tr-none overflow-hidden">
                  <img
                    src="/videos/squatchy-poster.jpg"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a1a]/40 pointer-events-none" />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-[#C9941A] text-black font-bold tracking-widest text-[10px] no-default-hover-elevate no-default-active-elevate">
                      <Play className="h-3 w-3 mr-1" /> NEW ANTHEM
                    </Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-[#C9941A]/95 group-hover:bg-[#C9941A] flex items-center justify-center shadow-lg transition-colors">
                      <Play className="h-6 w-6 text-black ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9941A] font-bold mb-2">
                    Stroked-Out Sasquatch · Rock Anthem
                  </p>
                  <h2
                    className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2"
                    style={{ fontFamily: "Playfair Display, Georgia, serif" }}
                  >
                    Squatchy
                  </h2>
                  <p className="text-sm text-gray-300 leading-relaxed mb-4 max-w-xl">
                    From wheelchair to warrior. Heart still thumpin'? Life still pumpin'.{" "}
                    <span className="text-[#C9941A] font-semibold">Get up. Get loud. Get Squatchy.</span>
                  </p>
                  <div className="flex items-center gap-2 text-[#C9941A] text-sm font-semibold uppercase tracking-widest">
                    Watch & Share
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </a>
          </Link>
        </section>

        </FadeUpSection>

        {/* CHALLENGE COMMAND CENTER */}
        <FadeUpSection delay={100}>
        <section className="mb-8" data-testid="section-challenge-command">
          <div className="bg-gradient-to-r from-[#C9941A]/15 via-[#1a1a1a] to-[#1a1a1a] border border-[#C9941A]/30 rounded-xl p-6 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C9941A] flex items-center justify-center">
                  <Flame className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">66-Day Challenge Command Center</h2>
                  <p className="text-xs text-gray-400">Your daily mission — no excuses, no exceptions.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-center px-4 py-2 rounded-lg bg-[#0D0D0D] border border-[#333]">
                  <div className="text-2xl font-black text-[#C9941A]" data-testid="text-command-streak">{streak.currentStreak}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Day Streak</div>
                </div>
                <div className="text-center px-4 py-2 rounded-lg bg-[#0D0D0D] border border-[#333]">
                  <div className="text-2xl font-black text-white" data-testid="text-command-score">{recoveryScore}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Score</div>
                </div>
              </div>
            </div>

            {/* Daily Mission Cards */}
            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              <div className={`rounded-lg p-4 border ${todayCheckin ? "bg-[#C9941A]/10 border-[#C9941A]/40" : "bg-[#0D0D0D] border-[#333]"}`} data-testid="mission-checkin">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className={`h-4 w-4 ${todayCheckin ? "text-[#C9941A]" : "text-gray-500"}`} />
                  <span className="text-sm font-bold text-white">Daily Check-in</span>
                  {todayCheckin && <CheckCircle2 className="h-4 w-4 text-[#C9941A] ml-auto" />}
                </div>
                <p className="text-xs text-gray-400 mb-3">Log mood, energy, pain. Run your audit.</p>
                {!todayCheckin && (
                  <button
                    className="text-xs text-[#C9941A] font-bold flex items-center gap-1"
                    onClick={() => {
                      const el = document.querySelector('[data-testid="card-checkin"]');
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    data-testid="button-go-checkin"
                  >
                    Do it now <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                {todayCheckin && <span className="text-xs text-[#C9941A] font-bold">Complete</span>}
              </div>

              <div className={`rounded-lg p-4 border ${habits.some((h: any) => h.logs?.some((l: any) => new Date(l.logDate).toDateString() === new Date().toDateString() && l.isCompleted)) ? "bg-[#C9941A]/10 border-[#C9941A]/40" : "bg-[#0D0D0D] border-[#333]"}`} data-testid="mission-habits">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-bold text-white">Habit Stack</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">Complete your tracked recovery habits.</p>
                <Link href="/recovery/builder">
                  <span className="text-xs text-[#C9941A] font-bold flex items-center gap-1">
                    Manage habits <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>

              <div className="rounded-lg p-4 border bg-[#0D0D0D] border-[#333]" data-testid="mission-lesson">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-bold text-white">Today's Lesson</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">Continue your Sasquatch curriculum.</p>
                <Link href="/recovery/academy">
                  <span className="text-xs text-[#C9941A] font-bold flex items-center gap-1">
                    Go to Academy <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Phase Progress Banner */}
            <div className="bg-[#0D0D0D] rounded-lg p-4 border border-[#333] flex flex-wrap items-center gap-4">
              {[
                { name: "SURVIVAL PHASE", days: "Days 1–22", color: "#C9941A", icon: Target },
                { name: "BREAKTHROUGH PHASE", days: "Days 23–44", color: "#FF6B35", icon: Flame },
                { name: "OPTIMIZATION PHASE", days: "Days 45–66", color: "#22C55E", icon: Trophy },
              ].map(({ name, days, color, icon: Icon }) => {
                const totalDays = streak.totalActiveDays || 0;
                const [start, end] = name === "SURVIVAL PHASE" ? [1, 22] : name === "BREAKTHROUGH PHASE" ? [23, 44] : [45, 66];
                const isActive = totalDays >= start - 1 && totalDays < end;
                const isComplete = totalDays >= end;
                return (
                  <div key={name} className={`flex items-center gap-2 text-xs flex-1 min-w-fit ${isActive ? "opacity-100" : isComplete ? "opacity-60" : "opacity-30"}`} data-testid={`phase-status-${name.toLowerCase().split(" ")[0]}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center`} style={{ background: isComplete ? color : isActive ? `${color}33` : "#1a1a1a", border: `1px solid ${color}50` }}>
                      {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color }} /> : <Icon className="h-3 w-3" style={{ color }} />}
                    </div>
                    <div>
                      <div className="font-bold" style={{ color: isActive || isComplete ? color : "#666" }}>{name}</div>
                      <div className="text-gray-500">{days}</div>
                    </div>
                    {isActive && <Badge className="ml-auto text-xs border" style={{ background: `${color}20`, color, borderColor: `${color}40` }}>Active</Badge>}
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
          <Card className="bg-[#1a1a1a] border-[#333] p-6" data-testid="card-checkin">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#C9941A]" />
                Today's Check-in
              </h2>
              {todayCheckin && (
                <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                </Badge>
              )}
            </div>
            
            {todayCheckin ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Heart className="h-5 w-5 text-[#C9941A] mx-auto mb-1" />
                    <div className="text-2xl font-bold text-white">{todayCheckin.moodScore}/10</div>
                    <div className="text-xs text-gray-400">Mood</div>
                  </div>
                  <div className="text-center">
                    <Zap className="h-5 w-5 text-[#C9941A] mx-auto mb-1" />
                    <div className="text-2xl font-bold text-white">{todayCheckin.energyScore}/10</div>
                    <div className="text-xs text-gray-400">Energy</div>
                  </div>
                  <div className="text-center">
                    <Activity className="h-5 w-5 text-[#C9941A] mx-auto mb-1" />
                    <div className="text-2xl font-bold text-white">{todayCheckin.painScore}/10</div>
                    <div className="text-xs text-gray-400">Pain</div>
                  </div>
                </div>
                {todayCheckin.winsToday && (
                  <div className="bg-[#0D0D0D] rounded p-3 border border-[#333]">
                    <span className="text-xs text-gray-400 uppercase">Wins:</span>
                    <p className="text-sm text-gray-300">{todayCheckin.winsToday}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Skip escape hatch */}
                <Link href="/recovery/community">
                  <div className="text-center text-xs text-gray-600 hover:text-[#C9941A] cursor-pointer transition-colors pb-1" data-testid="link-skip-checkin">
                    Skip for now → Explore Community
                  </div>
                </Link>

                {/* MOOD tap buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-[#C9941A]" /> Mood
                    </label>
                    <span className="text-[#C9941A] font-bold text-xs">
                      {MOOD_OPTIONS.find(o => o.value === checkinForm.moodScore)?.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5" data-testid="mood-buttons">
                    {MOOD_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCheckinForm({ ...checkinForm, moodScore: opt.value })}
                        className={`py-3 rounded-lg text-xs font-bold border transition-colors ${
                          checkinForm.moodScore === opt.value
                            ? "bg-[#C9941A] text-black border-[#C9941A]"
                            : "bg-[#0D0D0D] text-gray-400 border-[#333] hover:border-[#C9941A]/50"
                        }`}
                        data-testid={`mood-${opt.value}`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* ENERGY tap buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-[#C9941A]" /> Energy
                    </label>
                    <span className="text-[#C9941A] font-bold text-xs">
                      {ENERGY_OPTIONS.find(o => o.value === checkinForm.energyScore)?.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5" data-testid="energy-buttons">
                    {ENERGY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCheckinForm({ ...checkinForm, energyScore: opt.value })}
                        className={`py-3 rounded-lg text-xs font-bold border transition-colors ${
                          checkinForm.energyScore === opt.value
                            ? "bg-[#C9941A] text-black border-[#C9941A]"
                            : "bg-[#0D0D0D] text-gray-400 border-[#333] hover:border-[#C9941A]/50"
                        }`}
                        data-testid={`energy-${opt.value}`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* PAIN tap buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-[#C9941A]" /> Pain
                    </label>
                    <span className={`font-bold text-xs ${
                      checkinForm.painScore >= 8 ? "text-red-400" : checkinForm.painScore >= 6 ? "text-orange-400" : "text-[#C9941A]"
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
                        className={`py-3 rounded-lg text-xs font-bold border transition-colors ${
                          checkinForm.painScore === opt.value
                            ? opt.value >= 8 ? "bg-red-500 text-white border-red-500"
                              : opt.value >= 6 ? "bg-orange-500 text-white border-orange-500"
                              : "bg-[#C9941A] text-black border-[#C9941A]"
                            : "bg-[#0D0D0D] text-gray-400 border-[#333] hover:border-[#C9941A]/50"
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
                  className="w-full bg-[#C9941A] text-black font-bold"
                  data-testid="button-checkin-submit"
                >
                  {checkinMutation.isPending ? "Saving..." : "Submit Check-in"}
                </Button>

                {/* Optional notes toggle */}
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-600 hover:text-gray-300 transition-colors py-1"
                  data-testid="button-toggle-notes"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showNotes ? "rotate-180" : ""}`} />
                  {showNotes ? "Hide notes" : "Add notes (optional)"}
                </button>

                {/* Optional Sasquatch Daily Audit */}
                {showNotes && (
                  <div className="space-y-3 pt-2 border-t border-[#222]">
                    <div className="bg-[#C9941A]/10 border border-[#C9941A]/30 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-[#C9941A] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Flame className="w-4 h-4" />
                        Sasquatch Daily Audit
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-400 mb-1.5 block">1. What did I BUILD today?</label>
                          <Textarea
                            placeholder="Every small action counts — a flicker is still progress..."
                            value={checkinForm.winsToday}
                            onChange={(e) => setCheckinForm({ ...checkinForm, winsToday: e.target.value })}
                            className="bg-[#1a1a1a] border-[#333] text-white text-sm min-h-[60px]"
                            data-testid="input-wins"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1.5 block">2. What BROKE?</label>
                          <Textarea
                            placeholder="Honesty heals faster than denial..."
                            value={checkinForm.challengesToday}
                            onChange={(e) => setCheckinForm({ ...checkinForm, challengesToday: e.target.value })}
                            className="bg-[#1a1a1a] border-[#333] text-white text-sm min-h-[60px]"
                            data-testid="input-challenges"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1.5 block">3. Tomorrow's target?</label>
                          <Textarea
                            placeholder="Your next rep, your next step..."
                            value={checkinForm.tomorrowsTarget}
                            onChange={(e) => setCheckinForm({ ...checkinForm, tomorrowsTarget: e.target.value })}
                            className="bg-[#1a1a1a] border-[#333] text-white text-sm min-h-[60px]"
                            data-testid="input-target"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1.5 block">Gratitude</label>
                          <Textarea
                            placeholder="One thing I'm grateful for..."
                            value={checkinForm.gratitude}
                            onChange={(e) => setCheckinForm({ ...checkinForm, gratitude: e.target.value })}
                            className="bg-[#1a1a1a] border-[#333] text-white text-sm min-h-[60px]"
                            data-testid="input-gratitude"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleCheckinSubmit}
                      disabled={checkinMutation.isPending}
                      className="w-full bg-[#C9941A] text-black font-bold"
                      data-testid="button-checkin-submit-notes"
                    >
                      {checkinMutation.isPending ? "Saving..." : "Submit with Notes"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="bg-[#1a1a1a] border-[#333] p-6" data-testid="card-program">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#C9941A]" />
                Program Progress
              </h2>
            </div>
            
            {enrollment ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{enrollment.program?.name || "Recovery Program"}</span>
                    <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30">
                      {enrollment.program?.tier || "Active"}
                    </Badge>
                  </div>
                  <Progress value={enrollment.progressPercentage || 0} className="h-3 bg-[#333] [&>div]:bg-[#C9941A]" />
                  <div className="flex justify-between mt-1 text-sm text-gray-400">
                    <span>{enrollment.progressPercentage || 0}% complete</span>
                    <span>{enrollment.program?.estimatedWeeks || 12} weeks</span>
                  </div>
                </div>
                
                {enrollment.currentModule && (
                  <div className="bg-[#0D0D0D] rounded-lg p-4 border border-[#333]">
                    <div className="text-xs text-gray-400 uppercase mb-1">Current Module</div>
                    <div className="font-semibold text-white">{enrollment.currentModule.title}</div>
                    {enrollment.currentLesson && (
                      <div className="text-sm text-gray-400 mt-1">Lesson: {enrollment.currentLesson.title}</div>
                    )}
                  </div>
                )}
                
                <Link href="/recovery/academy">
                  <Button className="w-full bg-[#C9941A] text-black font-bold" data-testid="button-continue-learning">
                    Continue Learning
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Start your personalized recovery journey</p>
                <Link href="/recovery/builder">
                  <Button className="bg-[#C9941A] text-black font-bold" data-testid="button-start-program">
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
          <Card className="bg-[#1a1a1a] border-[#333] p-6" data-testid="card-habits">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#C9941A]" />
                66-Day Habit Tracker
              </h2>
              <Badge className="bg-[#0D0D0D] text-gray-300 border-[#333]">{streak.totalActiveDays}/66 days</Badge>
            </div>
            
            <div className="grid grid-cols-11 gap-1 mb-6">
              {Array.from({ length: 66 }).map((_, i) => {
                const isComplete = i < streak.totalActiveDays;
                return (
                  <div 
                    key={i}
                    className={`w-5 h-5 rounded-sm ${isComplete ? 'bg-[#C9941A]' : 'bg-[#333]'}`}
                    title={`Day ${i + 1}`}
                    data-testid={`habit-day-${i + 1}`}
                  />
                );
              })}
            </div>
            
            {habits.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-400 mb-2">Today's Habits</div>
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
                      className="flex items-center gap-3 p-3 bg-[#0D0D0D] rounded-lg border border-[#333]"
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => habitLogMutation.mutate(habit.id)}
                        disabled={habitLogMutation.isPending}
                        data-testid={`checkbox-habit-${habit.id}`}
                        className="border-[#C9941A] data-[state=checked]:bg-[#C9941A]"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>
                          {habit.customName || habit.habitName}
                        </div>
                        <div className="text-xs text-gray-400">{habit.totalCompletions} completions</div>
                      </div>
                      <div className="text-sm text-[#C9941A]">{habit.currentStreak} day streak</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-3">No habits tracked yet</p>
                <Link href="/recovery/builder">
                  <Button variant="outline" className="border-[#C9941A] text-[#C9941A]" data-testid="button-add-habit">
                    Add New Habit
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="bg-[#1a1a1a] border-[#333] p-6" data-testid="card-milestones">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#C9941A]" />
                Milestones & Achievements
              </h2>
              <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30">
                <Star className="h-3 w-3 mr-1" /> {totalPoints} pts
              </Badge>
            </div>
            
            {milestones.length > 0 ? (
              <div className="space-y-3">
                {milestones.slice(0, 5).map((milestone: any) => (
                  <div 
                    key={milestone.id}
                    className="flex items-center gap-3 p-3 bg-[#0D0D0D] rounded-lg border border-[#333]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#C9941A]/20 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-[#C9941A]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{milestone.name}</div>
                      <div className="text-xs text-gray-400">{milestone.description}</div>
                    </div>
                    <Badge className="bg-[#333] text-gray-300 border-[#333]">+{milestone.pointsAwarded}</Badge>
                  </div>
                ))}
                <Link href="/recovery/achievements">
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-[#C9941A] text-[#C9941A]"
                    data-testid="button-view-achievements"
                  >
                    View All Achievements
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Complete check-ins and habits to earn milestones!</p>
                <Link href="/recovery/achievements">
                  <Button 
                    variant="outline" 
                    className="mt-4 border-[#C9941A] text-[#C9941A]"
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

        {/* Accountability Pod Section */}
        <FadeUpSection delay={300}>
        <Card className="bg-[#1a1a1a] border-[#333] p-6 mb-8" data-testid="card-accountability-pod">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-[#C9941A]" />
              My Accountability Pod
            </h2>
            {userPod && (
              <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30">
                {userPod.memberCount}/{userPod.maxMembers} members
              </Badge>
            )}
          </div>

          {userPod ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1" data-testid="text-pod-name">{userPod.name}</h3>
                {userPod.description && (
                  <p className="text-sm text-gray-400 mb-3">{userPod.description}</p>
                )}
                {userPod.focusArea && (
                  <Badge className="bg-[#0D0D0D] text-gray-300 border-[#333] mb-4">{userPod.focusArea}</Badge>
                )}
              </div>

              {/* Pod Members */}
              <div>
                <div className="text-sm text-gray-400 mb-3">Pod Members</div>
                <div className="flex flex-wrap gap-3" data-testid="pod-members-list">
                  {userPod.members?.map((member: any) => (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-2 bg-[#0D0D0D] rounded-full pr-3 border border-[#333]"
                      data-testid={`pod-member-${member.id}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profileImageUrl} />
                        <AvatarFallback className="bg-[#C9941A]/20 text-[#C9941A] text-xs">
                          {member.firstName?.[0] || "?"}{member.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-white">
                        {member.firstName || "Member"}
                        {member.role === "leader" && (
                          <Star className="h-3 w-3 inline ml-1 text-[#C9941A]" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pod Activity Feed */}
              {podActivity && podActivity.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Activity
                  </div>
                  <div className="space-y-2" data-testid="pod-activity-feed">
                    {podActivity.slice(0, 5).map((activity: any) => (
                      <div 
                        key={activity.id} 
                        className="flex items-center gap-3 p-3 bg-[#0D0D0D] rounded-lg border border-[#333]"
                        data-testid={`activity-${activity.id}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.profileImageUrl} />
                          <AvatarFallback className="bg-[#C9941A]/20 text-[#C9941A] text-xs">
                            {activity.firstName?.[0] || "?"}{activity.lastName?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{activity.firstName || "Member"}</span>
                            {activity.type === "checkin" && (
                              <Badge className="bg-[#C9941A]/20 text-[#C9941A] text-xs border-[#C9941A]/30">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Checked in
                              </Badge>
                            )}
                          </div>
                          {activity.winsToday && (
                            <p className="text-xs text-gray-400 truncate">{activity.winsToday}</p>
                          )}
                          {activity.moodScore && (
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
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
                className="border-[#333] text-gray-400"
                data-testid="button-leave-pod"
              >
                <DoorOpen className="h-4 w-4 mr-2" />
                {leavePodMutation.isPending ? "Leaving..." : "Leave Pod"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-4">
                <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Join an accountability pod for peer support</p>
                <p className="text-xs text-gray-400">Stay motivated with fellow recovery warriors</p>
              </div>

              {/* Open Pods to Join */}
              {openPods && openPods.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3">Available Pods</div>
                  <div className="space-y-2" data-testid="open-pods-list">
                    {openPods.slice(0, 3).map((pod: any) => (
                      <div 
                        key={pod.id}
                        className="flex items-center justify-between p-3 bg-[#0D0D0D] rounded-lg border border-[#333]"
                        data-testid={`open-pod-${pod.id}`}
                      >
                        <div>
                          <div className="font-medium text-white">{pod.name}</div>
                          <div className="text-xs text-gray-400">
                            {pod.memberCount}/{pod.maxMembers} members
                            {pod.focusArea && ` • ${pod.focusArea}`}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => joinPodMutation.mutate(pod.id)}
                          disabled={joinPodMutation.isPending}
                          className="bg-[#C9941A] text-black"
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
                      className="bg-[#C9941A] text-black"
                      data-testid="button-create-pod"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create a Pod
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create Accountability Pod</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Start a pod and invite other warriors to join your recovery journey.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Pod Name *</label>
                        <Input
                          placeholder="e.g., Morning Warriors"
                          value={newPodName}
                          onChange={(e) => setNewPodName(e.target.value)}
                          className="bg-[#1a1a1a] border-[#333] text-white"
                          data-testid="input-pod-name"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Description</label>
                        <Textarea
                          placeholder="What's your pod about?"
                          value={newPodDescription}
                          onChange={(e) => setNewPodDescription(e.target.value)}
                          className="bg-[#1a1a1a] border-[#333] text-white"
                          data-testid="input-pod-description"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Focus Area</label>
                        <Input
                          placeholder="e.g., Physical Therapy, Mindfulness"
                          value={newPodFocus}
                          onChange={(e) => setNewPodFocus(e.target.value)}
                          className="bg-[#1a1a1a] border-[#333] text-white"
                          data-testid="input-pod-focus"
                        />
                      </div>
                      <Button
                        onClick={handleCreatePod}
                        disabled={createPodMutation.isPending || !newPodName.trim()}
                        className="w-full bg-[#C9941A] text-black"
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
        <Card className="bg-[#1a1a1a] border-[#333] p-6 mb-8" data-testid="card-ai-coach">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#C9941A]" />
              AI Coach Insight
            </h2>
          </div>
          
          <div className="bg-gradient-to-r from-[#C9941A]/10 to-[#0D0D0D] rounded-lg p-6 border border-[#C9941A]/20">
            <p className="text-gray-300 mb-4">
              {todayCheckin 
                ? `Great check-in today! Your mood is at ${todayCheckin.moodScore}/10 and energy at ${todayCheckin.energyScore}/10. ${todayCheckin.moodScore >= 7 ? "You're doing amazing - keep that momentum going!" : "Remember, recovery isn't linear. Every day you show up matters."}`
                : "Hey warrior! Don't forget to complete your daily check-in. Tracking your progress is key to seeing how far you've come."}
            </p>
            <Button variant="outline" className="border-[#C9941A] text-[#C9941A]" data-testid="button-chat-coach">
              Chat with Sasquatch Coach
            </Button>
          </div>
        </Card>
        </FadeUpSection>

        <FadeUpSection delay={400}>
        <section className="mb-8">
          <Card className="bg-gradient-to-r from-[#C9941A]/20 to-[#1a1a1a] border-[#C9941A]/30 p-6" data-testid="card-donation-cta">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Gift the Rebuild</h3>
                <p className="text-gray-400 text-sm">
                  Every donation to The Stroke Recovery Academy funds coaching for a survivor who needs a builder's blueprint.
                  Gift a survivor one-on-one accountability coaching, motivation, and nutrition-focused advice from the Stroked-Out Sasquatch himself.
                </p>
              </div>
              <div className="flex gap-3">
                <a href="https://strokelyfe.org" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#C9941A] text-black font-bold" data-testid="button-donate">
                    <Heart className="w-4 h-4 mr-2" />
                    Donate Now
                  </Button>
                </a>
                <a href="https://strokerecoveryacademy.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-[#C9941A]/50 text-[#C9941A]" data-testid="button-coaching">
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
          <h2 className="text-xl font-bold mb-4 text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/recovery/survival-grid">
              <Card className="bg-[#1a1a1a] border-[#333] p-4 hover-elevate cursor-pointer" data-testid="action-survival-grid">
                <Grid3X3 className="h-8 w-8 text-[#C9941A] mb-2" />
                <div className="font-semibold text-white">Survival Grid</div>
                <div className="text-xs text-gray-400">Exercises & Protocols</div>
              </Card>
            </Link>

            <Link href="/recovery/brain-gym">
              <Card className="bg-[#1a1a1a] border-[#333] p-4 hover-elevate cursor-pointer" data-testid="action-brain-gym">
                <Brain className="h-8 w-8 text-[#C9941A] mb-2" />
                <div className="font-semibold text-white">Brain Gym</div>
                <div className="text-xs text-gray-400">Word Search · Crossword · Memory</div>
              </Card>
            </Link>

            <Link href="/recovery/community">
              <Card className="bg-[#1a1a1a] border-[#333] p-4 hover-elevate cursor-pointer" data-testid="action-community">
                <Users className="h-8 w-8 text-[#C9941A] mb-2" />
                <div className="font-semibold text-white">Community</div>
                <div className="text-xs text-gray-400">Share Your Progress</div>
              </Card>
            </Link>
            
            <Link href="/recovery/academy">
              <Card className="bg-[#1a1a1a] border-[#333] p-4 hover-elevate cursor-pointer" data-testid="action-academy">
                <BookOpen className="h-8 w-8 text-[#C9941A] mb-2" />
                <div className="font-semibold text-white">Academy</div>
                <div className="text-xs text-gray-400">Courses & Learning</div>
              </Card>
            </Link>
            
            <Link href="/marketplace">
              <Card className="bg-[#1a1a1a] border-[#333] p-4 hover-elevate cursor-pointer" data-testid="action-marketplace">
                <ShoppingBag className="h-8 w-8 text-[#C9941A] mb-2" />
                <div className="font-semibold text-white">Marketplace</div>
                <div className="text-xs text-gray-400">Recovery Tools</div>
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
      </main>
    </div>
  );
}
