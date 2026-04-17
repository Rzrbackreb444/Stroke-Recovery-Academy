import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import NewsletterSignupWidget from "@/components/NewsletterSignupWidget";
import icuVideo from "@assets/12746_1776435817591.mp4";
import {
  Flame, Trophy, CheckCircle, Target, Zap, Users, Calendar,
  Star, ArrowRight, Play, Shield, Clock, Heart, ChevronDown, ChevronUp,
  BookOpen, MessageCircle, Activity, Award, Brain, Dumbbell
} from "lucide-react";

const COUNTDOWN_TARGET = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = COUNTDOWN_TARGET.getTime() - now;
      if (distance <= 0) {
        clearInterval(interval);
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 justify-center" data-testid="countdown-timer">
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Mins", value: timeLeft.minutes },
        { label: "Secs", value: timeLeft.seconds },
      ].map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <div className="bg-[#1a1a1a] border border-[#C9941A]/40 rounded-lg w-16 h-16 flex items-center justify-center">
            <span className="text-2xl font-black text-[#C9941A]">{String(value).padStart(2, "0")}</span>
          </div>
          <span className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{label}</span>
        </div>
      ))}
    </div>
  );
}

const TESTIMONIALS = [
  {
    name: "Marcus T.",
    days: "Day 34",
    quote: "I went from barely lifting my arm to reaching above my head. The baseball bat method changed everything. Nick doesn't sugarcoat — he pushes you exactly like you need.",
    stars: 5,
  },
  {
    name: "Deborah R.",
    days: "Day 58",
    quote: "I cried when I finished Day 22. Not from pain — from pride. I hadn't felt proud of my body in 3 years. The community keeps me accountable in a way no PT ever did.",
    stars: 5,
  },
  {
    name: "James K.",
    days: "Completed",
    quote: "My neurologist couldn't explain the improvement. I can. It's 66 days of showing up every single day with Nick's protocol. Drop foot? Still there. But I'm walking unassisted now.",
    stars: 5,
  },
  {
    name: "Sandra M.",
    days: "Day 12",
    quote: "Just started but I'm already seeing shifts in my mindset. The daily audit — wins, breakdowns, tomorrow's target — it's the structure my brain needed after the chaos of a stroke.",
    stars: 5,
  },
];

const WHATS_INCLUDED = [
  {
    icon: Brain,
    title: "The Complete Sasquatch Formula",
    description: "The exact battle-tested system Nick used: S.A.S.C.H. — Seize, Absorb, Swing, Combine, Hammer. The 5-step daily operating system that drives real neuroplasticity, not just symptom management.",
  },
  {
    icon: Calendar,
    title: "66-Day Transformation Tracker",
    description: "Day-by-day accountability. 3 phases: Survival (Days 1–22), Breakthrough (Days 23–44), Optimization (Days 45–66). Daily check-in keeps your streak alive.",
  },
  {
    icon: BookOpen,
    title: "Step-by-Step Video Lessons",
    description: "Neuroplasticity science. Movement reclamation. Mirror therapy. Weight-bearing protocols. Baseball bat method. Mindset mastery. Plateau-busting techniques.",
  },
  {
    icon: Activity,
    title: "Daily Check-In + Progress Metrics",
    description: "Log mood, energy, and pain daily. Watch your recovery score climb. See your streak grow. Real data showing you're winning — even on hard days.",
  },
  {
    icon: Users,
    title: "Sasquatch Tribe Community",
    description: "Private accountability pods. Fellow survivors who understand exactly what you're fighting. Celebrate wins together. Accountability that actually works.",
  },
  {
    icon: MessageCircle,
    title: "Sasquatch Coach (AI Companion)",
    description: "24/7 AI coach powered by Nick's knowledge. Ask anything. Get coached at 3am when you can't sleep. Never feel alone in your recovery again.",
  },
];

