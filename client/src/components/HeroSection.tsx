import { Button } from "@/components/ui/button";
import { ArrowRight, Flame } from "lucide-react";
import nickPhoto from "@assets/IMG_0548_1776442127593.jpeg";

const stats = [
  { value: "50", label: "Staples in his skull" },
  { value: "0%", label: "Starting function" },
  { value: "90%", label: "Recovery achieved" },
  { value: "6+", label: "Years of proof" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center bg-[#0D0D0D] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 right-0 w-[700px] h-[700px] bg-[#C9941A]/4 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — Copy */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Flame className="h-5 w-5 text-[#C9941A]" />
              <span className="text-[#C9941A] text-sm font-semibold uppercase tracking-widest">
                The Stroked Out Sasquatch
              </span>
            </div>

            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.92] tracking-tight mb-8"
              data-testid="text-hero-main"
            >
              From 0%<br />
              <span className="text-[#C9941A]">to 90%</span><br />
              Recovery.
            </h1>

            <p
              className="text-xl text-gray-300 mb-4 leading-relaxed hero-description"
              data-testid="text-hero-subtitle"
            >
              December 3, 2018. Hoyer lift. 50 staples. Complete paralysis on one side.
              Doctors with no promises.
            </p>
            <p
              className="text-lg text-gray-400 mb-10 leading-relaxed"
              data-testid="text-hero-quote"
            >
              Today Nick Kremers types with both hands, runs a thriving business, and has
              helped 50,000+ stroke survivors worldwide — using techniques that don't exist
              in any medical textbook. This is the Sasquatch Method.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <Button
                size="lg"
                className="bg-[#C9941A] text-black text-lg font-bold px-10 shadow-lg shadow-[#C9941A]/20"
                data-testid="button-start-recovery"
                onClick={() => window.location.href = "/recovery/challenge"}
              >
                Join the 66-Day Challenge
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#333] text-white text-lg font-semibold px-10"
                data-testid="button-watch-story"
                onClick={() => document.getElementById('testimony')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Watch Nick's Story
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4 border-t border-[#1e1e1e] pt-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-black text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Nick's photo */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/10 to-transparent z-10 rounded-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-transparent to-transparent z-10 rounded-2xl pointer-events-none" />
            <img
              src={nickPhoto}
              alt="Nick Kremers in 2018 — early in stroke recovery, seated next to his walker after a massive hemorrhagic stroke at age 36. Founder of Stroke Recovery Academy and the Sasquatch Method."
              className="w-full rounded-2xl object-cover object-top"
              style={{ maxHeight: "620px" }}
              data-testid="img-nick-hero"
            />
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <div className="bg-black/70 backdrop-blur-sm border border-[#C9941A]/30 rounded-xl p-4">
                <p className="text-[#C9941A] text-xs font-semibold uppercase tracking-wider mb-1">
                  Nick Kremers — Founder
                </p>
                <p className="text-white text-sm font-medium leading-snug">
                  "If the Sasquatch can do it — so can you."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
