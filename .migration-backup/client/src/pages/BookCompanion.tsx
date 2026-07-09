import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import {
  BookOpen, Headphones, Users, Calendar, MessageCircle, Heart,
  Shield, ArrowRight, BookMarked, Mic, Radio, Dumbbell,
  Brain, FlaskConical, FileText, Stethoscope, HelpCircle
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: "Read the Book",        sub: "In-platform reader",          href: "/book/read",              icon: BookMarked },
  { label: "Buy the Book",         sub: "Digital $19 · Print $29",     href: "/book/buy",               icon: BookOpen },
  { label: "Companion Workbook",   sub: "Chapter prompts + drill logs", href: "/recovery/journal",       icon: FileText },
  { label: "90-Day Tracker",       sub: "Daily breakthrough check-in",  href: "/recovery/today",         icon: Calendar },
  { label: "90-Day Program",       sub: "Three-phase daily protocol",   href: "/recovery/circuit",       icon: Dumbbell },
  { label: "The Tribe",            sub: "Survivor community",           href: "/recovery/community",     icon: Users },
  { label: "Hostile Construction", sub: "12-track recovery album",      href: "/hostile-construction",   icon: Headphones },
  { label: "Sasquatch Coach",      sub: "AI coach trained on the book", href: "/recovery/coach",         icon: MessageCircle },
  { label: "Today's Anchor",       sub: "Daily mindset anchor",         href: "/recovery/anchor/today",  icon: Brain },
  { label: "Sasquatch Radio",      sub: "24/7 stream",                  href: "/recovery/radio",         icon: Radio },
];

type ResourceLink = { label: string; description: string; href: string };
type Section = { id: string; title: string; chapter: string; blurb: string; icon: any; links: ResourceLink[] };

