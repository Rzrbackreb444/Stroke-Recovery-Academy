import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Flame, Bell, Users, Video, BookOpen, Sun,
  Brain, TrendingUp, MessageCircle, ArrowRight,
  Activity, Heart, CheckCircle,
} from "lucide-react";

const GAP_STATS = [
  {
    stat: "60–70%",
    label: "of stroke survivors fall off their home programs within 6 months",
    source: "post-discharge",
  },
  {
    stat: "22–40%",
    label: "higher exercise adherence when accountability is built in",
    source: "Cochrane review",
  },
  {
    stat: "#1",
    label: "factor separating survivors who plateau from those who keep gaining",
    source: "clinical finding",
  },
];

const HOW_WE_FIX_IT = [
  {
    icon: Sun,
    title: "Daily Routine System",
    desc: "5 levels from Survival to Full Power. Morning, midday, evening, and wind-down — every task tracked, every level personalized. It knows when you haven't shown up.",
  },
  {
    icon: Bell,
    title: "Push Notifications That Mean Something",
    desc: "Not spam. One signal per day, triggered by real behavior: a streak about to break, a check-in missed, a Bad Day Protocol activated. No noise. Just signal.",
  },
  {
    icon: MessageCircle,
    title: "Sasquatch Coach — 24/7",
    desc: "An AI coach trained on Nick's voice and philosophy. It notices when you go quiet. It calls you back in. It won't let you disappear without a fight.",
  },
  {
    icon: Users,
    title: "Survivor Community Wall",
    desc: "Film and share your progress. Introduce yourself. Start discussions. React to wins. The wall is proof — not just inspiration — that people in the same fight are moving forward.",
  },
  {
    icon: Activity,
    title: "66-Day Challenge with Daily Missions",
    desc: "Not a checklist. A structured program with daily missions across three phases. The system tracks your phase, your completion rate, and your momentum.",
  },
  {
    icon: Brain,
    title: "Recovery Journal",
    desc: "Journal what it took to get through today. Name the wins, name the hard parts. Your story builds day by day — and on the days nothing feels different, the journal proves otherwise.",
  },
  {
    icon: BookOpen,
    title: "Recovery University",
    desc: "Learn at your own pace. Understand what's happening inside your brain, why the exercises matter, and how neuroplasticity actually works. Knowledge reduces fear.",
  },
  {
    icon: TrendingUp,
    title: "Your Plan — Built Around You",
    desc: "Build a recovery plan or skip the builder entirely and get guided recommendations. Nothing forced. The platform meets you where you are and moves with you.",
  },
];

const CONNECTION_LEVELS = [
  { icon: Video, label: "Film & share progress videos on the wall" },
  { icon: MessageCircle, label: "Daily discussions and open questions" },
  { icon: Users, label: "Introduce yourself — Day 1 or Day 700" },
  { icon: Heart, label: "React to wins: hope, solidarity, or 'this made me do one more rep'" },
  { icon: CheckCircle, label: "Accountability pods: 3–5 survivors checking in together" },
  { icon: BookOpen, label: "Journal publicly or privately — your choice" },
];

