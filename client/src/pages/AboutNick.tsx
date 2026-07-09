import { Link } from "wouter";
import { ArrowRight, Check, Quote, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO, { NICK_KREMERS_SCHEMA, SASQUATCH_METHOD_SCHEMA } from "@/components/RecoverySEO";
import nickPortrait from "@assets/nick-portrait-opt.webp";
import heroWarrior from "@assets/hero-warrior-opt.webp";
import manifestoStairs from "@assets/manifesto-stairs-opt.webp";

const goToOnboarding = () => {
  window.location.href = "/recovery/onboarding";
};

/**
 * Real, founder-supplied quotes only. Leave EMPTY until Nick provides real
 * survivor quotes with real attribution. The section below renders nothing
 * while this is empty — never fabricate testimonials, names, or stats.
 */
const FOUNDER_QUOTES: { quote: string; name: string; detail: string }[] = [];

const TIERS = [
  {
    name: "Free",
    price: "$0",
    sub: "forever",
    cta: "Start free",
    href: "/recovery/onboarding",
    highlight: false,
    features: [
      "5 Coach messages / day",
      "Daily reps + journal",
      "66-Day Challenge",
      "3 Recovery Anchors / month",
      "Public Campfire circles",
    ],
  },
  {
    name: "Premium",
    price: "$19",
    sub: "/mo · 7-day free trial",
    cta: "Start free trial",
    href: "/recovery/premium",
    highlight: true,
    badge: "Most popular",
    features: [
      "Unlimited Coach",
      "Unlimited Recovery Anchors",
      "Voice Cloning included",
      "Write Your Recovery Story",
      "Never Zero daily report",
      "Premium Campfire + Live with Nick",
    ],
  },
  {
    name: "Founder",
    price: "$49",
    sub: "/mo · founding member",
    cta: "Join the circle",
    href: "/recovery/premium",
    highlight: false,
    badge: "Founder's Circle",
    features: [
      "Everything in Premium, uncapped",
      "Direct line to Nick",
      "Vote on the roadmap",
      "Founding-member recognition",
    ],
  },
];

const beliefs = [
  "Every survivor can make progress, no matter how small it seems",
  "Community and support make the journey less lonely",
  "Tracking your progress helps you see the wins you might miss",
  "Your story matters and deserves to be told",
];

export default function AboutNick() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <RecoverySEO
        title="Nick Kremers — 0% to 90%+ Recovery | Stroke Recovery Academy"
        description="December 3, 2018: a massive hemorrhagic stroke left Nick Kremers paralyzed on one side, unable to speak, lifted by a Hoyer lift. Seven years later he's 90%+ functional and still rising. This is his real recovery arc — and the system he built so no survivor faces the days in between alone."
        canonical="/recovery/about-nick"
        pageType="article"
        author="Nick Kremers"
        publishedTime="2023-01-01T00:00:00Z"
        modifiedTime={new Date().toISOString()}
        keywords={[
          "Nick Kremers stroke survivor", "Stroked Out Sasquatch", "Stroke Recovery Academy founder",
          "stroke recovery author", "Sasquatch Method stroke", "stroke recovery coach",
          "stroke 0 to 90 recovery", "stroke survivor success story", "Nick Kremers books",
          "stroke recovery methodology", "C.O.M.P.A.S.S. recovery system",
        ]}
        speakableSelectors={["h1", ".nick-story"]}
        breadcrumbs={[{ name: "Recovery Hub", url: "/recovery" }, { name: "About Nick", url: "/recovery/about-nick" }]}
        additionalSchema={[
          { "@context": "https://schema.org", ...NICK_KREMERS_SCHEMA },
          { "@context": "https://schema.org", ...SASQUATCH_METHOD_SCHEMA },
        ]}
        faq={[
          { question: "Who is Nick Kremers?", answer: "Nick Kremers is a stroke survivor who suffered a massive hemorrhagic stroke on December 3, 2018, and went from 0% to 90%+ functional recovery through relentless rehabilitation. He is the founder of Stroke Recovery Academy, author of 'The Stroked Out Sasquatch' and 'The Ultimate Stroke Recovery Revolution,' and the creator of the Sasquatch Method — a battle-tested recovery system used by survivors worldwide." },
          { question: "How did Nick Kremers recover from his stroke?", answer: "Nick Kremers recovered using his three integrated recovery systems: the S.A.S.C.H. Formula (Seize, Absorb, Swing, Combine, Hammer) as his daily operating system; the S.O.S. daily reset (Survive, Organize, Strive); and the C.O.M.P.A.S.S. seven-pillar navigation system (Control, Own, Mutate, Patience, Anger, Small Wins, Stack). Combined with neuroplasticity-based protocols — mirror therapy, baseball bat therapy, drop foot progressions — and the 'Never Zero' consistency commitment, he went from 0% to 90%+ functional ability." },
          { question: "What is the Sasquatch Method for stroke recovery?", answer: "The Sasquatch Method is Nick Kremers' battle-tested 66-day stroke recovery system built on three core acronym systems. Daily formula: S.A.S.C.H. — Seize, Absorb, Swing, Combine, Hammer. Quick daily reset: S.O.S. — Survive, Organize, Strive. Advanced navigation: C.O.M.P.A.S.S. — Control, Own, Mutate, Patience, Anger, Small Wins, Stack. The three phases are Survival (Days 1-22), Breakthrough (Days 23-44), and Optimization (Days 45-66)." },
          { question: "What books has Nick Kremers written about stroke recovery?", answer: "Nick Kremers has written two stroke recovery books: (1) 'The Stroked Out Sasquatch' — his raw autobiography from catastrophic stroke to 90%+ recovery; (2) 'The Ultimate Stroke Recovery Revolution: From 0% to 90%+ and Still Rising' — covering the S.A.S.C.H. Formula, the S.O.S. daily reset, the C.O.M.P.A.S.S. navigation system, neuroplasticity, mirror therapy, baseball bat therapy, drop foot protocols, and the complete Sasquatch Doctrine." },
        ]}
      />
      <RecoveryHeader />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1A1412]">
        <div className="absolute inset-0">
          <img src={heroWarrior} alt="" aria-hidden="true" decoding="async" className="w-full h-full object-cover opacity-40" style={{ objectPosition: "65% 22%" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1412] via-[#1A1412]/85 to-[#1A1412]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1412] via-transparent to-[#1A1412]/60" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDFBF7]/8 border border-[#E2C2A4]/30 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FDFBF7]/80">The founder's story — Nick Kremers</span>
          </div>
          <h1 className="font-display leading-[0.9] mb-6 max-w-3xl">
            <span className="block text-[#FDFBF7] text-5xl md:text-7xl lg:text-8xl">Zero percent.</span>
            <span className="block text-[#C06B3E] text-5xl md:text-7xl lg:text-8xl italic font-serif">And still rising.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#FDFBF7]/70 mb-10 leading-relaxed max-w-2xl nick-story">
            They lifted me out of bed with a Hoyer lift. One side of my body wouldn't answer. My speech was gone. Fifty pounds vanished in the ICU. The prognosis was a shrug. Seven years later I'm 90%+ functional — not because a clinic fixed me, but because I refused to stop showing up for the days nobody was watching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={goToOnboarding}
              className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-14 px-8 text-base rounded-full w-full sm:w-auto font-semibold shadow-[0_2px_8px_rgba(192,107,62,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(192,107,62,0.2)]"
              data-testid="button-build-plan-about"
            >
              Build my recovery plan <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base rounded-md w-full sm:w-auto border-[#FDFBF7]/20 bg-[#FDFBF7]/8 text-[#FDFBF7] backdrop-blur hover:bg-[#FDFBF7]/15 hover:border-[#FDFBF7]/30 transition-colors"
              data-testid="button-talk-to-coach-about"
            >
              <Link href="/recovery/sasquatch-coach">Talk to Coach — free</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-[#FDFBF7]/50">No signup to try — 3 free messages with Coach, then $19/mo.</p>
        </div>
      </section>

      {/* ── The day ──────────────────────────────────────────────────────── */}
      <section className="bg-[#FDFBF7] py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 nick-story">
          <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-4">December 3, 2018</p>
          <h2 className="font-display text-[#2A2421] text-3xl sm:text-5xl leading-[0.95] mb-6">
            The day the body I built<br />
            <span className="italic font-serif text-[#C06B3E]">stopped answering.</span>
          </h2>
          <div className="space-y-5 text-lg text-[#5C534D] leading-relaxed">
            <p>
              I was 36. A former athlete, benching over 400 pounds, built like a brick wall. A massive hemorrhagic stroke doesn't care what you can lift. Left side paralyzed. Speech gone. Fifty staples in my skull and fifty pounds gone in the ICU on tube feedings.
            </p>
            <p>
              The doctors did their job — they kept me alive. Then they stabilized me and sent me home. Six weeks later, a follow-up appointment. That was the plan. That was the whole plan.
            </p>
          </div>
        </div>
      </section>

      {/* ── The gap ──────────────────────────────────────────────────────── */}
      <section className="bg-[#1A1412] py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="nick-story">
            <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-4">The days in between</p>
            <h2 className="font-display text-[#FDFBF7] text-3xl sm:text-5xl leading-[0.95] mb-6">
              Nobody was watching<br />
              <span className="italic font-serif text-[#C06B3E]">the hard part.</span>
            </h2>
            <div className="space-y-5 text-lg text-[#FDFBF7]/70 leading-relaxed">
              <p>
                Nobody checked whether I did my exercises. Whether I cried at 2 a.m. Whether I almost quit — which I did, more than once. The gap between discharge and that six-week appointment is where recovery actually happens, and it's exactly where survivors are left alone.
              </p>
              <p>
                That gap is where people fall off. Not because they gave up — because nobody was there. I lived in that gap for years. So I built the thing I needed and never had.
              </p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#3A3230]">
            <img src={manifestoStairs} alt="Nick Kremers rebuilding, one step at a time" decoding="async" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* ── The promise ──────────────────────────────────────────────────── */}
      <section className="bg-[#F6EFEA] py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 nick-story">
          <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-4">April 24, 2019</p>
          <h2 className="font-display text-[#2A2421] text-3xl sm:text-5xl leading-[0.95] mb-6">
            My son took his first breath.<br />
            <span className="italic font-serif text-[#C06B3E]">I made him a promise.</span>
          </h2>
          <div className="space-y-5 text-lg text-[#5C534D] leading-relaxed">
            <p>
              Nicholas Jr. arrived while I was still in a wheelchair. I watched my boy come into the world and I made him a promise: I would play catch with him. Both arms. No excuses.
            </p>
            <p>
              Every rep since has had his name on it. That's the thing about recovery — it isn't healing, it's construction. You build with what you still have. And I had a reason to build.
            </p>
          </div>
        </div>
      </section>

      {/* ── The system ───────────────────────────────────────────────────── */}
      <section className="bg-[#1A1412] py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C06B3E]/20 border border-[#C06B3E]/30 mb-6">
            <Flame className="w-3.5 h-3.5 text-[#C06B3E]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#C06B3E]">What I built from it</span>
          </div>
          <h2 className="font-display text-[#FDFBF7] text-3xl sm:text-5xl leading-[0.95] mb-6">
            A recovery system built in a body<br />
            <span className="italic font-serif text-[#C06B3E]">that was supposed to stop.</span>
          </h2>
          <p className="text-[#FDFBF7]/60 text-lg leading-relaxed max-w-2xl mx-auto mb-12">
            Not built in a lab — built in the gap. Every method here is one I tested on myself, from the ICU to 90%+. This is the Sasquatch Method: the daily operating system that got me here.
          </p>
          <div className="grid sm:grid-cols-3 gap-5 text-left">
            {[
              { t: "Never Zero", d: "One rep a day, minimum. Non-negotiable. The streak is what rewires the brain — even on the days that feel pointless." },
              { t: "S.A.S.C.H. Daily", d: "Seize · Absorb · Swing · Combine · Hammer. The five-step operating system I ran every single day from wheelchair to walking." },
              { t: "C.O.M.P.A.S.S.", d: "Control · Own · Mutate · Patience · Anger · Small Wins · Stack. The seven pillars for when recovery stalls and you need a way through." },
            ].map((item) => (
              <div key={item.t} className="rounded-2xl border border-[#3A3230] bg-[#0F0C0A] p-6">
                <div className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-2">{item.t}</div>
                <p className="text-[#FDFBF7]/65 text-sm leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Where I am now ───────────────────────────────────────────────── */}
      <section className="bg-[#FDFBF7] py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="rounded-2xl overflow-hidden border border-[#E2C2A4]/40 order-last md:order-first">
            <img src={nickPortrait} alt="Nick Kremers today" decoding="async" className="w-full h-full object-cover" />
          </div>
          <div className="nick-story">
            <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-4">Today — Lavaca, Arkansas</p>
            <h2 className="font-display text-[#2A2421] text-3xl sm:text-5xl leading-[0.95] mb-6">
              90%+ functional.<br />
              <span className="italic font-serif text-[#C06B3E]">Still climbing.</span>
            </h2>
            <div className="space-y-5 text-lg text-[#5C534D] leading-relaxed">
              <p>
                I run Stroke Recovery Academy from Lavaca, Arkansas. I wrote the books. I built the Coach. I show up for survivors every day — because someone should have shown up for me.
              </p>
              <p>
                As long as that meat in your chest is still thumpin', your life is still pumpin'. You are not done. And you don't have to do the days in between alone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Nick's words ─────────────────────────────────────────────────── */}
      <section className="bg-[#1A1412] py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <Quote className="h-8 w-8 text-[#C06B3E] flex-shrink-0" />
            <div>
              <p className="font-display text-[#FDFBF7] text-2xl sm:text-3xl leading-tight mb-5">
                "Recovery isn't healing — it's construction. You build with what you still have. You are not done."
              </p>
              <p className="text-[#C06B3E] font-semibold">— Nick Kremers, founder</p>
            </div>
          </div>

          {/* Real survivor quotes render here only when Nick supplies them. */}
          {FOUNDER_QUOTES.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-5 mt-12">
              {FOUNDER_QUOTES.map((q, i) => (
                <div key={i} className="rounded-2xl border border-[#3A3230] bg-[#0F0C0A] p-6">
                  <Quote className="h-5 w-5 text-[#C06B3E] mb-3" />
                  <p className="text-[#FDFBF7]/80 leading-relaxed mb-4">{q.quote}</p>
                  <div className="text-sm font-semibold text-[#FDFBF7]">{q.name}</div>
                  <div className="text-xs text-[#FDFBF7]/50">{q.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-[#1A1412] pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-3">Pick your level</p>
            <h2 className="font-display text-[#FDFBF7] text-3xl sm:text-5xl leading-[0.95] mb-4">
              I never had this.<br />
              <span className="italic font-serif text-[#C06B3E]">You do.</span>
            </h2>
            <p className="text-[#FDFBF7]/55 text-lg max-w-2xl mx-auto">
              Free gets you started. Premium gets you moving. Founder puts you in the room with me — shaping what gets built next.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border-2 p-7 flex flex-col relative ${
                  tier.highlight ? "border-[#C06B3E] bg-[#C06B3E]/8" : "border-[#3A3230] bg-[#0F0C0A]"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#C06B3E] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">
                      {tier.badge}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-1">{tier.name}</div>
                  <div className="font-display text-[#FDFBF7] text-4xl">{tier.price}</div>
                  <div className="text-[#FDFBF7]/40 text-sm mt-0.5">{tier.sub}</div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#FDFBF7]/70">
                      <Check className="w-4 h-4 text-[#C06B3E] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  className={`h-11 rounded-full font-semibold text-sm ${
                    tier.highlight
                      ? "bg-[#C06B3E] hover:bg-[#A85B33] text-white"
                      : "bg-[#2A2421] hover:bg-[#3A3230] text-[#FDFBF7] border border-[#3A3230]"
                  }`}
                  data-testid={`button-tier-${tier.name.toLowerCase()}`}
                >
                  <Link href={tier.href}>{tier.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="text-center text-[#FDFBF7]/30 text-xs mt-8">
            Need something more? <Link href="/recovery/coaching-with-nick" className="text-[#C06B3E] underline underline-offset-2">Work directly with Nick.</Link>
          </p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="relative bg-[#F5F0EB] py-20 sm:py-32 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_rgba(226,116,27,0.12),_transparent_60%)]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h2 className="font-display text-[#1C1917] text-4xl sm:text-5xl md:text-7xl mb-6 sm:mb-8 leading-[0.9]">
            The hospital did its job.<br />
            <span className="italic font-serif text-[#C06B3E]">Now it's your turn.</span>
          </h2>
          <p className="text-lg sm:text-xl text-[#78716C] mb-10 sm:mb-12">
            I'll be there for every rep of it — daily reps, your squad of five, and Coach in your corner. $19/mo, 7 days free. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={goToOnboarding}
              className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-16 px-12 text-lg rounded-full font-semibold w-full sm:w-auto shadow-[0_2px_8px_rgba(192,107,62,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(192,107,62,0.2)]"
              data-testid="button-start-recovery-about"
            >
              Start your recovery
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-16 px-12 text-lg rounded-md w-full sm:w-auto border-[#E2C2A4]/30 bg-white text-[#1C1917] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all hover-elevate"
              data-testid="button-see-premium-about"
            >
              <Link href="/recovery/premium">See Premium</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
