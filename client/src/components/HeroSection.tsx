import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { ArrowRight, Shield, Award, CheckCircle, Brain, Stethoscope, Users } from "lucide-react";

const stats = [
  { value: "47%", label: "Avg. Motor Improvement", icon: Brain },
  { value: "10,000+", label: "Survivors Helped", icon: Users },
  { value: "89%", label: "Daily Engagement", icon: CheckCircle },
];

export default function HeroSection() {
  return (
    <>
      <SEO
        title="Stroke Recovery Academy - Evidence-Based Rehabilitation Platform"
        description="Medical-grade stroke recovery platform featuring evidence-based protocols, personalized rehabilitation programs, and 24/7 AI coaching. Transform your recovery journey."
        keywords={["stroke recovery", "rehabilitation", "recovery academy", "neuroplasticity", "physical therapy", "occupational therapy"]}
        type="website"
      />

      <section className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#0D0D0D] via-[#0a0a0a] to-[#0D0D0D] overflow-hidden">
        {/* Subtle medical-grade background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#C9941A]/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDBNIDAgMjAgTCA0MCAyMCBNIDIwIDAgTCAyMCA0MCBNIDAgMzAgTCA0MCAzMCBNIDMwIDAgTCAzMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDIwMSwxNDgsMjYsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-12">
          {/* Medical Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30 gap-1 text-xs">
              <Shield className="h-3 w-3" /> HIPAA Compliant
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1 text-xs">
              <Brain className="h-3 w-3" /> Evidence-Based
            </Badge>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 gap-1 text-xs">
              <Award className="h-3 w-3" /> Expert Reviewed
            </Badge>
          </div>

          {/* Main Heading - More Professional */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
            <span className="block mb-2" data-testid="text-hero-main">
              Medical-Grade
            </span>
            <span className="block text-[#C9941A]" data-testid="text-hero-power">
              Stroke Recovery
            </span>
          </h1>

          {/* Professional Subtitle */}
          <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
            Evidence-based rehabilitation protocols powered by AI coaching
          </p>

          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto" data-testid="text-hero-quote">
            Personalized recovery programs designed with neuroplasticity principles. 
            Track progress, access expert protocols, and connect with your recovery coach 24/7.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
            <Button
              size="lg"
              className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black text-lg font-bold px-10 py-6 transition-all duration-300 hover:scale-105 shadow-lg shadow-[#C9941A]/30"
              data-testid="button-enter-the-fight"
              onClick={() => window.location.href = "/api/login"}
            >
              Start Your Recovery Plan
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#333] text-white text-lg font-semibold px-10 py-6 transition-all duration-300 hover:border-[#C9941A]/50"
              data-testid="button-see-the-proof"
              onClick={() => document.getElementById('academy')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Programs
            </Button>
          </div>

          {/* Statistics Bar */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Icon className="h-5 w-5 text-[#C9941A]" />
                    <span className="text-3xl sm:text-4xl font-black text-white">{stat.value}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Medical Disclaimer */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600 max-w-2xl mx-auto">
            <Stethoscope className="h-4 w-4" />
            <span>
              Developed in consultation with rehabilitation specialists. 
              Always consult your healthcare provider before starting any recovery program.
            </span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
          <svg
            className="w-6 h-6 text-gray-500 mx-auto"
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
