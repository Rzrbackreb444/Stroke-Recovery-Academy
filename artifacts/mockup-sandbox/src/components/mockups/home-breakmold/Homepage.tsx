import React, { useState } from "react";
import {
  Flame, Menu, X, ArrowRight, Play, BrainCircuit, CalendarDays,
  Users, CheckCircle2, ShieldCheck, Activity, Star, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import "./_theme.css";

// Breaking the Mold — wheelchair bursting through shattered glass.
// The concept: recovery isn't a ceiling you accept, it's a wall you smash
// through. Dark, defiant, gold-shard accents over the existing brand system.

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-black/85 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3">
            <img src="/__mockup/images/sra-logo.png" alt="Stroke Recovery Academy" className="h-12 w-12 object-contain" />
            <span className="font-bold text-lg tracking-tight text-white">Stroke Recovery Academy</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["The Method", "Proof", "Program", "Guides"].map((l) => (
              <a key={l} href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">{l}</a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <a href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Sign in</a>
            <Button className="bg-gold text-black hover:bg-gold/90 rounded-md font-semibold px-6">Get started</Button>
          </div>
          <button className="md:hidden p-2 text-white/70" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative bg-black overflow-hidden">
      <div className="absolute inset-0">
        <img src="/__mockup/images/hero-breakmold.png" alt="" className="w-full h-full object-cover object-right opacity-45" />
        {/* Left-to-right wash keeps the headline readable; bottom fade blends into the stats strip. */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      {/* Gold shard streak — the "break" line slicing across the hero. */}
      <div
        className="absolute -right-10 top-0 h-full w-px bg-gold/40 hidden lg:block"
        style={{ transform: "rotate(8deg)", transformOrigin: "top" }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 mb-8">
              <Zap className="h-3.5 w-3.5 text-gold" fill="currentColor" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">Breaking the mold since 2019</span>
            </div>
            <h1 className="font-display text-white text-7xl md:text-8xl lg:text-[8.5rem] leading-[0.85] mb-8">
              Break <span className="text-gold">the</span> mold.
            </h1>
            <p className="text-xl text-white/75 mb-10 leading-relaxed max-w-xl">
              They told me this was as good as it gets. So I shattered the ceiling — one rep at a time. The system stabilizes you and stops. We don't. Six weeks out or six years in, you keep showing up, and so do we.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gold text-black hover:bg-gold/90 h-14 px-8 text-base rounded-md w-full sm:w-auto font-semibold">
                Start your recovery <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-md w-full sm:w-auto border-white/20 bg-white/5 text-white backdrop-blur hover:bg-white/10">
                <Play className="mr-2 h-4 w-4" /> See his story
              </Button>
            </div>
            <div className="mt-12 flex items-center gap-4 text-sm text-white/50 font-medium">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-white/20" />)}
              </div>
              <p>50,000+ survivors refusing the limit they were handed</p>
            </div>
          </div>

          {/* Floating product proof — the work behind the defiance. */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl bg-white/95 backdrop-blur-md p-6 shadow-2xl border border-white/40 max-w-sm ml-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-neutral-900">Today's Protocol</div>
                <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-1 rounded">3/5 done</span>
              </div>
              <div className="space-y-3">
                {[
                  { t: "Mirror Therapy (15m)", done: true },
                  { t: "Sit-to-Stand Drills (20 reps)", done: false },
                  { t: "Mental Rehearsal (10m)", done: false },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {row.done
                      ? <CheckCircle2 className="text-gold w-5 h-5 shrink-0" />
                      : <div className="w-5 h-5 rounded-full border-2 border-neutral-300 shrink-0" />}
                    <span className={`text-sm font-medium ${row.done ? "text-neutral-400 line-through" : "text-neutral-800"}`}>{row.t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center gap-2 text-xs text-neutral-500">
                <Flame className="w-4 h-4 text-gold" /> 412-day streak — heart's still thumpin'
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  const stats = [
    { n: "50,000+", l: "Survivors" },
    { n: "0% → 90%", l: "Function restored" },
    { n: "365", l: "Days of reps" },
    { n: "7", l: "Years of proof" },
  ];
  return (
    <section className="bg-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center px-4">
              <div className="font-display text-black text-4xl md:text-5xl mb-1">{s.n}</div>
              <div className="text-sm font-bold text-black/70 uppercase tracking-wider">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Method() {
  const cards = [
    { icon: Activity, t: "Track everything", d: "Data drives recovery. Log your reps, mood, and the small wins that add up." },
    { icon: ShieldCheck, t: "Gentle accountability", d: "The system checks in. Miss a day and we notice — and so does your squad." },
    { icon: BrainCircuit, t: "Force adaptation", d: "Specific, targeted protocols designed to help your brain rewire itself." },
  ];
  return (
    <section id="method" className="bg-[#FAF9F6] py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-bold tracking-widest uppercase text-gold mb-5">The Sasquatch Method</p>
        <h2 className="font-display text-neutral-900 text-4xl md:text-6xl mb-8 leading-[0.95]">
          No fake hope.<br />Just the work — together.
        </h2>
        <p className="text-xl text-neutral-600 leading-relaxed mb-14 max-w-3xl mx-auto">
          The hospital sends you home when you're "stable." We pick it up from there. Recovery is thousands of daily repetitions — so we give you the structure, the routines, and the steady accountability to keep going when nobody else is watching.
        </p>
        <div className="grid sm:grid-cols-3 gap-6 text-left">
          {cards.map((c, i) => (
            <div key={i} className="p-7 rounded-xl bg-white border border-neutral-200">
              <div className="w-12 h-12 rounded-lg bg-gold/10 text-gold flex items-center justify-center mb-5">
                <c.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-neutral-900">{c.t}</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section id="proof" className="relative bg-black py-28 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,_rgba(226,116,27,0.5),_transparent_60%)]" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Star className="w-8 h-8 text-gold mb-6" fill="currentColor" />
            <h2 className="font-display text-3xl md:text-5xl mb-6 leading-[0.95]">
              "They said I'd never walk again. I said — watch me."
            </h2>
            <p className="text-white/60 text-lg mb-8 leading-relaxed">
              Nick Kremers had a massive hemorrhagic stroke at 36 that left him paralyzed on his right side. Seven years later — through the exact methods taught in this academy — he's regained 90% of his function. That's not a miracle. That's a mold, broken on purpose.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold/40">
                <img src="/__mockup/images/nick-founder-portrait.png" alt="Nick Kremers" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-lg">Nick Kremers</div>
                <div className="text-white/50">Founder, Stroke Recovery Academy</div>
              </div>
            </div>
          </div>
          <div className="relative aspect-video bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer">
            <img src="/__mockup/images/manifesto-stairs.png" alt="" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gold/90 flex items-center justify-center group-hover:scale-105 transition-transform">
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
    <section id="features" className="bg-white py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-sm font-bold tracking-widest uppercase text-gold mb-4">The Toolkit</p>
          <h2 className="font-display text-neutral-900 text-4xl md:text-5xl">Everything you need to rebuild.</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
          <div className="order-2 md:order-1 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 p-8">
            <img src="/__mockup/images/home-clean-ui.png" alt="AI Coach interface" className="w-full h-auto rounded-lg border border-neutral-200" />
          </div>
          <div className="order-1 md:order-2">
            <div className="w-12 h-12 rounded-lg bg-gold/10 text-gold flex items-center justify-center mb-6"><BrainCircuit className="w-6 h-6" /></div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">AI Recovery Coach</h3>
            <p className="text-neutral-600 text-lg leading-relaxed">
              A personalized companion trained on the Sasquatch Method. It builds your daily protocols, adjusts to how you're doing, and keeps you on track — encouraging, never preachy.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="w-12 h-12 rounded-lg bg-neutral-900 text-white flex items-center justify-center mb-6"><CalendarDays className="w-6 h-6" /></div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">Daily Routines & Protocols</h3>
            <p className="text-neutral-600 text-lg leading-relaxed">
              Stop guessing what to do. Get structured daily regimens that target neuroplasticity — from mirror therapy to mental rehearsal — scaled to your level and delivered when you need them.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 p-8">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-3">
              {[
                { icon: Users, t: "Accountability Pod", s: "Your squad of 5" },
                { icon: Activity, t: "Daily Reps Log", s: "Streak: 412 days" },
                { icon: ShieldCheck, t: "Caregiver View", s: "Shared progress" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg border-neutral-100 bg-neutral-50">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded bg-gold/10 text-gold flex items-center justify-center"><row.icon className="w-5 h-5" /></div>
                    <div>
                      <div className="font-semibold text-sm text-neutral-900">{row.t}</div>
                      <div className="text-xs text-neutral-500">{row.s}</div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-gold" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Caregiver() {
  return (
    <section className="bg-gold py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-black">
        <p className="text-sm font-bold tracking-[0.3em] uppercase mb-5">For Caregivers</p>
        <h2 className="font-display text-4xl md:text-6xl mb-6 leading-[0.95]">You're not the patient — but you carry it too.</h2>
        <p className="text-lg font-medium opacity-80 mb-10 max-w-2xl mx-auto leading-relaxed">
          You're the one Googling at 2 a.m., scheduling the appointments, quietly holding it together. Nobody built a system that took your seat seriously — until now. Let us handle the daily reminders. You just have to keep standing.
        </p>
        <Button size="lg" className="bg-black text-white hover:bg-black/85 h-14 px-8 text-base rounded-md font-semibold">
          Open the caregiver kit <ArrowRight className="ml-2 h-5 w-5" />
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
    <section id="guides" className="bg-[#FAF9F6] py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-widest uppercase text-gold mb-4">Latest Guides</p>
            <h2 className="font-display text-neutral-900 text-3xl md:text-5xl mb-3">The questions every survivor asks.</h2>
            <p className="text-lg text-neutral-600">Honest, in-the-trenches answers. No fluff, no fake hope.</p>
          </div>
          <a href="#" className="text-neutral-900 font-semibold inline-flex items-center hover:text-gold transition-colors shrink-0">
            See all 48 guides <ArrowRight className="ml-2 w-4 h-4" />
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {guides.map((g, i) => (
            <a key={i} href="#" className="group block border border-neutral-200 rounded-xl p-7 hover:shadow-lg transition-all hover:border-neutral-300 bg-white">
              <div className="w-10 h-10 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-6 group-hover:bg-gold group-hover:text-black group-hover:border-gold transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-gold transition-colors">{g.t}</h3>
              <p className="text-neutral-600 leading-relaxed">{g.d}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative bg-black py-32 text-center overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_rgba(226,116,27,0.5),_transparent_60%)]" />
      <div className="relative z-10 max-w-3xl mx-auto px-4">
        <h2 className="font-display text-white text-5xl md:text-7xl mb-8 leading-[0.9]">Your turn to break it.</h2>
        <p className="text-xl text-white/60 mb-12">
          Join 50,000+ survivors who refused the limit they were handed — rebuilding at whatever pace recovery takes. Start when you're ready.
        </p>
        <Button size="lg" className="bg-gold text-black hover:bg-gold/90 h-16 px-12 text-lg rounded-md font-semibold w-full sm:w-auto">
          Start your recovery
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#050505] py-16 border-t border-white/10 text-white/50 text-sm text-center">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/__mockup/images/sra-logo.png" alt="Stroke Recovery Academy" className="h-14 w-14 object-contain" />
          <span className="font-bold text-white text-xl tracking-tight">Stroke Recovery Academy</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {["The Method", "Guides", "Caregivers", "Sign In"].map((l) => (
            <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <p>© {new Date().getFullYear()} Stroke Recovery Academy. All rights reserved.</p>
        <p className="mt-4 text-xs max-w-2xl mx-auto opacity-70 leading-relaxed">
          A non-clinical, survivor-led platform. It provides accountability and tools for stroke survivors and caregivers — it does not provide medical diagnosis or replace professional clinical advice. Always consult your physician before starting a new physical regimen.
        </p>
      </div>
    </footer>
  );
}

export function Homepage() {
  return (
    <div className="min-h-screen bg-black font-sans">
      <Header />
      <Hero />
      <StatsStrip />
      <Method />
      <Proof />
      <Features />
      <Caregiver />
      <Guides />
      <FinalCTA />
      <Footer />
    </div>
  );
}
