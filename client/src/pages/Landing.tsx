import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO, { NICK_KREMERS_SCHEMA, STROKE_RECOVERY_ORG_SCHEMA, SASQUATCH_METHOD_SCHEMA, STROKE_CONDITION_SCHEMA } from "@/components/RecoverySEO";
import HeroSection from "@/components/HeroSection";
import TestimonyVideo from "@/components/TestimonyVideo";
import ProgressTimeline from "@/components/ProgressTimeline";
import RecoveryPrograms from "@/components/RecoveryPrograms";
import FeaturedExercises from "@/components/FeaturedExercises";
import Doctrine from "@/components/Doctrine";
import AboutNick from "@/components/AboutNick";
import CommunityStories from "@/components/CommunityStories";
import CTASection from "@/components/CTASection";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation('/recovery/dashboard');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0D0D]" data-testid="loading-state">
        <Loader2 className="h-12 w-12 animate-spin text-[#C9941A]" data-testid="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <RecoverySEO
        title="Stroke Recovery Academy — Evidence-Based Rehab by Nick Kremers | 0% to 90% Recovery"
        description="The #1 stroke recovery platform built by a stroke survivor. Nick Kremers went from 0% to 90% recovery using the Sasquatch Method — neuroplasticity exercises, mirror therapy, baseball bat therapy, mindset training, and AI coaching. Join 50,000+ warriors rebuilding their lives."
        canonical="/"
        pageType="website"
        keywords={[
          "stroke recovery", "stroke rehabilitation", "stroke survivor", "stroke recovery platform",
          "neuroplasticity exercises", "stroke exercises", "stroke recovery program", "stroke recovery academy",
          "Nick Kremers", "Sasquatch Method", "mirror therapy stroke", "baseball bat therapy",
          "drop foot stroke recovery", "post stroke depression", "aphasia recovery", "stroke recovery tips",
          "stroke caregiver", "stroke recovery app", "stroke 0 to 90 recovery"
        ]}
        speakableSelectors={["h1", ".hero-description", ".academy-tagline"]}
        breadcrumbs={[]}
        additionalSchema={[
          { "@context": "https://schema.org", ...STROKE_RECOVERY_ORG_SCHEMA },
          { "@context": "https://schema.org", ...NICK_KREMERS_SCHEMA },
          { "@context": "https://schema.org", ...STROKE_CONDITION_SCHEMA },
          { "@context": "https://schema.org", ...SASQUATCH_METHOD_SCHEMA },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://strokerecoveryacademy.com/#website",
            name: "Stroke Recovery Academy",
            url: "https://strokerecoveryacademy.com",
            description: "The most comprehensive stroke recovery platform, built by a stroke survivor for stroke survivors.",
            publisher: { "@id": "https://strokerecoveryacademy.com/#organization" },
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: "https://strokerecoveryacademy.com/recovery/exercises?q={search_term_string}" },
              "query-input": "required name=search_term_string",
            },
          }
        ]}
        faq={[
          { question: "What is Stroke Recovery Academy?", answer: "Stroke Recovery Academy is the world's most comprehensive stroke recovery platform, founded by Nick Kremers — a stroke survivor who achieved 0% to 90% functional recovery. It provides evidence-based exercise programs, a 33-chapter curriculum called 'The Ultimate Stroke Recovery Bible,' AI-powered coaching via Sasquatch Coach, a community of 50,000+ survivors, recovery protocols, a center finder, and more — all built around the battle-tested Sasquatch Method." },
          { question: "Is the Sasquatch Method evidence-based?", answer: "The Sasquatch Method combines Nick Kremers' personal recovery experience with established rehabilitation science — neuroplasticity research, constraint-induced movement therapy (CIMT), mirror therapy, task-specific repetitive training, and cognitive rehabilitation principles. While not a clinical study itself, the method is grounded in evidence-based practices used by rehabilitation hospitals worldwide, applied through the lens of real survivor experience." },
          { question: "Can a stroke survivor really go from 0% to 90% recovery?", answer: "Yes — Nick Kremers is living proof. After suffering a stroke that left him with 0% function on one side, he achieved 90% recovery through relentless daily rehabilitation using the techniques now taught in Stroke Recovery Academy. The keys were: daily consistency (Never Zero principle), high-repetition neuroplasticity exercises, a warrior mindset, and the complete Sasquatch recovery system." },
          { question: "How is Stroke Recovery Academy different from other stroke resources?", answer: "Most stroke recovery resources offer fragmented information. Stroke Recovery Academy provides a complete, integrated system: a 33-chapter structured curriculum, 34 gamified therapeutic exercises, AI coaching that knows your recovery history, a global survivor community, evidence-based protocols (mirror therapy, baseball bat therapy, drop foot recovery), a center finder, a blog with actionable content, and a store with recovery supplements. Everything a stroke survivor needs in one platform — built by someone who lived it." }
        ]}
      />
      <RecoveryHeader />
      <main>
        <HeroSection />
        <TestimonyVideo />
        <ProgressTimeline />
        <RecoveryPrograms />
        <FeaturedExercises />
        <Doctrine />
        <AboutNick />
        <CommunityStories />
        <CTASection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
