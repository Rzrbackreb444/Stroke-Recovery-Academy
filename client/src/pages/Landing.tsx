import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import {
  Loader2, ArrowRight, Play, BrainCircuit, CalendarDays,
  Users, CheckCircle2, ShieldCheck, Activity, Star, Flame, Gift, BookOpen, Lock,
  MessageSquare, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO, {
  NICK_KREMERS_SCHEMA,
  STROKE_RECOVERY_ORG_SCHEMA,
  SASQUATCH_METHOD_SCHEMA,
  STROKE_CONDITION_SCHEMA,
} from "@/components/RecoverySEO";
import Footer from "@/components/Footer";
import heroWarrior from "@assets/hero-warrior-opt.webp";
import nickPortrait from "@assets/nick-portrait-opt.webp";
import manifestoStairs from "@assets/manifesto-stairs-opt.webp";
import cleanUi from "@assets/home-clean-ui-opt.webp";

const goToOnboarding = () => {
  window.location.href = "/recovery/onboarding";
};

type CommunityStats = { total: number; display: string; avatars: { src: string; name: string }[] };

function useCommunityStats() {
  const { data } = useQuery<CommunityStats>({
    queryKey: ["/api/stats/community"],
    staleTime: 5 * 60_000,
  });
  return data && data.total > 0 ? data : null;
}

function AvatarCluster({ avatars, border }: { avatars: { src: string; name: string }[]; border: string }) {
  const COLORS = ["#C06B3E", "#7C5C3A", "#A0522D", "#8B4513"];
  const slots = avatars.length > 0 ? avatars : [];
  const placeholders = Math.max(0, 4 - slots.length);
  return (
    <div className="flex -space-x-2" aria-hidden="true">
      {slots.map((av, i) => (
        <img
          key={i}
          src={av.src}
          alt={av.name}
          className={`w-8 h-8 rounded-full border-2 ${border} object-cover`}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ))}
      {Array.from({ length: placeholders }).map((_, i) => (
        <div
          key={`ph-${i}`}
          className={`w-8 h-8 rounded-full border-2 ${border} flex items-center justify-center text-white text-[10px] font-bold`}
          style={{ backgroundColor: COLORS[(slots.length + i) % COLORS.length] }}
        >
          S
        </div>
      ))}
    </div>
  );
}

function Hero() {
  const stats = useCommunityStats();
  return (
    <section className="bg-[#1A1412]">
      {/* Mobile: full-bleed image on top, warm cream text below. Desktop: side-by-side with gradient overlay. */}
      <div className="sm:hidden">
        <img src={heroWarrior} alt="Nick Kremers — stroke survivor" {...({ fetchpriority: "high" } as any)} decoding="async" className="w-full h-[72vh] object-cover" style={{ objectPosition: "65% 22%" }} />
        <div className="bg-[#FDFBF7] px-5 pt-8 pb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2A2421]/8 border border-[#E2C2A4]/40 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2A2421]/70">By Nick Kremers — 7-year survivor</span>
          </div>
          <h1 className="font-display leading-[0.9] mb-4">
            <span className="block text-[#2A2421] text-4xl">Nobody was watching</span>
            <span className="block text-[#2A2421]/40 text-4xl">the days in between.</span>
          </h1>
          <p className="font-display text-[#C06B3E] text-2xl mb-6">We are.</p>
          <p className="text-base text-[#2A2421]/75 mb-4 leading-relaxed">
            December 3, 2018 — Hoyer lift. 50 staples. Complete paralysis on one side. The hospital stabilized him and sent him home. Six weeks later, a follow-up appointment. Nobody checked on the days in between — whether he did his exercises, cried at 2 a.m., or almost quit.
          </p>
          <p className="text-base text-[#2A2421]/55 mb-8 leading-relaxed">
            That gap is where survivors fall off. Not because they gave up — because nobody was there. We built the thing that fills it: daily reps, a coach who notices when you go quiet, and a squad that keeps showing up.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={goToOnboarding}
              className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-14 px-8 text-base rounded-full w-full font-semibold shadow-[0_2px_8px_rgba(192,107,62,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(192,107,62,0.2)]"
              data-testid="button-build-plan-hero"
            >
              Build my recovery plan <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base rounded-md w-full border-[#2A2421]/15 bg-[#2A2421]/5 text-[#2A2421] hover:bg-[#2A2421]/10 hover:border-[#2A2421]/25 transition-colors"
              data-testid="button-talk-to-coach-hero"
            >
              <Link href="/recovery/sasquatch-coach">
                Talk to Coach — free
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-[#2A2421]/40">No signup to try — 3 free messages with Coach, then $19/mo.</p>
          {stats && (
            <div className="mt-8 flex items-center gap-3 text-sm text-[#2A2421]/50 font-medium">
              <AvatarCluster avatars={stats.avatars} border="border-[#FDFBF7]" />
              <p>{stats.display} survivors rebuilding their lives</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: original side-by-side with gradient overlay */}
      <div className="hidden sm:block relative overflow-hidden min-h-screen">
        <div className="absolute inset-0">
          <img src={heroWarrior} alt="" aria-hidden="true" {...({ fetchpriority: "high" } as any)} decoding="async" className="w-full h-full object-cover" style={{ objectPosition: "65% 22%" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1412]/85 via-[#2A2421]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1412] via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDFBF7]/8 border border-[#E2C2A4]/30 mb-10">
              <span className="flex h-2 w-2 rounded-full bg-gold" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#FDFBF7]/80">By Nick Kremers — 7-year survivor</span>
            </div>
            <h1 className="font-display leading-[0.9] mb-6">
              <span className="block text-[#FDFBF7] text-5xl md:text-7xl lg:text-8xl">Nobody was watching</span>
              <span className="block text-[#FDFBF7]/40 text-5xl md:text-7xl lg:text-8xl">the days in between.</span>
            </h1>
            <p className="font-display text-[#C06B3E] text-3xl md:text-5xl mb-10">We are.</p>
            <p className="hero-description text-lg md:text-xl text-[#FDFBF7]/70 mb-6 leading-relaxed max-w-2xl">
              December 3, 2018 — Hoyer lift. 50 staples. Complete paralysis on one side. The hospital stabilized him and sent him home. Six weeks later, a follow-up appointment. Nobody checked on the days in between — whether he did his exercises, cried at 2 a.m., or almost quit.
            </p>
            <p className="text-base md:text-lg text-[#FDFBF7]/55 mb-10 leading-relaxed max-w-2xl">
              That gap is where survivors fall off. Not because they gave up — because nobody was there. We built the thing that fills it: daily reps, a coach who notices when you go quiet, and a squad that keeps showing up.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={goToOnboarding}
                className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-14 px-8 text-base rounded-full w-full sm:w-auto font-semibold shadow-[0_2px_8px_rgba(192,107,62,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(192,107,62,0.2)]"
                data-testid="button-build-plan-hero"
              >
                Build my recovery plan <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base rounded-md w-full sm:w-auto border-[#FDFBF7]/20 bg-[#FDFBF7]/8 text-[#FDFBF7] backdrop-blur hover:bg-[#FDFBF7]/15 hover:border-[#FDFBF7]/30 transition-colors"
                data-testid="button-talk-to-coach-hero"
              >
                <Link href="/recovery/sasquatch-coach">
                  Talk to Coach — free
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-[#FDFBF7]/50">No signup to try — 3 free messages with Coach, then $19/mo.</p>
            {stats && (
              <div className="mt-12 flex items-center gap-3 text-sm text-[#FDFBF7]/60 font-medium">
                <AvatarCluster avatars={stats.avatars} border="border-[#1C1917]" />
                <p>{stats.display} survivors rebuilding their lives</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const ACTIVITY_FEED = [
  { name: "Maria T.", action: "logged Day 23 of Never Zero", time: "2 min ago", color: "#C06B3E" },
  { name: "James K.", action: "completed their morning mirror therapy", time: "4 min ago", color: "#7C5C3A" },
  { name: "Sandra B.", action: "joined the platform", time: "6 min ago", color: "#A0522D" },
  { name: "Coach", action: "answered 847 questions this week", time: "live", color: "#C06B3E" },
  { name: "Robert L.", action: "hit Day 100 — Never Zero streak", time: "11 min ago", color: "#8B4513" },
  { name: "Angela M.", action: "shared a win with her squad", time: "14 min ago", color: "#C06B3E" },
  { name: "David R.", action: "logged Day 847 — playing catch again", time: "18 min ago", color: "#7C5C3A" },
  { name: "Lisa C.", action: "completed the 66-Day Challenge", time: "22 min ago", color: "#A0522D" },
  { name: "Tom W.", action: "started their recovery plan", time: "25 min ago", color: "#C06B3E" },
  { name: "Patricia N.", action: "logged a speech rep — 3rd week straight", time: "31 min ago", color: "#8B4513" },
];

function ActivityTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % ACTIVITY_FEED.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const item = ACTIVITY_FEED[idx];

  return (
    <div className="bg-[#2A2421] border-y border-[#3A3230] px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex h-2 w-2 rounded-full bg-[#C06B3E] animate-pulse" />
          <span className="text-xs font-bold text-[#C06B3E] uppercase tracking-widest">Live</span>
        </div>
        <div
          className="text-sm text-[#FDFBF7]/70 transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <span className="font-semibold text-[#FDFBF7]/90">{item.name}</span>
          {" "}{item.action}
          <span className="ml-2 text-[#FDFBF7]/35 text-xs">{item.time}</span>
        </div>
      </div>
    </div>
  );
}

const COACH_MESSAGES = [
  { from: "survivor", text: "I skipped my exercises three days in a row. I don't know what's wrong with me." },
  { from: "coach",    text: "Three days is just three days. It's not a pattern unless you let it become one. What's actually going on — tired, or something heavier?" },
  { from: "survivor", text: "Honestly both. My arm still doesn't move the way I want it to after 8 months." },
  { from: "coach",    text: "Eight months feels long when you're in it. It's not. The reps you did in month one still live in your nervous system — you're not starting over. You're continuing. What did the arm do last week that it couldn't do in month one?" },
] as const;

function CoachPreview() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping]     = useState(false);
  const scrollRef   = useRef<HTMLDivElement>(null);
  const sectionRef  = useRef<HTMLDivElement>(null);
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loopRef     = useRef<() => void>(() => {});

  function clear() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }
  function after(ms: number, fn: () => void) {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }

  loopRef.current = () => {
    clear();
    setVisibleCount(0);
    setShowTyping(false);
    let t = 0;
    t += 700;  after(t, () => setVisibleCount(1));
    t += 900;  after(t, () => setShowTyping(true));
    t += 2300; after(t, () => { setShowTyping(false); setVisibleCount(2); });
    t += 1400; after(t, () => setVisibleCount(3));
    t += 900;  after(t, () => setShowTyping(true));
    t += 3200; after(t, () => { setShowTyping(false); setVisibleCount(4); });
    t += 6000; after(t, () => loopRef.current());
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) loopRef.current();
        else { clear(); setVisibleCount(0); setShowTyping(false); }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => { obs.disconnect(); clear(); };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleCount, showTyping]);

  return (
    <section ref={sectionRef} className="bg-[#1A1412] py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C06B3E]/20 border border-[#C06B3E]/30 mb-6">
              <Zap className="w-3.5 h-3.5 text-[#C06B3E]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#C06B3E]">Sasquatch Coach</span>
            </div>
            <h2 className="font-display text-[#FDFBF7] text-3xl md:text-5xl mb-6 leading-[0.95]">
              A coach that actually<br />
              <span className="italic font-serif text-[#C06B3E]">notices.</span>
            </h2>
            <p className="text-[#FDFBF7]/60 text-lg leading-relaxed mb-8">
              Not a chatbot with canned responses. A recovery partner trained on the Sasquatch Method — it knows when you've gone quiet, what the research says, and how to call you back without being preachy.
            </p>
            <p className="text-sm text-[#FDFBF7]/40 mb-8">3 free messages — no signup required.</p>
            <Button
              asChild
              size="lg"
              className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-12 px-7 rounded-full font-semibold shadow-[0_2px_8px_rgba(192,107,62,0.25)] transition-all hover:-translate-y-0.5"
              data-testid="button-try-coach-preview"
            >
              <Link href="/recovery/sasquatch-coach">Talk to Coach — free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="bg-[#0F0C0A] rounded-2xl border border-[#3A3230] p-5 flex flex-col" style={{ minHeight: 380 }}>
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 mb-2 border-b border-[#2A2421] shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#C06B3E]/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-[#C06B3E]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#FDFBF7]/90">Sasquatch Coach</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-[#FDFBF7]/40">Active now</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-hidden space-y-3 py-1">
              {COACH_MESSAGES.slice(0, visibleCount).map((m, i) => (
                <div key={i} className={`flex msg-in ${m.from === "survivor" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.from === "survivor"
                      ? "bg-[#2A2421] text-[#FDFBF7]/80 rounded-br-sm"
                      : "bg-[#C06B3E]/15 border border-[#C06B3E]/20 text-[#FDFBF7]/85 rounded-bl-sm"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {showTyping && (
                <div className="flex justify-start msg-in">
                  <div className="bg-[#C06B3E]/15 border border-[#C06B3E]/20 rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-[#C06B3E]/70 animate-bounce" style={{ animationDelay: "0ms",   animationDuration: "0.9s" }} />
                    <span className="w-2 h-2 rounded-full bg-[#C06B3E]/70 animate-bounce" style={{ animationDelay: "160ms", animationDuration: "0.9s" }} />
                    <span className="w-2 h-2 rounded-full bg-[#C06B3E]/70 animate-bounce" style={{ animationDelay: "320ms", animationDuration: "0.9s" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="flex items-center gap-2 pt-3 mt-2 border-t border-[#2A2421] shrink-0">
              <div className="flex-1 bg-[#2A2421] rounded-full px-4 py-2.5 text-sm text-[#FDFBF7]/25">
                Message Coach...
              </div>
              <Link href="/recovery/sasquatch-coach">
                <div className="w-9 h-9 rounded-full bg-[#C06B3E] flex items-center justify-center cursor-pointer hover:bg-[#A85B33] transition-colors">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  const community = useCommunityStats();
  const stats = [
    { n: community?.display ?? "Growing", l: "Survivors" },
    { n: "0% → 90%", l: "Function restored" },
    { n: "365", l: "Days of reps" },
    { n: "7", l: "Years of proof" },
  ];
  return (
    <section className="bg-[#C06B3E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center px-4">
              <div className="font-display text-[#FDFBF7] text-4xl md:text-5xl mb-1">{s.n}</div>
              <div className="text-sm font-bold text-[#FDFBF7]/80 uppercase tracking-wider">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AccountabilityGap() {
  const pillars = [
    { icon: Activity, t: "Daily Reps", d: "Every task tracked. The system knows when you haven't shown up — and so does your squad." },
    { icon: Users, t: "Your Squad", d: "Accountability pods of 3–5 survivors. Day 3 and Day 700, showing up for each other." },
    { icon: BrainCircuit, t: "Sasquatch Coach", d: "An AI coach trained on the Sasquatch Method. It notices when you go quiet and calls you back." },
    { icon: BookOpen, t: "Recovery Journal", d: "Name the wins, name the hard parts. Every entry is a chapter in the story you're writing." },
  ];
  return (
    <section id="method" className="bg-[#FDFBF7] py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20">
        <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-5">The Accountability Gap</p>
        <h2 className="font-display text-[#2A2421] text-4xl md:text-6xl mb-6 leading-[0.95]">
          The most underserved part of stroke recovery isn't information.
        </h2>
        <p className="font-display text-[#C06B3E] italic font-serif text-3xl md:text-4xl mb-10">It's someone checking on you.</p>
        <div className="space-y-5 text-[#5C534D] text-lg leading-relaxed max-w-3xl mx-auto">
          <p>
            You leave the hospital with a stack of papers and a follow-up appointment in six weeks. Nobody is watching the days in between — whether you did your exercises, skipped them, cried at 2 a.m., or decided recovery wasn't worth it.
          </p>
          <p>
            That gap is where the plateau lives. That's where survivors fall off. Not because they gave up — <strong className="text-[#2A2421] font-semibold">because nobody was there.</strong>
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pillars.map((c, i) => (
          <div key={i} className="p-7 rounded-3xl bg-white border border-[#E2C2A4]/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(192,107,62,0.08)] transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#FDFBF7] border border-[#E2C2A4]/30 flex items-center justify-center mb-5 text-[#C06B3E]">
              <c.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#2A2421]">{c.t}</h3>
            <p className="text-[#5C534D] text-sm leading-relaxed">{c.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section id="proof" className="relative bg-[#F5F0EB] py-28 text-[#1C1917] overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_50%,_rgba(226,116,27,0.15),_transparent_60%)]" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Star className="w-8 h-8 text-gold mb-6" fill="currentColor" />
            <h2 className="font-display text-3xl md:text-5xl mb-6 leading-[0.95]">
              "They said I'd never walk again. I said — watch me."
            </h2>
            <p className="text-[#78716C] text-lg mb-8 leading-relaxed">
              Nick Kremers had a massive hemorrhagic stroke at 36 that left him paralyzed on his right side. Seven years later — through the exact methods taught in this academy — he's regained 90% of his function. If the Sasquatch can do it, so can you.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold/40">
                <img src={nickPortrait} alt="Nick Kremers" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-lg text-[#1C1917]">Nick Kremers</div>
                <div className="text-[#78716C]">Founder, Stroke Recovery Academy</div>
              </div>
            </div>
          </div>
          <div className="relative aspect-video bg-white rounded-2xl overflow-hidden border border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(192,107,62,0.08)] transition-shadow" aria-hidden="true">
            <img src={manifestoStairs} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-[#1C1917]/30 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gold/90 flex items-center justify-center">
                <Play className="w-8 h-8 text-black fill-black ml-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="bg-[#F6EFEA] py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-4">The Toolkit</p>
          <h2 className="font-display text-[#2A2421] text-4xl md:text-5xl">Everything you need to <span className="italic font-serif text-[#C06B3E]">rebuild.</span></h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="w-12 h-12 rounded-lg bg-neutral-900 text-white flex items-center justify-center mb-6"><CalendarDays className="w-6 h-6" /></div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">Daily Routines & Protocols</h3>
            <p className="text-neutral-600 text-lg leading-relaxed">
              Stop guessing what to do. Get structured daily regimens that target neuroplasticity — from mirror therapy to mental rehearsal — scaled to your level and delivered when you need them.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden border border-[#E2C2A4]/20 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8">
            <div className="bg-white rounded-xl border border-[#E2C2A4]/30 p-6 space-y-3">
              {[
                { icon: Users, t: "Accountability Pod", s: "Your squad of 5" },
                { icon: Activity, t: "Daily Reps Log", s: "Streak: 412 days" },
                { icon: ShieldCheck, t: "Caregiver View", s: "Shared progress" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-4 border rounded-lg border-[#E2C2A4]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-xl bg-[#F6EFEA] text-[#C06B3E] flex items-center justify-center"><row.icon className="w-5 h-5" /></div>
                    <div>
                      <div className="font-semibold text-sm text-[#2A2421]">{row.t}</div>
                      <div className="text-xs text-[#5C534D]">{row.s}</div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Write Your Recovery Story */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center mt-24">
          <div className="order-2 md:order-1 rounded-3xl border border-[#E2C2A4]/20 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8">
            <div className="bg-white rounded-xl border border-[#E2C2A4]/20 p-6 space-y-4">
              {[
                { label: "Day 1 — first step on the left side", chapter: true },
                { label: "Week 3 — full sentence in PT", chapter: true },
                { label: "Month 2 — back behind the wheel", chapter: false },
                { label: "Year 1 — told the story in public", chapter: true },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex gap-3 items-center">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${row.chapter ? "bg-gold" : "bg-neutral-300"}`} />
                    <span className={`text-sm ${row.chapter ? "text-neutral-900 font-medium" : "text-neutral-400"}`}>{row.label}</span>
                  </div>
                  {row.chapter && <span className="text-xs font-semibold text-gold uppercase tracking-wider">Chapter</span>}
                </div>
              ))}
              <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs text-neutral-400">Everything else stays between you and the Squatch</span>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="w-12 h-12 rounded-2xl bg-[#2A2421] text-white flex items-center justify-center mb-6"><BookOpen className="w-6 h-6" /></div>
            <h3 className="text-2xl font-bold text-[#2A2421] mb-4">Write Your Recovery Story</h3>
            <p className="text-[#5C534D] text-lg leading-relaxed mb-6">
              Every check-in. Every journal entry. Every breakthrough you tell the Coach. It's all material — and it's all yours. Mark the moments that matter, and when you're ready, compile them into a real book. Digital or print. In your voice. About your life.
            </p>
            <p className="text-sm font-semibold text-[#5C534D] mb-6 italic">
              Everything else is between you and the Squatch.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-12 px-7 rounded-full font-semibold shadow-[0_2px_8px_rgba(192,107,62,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(192,107,62,0.2)]"
              data-testid="button-write-story-features"
            >
              <Link href="/recovery/my-story">See your story <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Caregiver() {
  return (
    <section className="bg-[#C06B3E] py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[#FDFBF7]">
        <p className="text-sm font-bold tracking-[0.3em] uppercase mb-5 text-[#FDFBF7]/80">For Caregivers</p>
        <h2 className="font-display text-4xl md:text-6xl mb-6 leading-[0.95] text-[#FDFBF7]">You're not the patient — but you carry it too.</h2>
        <p className="text-lg font-medium text-[#FDFBF7]/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          You're the one Googling at 2 a.m., scheduling the appointments, quietly holding it together. Nobody built a system that took your seat seriously — until now. Let us handle the daily reminders. You just have to keep standing.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-[#FDFBF7] text-[#2A2421] hover:bg-[#E2C2A4] h-14 px-8 text-base rounded-full font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          data-testid="button-caregiver-kit"
        >
          <a href="/for/caregivers">Open the caregiver kit <ArrowRight className="ml-2 h-5 w-5" /></a>
        </Button>
      </div>
    </section>
  );
}

function Guides() {
  const guides = [
    { t: "How long does rehab take?", d: "The real timeline — not the one the hospital gave you." },
    { t: "Can you fully recover?", d: "What the research says, and what seven years actually looks like." },
    { t: "Neuroplasticity explained", d: "How your brain rewires itself — the science behind every rep." },
  ];
  return (
    <section id="guides" className="bg-[#FDFBF7] py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-4">Latest Guides</p>
            <h2 className="font-display text-[#2A2421] text-3xl md:text-5xl mb-3">The questions every survivor asks.</h2>
            <p className="text-lg text-[#5C534D]">Honest, in-the-trenches answers. No fluff, no fake hope.</p>
          </div>
          <Link href="/recovery/blog" className="text-[#2A2421] font-semibold inline-flex items-center hover:text-[#C06B3E] transition-colors shrink-0" data-testid="link-all-guides">
            See all guides <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {guides.map((g, i) => (
            <Link key={i} href="/recovery/blog" className="group block border border-[#E2C2A4]/30 rounded-3xl p-7 hover:shadow-[0_4px_16px_rgba(192,107,62,0.08)] transition-all hover:border-[#C06B3E]/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]" data-testid={`link-guide-${i}`}>
              <div className="w-10 h-10 rounded-full bg-[#F6EFEA] border border-[#E2C2A4]/30 flex items-center justify-center mb-6 group-hover:bg-[#C06B3E] group-hover:text-white group-hover:border-[#C06B3E] transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-[#2A2421] mb-3 group-hover:text-[#C06B3E] transition-colors">{g.t}</h3>
              <p className="text-[#5C534D] leading-relaxed">{g.d}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function GiftASurvivor() {
  return (
    <section className="bg-[#FDFBF7] py-24 border-y border-[#E2C2A4]/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C06B3E]/10 border border-[#C06B3E]/30 mb-6">
          <Gift className="w-4 h-4 text-gold" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C06B3E]">Pay it forward</span>
        </div>
        <h2 className="font-display text-[#1C1917] text-4xl md:text-6xl mb-6 leading-[0.95]">Gift a survivor their comeback.</h2>
        <p className="text-lg text-[#78716C] mb-10 max-w-2xl mx-auto leading-relaxed">
          Recovery shouldn't hinge on what someone can afford. Sponsor a survivor who's rebuilding — the plan, the Coach, the squad — and cover the cost when they can't. Your gift shows up as a full membership.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-14 px-8 text-base rounded-full font-semibold shadow-[0_2px_8px_rgba(192,107,62,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(192,107,62,0.2)]"
          data-testid="button-gift-survivor-landing"
        >
          <Link href="/recovery/gift">Gift a Survivor <ArrowRight className="ml-2 h-5 w-5" /></Link>
        </Button>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative bg-[#F5F0EB] py-32 text-center overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_rgba(226,116,27,0.12),_transparent_60%)]" />
      <div className="relative z-10 max-w-3xl mx-auto px-4">
        <h2 className="font-display text-[#1C1917] text-5xl md:text-7xl mb-8 leading-[0.9]">
          The hospital did its job.<br />
          <span className="italic font-serif text-[#C06B3E]">Now it's your turn.</span>
        </h2>
        <p className="text-xl text-[#78716C] mb-12">
          We'll be there for every rep of it — daily reps, your squad of five, and Coach in your corner. $19/mo, 7 days free. Cancel anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={goToOnboarding}
            className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-16 px-12 text-lg rounded-full font-semibold w-full sm:w-auto shadow-[0_2px_8px_rgba(192,107,62,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(192,107,62,0.2)]"
            data-testid="button-start-recovery-final"
          >
            Start your recovery
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-16 px-12 text-lg rounded-md w-full sm:w-auto border-[#E2C2A4]/30 bg-white text-[#1C1917] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all hover-elevate"
            data-testid="button-see-premium-final"
          >
            <Link href="/recovery/premium">See Premium</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/recovery/dashboard");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FDFBF7]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <RecoverySEO
        title="Stroke Recovery Academy — Evidence-Based Rehab by Nick Kremers | 0% to 90% Recovery"
        description="The #1 stroke recovery platform built by a stroke survivor. Nick Kremers went from 0% to 90% recovery using the Sasquatch Method. Join survivors rebuilding their lives every day."
        canonical="/"
        pageType="website"
        keywords={[
          "stroke recovery",
          "stroke rehabilitation",
          "stroke survivor",
          "Nick Kremers",
          "Sasquatch Method",
          "mirror therapy stroke",
          "baseball bat therapy",
          "drop foot stroke recovery",
          "stroke recovery academy",
        ]}
        speakableSelectors={["h1", ".hero-description"]}
        breadcrumbs={[]}
        additionalSchema={[
          { "@context": "https://schema.org", ...STROKE_RECOVERY_ORG_SCHEMA },
          { "@context": "https://schema.org", ...NICK_KREMERS_SCHEMA },
          { "@context": "https://schema.org", ...STROKE_CONDITION_SCHEMA },
          { "@context": "https://schema.org", ...SASQUATCH_METHOD_SCHEMA },
        ]}
        faq={[
          {
            question: "What is Stroke Recovery Academy?",
            answer:
              "Stroke Recovery Academy is the world's most comprehensive stroke recovery platform, founded by Nick Kremers — a stroke survivor who achieved 0% to 90% functional recovery using the Sasquatch Method.",
          },
          {
            question: "Can a stroke survivor really go from 0% to 90% recovery?",
            answer:
              "Yes — Nick Kremers is living proof. After suffering a stroke that left him with 0% function on one side, he achieved 90% recovery through relentless daily rehabilitation using the techniques now taught in Stroke Recovery Academy.",
          },
          {
            question: "Is Stroke Recovery Academy a replacement for my doctor or therapist?",
            answer:
              "No. Stroke Recovery Academy is a non-clinical accountability and daily-reps platform built from a survivor's lived experience. It works alongside your medical team — not instead of it. Any new symptoms go to your doctor, and if you're in crisis we route you to 988 and 911.",
          },
          {
            question: "How much does Stroke Recovery Academy cost?",
            answer:
              "One survivor plan: $19/month or $190/year, with a 7-day free trial. You can also talk to the AI Sasquatch Coach free before signing up. If cost is a barrier, Stroke Lyfe Inc. — a 501(c)(3) nonprofit — funds scholarships so no survivor is turned away.",
          },
          {
            question: "What is the Sasquatch Method?",
            answer:
              "The Sasquatch Method is Nick Kremers' survivor-built system of relentless daily reps — mirror therapy, task-specific practice, and the mindset work that carried him from 0% to 90%. It's the framework behind the daily routines, the AI Coach, and the book.",
          },
          {
            question: "Do I have to be a recent stroke survivor to benefit?",
            answer:
              "No. The platform is built for survivors at any stage — weeks, months, or years out. Neuroplasticity doesn't have an expiration date, and the daily-reps system meets you wherever your recovery is right now.",
          },
          {
            question: "Is there support for caregivers and family?",
            answer:
              "Yes. Caregivers get dedicated resources, and survivors can build an accountability pod — a small squad walking the same road — so nobody rebuilds alone.",
          },
        ]}
      />
      <RecoveryHeader />
      <main>
        <Hero />
        <ActivityTicker />
        <StatsStrip />
        <AccountabilityGap />
        <CoachPreview />
        <Proof />
        <Features />
        <Caregiver />
        <GiftASurvivor />
        <Guides />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
