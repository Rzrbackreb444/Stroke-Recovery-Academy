import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import {
  Loader2, ArrowRight, Play, BrainCircuit, CalendarDays,
  Users, CheckCircle2, ShieldCheck, Activity, Star, Flame, BookOpen, FileText,
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
import nickHeroPhoto from "@assets/2018_1783860042019.png";
import nickPortrait from "@assets/Untitled_design_1781030529179.png";
import manifestoStairs from "@assets/manifesto-stairs.png";
import cleanUi from "@assets/home-clean-ui.png";
import sasquatchCanonical from "@assets/book_v2/images/sasquatch-canonical.png";
import sasquatchSeal from "@assets/book_v2/images/sasquatch-seal.png";

const goToOnboarding = () => {
  window.location.href = "/recovery/onboarding";
};

function Hero() {
  const stats = [
    { value: "50", label: "Staples in his skull" },
    { value: "0%", label: "Nick's starting point" },
    { value: "90%", label: "Nick's reported recovery" },
    { value: "7", label: "Years of proof" },
  ];
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center bg-[#0D0D0D] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 right-0 w-[700px] h-[700px] bg-gold/4 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — Copy */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Flame className="h-5 w-5 text-gold" />
              <span className="text-gold text-sm font-semibold uppercase tracking-widest">
                The Stroked-Out Sasquatch
              </span>
            </div>

            <p
              className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-5 hero-description"
              data-testid="text-hero-subtitle"
            >
              December 3, 2018. Hoyer lift.<br />
              50 staples. Paralyzed on one side.
            </p>

            <h1
              className="font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-[0.92] tracking-tight mb-8"
              data-testid="text-hero-main"
            >
              Nick's <span className="text-gold">0%</span><br />
              to <span className="text-gold">90%</span> story.<br />
              7 years of reps.
            </h1>

            <p className="text-lg text-white/50 mb-8 leading-relaxed">
              Nick Kremers built the Sasquatch Method by absorbing lessons from therapists,
              books, and research, then applying, repeating, documenting, and adapting them
              through his own recovery. This is lived knowledge turned into a practical system.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-5">
              <Button
                size="lg"
                onClick={goToOnboarding}
                className="bg-gold text-black text-base font-bold px-10 h-14 shadow-lg shadow-gold/20"
                data-testid="button-start-recovery-hero"
              >
                Start Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white text-base font-semibold px-10 h-14 bg-white/5"
                onClick={() => document.getElementById("proof")?.scrollIntoView({ behavior: "smooth" })}
                data-testid="button-see-story"
              >
                Watch Nick's Story
              </Button>
            </div>

            <p className="text-sm text-white/35 mb-10">Lived-recovery guidance from Nick's tested system. Free to begin.</p>

            <div className="grid grid-cols-4 gap-4 border-t border-white/10 pt-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-2xl sm:text-3xl text-white">{stat.value}</p>
                  <p className="text-xs text-white/40 mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Before/after photo */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/10 to-transparent z-10 rounded-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-transparent to-transparent z-10 rounded-2xl pointer-events-none" />
            <img
              src={nickHeroPhoto}
              alt="Nick Kremers — 2018 after stroke vs. 2027 after recovery"
              className="w-full rounded-2xl object-cover"
              style={{ maxHeight: "620px" }}
              data-testid="img-nick-hero"
            />
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <div className="bg-black/70 backdrop-blur-sm border border-gold/30 rounded-xl p-4">
                <p className="text-gold text-xs font-semibold uppercase tracking-wider mb-1">
                  Nick Kremers — Founder
                </p>
                <p className="text-white text-sm font-medium leading-snug">
                  "This is my experience — your path will be your own."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
        <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}

function StatsStrip() {
  const stats = [
    { n: "Today", l: "One place to start" },
    { n: "Community", l: "Peer connection" },
    { n: "Journal", l: "Private reflection" },
    { n: "Coach", l: "Guided support" },
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

function BookSpotlight() {
  return (
    <section id="book" className="relative overflow-hidden bg-[#17110b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_42%,rgba(226,116,27,0.28),transparent_34%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-16 items-center">
          <div className="flex justify-center">
            <img
              src="/book/cover.jpg"
              alt="The Ultimate Stroke Recovery Revolution by Nicholas Kremers"
              className="w-52 sm:w-60 rounded-lg shadow-[0_28px_70px_rgba(0,0,0,0.65)] ring-1 ring-white/20"
              data-testid="img-home-book-spotlight"
            />
          </div>

          <div>
            <p className="text-gold text-sm font-bold uppercase tracking-[0.22em] mb-4">The book behind the Method</p>
            <h2 className="font-display text-4xl md:text-6xl leading-[0.92] mb-5">
              The Ultimate<br />Stroke Recovery Revolution
            </h2>
            <p className="max-w-3xl text-lg text-white/70 leading-relaxed mb-8">
              A 314-page lived-recovery field manual for the days after discharge: practical drills,
              mindset, equipment guidance, real recovery stories, and a 90-day framework to help you
              turn “I should” into today’s next rep.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-8 max-w-3xl">
              {[
                "30 chapters + 9 survivor case studies",
                "17 appendices and the 90-Day Breakthrough Program",
                "Digital reader, print edition, and free sample",
              ].map((item) => (
                <div key={item} className="flex gap-2 rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-gold mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="bg-gold text-black font-bold hover:bg-gold/90">
                <Link href="/book/buy" data-testid="link-home-book-buy">
                  <BookOpen className="mr-2 h-5 w-5" /> Choose your edition
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gold/50 bg-gold/10 text-gold hover:bg-gold/20">
                <a href="https://amzn.to/45Ftbjb" target="_blank" rel="sponsored nofollow noopener noreferrer" data-testid="link-home-book-amazon">
                  <BookOpen className="mr-2 h-5 w-5" /> Get it on Amazon
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10">
                <a href="/book/sample.pdf" target="_blank" rel="noopener noreferrer" data-testid="link-home-book-sample">
                  <FileText className="mr-2 h-5 w-5" /> Read the free sample
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10">
                <Link href="/book" data-testid="link-home-book-companion">Explore the companion</Link>
              </Button>
            </div>

            <div className="mt-8 flex items-start gap-3 max-w-2xl rounded-xl border border-gold/30 bg-gold/10 p-4">
              <FileText className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed text-white/75">
                <span className="font-bold text-white">Free 90-Day Companion Template:</span> pair the book with the
                Academy’s daily check-in, weekly review, and recovery-plan prompts so the ideas on the page become a repeatable routine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Method() {
  const systems = [
    {
      code: "S.A.S.C.H.",
      label: "The Daily Formula",
      payoff: "Use it when it fits. Make room for rest.",
      color: "bg-gold",
      textColor: "text-black",
      borderColor: "border-gold/30",
      tagBg: "bg-gold/10 text-gold-ink",
      letters: [
        { l: "S", w: "Seize", d: "Claim the day before it claims you." },
        { l: "A", w: "Absorb", d: "Take in what your brain needs to wire." },
        { l: "S", w: "Swing", d: "Put in the physical reps — move something." },
        { l: "C", w: "Combine", d: "Stack movement with mental rehearsal." },
        { l: "H", w: "Hammer", d: "Practice when you can, then rest and recover." },
      ],
    },
    {
      code: "S.O.S.",
      label: "The Panic Reset",
      payoff: "Pull this out on the dark days.",
      color: "bg-red-600",
      textColor: "text-white",
      borderColor: "border-red-500/30",
      tagBg: "bg-red-500/10 text-red-400",
      letters: [
        { l: "S", w: "Survive", d: "Today doesn't have to be good. It just has to be." },
        { l: "O", w: "Organize", d: "One thing. Pick one thing you can do right now." },
        { l: "S", w: "Strive", d: "Do it. That's the whole protocol on the dark days." },
      ],
    },
    {
      code: "C.O.M.P.A.S.S.",
      label: "The Navigation System",
      payoff: "For when you don't know which direction you're heading.",
      color: "bg-neutral-900",
      textColor: "text-white",
      borderColor: "border-white/10",
      tagBg: "bg-white/10 text-white/70",
      letters: [
        { l: "C", w: "Control", d: "Control what you can. Let go of the rest." },
        { l: "O", w: "Own Your Pace", d: "This is your recovery. Not a race." },
        { l: "M", w: "Mutate", d: "Adapt. What stopped working is a signal." },
        { l: "P", w: "Patience", d: "You cannot rush neuroplasticity. Feed it." },
        { l: "A", w: "Anger is Fuel", d: "Channel every 'never' into a rep." },
        { l: "S", w: "Small Wins", d: "A twitch is data. Log it. Build on it." },
        { l: "S", w: "Stack Failures", d: "Every failed attempt is foundation." },
      ],
    },
  ];

  return (
    <section id="method" className="bg-[#0D0D0D] py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-sm font-bold tracking-widest uppercase text-gold mb-5">The Sasquatch Method</p>
          <h2 className="font-display text-white text-4xl md:text-6xl mb-6 leading-[0.95]">
            Three systems.<br />Practical support for your own pace.
          </h2>
          <p className="text-lg text-white/60 leading-relaxed">
            The hospital sends you home when you're "stable." The Method picks it up from there — a daily formula, a panic reset for the dark days, and a 7-pillar compass for the long game.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {systems.map((sys) => (
            <div key={sys.code} className={`rounded-2xl border ${sys.borderColor} bg-white/5 overflow-hidden`}>
              <div className={`${sys.color} ${sys.textColor} px-7 py-5`}>
                <div className="font-display text-3xl tracking-wider mb-1">{sys.code}</div>
                <div className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded inline-block ${sys.tagBg}`}>{sys.label}</div>
                <p className={`text-sm mt-3 font-medium opacity-80`}>{sys.payoff}</p>
              </div>
              <div className="px-7 py-6 space-y-4">
                {sys.letters.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-display text-white text-sm font-bold">{item.l}</div>
                    <div>
                      <div className="font-bold text-white text-sm">{item.w}</div>
                      <div className="text-white/50 text-xs leading-relaxed mt-0.5">{item.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SasquatchArt() {
  return (
    <section className="bg-black py-0 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-0 items-stretch">
          <div className="flex items-center justify-center py-16 lg:py-24 order-2 lg:order-1">
            <div className="max-w-lg">
              <img src={sasquatchSeal} alt="" aria-hidden="true" className="w-20 h-20 opacity-60 mb-8" />
              <h2 className="font-display text-white text-4xl md:text-5xl lg:text-6xl mb-6 leading-[0.95]">
                "As long as that meat in your chest is still thumpin' — your life is still pumpin'."
              </h2>
               <p className="text-white/50 text-lg leading-relaxed mb-10">
                 Nick Kremers. December 3, 2018. He began with a Hoyer lift and one-sided
                 paralysis. He reports reaching 90% and is still climbing. The Method came
                 from learning, experimenting, repeating, documenting, and adapting in his
                 own body. That's his story — your recovery will be personal to you.
              </p>
              <button
                onClick={goToOnboarding}
                className="inline-flex items-center gap-2 text-gold font-bold text-base hover:text-gold/80 transition-colors"
                data-testid="button-sasquatch-cta"
              >
                Start the Method <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="relative order-1 lg:order-2 flex items-end justify-center bg-gradient-to-b from-black via-black/50 to-black lg:bg-none min-h-[400px] lg:min-h-0">
            <img
              src={sasquatchCanonical}
              alt="The Sasquatch — Nick Kremers' recovery identity"
              className="w-full max-w-md lg:max-w-full h-full object-contain object-bottom mix-blend-lighten opacity-90"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Books() {
  const books = [
    {
      title: "The Ultimate Stroke Recovery Revolution",
      subtitle: "The complete 314-page lived-recovery guide",
      description:
        "Nick's full recovery manual: daily protocols, the 90-Day Breakthrough Program, survivor case studies, and the mindset to keep rebuilding when the system says you're done.",
      image: "/book/cover.jpg",
      imageAlt: "Cover of The Ultimate Stroke Recovery Revolution by Nick Kremers",
      eyebrow: "Read inside the Academy",
      primaryLabel: "Read the book",
      primaryHref: "/book/read",
      primaryExternal: false,
      secondaryLabel: "Buy digital or print",
      secondaryHref: "/book/buy",
    },
    {
      title: "The 90-Day Recovery Template",
      subtitle: "Turn the book into a practical daily recovery plan",
      description:
        "Use the book with a simple daily check-in, weekly review, and recovery-plan prompts. It gives survivors and caregivers a place to turn insight into the next safe, realistic rep.",
      image: cleanUi,
      imageAlt: "Stroke Recovery Academy daily recovery planning template",
      eyebrow: "Free book companion resource",
      primaryLabel: "Open the free template",
      primaryHref: "/book/90-day-template",
      primaryExternal: false,
      secondaryLabel: "Choose a book edition",
      secondaryHref: "/book/buy",
    },
    {
      title: "The Stroke Recovery Bible",
      subtitle: "Earning My Street Cred P.H.D.",
      description:
        "A survivor’s deeper field guide to the hard-earned lessons, mindset shifts, and practical recovery work that do not fit inside a single appointment.",
      image: "https://m.media-amazon.com/images/I/71mJHUGHRKL._SY342_.jpg",
      imageAlt: "The Stroke Recovery Bible by Nicholas Kremers",
      eyebrow: "Also by Nick · Amazon",
      primaryLabel: "Read about the Bible",
      primaryHref: "/blog/stroke-recovery-bible-review",
      primaryExternal: false,
      secondaryLabel: "Find it on Amazon",
      secondaryHref: "https://amzn.to/4cA6fFP",
      secondaryExternal: true,
    },
  ];

  return (
    <section id="books" className="bg-[#111] py-28 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-3xl">
            <p className="text-sm font-bold tracking-widest uppercase text-gold mb-4">Nick's Books</p>
            <h2 className="font-display text-4xl md:text-6xl leading-[0.95] mb-5">
              The recovery plan<br />you can hold onto.
            </h2>
            <p className="text-lg text-white/60 leading-relaxed">
              Read the blueprint, work the reps, and keep the method close when recovery gets hard.
              Start reading online or choose the edition that belongs on your nightstand.
            </p>
          </div>
          <Link
            href="/book"
            className="text-gold font-semibold inline-flex items-center hover:text-gold/80 transition-colors shrink-0"
            data-testid="link-books-companion"
          >
            Open the book companion <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {books.map((book, index) => (
            <article
              key={book.title}
              className="group grid sm:grid-cols-[150px_1fr] gap-7 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 hover:border-gold/40 transition-colors"
              data-testid={`card-home-book-${index}`}
            >
              <div className="flex justify-center sm:block">
                <img
                  src={book.image}
                  alt={book.imageAlt}
                  className="w-36 sm:w-full max-w-[150px] aspect-[0.63] object-cover rounded-md shadow-2xl shadow-black/50"
                />
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">{book.eyebrow}</p>
                <h3 className="text-2xl font-bold leading-tight mb-2">{book.title}</h3>
                <p className="text-sm text-white/50 font-medium mb-4">{book.subtitle}</p>
                <p className="text-white/60 leading-relaxed mb-7">{book.description}</p>
                <div className="mt-auto flex flex-col sm:flex-row gap-3">
                  <Button asChild className="bg-gold text-black font-bold hover:bg-gold/90">
                    {book.primaryExternal ? (
                      <a href={book.primaryHref} target="_blank" rel="sponsored nofollow noopener noreferrer">
                        <BookOpen className="mr-2 h-4 w-4" /> {book.primaryLabel}
                      </a>
                    ) : (
                      <Link href={book.primaryHref}>
                        <BookOpen className="mr-2 h-4 w-4" /> {book.primaryLabel}
                      </Link>
                    )}
                  </Button>
                  <Button asChild variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10">
                    {book.secondaryExternal ? (
                      <a href={book.secondaryHref} target="_blank" rel="sponsored nofollow noopener noreferrer">
                        {book.secondaryLabel}
                      </a>
                    ) : (
                      <Link href={book.secondaryHref}>{book.secondaryLabel}</Link>
                    )}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="text-xs text-white/35 mt-6">
          As an Amazon Associate, Stroke Recovery Academy earns from qualifying purchases at no extra cost to you. Choose the Academy’s digital or print edition, then use the free companion template to turn reading into a routine.
        </p>
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
              Nick Kremers had a massive hemorrhagic stroke at 36 that left him paralyzed on his left side. Seven years later, he reports regaining about 90% of his function. These are ideas drawn from his experience, not a promise or universal outcome.
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
          <div className="space-y-5">
            <div className="relative aspect-video bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl" aria-hidden="true">
              <img src={manifestoStairs} alt="" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gold/90 flex items-center justify-center">
                  <Play className="w-8 h-8 text-black fill-black ml-1" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { quote: "I was told I'd plateau at 18 months. That was 3 years ago. I'm still gaining.", name: "Maria T.", detail: "Ischemic stroke, age 52" },
                { quote: "The S.O.S. protocol got me through the worst day of my recovery. Still use it.", name: "Dave R.", detail: "Hemorrhagic stroke, age 44" },
              ].map((t, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="text-white/80 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="bg-white py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-sm font-bold tracking-widest uppercase text-gold-ink mb-4">The Toolkit</p>
          <h2 className="font-display text-neutral-900 text-4xl md:text-5xl">Everything you need to rebuild.</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
          <div className="order-2 md:order-1 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 p-8">
            <img src={cleanUi} alt="AI Coach interface" className="w-full h-auto rounded-lg border border-neutral-200" />
          </div>
          <div className="order-1 md:order-2">
            <div className="w-12 h-12 rounded-lg bg-gold/10 text-gold flex items-center justify-center mb-6"><BrainCircuit className="w-6 h-6" /></div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">AI Recovery Coach</h3>
            <p className="text-neutral-600 text-lg leading-relaxed">
              A personalized companion inspired by the Sasquatch Method. It helps you plan practical routines, adjust to how you're doing, and stay encouraged without replacing clinical care.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="w-12 h-12 rounded-lg bg-neutral-900 text-white flex items-center justify-center mb-6"><CalendarDays className="w-6 h-6" /></div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">Daily Routines & Protocols</h3>
            <p className="text-neutral-600 text-lg leading-relaxed">
              Find structured routines — from mirror therapy to mental rehearsal — that you can discuss with your care team, scale to your level, and pause for rest when needed.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 p-8">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-3">
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

function FinalCTA() {
  return (
    <section className="relative bg-black py-32 text-center overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_rgba(226,116,27,0.5),_transparent_60%)]" />
      <div className="relative z-10 max-w-3xl mx-auto px-4">
        <h2 className="font-display text-white text-5xl md:text-7xl mb-8 leading-[0.9]">Time to put in the reps.</h2>
        <p className="text-xl text-white/60 mb-12">
          Start with one practical rep, at whatever pace recovery takes. Begin when you're ready.
        </p>
        <Button
          size="lg"
          onClick={goToOnboarding}
          className="bg-gold text-black h-16 px-12 text-lg rounded-md font-semibold w-full sm:w-auto"
          data-testid="button-start-recovery-final"
        >
          Start your recovery
        </Button>
      </div>
    </section>
  );
}

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/recovery/today");
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
        title="Stroke Recovery Academy — Practical Stroke Recovery Support by Nick Kremers"
        description="A stroke recovery platform from Nick Kremers, built from therapist lessons, research, experimentation, and lived application, with practical methods, guided support, private reflection, and community."
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
              "Stroke Recovery Academy is a stroke recovery platform founded by Nick Kremers, whose practical methods come from therapist lessons, research, experimentation, documentation, and lived application.",
          },
          {
            question: "Can a stroke survivor really go from 0% to 90% recovery?",
            answer:
              "Nick Kremers reports moving from 0% function on one side to about 90% recovery. That is his personal experience, not a prediction for other survivors; every recovery is different.",
          },
        ]}
      />
      <RecoveryHeader />
      <main>
        <Hero />
        <BookSpotlight />
        <StatsStrip />
        <Method />
        <SasquatchArt />
        <Books />
        <Proof />
        <Features />
        <Caregiver />
        <Guides />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