const SECTIONS: Section[] = [
  {
    id: "protocols",
    title: "The Drills",
    chapter: "Appendix B + Chapters 11–19",
    blurb: "Every protocol in the book, with video demos in the academy library.",
    icon: Dumbbell,
    links: [
      { label: "Think → Twitch → Move",             description: "Ch 11 — the core neuroplasticity progression",    href: "/recovery/protocols#think" },
      { label: "Baseball Bat Therapy",               description: "Ch 12 — the bilateral swing protocol",            href: "/recovery/protocols#bat" },
      { label: "Weight Bearing & Negative Pressure", description: "Ch 13 — load the limb",                          href: "/recovery/protocols#weight-bearing" },
      { label: "Mirror Therapy",                     description: "Ch 14 — the brain's optical illusion",            href: "/recovery/protocols#mirror" },
      { label: "Drop Foot Destruction",              description: "Ch 15 — toe-up rebuild",                          href: "/recovery/protocols#dropfoot" },
      { label: "Arm & Hand Recovery",                description: "Ch 16 — dead weight to dynamic power",            href: "/recovery/protocols#hand" },
      { label: "Speech Comeback",                    description: "Ch 17 — finding your voice again",                href: "/recovery/protocols#speech" },
      { label: "Open Hand Protocol",                 description: "Ch 19 — beat spasticity before it wins",          href: "/recovery/protocols#open-hand" },
      { label: "S.A.S.C.H. Daily Rhythm",            description: "Appendix I — Seize/Absorb/Swing/Combine/Hammer",  href: "/recovery/protocols#sasch" },
      { label: "Printable Protocol Cards",           description: "Wallet-card size for clinic + home",              href: "/recovery/resources" },
    ],
  },
  {
    id: "mindset",
    title: "Mindset & Doctrine",
    chapter: "Ch 20½ · 22½ · 29½ + App. I/J/U",
    blurb: "The four-layer Sasquatch operating system.",
    icon: Brain,
    links: [
      { label: "The Sasquatch Doctrine OS",    description: "Appendix I — daily operating card",                  href: "/recovery/sasch" },
      { label: "The Persona Forge",            description: "Ch 20½ — build the version of you that survives",   href: "/recovery/forge" },
      { label: "The Plateau Wars",             description: "Ch 22 — five mutations to break the wall",           href: "/recovery/protocols#plateau" },
      { label: "The Sasquatch in 100 Lines",   description: "Appendix U — pull-quote library",                    href: "/recovery/resources#quotes" },
      { label: "Letters to the Old Me",        description: "Appendix O — write yours",                           href: "/recovery/journal#letters" },
      { label: "Today's Anchor",               description: "Daily one-line anchor",                              href: "/recovery/anchor/today" },
    ],
  },
  {
    id: "tribe-stories",
    title: "Stories from the Tribe",
    chapter: "Part VII",
    blurb: "Nine survivor case studies. Not testimonials — the patterns prove the spine holds weight.",
    icon: Users,
    links: [
      { label: "The Tribe",          description: "Survivor community feed",             href: "/recovery/community" },
      { label: "Spotlight Stories",  description: "Featured survivor profiles",          href: "/recovery/spotlight" },
      { label: "Recovery Circles",   description: "Small-group accountability",          href: "/recovery/circles" },
      { label: "Recovery Buddy",     description: "1:1 survivor pairings",               href: "/recovery/buddy" },
    ],
  },
  {
    id: "structure",
    title: "Structure & Programs",
    chapter: "Appendix G + Chapter 9",
    blurb: "The 90-day breakthrough scaffold.",
    icon: Calendar,
    links: [
      { label: "90-Day Breakthrough Program",    description: "Appendix G — three phases, daily template",          href: "/recovery/circuit" },
      { label: "Daily Tracker",                  description: "Check-ins, reps logged, anchors set",                href: "/recovery/today" },
      { label: "The Recovery Math",              description: "Appendix P — five levers, worked examples",          href: "/recovery/resources#math" },
      { label: "The First Year Desert",          description: "Appendix Q — what nobody warns you about",           href: "/recovery/resources#desert" },
      { label: "40 Questions for Your Care Team",description: "Appendix S — clinic-ready printable",                href: "/recovery/resources#questions" },
      { label: "Survivor's Bill of Rights",      description: "Appendix T",                                         href: "/recovery/resources#rights" },
    ],
  },
  {
    id: "fuel",
    title: "Fuel & Gear",
    chapter: "Appendix C + D + Chapter 19",
    blurb: "Nutrition, sleep, equipment — the recovery infrastructure.",
    icon: FlaskConical,
    links: [
      { label: "Nutrition for Brain Recovery",    description: "MIND diet + supplements + sample day",             href: "/recovery/resources#nutrition" },
      { label: "Technology & Equipment Guide",    description: "Bioness, splints, mirrors, e-stim",                href: "/recovery/store" },
      { label: "FAST/BE-FAST Wallet Card",        description: "Appendix A — emergency stroke recognition",        href: "/recovery/resources#walletcard" },
      { label: "Stroke Risk Self-Assessment",     description: "Appendix A — risk factor checklist",              href: "/recovery/quiz" },
    ],
  },
  {
    id: "clinicians",
    title: "For Clinicians & Care Teams",
    chapter: "Appendix L",
    blurb: "Therapist-facing resources, CEU course, and the clinical quick-sheet.",
    icon: Stethoscope,
    links: [
      { label: "Clinician Hub",                        description: "Appendix L — for therapists and care teams",   href: "/recovery/therapist" },
      { label: "CEU Course",                           description: "Continuing-education on the Sasquatch method", href: "/recovery/university" },
      { label: "Clinical Quick-Sheet",                 description: "One-pager for the chart binder",               href: "/recovery/resources#quicksheet" },
      { label: "Find a Sasquatch-Aligned Therapist",  description: "Vetted directory",                              href: "/recovery/center-finder" },
    ],
  },
  {
    id: "science",
    title: "Science & References",
    chapter: "Appendix H + Builder's Science Sidebars",
    blurb: "Every claim, every citation, the corrections inbox.",
    icon: FlaskConical,
    links: [
      { label: "Science Reference Index",  description: "Appendix H — APA-7 citations by topic",   href: "/recovery/resources#science" },
      { label: "Stroke Recovery Glossary", description: "Appendix M — every term explained",        href: "/recovery/resources#glossary" },
      { label: "Recommended Reading",      description: "Appendix N — books, podcasts, film",       href: "/recovery/resources#reading" },
      { label: "Corrections Inbox",        description: "Spotted an error? Tell us.",               href: "/recovery/resources#corrections" },
    ],
  },
  {
    id: "caregivers",
    title: "For Caregivers",
    chapter: "Chapter 28 + Appendix R",
    blurb: "The field manual for the people doing the second-hardest job in the room.",
    icon: Heart,
    links: [
      { label: "Caregiver's Field Manual",                          description: "Ch 28 — the full chapter, online",            href: "/recovery/resources#caregiver" },
      { label: "For the Caregiver Whose Survivor Didn't Make It",  description: "Appendix R",                                   href: "/recovery/resources#bereaved" },
      { label: "Caregiver Account Access",                         description: "Add a caregiver to your dashboard",            href: "/settings/caregivers" },
    ],
  },
  {
    id: "soundtrack",
    title: "The Soundtrack",
    chapter: "Hostile Construction",
    blurb: "Twelve tracks. The album that scores the book chapter by chapter.",
    icon: Headphones,
    links: [
      { label: "Hostile Construction (full album)",  description: "Stream + Track Sync notes",         href: "/hostile-construction" },
      { label: "Build Your Recovery Anthem",         description: "Custom track for your story",       href: "/recovery/anthem" },
      { label: "Sasquatch Podcast",                  description: "Behind the book, behind the album", href: "/recovery/community" },
      { label: "Sasquatch Radio",                    description: "24/7 stream",                       href: "/recovery/radio" },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookCompanion() {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="page-book-companion">
      <RecoverySEO
        title="Book Companion — The Ultimate Stroke Recovery Revolution"
        description="Every protocol, appendix, and resource from Nick Kremers' stroke recovery book — wired live into the Stroke Recovery Academy. 314 pages, 30 chapters, 17 appendices, 9 case studies."
        canonical="/book"
        keywords={[
          "stroke recovery book companion",
          "Nick Kremers book",
          "Sasquatch Method",
          "stroke survivor manual",
          "90-day recovery program",
          "neuroplasticity exercises",
        ]}
        breadcrumbs={[
          { name: "Recovery", url: "/recovery" },
          { name: "Book", url: "/book" },
        ]}
        faq={[
          { question: "What is The Ultimate Stroke Recovery Revolution?", answer: "A 314-page survivor-built recovery manual by Nick Kremers covering 30 chapters, 17 appendices, 9 case studies, and a full 90-day breakthrough program." },
          { question: "Where can I buy it?", answer: "Digital PDF ($19) and 6×9 print paperback ($29) at strokerecoveryacademy.com/book/buy." },
          { question: "Does the book replace medical care?", answer: "No. It is informational and built from one survivor's lived experience. Always consult your healthcare provider." },
        ]}
      />

      <GlobalHeader />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
          <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-5">
            Stroke Recovery Academy Publishing · 2026 · Companion Index
          </p>
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
            <div>
              <h1
                className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.08] mb-3"
                style={{ fontFamily: "var(--font-serif)" }}
                data-testid="text-book-title"
              >
                The Ultimate Stroke Recovery Revolution
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl" data-testid="text-book-subtitle">
                Every URL in the book lives here. Every protocol, appendix, and resource wired live into the platform.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <Button asChild size="lg" className="gap-2 bg-amber-600 hover:bg-amber-700 text-white" data-testid="button-read">
                <Link href="/book/read">
                  <BookMarked className="w-4 h-4" />
                  Read the book
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" data-testid="button-buy">
                <Link href="/book/buy">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Buy — $19 / $29
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick links ──────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-10 max-w-6xl">
        <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-6">
          Quick access
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-border/40 rounded-sm overflow-hidden border border-border/40">
          {QUICK_LINKS.map(({ label, sub, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col gap-1.5 px-4 py-4 bg-background hover:bg-card/80 transition-colors group"
              data-testid={`quick-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon className="w-4 h-4 text-amber-500 mb-0.5" />
              <span className="text-sm font-medium leading-snug group-hover:text-amber-400 transition-colors">{label}</span>
              <span className="text-xs text-muted-foreground leading-snug">{sub}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Section divider ─────────────────────────────────────── */}
      <div className="container mx-auto px-4 max-w-6xl">
        <Separator className="opacity-40" />
      </div>

      {/* ── Resource index ──────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-10 max-w-6xl">
        <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-8">
          Resource index
        </p>

        <div className="space-y-0 divide-y divide-border/40">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                id={section.id}
                className="py-8 scroll-mt-20 grid md:grid-cols-[260px_1fr] gap-6 md:gap-12"
                data-testid={`section-${section.id}`}
              >
                {/* Left label */}
                <div className="shrink-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <h2
                      className="text-base font-semibold"
                      data-testid={`heading-${section.id}`}
                    >
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {section.chapter}
                  </p>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    {section.blurb}
                  </p>
                </div>

                {/* Right links */}
                <div className="grid sm:grid-cols-2 gap-1">
                  {section.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="group flex items-start justify-between gap-3 py-2.5 px-3 rounded-sm hover:bg-card/60 transition-colors"
                      data-testid={`link-${section.id}-${link.label.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-snug group-hover:text-amber-400 transition-colors truncate">
                          {link.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          {link.description}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-0.5 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Nonprofit footer band ──────────────────────────────── */}
      <section className="border-t border-border/50 bg-card/30 mt-4">
        <div className="container mx-auto px-4 py-10 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-3">
                Stroke Lyfe Inc. · 501(c)(3)
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stroke Recovery Academy is the platform. Stroke Lyfe Inc. is the nonprofit
                that funds free access for survivors who cannot pay. Every book purchase
                supports the mission directly.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" data-testid="button-strokelyfe">
                <a href="https://strokelyfe.org/donate" target="_blank" rel="noopener noreferrer">
                  <Heart className="w-4 h-4 mr-2" />
                  Donate to Stroke Lyfe Inc.
                </a>
              </Button>
              <Button asChild variant="outline" data-testid="button-scholarship">
                <Link href="/recovery/scholarship">
                  <Shield className="w-4 h-4 mr-2" />
                  Apply for a Scholarship
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
