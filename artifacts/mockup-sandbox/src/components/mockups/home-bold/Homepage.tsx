import React from "react";
import { ArrowRight, Flame, ChevronRight, Activity, Shield, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import "./_theme.css";

// 1. Sticky header / nav
function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-brand-accent" />
          <span className="text-xl font-black text-white uppercase tracking-widest">Stroke Recovery</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#method" className="text-sm font-bold text-white/70 hover:text-white uppercase tracking-wider">Method</a>
          <a href="#proof" className="text-sm font-bold text-white/70 hover:text-white uppercase tracking-wider">Proof</a>
          <a href="#guides" className="text-sm font-bold text-white/70 hover:text-white uppercase tracking-wider">Guides</a>
        </nav>
        <div className="flex items-center gap-4">
          <a href="/login" className="hidden sm:inline-block text-sm font-bold text-white/70 hover:text-white uppercase tracking-wider">Sign In</a>
          <Button className="bg-brand-accent text-black font-black uppercase tracking-widest hover:bg-brand-accent/90 rounded-none h-10 px-6">
            Start Recovery
          </Button>
        </div>
      </div>
    </header>
  );
}

// 2. Hero
function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-black overflow-hidden border-b border-white/10">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/__mockup/images/hero-warrior-training.png" 
          alt="Warrior training" 
          className="w-full h-full object-cover opacity-40 grayscale-[50%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 pt-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 mb-8">
            <Flame className="h-4 w-4 text-brand-accent" />
            <span className="text-brand-accent text-xs font-black uppercase tracking-[0.2em]">The Stroked-Out Sasquatch</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] tracking-tighter mb-8 uppercase">
            From <span className="text-brand-accent">0%</span><br />
            To <span className="text-white">90%</span><br />
            Recovery.
          </h1>

          <p className="text-xl md:text-2xl text-white/80 max-w-2xl font-medium leading-relaxed mb-4 border-l-4 border-brand-accent pl-6">
            December 3, 2018. Hoyer lift. 50 staples. Complete paralysis on one side. Doctors with no promises.
          </p>

          <p className="text-lg text-white/60 max-w-2xl mb-12 pl-7 leading-relaxed">
            Today Nick Kremers types with both hands, runs a thriving business, and has reached 90,000+ stroke survivors across social media — using techniques that don't exist in any medical textbook. This is the Sasquatch Method.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-brand-accent text-black font-black uppercase tracking-widest text-lg h-16 px-10 rounded-none hover:bg-brand-accent/90">
              Find My Recovery Plan
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white font-bold uppercase tracking-widest text-lg h-16 px-10 rounded-none hover:bg-white/5 hover:text-white bg-transparent">
              Watch Nick's Story
              <PlayCircle className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// 3. Stats Strip
