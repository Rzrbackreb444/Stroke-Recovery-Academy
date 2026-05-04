import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Brain,
  Check,
  Coffee,
  Flame,
  Heart,
  Home,
  Mic,
  Moon,
  Pause,
  Play,
  Quote,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import RecoverySEO from "@/components/RecoverySEO";

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

type StationType =
  | "open" | "check_in" | "breath" | "brain_quick" | "dexterity"
  | "word_quick" | "hydration" | "coach" | "community" | "reflection" | "close";

interface Station {
  id: string;
  type: StationType;
  title: string;
  instruction: string;
  durationSeconds: number;
  config?: Record<string, any>;
}

interface PresetResponse {
  preset: {
    slug: string;
    title: string;
    subtitle: string;
    completionXp: number;
    totalSeconds: number;
    stationCount: number;
    stations: Station[];
  };
}

interface SessionStartResponse {
  session: { id: number; circuitSlug: string; totalStations: number };
  preset: PresetResponse["preset"];
}

interface BridgeQuote {
  id: string;
  text: string;
  category: string;
  intensity: string;
  audioUrl: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// Tiny helpers
// ──────────────────────────────────────────────────────────────────────

const STATION_ICON: Record<StationType, JSX.Element> = {
  open: <Sparkles className="w-5 h-5" />,
  check_in: <Heart className="w-5 h-5" />,
  breath: <Activity className="w-5 h-5" />,
  brain_quick: <Brain className="w-5 h-5" />,
  word_quick: <Brain className="w-5 h-5" />,
  dexterity: <Zap className="w-5 h-5" />,
  hydration: <Coffee className="w-5 h-5" />,
  coach: <Mic className="w-5 h-5" />,
  community: <Heart className="w-5 h-5" />,
  reflection: <Quote className="w-5 h-5" />,
  close: <Moon className="w-5 h-5" />,
};

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

// ──────────────────────────────────────────────────────────────────────
// Player
// ──────────────────────────────────────────────────────────────────────

export default function RecoveryCircuitPlayer() {
  const [, params] = useRoute<{ slug: string }>("/recovery/circuit/:slug");
  const slug = params?.slug || "standard";
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [presetTitle, setPresetTitle] = useState<string>("");
  const [completionXp, setCompletionXp] = useState<number>(0);
  const [stationIdx, setStationIdx] = useState<number>(-1); // -1 = pre-start
  const [paused, setPaused] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [bridge, setBridge] = useState<BridgeQuote | null>(null);
  const [bridgeVisible, setBridgeVisible] = useState<boolean>(false);
  const [feeling, setFeeling] = useState<"good" | "hard" | "too_hard" | null>(null);
  const [completed, setCompleted] = useState<{
    xpEarned: number;
    completionBonus: number;
    stationsCompleted: number;
    totalStations: number;
  } | null>(null);
  const [reflection, setReflection] = useState<string>("");
  const [tapCount, setTapCount] = useState<number>(0);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [wordInput, setWordInput] = useState<string>("");
  const [breathPhase, setBreathPhase] = useState<"in" | "hold" | "out">("in");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const playedQuoteIds = useRef<Set<string>>(new Set());

  // ── Pre-fetch the preset for the picker confirmation screen ──────────
  const presetQuery = useQuery<PresetResponse>({
    queryKey: ["/api/circuit/preset", slug],
    queryFn: async () => {
      const r = await fetch(`/api/circuit/preset/${slug}`);
      if (!r.ok) throw new Error("Failed to load preset");
      return r.json();
    },
  });

  // ── Start session mutation ──────────────────────────────────────────
  const startMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/circuit/session/start", { slug });
      return (await r.json()) as SessionStartResponse;
    },
    onSuccess: (data) => {
      setSessionId(data.session.id);
      setStations(data.preset.stations);
      setPresetTitle(data.preset.title);
      setCompletionXp(data.preset.completionXp);
      // First bridge (no fromStation) then move to station 0.
      fetchBridge(undefined, data.preset.stations[0]?.id, data.session.id);
    },
    onError: () => {
      toast({ title: "Could not start", description: "Please try again.", variant: "destructive" });
    },
  });

  // ── Per-station completion ──────────────────────────────────────────
  // Returns a promise so the final station log can be awaited before
  // /complete fires — otherwise the server's snapshot inside /complete
  // can race with the in-flight /station update and report a stale
  // stationsCompleted (e.g. "8 of 9" instead of "9 of 9").
  const stationMutation = useMutation({
    mutationFn: async (payload: {
      stationId: string;
      feeling?: "good" | "hard" | "too_hard";
      skipped?: boolean;
      metric?: number;
    }) => {
      if (!sessionId) return;
      await apiRequest(
        "POST",
        `/api/circuit/session/${sessionId}/station`,
        payload,
      );
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) return null;
      const r = await apiRequest(
        "POST",
        `/api/circuit/session/${sessionId}/complete`,
        {},
      );
      return await r.json();
    },
    onSuccess: (data: any) => {
      if (!data) return;
      setCompleted({
        xpEarned: data.xpEarned,
        completionBonus: data.completionBonusAwarded,
        stationsCompleted: data.stationsCompleted,
        totalStations: data.totalStations,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/circuit/session/recent"] });
    },
    onError: () => {
      // Surface the failure — the "Wrapping up…" interstitial below renders
      // a Retry button when this mutation has errored, so the player isn't
      // permanently stuck if the server hiccups during finalization.
      toast({
        title: "Couldn't save your circuit",
        description: "Tap Retry to try again — your progress is safe.",
        variant: "destructive",
      });
    },
  });

  // ── Bridge / coach quote fetch + playback ───────────────────────────
  // `feelingOverride` lets callers pass a freshly-computed feeling that
  // hasn't yet flushed through React state — otherwise the URL would carry
  // the previous tick's `feeling` and the bridge categories would mismatch.
  async function fetchBridge(
    fromStationId: string | undefined,
    toStationId: string | undefined,
    sId: number | null = sessionId,
    isCoach = false,
    feelingOverride?: "good" | "hard" | "too_hard" | null,
  ) {
    if (!sId) return;
    const effectiveFeeling = feelingOverride ?? feeling;
    try {
      const url = isCoach
        ? `/api/circuit/quote/coach?sessionId=${sId}`
        : `/api/circuit/quote/bridge?sessionId=${sId}` +
          (fromStationId ? `&fromStation=${fromStationId}` : "") +
          (toStationId ? `&toStation=${toStationId}` : "") +
          (effectiveFeeling ? `&feeling=${effectiveFeeling}` : "") +
          (playedQuoteIds.current.size
            ? `&excludeIds=${Array.from(playedQuoteIds.current).join(",")}`
            : "");
      const r = await fetch(url);
      if (!r.ok) return;
      const q = (await r.json()) as BridgeQuote;
      playedQuoteIds.current.add(q.id);
      setBridge(q);
      setBridgeVisible(true);
      // Play the audio if available + not muted.
      if (q.audioUrl && !muted) {
        try {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          const a = new Audio(q.audioUrl);
          a.volume = 0.95;
          audioRef.current = a;
          a.play().catch(() => {/* user-gesture rules */});
        } catch {/* ignore */}
      }
      // Auto-hide bridge after ~6s (or 9s for coach moments)
      const hideMs = isCoach ? 9000 : 6000;
      window.setTimeout(() => setBridgeVisible(false), hideMs);
    } catch {/* ignore */}
  }

  // ── Auth gate ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/recovery/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // ── Timer driver ────────────────────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (paused || stationIdx < 0 || stationIdx >= stations.length) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // station's natural end → mark complete with no explicit feeling
          // and advance.
          window.setTimeout(() => advanceStation("good"), 50);
          return 0;
        }
        return s - 1;
      });
    }, 1000) as unknown as number;
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, stationIdx, stations.length]);

  // ── Breath visualizer phase cycle ───────────────────────────────────
  useEffect(() => {
    if (stations[stationIdx]?.type !== "breath") return;
    let t = 0;
    const intv = window.setInterval(() => {
      t = (t + 1) % 19;
      if (t < 4) setBreathPhase("in");
      else if (t < 11) setBreathPhase("hold");
      else setBreathPhase("out");
    }, 1000);
    return () => window.clearInterval(intv);
  }, [stationIdx, stations]);

  // ── Reset per-station ephemerals when station changes ───────────────
  useEffect(() => {
    setTapCount(0);
    setFoundWords([]);
    setWordInput("");
  }, [stationIdx]);

  // ── Advance station + log ───────────────────────────────────────────
  function advanceStation(stationFeeling: "good" | "hard" | "too_hard", skipped = false) {
    const st = stations[stationIdx];
    const metric = st
      ? st.type === "dexterity"
        ? tapCount
        : st.type === "word_quick"
          ? foundWords.length
          : undefined
      : undefined;
    // Compute the next session-level feeling synchronously so we can pass
    // it straight into fetchBridge — React state updates are async and the
    // bridge query would otherwise carry the previous tick's feeling.
    const nextFeeling: "good" | "hard" | "too_hard" | null =
      stationFeeling === "too_hard"
        ? "too_hard"
        : stationFeeling === "hard" && feeling !== "too_hard"
          ? "hard"
          : feeling;
    if (nextFeeling !== feeling) setFeeling(nextFeeling);

    const nextIdx = stationIdx + 1;
    const isFinal = nextIdx >= stations.length;

    if (isFinal) {
      // Final station: chain the log → complete so the server reads the
      // freshly-incremented stationsCompleted before finalizing.
      setStationIdx(stations.length);
      (async () => {
        if (st && sessionId) {
          try {
            await stationMutation.mutateAsync({
              stationId: st.id,
              feeling: stationFeeling,
              skipped,
              metric,
            });
          } catch {/* completeMutation will still try */}
        }
        completeMutation.mutate();
      })();
      return;
    }

    if (st && sessionId) {
      stationMutation.mutate({
        stationId: st.id,
        feeling: stationFeeling,
        skipped,
        metric,
      });
    }
    const next = stations[nextIdx];
    // Coach stations get the longer coach-quote endpoint; everything else
    // uses bridge. We fetch the audio first, then advance the station.
    fetchBridge(st?.id, next.id, sessionId, next.type === "coach", nextFeeling);
    setStationIdx(nextIdx);
    setSecondsLeft(next.durationSeconds);
    setPaused(false);
  }

  function startStationTimer() {
    setSecondsLeft(stations[0]?.durationSeconds || 0);
    setStationIdx(0);
  }

  // ── Cleanup audio on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────
  // Render branches
  // ──────────────────────────────────────────────────────────────────

  if (authLoading || presetQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!presetQuery.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center px-4">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Circuit not found</h1>
          <Button asChild>
            <Link href="/recovery/circuit">Back to circuits</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Pre-start screen ────────────────────────────────────────────────
  if (sessionId === null) {
    const p = presetQuery.data.preset;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <RecoverySEO
          title={`${p.title} | Daily Circuit`}
          description={p.subtitle}
          canonical={`/recovery/circuit/${slug}`}
        />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-xl w-full p-8 space-y-6 text-center">
            <Badge variant="secondary" className="mx-auto">
              <Flame className="w-3 h-3 mr-1" /> Daily Circuit
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{p.title}</h1>
              <p className="text-muted-foreground">{p.subtitle}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {p.stationCount} stations · {Math.round(p.totalSeconds / 60)} min ·
              +{p.completionXp} XP on completion
            </div>
            <div className="space-y-2 text-left text-sm bg-muted/30 rounded-md p-4">
              <div className="font-medium">Before you start:</div>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                <li>Sit somewhere comfortable. Water within reach.</li>
                <li>Pause anytime. Skip anything that hurts.</li>
                <li>The voice between stations is Nick. No buzzers.</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                asChild
                variant="outline"
                size="lg"
                data-testid="link-circuit-back"
              >
                <Link href="/recovery/circuit">
                  <Home className="w-4 h-4 mr-2" /> Pick a different one
                </Link>
              </Button>
              <Button
                size="lg"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                data-testid="button-circuit-begin"
              >
                <Play className="w-4 h-4 mr-2" />
                {startMutation.isPending ? "Starting…" : "Begin"}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // ── Completion screen ───────────────────────────────────────────────
  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-xl w-full p-8 space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-md bg-primary/10 flex items-center justify-center">
              <Check className="w-9 h-9 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Circuit complete</h1>
              <p className="text-muted-foreground">
                {completed.stationsCompleted} of {completed.totalStations} stations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-md border p-4">
                <div
                  className="text-2xl font-bold"
                  data-testid="text-xp-earned"
                >
                  +{completed.xpEarned}
                </div>
                <div className="text-xs text-muted-foreground">XP earned</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-2xl font-bold">
                  {completed.completionBonus > 0
                    ? `+${completed.completionBonus}`
                    : "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Completion bonus
                </div>
              </div>
            </div>
            {bridge && (
              <blockquote className="text-base italic text-muted-foreground border-l-2 border-primary/50 pl-4 text-left">
                "{bridge.text}"
              </blockquote>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/recovery/circuit">
                  <Home className="w-4 h-4 mr-2" /> Back to circuits
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/recovery/today">Continue recovery</Link>
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // ── Active station ──────────────────────────────────────────────────
  const station = stations[stationIdx];
  const total = stations.length;
  const progressPct = stationIdx >= 0 ? Math.round((Math.min(stationIdx + 1, total) / total) * 100) : 0;
  const wrappingUp = stationIdx >= total;

  // Final station finished — completion mutation in flight, completion screen
  // not yet rendered. Show a calm interstitial instead of crashing on
  // `station.type` (the player has run off the end of the array). If the
  // mutation errored, surface Retry + Exit so the user is never stuck.
  if (wrappingUp && !completed) {
    const failed = completeMutation.isError;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="text-2xl font-semibold">
            {failed ? "Couldn't save just yet" : "Wrapping up…"}
          </div>
          <p className="text-muted-foreground">
            {failed
              ? "Your progress is saved on this device. Try again or exit — nothing is lost."
              : "Saving your circuit and counting up your XP."}
          </p>
          {failed ? (
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button
                onClick={() => completeMutation.mutate()}
                data-testid="button-circuit-retry-complete"
              >
                Retry
              </Button>
              <Button asChild variant="outline" data-testid="button-circuit-exit-from-wrap">
                <Link href="/recovery/circuit">
                  <Home className="w-4 h-4 mr-1" /> Exit
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex justify-center pt-2">
              <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-full bg-primary animate-pulse" />
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <Button asChild size="sm" variant="ghost" data-testid="button-circuit-exit">
            <Link href="/recovery/circuit">
              <Home className="w-4 h-4 mr-1" /> Exit
            </Link>
          </Button>
          <div className="flex-1 px-3">
            <div className="text-xs text-muted-foreground text-center">
              {presetTitle} · Station {Math.max(stationIdx + 1, 1)} / {total}
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMuted((m) => !m)}
            data-testid="button-circuit-mute"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Bridge quote overlay (also shown at start while station=0) */}
      {bridgeVisible && bridge && (
        <div className="bg-primary/5 border-b border-primary/30">
          <div className="mx-auto max-w-3xl px-6 py-4 flex items-center gap-3">
            <Quote className="w-5 h-5 text-primary shrink-0" />
            <blockquote
              className="text-base md:text-lg italic"
              data-testid="text-bridge-quote"
            >
              "{bridge.text}"
            </blockquote>
          </div>
        </div>
      )}

      {/* Body — station card */}
      <main className="flex-1 flex items-center justify-center p-6">
        {stationIdx < 0 || !station ? (
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <p className="text-muted-foreground">Loading first station…</p>
            <Button onClick={startStationTimer}>
              <Play className="w-4 h-4 mr-2" /> Start
            </Button>
          </Card>
        ) : (
          <Card
            className="max-w-2xl w-full p-8 space-y-6"
            data-testid={`station-${station.type}`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                {STATION_ICON[station.type]}
              </div>
              <div>
                <Badge variant="outline" className="mb-1">
                  Station {stationIdx + 1} / {total}
                </Badge>
                <h2 className="text-xl font-semibold">{station.title}</h2>
              </div>
            </div>

            <p className="text-base text-muted-foreground">
              {station.instruction}
            </p>

            {/* Station-specific body */}
            <StationBody
              station={station}
              tapCount={tapCount}
              setTapCount={setTapCount}
              breathPhase={breathPhase}
              foundWords={foundWords}
              setFoundWords={setFoundWords}
              wordInput={wordInput}
              setWordInput={setWordInput}
              reflection={reflection}
              setReflection={setReflection}
              bridge={bridge}
              muted={muted}
            />

            {/* Big timer */}
            <div className="text-center space-y-2">
              <div
                className="text-5xl font-mono font-bold tabular-nums"
                data-testid="text-timer"
              >
                {mmss(secondsLeft)}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPaused((p) => !p)}
                data-testid="button-pause"
              >
                {paused ? (
                  <>
                    <Play className="w-4 h-4 mr-1" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-1" /> Pause
                  </>
                )}
              </Button>
            </div>

            {/* Action row */}
            <div className="border-t pt-4 space-y-3">
              <div className="text-sm text-muted-foreground text-center">
                Done? Tell us how it felt.
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => advanceStation("good")}
                  data-testid="button-feel-good"
                >
                  Felt strong
                </Button>
                <Button
                  variant="outline"
                  onClick={() => advanceStation("hard")}
                  data-testid="button-feel-hard"
                >
                  Hard but doable
                </Button>
                <Button
                  variant="outline"
                  onClick={() => advanceStation("too_hard")}
                  data-testid="button-feel-too-hard"
                >
                  Too much
                </Button>
              </div>
              <div className="flex justify-center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => advanceStation("good", true)}
                  data-testid="button-skip-station"
                >
                  <SkipForward className="w-3.5 h-3.5 mr-1" /> Skip
                </Button>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Per-station body
// ──────────────────────────────────────────────────────────────────────

function StationBody(props: {
  station: Station;
  tapCount: number;
  setTapCount: (n: number | ((p: number) => number)) => void;
  breathPhase: "in" | "hold" | "out";
  foundWords: string[];
  setFoundWords: (w: string[] | ((p: string[]) => string[])) => void;
  wordInput: string;
  setWordInput: (s: string) => void;
  reflection: string;
  setReflection: (s: string) => void;
  bridge: BridgeQuote | null;
  muted: boolean;
}) {
  const { station } = props;

  switch (station.type) {
    case "open":
    case "close":
      return (
        <div className="text-center text-sm text-muted-foreground italic">
          {station.type === "open"
            ? "Settle in. Press Felt strong when you're ready."
            : "Take a long breath. You did the work."}
        </div>
      );

    case "check_in":
      return (
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: "good", label: "Pretty good" },
            { v: "okay", label: "Okay" },
            { v: "rough", label: "Rough" },
          ].map((x) => (
            <Button
              key={x.v}
              variant="outline"
              size="lg"
              data-testid={`button-checkin-${x.v}`}
            >
              {x.label}
            </Button>
          ))}
        </div>
      );

    case "breath": {
      const label =
        props.breathPhase === "in"
          ? "Breathe in"
          : props.breathPhase === "hold"
            ? "Hold"
            : "Breathe out";
      const scale =
        props.breathPhase === "in"
          ? "scale-110"
          : props.breathPhase === "hold"
            ? "scale-110"
            : "scale-90";
      return (
        <div className="flex flex-col items-center gap-3 py-2">
          <div
            className={`w-32 h-32 rounded-full bg-primary/15 border-4 border-primary/40 transition-transform duration-1000 ${scale}`}
          />
          <div className="text-sm font-medium">{label}</div>
        </div>
      );
    }

    case "brain_quick":
      return (
        <div className="rounded-md bg-muted/40 p-4 text-base text-center">
          {station.config?.prompt || station.instruction}
        </div>
      );

    case "dexterity":
      return (
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="h-32 w-32 rounded-full text-2xl"
            onClick={() => props.setTapCount((n) => n + 1)}
            data-testid="button-tap-target"
          >
            TAP
          </Button>
          <div className="text-sm">
            <span className="font-mono font-bold" data-testid="text-tap-count">
              {props.tapCount}
            </span>
            <span className="text-muted-foreground">
              {" / "}target {station.config?.targetTaps ?? 80}
            </span>
          </div>
        </div>
      );

    case "word_quick": {
      const sourceWord: string = (
        station.config?.sourceWord || "RECOVERY"
      ).toUpperCase();
      const target: number = station.config?.targetCount ?? 8;
      function tryAdd() {
        const w = props.wordInput.trim().toUpperCase();
        props.setWordInput("");
        if (w.length < 2) return;
        if (props.foundWords.includes(w)) return;
        // Validate every letter of `w` exists in sourceWord with sufficient counts
        const counts: Record<string, number> = {};
        for (const ch of sourceWord) counts[ch] = (counts[ch] || 0) + 1;
        for (const ch of w) {
          if (!counts[ch]) return;
          counts[ch]--;
        }
        props.setFoundWords((arr) => [...arr, w]);
      }
      return (
        <div className="space-y-3">
          <div className="text-center text-2xl font-mono tracking-widest">
            {sourceWord}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border bg-background px-3 py-2 text-base"
              placeholder="Type a word, press Enter"
              value={props.wordInput}
              onChange={(e) => props.setWordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && tryAdd()}
              data-testid="input-word-quick"
            />
            <Button onClick={tryAdd} data-testid="button-word-add">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
            {props.foundWords.map((w) => (
              <Badge key={w} variant="secondary">
                {w}
              </Badge>
            ))}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {props.foundWords.length} found · target {target}
          </div>
        </div>
      );
    }

    case "hydration":
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <Coffee className="w-12 h-12 text-primary" />
          <p className="text-sm text-muted-foreground max-w-sm">
            Slow sip. Then a long breath out. This counts. Your brain runs on
            water.
          </p>
        </div>
      );

    case "coach":
      return (
        <div className="rounded-md bg-primary/5 border border-primary/30 p-5 text-center space-y-2">
          <Mic className="w-6 h-6 text-primary mx-auto" />
          {props.bridge ? (
            <blockquote
              className="text-lg italic"
              data-testid="text-coach-quote"
            >
              "{props.bridge.text}"
            </blockquote>
          ) : (
            <p className="text-sm text-muted-foreground">
              Loading coach moment…
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {props.muted ? "Audio muted — text only." : "Listen, then move on."}
          </p>
        </div>
      );

    case "community":
      return (
        <div className="rounded-md border p-4 space-y-2">
          <div className="text-xs text-muted-foreground">
            One survivor's recent post:
          </div>
          <p className="text-sm">
            "First three steps unassisted today. Cried. The good kind. Three
            years and we're still climbing."
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Flame className="w-3 h-3 mr-1" /> Send fire
            </Button>
            <Button size="sm" variant="outline">
              <Heart className="w-3 h-3 mr-1" /> React
            </Button>
          </div>
        </div>
      );

    case "reflection":
      return (
        <Textarea
          placeholder="One sentence. What did this circuit unlock?"
          value={props.reflection}
          onChange={(e) => props.setReflection(e.target.value)}
          rows={3}
          data-testid="input-reflection"
        />
      );
  }
}
