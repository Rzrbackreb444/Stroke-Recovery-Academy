import React from "react";
import { 
  Flame, Bell, Users, Video, BookOpen, Sun, 
  Brain, TrendingUp, MessageCircle, ArrowRight, 
  Activity, Heart, CheckCircle, GraduationCap, 
  Dumbbell, PlayCircle, ChevronRight, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Reusable warm section wrapper
const Section = ({ children, className = "", dark = false }: { children: React.ReactNode, className?: string, dark?: boolean }) => (
  <section className={`py-24 px-6 md:px-12 lg:px-24 ${dark ? "bg-[#2A2421] text-[#FDFBF7]" : "bg-[#FDFBF7] text-[#2B2623]"} ${className}`}>
    <div className="max-w-6xl mx-auto">
      {children}
    </div>
  </section>
);

export function Homepage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans antialiased text-[#2B2623] selection:bg-[#C06B3E] selection:text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 1. Header */}
      <header className="sticky top-0 z-50 w-full bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E2C2A4]/30 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#C06B3E] flex items-center justify-center text-white">
              <Flame size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#2B2623]">Stroke Recovery Academy</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5C534D]">
            <a href="#" className="hover:text-[#C06B3E] transition-colors">The Method</a>
            <a href="#" className="hover:text-[#C06B3E] transition-colors">Academy</a>
            <a href="#" className="hover:text-[#C06B3E] transition-colors">Community</a>
            <a href="#" className="hover:text-[#C06B3E] transition-colors">Guides</a>
          </nav>

          <div className="flex items-center gap-4">
            <a href="#" className="hidden sm:block text-sm font-medium text-[#5C534D] hover:text-[#2B2623]">Sign In</a>
            <Button className="bg-[#C06B3E] hover:bg-[#A85B33] text-white rounded-full px-6 font-semibold shadow-sm transition-all shadow-[#C06B3E]/20 hover:shadow-md">
              Start your recovery
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with dark wash */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/__mockup/images/warm-hero-stock.jpg" 
            alt="Warm hero" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1412]/90 via-[#2A2421]/80 to-[#2A2421]/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1412] via-transparent to-transparent opacity-80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FDFBF7]/10 backdrop-blur-sm border border-[#FDFBF7]/20 text-[#FDFBF7] text-sm font-semibold tracking-wide mb-8">
              <Flame size={16} className="text-[#E8B986]" />
              The Stroked Out Sasquatch
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#FDFBF7] leading-[1.05] tracking-tight mb-6 drop-shadow-sm">
              From 0% <br/>
              <span className="text-[#E8B986] italic font-serif pr-2">to 90%</span> <br/>
              Recovery.
            </h1>
            
            <p className="text-xl text-[#D8CFCD] mb-6 leading-relaxed max-w-xl font-light">
              December 3, 2018. Hoyer lift. 50 staples. Complete paralysis on one side. Doctors with no promises.
            </p>

            <p className="text-lg text-[#E2C2A4] mb-10 leading-relaxed max-w-xl font-medium">
              Today Nick Kremers types with both hands, runs a thriving business, and has reached 90,000+ survivors. This is the Sasquatch Method.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-[#C06B3E] hover:bg-[#A85B33] text-white text-lg h-14 px-8 rounded-full shadow-lg shadow-[#C06B3E]/30 transition-transform hover:-translate-y-1">
                Find My Recovery Plan
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" className="bg-transparent border-[#E2C2A4]/50 text-[#FDFBF7] hover:bg-[#FDFBF7]/10 hover:text-white text-lg h-14 px-8 rounded-full backdrop-blur-sm">
                <PlayCircle className="mr-2 w-5 h-5" />
                Watch Nick's Story
              </Button>
            </div>
          </div>
          
          <div className="flex-1 hidden lg:flex justify-end">
             {/* Intentionally left empty to let the background image shine through on the right */}
          </div>
        </div>
      </section>

      {/* 3. Stats Strip */}
      <section className="bg-[#C06B3E] text-[#FDFBF7] py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#FDFBF7]/20">
            <div className="text-center pt-4 sm:pt-0">
              <p className="text-4xl font-bold mb-2">90,000+</p>
              <p className="text-sm uppercase tracking-widest text-[#FDFBF7]/80 font-semibold">Warriors reached</p>
            </div>
            <div className="text-center pt-4 sm:pt-0">
              <p className="text-4xl font-bold mb-2">0 &rarr; 90%</p>
              <p className="text-sm uppercase tracking-widest text-[#FDFBF7]/80 font-semibold">Nick's Recovery</p>
            </div>
            <div className="text-center pt-4 sm:pt-0">
              <p className="text-4xl font-bold mb-2">6+ Years</p>
              <p className="text-sm uppercase tracking-widest text-[#FDFBF7]/80 font-semibold">Of proven methods</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Accountability Manifesto */}
      <Section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E2C2A4]/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
        
        <div className="max-w-4xl mb-20 text-center mx-auto">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#C06B3E] mb-6">
            The Accountability Gap
          </p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-8 text-[#2B2623]">
            The most underserved part of stroke recovery isn't information.
            <br />
            <span className="text-[#C06B3E] italic font-serif">It's someone checking on you.</span>
          </h2>
          <div className="space-y-6 text-[#5C534D] text-lg leading-relaxed font-light">
            <p>
              You leave the hospital with a stack of papers and a follow-up appointment in six weeks.
              Nobody is watching the days in between. Nobody knows if you did your exercises or skipped them.
              Nobody knows if you cried on the bathroom floor at 2 AM and decided recovery wasn't worth it.
            </p>
            <p>
              That gap is where the plateau lives. It's where survivors fall off. Not because they gave up. 
              <strong className="text-[#2B2623] font-semibold"> Because nobody was there.</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            { icon: Sun, title: "Daily Routine", desc: "Every task tracked. The system knows when you haven't shown up." },
            { icon: Users, title: "Survivor Community", desc: "Share your progress. The wall is proof that others are fighting too." },
            { icon: MessageCircle, title: "Sasquatch Coach", desc: "An AI coach that notices when you go quiet and calls you back." },
            { icon: Heart, title: "Recovery Journal", desc: "Name the wins, name the hard parts. Your story builds day by day." },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-[#E2C2A4]/20 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#FDFBF7] border border-[#E2C2A4]/30 flex items-center justify-center mb-6 text-[#C06B3E]">
                <item.icon size={24} strokeWidth={2} />
              </div>
              <h4 className="text-xl font-bold text-[#2B2623] mb-3">{item.title}</h4>
              <p className="text-[#5C534D] leading-relaxed text-sm font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Testimony / Social Proof */}
      <Section dark>
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 relative">
            <div className="absolute -inset-4 bg-[#C06B3E]/10 rounded-[3rem] rotate-3" />
            <img 
              src="/__mockup/images/warm-support-stock.jpg" 
              alt="Hands holding in support" 
              className="relative rounded-[2rem] w-full aspect-square object-cover shadow-2xl border border-[#FDFBF7]/10"
            />
            <div className="absolute -bottom-8 -right-8 bg-[#FDFBF7] text-[#2B2623] p-6 rounded-2xl shadow-xl max-w-xs">
              <div className="flex gap-1 text-[#C06B3E] mb-3">
                {[...Array(5)].map((_, i) => <Flame key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="italic text-sm leading-relaxed mb-3 font-serif">
                "The only program that didn't treat me like a patient. They treated me like a warrior who needed to do their reps."
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#5C534D]">— Sarah, 2 years post-stroke</p>
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#E8B986] mb-4">
              Community
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Talk. Share. Inspire.<br />
              <span className="text-[#E8B986] italic font-serif">Show up for each other.</span>
            </h2>
            <p className="text-[#D8CFCD] leading-relaxed mb-10 text-lg font-light">
              Community isn't a feed you scroll past. It's survivors at Day 3 and Day 700 talking to each other,
              filming their hard moments and their wins, and proving to everyone watching that recovery is possible.
            </p>
            
            <div className="space-y-4 mb-10">
              {["Film & share progress videos", "Accountability pods of 3-5 survivors", "React to wins with hope and solidarity"].map((label, i) => (
                <div key={i} className="flex items-center gap-4 bg-[#3E322C] p-4 rounded-2xl border border-[#FDFBF7]/5">
                  <div className="w-8 h-8 rounded-full bg-[#C06B3E]/20 flex items-center justify-center text-[#E8B986]">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <span className="font-medium text-[#FDFBF7]">{label}</span>
                </div>
              ))}
            </div>

            <Button className="bg-[#C06B3E] hover:bg-[#A85B33] text-white rounded-full px-8 py-6 text-lg font-bold shadow-lg">
              <Users className="mr-2" size={20} />
              See the Community Wall
            </Button>
          </div>
        </div>
      </Section>

      {/* 6. What You Get */}
      <Section className="bg-[#F6EFEA]">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-[#C06B3E] text-sm font-bold uppercase tracking-[0.2em] mb-4">
            The Toolbox
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-[#2B2623] mb-6">
            Everything you need to <span className="italic font-serif text-[#C06B3E]">rebuild.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: GraduationCap, title: "Recovery Academy", desc: "33-chapter structured curriculum covering neuroplasticity, mirror therapy, drop foot protocols, and more." },
            { icon: Dumbbell, title: "Daily Exercises", desc: "34 therapeutic exercises built from Nick's methods. Track reps, log progress, rebuild function." },
            { icon: Brain, title: "Sasquatch Coach", desc: "Your 24/7 AI recovery companion trained on Nick's methodology, available whenever you need it." }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-sm border border-[#E2C2A4]/30 flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-[#C06B3E] group-hover:scale-110 transition-transform duration-500">
                <item.icon size={120} />
              </div>
              <div className="w-14 h-14 rounded-full bg-[#F6EFEA] flex items-center justify-center mb-8 text-[#C06B3E] relative z-10">
                <item.icon size={28} strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-[#2B2623] mb-4 relative z-10">{item.title}</h3>
              <p className="text-[#5C534D] leading-relaxed mb-8 flex-1 relative z-10 font-light text-lg">
                {item.desc}
              </p>
              <Button variant="ghost" className="self-start text-[#C06B3E] hover:bg-[#F6EFEA] rounded-full px-6 font-semibold relative z-10 -ml-2">
                Explore <ChevronRight size={18} className="ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* 7. Caregiver CTA Section */}
      <section className="bg-[#2B2623] text-[#FDFBF7] py-20 px-6 relative overflow-hidden border-y border-[#3E322C]">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#C06B3E]/10 blur-[100px]" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="md:w-2/3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#E8B986] mb-4 font-bold">For Caregivers</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              You are not the patient.<br/>
              <span className="italic font-serif text-[#C06B3E]">But you are in the war.</span>
            </h2>
            <p className="text-[#D8CFCD] text-lg mb-8 leading-relaxed font-light">
              You're the one Googling at 2 a.m., watching them refuse exercises, lying awake worried they'll quit. 
              Let the system do the daily nagging. The check-ins, the reps — that's our job. Yours is to stay standing.
            </p>
            <Button className="bg-[#FDFBF7] text-[#2B2623] hover:bg-[#E2C2A4] rounded-full px-8 py-6 font-bold shadow-lg transition-colors">
              Open the caregiver kit <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* 8. Latest Guides Grid */}
      <Section>
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#C06B3E] mb-3 font-bold">Latest Guides</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2B2623] mb-6">
            The questions every survivor asks
          </h2>
          <p className="text-[#5C534D] text-lg max-w-2xl font-light">
            Honest, in-the-trenches answers built from research and lived experience. No fake hope. Just the playbook.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: "How long does rehab take?", blurb: "The real timeline. Not the one the hospital gave you." },
            { label: "Can you fully recover?", blurb: "What the research says and what seven years actually looks like." },
            { label: "Neuroplasticity explained", blurb: "How your brain rewires itself. The science behind every rep." },
          ].map((item, i) => (
            <a key={i} href="#" className="block p-8 rounded-3xl bg-white border border-[#E2C2A4]/30 hover:border-[#C06B3E]/50 transition-colors shadow-sm hover:shadow-md group">
              <h3 className="text-xl font-bold text-[#2B2623] mb-3 group-hover:text-[#C06B3E] transition-colors">{item.label}</h3>
              <p className="text-[#5C534D] font-light leading-relaxed mb-6">{item.blurb}</p>
              <span className="text-[#C06B3E] font-semibold text-sm flex items-center">
                Read guide <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
          ))}
        </div>
      </Section>

      {/* 9. Final CTA */}
      <Section className="text-center pb-32">
        <div className="max-w-3xl mx-auto bg-[#F6EFEA] rounded-[3rem] p-12 md:p-20 border border-[#E2C2A4]/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#E8B986] via-[#C06B3E] to-[#E8B986]" />
          
          <h2 className="text-4xl md:text-5xl font-bold text-[#2B2623] mb-8 leading-tight">
            The hospital did its job.<br/>
            <span className="italic font-serif text-[#C06B3E]">Now it's your turn.</span>
          </h2>
          <p className="text-xl text-[#5C534D] mb-12 font-light">
            And we'll be there for every rep of it.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-[#C06B3E] hover:bg-[#A85B33] text-white rounded-full px-8 py-6 text-lg font-bold shadow-lg shadow-[#C06B3E]/20">
              <Flame className="mr-2 w-5 h-5" />
              Start 7-Day Free Trial
            </Button>
            <Button variant="outline" className="border-[#E2C2A4] text-[#2B2623] hover:bg-white rounded-full px-8 py-6 text-lg font-bold bg-transparent">
              <Sun className="mr-2 w-5 h-5 text-[#C06B3E]" />
              See the Daily Routine
            </Button>
          </div>
          <p className="text-sm text-[#5C534D]/70 mt-6 font-medium">No card required to explore.</p>
        </div>
      </Section>

      {/* 10. Footer */}
      <footer className="bg-[#2B2623] text-[#D8CFCD] py-16 px-6 border-t border-[#3E322C]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#C06B3E] flex items-center justify-center text-white">
                <Flame size={16} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg text-[#FDFBF7]">Stroke Recovery Academy</span>
            </div>
            <p className="text-sm leading-relaxed text-[#D8CFCD]/80 font-light">
              Built by survivors, for survivors. Recovery isn't healing. It's rewriting.
            </p>
          </div>
          
          <div className="flex gap-16">
            <div>
              <h4 className="font-bold text-[#FDFBF7] mb-4">Platform</h4>
              <ul className="space-y-3 text-sm font-light text-[#D8CFCD]/80">
                <li><a href="#" className="hover:text-[#E8B986] transition-colors">The Method</a></li>
                <li><a href="#" className="hover:text-[#E8B986] transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-[#E8B986] transition-colors">Academy</a></li>
                <li><a href="#" className="hover:text-[#E8B986] transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#FDFBF7] mb-4">Resources</h4>
              <ul className="space-y-3 text-sm font-light text-[#D8CFCD]/80">
                <li><a href="#" className="hover:text-[#E8B986] transition-colors">Caregivers</a></li>
                <li><a href="#" className="hover:text-[#E8B986] transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-[#E8B986] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-[#3E322C] text-xs text-[#D8CFCD]/50 flex justify-between">
          <p>&copy; {new Date().getFullYear()} Stroke Recovery Academy. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#FDFBF7]">Privacy</a>
            <a href="#" className="hover:text-[#FDFBF7]">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;
