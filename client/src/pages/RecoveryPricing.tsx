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
  Minus,
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
  Sun,
  TrendingUp,
  HeartPulse,
  Stethoscope,
  CheckCircle,
} from "lucide-react";

// ─── Feature matrix ─────────────────────────────────────────────────────────
const FEATURE_MATRIX = [
  { label: "Survivor Community access", free: true, warrior: true },
  { label: "Recovery blog & articles", free: true, warrior: true },
  { label: "Recovery Center Finder", free: true, warrior: true },
  { label: "Brain Gym (3 sessions/day)", free: true, warrior: true },
  { label: "Public protocol library (limited)", free: true, warrior: true },
   { label: "Sasquatch Coach", free: "3 msg/day", warrior: "Unlimited access" },
  { label: "66-Day Challenge", free: "Read-only", warrior: "Daily missions" },
  { label: "Daily Routine System (5 levels)", free: false, warrior: true },
  { label: "Full exercise library (20+ programs)", free: false, warrior: true },
  { label: "Recovery University (all courses)", free: false, warrior: true },
  { label: "Habit tracking & streak tracker", free: false, warrior: true },
  { label: "Daily accountability check-ins", free: false, warrior: true },
  { label: "Live group sessions with Nick", free: false, warrior: true },
  { label: "My Book memoir writing tool", free: false, warrior: true },
  { label: "Survivor Income program", free: false, warrior: true },
  { label: "Monthly bonus challenges", free: false, warrior: true },
  { label: "Priority community visibility", free: false, warrior: true },
];

// ─── What Warrior gets you ──────────────────────────────────────────────────
const WHAT_YOU_GET = [
  {
    icon: Target,
    title: "66-Day Challenge",
     desc: "A structured daily practice with missions, phase tracking, and room to adapt from Survival to Optimization at your own pace.",
  },
  {
    icon: MessageCircle,
    title: "Sasquatch Coach (Unlimited)",
     desc: "Nick's AI accountability coach for reflection, questions, and a manageable next step — with clear reminders that it is not clinical care.",
  },
  {
    icon: Sun,
    title: "Daily Routine System",
    desc: "5 intensity levels (Survival → Full Power). Four time blocks per day. Auto-saving checkboxes, streak tracking, and a Bad Day Protocol built in.",
  },
  {
    icon: Activity,
    title: "Protocol Library (20+)",
     desc: "Lived-recovery tools for upper extremity, gait, cognitive, and speech practice — built from therapist lessons, research, experimentation, and years of personal application.",
  },
  {
    icon: Users,
    title: "Survivor Community",
    desc: "A community that actually gets it. Post updates, ask questions, celebrate wins, and get support from people who survived what you survived.",
  },
  {
    icon: BookOpen,
    title: "Recovery University",
    desc: "Full course access covering Physical, Cognitive, Speech, and Emotional recovery modules with certificates — learn at your own pace.",
  },
  {
    icon: Brain,
    title: "Daily Accountability",
    desc: "Habit tracking, daily check-ins, and a 66-day visual tracker that keeps you honest. The system knows when you've gone quiet.",
  },
  {
    icon: Mic,
    title: "My Book — Write Your Story",
    desc: "An AI-powered memoir tool so survivors can write their story. Nick wrote his. Yours deserves to be written too.",
  },
];

// ─── Who this is for ────────────────────────────────────────────────────────
const WHO_ITS_FOR = [
  {
    icon: HeartPulse,
    title: "Stroke Survivors",
    subtitle: "Any stage. Any severity.",
    points: [
      "Acute (first 90 days) — building early habits and avoiding the plateau",
      "Rehabilitation (3–18 months) — structured daily missions to regain function",
      "Chronic (1+ years) — breaking stagnation, reigniting the neuroplasticity window",
      "Any affected side, any stroke type: ischemic, hemorrhagic, or TIA",
    ],
  },
  {
    icon: Heart,
    title: "Caregivers & Family",
    subtitle: "The people beside survivors need support too.",
    points: [
      "Accountability tools your loved one will actually use",
      "Community of other caregivers who understand the emotional weight",
      "Resources that explain what's happening inside the recovering brain",
      "The Sasquatch Coach says what you can't always say yourself",
    ],
  },
  {
    icon: Stethoscope,
    title: "Healthcare Professionals",
    subtitle: "Tools your patients can use between sessions.",
    points: [
      "Daily Routine System adapts to any clinical discharge level",
      "Exercise library with progression markers for home programs",
      "Community accountability fills the gap between OT/PT appointments",
      "Therapist- and research-informed lived-recovery framework",
    ],
  },
];

