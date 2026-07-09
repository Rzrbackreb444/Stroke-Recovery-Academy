import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RecoveryHeader from "@/components/RecoveryHeader";
import {
  Flame,
  Compass,
  Hammer,
  Shield,
  ArrowRight,
  BookOpen,
  MessageCircle,
  ClipboardList,
  Anchor,
  Activity,
  PenLine,
  Repeat,
  Shuffle,
  Users,
} from "lucide-react";

const ORANGE = "#E2741B";
const BG = "#0D0D0D";
const PANEL = "#1a1a1a";
const PANEL_ALT = "#111";
const TEXT = "#E5E5E5";
const MUTED = "#999";

const SIX_PRINCIPLES = [
  {
    name: "Ownership",
    icon: Anchor,
    body: "Every rep, every choice, every morning is yours. The stroke is the raw material. The recovery is yours to author.",
    motto: "No one is coming. You are the one you have been waiting for.",
  },
  {
    name: "Movement",
    icon: Activity,
    body: "Even when nothing moves, the signal is the work. The brain rewards intention as well as motion. Send the signal every day, whether the muscle answers or not.",
    motto: "The flicker is the fire.",
  },
  {
    name: "Reflection",
    icon: PenLine,
    body: "Write the win, log the loss, learn from both. Three lines a day in the tracker. The unexamined rep does not compound.",
    motto: "The pen builds the path the body walks.",
  },
  {
    name: "Repetition",
    icon: Repeat,
    body: "Sixty-six days at a time, forever. No zero days. The streak is the structure.",
    motto: "Compound the smallest possible thing for the longest possible time.",
  },
  {
    name: "Adaptation",
    icon: Shuffle,
    body: "When the system stalls, change a variable. The plateau is a feedback signal, not a verdict.",
    motto: "Same dose + new variable = new growth.",
  },
  {
    name: "Humanhood",
    icon: Users,
    body: "Rebuild the body, the mind, and the connection to other people. None of the three is optional.",
    motto: "Solitary recovery is half a recovery.",
  },
];

const TATTOO_LAWS = [
  "You've already won. You survived.",
  "Small wins are sacred. A flicker is a resurrection.",
  "Control what you can. Rituals beat randomness.",
  "Anger is a spark, not a wildfire. Burn clean.",
  "Patience is a bitch — but it is a virtue.",
  "Stack failures until they form steps.",
];

const SOS = [
  {
    letter: "S",
    word: "Survive",
    body: "You have already won. Breathe. Grieve. Anchor your why. Some days the win is just this S — and that is still an S.",
  },
  {
    letter: "O",
    word: "Organize",
    body: "Stack your wins. Build rituals. Control what you can. Structure is step two.",
  },
  {
    letter: "S",
    word: "Strive",
    body: "Push. Experiment. Improvise. Never zero. Stack the fails. Striving never stops.",
  },
];

const COMPASS = [
  { letter: "C", line: "Control what you can. Daily rituals, grids, hacks. Skip what you cannot move." },
  { letter: "O", line: "Own your pace. No 30-day sprints. Tortoise wins every time." },
  { letter: "M", line: "Mutation beats stagnation. Change reps, angles, or intensity to break plateaus." },
  { letter: "P", line: "Patience plus nutrition equals brain fuel. Heal first, rewire second." },
  { letter: "A", line: "Anger is fuel. Channel it into reps, not explosions." },
  { letter: "S", line: "Small wins are sacred. Celebrate flickers, logs, fragments." },
  { letter: "S", line: "Stack failures into success. Every try is a deposit." },
];

const COMPASS_FLOW = [
  { step: "Assess", body: "Day 1 audit. What moves, what does not, what hurts." },
  { step: "Anchor", body: "Find your why. Son. Partner. Dog. Yourself. Without an anchor, the work drifts." },
  { step: "Act", body: "Pick the rituals. Run the Six Principles daily." },
  { step: "Adapt", body: "Switch drills. Break plateaus." },
  { step: "Advance", body: "Log wins. Share. Teach. Give back." },
];

