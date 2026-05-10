import { useEffect } from "react";
import { useLocation } from "wouter";

const SLUG_MAP: Record<string, string> = {
  workbook: "/recovery/journal",
  tracker: "/recovery/today",
  "90day": "/recovery/circuit",
  tribe: "/recovery/community",
  soundtrack: "/hostile-construction",
  officehours: "/recovery/community",
  persona: "/recovery/forge",
  plateau: "/book#mindset",
  doctrine: "/recovery/sasch",
  clinicians: "/recovery/therapist",
  ceu: "/recovery/university",
  quicksheet: "/book#clinicians",
  glossary: "/book#science",
  reading: "/book#science",
  science: "/book#science",
  walletcard: "/book#fuel",
  risk: "/recovery/quiz",
  nutrition: "/book#fuel",
  gear: "/recovery/store",
  posters: "/book#fuel",
  combos: "/book#fuel",
  letters: "/recovery/journal",
  math: "/book#structure",
  desert: "/book#structure",
  bereaved: "/book#caregivers",
  questions: "/book#structure",
  rights: "/book#structure",
  "100lines": "/book#mindset",
  podcast: "/book#soundtrack-album",
  youngsurvivor: "/book#tribe-stories",
  app: "/recovery/today",
};

// /resources/<slug> URLs are printed in Appendix K's chapter-by-chapter map.
// Every chapter gets one. Each routes to the most relevant existing page so
// readers who type these URLs from the book never hit a 404.
const RESOURCES_MAP: Record<string, string> = {
  day1: "/book#tribe-stories",
  icu: "/book#caregivers",
  foundation: "/book#mindset",
  mentor: "/recovery/community",
  architect: "/book#mindset",
  brain: "/book#science",
  neuroplasticity: "/book#science",
  wheelchair: "/recovery/protocols",
  "66day": "/recovery/today",
  tleca: "/recovery/sasch",
  twitch: "/recovery/protocols#think",
  bat: "/recovery/protocols#bat",
  weightbearing: "/recovery/protocols#weight-bearing",
  mirror: "/recovery/protocols#mirror",
  dropfoot: "/recovery/protocols#dropfoot",
  arm: "/recovery/protocols#hand",
  speech: "/recovery/protocols#speech",
  tech: "/recovery/store",
  openhand: "/recovery/protocols#open-hand",
  engine: "/recovery/anchor/today",
  persona: "/recovery/forge",
  emotional: "/recovery/coach",
  plateau: "/recovery/protocols#plateau",
  "care-audit": "/recovery/therapist",
  home: "/recovery/resources",
  family: "/book#caregivers",
  work: "/book#structure",
  tribe: "/recovery/community",
  empire: "/book#tribe-stories",
  caregiver: "/book#caregivers",
  doctrine: "/recovery/sasch",
  tuesday: "/book#tribe-stories",
  promise: "/book#mindset",
  // Bonus aliases used elsewhere in the book
  "day1-print": "/recovery/resources",
  print: "/recovery/resources",
  printable: "/recovery/resources",
};

const PROTOCOL_MAP: Record<string, string> = {
  think: "/recovery/protocols#think",
  bat: "/recovery/protocols#bat",
  "weight-bearing": "/recovery/protocols#weight-bearing",
  mirror: "/recovery/protocols#mirror",
  dropfoot: "/recovery/protocols#dropfoot",
  hand: "/recovery/protocols#hand",
  speech: "/recovery/protocols#speech",
  "open-hand": "/recovery/protocols#open-hand",
  openhand: "/recovery/protocols#open-hand",
  chopwood: "/recovery/protocols#chopwood",
  sasch: "/recovery/protocols#sasch",
  print: "/recovery/resources",
  // Appendix K printable protocol cards
  ankle: "/recovery/protocols#dropfoot",
  heelwalk: "/recovery/protocols#dropfoot",
  walllean: "/recovery/protocols#weight-bearing",
  grip: "/recovery/protocols#hand",
  rubberband: "/recovery/protocols#hand",
  fingerlift: "/recovery/protocols#hand",
  conetap: "/recovery/protocols#hand",
  lsvt: "/recovery/protocols#speech",
  dia: "/recovery/protocols#speech",
  oralmotor: "/recovery/protocols#speech",
  readaloud: "/recovery/protocols#speech",
  swallow: "/recovery/protocols#speech",
  sit2stand: "/recovery/protocols#weight-bearing",
  sls: "/recovery/protocols#weight-bearing",
};

function resolve(path: string): string {
  const cleaned = path.replace(/^\/+/, "").replace(/\/+$/, "");
  if (cleaned.startsWith("protocols/")) {
    const key = cleaned.slice("protocols/".length);
    return PROTOCOL_MAP[key] ?? "/recovery/protocols";
  }
  if (cleaned.startsWith("resources/")) {
    const key = cleaned.slice("resources/".length);
    return RESOURCES_MAP[key] ?? "/recovery/resources";
  }
  if (cleaned === "resources") return "/recovery/resources";
  if (cleaned === "protocols") return "/recovery/protocols";
  if (cleaned === "book/index") return "/book";
  if (cleaned.startsWith("science/")) return "/book#science";
  return SLUG_MAP[cleaned] ?? "/book";
}

export default function BookSlugRedirect() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const target = resolve(location);
    setLocation(target, { replace: true });
  }, [location, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-book-redirect">
      <div className="text-sm text-muted-foreground">Loading the right resource…</div>
    </div>
  );
}
