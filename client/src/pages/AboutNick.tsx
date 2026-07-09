import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO, { NICK_KREMERS_SCHEMA, SASQUATCH_METHOD_SCHEMA } from "@/components/RecoverySEO";
import {
  Heart, Star, BookOpen, Target, Flame, Mountain, Quote, ArrowRight, Check,
} from "lucide-react";
import nickPortrait from "@assets/nick-portrait-opt.webp";
import nickBeforeAfter from "@assets/Untitled_design_(1)_1783564981619.png";

const milestones = [
  { year: "Dec 2018", title: "The Day Everything Changed", description: "December 3, 2018 — a massive hemorrhagic stroke. Left side paralyzed, speech gone, 50 pounds lost in the ICU on tube feedings. Told he might never walk normally again." },
  { year: "Apr 2019", title: "Nicholas Jr. — The Spark", description: "April 24, 2019: Nicholas Jr. took his first breath. Nick watched from the wheelchair. He promised to play catch with both arms. Every rep since has had his son's name on it." },
  { year: "2020", title: "S.A.S.C.H. Formula Born", description: "Formalized the 5-step daily operating system — Seize, Absorb, Swing, Combine, Hammer — after years of testing every recovery technique available." },
  { year: "2021", title: "C.O.M.P.A.S.S. Created", description: "Built the 7-pillar navigation system: Control, Own, Mutate, Patience, Anger, Small Wins, Stack. A framework for getting unstuck when recovery stalls." },
  { year: "2022", title: "TikTok & Community Launch", description: "Took the Sasquatch Doctrine to TikTok. An overwhelming response — 14.5K warriors followed. The mission became undeniable: help every survivor who would listen." },
  { year: "2023", title: "Academy Founded", description: "Launched StrokeRecoveryAcademy.com from Lavaca, Arkansas. The 33-chapter curriculum, the Sasquatch Coach, the 66-Day Challenge — all built to give survivors what he never had." },
  { year: "2026", title: "Sasquatch Keeps Rising", description: "90%+ function and still climbing. Building the platform, writing the books, running the community. As long as that meat in your chest is still thumpin', your life is still pumpin'." },
];

const doctrinePoints = [
  { icon: Flame, title: "Never Zero", description: "1 rep per day minimum. Non-negotiable. The streak is what builds the brain. Even teeth brushing counts." },
  { icon: Target, title: "S.A.S.C.H. Daily System", description: "Seize · Absorb · Swing · Combine · Hammer — the 5-step daily operating system Nick used from ICU to 90%+." },
  { icon: Mountain, title: "C.O.M.P.A.S.S. Navigation", description: "Control · Own · Mutate · Patience · Anger · Small Wins · Stack — the advanced 7-pillar builder's compass for when recovery stalls." },
  { icon: Star, title: "Flicker Log", description: "Track every micro-moment — a toe twitch, one more second of balance, buttoning a shirt. Every flicker is data. Every flicker is proof." },
  { icon: BookOpen, title: "Draft Your Legend", description: "Write your recovery story in your own words. Nick's chapters alongside yours. Your story matters — and someone out there needs to hear it." },
  { icon: Heart, title: "S.O.S. Panic Button", description: "Survive · Organize · Strive — the beginner reset for the darkest days. Use S.O.S. to survive; upgrade to S.A.S.C.H. when momentum builds." },
];

const beliefs = [
  "Every survivor can make progress, no matter how small it seems",
  "Community and support make the journey less lonely",
  "Tracking your progress helps you see the wins you might miss",
  "Your story matters and deserves to be told",
];

