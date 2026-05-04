import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Brain,
  Coffee,
  Flame,
  Heart,
  Mic,
  Moon,
  Quote,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";

interface PresetSummary {
  slug: string;
  title: string;
  subtitle: string;
  lengthLabel: string;
  intensity: "gentle" | "standard" | "power";
  completionXp: number;
  totalSeconds: number;
  stationCount: number;
  stations: Array<{ id: string; type: string; title: string; durationSeconds: number }>;
}

interface PresetsResponse {
  presets: PresetSummary[];
  recommendedSlug: string;
}

interface RecentResponse {
  items: Array<{
    id: number;
    circuitSlug: string;
    startedAt: string;
    completedAt: string | null;
    stationsCompleted: number;
    totalStations: number;
    xpEarned: number;
  }>;
  streak: number;
}

const STATION_ICON: Record<string, JSX.Element> = {
  open: <Sparkles className="w-3.5 h-3.5" />,
  check_in: <Heart className="w-3.5 h-3.5" />,
  breath: <Activity className="w-3.5 h-3.5" />,
  brain_quick: <Brain className="w-3.5 h-3.5" />,
  word_quick: <Brain className="w-3.5 h-3.5" />,
  dexterity: <Zap className="w-3.5 h-3.5" />,
  hydration: <Coffee className="w-3.5 h-3.5" />,
  coach: <Mic className="w-3.5 h-3.5" />,
  community: <Heart className="w-3.5 h-3.5" />,
  reflection: <Quote className="w-3.5 h-3.5" />,
  close: <Moon className="w-3.5 h-3.5" />,
};

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  return m < 1 ? `${sec}s` : `${m} min`;
}

export default function RecoveryCircuit() {
  const { isAuthenticated } = useAuth();
  const presets = useQuery<PresetsResponse>({
    queryKey: ["/api/circuit/presets"],
  });
  const recent = useQuery<RecentResponse>({
    queryKey: ["/api/circuit/session/recent"],
    enabled: isAuthenticated,
  });

  const ordered = useMemo(() => {
    if (!presets.data) return [];
    return [...presets.data.presets].sort((a, b) => a.totalSeconds - b.totalSeconds);
  }, [presets.data]);
  const recommended = presets.data?.recommendedSlug;

  return (
    <div className="min-h-screen bg-background">
      <RecoverySEO
        title="Daily Circuit | Stroke Recovery Academy"
        description="One guided session that strings together brain games, exercises, hydration, coach moments, and community — paced with voice cues from Nick."
        canonical="/recovery/circuit"
      />
      <RecoveryHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-3">
          <Badge variant="secondary">
            <Flame className="w-3 h-3 mr-1" /> Daily Circuit
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            One session. One streak. One number that goes up.
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            The Daily Circuit strings together everything in the platform —
            check-in, brain games, exercises, hydration, a coach moment, and
            community — in one paced ritual. Voice cues between stations are
            in Nick's voice. Pick a length and press start.
          </p>
        </header>

        {isAuthenticated && recent.data && (
          <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-md bg-primary/10 p-3">
                <Flame className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-circuit-streak">
                  {recent.data.streak} day{recent.data.streak === 1 ? "" : "s"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Circuit streak ·{" "}
                  {recent.data.items.filter((i) => i.completedAt).length} completed total
                </div>
              </div>
            </div>
            {recent.data.streak === 0 && (
              <p className="text-sm text-muted-foreground max-w-xs text-right">
                No streak yet — today is day one. Or day one again. Both count.
              </p>
            )}
          </Card>
        )}

        <section className="grid gap-6 md:grid-cols-3">
          {presets.isLoading &&
            [0, 1, 2].map((i) => (
              <Card key={i} className="p-6 h-72 animate-pulse bg-muted/30" />
            ))}
          {ordered.map((p) => {
            const isRecommended = p.slug === recommended;
            return (
              <Card
                key={p.slug}
                className={`p-6 flex flex-col gap-4 hover-elevate ${
                  isRecommended ? "border-primary/60" : ""
                }`}
                data-testid={`card-circuit-${p.slug}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <Badge variant={isRecommended ? "default" : "secondary"}>
                      {p.lengthLabel}
                    </Badge>
                    <h2 className="text-xl font-semibold">{p.title}</h2>
                    <p className="text-sm text-muted-foreground">{p.subtitle}</p>
                  </div>
                  {isRecommended && (
                    <Badge className="shrink-0">Today</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs">
                  {p.stations
                    .filter((s) => s.type !== "open" && s.type !== "close")
                    .slice(0, 8)
                    .map((s) => (
                      <Badge
                        key={s.id}
                        variant="outline"
                        className="font-normal"
                      >
                        {STATION_ICON[s.type]}
                        <span className="ml-1">{s.title}</span>
                      </Badge>
                    ))}
                  {p.stations.length > 8 && (
                    <Badge variant="outline" className="font-normal">
                      +{p.stations.length - 8} more
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-auto">
                  <span className="inline-flex items-center gap-1">
                    <Timer className="w-3 h-3" /> {fmt(p.totalSeconds)} ·{" "}
                    {p.stationCount} stations
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> +{p.completionXp} XP
                  </span>
                </div>

                <Button
                  asChild
                  size="lg"
                  variant={isRecommended ? "default" : "outline"}
                  className="w-full"
                  data-testid={`button-start-${p.slug}`}
                >
                  <Link href={`/recovery/circuit/${p.slug}`}>
                    Start {p.title}
                  </Link>
                </Button>
              </Card>
            );
          })}
        </section>

        <section className="rounded-md border bg-card/40 p-6 space-y-3">
          <h2 className="text-lg font-semibold">Why circuits?</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Recovery falls apart when it's six different apps — exercise here,
            crossword there, journaling somewhere else. The Daily Circuit puts
            them all in one paced session so you build the ritual instead of
            chasing the features. Bad day? Run the Quick. Good day? Push the
            Power. Either way, the streak holds.
          </p>
          <p className="text-xs text-muted-foreground">
            Bridge audio between stations is Nick's voice, generated once and
            cached. No buzzers — soft cues only. Pause anytime.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
