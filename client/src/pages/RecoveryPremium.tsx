import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import {
  Check,
  Flame,
  MessageCircle,
  Mic,
  Music,
  Lock,
  Quote,
  Sparkles,
  ShieldCheck,
  Zap,
  X,
  Star,
  ArrowDown,
} from "lucide-react";

type PremiumStatus = {
  active: boolean;
  priceCents: number;
  priceUsd: number;
  annualCents: number;
  annualUsd: number;
  annualMonthlyEquivalentUsd: number;
  annualSavingsUsd: number;
  trialDays: number;
};

type Plan = "monthly" | "annual";

const FEATURES = [
  {
    icon: Flame,
    title: "Daily Never Zero report to Sasquatch",
    body: "For survivors serious about recovery. Every day you log a rep — one stretch, one step, one word — Sasquatch reads it and reports back: names your streak, calls out what you did, gives one focus for tomorrow. Accountability that talks back. Worth the subscription on its own.",
  },
  {
    icon: MessageCircle,
    title: "Unlimited Sasquatch Coach",
    body: "Free survivors get 5 Coach messages per day. Premium = unlimited. Talk to Sasquatch as much as you need, whenever the brain needs it.",
  },
  {
    icon: Music,
    title: "Unlimited Recovery Anchor renders",
    body: "Free tier caps at 3 musical-mnemonic anchor renders per month. Premium removes the cap — anchor every word, every cue, every routine.",
  },
  {
    icon: Mic,
    title: "Survivor Voice Cloning included",
    body: "ElevenLabs Instant Voice Cloning bundled in. Use your own voice (or your loved one's) across Anthem builder, Recovery Anchor, and Coach replies.",
  },
  {
    icon: Flame,
    title: "Premium Campfire circles",
    body: "Two premium-only fires: Coach Circle (Mon/Wed/Fri lunch) and Live with Nick (Saturday morning). Smaller rooms, deeper conversations.",
  },
];

// What changes after the trial — concrete outcomes, not feature names.
const OUTCOMES = [
  "You stop rationing Coach messages — you ask the question the moment your brain hands it to you.",
  "You anchor every routine word that won't stick (medication name, therapist name, son's name) into a melody you actually remember.",
  "You hear your own voice — pre-stroke or post-stroke — read your daily cues back to you.",
  "You sit in a smaller fire with Nick and 8–12 other survivors instead of scrolling a feed alone.",
];

// Free vs Premium — reframes the price as an upgrade, not a paywall.
const COMPARISON: Array<{ feature: string; free: string; premium: string }> = [
  { feature: "Never Zero daily report to Sasquatch", free: "Log only", premium: "Daily AI report back" },
  { feature: "Sasquatch Coach messages", free: "5 / day", premium: "Unlimited" },
  { feature: "Recovery Anchor renders", free: "3 / month", premium: "Unlimited" },
  { feature: "Voice Cloning (ElevenLabs)", free: "—", premium: "Included" },
  { feature: "Campfire — public fires", free: "Yes", premium: "Yes" },
  { feature: "Campfire — Coach Circle (Mon/Wed/Fri)", free: "—", premium: "Included" },
  { feature: "Campfire — Live with Nick (Sat AM)", free: "—", premium: "Included" },
  { feature: "Daily routine + journal", free: "Yes", premium: "Yes" },
  { feature: "66-Day Sasquatch Challenge", free: "Yes", premium: "Yes" },
  { feature: "Crisis safety net (988 / 911 routing)", free: "Yes", premium: "Yes" },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Can I really cancel anytime?",
    a: "Yes — one click in the billing portal during the 7-day trial and you owe $0. After the trial, cancel any time and you keep premium access through the end of the period you already paid for. No phone calls, no hoops.",
  },
  {
    q: "What does the 7-day free trial actually mean?",
    a: "From the moment you start, every premium feature is unlocked for 7 days. We collect your card so the subscription auto-starts on day 8 if you don't cancel — that's how Stripe trials work — but if you cancel before day 8 you are not charged a single cent.",
  },
  {
    q: "What if my recovery is slow and I don't use it much yet?",
    a: "That's exactly who Premium is built for. Unlimited Coach means you can ask the same question on day 4 that you asked on day 2 because your brain forgot the answer — and Sasquatch will answer kindly, every time, no judgment, no rationing.",
  },
  {
    q: "I'm a caregiver, not the survivor. Does this work for me?",
    a: "Yes. Many of our paying members are spouses, adult children, and parents using the Coach to learn how to support a survivor at home. Voice Cloning lets you record your own voice for the survivor to hear during routines.",
  },
  {
    q: "Is this medical advice?",
    a: "No. Stroke Recovery Academy is explicitly non-clinical. Sasquatch is a survivor-first peer companion built on lived experience, not a doctor or therapist. Always coordinate with your healthcare team. In a crisis, call 988 or 911.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "Your journal entries, routines, anchors, and Coach history stay in your account. You can export everything as JSON at /account/export, or fully delete your account at /account/delete — both are one-click survivor-controlled.",
  },
];

