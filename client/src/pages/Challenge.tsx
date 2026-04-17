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
    description: "The exact battle-tested system Nick used: TAKE-LEARN-EXPERIMENT-COMBINE-APPLY. The 5-step method that drives real neuroplasticity, not just symptom management.",
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
    description: "Mastery. You're no longer doing the habit — you ARE the habit. This is where the new identity locks in. You don't go back from here.",
    wins: ["Locked-in recovery identity", "Advanced neuroplasticity protocols", "Legacy planning begins", "Prepare to keep going past Day 66"],
  },
];

const FAQS = [
  {
    q: "Who is this for?",
    a: "Stroke survivors at any stage — whether your stroke was 3 months ago or 10 years ago. If you're plateaued, frustrated, or just ready to stop accepting limitations, this challenge was built for you.",
  },
  {
    q: "I have drop foot / arm weakness / aphasia. Will this work for me?",
    a: "Yes. The challenge is designed around stroke-specific challenges. Nick himself dealt with full paralysis on his left side, drop foot, and cognitive fog. The program addresses physical, cognitive, speech, and mindset recovery.",
  },
  {
    q: "What if I miss a day?",
    a: "The Never Zero principle: one small action keeps the signal alive. Even 5 minutes counts. The challenge is about momentum, not perfection. Miss a day? Get back up. That's the whole lesson.",
  },
  {
    q: "How much time does it take each day?",
    a: "30 to 60 minutes is ideal. The daily check-in takes 5 minutes. Exercises and video lessons expand from there. You go as hard as your body allows — the system scales to you.",
  },
  {
    q: "Is there a real community or just a chat box?",
    a: "Real community. Accountability pods of 5-8 survivors. A shared activity feed. Fellow warriors who post their wins, struggles, and breakthroughs daily. Nick is active in the community.",
  },
  {
    q: "What if it doesn't work for me?",
    a: "The 7-day free trial means zero risk. Try the whole system. If you're not seeing value by Day 7, cancel and pay nothing. If you do 66 days and don't experience measurable progress, we'll make it right.",
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
          <p className="text-xl md:text-2xl text-white font-bold mb-10 max-w-3xl mx-auto">
            I defied every "never" and rebuilt to <span className="text-[#C9941A]">90%+</span> and still rising.{" "}
            Now I'm helping other survivors do the same.
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

          <p className="text-sm text-gray-500">
            <Shield className="inline h-3.5 w-3.5 mr-1 text-[#C9941A]" />
            7 days free. Cancel anytime. No credit card surprises.
          </p>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-[#1a1a1a] border-y border-[#333] py-6 px-4" data-testid="section-stats">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "50,000+", label: "Warriors Worldwide" },
            { value: "66", label: "Days to Transform" },
            { value: "90%+", label: "Nick's Recovery" },
            { value: "3 Phases", label: "Survival → Mastery" },
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
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
            3 Phases. 66 Days. One New Identity.
          </h2>

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
                  neuroplasticity. I built the TAKE-LEARN-EXPERIMENT-COMBINE-APPLY formula. I tracked everything. 
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
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Start Free. Then Decide.</h2>
          <p className="text-gray-400 mb-10">
            7 days completely free. No credit card games. Cancel anytime before Day 7 and pay nothing.
          </p>

          <Card className="bg-[#1a1a1a] border-[#C9941A]/40 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#C9941A]" />
            <Badge className="bg-[#C9941A] text-black font-black mb-4">Most Popular — Warrior Plan</Badge>

            <div className="mb-6">
              <div className="text-5xl font-black text-white mb-1">
                $14.99<span className="text-xl text-gray-400 font-normal">/mo</span>
              </div>
              <p className="text-gray-400 text-sm">Or $149/year (save $30)</p>
            </div>

            <ul className="text-left space-y-3 mb-8">
              {[
                "Full 66-Day Transformation Challenge",
                "Daily check-in + progress tracking",
                "All video lessons & protocols",
                "Sasquatch Tribe community access",
                "Accountability pod placement",
                "24/7 Sasquatch AI Coach",
                "All member bonuses included",
                "New content added monthly",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-[#C9941A] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Button
              onClick={handleCTA}
              className="w-full bg-[#C9941A] hover:bg-[#C9941A] text-black font-black text-lg py-6"
              data-testid="button-cta-pricing"
            >
              Start Free 7-Day Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              <Shield className="inline h-3 w-3 mr-1" />
              Secure checkout. Cancel anytime. 100% satisfaction or your money back.
            </p>
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
