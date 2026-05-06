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

const PROTOCOL_MAP: Record<string, string> = {
  think: "/recovery/protocols#think",
  bat: "/recovery/protocols#bat",
  "weight-bearing": "/recovery/protocols#weight-bearing",
  mirror: "/recovery/protocols#mirror",
  dropfoot: "/recovery/protocols#dropfoot",
  hand: "/recovery/protocols#hand",
  speech: "/recovery/protocols#speech",
  "open-hand": "/recovery/protocols#open-hand",
  chopwood: "/recovery/protocols#chopwood",
  sasch: "/recovery/protocols#sasch",
  print: "/recovery/resources",
};

function resolve(path: string): string {
  const cleaned = path.replace(/^\/+/, "").replace(/\/+$/, "");
  if (cleaned.startsWith("protocols/")) {
    const key = cleaned.slice("protocols/".length);
    return PROTOCOL_MAP[key] ?? "/recovery/protocols";
  }
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