// ─── Nick's Promise ──────────────────────────────────────────────────────────

// ─── 30-Day Timeline ────────────────────────────────────────────────────────
const TIMELINE = [
  {
    day: "Day 1–7",
    phase: "Free Trial",
    color: "#555",
    items: [
      "Set up your Daily Routine level (pick wherever you are today)",
      "Complete your first Sasquatch Coach conversation",
      "Join the Survivor Community — post your intro",
      "Read about the 66-Day Challenge phases",
    ],
  },
  {
    day: "Day 8–22",
    phase: "Phase 1 — Survival",
    color: "#7a6535",
    items: [
      "Daily missions activate in the 66-Day Challenge",
      "Habit tracker begins building your streak",
      "First Recovery University module: understanding neuroplasticity",
      "Weekly Sasquatch Coach check-ins (it will notice if you disappear)",
    ],
  },
  {
    day: "Day 23–44",
    phase: "Phase 2 — Breakthrough",
    color: "#b07c12",
    items: [
      "Upgrade your Daily Routine level as capacity increases",
      "Speech and cognitive protocol activation",
      "Live group session with Nick — your first one",
      "Accountability pod: join or start a group of 3–5 survivors",
    ],
  },
  {
    day: "Day 45–66",
    phase: "Phase 3 — Optimization",
    color: "#E2741B",
    items: [
      "Advanced protocols and full exercise library access",
      "Start writing your recovery story in My Book",
      "Apply for the Survivor Income program",
      "Earn your 66-Day Challenge completion certificate",
    ],
  },
];

// ─── Testimonials ────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "David R.",
    detail: "Left-side stroke, 14 months post",
    quote: "I was in a dark place 8 months out. The 66-Day Challenge gave me structure when nothing else did. First time I felt like I was actually doing something.",
    avatar: "DR",
  },
  {
    name: "Linda K.",
    detail: "Caregiver, husband 2.5 years post-stroke",
    quote: "My husband finally found something that keeps him accountable. The Sasquatch Coach is the only thing he listens to — it tells him the truth without sugarcoating.",
    avatar: "LK",
  },
  {
    name: "Marcus T.",
    detail: "Hemorrhagic stroke, 3 years post",
    quote: "I tried four other programs. This one stuck because Nick actually survived a stroke. He's not guessing. He knows the darkness and he knows the way out.",
    avatar: "MT",
  },
  {
    name: "Teresa M.",
    detail: "Caregiver and spouse, 18 months post",
    quote: "The Daily Routine system is the first thing my husband has used consistently. He sets his level every morning. That alone changed the household.",
    avatar: "TM",
  },
  {
    name: "James B.",
    detail: "Ischemic stroke, 7 months post",
    quote: "The community doesn't give you sympathy. They give you accountability. There's a difference. This is the second kind.",
    avatar: "JB",
  },
  {
    name: "Angela C.",
    detail: "Occupational Therapist, recommends to patients",
    quote: "My patients use this between sessions. The Daily Routine system bridges the gap in a way I couldn't on my own. Nick built what we needed.",
    avatar: "AC",
  },
];

