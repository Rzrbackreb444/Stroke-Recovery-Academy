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