function StatsStrip() {
  const stats = [
    { value: "50", label: "Staples in his skull" },
    { value: "0%", label: "Starting function" },
    { value: "90%", label: "Recovery achieved" },
    { value: "6+", label: "Years of proof" },
  ];

  return (
    <div className="bg-brand-accent text-black border-b border-black">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x divide-black/20">
          {stats.map((stat, i) => (
            <div key={i} className="text-center px-4">
              <div className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 tracking-tighter">{stat.value}</div>
              <div className="text-sm md:text-base font-bold uppercase tracking-widest opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 4. Accountability Manifesto
function Manifesto() {
  return (
    <section id="method" className="relative py-32 bg-black border-b border-white/10 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
            We Show Up For Your <span className="text-brand-accent">Reps</span>
          </h2>
          <div className="space-y-6 text-lg text-white/70 leading-relaxed font-medium">
            <p>
              Recovery isn't only clinical — it's daily, stubborn work. The hospital sends you home when you're "stable." We pick it up from there, with a clear plan and people who keep showing up alongside you.
            </p>
            <p>
              The promise is simple: a real blueprint, daily routines, and accountability that actually checks in. Miss a day and we notice — gently. The Sasquatch Method meets you where you are and moves at your pace, whether you're six weeks out or six years in.
            </p>
          </div>
          <Button variant="link" className="mt-8 text-brand-accent p-0 font-bold uppercase tracking-widest text-lg hover:text-white">
            Read the full doctrine <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
        <div className="relative aspect-square">
          <div className="absolute inset-0 bg-brand-accent/20 translate-x-4 translate-y-4" />
          <img 
            src="/__mockup/images/manifesto-stairs.png" 
            alt="Stairs" 
            className="absolute inset-0 w-full h-full object-cover border border-white/10 grayscale"
          />
        </div>
      </div>
    </section>
  );
}

// 5. Testimony
function Testimony() {
  return (
    <section id="proof" className="py-32 bg-[#050505] border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-16">
          The <span className="text-brand-accent">Living</span> Proof
        </h2>
        <div className="max-w-4xl mx-auto bg-black border border-white/10 p-8 md:p-16 relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-accent text-black font-black text-6xl leading-none px-4 pt-4 pb-2">"</div>
          <p className="text-2xl md:text-4xl font-bold text-white leading-tight mb-8 mt-4 uppercase">
            If the Sasquatch can do it — so can you.
          </p>
          <div className="flex items-center justify-center gap-4">
            <img src="/__mockup/images/nick-founder-portrait.png" alt="Nick Kremers" className="w-16 h-16 rounded-full object-cover border-2 border-brand-accent" />
            <div className="text-left">
              <div className="font-black text-white uppercase tracking-wider">Nick Kremers</div>
              <div className="text-brand-accent text-sm font-bold tracking-widest uppercase">7-Year Survivor</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 6. What you get
function WhatYouGet() {
  const features = [
    { title: "AI Coach", desc: "A personalized AI coach that keeps you on track and adapts to your day — encouraging, never preachy.", icon: Activity },
    { title: "Daily Routines", desc: "The reps and movements that took Nick from zero to ninety — scaled to your level, structured daily.", icon: Flame },
    { title: "Accountability Pod", desc: "You're not alone. Connect with other survivors and caregivers walking the same road.", icon: Shield },
  ];

  return (
    <section className="py-32 bg-black border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-16 text-center">
          The <span className="text-brand-accent">Toolkit</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-[#050505] border border-white/10 p-10 hover:border-brand-accent/50 transition-colors group">
              <f.icon className="w-12 h-12 text-white/20 mb-8 group-hover:text-brand-accent transition-colors" />
              <h3 className="text-2xl font-black text-white uppercase tracking-wide mb-4">{f.title}</h3>
              <p className="text-white/60 font-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 7. Caregiver CTA
function CaregiverCTA() {
  return (
    <section className="py-24 bg-brand-accent border-b border-black">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-black">
        <div className="max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] mb-4">For Caregivers</p>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
            You're not the patient.<br />But you carry it too.
          </h2>
          <p className="text-xl font-bold opacity-80 mb-8 max-w-2xl">
            You're the one Googling at 2 a.m., scheduling the appointments, quietly holding it together. Nobody built a system that took your seat seriously — until now. Let us handle the daily reminders. You just have to keep standing.
          </p>
          <Button size="lg" className="bg-black text-white font-black uppercase tracking-widest rounded-none h-14 px-8 hover:bg-black/80">
            Open the caregiver kit <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// 8. Latest Guides
function Guides() {
  const guides = [
    { title: "How long does rehab take?", desc: "The real timeline. Not the one the hospital gave you." },
    { title: "Can you fully recover?", desc: "What the research says and what seven years actually looks like." },
    { title: "Stroke fatigue", desc: "Why you sleep ten hours and still feel wrecked. And what to do about it." },
  ];

  return (
    <section id="guides" className="py-32 bg-[#050505] border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="flex justify-between items-end mb-16">
          <div>
            <p className="text-brand-accent text-sm font-black uppercase tracking-widest mb-2">Latest Guides</p>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
              The Playbook
            </h2>
          </div>
          <a href="#" className="hidden md:flex items-center text-white/50 font-bold uppercase tracking-wider hover:text-brand-accent">
            See All <ArrowRight className="ml-2 w-4 h-4" />
          </a>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {guides.map((g, i) => (
            <a key={i} href="#" className="block group">
              <div className="aspect-video bg-black border border-white/10 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-accent/5 group-hover:bg-brand-accent/20 transition-colors" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <span className="text-white/20 font-black text-6xl leading-none">0{i+1}</span>
                  <ChevronRight className="w-8 h-8 text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />
                </div>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wide mb-2 group-hover:text-brand-accent transition-colors">{g.title}</h3>
              <p className="text-white/60 font-medium">{g.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// 9. Final CTA
function FinalCTA() {
  return (
    <section className="py-40 bg-black relative overflow-hidden border-b border-white/10 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,148,26,0.1)_0%,transparent_50%)]" />
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-8">
          Time To Put In <br/><span className="text-brand-accent">The Reps.</span>
        </h2>
        <p className="text-xl text-white/60 font-medium mb-12">
          Join 50,000+ survivors rebuilding their lives — at whatever pace recovery takes. Start when you're ready.
        </p>
        <Button size="lg" className="bg-brand-accent text-black font-black uppercase tracking-widest text-xl h-20 px-16 rounded-none hover:bg-brand-accent/90">
          Start Your Recovery
        </Button>
      </div>
    </section>
  );
}

// 10. Footer
function Footer() {
  return (
    <footer className="bg-[#050505] pt-24 pb-12">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-4 gap-12 border-b border-white/10 pb-16 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Flame className="h-8 w-8 text-brand-accent" />
              <span className="text-2xl font-black text-white uppercase tracking-widest">Stroke Recovery</span>
            </div>
            <p className="text-white/50 font-medium max-w-md">
              A non-clinical, survivor-led platform helping survivors and caregivers rebuild function through accountability, daily reps, and the Sasquatch Method.
            </p>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-white/50 hover:text-brand-accent font-bold uppercase tracking-wider text-sm">Dashboard</a></li>
              <li><a href="#" className="text-white/50 hover:text-brand-accent font-bold uppercase tracking-wider text-sm">The Method</a></li>
              <li><a href="#" className="text-white/50 hover:text-brand-accent font-bold uppercase tracking-wider text-sm">Caregivers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-white/50 hover:text-white font-bold uppercase tracking-wider text-sm">Terms</a></li>
              <li><a href="#" className="text-white/50 hover:text-white font-bold uppercase tracking-wider text-sm">Privacy</a></li>
              <li><a href="#" className="text-white/50 hover:text-white font-bold uppercase tracking-wider text-sm">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/30 text-sm font-bold uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Stroke Recovery Academy. All rights reserved.</p>
          <p>Not medical advice.</p>
        </div>
      </div>
    </footer>
  );
}

export function Homepage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-accent selection:text-black">
      <Header />
      <main>
        <Hero />
        <StatsStrip />
        <Manifesto />
        <Testimony />
        <WhatYouGet />
        <CaregiverCTA />
        <Guides />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