// ─── FAQs ────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "What exactly is the 7-day free trial?",
    a: "Full Warrior access — every feature, every protocol, the complete 66-Day Challenge, unlimited Sasquatch Coach, and the Daily Routine System — for 7 days. No charge. You enter your card to hold your spot, but nothing is billed until day 8. Cancel any time before then and you pay nothing.",
  },
  {
    q: "What's the difference between monthly and annual?",
    a: "Warrior Monthly is $47/month billed each month. Warrior Annual is $397/year billed once — that's $33/month, saving you $167 over the year. Both include the 7-day free trial and identical features.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your dashboard settings at any time. Monthly plans stop at the end of the current billing period. Annual plans are non-refundable after 14 days, but you keep full access for the entire year you paid for.",
  },
  {
    q: "Is this just for stroke survivors, or caregivers too?",
    a: "Both. Caregivers use the community, accountability tools, and resource library constantly. Nick built this for survivors first — but the people standing beside survivors need support just as much. The platform recognizes this.",
  },
  {
    q: "What is the Daily Routine System?",
    a: "A 5-level daily structure from Level 0 (Survival Mode — breathing and gratitude when you have nothing left) to Level 4 (Full Power — workout, cognitive challenge, mentor someone). Each level has four time blocks: Morning, Midday Movement, Evening Reflection, and Wind-Down. It auto-saves your progress and tracks your streak. There's also a Bad Day Protocol: one tap drops you to Level 0 and reminds you Never Zero.",
  },
  {
    q: "What's the Sasquatch Coach, really?",
    a: "An AI accountability coach trained on Nick's voice, philosophy, and actual recovery story. Powered by Google Gemini AI and delivered in Nick's own raspy voice via ElevenLabs. It won't coddle you. It will push you, remind you, and call you out — because that's what Nick does. That's the point.",
  },
  {
    q: "What if I can't afford the membership?",
    a: "Apply for a Stroke Lyfe Inc. scholarship on our Gift a Survivor page. The nonprofit exists specifically so cost is never the reason someone misses their recovery window. Community donations fund every scholarship.",
  },
  {
    q: "How is this different from YouTube videos or Facebook groups?",
    a: "Structure and accountability. YouTube gives you information. This gives you a daily system, missions, a coach who notices when you disappear, and a community that expects you to show up. Information alone doesn't rebuild brains. Consistent repetition does.",
  },
  {
    q: "What's the 66-Day Challenge?",
    a: "A structured 66-day recovery program broken into three phases: Survival (Days 1–22), Breakthrough (Days 23–44), and Optimization (Days 45–66). Each day has a specific mission. The science: it takes approximately 66 days to build an automatic habit. Nick chose 66 intentionally. Do the 66 days and you have a new brain pattern.",
  },
  {
    q: "Do I need any special equipment?",
    a: "No. The Daily Routine System and exercises are built for wherever you are — bed, chair, standing with support, or fully mobile. Level 0 requires nothing but your lungs and a glass of water.",
  },
];

