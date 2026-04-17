import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  X,
  Flame,
  Shield,
  Users,
  Brain,
  Calendar,
  BookOpen,
  Mic,
  Trophy,
  Heart,
  Clock,
  Star,
  ArrowRight,
  Loader2,
  Gift,
  Zap,
  Crown,
  MessageCircle,
  Activity,
  Target,
  Lock,
} from "lucide-react";

const FREE_FEATURES = [
  { label: "Stroke Recovery community access", included: true },
  { label: "Recovery blog & articles", included: true },
  { label: "Public protocol library (limited)", included: true },
  { label: "Center Finder tool", included: true },
  { label: "Basic Sasquatch Coach (3 messages/day)", included: true },
  { label: "66-Day Challenge (read-only)", included: true },
  { label: "66-Day Challenge with daily missions", included: false },
  { label: "Unlimited Sasquatch Coach", included: false },
  { label: "Full protocol library (20+ programs)", included: false },
  { label: "Accountability check-ins", included: false },
  { label: "Habit tracking dashboard", included: false },
  { label: "Recovery University courses", included: false },
  { label: "Live group sessions", included: false },
  { label: "My Book memoir writing tool", included: false },
];

const WARRIOR_FEATURES = [
  { label: "Everything in Free", included: true },
  { label: "66-Day Challenge with daily missions", included: true },
  { label: "Unlimited Sasquatch Coach (24/7 AI)", included: true },
  { label: "Full protocol library (20+ programs)", included: true },
  { label: "Daily accountability check-ins", included: true },
  { label: "Habit tracking & 60-day streak tracker", included: true },
  { label: "Recovery University (all courses)", included: true },
  { label: "Live group sessions with Nick", included: true },
  { label: "My Book memoir writing tool", included: true },
  { label: "Survivor Income program access", included: true },
  { label: "Priority community feed visibility", included: true },
  { label: "Monthly bonus challenges", included: true },
];

const WHAT_YOU_GET = [
  {
    icon: Target,
    title: "66-Day Challenge",
    desc: "The most structured stroke recovery program available. Daily missions, phase tracking, and a clear path to breakthrough.",
  },
  {
    icon: MessageCircle,
    title: "Sasquatch Coach (Unlimited)",
    desc: "Nick's AI accountability coach available 24/7. Raspy, honest, and relentless about your progress — exactly when you need it.",
  },
  {
    icon: Activity,
    title: "Protocol Library",
    desc: "20+ evidence-based recovery programs for upper extremity, gait, cognitive, and speech — built for real survivors.",
  },
  {
    icon: Users,
    title: "Survivor Community",
    desc: "A community that actually gets it. Post updates, ask questions, celebrate wins, and get support from people in the same fight.",
  },
  {
    icon: BookOpen,
    title: "Recovery University",
    desc: "Full course access covering Physical, Cognitive, Speech, and Emotional recovery modules — learn at your own pace.",
  },
  {
    icon: Brain,
    title: "Accountability System",
    desc: "Daily habit tracking, check-ins, and a 60-day visual tracker that keeps you honest and forward-moving.",
  },
];

const TESTIMONIALS = [
  {
    name: "David R.",
    detail: "Left-side stroke survivor, 14 months post",
    quote: "I was in a dark place 8 months out. The 66-Day Challenge gave me structure when nothing else did. First time I felt like I was actually doing something.",
    avatar: "DR",
  },
  {
    name: "Linda K.",
    detail: "Caregiver for husband, 2.5 years post-stroke",
    quote: "My husband finally found something that keeps him accountable. The Sasquatch Coach is the only thing he listens to — it tells him the truth.",
    avatar: "LK",
  },
  {
    name: "Marcus T.",
    detail: "Hemorrhagic stroke, 3 years post",
    quote: "I tried four other programs. This one stuck because Nick actually survived a stroke. He's not guessing. He knows the darkness and he knows the way out.",
    avatar: "MT",
  },
];

const FAQS = [
  {
    q: "What exactly is the 7-day free trial?",
    a: "You get full Warrior access — every feature, every protocol, the complete 66-Day Challenge, unlimited Sasquatch Coach — for 7 days. No charge. You enter your card to start, but nothing is billed until day 8. Cancel any time before then and you pay nothing.",
  },
  {
    q: "What's the difference between monthly and annual?",
    a: "Warrior Monthly is $47/month billed each month. Warrior Annual is $397/year billed once — that's $33/month, saving you $167. Both include the 7-day free trial and identical features.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your dashboard at any time. Monthly plans stop at end of the billing period. Annual plans are non-refundable after the first 14 days, but you keep access for the full year you paid for.",
  },
  {
    q: "Is this just for stroke survivors or caregivers too?",
    a: "Both. Caregivers use the community, the accountability tools, and the resource library constantly. Nick built this for survivors first — but the people beside survivors need support just as much.",
  },
  {
    q: "What's the Sasquatch Coach, really?",
    a: "It's an AI accountability coach trained on Nick's voice, philosophy, and real recovery story. It's powered by Google Gemini AI and delivered in a raspy southern voice via ElevenLabs. It won't baby you. It will push you. That's the point.",
  },
  {
    q: "What if I can't afford it?",
    a: "Apply for a Stroke Lyfe Inc. scholarship on our Gift a Survivor page. The nonprofit exists specifically so cost isn't the reason someone misses their recovery window.",
  },
  {
    q: "How is this different from YouTube videos or Facebook groups?",
    a: "Structure and accountability. YouTube gives you information. This gives you a system, daily missions, someone checking on you, and a community that expects you to show up. Information alone doesn't rebuild brains.",
  },
];

