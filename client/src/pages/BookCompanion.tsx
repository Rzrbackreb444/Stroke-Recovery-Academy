import { useEffect } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import RecoverySEO from "@/components/RecoverySEO";
import {
  BookOpen, Headphones, Users, Calendar, Compass, Stethoscope,
  Brain, Hand, Footprints, MessageCircle, Heart, Target,
  ListChecks, FileText, GraduationCap, Quote, Wrench, Library,
  Activity, Zap, Shield, ArrowRight, Mail
} from "lucide-react";

type ResourceLink = {
  slug: string;
  label: string;
  description: string;
  href: string;
  external?: boolean;
};

type Section = {
  id: string;
  title: string;
  blurb: string;
  links: ResourceLink[];
};

const QUICK_ACTIONS: ResourceLink[] = [
  { slug: "workbook", label: "Companion Workbook", description: "Chapter prompts + drill logs", href: "/recovery/journal" },
  { slug: "tracker", label: "90-Day Tracker", description: "Daily breakthrough check-in", href: "/recovery/today" },
  { slug: "90day", label: "90-Day Program", description: "Three-phase daily protocol", href: "/recovery/circuit" },
  { slug: "tribe", label: "The Tribe", description: "Survivor community", href: "/recovery/community" },
  { slug: "soundtrack", label: "Hostile Construction", description: "12-track recovery album", href: "/hostile-construction" },
  { slug: "officehours", label: "Office Hours", description: "Live Q&A with Nick", href: "/recovery/community" },
  { slug: "coach", label: "Sasquatch Coach", description: "AI coach trained on the book", href: "/recovery/coach" },
  { slug: "anchor", label: "Today's Anchor", description: "Daily mindset anchor", href: "/recovery/anchor/today" },
];