export default function AboutNick() {
  return (
    <div className="min-h-screen bg-[#1A1412]">
      <RecoverySEO
        title="About Nick Kremers — Stroke Survivor, Author & Founder of Stroke Recovery Academy"
        description="Nick Kremers suffered a devastating hemorrhagic stroke on December 3, 2018, and went from 0% to 90%+ functional recovery using the Sasquatch Method. Author of The Stroked Out Sasquatch and The Ultimate Stroke Recovery Revolution, founder of Stroke Recovery Academy, and 24/7 recovery coach to thousands of survivors worldwide."
        canonical="/recovery/about-nick"
        pageType="article"
        author="Nick Kremers"
        publishedTime="2023-01-01T00:00:00Z"
        modifiedTime={new Date().toISOString()}
        keywords={[
          "Nick Kremers stroke survivor", "Stroked Out Sasquatch", "Stroke Recovery Academy founder",
          "stroke recovery author", "Sasquatch Method stroke", "stroke recovery coach",
          "stroke 0 to 90 recovery", "stroke survivor success story", "Nick Kremers books",
          "stroke recovery methodology", "C.O.M.P.A.S.S. recovery system"
        ]}
        speakableSelectors={["h1", ".nick-bio", ".nick-story", ".sasquatch-quote"]}
        breadcrumbs={[{ name: "Recovery Hub", url: "/recovery" }, { name: "About Nick", url: "/recovery/about-nick" }]}
        additionalSchema={[
          { "@context": "https://schema.org", ...NICK_KREMERS_SCHEMA },
          { "@context": "https://schema.org", ...SASQUATCH_METHOD_SCHEMA }
        ]}
        faq={[
          { question: "Who is Nick Kremers?", answer: "Nick Kremers is a stroke survivor who suffered a massive hemorrhagic stroke on December 3, 2018, and went from 0% to 90%+ functional recovery through relentless rehabilitation. He is the founder of Stroke Recovery Academy, author of 'The Stroked Out Sasquatch' and 'The Ultimate Stroke Recovery Revolution,' and the creator of the Sasquatch Method — a battle-tested recovery system used by survivors worldwide." },
          { question: "How did Nick Kremers recover from his stroke?", answer: "Nick Kremers recovered using his three integrated recovery systems: the S.A.S.C.H. Formula (Seize, Absorb, Swing, Combine, Hammer) as his daily operating system; the S.O.S. daily reset (Survive, Organize, Strive); and the C.O.M.P.A.S.S. seven-pillar navigation system (Control, Own, Mutate, Patience, Anger, Small Wins, Stack). Combined with neuroplasticity-based protocols — mirror therapy, baseball bat therapy, drop foot progressions — and the 'Never Zero' consistency commitment, he went from 0% to 90%+ functional ability." },
          { question: "What is the Sasquatch Method for stroke recovery?", answer: "The Sasquatch Method is Nick Kremers' battle-tested 66-day stroke recovery system built on three core acronym systems. Daily formula: S.A.S.C.H. — Seize, Absorb, Swing, Combine, Hammer. Quick daily reset: S.O.S. — Survive, Organize, Strive. Advanced navigation: C.O.M.P.A.S.S. — Control, Own, Mutate, Patience, Anger, Small Wins, Stack. The three phases are Survival (Days 1-22), Breakthrough (Days 23-44), and Optimization (Days 45-66)." },
          { question: "What books has Nick Kremers written about stroke recovery?", answer: "Nick Kremers has written two stroke recovery books: (1) 'The Stroked Out Sasquatch' — his raw, 38-chapter autobiography from catastrophic stroke to 90%+ recovery, covering the ICU, the therapists, TikTok, and building the movement; (2) 'The Ultimate Stroke Recovery Revolution: From 0% to 90%+ and Still Rising' — 33 chapters and 9 appendices covering the S.A.S.C.H. Formula (Seize, Absorb, Swing, Combine, Hammer), the S.O.S. daily reset, the C.O.M.P.A.S.S. navigation system, neuroplasticity, mirror therapy, baseball bat therapy, drop foot protocols, and the complete Sasquatch Doctrine." }
        ]}
      />
      <RecoveryHeader />

      {/* ── Hero ── */}
      <section className="relative bg-[#1A1412] overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="grid md:grid-cols-[auto,1fr] gap-10 items-center">
            <div className="mx-auto md:mx-0">
              <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-[#C06B3E]/50 shadow-[0_0_60px_rgba(192,107,62,0.25)]">
                <img src={nickPortrait} alt="Nick Kremers" className="w-full h-full object-cover" loading="eager" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDFBF7]/8 border border-[#C06B3E]/30 mb-6">
                <Flame className="w-3.5 h-3.5 text-[#C06B3E]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FDFBF7]/80">Founder · 7-year survivor · Lavaca, Arkansas</span>
              </div>
              <h1 className="font-display leading-[0.9] mb-4">
                <span className="block text-[#FDFBF7] text-4xl sm:text-6xl">They said he was done.</span>
                <span className="block text-[#FDFBF7]/40 text-4xl sm:text-6xl">His heart disagreed.</span>
              </h1>
              <p className="font-display text-[#C06B3E] text-2xl sm:text-3xl mb-6">Nick Kremers. Stroke survivor. Sasquatch.</p>
              <p className="text-[#FDFBF7]/60 text-lg leading-relaxed max-w-xl mx-auto md:mx-0">
                Creator of the Sasquatch Doctrine — a recovery methodology built not in a lab,
                but in a body that was supposed to stop. From 0% to 90%+ and still rising.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quote strip ── */}
      <section className="bg-[#C06B3E]">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-start gap-4 sasquatch-quote">
            <Quote className="h-8 w-8 text-[#FDFBF7]/70 shrink-0 mt-1" />
            <div>
              <p className="font-display text-[#FDFBF7] text-2xl sm:text-3xl leading-snug mb-4">
                "Recovery isn't healing — it's construction. You build with what you still have.
                As long as that meat in your chest is still thumpin', your life is still pumpin'. You are not done."
              </p>
              <p className="text-[#FDFBF7]/80 font-semibold">— Nick Kremers, Lavaca, Arkansas</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Story ── */}
      <section className="bg-[#FDFBF7] py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-5">The Story</p>
          <h2 className="font-display text-[#2A2421] text-3xl sm:text-5xl leading-[0.95] mb-8">
            December 3, 2018.<br />
            <span className="italic font-serif text-[#C06B3E]">The day the wall came down.</span>
          </h2>
          <div className="space-y-5 text-[#5C534D] text-lg leading-relaxed nick-bio">
            <p>
              Nick Kremers — former athlete, benching over 400 pounds, built like a brick wall —
              suffered a massive hemorrhagic stroke. Left side paralyzed. Speech gone.
              50 pounds lost in the ICU on tube feedings. The doctors told him he'd probably
              never walk normally again.
            </p>
            <p>
              He had two choices: accept the limitations and fade, or use every word of that
              prognosis as fuel. He chose fuel. What followed was seven years of relentless,
              daily, sometimes humiliating, always honest work — developing what would become
              the <span className="text-[#C06B3E] font-semibold">Sasquatch Doctrine</span>:
              a recovery methodology built not in a lab, but in a body that was supposed to stop.
            </p>
            <p>
              The name came from a simple truth. Survivors are told they can't do things.
              That their recovery is impossible. That they're imagining progress.
              Just like Sasquatch — dismissed, doubted, but undeniably, stubbornly present.
              Today Nick is 90%+ functional, still rising, and coaching thousands of warriors
              from Lavaca, Arkansas.
            </p>
          </div>

          <figure className="mt-10">
            <div className="rounded-2xl overflow-hidden border border-[#E2C2A4]/40 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <img
                src={nickBeforeAfter}
                alt="Nick Kremers in 2018 right after his stroke, and in 2027 — seven years into recovery"
                className="w-full h-auto"
                loading="lazy"
                data-testid="img-nick-before-after"
              />
            </div>
            <figcaption className="text-center text-[#78716C] text-sm mt-3">
              Left: 2018, right after the stroke. Right: seven years later. Same heart. Still thumpin'.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── The Doctrine ── */}
      <section className="bg-[#1A1412] py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-4">The Sasquatch Doctrine</p>
            <h2 className="font-display text-[#FDFBF7] text-3xl sm:text-5xl leading-[0.95]">
              Built in the dark.<br />
              <span className="italic font-serif text-[#C06B3E]">Tested every single day.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctrinePoints.map((point) => (
              <div key={point.title} className="rounded-2xl border border-[#3A3230] bg-[#0F0C0A] p-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#C06B3E]/15 border border-[#C06B3E]/25 flex items-center justify-center shrink-0">
                    <point.icon className="h-5 w-5 text-[#C06B3E]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#FDFBF7] mb-1">{point.title}</h3>
                    <p className="text-[#FDFBF7]/55 text-sm leading-relaxed">{point.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Journey ── */}
      <section className="bg-[#FDFBF7] py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-4">The Journey</p>
          <h2 className="font-display text-[#2A2421] text-3xl sm:text-5xl leading-[0.95] mb-12">
            Seven years,<br />
            <span className="italic font-serif text-[#C06B3E]">one rep at a time.</span>
          </h2>
          <div className="relative">
            <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-[#E2C2A4]" />
            <div className="space-y-8">
              {milestones.map((m) => (
                <div key={m.year} className="relative pl-9">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-[#C06B3E] border-4 border-[#FDFBF7]" />
                  <div className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-1">{m.year}</div>
                  <h3 className="font-semibold text-[#2A2421] text-lg">{m.title}</h3>
                  <p className="text-[#5C534D] text-sm leading-relaxed">{m.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The Mission ── */}
      <section className="bg-[#1A1412] py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-4">The Mission</p>
          <h2 className="font-display text-[#FDFBF7] text-3xl sm:text-4xl leading-[0.95] mb-8">
            Give every survivor<br />
            <span className="italic font-serif text-[#C06B3E]">what he never had.</span>
          </h2>
          <ul className="space-y-4">
            {beliefs.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[#FDFBF7]/70 text-lg">
                <Check className="h-5 w-5 text-[#C06B3E] shrink-0 mt-1" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Offer / CTA ── */}
      <section className="bg-[#FDFBF7] py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-[#2A2421] text-3xl sm:text-5xl leading-[0.95] mb-5">
            Ready to start<br />
            <span className="italic font-serif text-[#C06B3E]">your own climb?</span>
          </h2>
          <p className="text-[#5C534D] text-lg max-w-2xl mx-auto mb-10">
            Join thousands of survivors using the Sasquatch Doctrine to reclaim their lives,
            one rep at a time. Free gets you started. Premium gets you moving.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-14 px-8 text-base rounded-full font-semibold shadow-[0_2px_8px_rgba(192,107,62,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(192,107,62,0.2)]"
              data-testid="button-start-free"
            >
              <Link href="/recovery/onboarding">Start free <ArrowRight className="h-5 w-5 ml-2" /></Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 text-base rounded-full border-[#2A2421]/20 text-[#2A2421] hover:bg-[#2A2421]/5"
              data-testid="button-see-premium"
            >
              <Link href="/recovery/premium">See Premium — $19/mo</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-[#5C534D]/70">
            Want in the room where it gets built?{" "}
            <Link href="/recovery/premium" className="text-[#C06B3E] underline underline-offset-2" data-testid="link-founders-circle">
              Join the Founder's Circle — $49/mo.
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