export default function AccountabilityManifesto() {
  const [, setLocation] = useLocation();

  return (
    <section className="bg-[#0D0D0D] text-white py-24 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto">

        {/* ── Opening manifesto text ───────────────────────────────── */}
        <div className="mb-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E2741B] mb-6">
            The accountability gap
          </p>

          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8 max-w-4xl">
            The most underserved part of stroke recovery{" "}
            <span className="text-[#E2741B]">isn't information.</span>
            <br />It's someone checking on you.
          </h2>

          <div className="max-w-3xl space-y-5 text-gray-300 text-lg leading-relaxed">
            <p>
              You leave the hospital with a stack of papers and a follow-up appointment in six weeks.
              Nobody is watching the days in between. Nobody knows if you did your exercises or skipped them.
              Nobody knows if you cried on the bathroom floor at 2 AM and decided recovery wasn't worth it.
            </p>
            <p>
              That gap — between discharge and the next appointment, between what you intend and what you actually do —
              is where the plateau lives. It's where survivors fall off. Not because they gave up.{" "}
              <strong className="text-white">Because nobody was there.</strong>
            </p>
            <p className="text-white font-bold text-xl">
              This platform exists to be there.
            </p>
          </div>
        </div>

        {/* ── Stats strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {GAP_STATS.map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-xl border border-[#1e1e1e] bg-[#0a0a0a]"
              data-testid={`stat-gap-${i}`}
            >
              <p className="text-4xl font-black text-[#E2741B] mb-2">{s.stat}</p>
              <p className="text-gray-300 text-sm leading-relaxed mb-2">{s.label}</p>
              <p className="text-xs text-gray-700 uppercase tracking-wider">{s.source}</p>
            </div>
          ))}
        </div>

        {/* ── How we close the gap ─────────────────────────────────── */}
        <div className="mb-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E2741B] mb-4">
            How we close it
          </p>
          <h3 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
            Not one thing. <span className="text-[#E2741B]">Everything.</span>
          </h3>
          <p className="text-gray-400 mb-12 max-w-2xl leading-relaxed">
            Every tool on this platform is built around one principle: the system should notice when
            you've gone quiet, bring you back in, and make it as easy as possible to do one more rep.
            Never Zero.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_WE_FIX_IT.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-[#0f0f0f] border border-[#1e1e1e]"
                data-testid={`accountability-feature-${i}`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#E2741B]/10 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-[#E2741B]" />
                </div>
                <h4 className="text-white font-bold text-sm mb-1.5">{title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Connection section ───────────────────────────────────── */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E2741B] mb-4">
                Connection on every level
              </p>
              <h3 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                Talk. Share. Inspire.<br />
                <span className="text-[#E2741B]">Show up for each other.</span>
              </h3>
              <p className="text-gray-400 leading-relaxed mb-8">
                Community isn't a feed you scroll past. It's survivors at Day 3 and Day 700 talking to each other,
                filming their hard moments and their wins, and proving to everyone watching that recovery is possible.
                Not someday. Right now. On this wall.
              </p>
              <Button
                className="bg-[#E2741B] text-black font-black gap-2"
                onClick={() => setLocation("/recovery/community")}
                data-testid="button-manifesto-community"
              >
                <Users className="w-4 h-4" />
                See the Survivor Community
              </Button>
            </div>

            <div className="space-y-3">
              {CONNECTION_LEVELS.map(({ icon: Icon, label }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e]"
                  data-testid={`connection-level-${i}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#E2741B]/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#E2741B]" />
                  </div>
                  <span className="text-sm text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Guided plan builder callout ──────────────────────────── */}
        <div className="mb-20 p-8 rounded-2xl bg-[#0f0f0f] border border-[#E2741B]/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E2741B] mb-3">
                Your plan. Your pace.
              </p>
              <h3 className="text-2xl md:text-3xl font-black mb-4 leading-tight">
                Build your recovery plan<br />
                <span className="text-[#E2741B]">or let us guide you.</span>
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Answer a few questions about your stroke type, affected side, and current stage —
                and get a personalized recommendation. Or skip the builder entirely and start the
                66-Day Challenge directly. Nothing is forced. The platform meets you where you are.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Stroke type, affected side, and stage", done: true },
                { label: "Current energy level and mobility (set today)", done: true },
                { label: "Daily Routine level recommendation", done: true },
                { label: "66-Day Challenge phase placement", done: true },
                { label: "Exercise protocol matching", done: true },
                { label: "Or skip all of this — start anywhere", done: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-[#E2741B] shrink-0" />
                  <span className={item.done ? "text-gray-300" : "text-gray-600"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Closing punch ────────────────────────────────────────── */}
        <div className="text-center">
          <h3 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            The hospital did its job.<br />
            <span className="text-[#E2741B]">Now it's your turn.</span><br />
            <span className="text-gray-400 font-normal text-2xl md:text-3xl">
              And we'll be there for every rep of it.
            </span>
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Button
              size="lg"
              className="bg-[#E2741B] text-black font-black text-lg px-10 gap-2"
              onClick={() => setLocation("/recovery/pricing")}
              data-testid="button-manifesto-start-trial"
            >
              <Flame className="w-5 h-5" />
              Start 7-Day Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#2a2a2a] text-white gap-2"
              onClick={() => setLocation("/recovery/routine")}
              data-testid="button-manifesto-daily-routine"
            >
              <Sun className="w-4 h-4" />
              See the Daily Routine
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-gray-700 mt-6">
            No card required to explore. 7-day free trial to unlock everything.
          </p>
        </div>

      </div>
    </section>
  );
}
