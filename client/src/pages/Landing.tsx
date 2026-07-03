import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import {
  Loader2, ArrowRight, Play, BrainCircuit, CalendarDays,
  Users, CheckCircle2, ShieldCheck, Activity, Star, Flame, Gift, BookOpen, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO, {
  NICK_KREMERS_SCHEMA,
  STROKE_RECOVERY_ORG_SCHEMA,
  SASQUATCH_METHOD_SCHEMA,
  STROKE_CONDITION_SCHEMA,
} from "@/components/RecoverySEO";
import Footer from "@/components/Footer";
import heroWarrior from "@assets/hero-warrior-training.png";
import nickPortrait from "@assets/Untitled_design_1781030529179.png";
import manifestoStairs from "@assets/manifesto-stairs.png";
import cleanUi from "@assets/home-clean-ui.png";

const goToOnboarding = () => {
  window.location.href = "/recovery/onboarding";
};

function Hero() {
  return (
    <section className="relative bg-black overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroWarrior} alt="" aria-hidden="true" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-10">
            <span className="flex h-2 w-2 rounded-full bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">By Nick Kremers — 7-year survivor</span>
          </div>
          <h1 className="font-display leading-[0.9] mb-6">
            <span className="block text-white text-6xl md:text-7xl lg:text-8xl">Nobody was watching</span>
            <span className="block text-white/35 text-6xl md:text-7xl lg:text-8xl">the days in between.</span>
          </h1>
          <p className="font-display text-gold text-4xl md:text-5xl mb-10">We are.</p>
          <p className="hero-description text-xl text-white/65 mb-6 leading-relaxed max-w-2xl">
            December 3, 2018 — Hoyer lift. 50 staples. Complete paralysis on one side. The hospital stabilized him and sent him home. Six weeks later, a follow-up appointment. Nobody checked on the days in between — whether he did his exercises, cried at 2 a.m., or almost quit.
          </p>
          <p className="text-lg text-white/45 mb-10 leading-relaxed max-w-2xl">
            That gap is where survivors fall off. Not because they gave up — because nobody was there. We built the thing that fills it: daily reps, a coach who notices when you go quiet, and a squad that keeps showing up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={goToOnboarding}
              className="bg-gold text-black h-14 px-8 text-base rounded-md w-full sm:w-auto font-semibold"
              data-testid="button-build-plan-hero"
            >
              Build my recovery plan <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base rounded-md w-full sm:w-auto border-white/20 bg-white/5 text-white backdrop-blur"
              data-testid="button-talk-to-coach-hero"
            >
              <Link href="/recovery/sasquatch-coach">
                Talk to Coach — free
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/40">No signup to try — 3 free messages with Coach, then $19/mo.</p>
          <div className="mt-12 flex items-center gap-4 text-sm text-white/50 font-medium">
            <div className="flex -space-x-2" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-white/20" />)}
            </div>
            <p>50,000+ survivors rebuilding their lives</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  const stats = [
    { n: "50,000+", l: "Survivors" },
    { n: "0% → 90%", l: "Function restored" },
    { n: "365", l: "Days of reps" },
    { n: "7", l: "Years of proof" },
  ];
  return (
    <section className="bg-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center px-4">
              <div className="font-display text-black text-4xl md:text-5xl mb-1">{s.n}</div>
              <div className="text-sm font-bold text-black/70 uppercase tracking-wider">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AccountabilityGap() {
  const pillars = [
    { icon: Activity, t: "Daily Reps", d: "Every task tracked. The system knows when you haven't shown up — and so does your squad." },
    { icon: Users, t: "Your Squad", d: "Accountability pods of 3–5 survivors. Day 3 and Day 700, showing up for each other." },
    { icon: BrainCircuit, t: "Sasquatch Coach", d: "An AI coach trained on the Sasquatch Method. It notices when you go quiet and calls you back." },
    { icon: BookOpen, t: "Recovery Journal", d: "Name the wins, name the hard parts. Every entry is a chapter in the story you're writing." },
  ];
  return (
    <section id="method" className="bg-[#FDFBF7] py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20">
        <p className="text-sm font-bold tracking-widest uppercase text-gold-ink mb-5">The Accountability Gap</p>
        <h2 className="font-display text-neutral-900 text-4xl md:text-6xl mb-6 leading-[0.95]">
          The most underserved part of stroke recovery isn't information.
        </h2>
        <p className="font-display text-gold-ink text-3xl md:text-4xl mb-10">It's someone checking on you.</p>
        <div className="space-y-5 text-neutral-600 text-lg leading-relaxed max-w-3xl mx-auto">
          <p>
            You leave the hospital with a stack of papers and a follow-up appointment in six weeks. Nobody is watching the days in between — whether you did your exercises, skipped them, cried at 2 a.m., or decided recovery wasn't worth it.
          </p>
          <p>
            That gap is where the plateau lives. That's where survivors fall off. Not because they gave up — <strong className="text-neutral-900 font-semibold">because nobody was there.</strong>
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pillars.map((c, i) => (
          <div key={i} className="p-7 rounded-2xl bg-white border border-amber-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-5">
              <c.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-neutral-900">{c.t}</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">{c.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section id="proof" className="relative bg-black py-28 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,_rgba(226,116,27,0.5),_transparent_60%)]" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Star className="w-8 h-8 text-gold mb-6" fill="currentColor" />
            <h2 className="font-display text-3xl md:text-5xl mb-6 leading-[0.95]">
              "They said I'd never walk again. I said — watch me."
            </h2>
            <p className="text-white/60 text-lg mb-8 leading-relaxed">
              Nick Kremers had a massive hemorrhagic stroke at 36 that left him paralyzed on his right side. Seven years later — through the exact methods taught in this academy — he's regained 90% of his function. If the Sasquatch can do it, so can you.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold/40">
                <img src={nickPortrait} alt="Nick Kremers" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-lg">Nick Kremers</div>
                <div className="text-white/50">Founder, Stroke Recovery Academy</div>
              </div>
            </div>
          </div>
          <div className="relative aspect-video bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl" aria-hidden="true">
            <img src={manifestoStairs} alt="" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gold/90 flex items-center justify-center">
                <Play className="w-8 h-8 text-black fill-black ml-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="bg-[#F6EFEA] py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-sm font-bold tracking-widest uppercase text-gold-ink mb-4">The Toolkit</p>
          <h2 className="font-display text-neutral-900 text-4xl md:text-5xl">Everything you need to rebuild.</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
          <div className="order-2 md:order-1 rounded-2xl overflow-hidden border border-amber-100 bg-white/70 p-8">
            <img src={cleanUi} alt="AI Coach interface" className="w-full h-auto rounded-xl border border-amber-100/60" />
          </div>
          <div className="order-1 md:order-2">
            <div className="w-12 h-12 rounded-lg bg-gold/10 text-gold flex items-center justify-center mb-6"><BrainCircuit className="w-6 h-6" /></div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">AI Recovery Coach</h3>
            <p className="text-neutral-600 text-lg leading-relaxed mb-6">
              A personalized companion trained on the Sasquatch Method. It builds your daily protocols, adjusts to how you're doing, and keeps you on track — encouraging, never preachy. Try it free — no signup for your first messages, unlimited on Premium.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gold text-black h-12 px-7 rounded-md font-semibold"
              data-testid="button-try-coach-features"
            >
              <Link href="/recovery/sasquatch-coach">Try the Coach — free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="w-12 h-12 rounded-lg bg-neutral-900 text-white flex items-center justify-center mb-6"><CalendarDays className="w-6 h-6" /></div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">Daily Routines & Protocols</h3>
            <p className="text-neutral-600 text-lg leading-relaxed">
              Stop guessing what to do. Get structured daily regimens that target neuroplasticity — from mirror therapy to mental rehearsal — scaled to your level and delivered when you need them.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-amber-100 bg-white/70 p-8">
            <div className="bg-white rounded-xl border border-amber-100/60 p-6 space-y-3">
              {[
                { icon: Users, t: "Accountability Pod", s: "Your squad of 5" },
                { icon: Activity, t: "Daily Reps Log", s: "Streak: 412 days" },
                { icon: ShieldCheck, t: "Caregiver View", s: "Shared progress" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-4 border rounded-lg border-neutral-100 bg-neutral-50">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded bg-gold/10 text-gold flex items-center justify-center"><row.icon className="w-5 h-5" /></div>
                    <div>
                      <div className="font-semibold text-sm text-neutral-900">{row.t}</div>
                      <div className="text-xs text-neutral-500">{row.s}</div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Write Your Recovery Story */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center mt-24">
          <div className="order-2 md:order-1 rounded-2xl border border-amber-100 bg-white/70 p-8">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
              {[
                { label: "Day 1 — first step on the left side", chapter: true },
                { label: "Week 3 — full sentence in PT", chapter: true },
                { label: "Month 2 — back behind the wheel", chapter: false },
                { label: "Year 1 — told the story in public", chapter: true },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex gap-3 items-center">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${row.chapter ? "bg-gold" : "bg-neutral-300"}`} />
                    <span className={`text-sm ${row.chapter ? "text-neutral-900 font-medium" : "text-neutral-400"}`}>{row.label}</span>
                  </div>
                  {row.chapter && <span className="text-xs font-semibold text-gold uppercase tracking-wider">Chapter</span>}
                </div>
              ))}
              <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs text-neutral-400">Everything else stays between you and the Squatch</span>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="w-12 h-12 rounded-lg bg-neutral-900 text-white flex items-center justify-center mb-6"><BookOpen className="w-6 h-6" /></div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">Write Your Recovery Story</h3>
            <p className="text-neutral-600 text-lg leading-relaxed mb-6">
              Every check-in. Every journal entry. Every breakthrough you tell the Coach. It's all material — and it's all yours. Mark the moments that matter, and when you're ready, compile them into a real book. Digital or print. In your voice. About your life.
            </p>
            <p className="text-sm font-semibold text-neutral-500 mb-6 italic">
              Everything else is between you and the Squatch.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gold text-black h-12 px-7 rounded-md font-semibold"
              data-testid="button-write-story-features"
            >
              <Link href="/recovery/my-story">See your story <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Caregiver() {
  return (
    <section className="bg-gold py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-black">
        <p className="text-sm font-bold tracking-[0.3em] uppercase mb-5">For Caregivers</p>
        <h2 className="font-display text-4xl md:text-6xl mb-6 leading-[0.95]">You're not the patient — but you carry it too.</h2>
        <p className="text-lg font-medium opacity-80 mb-10 max-w-2xl mx-auto leading-relaxed">
          You're the one Googling at 2 a.m., scheduling the appointments, quietly holding it together. Nobody built a system that took your seat seriously — until now. Let us handle the daily reminders. You just have to keep standing.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-black text-white h-14 px-8 text-base rounded-md font-semibold"
          data-testid="button-caregiver-kit"
        >
          <a href="/for/caregivers">Open the caregiver kit <ArrowRight className="ml-2 h-5 w-5" /></a>
        </Button>
      </div>
    </section>
  );
}

function Guides() {
  const guides = [
    { t: "How long does rehab take?", d: "The real timeline — not the one the hospital gave you." },
    { t: "Can you fully recover?", d: "What the research says, and what seven years actually looks like." },
    { t: "Neuroplasticity explained", d: "How your brain rewires itself — the science behind every rep." },
  ];
  return (
    <section id="guides" className="bg-[#FAF9F6] py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-widest uppercase text-gold-ink mb-4">Latest Guides</p>
            <h2 className="font-display text-neutral-900 text-3xl md:text-5xl mb-3">The questions every survivor asks.</h2>
            <p className="text-lg text-neutral-600">Honest, in-the-trenches answers. No fluff, no fake hope.</p>
          </div>
          <Link href="/recovery/blog" className="text-neutral-900 font-semibold inline-flex items-center hover:text-gold transition-colors shrink-0" data-testid="link-all-guides">
            See all guides <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {guides.map((g, i) => (
            <Link key={i} href="/recovery/blog" className="group block border border-neutral-200 rounded-xl p-7 hover:shadow-lg transition-all hover:border-neutral-300 bg-white" data-testid={`link-guide-${i}`}>
              <div className="w-10 h-10 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-6 group-hover:bg-gold group-hover:text-black group-hover:border-gold transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-gold transition-colors">{g.t}</h3>
              <p className="text-neutral-600 leading-relaxed">{g.d}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function GiftASurvivor() {
  return (
    <section className="bg-black py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 mb-6">
          <Gift className="w-4 h-4 text-gold" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gold">Pay it forward</span>
        </div>
        <h2 className="font-display text-white text-4xl md:text-6xl mb-6 leading-[0.95]">Gift a survivor their comeback.</h2>
        <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
          Recovery shouldn't hinge on what someone can afford. Sponsor a survivor who's rebuilding — the plan, the Coach, the squad — and cover the cost when they can't. Your gift shows up as a full membership.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-gold text-black h-14 px-8 text-base rounded-md font-semibold"
          data-testid="button-gift-survivor-landing"
        >
          <Link href="/recovery/gift">Gift a Survivor <ArrowRight className="ml-2 h-5 w-5" /></Link>
        </Button>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative bg-black py-32 text-center overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_rgba(226,116,27,0.5),_transparent_60%)]" />
      <div className="relative z-10 max-w-3xl mx-auto px-4">
        <h2 className="font-display text-white text-5xl md:text-7xl mb-8 leading-[0.9]">
          The hospital did its job.<br />
          <span className="text-gold">Now it's your turn.</span>
        </h2>
        <p className="text-xl text-white/60 mb-12">
          We'll be there for every rep of it — daily reps, your squad of five, and Coach in your corner. $19/mo, 7 days free. Cancel anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={goToOnboarding}
            className="bg-gold text-black h-16 px-12 text-lg rounded-md font-semibold w-full sm:w-auto"
            data-testid="button-start-recovery-final"
          >
            Start your recovery
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-16 px-12 text-lg rounded-md w-full sm:w-auto border-white/20 bg-white/5 text-white backdrop-blur"
            data-testid="button-see-premium-final"
          >
            <Link href="/recovery/premium">See Premium</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

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
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
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
        <Hero />
        <StatsStrip />
        <AccountabilityGap />
        <Proof />
        <Features />
        <Caregiver />
        <GiftASurvivor />
        <Guides />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