const BONUSES = [
  {
    icon: Trophy,
    title: "90-Day Breakthrough Program",
    value: "$297 value",
    description: "The extended program for survivors who want to keep pushing past Day 66 into long-term optimization.",
  },
  {
    icon: Dumbbell,
    title: "34-Exercise Recovery Library",
    value: "$97 value",
    description: "Video-guided exercises for upper extremity, gait, balance, cognitive, and speech recovery. Organized by difficulty and goal.",
  },
  {
    icon: BookOpen,
    title: "My Recovery Story Tool",
    value: "$49 value",
    description: "Guided memoir writing with Nick's story alongside yours. 10 chapters. Your story deserves to be told.",
  },
  {
    icon: Award,
    title: "Micro-Progress Reflection Tools",
    value: "$37 value",
    description: "Daily audit, win journal, and flicker log to capture every tiny victory — because micro-progress IS progress.",
  },
];

const PHASES = [
  {
    number: "01",
    name: "SURVIVAL PHASE",
    days: "Days 1–22",
    color: "#C9941A",
    description: "Foundation. You're building the habit. The nervous system is learning to trust you again. Show up every day — that's the only rule.",
    wins: ["Establish daily check-in habit", "Learn the Sasquatch Formula", "Complete baseline neuroplasticity exercises", "Join your accountability pod"],
  },
  {
    number: "02",
    name: "BREAKTHROUGH PHASE",
    days: "Days 23–44",
    color: "#FF6B35",
    description: "Momentum. The compound effect kicks in. Survivors report this is when the first big 'impossible' moment happens. Your brain is rewiring.",
    wins: ["First major mobility breakthrough", "Plateau-busting protocols activated", "Mirror therapy deep dive", "Community sharing accelerates progress"],
  },
  {
    number: "03",
    name: "OPTIMIZATION PHASE",
    days: "Days 45–66",
    color: "#22C55E",
    description: "Mastery. You're no longer doing the habit — you ARE the habit. This is where the new identity locks in. Day 66 isn't the finish line — it's your launchpad.",
    wins: ["Locked-in recovery identity", "Advanced neuroplasticity protocols", "Legacy planning begins", "You are ready to keep building — for life"],
  },
  {
    number: "∞",
    name: "LIFETIME SYSTEM",
    days: "Day 67 and beyond",
    color: "#8B5CF6",
    description: "Stroke recovery doesn't have a finish line. Year 1 looks different from Year 3. Year 3 looks different from Year 7. Your membership grows with you — new protocols, monthly content, and a community that will be here as long as you need it.",
    wins: ["Monthly new content from Nick", "Year 2, 3, 5, 7+ specific protocols", "Ongoing accountability community", "You become the proof someone else needs"],
  },
];

const FAQS = [
  {
    q: "Is the community really free — no strings attached?",
    a: "Yes. The Survivor Community is completely free to join. You can connect with other survivors and caregivers, read Nick's blog, access free protocols, and receive The Sasquatch Dispatch newsletter — all at no cost. The paid Warrior plan is for those ready to commit to the full 66-Day system and ongoing lifetime programming.",
  },
  {
    q: "What happens after Day 66?",
    a: "Day 66 isn't the finish line — it's the launchpad. Stroke recovery spans years, sometimes decades. After Day 66 your membership continues into Year 1, Year 2, Year 3+ programming. New content drops monthly. The community stays with you. Nick is in Year 7 and still actively recovering. There's no graduation date.",
  },
  {
    q: "Who is this for?",
    a: "Stroke survivors at any stage — whether your stroke was 3 months ago or 10 years ago. If you're plateaued, frustrated, or ready to stop accepting limitations, this is for you. Caregivers and family members are also welcome and supported.",
  },
  {
    q: "I have drop foot / arm weakness / aphasia. Will this work for me?",
    a: "Yes. Nick himself dealt with full left-side paralysis, drop foot, spasticity, and cognitive fog. The program addresses physical, cognitive, speech, and mindset recovery — and scales to where you are, not where you think you should be.",
  },
  {
    q: "What if I miss a day?",
    a: "The Never Zero principle: one small action keeps the signal alive. Even 5 minutes counts. The challenge is about momentum, not perfection. Miss a day? Get back up. That's the whole lesson.",
  },
  {
    q: "Is this medical advice?",
    a: "No. The Sasquatch Doctrine, 66-Day Challenge, and all content from Stroke Recovery Academy are for motivational and informational purposes only — not a substitute for medical advice, diagnosis, or treatment. Individual results vary significantly. Always work with your physician, neurologist, or licensed therapist. Nick's recovery is his story. Yours is your own.",
  },
  {
    q: "What if it doesn't work for me?",
    a: "The 7-day free trial means zero financial risk. Try the whole system. If you're not seeing value by Day 7, cancel and pay nothing. Results vary — but showing up every day is the one thing that moves every recovery forward.",
  },
];

