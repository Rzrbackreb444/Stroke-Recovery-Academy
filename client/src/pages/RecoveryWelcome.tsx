import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import { RecommendationCards } from "@/components/RecommendationCard";
import {
  MessageCircle,
  Flame,
  Music,
  CalendarCheck,
  Crown,
  ArrowRight,
  Check,
  Compass,
} from "lucide-react";

const WELCOME_DONE_KEY = "sra-welcome-done-v1";

const STEPS = [
  {
    key: "coach",
    icon: MessageCircle,
    title: "Sasquatch Coach",
    body: "A survivor-first peer companion built on lived experience. Ask the question your brain handed you this morning. Free survivors get 25 messages a day.",
    href: "/recovery/sasquatch-coach",
    cta: "Talk to Sasquatch",
  },
  {
    key: "today",
    icon: Flame,
    title: "Today's Bonfire",
    body: "An adaptive routine session that knows what you did yesterday and meets you where you are today. Even one rep counts.",
    href: "/recovery/today",
    cta: "See today's Bonfire",
  },
  {
    key: "anchor",
    icon: Music,
    title: "Recovery Anchor",
    body: "Anchor a word your brain keeps losing into a melody you actually remember. Survivors call it the one tool that changed everything.",
    href: "/recovery/motivation",
    cta: "Try Recovery Anchor",
  },
  {
    key: "journey",
    icon: CalendarCheck,
    title: "Your Daily Journey",
    body: "One page that walks you through the 6 steps that make a sticky recovery day. Streak, progress, and what's next — never zero.",
    href: "/recovery/journey",
    cta: "Open Daily Journey",
  },
  {
    key: "premium",
    icon: Crown,
    title: "Sasquatch Premium",
    body: "Unlimited Coach. Unlimited Anchors. Voice Cloning included. Premium Campfire fires. 7-day free trial. Skip if not ready — premium will be here when you are.",
    href: "/recovery/premium",
    cta: "See Premium",
    optional: true,
  },
];

function markDone() {
  try {
    localStorage.setItem(WELCOME_DONE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export default function RecoveryWelcome() {
  const [, setLocation] = useLocation();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  // Track step "tries" client-side so the survivor sees their welcome
  // progress even before the journey API has caught up. Persisted across
  // tab reloads so a refresh doesn't lose progress.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sra-welcome-tried-v1") ?? "{}";
      setCompleted(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function markTried(key: string) {
    setCompleted((prev) => {
      const next = { ...prev, [key]: true };
      try {
        localStorage.setItem("sra-welcome-tried-v1", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const triedCount = Object.values(completed).filter(Boolean).length;
  const totalCount = STEPS.length;

  function finish() {
    markDone();
    setLocation("/recovery/journey");
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <RecoverySEO
        title="Welcome — Stroke Recovery Academy"
        description="Your first 5 minutes. The 5 things every survivor should know about Stroke Recovery Academy."
        canonical="/recovery/welcome"
      />
      <RecoveryHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="mb-8 text-center">
          <Badge className="bg-amber-600/20 text-amber-400 border-amber-700/40 mb-3">
            <Compass className="w-3 h-3 mr-1" />
            Welcome, survivor
          </Badge>
          <h1
            className="text-3xl md:text-5xl font-black mb-3"
            data-testid="text-welcome-title"
          >
            Your first <span style={{ color: "#C9941A" }}>5 minutes.</span>
          </h1>
          <p className="text-stone-300 max-w-2xl mx-auto">
            Five cards. Five outcomes. No forced tour. Tap into anything that
            calls to you, skip what doesn't, and land on your Daily Journey
            when you're ready.
          </p>
          <div className="text-stone-500 text-xs mt-3" data-testid="text-tried-count">
            {triedCount}/{totalCount} tried
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const tried = !!completed[s.key];
            return (
              <Card
                key={s.key}
                className={`p-5 ${
                  tried
                    ? "bg-stone-900/60 border-green-700/40"
                    : "bg-stone-900 border-stone-800"
                }`}
                data-testid={`welcome-step-${s.key}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black ${
                      tried
                        ? "bg-green-700 text-white"
                        : "bg-amber-600 text-white"
                    }`}
                  >
                    {tried ? <Check className="w-5 h-5" /> : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Icon className="w-5 h-5 text-amber-400" />
                      <h2 className="font-bold text-lg">{s.title}</h2>
                      {s.optional && (
                        <Badge className="bg-stone-800 text-stone-400 border-stone-700 text-[10px]">
                          Optional
                        </Badge>
                      )}
                    </div>
                    <p className="text-stone-400 text-sm mb-4 leading-relaxed">
                      {s.body}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={s.href}>
                        <Button
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => markTried(s.key)}
                          data-testid={`button-try-${s.key}`}
                        >
                          {s.cta} <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="text-stone-400 hover:text-stone-200"
                        onClick={() => markTried(s.key)}
                        data-testid={`button-skip-${s.key}`}
                      >
                        Skip
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Gemini-powered welcome recs (1 card, soft) */}
        <section className="mb-8">
          <RecommendationCards surface="welcome" />
        </section>

        <Card className="p-6 bg-stone-900 border-stone-800 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to start the day?</h2>
          <p className="text-stone-400 text-sm mb-4">
            Your Daily Journey is the one page that holds the whole day together.
            Six steps. One streak. Never zero.
          </p>
          <Button
            size="lg"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={finish}
            data-testid="button-finish-welcome"
          >
            Open my Daily Journey <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>

        <p className="text-center text-stone-500 text-xs mt-6">
          Stroke Recovery Academy is non-clinical. Always coordinate with your
          healthcare team. In crisis, call 988 or 911.
        </p>
      </main>
    </div>
  );
}
