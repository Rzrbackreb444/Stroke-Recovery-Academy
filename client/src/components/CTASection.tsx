import { Button } from "@/components/ui/button";
import { ArrowRight, Flame } from "lucide-react";
import { Link } from "wouter";

export default function CTASection() {
  return (
    <section className="py-20 bg-[#080808]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative rounded-2xl overflow-hidden border border-[#C9941A]/20 bg-[#0f0c07] p-14">
          {/* Glow */}
          <div className="absolute inset-0 bg-[#C9941A]/5 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-[#C9941A]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="w-14 h-14 rounded-full bg-[#C9941A]/10 flex items-center justify-center mx-auto mb-6 border border-[#C9941A]/20">
              <Flame className="h-7 w-7 text-[#C9941A]" />
            </div>

            <h2
              className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight"
              data-testid="text-cta-title"
            >
              Your Impossible<br />
              <span className="text-[#C9941A]">Starts Now</span>
            </h2>

            <p
              className="text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto"
              data-testid="text-cta-description"
            >
              Stop accepting limitations. Join 50,000+ survivors proving that extraordinary
              recovery is possible. Access the complete Sasquatch Method — the techniques
              that took Nick from 0% to 90%.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[#C9941A] text-black text-lg font-bold px-10 shadow-lg shadow-[#C9941A]/20"
                data-testid="button-cta-primary"
                onClick={() => window.location.href = "/api/login"}
              >
                Join The Revolution
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link href="/recovery/resources">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#333] text-white text-lg font-semibold px-10"
                  data-testid="button-cta-secondary"
                >
                  Free Resources
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