export default function Challenge() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCTA = () => {
    if (isAuthenticated) {
      setLocation("/recovery/dashboard");
    } else {
      window.location.href = "/api/login";
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="66-Day Sasquatch Transformation Challenge — Stroke Recovery Academy"
        description="Stop accepting limitations. Join Nick Kremers' 66-Day Sasquatch Transformation Challenge and go from stuck to strong. 7-day free trial. Built for stroke survivors who refuse to quit."
        canonical="/recovery/challenge"
        pageType="website"
        keywords={["66 day challenge stroke recovery", "stroke recovery challenge", "sasquatch transformation", "stroke rehabilitation program", "Nick Kremers stroke", "stroke recovery accountability"]}
        breadcrumbs={[{ name: "Home", url: "/recovery" }, { name: "Challenge", url: "/recovery/challenge" }]}
      />

      <RecoveryHeader />

      {/* HERO */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden" data-testid="section-hero">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C9941A]/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-6 text-sm px-4 py-1.5 uppercase tracking-widest" data-testid="badge-challenge-label">
            <Flame className="h-3.5 w-3.5 mr-2" />
            66-Day Sasquatch Transformation Challenge
          </Badge>

          <h1 className="text-5xl md:text-7xl font-black leading-none mb-6 tracking-tight" data-testid="heading-hero">
            STOP ACCEPTING<br />
            <span className="text-[#C9941A]">LIMITATIONS.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed" data-testid="text-hero-sub">
            A massive hemorrhagic stroke left me at 0% function on my left side.<br />
            Doctors said I'd probably never walk normally again.
          </p>
          <p className="text-xl md:text-2xl text-white font-bold mb-6 max-w-3xl mx-auto">
            I defied every "never" and rebuilt to <span className="text-[#C9941A]">90%+</span> and still rising at Year 7.{" "}
            Now I'm helping other survivors commit to the long game.
          </p>
          <p className="text-sm text-gray-400 mb-10 max-w-xl mx-auto">
            The community is free. The 66-Day system — and everything after it — is for those serious about going the distance.
          </p>

          <div className="mb-8">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">Challenge starts in</p>
            <CountdownTimer />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button
              onClick={handleCTA}
              size="lg"
              className="bg-[#C9941A] hover:bg-[#C9941A] text-black font-black text-lg px-10 py-6 rounded-lg"
              data-testid="button-cta-hero"
            >
              Start Your Free 7-Day Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-[#333] text-white text-lg px-8 py-6 rounded-lg"
              onClick={() => setLocation("/recovery/academy")}
              data-testid="button-preview"
            >
              <Play className="mr-2 h-4 w-4 text-[#C9941A]" />
              Watch Nick's Story
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <p className="text-sm text-gray-500 self-center">
              <Shield className="inline h-3.5 w-3.5 mr-1 text-[#C9941A]" />
              7-day free trial on paid plans. Cancel anytime.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 underline text-xs"
              onClick={() => window.location.href = "/recovery/login?tab=signup"}
              data-testid="button-join-free"
            >
              Or join the community for free
            </Button>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-[#1a1a1a] border-y border-[#333] py-6 px-4" data-testid="section-stats">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "50,000+", label: "Warriors Worldwide" },
            { value: "66", label: "Days to Start" },
            { value: "90%+", label: "Nick's Recovery" },
            { value: "Year 7", label: "Nick Still Rising" },
          ].map(({ value, label }) => (
            <div key={label} data-testid={`stat-${label.replace(/\s/g, "-")}`}>
              <div className="text-2xl md:text-3xl font-black text-[#C9941A]">{value}</div>
              <div className="text-sm text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PERFECT FOR */}
      <section className="py-16 px-4" data-testid="section-perfect-for">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
            Perfect For Stroke Survivors Who
          </h2>
          <p className="text-gray-400 text-center mb-10">If any of these hit home, you're in the right place.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Target, text: "Feel stuck, frustrated, or plateaued after months or years" },
              { icon: Zap, text: "Want real measurable progress instead of just 'learning to live with it'" },
              { icon: Heart, text: "Are ready to go from powerless to purposeful — for real this time" },
              { icon: Brain, text: "Have drop foot, arm weakness, aphasia, or cognitive fog slowing you down" },
              { icon: Users, text: "Want accountability from people who actually understand stroke" },
              { icon: Trophy, text: "Refuse to believe the plateau is permanent" },
            ].map(({ icon: Icon, text }) => (
              <Card key={text} className="bg-[#1a1a1a] border-[#333] p-5 flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C9941A]/20 flex items-center justify-center mt-0.5">
                  <Icon className="h-4 w-4 text-[#C9941A]" />
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 3 PHASES */}
      <section className="py-16 px-4 bg-[#111]" data-testid="section-phases">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-4 block w-fit mx-auto uppercase tracking-widest text-xs">
            The Journey
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
            66 Days to Build the Habit. A Lifetime to Use It.
          </h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            The 66-Day Challenge is your entry point — not your exit. Stroke recovery spans years, 
            decades, sometimes a lifetime. This system grows with you.
          </p>

          {/* The 66-Day Truth callout */}
          <div
            className="max-w-3xl mx-auto mb-12 rounded-lg p-6 md:p-8"
            style={{ background: "#1a1a1a", border: "1px solid #C9941A" }}
            data-testid="callout-66-day-truth"
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#C9941A" }}
              >
                The 66-Day Truth
              </span>
            </div>
            <p className="text-sm md:text-base leading-relaxed mb-3" style={{ color: "#E5E5E5" }}>
              66 days is the average time it takes to turn deliberate effort into a habit.{" "}
              <strong style={{ color: "#FFF" }}>It is not a guarantee.</strong> Every stroke is
              different. Every brain is different. Every recovery is different.
            </p>
            <p className="text-sm md:text-base leading-relaxed" style={{ color: "#E5E5E5" }}>
              The S.A.S.C.H. Formula is the blueprint Nick built going from 0% to 90%+. It works when
              you work it. He's living proof it's possible —{" "}
              <span style={{ color: "#FFF", fontWeight: 600 }}>the rest is up to you.</span>
            </p>
          </div>

          <div className="space-y-6">
            {PHASES.map((phase) => (
              <div
                key={phase.number}
                className="border border-[#333] rounded-lg p-6 bg-[#1a1a1a]"
                data-testid={`phase-${phase.number}`}
              >
                <div className="flex flex-wrap items-start gap-4 mb-4">
                  <span className="text-5xl font-black" style={{ color: phase.color }}>{phase.number}</span>
                  <div>
                    <h3 className="text-xl font-black" style={{ color: phase.color }}>{phase.name}</h3>
                    <p className="text-sm text-gray-400">{phase.days}</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4 leading-relaxed">{phase.description}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {phase.wins.map((win) => (
                    <div key={win} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: phase.color }} />
                      {win}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="py-16 px-4" data-testid="section-included">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-4 block w-fit mx-auto uppercase tracking-widest text-xs">
            What You Get
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
            Everything You Need to Win
          </h2>
          <p className="text-gray-400 text-center mb-10">
            Not a course you watch once and forget. A living system you use every day.
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            {WHATS_INCLUDED.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="bg-[#1a1a1a] border-[#333] p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#C9941A]/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#C9941A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-4 bg-[#111]" data-testid="section-testimonials">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Warriors Who Refused to Quit</h2>
          <p className="text-gray-400 text-center mb-10">Real survivors. Real results. Real accountability.</p>

          <div className="grid md:grid-cols-2 gap-5">
            {TESTIMONIALS.map(({ name, days, quote, stars }) => (
              <Card key={name} className="bg-[#1a1a1a] border-[#333] p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#C9941A] text-[#C9941A]" />
                  ))}
                </div>
                <p className="text-gray-200 text-sm leading-relaxed mb-4 italic">"{quote}"</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{name}</span>
                  <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 text-xs">{days}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BONUSES */}
      <section className="py-16 px-4" data-testid="section-bonuses">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-4 block w-fit mx-auto uppercase tracking-widest text-xs">
            Member Bonuses
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-10">
            Free Bonuses When You Join Today
          </h2>

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {BONUSES.map(({ icon: Icon, title, value, description }) => (
              <Card key={title} className="bg-[#1a1a1a] border-[#C9941A]/20 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#C9941A]/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#C9941A]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-white">{title}</h3>
                      <Badge className="bg-[#C9941A]/10 text-[#C9941A] border-[#C9941A]/20 text-xs">{value}</Badge>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Total bonus value: <span className="text-white font-bold line-through">$480</span></p>
            <p className="text-[#C9941A] font-black text-lg">All included FREE with your membership.</p>
          </div>
        </div>
      </section>

      {/* NICK'S STORY */}
      <section className="py-16 px-4 bg-[#111]" data-testid="section-nick-story">
        <div className="max-w-4xl mx-auto">
          {/* ICU video — the proof moment */}
          <div className="mb-14 text-center" data-testid="block-icu-video">
            <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-5 uppercase tracking-widest text-xs">
              Why I Built This
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4 max-w-3xl mx-auto leading-tight">
              This Is Where I Started.
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8 text-base md:text-lg leading-relaxed">
              ICU bed. Weeks after the stroke that should have killed me. The day I found out
              I was having a son. <span className="text-white font-semibold">That moment is why I never gave up</span>{" "}
              — and why every tool in this program exists.
            </p>

            <div
              className="relative max-w-3xl mx-auto rounded-lg overflow-hidden border border-[#333]"
              style={{ aspectRatio: "16 / 9", background: "#000" }}
            >
              <video
                src={icuVideo}
                controls
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-contain"
                data-testid="video-icu"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <p className="mt-6 text-sm text-gray-400 italic max-w-xl mx-auto">
              "If I can come back from that bed, you can come back from yours.
              That's the whole promise of this challenge."
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-4 uppercase tracking-widest text-xs">
                From the Sasquatch himself
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black mb-6">
                "I Defied Every 'Never' They Threw At Me."
              </h2>
              <div className="space-y-4 text-gray-300 leading-relaxed text-sm">
                <p>
                  December 3, 2018. I woke up and couldn't move. 50 staples. Hoyer lift. 0% function on my entire left side. 
                  The doctors were kind, but honest: recovery would be limited. "You'll likely never walk normally again."
                </p>
                <p>
                  I heard "probably" and "likely" — and I decided those words left room for me.
                </p>
                <p>
                  I started experimenting. Combining what the therapists taught me with what I was learning about 
                  neuroplasticity. I built the S.A.S.C.H. Formula — Seize, Absorb, Swing, Combine, Hammer. I tracked everything. 
                  I showed up every day.
                </p>
                <p className="text-white font-bold">
                  Today I type with both hands. I walk without a cane most days. I run a business. 
                  I'm at 90% and still climbing.
                </p>
                <p>
                  The 66-Day Challenge is the exact system I wish I'd had on Day 1. Now it's yours.
                </p>
              </div>
              <p className="mt-6 text-[#C9941A] font-black text-lg italic">
                — Nick "Stroked-Out Sasquatch" Kremers
              </p>
            </div>

            <Card className="bg-[#1a1a1a] border-[#333] p-6">
              <h3 className="font-black text-white text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#C9941A]" />
                The Sasquatch Method
              </h3>
              <div className="space-y-3">
                {[
                  { step: "T", full: "TAKE", desc: "Take what the therapists give you" },
                  { step: "A", full: "APPLY", desc: "Apply it immediately, relentlessly" },
                  { step: "K", full: "KEEP", desc: "Keep tracking what moves the needle" },
                  { step: "E", full: "EXPERIMENT", desc: "Experiment with combinations others haven't tried" },
                  { step: "L", full: "LEARN", desc: "Learn from every session — wins and failures" },
                ].map(({ step, full, desc }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-[#C9941A] flex items-center justify-center">
                      <span className="text-black font-black text-sm">{step}</span>
                    </div>
                    <div>
                      <span className="text-[#C9941A] font-bold text-sm">{full}</span>
                      <p className="text-gray-400 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-16 px-4" data-testid="section-pricing">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-4 block w-fit mx-auto uppercase tracking-widest text-xs">
            Simple Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black mb-4">Community Is Free. The System Is for the Serious.</h2>
          <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
            Join the community at no cost — connect, read, and be around people who understand stroke recovery. 
            When you're ready to commit to the full system, the Warrior plan is waiting.
          </p>

          <div className="grid md:grid-cols-3 gap-5 mb-6">
            {/* Free */}
            <Card className="bg-[#1a1a1a] border-[#333] p-7 flex flex-col">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Community</p>
              <div className="mb-5">
                <div className="text-4xl font-black text-white mb-1">Free</div>
                <p className="text-gray-500 text-xs">Always. No catch.</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "Join the Survivor Community",
                  "Read Nick's recovery blog",
                  "Access free protocols & guides",
                  "The Sasquatch Dispatch newsletter",
                  "Connect with other survivors",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle className="h-3.5 w-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => window.location.href = "/recovery/login?tab=signup"}
                variant="outline"
                className="w-full border-[#333] text-gray-300 font-bold"
                data-testid="button-cta-free"
              >
                Join Free
              </Button>
            </Card>

            {/* Warrior Monthly */}
            <Card className="bg-[#1a1a1a] border-[#C9941A]/50 p-7 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#C9941A]" />
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Warrior — Monthly</p>
              <div className="mb-5">
                <div className="text-4xl font-black text-white mb-1">
                  $47<span className="text-lg text-gray-400 font-normal">/mo</span>
                </div>
                <p className="text-gray-500 text-xs">After 7-day free trial. Cancel anytime.</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "Everything in Free",
                  "Full 66-Day Challenge system",
                  "All protocols & video lessons",
                  "Accountability pod placement",
                  "24/7 Sasquatch AI Coach",
                  "Monthly new content — ongoing for life",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle className="h-3.5 w-3.5 text-[#C9941A] flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={handleCTA} className="w-full bg-[#C9941A] text-black font-black" data-testid="button-cta-monthly">
                Start Free 7-Day Trial
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Card>

            {/* Elite Annual */}
            <Card className="bg-[#1a1a1a] border-[#C9941A]/30 p-7 relative overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest text-gray-400">Warrior — Annual</p>
                <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 text-xs font-black">Save $167</Badge>
              </div>
              <div className="mb-5">
                <div className="text-4xl font-black text-white mb-1">
                  $397<span className="text-lg text-gray-400 font-normal">/yr</span>
                </div>
                <p className="text-[#C9941A] text-xs font-semibold">~$33/month · Best commitment</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "Everything in Monthly",
                  "Year 2 & Year 3+ protocols",
                  "Priority community access",
                  "Annual recovery review",
                  "First access to new programs",
                  "Serious about the long game",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle className="h-3.5 w-3.5 text-[#C9941A] flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={handleCTA} variant="outline" className="w-full border-[#C9941A] text-[#C9941A] font-bold" data-testid="button-cta-annual">
                Start Free Trial
              </Button>
            </Card>
          </div>

          <p className="text-xs text-gray-500 text-center">
            <Shield className="inline h-3 w-3 mr-1 text-[#C9941A]" />
            Secure checkout. Cancel anytime. Individual results vary — stroke recovery is a personal journey.
          </p>
        </div>
      </section>

      {/* LIFETIME COMMITMENT — the honest section */}
      <section className="py-16 px-4 bg-[#0a0a0a]" data-testid="section-lifetime">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-4 block w-fit mx-auto uppercase tracking-widest text-xs">
            The Real Talk
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
            This Is a Lifetime Commitment.<br />
            <span style={{ color: "#C9941A" }}>We're Honest About That.</span>
          </h2>
          <p className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">
            Nick is in Year 7 and still actively recovering. The science of neuroplasticity doesn't have an 
            expiration date — and neither does your potential. Here's what each phase of the long game looks like.
          </p>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { period: "Days 1–66", label: "The Foundation", color: "#C9941A", desc: "Build the habit that outlasts every plateau. The 66-Day Challenge. Your entry into the system." },
              { period: "Year 1–2", label: "Momentum", color: "#FF6B35", desc: "Compound progress. Major functional gains. The identity shift from 'patient' to 'architect of recovery.'" },
              { period: "Year 3–5", label: "Optimization", color: "#22C55E", desc: "Refining what works. Deeper protocols. Starting to become the example others look to." },
              { period: "Year 5+", label: "Legacy", color: "#8B5CF6", desc: "Nick's territory. Still improving. Teaching others. Your story becomes someone else's survival guide." },
            ].map(({ period, label, color, desc }) => (
              <Card key={period} className="bg-[#1a1a1a] border-[#333] p-5">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color }}>{period}</div>
                <div className="font-black text-white text-lg mb-3" style={{ color }}>{label}</div>
                <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
              </Card>
            ))}
          </div>

          <Card className="bg-[#1a1a1a] border-[#333] p-6 mt-6">
            <div className="flex gap-4 items-start">
              <Shield className="h-5 w-5 text-[#C9941A] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-1 text-sm">Important: This Is Not Medical Advice</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  The Sasquatch Doctrine, 66-Day Challenge, and all content provided by Stroke Recovery Academy 
                  are intended for motivational and informational purposes only. They are not a substitute for 
                  professional medical advice, diagnosis, or treatment. Individual results vary significantly. 
                  Always consult your physician, neurologist, or licensed therapist before beginning any new 
                  rehabilitation program. Nick's recovery is his story — yours is your own.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-[#111]" data-testid="section-faq">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10">Questions? We've Got Answers.</h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <div
                key={i}
                className="border border-[#333] rounded-lg bg-[#1a1a1a] overflow-hidden"
                data-testid={`faq-${i}`}
              >
                <button
                  className="w-full text-left p-5 flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  data-testid={`button-faq-${i}`}
                >
                  <span className="font-bold text-white text-sm">{q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-[#C9941A] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-[#333] pt-4">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter capture — before final CTA */}
      <section className="py-16 px-4" data-testid="section-newsletter">
        <div className="max-w-xl mx-auto">
          <NewsletterSignupWidget
            source="challenge"
            headline="Not ready to commit yet? Start here."
            subheadline="10 emails from Nick over 67 days. His real story, the protocol, the hard days. Free. No pitch until the last email."
          />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4 bg-gradient-to-t from-[#C9941A]/10 to-transparent" data-testid="section-final-cta">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Heart Still Thumpin'?<br />
            <span className="text-[#C9941A]">Life Still Pumpin'.</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Let's build. Day 1 starts the moment you click below.
          </p>
          <Button
            onClick={handleCTA}
            size="lg"
            className="bg-[#C9941A] hover:bg-[#C9941A] text-black font-black text-xl px-12 py-7"
            data-testid="button-cta-final"
          >
            Begin My 66-Day Transformation
            <Flame className="ml-3 h-5 w-5" />
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            <Clock className="inline h-3.5 w-3.5 mr-1" />
            Challenge starts soon. Secure your spot now.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
