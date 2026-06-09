import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Compass,
  Flame,
  Mic,
  Users,
  ArrowRight,
  ShieldAlert,
  HeartHandshake,
} from "lucide-react";
import RecoverySEO from "@/components/RecoverySEO";

const PILLARS = [
  {
    icon: Compass,
    title: "Tell us about you",
    description:
      "A quick, optional 10-step intake so the platform adapts to your stroke, your deficits, and your time budget — not a generic plan.",
    cta: "Start intake",
    href: "/recovery/intake",
    primary: true,
  },
  {
    icon: Flame,
    title: "Today's One Thing",
    description:
      "The Bonfire shows you a single recovery task each day. No overwhelm. Never zero.",
    cta: "Open The Bonfire",
    href: "/recovery/today",
  },
  {
    icon: Mic,
    title: "Sasquatch Coach",
    description:
      "A 24/7 AI accountability partner trained on Nick's lived recovery — not medical advice, but the push you need at 5am.",
    cta: "Meet the coach",
    href: "/recovery/sasquatch-coach",
  },
  {
    icon: Users,
    title: "Survivor Community",
    description:
      "You are not the only one. Find a buddy, join a circle, share a win.",
    cta: "Open community",
    href: "/recovery/community",
  },
];

export default function Welcome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const firstName =
    (user as any)?.firstName || (user as any)?.preferredName || "Survivor";

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white" data-testid="page-welcome">
      <RecoverySEO
        title="Welcome to Stroke Recovery Academy"
        description="Set up your survivor profile and choose how you want to start your recovery."
        canonical="/welcome"
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E2741B] mb-3">
            Welcome
          </p>
          <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight" data-testid="text-welcome-title">
            Welcome to the Sasquatch Recovery Family,
            <span className="text-[#E2741B]"> {firstName}</span>.
          </h1>
          <p className="text-base text-gray-400 leading-relaxed max-w-xl mx-auto">
            This is a survivor-built platform. There's no doctor here, no clinical
            algorithm — just a system that helped Nick go from 0% to 90%, adapted to
            you. Pick how you want to start.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid gap-4 mb-8">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Card
                key={p.title}
                className={`bg-[#111] hover-elevate ${
                  p.primary ? "border-[#E2741B]/40" : "border-[#1e1e1e]"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                        p.primary
                          ? "bg-[#E2741B]/15 border border-[#E2741B]/30"
                          : "bg-[#1a1a1a] border border-[#2a2a2a]"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          p.primary ? "text-[#E2741B]" : "text-gray-300"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-white mb-1">{p.title}</h2>
                      <p className="text-sm text-gray-400 leading-relaxed mb-3">
                        {p.description}
                      </p>
                      <Link href={p.href}>
                        <Button
                          size="sm"
                          variant={p.primary ? "default" : "outline"}
                          className={
                            p.primary
                              ? "bg-[#E2741B] text-black hover:bg-[#b8841a]"
                              : "border-[#2a2a2a] text-white"
                          }
                          data-testid={`button-pillar-${p.title.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {p.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Skip */}
        <div className="text-center mb-10">
          <button
            onClick={() => setLocation("/recovery/dashboard")}
            className="text-sm text-gray-500 hover:text-white transition-colors"
            data-testid="button-skip-to-dashboard"
          >
            I'll explore on my own → Take me to the dashboard
          </button>
        </div>

        {/* Safety + caregiver */}
        <Card className="bg-red-950/15 border-red-500/25 mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white mb-1">If you're in crisis</p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Call or text{" "}
                  <a href="tel:988" className="text-red-300 underline font-bold">
                    988
                  </a>{" "}
                  (U.S. Suicide &amp; Crisis Lifeline) any time. For emergencies dial{" "}
                  <a href="tel:911" className="text-red-300 underline font-bold">
                    911
                  </a>
                  . The Sasquatch Coach is an AI — not a clinician.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#1e1e1e]">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <HeartHandshake className="h-5 w-5 text-[#E2741B] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white mb-1">
                  Are you the caregiver, not the survivor?
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Set up the account in your survivor's name and{" "}
                  <Link href="/recovery/caregiver" className="text-[#E2741B] underline">
                    add yourself as a caregiver
                  </Link>{" "}
                  during intake — you'll get the daily check-in summary and milestone alerts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-[11px] text-gray-600 text-center mt-8 leading-relaxed">
          By continuing, you've read our{" "}
          <Link href="/legal/medical-disclaimer" className="text-gray-400 underline">
            Medical Disclaimer
          </Link>
          ,{" "}
          <Link href="/terms" className="text-gray-400 underline">
            Terms of Service
          </Link>
          , and{" "}
          <Link href="/privacy" className="text-gray-400 underline">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