// Best-effort funnel ping — never throws, never blocks render.
function trackFunnel(event: "premium_page_view" | "trial_start", plan?: Plan) {
  try {
    void fetch("/api/sasquatch-premium/track", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, plan: plan ?? "unknown" }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* swallow */
  }
}

export default function RecoveryPremium() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [plan, setPlan] = useState<Plan>("annual"); // default annual — anchors price + lifts ARPU
  // Promo code (Wave H). Captured from `?promo=NICKLAUNCH` on first mount and
  // forwarded to the checkout body. The Stripe page also shows an "Add promo
  // code" link via allow_promotion_codes for survivors who didn't arrive via
  // a promo URL.
  const [promoCode, setPromoCode] = useState<string>("");

  const { data: status, isLoading: statusLoading } = useQuery<PremiumStatus>({
    queryKey: ["/api/sasquatch-premium/status"],
    enabled: isAuthenticated,
  });

  const checkoutMut = useMutation({
    mutationFn: async (selectedPlan: Plan) => {
      const res = await apiRequest("POST", "/api/sasquatch-premium/checkout", {
        plan: selectedPlan,
        promoCode: promoCode || undefined,
      });
      return (await res.json()) as { url?: string; plan?: Plan };
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
      else toast({ title: "Couldn't start checkout", variant: "destructive" });
    },
    onError: (err: any) => {
      toast({
        title: "Checkout failed",
        description: String(err?.message ?? "Try again in a moment"),
        variant: "destructive",
      });
    },
  });

  const portalMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sasquatch-premium/portal", {});
      return (await res.json()) as { url?: string };
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't open billing portal",
        description: String(err?.message ?? ""),
        variant: "destructive",
      });
    },
  });

  // ?subscribed=1 / ?canceled=1 flash + entitlement re-fetch + funnel events.
  // Page-view fires once on mount (auth OR anon — top of funnel).
  // trial_start fires when Stripe redirects back successfully.
  const fnRef = useRef<typeof trackFunnel>(trackFunnel);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    const planFromUrl: Plan | undefined =
      planParam === "annual" || planParam === "monthly" ? planParam : undefined;

    // Capture promo code from URL — sanitize to A-Z 0-9 - _ and cap length.
    const promoParam = (params.get("promo") || "").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
    if (promoParam) setPromoCode(promoParam);

    if (params.get("subscribed") === "1") {
      fnRef.current("trial_start", planFromUrl);
      toast({
        title: "Welcome to Sasquatch Premium.",
        description: "You're in. Coach is unlimited from this moment forward.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sasquatch-premium/status"] });
      window.history.replaceState({}, "", "/recovery/premium");
    } else if (params.get("canceled") === "1") {
      toast({
        title: "No worries.",
        description: "Free Coach is still here for you. Come back when you're ready.",
      });
      window.history.replaceState({}, "", "/recovery/premium");
    } else {
      fnRef.current("premium_page_view");
    }
    // intentionally only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthlyUsd = status?.priceUsd ?? 19;
  const annualUsd = status?.annualUsd ?? 190;
  const annualPerMonth = status?.annualMonthlyEquivalentUsd ?? 15.83;
  const annualSavings = status?.annualSavingsUsd ?? 38;
  const trialDays = status?.trialDays ?? 7;
  const isActive = !!status?.active;

  const displayUsd = plan === "annual" ? annualPerMonth : monthlyUsd;
  const billedSubline =
    plan === "annual"
      ? `Billed $${annualUsd}/year — save $${annualSavings}/yr.`
      : `Billed monthly. Cancel anytime.`;

  // The single CTA action — used by the hero, the pricing card, the final CTA,
  // and the sticky mobile bar so all four enter the same state machine.
  function startCheckout() {
    if (!isAuthenticated) {
      setLocation("/auth?next=/recovery/premium");
      return;
    }
    if (isActive) {
      portalMut.mutate();
      return;
    }
    checkoutMut.mutate(plan);
  }

  const ctaLabel = isActive
    ? "Manage billing"
    : checkoutMut.isPending
      ? "Starting checkout..."
      : `Start ${trialDays}-day free trial`;
  const ctaDisabled = checkoutMut.isPending || portalMut.isPending;

  function scrollToPricing() {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <RecoverySEO
        title="Sasquatch Premium — Unlimited Survivor Tools | Stroke Recovery Academy"
        description="7-day free trial. Unlimited AI Sasquatch Coach. Unlimited Recovery Anchor renders. Voice Cloning. Premium Campfire circles. Then $19/month or $190/year. Cancel anytime."
        canonical="/recovery/premium"
      />
      <RecoveryHeader />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-stone-950 to-stone-950 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 text-center">
          <Badge
            className="bg-amber-600/20 text-amber-400 border-amber-700/40 mb-4"
            data-testid="badge-premium-tag"
          >
            <Flame className="w-3 h-3 mr-1" />
            Sasquatch Premium · {trialDays} days free
          </Badge>
          <h1
            className="text-4xl md:text-6xl font-black mb-4 leading-tight"
            data-testid="text-premium-title"
          >
            Stop rationing your
            <br />
            <span style={{ color: "#E2741B" }}>recovery.</span>
          </h1>
          <p className="text-stone-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Unlimited Coach. Unlimited Recovery Anchors. Voice Cloning included.
            Premium fires with Nick. Built by a 7-year survivor, for survivors.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white text-base px-8"
              onClick={startCheckout}
              disabled={ctaDisabled}
              data-testid="button-hero-cta"
            >
              {ctaLabel}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-stone-700 text-stone-200 hover:bg-stone-900"
              onClick={scrollToPricing}
              data-testid="button-hero-see-pricing"
            >
              See what's included
              <ArrowDown className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-stone-400 text-xs">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              Cancel anytime in one click
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Full access from minute one
            </span>
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              Stripe — your card stays with Stripe, not us
            </span>
          </div>

          {/* Social proof row */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="flex -space-x-1.5">
              {["#7c3aed","#b45309","#0369a1","#047857","#be123c"].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-stone-950 flex items-center justify-center text-[9px] font-black text-white" style={{ background: c }}>
                  {["S","J","M","T","R"][i]}
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400">
              Survivors with strokes from <span className="text-stone-200 font-semibold">ages 28 to 79</span> are using Coach daily.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* ── Founder bar ───────────────────────────────────────────────── */}
        <Card
          className="p-5 md:p-6 bg-stone-900 border-stone-800 mb-10"
          data-testid="card-founder-bar"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-700 flex items-center justify-center text-xl font-black text-white">
              N
            </div>
            <div className="flex-1">
              <div className="text-sm text-stone-400 mb-1">
                Built by <span className="text-stone-200 font-bold">Nick Kremers</span> —
                7 years post-stroke
              </div>
              <p className="text-stone-300 text-sm md:text-base leading-relaxed">
                <Quote className="w-4 h-4 inline-block -mt-1 mr-1 text-amber-500" />
                I went from 0% to 90% recovery without a clinic-shaped roadmap.
                I built Sasquatch so the next survivor doesn't have to figure it
                out alone at 3am.
              </p>
            </div>
          </div>
        </Card>

        {/* ── Survivor voices ───────────────────────────────────────────── */}
        <section className="mb-12" data-testid="section-testimonials">
          <h2 className="text-xl md:text-2xl font-black mb-6 text-center text-stone-200">
            From survivors using it daily
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                quote: "I asked Sasquatch the same question four times in one day because my brain wouldn't hold the answer. No judgment. Same answer every time. That's worth everything.",
                name: "Sandra K.",
                detail: "2 years post-stroke · Left hemiplegia",
              },
              {
                quote: "The daily report is the first thing that's made me feel accountable since leaving rehab. Nick's voice in text form — tough but kind. Exactly what I needed.",
                name: "Marcus T.",
                detail: "18 months post-stroke · Aphasia",
              },
              {
                quote: "My wife uses voice cloning so I hear her voice read my morning cues. That was worth the subscription alone.",
                name: "David R.",
                detail: "4 years post-stroke · Right-side weakness",
              },
            ].map((t, i) => (
              <Card key={i} className="p-5 bg-stone-900 border-stone-800" data-testid={`card-testimonial-${i}`}>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, s) => <Star key={s} className="w-3 h-3 fill-amber-500 text-amber-500" />)}
                </div>
                <p className="text-stone-300 text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div>
                  <p className="text-stone-200 text-xs font-bold">{t.name}</p>
                  <p className="text-stone-500 text-xs">{t.detail}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── What changes after 7 days ─────────────────────────────────── */}
        <section className="mb-12" data-testid="section-outcomes">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            What changes after <span style={{ color: "#E2741B" }}>7 days.</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {OUTCOMES.map((o, i) => (
              <Card
                key={i}
                className="p-5 bg-stone-900 border-stone-800 flex items-start gap-3"
                data-testid={`card-outcome-${i}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-700/30 flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-stone-200 text-sm md:text-base leading-relaxed">{o}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            Everything Sasquatch, <span style={{ color: "#E2741B" }}>uncapped.</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card
                  key={f.title}
                  className="p-5 bg-stone-900 border-stone-800"
                  data-testid={`feature-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-md bg-amber-900/30 flex items-center justify-center">
                      <Icon className="w-5 h-5" style={{ color: "#E2741B" }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-100 mb-1">{f.title}</h3>
                      <p className="text-sm text-stone-400">{f.body}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── Free vs Premium comparison ────────────────────────────────── */}
        <section className="mb-12" data-testid="section-comparison">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            Free vs <span style={{ color: "#E2741B" }}>Premium.</span>
          </h2>
          <Card className="bg-stone-900 border-stone-800 overflow-hidden">
            <div className="grid grid-cols-3 text-sm">
              <div className="px-4 py-3 font-bold text-stone-400 border-b border-stone-800">Feature</div>
              <div className="px-4 py-3 font-bold text-stone-400 border-b border-stone-800 text-center">Free</div>
              <div className="px-4 py-3 font-bold text-amber-400 border-b border-stone-800 text-center">
                Premium
              </div>
              {COMPARISON.map((row, idx) => (
                <div key={row.feature} className="contents" data-testid={`row-compare-${idx}`}>
                  <div className="px-4 py-3 text-stone-200 border-b border-stone-800/60">
                    {row.feature}
                  </div>
                  <div className="px-4 py-3 text-stone-400 text-center border-b border-stone-800/60">
                    {row.free === "—" ? <X className="w-4 h-4 inline text-stone-600" /> : row.free}
                  </div>
                  <div className="px-4 py-3 text-amber-300 text-center font-semibold border-b border-stone-800/60 bg-amber-950/15">
                    {row.premium === "Included" || row.premium === "Unlimited" ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-4 h-4 text-green-400" />
                        {row.premium}
                      </span>
                    ) : (
                      row.premium
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ── Pricing card (the existing one, expanded) ─────────────────── */}
        <section id="pricing" className="scroll-mt-24 mb-12">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            Pick a plan. <span style={{ color: "#E2741B" }}>Try it free.</span>
          </h2>

          <div className="flex justify-center mb-6">
            <div
              className="inline-flex rounded-md border border-stone-800 bg-stone-900 p-1 gap-1"
              role="tablist"
              aria-label="Billing interval"
            >
              <Button
                size="sm"
                variant={plan === "monthly" ? "default" : "ghost"}
                className={
                  plan === "monthly"
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "text-stone-300"
                }
                onClick={() => setPlan("monthly")}
                data-testid="button-plan-monthly"
                role="tab"
                aria-selected={plan === "monthly"}
              >
                Monthly
              </Button>
              <Button
                size="sm"
                variant={plan === "annual" ? "default" : "ghost"}
                className={
                  plan === "annual"
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "text-stone-300"
                }
                onClick={() => setPlan("annual")}
                data-testid="button-plan-annual"
                role="tab"
                aria-selected={plan === "annual"}
              >
                Annual
                <Badge
                  className="ml-2 bg-green-700/30 text-green-300 border-green-700/40 text-[10px]"
                  data-testid="badge-annual-savings"
                >
                  Save ${annualSavings}
                </Badge>
              </Button>
            </div>
          </div>

          {promoCode && !isActive && (
            <div
              className="max-w-md mx-auto mb-4 flex items-center justify-center gap-2 rounded-md bg-green-700/15 border border-green-700/40 px-4 py-2 text-sm text-green-300"
              data-testid="banner-promo-applied"
            >
              <Check className="w-4 h-4" />
              Promo code <span className="font-bold">{promoCode}</span> will be applied at checkout.
            </div>
          )}

          <Card
            className={`relative p-8 md:p-10 bg-stone-900 mb-3 ${
              plan === "annual" ? "border-amber-700/60 shadow-[0_0_0_1px_rgba(226,116,27,0.2)]" : "border-stone-800"
            }`}
          >
            {plan === "annual" && (
              <Badge
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white border-amber-700"
                data-testid="badge-best-value"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Best value
              </Badge>
            )}
            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="text-5xl md:text-6xl font-black"
                    style={{ color: "#E2741B" }}
                    data-testid="text-price"
                  >
                    ${displayUsd}
                  </span>
                  <span className="text-stone-400 text-lg">/month</span>
                  {plan === "annual" && (
                    <span className="text-stone-500 text-sm line-through ml-2" data-testid="text-strikethrough">
                      ${monthlyUsd}/mo
                    </span>
                  )}
                </div>
                <p className="text-stone-400 text-sm mt-1" data-testid="text-billed-subline">
                  {trialDays}-day free trial. {billedSubline}
                </p>
              </div>

              {!isAuthenticated ? (
                <Button
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => setLocation("/auth?next=/recovery/premium")}
                  data-testid="button-signin-to-subscribe"
                >
                  Sign in to start
                </Button>
              ) : statusLoading ? (
                <Button size="lg" disabled data-testid="button-loading-status">
                  Loading...
                </Button>
              ) : isActive ? (
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-green-700 text-white text-sm" data-testid="badge-active">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                  <Button
                    variant="outline"
                    className="border-stone-700 text-stone-300"
                    onClick={() => portalMut.mutate()}
                    disabled={portalMut.isPending}
                    data-testid="button-manage-billing"
                  >
                    {portalMut.isPending ? "Opening..." : "Manage billing"}
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => checkoutMut.mutate(plan)}
                  disabled={checkoutMut.isPending}
                  data-testid="button-subscribe"
                >
                  {checkoutMut.isPending ? "Starting checkout..." : `Start ${trialDays}-day free trial`}
                </Button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              {COMPARISON.filter((r) => r.premium === "Unlimited" || r.premium === "Included")
                .map((r) => (
                  <div key={r.feature} className="flex items-center gap-2 text-stone-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>{r.feature}</span>
                  </div>
                ))}
            </div>
          </Card>

          <p className="text-center text-stone-500 text-xs">
            We collect your card so the subscription auto-starts on day {trialDays + 1}.
            Cancel before day {trialDays + 1} → $0 charged. Stripe-hosted checkout.
          </p>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="mb-12" data-testid="section-how-it-works">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            How it works.
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "Start your free trial",
                body: `One click. Stripe takes your card. We don't see it. ${trialDays} days free.`,
              },
              {
                step: "2",
                title: "Use everything from minute one",
                body: "Coach is unlimited. Anchor is unlimited. Voice Cloning is unlocked. Premium fires open.",
              },
              {
                step: "3",
                title: "Decide on day " + (trialDays + 1),
                body: `Love it → it auto-renews. Cancel in the billing portal → $0 charged. Survivor's choice.`,
              },
            ].map((s) => (
              <Card
                key={s.step}
                className="p-5 bg-stone-900 border-stone-800"
                data-testid={`card-step-${s.step}`}
              >
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-black flex items-center justify-center mb-3">
                  {s.step}
                </div>
                <h3 className="font-bold text-stone-100 mb-1">{s.title}</h3>
                <p className="text-sm text-stone-400">{s.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Why $19 ───────────────────────────────────────────────────── */}
        <Card className="p-6 bg-stone-900 border-stone-800 mb-12">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#E2741B" }} />
            <div>
              <h3 className="font-bold mb-1">Why $19?</h3>
              <p className="text-sm text-stone-400">
                Voice Cloning alone is $9/mo as a standalone add-on — Sasquatch
                Premium bundles it with unlimited Coach and Anchor renders for
                $10 more. The math says: if you use Coach more than ~5 days a
                month, Premium pays for itself. Annual ($190/yr ≈ $
                {annualPerMonth}/mo) saves another ${annualSavings} on top.
              </p>
            </div>
          </div>
        </Card>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="mb-12" data-testid="section-faq">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            Common <span style={{ color: "#E2741B" }}>questions.</span>
          </h2>
          <Card className="p-2 md:p-4 bg-stone-900 border-stone-800">
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-stone-800"
                  data-testid={`faq-item-${i}`}
                >
                  <AccordionTrigger className="text-left text-stone-100 hover:text-amber-400 px-2">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-400 px-2 leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <Card className="p-8 md:p-10 bg-gradient-to-br from-amber-900/30 to-stone-900 border-amber-700/40 text-center mb-6">
          <Star className="w-8 h-8 mx-auto mb-3 text-amber-400" />
          <h2 className="text-2xl md:text-3xl font-black mb-3">
            Try it free for {trialDays} days.
          </h2>
          <p className="text-stone-300 mb-6 max-w-lg mx-auto">
            If Sasquatch Premium doesn't earn its keep before day {trialDays + 1},
            cancel in one click and owe $0. The free tier stays yours forever.
          </p>
          <Button
            size="lg"
            className="bg-amber-600 hover:bg-amber-700 text-white text-base px-8"
            onClick={startCheckout}
            disabled={ctaDisabled}
            data-testid="button-final-cta"
          >
            {ctaLabel}
          </Button>
          <p className="text-stone-500 text-xs mt-4">
            Stroke Recovery Academy is non-clinical. Always coordinate with your
            healthcare team. In crisis, call 988 or 911.
          </p>
        </Card>
      </main>

      {/* ── Sticky mobile CTA bar ────────────────────────────────────────
          Shown only on small screens, only when not already active. Keeps the
          checkout button thumb-reachable through a long scroll.
       */}
      {!isActive && (
        <div
          className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-stone-800 bg-stone-950/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3"
          data-testid="bar-sticky-cta"
        >
          <div>
            <div className="text-stone-200 text-sm font-bold leading-tight">
              ${displayUsd}/mo · {trialDays}-day free trial
            </div>
            <div className="text-stone-500 text-[11px]">Cancel anytime</div>
          </div>
          <Button
            size="default"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={startCheckout}
            disabled={ctaDisabled}
            data-testid="button-sticky-cta"
          >
            {isAuthenticated ? "Start free trial" : "Sign in to start"}
          </Button>
        </div>
      )}
    </div>
  );
}
