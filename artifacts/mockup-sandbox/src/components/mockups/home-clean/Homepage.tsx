import React, { useState } from "react";
import { Link } from "wouter";
import { 
  ChevronRight, 
  Menu, 
  X, 
  Play, 
  ArrowRight, 
  BrainCircuit, 
  CalendarDays, 
  Users, 
  Dumbbell, 
  CheckCircle2, 
  ShieldCheck, 
  Activity, 
  Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Homepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-slate-200">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-[#FDFDFD]/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center">
                <span className="text-white font-bold text-lg leading-none">S</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Stroke Recovery Academy
              </span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#method" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">The Method</a>
              <a href="#proof" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Proof</a>
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Program</a>
              <a href="#guides" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Guides</a>
            </nav>
            
            <div className="hidden md:flex items-center gap-4">
              <a href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign in</a>
              <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-md font-semibold px-6">
                Get started
              </Button>
            </div>

            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">By Nick Kremers, 7-Year Survivor</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                From 0% to 90% recovery. <br className="hidden lg:block"/>
                <span className="text-slate-400">The daily reps that rewrite the brain.</span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                The medical system stabilizes you. We rebuild you. The #1 stroke recovery platform built by a survivor, enforcing accountability and daily reps to force neuroplasticity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 h-14 px-8 text-base rounded-md w-full sm:w-auto">
                  Start your recovery <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-base border-slate-300 text-slate-700 hover:bg-slate-50 w-full sm:w-auto">
                  Watch the documentary
                </Button>
              </div>
              
              <div className="mt-12 flex items-center gap-4 text-sm text-slate-500 font-medium">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
                <p>Join 50,000+ warriors rebuilding their lives</p>
              </div>
            </div>
            
            <div className="relative lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <img 
                src="/__mockup/images/home-clean-hero.png" 
                alt="Abstract recovery concept" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/20 to-transparent"></div>
              
              {/* Floating UI Elements */}
              <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-semibold text-slate-900">Today's Protocol</div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">3/5 Complete</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-blue-600 w-5 h-5" />
                    <span className="text-sm text-slate-700 font-medium line-through">Mirror Therapy (15m)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                    <span className="text-sm text-slate-900 font-medium">Sit-to-Stand Drills (20 reps)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-slate-200 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-200/50">
            <div className="text-center px-4">
              <div className="text-4xl font-bold text-slate-900 mb-2">50,000+</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Warriors</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-bold text-slate-900 mb-2">0% → 90%</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Function Restored</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-bold text-slate-900 mb-2">365</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Days of Reps</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-bold text-slate-900 mb-2">1</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Mission</div>
            </div>
          </div>
        </div>
      </section>

      {/* Accountability Manifesto */}
      <section id="method" className="py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm font-bold tracking-widest uppercase text-blue-600 mb-6">The Sasquatch Method</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-10 leading-tight">
            We don't do fake hope. <br className="hidden md:block"/>
            We do accountability.
          </h3>
          <p className="text-xl text-slate-600 leading-relaxed mb-12">
            The hospital discharged you. The insurance ran out. Now you're sitting on the couch waiting for a miracle. The miracle is neuroplasticity, and the cost is thousands of daily repetitions. We provide the structure, the routines, and the relentless accountability to make sure you do the work when nobody else is watching.
          </p>
          <div className="grid sm:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
              <Activity className="w-8 h-8 text-slate-900 mb-4" />
              <h4 className="font-bold text-lg mb-2">Track Everything</h4>
              <p className="text-slate-600 text-sm leading-relaxed">Data drives recovery. Log your reps, mood, and micro-wins.</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-8 h-8 text-slate-900 mb-4" />
              <h4 className="font-bold text-lg mb-2">No Excuses</h4>
              <p className="text-slate-600 text-sm leading-relaxed">Our system checks in. If you miss a day, we notice. The squad notices.</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
              <BrainCircuit className="w-8 h-8 text-slate-900 mb-4" />
              <h4 className="font-bold text-lg mb-2">Force Adaptation</h4>
              <p className="text-slate-600 text-sm leading-relaxed">Specific, targeted protocols designed to force your brain to rewire.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimony / Social Proof */}
      <section id="proof" className="bg-slate-900 py-32 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">"They said I'd never walk again. I said 'watch me.'"</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Nick Kremers suffered a massive hemorrhagic stroke that left him completely paralyzed on his right side. Seven years later, through the exact methods taught in this academy, he has regained 90% of his function.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                   <img src="/__mockup/images/home-clean-hero.png" className="w-full h-full object-cover opacity-50" />
                </div>
                <div>
                  <div className="font-bold text-lg">Nick Kremers</div>
                  <div className="text-slate-400">Founder, Stroke Recovery Academy</div>
                </div>
              </div>
            </div>
            <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-2xl group cursor-pointer">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors z-10 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </div>
              <img src="/__mockup/images/home-clean-hero.png" alt="Video thumbnail" className="w-full h-full object-cover opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Features */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-bold tracking-widest uppercase text-blue-600 mb-4">The Platform</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900">Everything you need to rebuild.</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center mb-24">
            <div className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-100 p-8">
              <img src="/__mockup/images/home-clean-ui.png" alt="AI Coach Interface" className="w-full h-auto rounded-lg shadow-sm border border-slate-200" />
            </div>
            <div className="order-1 md:order-2">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">AI Recovery Coach</h4>
              <p className="text-slate-600 text-lg leading-relaxed">
                A relentless companion trained on the Sasquatch Method. It builds your daily protocols, adjusts difficulty based on your logging, and holds you accountable when you try to skip a day.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div>
              <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-6">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">Daily Routines & Protocols</h4>
              <p className="text-slate-600 text-lg leading-relaxed">
                Stop guessing what exercises to do. Get structured daily regimens targeting neuroplasticity—from mirror therapy to mental rehearsal—delivered exactly when you need them.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-100 p-8">
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="flex items-center justify-between p-4 border rounded-lg border-slate-100 bg-slate-50">
                     <div className="flex gap-4 items-center">
                       <div className="w-10 h-10 rounded bg-slate-200"></div>
                       <div>
                         <div className="h-4 w-24 bg-slate-300 rounded mb-2"></div>
                         <div className="h-3 w-16 bg-slate-200 rounded"></div>
                       </div>
                     </div>
                     <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Caregiver CTA */}
      <section className="bg-slate-50 py-24 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-6">For Caregivers</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            You are not the patient. But you are in the war.
          </h2>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            You're the one Googling at 2 a.m., scheduling appointments, watching them refuse exercises, lying awake worried they'll quit. The burnout is real. Let the system do the daily nagging so you can focus on staying standing.
          </p>
          <Button size="lg" className="bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 h-14 px-8 text-base">
            Open the caregiver kit <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Latest Guides Grid */}
      <section id="guides" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <p className="text-sm font-bold tracking-widest uppercase text-blue-600 mb-4">Latest Guides</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">The questions every survivor asks.</h2>
              <p className="text-lg text-slate-600">Honest, in-the-trenches answers. No fluff. No fake hope.</p>
            </div>
            <a href="#" className="text-slate-900 font-semibold inline-flex items-center hover:text-blue-600 transition-colors">
              See all 48 guides <ArrowRight className="ml-2 w-4 h-4" />
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "How long does rehab take?", blurb: "The real timeline. Not the one the hospital gave you." },
              { title: "Can you fully recover?", blurb: "What the research says and what seven years actually looks like." },
              { title: "Neuroplasticity explained", blurb: "How your brain rewires itself. The science behind every rep." },
              { title: "Stroke fatigue", blurb: "Why you sleep ten hours and still feel wrecked. And what to do about it." }
            ].map((guide, i) => (
              <a key={i} href="#" className="group block border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-slate-300 bg-white">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{guide.title}</h3>
                <p className="text-slate-600 leading-relaxed">{guide.blurb}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-slate-900 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to put in the reps?</h2>
          <p className="text-xl text-slate-400 mb-12">Join thousands of survivors inside the academy. Get your daily protocols, connect with your pod, and start rebuilding.</p>
          <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-10 text-lg rounded-md w-full sm:w-auto">
            Start your recovery
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-16 border-t border-slate-800 text-slate-400 text-sm text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="font-bold text-white text-xl tracking-tight mb-8">Stroke Recovery Academy</div>
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <a href="#" className="hover:text-white transition-colors">The Method</a>
            <a href="#" className="hover:text-white transition-colors">Guides</a>
            <a href="#" className="hover:text-white transition-colors">Caregivers</a>
            <a href="#" className="hover:text-white transition-colors">Sign In</a>
          </div>
          <p>© {new Date().getFullYear()} Stroke Recovery Academy. All rights reserved.</p>
          <p className="mt-4 text-xs max-w-2xl mx-auto opacity-60">
            This platform provides accountability and tools for stroke survivors. It does not provide medical diagnosis or replace professional clinical advice. Always consult your physician before starting a new physical regimen.
          </p>
        </div>
      </footer>
    </div>
  );
}
