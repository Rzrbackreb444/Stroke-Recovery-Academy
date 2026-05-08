import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO, {
  NICK_KREMERS_SCHEMA,
  STROKE_RECOVERY_ORG_SCHEMA,
  SASQUATCH_METHOD_SCHEMA,
  STROKE_CONDITION_SCHEMA,
} from "@/components/RecoverySEO";
import HeroSection from "@/components/HeroSection";
import StatsStrip from "@/components/StatsStrip";
import AccountabilityManifesto from "@/components/AccountabilityManifesto";
import TestimonyVideo from "@/components/TestimonyVideo";
import WhatYouGet from "@/components/WhatYouGet";
import FeedbackSurvey from "@/components/FeedbackSurvey";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import FadeUpSection from "@/components/FadeUpSection";

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/recovery/dashboard");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0D0D]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9941A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] overflow-x-hidden">
      <RecoverySEO
        title="Stroke Recovery Academy — Evidence-Based Rehab by Nick Kremers | 0% to 90% Recovery"
        description="The #1 stroke recovery platform built by a stroke survivor. Nick Kremers went from 0% to 90% recovery using the Sasquatch Method. Join 50,000+ warriors rebuilding their lives."
        canonical="/"
        pageType="website"
        keywords={[
          "stroke recovery",
          "stroke rehabilitation",
          "stroke survivor",
          "Nick Kremers",
          "Sasquatch Method",
          "mirror therapy stroke",
          "baseball bat therapy",
          "drop foot stroke recovery",
          "stroke recovery academy",
        ]}
        speakableSelectors={["h1", ".hero-description"]}
        breadcrumbs={[]}
        additionalSchema={[
          { "@context": "https://schema.org", ...STROKE_RECOVERY_ORG_SCHEMA },
          { "@context": "https://schema.org", ...NICK_KREMERS_SCHEMA },
          { "@context": "https://schema.org", ...STROKE_CONDITION_SCHEMA },
          { "@context": "https://schema.org", ...SASQUATCH_METHOD_SCHEMA },
        ]}
        faq={[
          {
            question: "What is Stroke Recovery Academy?",
            answer:
              "Stroke Recovery Academy is the world's most comprehensive stroke recovery platform, founded by Nick Kremers — a stroke survivor who achieved 0% to 90% functional recovery using the Sasquatch Method.",
          },
          {
            question: "Can a stroke survivor really go from 0% to 90% recovery?",
            answer:
              "Yes — Nick Kremers is living proof. After suffering a stroke that left him with 0% function on one side, he achieved 90% recovery through relentless daily rehabilitation using the techniques now taught in Stroke Recovery Academy.",
          },
        ]}
      />
      <RecoveryHeader />
      <main>
        <HeroSection />
        <FadeUpSection>
          <StatsStrip />
        </FadeUpSection>
        <FadeUpSection delay={50}>
          <AccountabilityManifesto />
        </FadeUpSection>
        <FadeUpSection delay={50}>
          <TestimonyVideo />
        </FadeUpSection>
        <FadeUpSection delay={50}>
          <WhatYouGet />
        </FadeUpSection>
        {/* CAREGIVER FUNNEL — caregivers usually do the research and hold the
            credit card. The deep SSR landing at /for/caregivers carries the
            full pitch (burnout, first-30-days, the hardest conversation).
            This block is the entry point that puts that page one click away
            from the homepage. */}
        <FadeUpSection delay={50}>
          <section className="bg-[#0D0D0D] py-16 px-4 sm:px-6 lg:px-8 border-y border-[#1f1f1f]" data-testid="section-caregiver-cta">
            <div className="max-w-5xl mx-auto">
              <div className="rounded-xl border border-[#C9941A]/40 bg-gradient-to-br from-[#1a1610] via-[#141414] to-[#1a1610] p-8 md:p-10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9941A] mb-3">For caregivers</p>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                  You are not the patient. But you are in the war.
                </h2>
                <p className="text-gray-300 text-lg mb-3 leading-relaxed">
                  You're the one Googling at 2 a.m., scheduling the appointments, watching them refuse the exercises, lying awake worried they'll quit. The exhaustion is real. The burnout is real. And nobody built a recovery system that took your seat seriously — until now.
                </p>
                <p className="text-gray-400 text-base mb-6 leading-relaxed">
                  Let the system do the daily nagging. The accountability loop, the check-ins, the "did you do your reps today" — that's our job. Yours is to stay standing.
                </p>
                <a
                  href="/for/caregivers"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#C9941A] text-black font-bold uppercase tracking-widest text-sm hover-elevate"
                  data-testid="link-caregiver-landing"
                >
                  Open the caregiver kit →
                </a>
              </div>
            </div>
          </section>
        </FadeUpSection>
        <FadeUpSection delay={50}>
          <FeedbackSurvey />
        </FadeUpSection>
        <FadeUpSection delay={50}>
          <CTASection />
        </FadeUpSection>
      </main>
      <Footer />
    </div>
  );
}