function SectionHeading({ badge, title, sub }: { badge: string; title: string; sub?: string }) {
  return (
    <div className="text-center mb-10">
      <Badge
        className="mb-4 uppercase tracking-widest text-xs"
        style={{ background: "#2a1f00", color: ORANGE, border: `1px solid ${ORANGE}` }}
      >
        {badge}
      </Badge>
      <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ color: "#FFF", fontFamily: "Georgia, serif" }}>
        {title}
      </h2>
      {sub && (
        <p className="text-base max-w-2xl mx-auto" style={{ color: TEXT }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function SasquatchDoctrine() {
  return (
    <>
      <Helmet>
        <title>The Sasquatch Doctrine — The Survivor's Operating System | Stroke Recovery Academy</title>
        <meta
          name="description"
          content="Six principles, four operational layers: the Tattoo-Grade Laws, S.O.S., S.A.S.C.H., and C.O.M.P.A.S.S. The complete survivor operating system from The Ultimate Stroke Recovery Revolution."
        />
        <meta property="og:title" content="The Sasquatch Doctrine — The Survivor's Operating System" />
        <meta
          property="og:description"
          content="Six principles. Four layers. Two creeds. The operating system a stroke survivor used to rebuild from 0% to 90%+ — run it daily on the platform."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://strokerecoveryacademy.com/recovery/doctrine" />
      </Helmet>

      <div className="min-h-screen" style={{ background: BG, color: TEXT }}>
        <RecoveryHeader />

        {/* HERO */}
        <section className="px-4 pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <Badge
              className="mb-6 uppercase tracking-widest text-xs"
              style={{ background: "#2a1f00", color: ORANGE, border: `1px solid ${ORANGE}` }}
              data-testid="badge-doctrine"
            >
              Appendix I of the Book — Free, In Full
            </Badge>
            <h1
              className="text-4xl md:text-6xl font-black tracking-tight mb-6"
              style={{ color: "#FFF", fontFamily: "Georgia, serif" }}
              data-testid="text-hero-title"
            >
              The <span style={{ color: ORANGE }}>Sasquatch Doctrine</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed" style={{ color: TEXT }}>
              The survivor's operating system. Six principles. Four layers.{" "}
              <span style={{ color: ORANGE, fontWeight: 700 }}>Two minutes a day. Forever.</span>
            </p>
            <p className="text-sm md:text-base italic" style={{ color: MUTED }}>
              Memorize them. Run them daily. The whole doctrine fits on a wallet card.
            </p>
          </div>
        </section>

        {/* SIX PRINCIPLES */}
        <section className="px-4 py-16" style={{ background: PANEL_ALT }} data-testid="section-principles">
          <div className="max-w-5xl mx-auto">
            <SectionHeading
              badge="The Foundation"
              title="The Six Principles"
              sub="One Sasquatch. Six daily reps of the self: Ownership. Movement. Reflection. Repetition. Adaptation. Humanhood."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SIX_PRINCIPLES.map((p) => (
                <Card
                  key={p.name}
                  className="border hover-elevate"
                  style={{ background: PANEL, borderColor: "#333" }}
                  data-testid={`principle-${p.name.toLowerCase()}`}
                >
                  <CardContent className="pt-6 pb-5">
                    <div
                      className="w-10 h-10 mb-3 rounded-full flex items-center justify-center"
                      style={{ background: ORANGE }}
                    >
                      <p.icon className="h-5 w-5" style={{ color: "#000" }} />
                    </div>
                    <h3 className="text-lg font-bold uppercase tracking-wide mb-2" style={{ color: "#FFF" }}>
                      {p.name}
                    </h3>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: MUTED }}>
                      {p.body}
                    </p>
                    <p className="text-sm italic" style={{ color: ORANGE }}>
                      {p.motto}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* DAILY OPERATING CARD */}
        <section className="px-4 py-16" data-testid="section-operating-card">
          <div className="max-w-3xl mx-auto">
            <SectionHeading
              badge="Two Minutes a Day"
              title="The Daily Operating Card"
              sub="The card Nick carries, every day, paper in his wallet."
            />
            <Card style={{ background: PANEL, border: `1px solid ${ORANGE}` }}>
              <CardContent className="py-8 px-6 md:px-10">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm uppercase tracking-widest font-bold mb-3" style={{ color: ORANGE }}>
                      Morning (60 seconds)
                    </p>
                    <ul className="space-y-3 text-base" style={{ color: TEXT }}>
                      <li>One thing I <strong style={{ color: "#FFF" }}>OWN</strong> today: ______</li>
                      <li>One <strong style={{ color: "#FFF" }}>MOVEMENT</strong> signal I will send: ______</li>
                      <li>One person I will <strong style={{ color: "#FFF" }}>REACH</strong>: ______</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-widest font-bold mb-3" style={{ color: ORANGE }}>
                      Evening (60 seconds)
                    </p>
                    <ul className="space-y-3 text-base" style={{ color: TEXT }}>
                      <li>One <strong style={{ color: "#FFF" }}>REP</strong> I made: ______</li>
                      <li>One thing I learned (<strong style={{ color: "#FFF" }}>REFLECTION</strong>): ______</li>
                      <li>One variable I am changing tomorrow (<strong style={{ color: "#FFF" }}>ADAPTATION</strong>): ______</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm italic mt-6 text-center" style={{ color: MUTED }}>
                  Two minutes a day. Forever. The whole doctrine fits in two minutes.
                </p>
                <div className="mt-6 text-center">
                  <Link href="/recovery" data-testid="link-run-card">
                    <Button className="font-bold" style={{ background: ORANGE, color: "#000" }}>
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Run It on Your Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FOUR LAYERS INTRO */}
        <section className="px-4 py-16" style={{ background: PANEL_ALT }} data-testid="section-layers">
          <div className="max-w-5xl mx-auto">
            <SectionHeading
              badge="The Operating Layers"
              title="Four Layers. One Wallet Card."
              sub="Start with S.O.S. on the worst days. Move to S.A.S.C.H. when you can string two functional days together. Graduate to C.O.M.P.A.S.S. when the rhythm is reflex. The Tattoo-Grade Laws mutter in the background the whole way."
            />

            {/* LAYER 1: TATTOO LAWS */}
            <div className="mb-14" data-testid="layer-tattoo-laws">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: ORANGE }}>
                  <Flame className="h-5 w-5" style={{ color: "#000" }} />
                </div>
                <h3 className="text-xl md:text-2xl font-black" style={{ color: "#FFF", fontFamily: "Georgia, serif" }}>
                  Layer 1: The Tattoo-Grade Laws
                </h3>
              </div>
              <p className="text-base mb-5" style={{ color: MUTED }}>
                Raw. Simple. Real. What you mutter to yourself when nothing else works. Pick one. Tape it to the
                bathroom mirror. Read it every morning until you do not need the paper.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TATTOO_LAWS.map((law, i) => (
                  <Card key={i} style={{ background: PANEL, border: "1px solid #333" }} data-testid={`law-${i}`}>
                    <CardContent className="py-5 px-5">
                      <p className="text-base italic leading-relaxed" style={{ color: TEXT }}>
                        "{law}"
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* LAYER 2: SOS */}
            <div className="mb-14" data-testid="layer-sos">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: ORANGE }}>
                  <Shield className="h-5 w-5" style={{ color: "#000" }} />
                </div>
                <h3 className="text-xl md:text-2xl font-black" style={{ color: "#FFF", fontFamily: "Georgia, serif" }}>
                  Layer 2: S.O.S. — The Everyday Survivor OS
                </h3>
              </div>
              <p className="text-base mb-5" style={{ color: MUTED }}>
                S.O.S. — Stroked-Out Sasquatch. Not a cry for help. A battle signal. For Day 1 survivors and the
                caregivers beside them: every morning, ask which S you are in today, and build the day around the
                honest answer.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {SOS.map((s, i) => (
                  <Card
                    key={i}
                    className="border-2 hover-elevate"
                    style={{ background: PANEL, borderColor: "#333" }}
                    data-testid={`sos-${s.word.toLowerCase()}`}
                  >
                    <CardContent className="pt-6 pb-5 text-center">
                      <div className="text-4xl font-black mb-1" style={{ color: ORANGE, fontFamily: "Georgia, serif" }}>
                        {s.letter}
                      </div>
                      <h4 className="text-base font-bold uppercase tracking-wide mb-2" style={{ color: "#FFF" }}>
                        {s.word}
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                        {s.body}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-sm mt-4 text-center" style={{ color: MUTED }}>
                Declare your S each day when you log on the{" "}
                <Link href="/recovery" className="underline" style={{ color: ORANGE }} data-testid="link-sos-dashboard">
                  dashboard
                </Link>{" "}
                — the coach reads it and matches the day you actually have.
              </p>
            </div>

            {/* LAYER 3: SASCH */}
            <div className="mb-14" data-testid="layer-sasch">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: ORANGE }}>
                  <Hammer className="h-5 w-5" style={{ color: "#000" }} />
                </div>
                <h3 className="text-xl md:text-2xl font-black" style={{ color: "#FFF", fontFamily: "Georgia, serif" }}>
                  Layer 3: S.A.S.C.H. — The Daily Construction Rhythm
                </h3>
              </div>
              <p className="text-base mb-5" style={{ color: MUTED }}>
                The engine. Seize the Day. Absorb the Lesson. Swing the Work. Combine Elements. Hammer It Home. Run
                it once and you have one good day. Run it sixty-six days in a row and you have a habit. Run it for a
                year and you have a different brain in a different body running a different life.
              </p>
              <Card style={{ background: PANEL, border: "1px solid #333" }}>
                <CardContent className="py-6 px-6">
                  <div className="grid md:grid-cols-3 gap-6 text-sm" style={{ color: TEXT }}>
                    <div>
                      <p className="font-bold uppercase tracking-widest mb-1" style={{ color: ORANGE }}>Morning</p>
                      <p style={{ color: MUTED }}>Seize + Absorb. Self-care first. Gratitude out loud. Read yesterday's log before writing today's.</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-widest mb-1" style={{ color: ORANGE }}>Midday</p>
                      <p style={{ color: MUTED }}>Swing + Combine. The work block. The reps. Stack the drills — bat plus mirror, mirror plus mental rehearsal.</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-widest mb-1" style={{ color: ORANGE }}>Evening</p>
                      <p style={{ color: MUTED }}>Hammer. Sixty seconds of logging. What I built. What I learned. What I will fix tomorrow.</p>
                    </div>
                  </div>
                  <p className="text-sm italic mt-5 text-center" style={{ color: ORANGE }}>
                    The Sasquatch test for any day: you do not need a perfect score. You need a non-zero score. Never zero.
                  </p>
                </CardContent>
              </Card>
              <div className="mt-4 text-center">
                <Link href="/recovery/sasch" data-testid="link-sasch-full">
                  <Button variant="outline" className="font-bold" style={{ borderColor: ORANGE, color: ORANGE, background: "transparent" }}>
                    Get the Full S.A.S.C.H. Cheat Sheet — Free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* LAYER 4: COMPASS */}
            <div data-testid="layer-compass">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: ORANGE }}>
                  <Compass className="h-5 w-5" style={{ color: "#000" }} />
                </div>
                <h3 className="text-xl md:text-2xl font-black" style={{ color: "#FFF", fontFamily: "Georgia, serif" }}>
                  Layer 4: C.O.M.P.A.S.S. — The Advanced Navigation System
                </h3>
              </div>
              <p className="text-base mb-5" style={{ color: MUTED }}>
                For when S.A.S.C.H. is reflex. It does not point north — it points forward. Even if you move an inch
                a day, if you move with intent, you will never be lost again.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {COMPASS.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-md p-4"
                    style={{ background: PANEL, border: "1px solid #333" }}
                    data-testid={`compass-${i}`}
                  >
                    <span
                      className="text-2xl font-black shrink-0 w-8 text-center"
                      style={{ color: ORANGE, fontFamily: "Georgia, serif" }}
                    >
                      {c.letter}
                    </span>
                    <p className="text-sm leading-relaxed pt-1" style={{ color: TEXT }}>
                      {c.line}
                    </p>
                  </div>
                ))}
              </div>
              <Card style={{ background: PANEL, border: `1px solid ${ORANGE}` }}>
                <CardContent className="py-6 px-6">
                  <p className="text-sm uppercase tracking-widest font-bold mb-4" style={{ color: ORANGE }}>
                    The Five-Step C.O.M.P.A.S.S. Flow — run it on any plateau, any setback, any restart
                  </p>
                  <ol className="grid md:grid-cols-5 gap-4">
                    {COMPASS_FLOW.map((f, i) => (
                      <li key={i} data-testid={`flow-${f.step.toLowerCase()}`}>
                        <p className="font-bold mb-1" style={{ color: "#FFF" }}>
                          {i + 1}. {f.step}
                        </p>
                        <p className="text-sm" style={{ color: MUTED }}>
                          {f.body}
                        </p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* TWO CREEDS */}
        <section className="px-4 py-16" data-testid="section-creeds">
          <div className="max-w-4xl mx-auto">
            <SectionHeading
              badge="Appendix J"
              title="The Two Creeds"
              sub="The Architect plans the build at the desk. The Sasquatch executes the build in the body. You need both. Read them in order every morning until you no longer need to read them at all."
            />
            <div className="grid md:grid-cols-2 gap-5">
              <Card style={{ background: PANEL, border: "1px solid #333" }} data-testid="creed-architect">
                <CardContent className="py-8 px-6 md:px-8">
                  <h3 className="text-xl font-black mb-4" style={{ color: ORANGE, fontFamily: "Georgia, serif" }}>
                    The Architect's Creed
                  </h3>
                  <div className="space-y-3 text-sm leading-relaxed" style={{ color: TEXT }}>
                    <p style={{ color: "#FFF", fontWeight: 600 }}>I am not the patient. I am the architect.</p>
                    <p>I do not wait to be healed. I build the body that heals me.</p>
                    <p>I survey the rubble first — honest, without flinching. I draw the blueprint on the worst day, not the best. I lay one brick before sunrise. Then one more.</p>
                    <p>The system gave me the floor. I am building the ceiling. The chart gave me the average. I am the outlier I came here to be.</p>
                    <p>I work in reps, not in moods. I work in years, not in weeks. I work whether the work is seen or not.</p>
                    <p>Every morning I pick up the same hammer. Every morning I aim it at the same wall. The wall does not get bigger. <em>I</em> get bigger.</p>
                    <p style={{ color: "#FFF", fontWeight: 600 }}>The blueprint is mine. The build is mine. The ceiling is mine to lift.</p>
                  </div>
                </CardContent>
              </Card>
              <Card style={{ background: PANEL, border: `1px solid ${ORANGE}` }} data-testid="creed-sasquatch">
                <CardContent className="py-8 px-6 md:px-8">
                  <h3 className="text-xl font-black mb-4" style={{ color: ORANGE, fontFamily: "Georgia, serif" }}>
                    The Sasquatch Creed
                  </h3>
                  <div className="space-y-3 text-sm leading-relaxed" style={{ color: TEXT }}>
                    <p style={{ color: "#FFF", fontWeight: 600 }}>I am the Stroked-Out Sasquatch.</p>
                    <p>I was broken, but not beaten. I was silenced, but not quiet. I was told <em>never</em>, but I said <em>watch me</em>.</p>
                    <p>I own my stroke. It is my raw material. I move every day — flickers become fire. I reflect, adapt, repeat — no shortcuts, no surrender. I choose possible over probable every damn morning. I uplift my adopted survivor family — hope is contagious. I find purpose bigger than pain.</p>
                    <p>I chop wood when tired. I stand when it hurts. I celebrate flickers as fireworks.</p>
                    <p>This is a lifelong journey. A new life. A fresh start.</p>
                    <p style={{ color: "#FFF", fontWeight: 600 }}>I am not just recovering. I am proving what's possible. I am the proof.</p>
                    <p>The impossible is waiting for me to make it inevitable. And I'm coming for it.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <p className="text-sm text-center mt-5 italic" style={{ color: MUTED }}>
              — Nicholas "Stroked-Out Sasquatch" Kremers
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16" style={{ background: PANEL_ALT }} data-testid="section-cta">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-black mb-4" style={{ color: "#FFF", fontFamily: "Georgia, serif" }}>
              The Doctrine Is Free. The Build Is Yours.
            </h2>
            <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto" style={{ color: TEXT }}>
              This whole page is Appendix I and J of the book, free in full. The other 30 chapters are the story and
              the system that built it. The platform is where you run it — daily loop, S.O.S. check-in, the coach in
              your corner.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/book" data-testid="link-book">
                <Button size="lg" className="font-bold tracking-wide" style={{ background: ORANGE, color: "#000" }}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Get the Book
                </Button>
              </Link>
              <Link href="/recovery/sasquatch-coach" data-testid="link-coach">
                <Button
                  size="lg"
                  variant="outline"
                  className="font-bold tracking-wide"
                  style={{ borderColor: ORANGE, color: ORANGE, background: "transparent" }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Talk to Coach — Free
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* DISCLAIMER */}
        <section className="px-4 py-10" data-testid="section-disclaimer">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs leading-relaxed" style={{ color: "#666" }}>
              <strong style={{ color: "#888" }}>Lived experience only — not medical advice.</strong> The Sasquatch
              Doctrine and all content from Stroke Recovery Academy are for motivational and informational purposes
              only. Always consult your physician, neurologist, or licensed therapist before beginning any
              rehabilitation program. Individual results vary significantly.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