export default function RecoveryPricing() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);

  const subscriptionMutation = useMutation({
    mutationFn: async (tier: string) => {
      const res = await apiRequest("POST", "/api/recovery/payments/subscription", {
        tier,
        withTrial: true,
      });
      return res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) window.location.href = data.url;
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Could not start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWarrior = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    subscriptionMutation.mutate(isAnnual ? "warrior_annual" : "warrior_monthly");
  };

  const annualSavings = Math.round(((47 * 12 - 397) / (47 * 12)) * 100);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="Warrior Membership Pricing — Stroke Recovery Academy"
        description="Join the Stroke Recovery Academy Warrior membership. 7-day free trial. $47/month or $397/year. Daily accountability, the 66-Day Challenge, unlimited Sasquatch AI Coach, 20+ protocols, Recovery University, and a community that actually gets it."
        canonical="/recovery/pricing"
        keywords={[
          "stroke recovery membership",
          "stroke recovery program pricing",
          "warrior membership stroke",
          "stroke recovery accountability",
          "66 day stroke challenge",
          "sasquatch coach stroke",
          "stroke recovery subscription",
          "stroke recovery free trial",
          "Nick Kremers stroke program",
        ]}
        breadcrumbs={[{ name: "Pricing", url: "/recovery/pricing" }]}
      />
      <RecoveryHeader />

      {/* HERO */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#C9941A]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#C9941A]/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 text-sm px-4 py-1.5">
            <Flame className="w-3.5 h-3.5 mr-1.5" />
            7-Day Free Trial — No Charge Until Day 8
          </Badge>

          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Stop Guessing.<br />
            <span className="text-[#C9941A]">Start Rebuilding.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Nick Kremers survived a stroke. He built the system he wishes had existed.
            Structure, accountability, and a coach who won't let you quit.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mb-10">
            {[
              { icon: Shield, label: "7-day free trial" },
              { icon: Clock, label: "Cancel anytime" },
              { icon: Heart, label: "Stroke Lyfe scholarships available" },
              { icon: Star, label: "Built by a survivor" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#C9941A]" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="bg-[#C9941A] text-black font-black text-lg px-10 gap-2"
            onClick={handleWarrior}
            disabled={subscriptionMutation.isPending}
            data-testid="button-hero-trial-cta"
          >
            {subscriptionMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Flame className="w-5 h-5" />
            )}
            Start Your Free 7 Days
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            Enter card info to hold your spot. Nothing charged until day 8. Cancel before then — pay nothing.
          </p>
        </div>
      </section>

      {/* BILLING TOGGLE + CARDS */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-12">
            <Label htmlFor="billing-recovery" className={!isAnnual ? "text-white font-semibold" : "text-gray-500"}>
              Monthly
            </Label>
            <Switch
              id="billing-recovery"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              data-testid="switch-billing-recovery"
            />
            <Label htmlFor="billing-recovery" className={isAnnual ? "text-white font-semibold" : "text-gray-500"}>
              Annual
            </Label>
            {isAnnual && (
              <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 font-bold">
                <Gift className="w-3 h-3 mr-1" />
                Save {annualSavings}%
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FREE TIER */}
            <Card className="bg-[#1a1a1a] border border-[#333] flex flex-col" data-testid="card-tier-free">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#333] flex items-center justify-center">
                    <Zap className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Community</p>
                    <h2 className="text-xl font-bold text-white">Free</h2>
                  </div>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-gray-500 mb-1">/forever</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Start here. Join the community and explore resources with no commitment.
                </p>
              </CardHeader>

              <CardContent className="flex-1">
                <Separator className="mb-4 bg-[#333]" />
                <ul className="space-y-2.5">
                  {FREE_FEATURES.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" data-testid={`feature-free-${i}`}>
                      {f.included ? (
                        <Check className="w-4 h-4 text-[#C9941A] mt-0.5 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-700 mt-0.5 shrink-0" />
                      )}
                      <span className={f.included ? "text-gray-300" : "text-gray-600"}>{f.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-[#333] text-white"
                  onClick={() => window.location.href = isAuthenticated ? "/recovery/community" : "/api/login"}
                  data-testid="button-select-free"
                >
                  Join Free
                </Button>
              </CardFooter>
            </Card>

            {/* WARRIOR TIER */}
            <Card
              className="bg-[#1a1a1a] border-2 border-[#C9941A] ring-2 ring-[#C9941A]/20 flex flex-col relative"
              data-testid="card-tier-warrior"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#C9941A] text-black font-black px-4" data-testid="badge-warrior-popular">
                  <Crown className="w-3 h-3 mr-1" />
                  MOST POPULAR
                </Badge>
              </div>

              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#C9941A]/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-[#C9941A]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#C9941A] uppercase tracking-wider font-bold">Full Access</p>
                    <h2 className="text-xl font-bold text-white">Warrior</h2>
                  </div>
                </div>

                {isAnnual ? (
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-white">$33</span>
                      <span className="text-gray-400 mb-1">/month</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">$397 billed once per year</p>
                    <p className="text-sm text-[#C9941A] font-bold mt-1">
                      <Gift className="w-3 h-3 inline mr-1" />
                      You save $167/year
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-white">$47</span>
                      <span className="text-gray-400 mb-1">/month</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Billed monthly. Cancel anytime.</p>
                  </div>
                )}

                <div className="mt-3 px-3 py-2 rounded-lg bg-[#C9941A]/10 border border-[#C9941A]/20">
                  <p className="text-sm text-[#C9941A] font-semibold text-center">
                    <Flame className="w-3.5 h-3.5 inline mr-1" />
                    7-day free trial — charged {isAnnual ? "$397" : "$47"} on day 8
                  </p>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <Separator className="mb-4 bg-[#C9941A]/20" />
                <ul className="space-y-2.5">
                  {WARRIOR_FEATURES.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" data-testid={`feature-warrior-${i}`}>
                      <Check className="w-4 h-4 text-[#C9941A] mt-0.5 shrink-0" />
                      <span className="text-gray-200">{f.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  size="lg"
                  className="w-full bg-[#C9941A] text-black font-black gap-2"
                  onClick={handleWarrior}
                  disabled={subscriptionMutation.isPending}
                  data-testid="button-select-warrior"
                >
                  {subscriptionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Flame className="w-4 h-4" />
                  )}
                  Start Free Trial
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Scholarship CTA */}
          <div className="mt-8 p-5 rounded-xl bg-[#1a1a1a] border border-[#333] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-[#C9941A] shrink-0" />
              <div>
                <p className="text-white font-semibold">Can't afford the membership?</p>
                <p className="text-sm text-gray-400">
                  Stroke Lyfe Inc. (501(c)(3)) offers scholarships funded entirely by community donations.
                </p>
              </div>
            </div>
            <Link href="/recovery/gift">
              <Button variant="outline" className="border-[#C9941A]/40 text-[#C9941A] shrink-0" data-testid="button-scholarship-link">
                Apply for a Scholarship
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-16 px-4 border-t border-[#222]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-3 text-white">
            What Warrior <span className="text-[#C9941A]">Actually Gets You</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-xl mx-auto">
            Not information. A system. Built by someone who lived it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHAT_YOU_GET.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="p-5 rounded-xl bg-[#1a1a1a] border border-[#333]" data-testid={`card-feature-${i}`}>
                <div className="w-10 h-10 rounded-lg bg-[#C9941A]/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#C9941A]" />
                </div>
                <h3 className="text-white font-bold mb-1">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-4 border-t border-[#222] bg-[#111]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10 text-white">
            From Warriors Who <span className="text-[#C9941A]">Actually Did It</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="bg-[#1a1a1a] border border-[#333]" data-testid={`card-testimonial-${i}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 text-[#C9941A] fill-[#C9941A]" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm italic mb-4 leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#C9941A]/20 flex items-center justify-center text-[#C9941A] font-bold text-xs shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t.name}</p>
                      <p className="text-gray-500 text-xs">{t.detail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-[#222]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10 text-white">
            Frequently Asked <span className="text-[#C9941A]">Questions</span>
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4"
                data-testid={`faq-item-${i}`}
              >
                <AccordionTrigger className="text-white hover:text-[#C9941A] text-left py-4 text-sm font-semibold">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 text-sm leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4 border-t border-[#222] bg-gradient-to-b from-[#0D0D0D] to-[#111]">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-6 bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30">
            <Flame className="w-3.5 h-3.5 mr-1.5" />
            7 days free. No excuses.
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            You've already survived the hardest part.<br />
            <span className="text-[#C9941A]">Now rebuild.</span>
          </h2>
          <p className="text-gray-400 mb-10 text-lg max-w-xl mx-auto">
            Start the 7-day free trial. Enter the 66-Day Challenge. Let the Sasquatch Coach push you.
            Cancel before day 8 — or start the fight for real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button
              size="lg"
              className="bg-[#C9941A] text-black font-black text-lg px-10 gap-2"
              onClick={handleWarrior}
              disabled={subscriptionMutation.isPending}
              data-testid="button-final-cta"
            >
              {subscriptionMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Flame className="w-5 h-5" />
              )}
              Start Free — {isAnnual ? "$397/yr" : "$47/mo"} after 7 days
            </Button>
            <Link href="/recovery/challenge">
              <Button
                size="lg"
                variant="outline"
                className="border-[#333] text-white gap-2"
                data-testid="button-learn-challenge"
              >
                Learn About the 66-Day Challenge
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#C9941A]/60" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C9941A]/60" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-[#C9941A]/60" />
              <span>Scholarships available via Stroke Lyfe Inc.</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
