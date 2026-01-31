import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <>
      <SEO
        title="FROM PARALYSIS TO POWER - Stroke Recovery Academy"
        description="Heart's still thumpin'? Life's still pumpin'. Join the Sasquatch-style stroke recovery revolution. From paralysis to power."
        keywords={["stroke recovery", "rehabilitation", "recovery academy", "sasquatch"]}
        type="website"
      />

      <section className="relative h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#0D0D0D] via-[#1a1a1a] to-[#0D0D0D] overflow-hidden">
        {/* Dramatic background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9941A]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C9941A]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#C9941A]/5 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Main Tagline */}
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black text-white mb-6 leading-none tracking-tighter">
            <span className="block text-[#C9941A]" data-testid="text-hero-main">
              FROM PARALYSIS
            </span>
            <span className="block mt-2" data-testid="text-hero-power">
              TO POWER
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-3xl sm:text-4xl font-bold text-[#C9941A] mb-8 italic tracking-wide" data-testid="text-hero-subtitle">
            DEFY EVERY 'NEVER' — SASQUATCH STYLE
          </p>

          {/* Motivational Quote */}
          <p className="text-xl sm:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed font-medium" data-testid="text-hero-quote">
            Heart's still thumpin'? Life's still pumpin'.
            <br />
            Stand up six times. Join the revolution.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Button
              size="lg"
              className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-white text-lg font-bold px-8 py-6 transition-transform duration-300 hover:scale-110 active:scale-95 shadow-lg shadow-[#C9941A]/50 animate-pulse"
              data-testid="button-enter-the-fight"
              onClick={() => {
                // Navigate to fight/action section
                window.location.href = "#academy";
              }}
            >
              ENTER THE FIGHT
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white text-lg font-bold px-8 py-6 transition-transform duration-300 hover:scale-110 active:scale-95 shadow-lg shadow-white/20"
              data-testid="button-see-the-proof"
              onClick={() => window.open("https://www.tiktok.com/@nickkremers", "_blank")}
            >
              SEE THE PROOF
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
          <div className="text-gray-400 text-sm font-medium mb-2">Scroll to explore</div>
          <svg
            className="w-6 h-6 text-gray-400 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>
    </>
  );
}