const SECTIONS: Section[] = [
  {
    id: "protocols",
    title: "The Drills (Appendix B + Chapters 11–19)",
    blurb: "Every protocol referenced in the book — with video demos in the academy library.",
    links: [
      { slug: "think", label: "Think → Twitch → Move", description: "Ch 11 — the core neuroplasticity progression", href: "/recovery/protocols#think" },
      { slug: "bat", label: "Baseball Bat Therapy", description: "Ch 12 — the bilateral swing protocol", href: "/recovery/protocols#bat" },
      { slug: "weight-bearing", label: "Weight Bearing & Negative Pressure", description: "Ch 13 — load the limb", href: "/recovery/protocols#weight-bearing" },
      { slug: "mirror", label: "Mirror Therapy", description: "Ch 14 — the brain's optical illusion", href: "/recovery/protocols#mirror" },
      { slug: "dropfoot", label: "Drop Foot Destruction", description: "Ch 15 — toe-up rebuild", href: "/recovery/protocols#dropfoot" },
      { slug: "hand", label: "Arm & Hand Recovery", description: "Ch 16 — dead weight to dynamic power", href: "/recovery/protocols#hand" },
      { slug: "speech", label: "Speech Comeback", description: "Ch 17 — finding your voice again", href: "/recovery/protocols#speech" },
      { slug: "open-hand", label: "Open Hand Protocol", description: "Ch 19 — beat spasticity before it wins", href: "/recovery/protocols#open-hand" },
      { slug: "chopwood", label: "Chopping Wood (Builder's Science)", description: "Sidebar — the daily metaphor", href: "/recovery/protocols#chopwood" },
      { slug: "sasch", label: "S.A.S.C.H. Daily Rhythm", description: "Appendix I — Seize / Absorb / Swing / Combine / Hammer", href: "/recovery/protocols#sasch" },
      { slug: "print", label: "Printable Protocol Cards", description: "Wallet-card size for clinic + home", href: "/recovery/resources" },
    ],
  },
  {
    id: "mindset",
    title: "Mindset & Doctrine (Chapters 20½ / 22½ / 29½ + Appendices I/J/U)",
    blurb: "The four-layer Sasquatch operating system.",
    links: [
      { slug: "doctrine", label: "The Sasquatch Doctrine OS", description: "Appendix I — daily operating card", href: "/recovery/sasch" },
      { slug: "persona", label: "The Persona Forge", description: "Ch 20½ — build the version of you that survives", href: "/recovery/forge" },
      { slug: "plateau", label: "The Plateau Wars", description: "Ch 22 — five mutations to break the wall", href: "/recovery/protocols#plateau" },
      { slug: "100lines", label: "The Sasquatch in 100 Lines", description: "Appendix U — pull-quote library", href: "/recovery/resources#quotes" },
      { slug: "letters", label: "Letters to the Old Me", description: "Appendix O — write yours", href: "/recovery/journal#letters" },
      { slug: "anchor-today", label: "Today's Anchor", description: "Daily one-line anchor", href: "/recovery/anchor/today" },
    ],
  },
  {
    id: "tribe-stories",
    title: "Stories from the Tribe (Part VII)",
    blurb: "Nine survivor case studies — not testimonials. The patterns prove the spine holds weight.",
    links: [
      { slug: "tribe-feed", label: "The Tribe", description: "Survivor community feed", href: "/recovery/community" },
      { slug: "spotlight", label: "Spotlight Stories", description: "Featured survivor profiles", href: "/recovery/spotlight" },
      { slug: "youngsurvivor", label: "Young Survivor Track", description: "Under-25 cohort (Jordan's story, AVM, athletes)", href: "/recovery/community" },
      { slug: "circles", label: "Recovery Circles", description: "Small-group accountability", href: "/recovery/circles" },
      { slug: "buddy", label: "Recovery Buddy", description: "1:1 survivor pairings", href: "/recovery/buddy" },
    ],
  },
  {
    id: "fuel",
    title: "Fuel & Gear (Appendix C + D + Chapter 19)",
    blurb: "Nutrition, sleep, equipment — the recovery infrastructure.",
    links: [
      { slug: "nutrition", label: "Nutrition for Brain Recovery", description: "MIND diet + supplements + sample day", href: "/recovery/resources#nutrition" },
      { slug: "gear", label: "Technology & Equipment Guide", description: "Bioness, splints, mirrors, e-stim — what earns its spot", href: "/recovery/store" },
      { slug: "combos", label: "Combo Protocols", description: "Drill-stack combinations that compound", href: "/recovery/protocols#combos" },
      { slug: "posters", label: "Printable Posters", description: "Wall-mount the doctrine", href: "/recovery/resources#posters" },
      { slug: "walletcard", label: "FAST/BE-FAST Wallet Card", description: "Appendix A — emergency stroke recognition", href: "/recovery/resources#walletcard" },
      { slug: "risk", label: "Stroke Risk Self-Assessment", description: "Appendix A — risk factor checklist", href: "/recovery/quiz" },
    ],
  },
  {
    id: "structure",
    title: "Structure & Programs (Appendix G + Chapter 9)",
    blurb: "The 90-day breakthrough scaffold.",
    links: [
      { slug: "90day-program", label: "90-Day Breakthrough Program", description: "Appendix G — three phases, daily template", href: "/recovery/circuit" },
      { slug: "tracker-daily", label: "Daily Tracker", description: "Check-ins, reps logged, anchors set", href: "/recovery/today" },
      { slug: "math", label: "The Recovery Math", description: "Appendix P — five levers, worked examples", href: "/recovery/resources#math" },
      { slug: "desert", label: "The First Year Desert", description: "Appendix Q — what nobody warns you about", href: "/recovery/resources#desert" },
      { slug: "questions", label: "40 Questions for Your Care Team", description: "Appendix S — clinic-ready printable", href: "/recovery/resources#questions" },
      { slug: "rights", label: "Survivor's Bill of Rights", description: "Appendix T", href: "/recovery/resources#rights" },
    ],
  },
  {
    id: "clinicians",
    title: "For Clinicians & Care Teams (Appendix L)",
    blurb: "Therapist-facing resources, the CEU course, and the clinical quick-sheet.",
    links: [
      { slug: "clinicians-home", label: "Clinician Hub", description: "Appendix L — for therapists and care teams", href: "/recovery/therapist" },
      { slug: "ceu", label: "CEU Course", description: "Continuing-education credit on the Sasquatch method", href: "/recovery/university" },
      { slug: "quicksheet", label: "Clinical Quick-Sheet", description: "One-pager for the chart binder", href: "/recovery/resources#quicksheet" },
      { slug: "therapist-marketplace", label: "Find a Sasquatch-Aligned Therapist", description: "Vetted directory", href: "/recovery/center-finder" },
    ],
  },
  {
    id: "science",
    title: "Science & References (Appendix H + Builder's Science Sidebars)",
    blurb: "Every claim, every citation, the corrections inbox.",
    links: [
      { slug: "science-home", label: "Science Reference Index", description: "Appendix H — APA-7 citations by topic", href: "/recovery/resources#science" },
      { slug: "science-corrections", label: "Corrections Inbox", description: "Spotted an error? Tell us.", href: "/recovery/resources#corrections" },
      { slug: "glossary", label: "Stroke Recovery Glossary", description: "Appendix M — every term explained", href: "/recovery/resources#glossary" },
      { slug: "reading", label: "Recommended Reading", description: "Appendix N — books, podcasts, film, album", href: "/recovery/resources#reading" },
    ],
  },
  {
    id: "caregivers",
    title: "For Caregivers (Chapter 28 + Appendix R)",
    blurb: "The field manual for the people doing the second-hardest job in the room.",
    links: [
      { slug: "caregiver-manual", label: "Caregiver's Field Manual", description: "Ch 28 — the full chapter, online", href: "/recovery/resources#caregiver" },
      { slug: "bereaved", label: "For the Caregiver Whose Survivor Did Not Make It", description: "Appendix R", href: "/recovery/resources#bereaved" },
      { slug: "caregiver-settings", label: "Caregiver Account Access", description: "Add a caregiver to your dashboard", href: "/settings/caregivers" },
    ],
  },
  {
    id: "soundtrack-album",
    title: "The Soundtrack — Hostile Construction",
    blurb: "Twelve tracks. The album that scores the book chapter by chapter.",
    links: [
      { slug: "album-home", label: "Hostile Construction (full album)", description: "Stream + Track Sync notes", href: "/hostile-construction" },
      { slug: "podcast", label: "The Sasquatch Podcast", description: "Behind the book, behind the album", href: "/recovery/community" },
      { slug: "radio", label: "Sasquatch Radio", description: "24/7 stream", href: "/recovery/radio" },
      { slug: "anthem", label: "Build Your Recovery Anthem", description: "Custom track for your story", href: "/recovery/anthem" },
    ],
  },
];

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
    <div className="min-h-screen bg-background" data-testid="page-book-companion">
      <RecoverySEO
        title="The Ultimate Stroke Recovery Revolution — Book Companion"
        description="Every protocol, every appendix, every resource referenced in Nick Kremers' stroke recovery book — wired live into the Stroke Recovery Academy."
        canonical="/book"
      />

      <section className="border-b bg-gradient-to-b from-card to-background">
        <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
          <Badge variant="secondary" className="mb-4" data-testid="badge-companion">Book Companion</Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3" data-testid="text-book-title">
            THE ULTIMATE STROKE RECOVERY REVOLUTION
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-2" data-testid="text-book-subtitle">
            From 0 to 90 — A No-BS Battle Manual by Nick Kremers
          </p>
          <p className="text-sm text-muted-foreground italic mb-6" data-testid="text-tagline">
            Heart's still thumpin'. Reps still rep.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" data-testid="button-start-90day">
              <Link href="/recovery/circuit">
                <Calendar className="mr-2 h-4 w-4" />
                Start the 90-Day Program
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" data-testid="button-meet-coach">
              <Link href="/recovery/coach">
                <MessageCircle className="mr-2 h-4 w-4" />
                Talk to the Sasquatch Coach
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" data-testid="button-join-tribe">
              <Link href="/recovery/community">
                <Users className="mr-2 h-4 w-4" />
                Join the Tribe
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-xl font-semibold mb-4" data-testid="text-quick-actions-heading">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((q) => (
            <Card key={q.slug} className="p-4 hover-elevate" data-testid={`card-quick-${q.slug}`}>
              <Link href={q.href} className="block">
                <div className="font-semibold mb-1">{q.label}</div>
                <div className="text-xs text-muted-foreground">{q.description}</div>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 pb-16 space-y-10">
        <div>
          <h2 className="text-2xl font-bold mb-2" data-testid="text-toc-heading">Resource Index</h2>
          <p className="text-sm text-muted-foreground">
            Every URL printed in the book lives here. Bookmark this page — it is the master index.
          </p>
        </div>

        {SECTIONS.map((section) => (
          <Card key={section.id} id={section.id} className="p-6 scroll-mt-20" data-testid={`section-${section.id}`}>
            <h3 className="text-xl font-semibold mb-1" data-testid={`heading-${section.id}`}>{section.title}</h3>
            <p className="text-sm text-muted-foreground mb-5">{section.blurb}</p>
            <Separator className="mb-5" />
            <div className="grid gap-3 sm:grid-cols-2">
              {section.links.map((link) => (
                <Link
                  key={link.slug}
                  href={link.href}
                  className="block rounded-md border p-3 hover-elevate"
                  data-testid={`link-${section.id}-${link.slug}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{link.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{link.description}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        ))}

        <Card className="p-6 bg-card" data-testid="section-foundation">
          <h3 className="text-xl font-semibold mb-2">Stroke Lyfe Inc. — the 501(c)(3)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Stroke Recovery Academy is the platform. Stroke Lyfe Inc. is the nonprofit that funds free access for survivors who cannot pay.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" data-testid="button-strokelyfe">
              <a href="https://strokelyfe.org/donate" target="_blank" rel="noopener noreferrer">
                <Heart className="mr-2 h-4 w-4" />
                Donate to Stroke Lyfe Inc.
              </a>
            </Button>
            <Button asChild variant="outline" data-testid="button-scholarship">
              <Link href="/recovery/scholarship">
                <Shield className="mr-2 h-4 w-4" />
                Apply for a Scholarship
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