// ─── Cell helper ─────────────────────────────────────────────────────────────
function FeatureCell({ val }: { val: boolean | string }) {
  if (val === true) return <Check className="w-4 h-4 text-[#E2741B] mx-auto" />;
  if (val === false) return <Minus className="w-4 h-4 text-gray-700 mx-auto" />;
  return <span className="text-xs text-[#E2741B] font-semibold">{val}</span>;
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function RecoveryPricing() {
  const { isAuthenticated } = useAuth();
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
  const isPending = subscriptionMutation.isPending;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="Warrior Membership Pricing — Stroke Recovery Academy"
        description="Join the Stroke Recovery Academy. 7-day free trial. $47/month or $397/year. Daily accountability, the 66-Day Challenge, unlimited Sasquatch AI Coach, Daily Routine System, 20+ protocols, Recovery University, and a community that gets it."
        canonical="/recovery/pricing"
        keywords={[
          "stroke recovery membership", "stroke recovery program pricing",
          "warrior membership stroke", "stroke recovery accountability",
          "66 day stroke challenge", "sasquatch coach stroke",
          "stroke recovery subscription", "stroke recovery free trial",
          "Nick Kremers stroke program", "daily routine stroke recovery",
        ]}
        breadcrumbs={[{ name: "Pricing", url: "/recovery/pricing" }]}
      />
      <RecoveryHeader />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#E2741B]/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#E2741B]/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/30 text-sm px-4 py-1.5">
            <Flame className="w-3.5 h-3.5 mr-1.5" />
            7-Day Free Trial — No Charge Until Day 8
          </Badge>

          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Stop Guessing.<br />
            <span className="text-[#E2741B]">Start Rebuilding.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Nick Kremers survived a December 2018 hemorrhagic stroke. Left side gone. 325 lbs in a wheelchair. 50 staples in his skull. He built the system he wishes had existed when he was on that Hoyer lift.
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400 mb-10">
            {[
              { icon: Shield, label: "7-day free trial" },
              { icon: Clock, label: "Cancel anytime" },
              { icon: Heart, label: "Scholarships available" },
              { icon: Star, label: "Built from lived expertise" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#E2741B]" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="bg-[#E2741B] text-black font-black text-lg px-10 gap-2"
            onClick={handleWarrior}
            disabled={isPending}
            data-testid="button-hero-trial-cta"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flame className="w-5 h-5" />}
            Start Your Free 7 Days
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            Enter your card to hold your spot. Nothing is charged until day 8. Cancel before then — pay nothing.
          </p>
        </div>
      </section>

      {/* ── BILLING TOGGLE + CARDS ────────────────────────────────────────── */}
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
              <Badge className="bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/30 font-bold">
                <Gift className="w-3 h-3 mr-1" />
                Save {annualSavings}%
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FREE */}
            <Card className="bg-[#111] border border-[#2a2a2a] flex flex-col" data-testid="card-tier-free">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1e1e1e] flex items-center justify-center">
                    <Zap className="w-5 h-5 text-gray-500" />
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
                  Start here. Join the community, explore resources, and see what recovery looks like with structure.
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <Separator className="mb-4 bg-[#2a2a2a]" />
                <ul className="space-y-2.5">
                  {[
                    { text: "Survivor Community access", yes: true },
                    { text: "Recovery blog & articles", yes: true },
                    { text: "Recovery Center Finder", yes: true },
                    { text: "Sasquatch Coach (3 messages/day)", yes: true },
                    { text: "66-Day Challenge (read-only)", yes: true },
                    { text: "Brain Gym (3 sessions/day)", yes: true },
                    { text: "Daily Routine System", yes: false },
                    { text: "Full protocol library (20+ programs)", yes: false },
                    { text: "Recovery University courses", yes: false },
                    { text: "Daily accountability check-ins", yes: false },
                    { text: "Habit tracking dashboard", yes: false },
                    { text: "Live group sessions", yes: false },
                    { text: "My Book memoir writing tool", yes: false },
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" data-testid={`feature-free-${i}`}>
                      {f.yes ? (
                        <Check className="w-4 h-4 text-[#E2741B] mt-0.5 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-700 mt-0.5 shrink-0" />
                      )}
                      <span className={f.yes ? "text-gray-300" : "text-gray-600"}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-[#2a2a2a] text-white"
                  onClick={() => window.location.href = isAuthenticated ? "/recovery/community" : "/api/login"}
                  data-testid="button-select-free"
                >
                  Join Free
                </Button>
              </CardFooter>
            </Card>

            {/* WARRIOR */}
            <Card
              className="bg-[#111] border-2 border-[#E2741B] ring-2 ring-[#E2741B]/20 flex flex-col relative"
              data-testid="card-tier-warrior"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#E2741B] text-black font-black px-4 py-1" data-testid="badge-warrior-popular">
                  <Crown className="w-3 h-3 mr-1" />
                  MOST POPULAR
                </Badge>
              </div>

              <CardHeader className="pb-4 pt-7">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E2741B]/15 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-[#E2741B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#E2741B] uppercase tracking-wider font-bold">Full Access</p>
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
                    <p className="text-sm text-[#E2741B] font-bold mt-1">
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

                <div className="mt-3 px-3 py-2 rounded-lg bg-[#E2741B]/10 border border-[#E2741B]/20">
                  <p className="text-sm text-[#E2741B] font-semibold text-center">
                    <Flame className="w-3.5 h-3.5 inline mr-1" />
                    7-day free trial — charged {isAnnual ? "$397" : "$47"} on day 8
                  </p>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <Separator className="mb-4 bg-[#E2741B]/20" />
                <ul className="space-y-2.5">
                  {[
                    "Everything in Free — no exceptions",
                    "Daily Routine System (all 5 levels)",
                    "66-Day Challenge with daily missions",
                    "Unlimited Sasquatch Coach access",
                    "Full protocol library (20+ programs)",
                    "Daily accountability check-ins",
                    "Habit tracking & 66-day streak tracker",
                    "Recovery University (all courses + certs)",
                    "Brain Gym (unlimited sessions)",
                    "Live group sessions with Nick",
                    "My Book memoir writing tool",
                    "Survivor Income program access",
                    "Priority community feed visibility",
                    "Monthly bonus challenges",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" data-testid={`feature-warrior-${i}`}>
                      <Check className="w-4 h-4 text-[#E2741B] mt-0.5 shrink-0" />
                      <span className="text-gray-200">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  size="lg"
                  className="w-full bg-[#E2741B] text-black font-black gap-2"
                  onClick={handleWarrior}
                  disabled={isPending}
                  data-testid="button-select-warrior"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                  Start Free Trial
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Scholarship strip */}
          <div className="mt-8 p-5 rounded-xl bg-[#111] border border-[#2a2a2a] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-[#E2741B] shrink-0" />
              <div>
                <p className="text-white font-semibold">Can't afford the membership?</p>
                <p className="text-sm text-gray-400">
                  Stroke Lyfe Inc. (501(c)(3)) offers scholarships funded entirely by community donations. Cost is never the reason someone misses their recovery window.
                </p>
              </div>
            </div>
            <Link href="/recovery/gift">
              <Button variant="outline" className="border-[#E2741B]/40 text-[#E2741B] shrink-0" data-testid="button-scholarship-link">
                Apply for a Scholarship
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-3 text-white">
            Free vs. <span className="text-[#E2741B]">Warrior</span>
          </h2>
          <p className="text-center text-gray-500 mb-10 text-sm">Every feature, side by side.</p>

          <div className="rounded-xl overflow-hidden border border-[#1e1e1e]">
            {/* Header row */}
            <div className="grid grid-cols-3 bg-[#111] border-b border-[#1e1e1e] text-xs font-bold uppercase tracking-wider">
              <div className="p-4 text-gray-500">Feature</div>
              <div className="p-4 text-center text-gray-500">Free</div>
              <div className="p-4 text-center text-[#E2741B]">Warrior</div>
            </div>
            {FEATURE_MATRIX.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 border-b border-[#111] text-sm ${
                  i % 2 === 0 ? "bg-[#0a0a0a]" : "bg-[#0d0d0d]"
                }`}
                data-testid={`comparison-row-${i}`}
              >
                <div className="p-3.5 text-gray-400">{row.label}</div>
                <div className="p-3.5 flex items-center justify-center">
                  <FeatureCell val={row.free} />
                </div>
                <div className="p-3.5 flex items-center justify-center">
                  <FeatureCell val={row.warrior} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ──────────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-3 text-white">
            What Warrior <span className="text-[#E2741B]">Actually Gets You</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-xl mx-auto">
             Not theory alone. A system built by someone who learned from professionals,
             absorbed the research, applied it in his own body, and documented what happened.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHAT_YOU_GET.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="p-5 rounded-xl bg-[#111] border border-[#1e1e1e]" data-testid={`card-feature-${i}`}>
                <div className="w-10 h-10 rounded-lg bg-[#E2741B]/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#E2741B]" />
                </div>
                <h3 className="text-white font-bold mb-1 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO THIS IS FOR ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-[#1a1a1a] bg-[#080808]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-3 text-white">
            Who This Is <span className="text-[#E2741B]">Built For</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-xl mx-auto">
            Any stage. Any severity. Any role in the recovery journey.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHO_ITS_FOR.map(({ icon: Icon, title, subtitle, points }, i) => (
              <div key={i} className="p-6 rounded-xl bg-[#0f0f0f] border border-[#1e1e1e]">
                <div className="w-11 h-11 rounded-lg bg-[#E2741B]/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#E2741B]" />
                </div>
                <h3 className="text-white font-black text-lg mb-1">{title}</h3>
                <p className="text-xs text-[#E2741B] font-semibold mb-4 uppercase tracking-wider">{subtitle}</p>
                <ul className="space-y-2.5">
                  {points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle className="w-3.5 h-3.5 text-[#E2741B]/60 mt-0.5 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FIRST 30/66 DAYS TIMELINE ─────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-3 text-white">
            Your First <span className="text-[#E2741B]">66 Days</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-xl mx-auto">
            What happens when you start. Phase by phase — from survival to optimization.
          </p>

          <div className="space-y-6">
            {TIMELINE.map((phase, i) => (
              <div key={i} className="flex gap-5" data-testid={`timeline-phase-${i}`}>
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs"
                    style={{ backgroundColor: `${phase.color}20`, border: `2px solid ${phase.color}` }}
                  >
                    <span style={{ color: phase.color }}>{i + 1}</span>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className="w-px flex-1 mt-2" style={{ backgroundColor: `${phase.color}30` }} />
                  )}
                </div>
                <div className="pb-6 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: phase.color }}>
                      {phase.day}
                    </span>
                    <span className="text-white font-black">{phase.phase}</span>
                    {i === 0 && (
                      <Badge className="text-xs" style={{ backgroundColor: `${phase.color}20`, color: phase.color }}>
                        Free Trial
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {phase.items.map((item, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm text-gray-400">
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: phase.color }} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NICK'S PROMISE ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-[#1a1a1a] bg-[#080808]">
        <div className="max-w-3xl mx-auto">
          <div className="p-8 rounded-2xl bg-[#0f0f0f] border border-[#E2741B]/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#E2741B]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#E2741B]" />
              </div>
              <div>
                <p className="text-[#E2741B] font-bold text-sm uppercase tracking-wider">Nick's Personal Promise</p>
                <p className="text-gray-500 text-xs">Lavaca, Arkansas — Year 7 post-stroke</p>
              </div>
            </div>
            <blockquote className="text-gray-200 text-lg leading-relaxed mb-6 italic">
              "I was 325 lbs in a wheelchair. Left side gone. Fifty staples in my skull. Doctors didn't make promises.
              <br /><br />
              Seven years later I'm at 90%+ and still climbing. I didn't have a platform like this. I had stubbornness and a son who was born in April 2019 while I watched from a wheelchair. I promised him I'd play catch with both arms.
              <br /><br />
              That's why I built this. So you don't have to figure it out alone. Use the 7 days. Get in the 66-Day Challenge. Let the Sasquatch Coach push you. If it's not the right fit, you pay nothing.
              <br /><br />
              That 10% I haven't gotten back yet? I know its name. I'm coming for it. Come with me."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#E2741B]/20 flex items-center justify-center text-[#E2741B] font-black text-sm shrink-0">
                NK
              </div>
              <div>
                <p className="text-white font-bold text-sm">Nick Kremers</p>
                <p className="text-gray-500 text-xs">Founder, Stroke Recovery Academy — Hemorrhagic stroke survivor, December 3, 2018</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10 text-white">
            From Warriors Who <span className="text-[#E2741B]">Actually Did It</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="bg-[#111] border border-[#1e1e1e]" data-testid={`card-testimonial-${i}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-0.5 mb-4">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 text-[#E2741B] fill-[#E2741B]" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm italic mb-5 leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E2741B]/20 flex items-center justify-center text-[#E2741B] font-bold text-xs shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t.name}</p>
                      <p className="text-gray-600 text-xs">{t.detail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-[#1a1a1a] bg-[#080808]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10 text-white">
            Frequently Asked <span className="text-[#E2741B]">Questions</span>
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg px-4"
                data-testid={`faq-item-${i}`}
              >
                <AccordionTrigger className="text-white hover:text-[#E2741B] text-left py-4 text-sm font-semibold">
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

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-[#1a1a1a] bg-gradient-to-b from-[#0D0D0D] to-[#0a0a0a]">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-6 bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/30">
            <Flame className="w-3.5 h-3.5 mr-1.5" />
            7 days free. Start gently and pause whenever you need to.
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            You already survived<br /> the hardest part.
            <br /><span className="text-[#E2741B]">Now rebuild.</span>
          </h2>
          <p className="text-gray-400 mb-10 text-lg max-w-xl mx-auto leading-relaxed">
            Start the 7-day free trial. Set your Daily Routine level. Enter the 66-Day Challenge.
            Let the Sasquatch Coach push you. Cancel before day 8, or start the fight for real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              className="bg-[#E2741B] text-black font-black text-lg px-10 gap-2"
              onClick={handleWarrior}
              disabled={isPending}
              data-testid="button-final-cta"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flame className="w-5 h-5" />}
              Start Free — {isAnnual ? "$397/yr" : "$47/mo"} after 7 days
            </Button>
            <Link href="/recovery/routine">
              <Button
                size="lg"
                variant="outline"
                className="border-[#2a2a2a] text-white gap-2"
                data-testid="button-see-routine"
              >
                <Sun className="w-4 h-4" />
                See the Daily Routine
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#E2741B]/50" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#E2741B]/50" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-[#E2741B]/50" />
              <span>Scholarships via Stroke Lyfe Inc.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#E2741B]/50" />
              <span>66-Day Challenge included</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
