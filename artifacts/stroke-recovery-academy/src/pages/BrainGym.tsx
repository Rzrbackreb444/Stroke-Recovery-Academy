import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Brain,
  Sparkles,
  Calendar,
  ArrowLeft,
  Trophy,
  Volume2,
  VolumeX,
  Flame,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import WordSearchGame from "@/components/games/WordSearchGame";
import CrosswordGame from "@/components/games/CrosswordGame";
import MemoryMatchGame from "@/components/games/MemoryMatchGame";
import { BRAIN_GYM_PACKS, getDailyPack, type BrainGymPack } from "@shared/brainGymPacks";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  DIFFICULTY_CONFIGS,
  getDifficulty,
  setDifficulty,
  type Difficulty,
} from "@/lib/brainGymDifficulty";
import { isMuted, setMuted } from "@/lib/gameAudio";
import { getDailyChallenge } from "@/lib/dailyChallenge";
import type { GameCompletionStats } from "@/components/games/GameCompleteModal";

type GameType = "wordsearch" | "crossword" | "memory";

interface BrainGymStats {
  totalSolved: number;
  byGame: Record<string, { count: number; fastestSec: number | null; avgSec: number | null }>;
  fastestSec: number | null;
}

interface DailyLeaderboardEntry {
  rank: number;
  name: string;
  durationSec: number;
  hintsUsed: number;
  isYou: boolean;
}

function fmtTime(sec: number | null | undefined): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

export default function BrainGym() {
  const dailyPack = useMemo(() => getDailyPack(), []);
  const dailyChallenge = useMemo(() => getDailyChallenge(), []);
  const [packId, setPackId] = useState<string>(dailyPack.id);
  const [game, setGame] = useState<GameType>("wordsearch");
  const [difficulty, setDifficultyState] = useState<Difficulty>(() => getDifficulty());
  const [muted, setMutedState] = useState<boolean>(() => isMuted());
  const [isDailyMode, setIsDailyMode] = useState(false);
  const { toast } = useToast();

  const pack: BrainGymPack =
    BRAIN_GYM_PACKS.find((p) => p.id === packId) ?? dailyPack;
  const cfg = DIFFICULTY_CONFIGS[difficulty];

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  const { data: stats } = useQuery<BrainGymStats>({
    queryKey: ["/api/recovery/brain-gym/stats"],
  });
  const { data: leaderboard, refetch: refetchLeaderboard } = useQuery<{
    date: string;
    leaderboard: DailyLeaderboardEntry[];
  }>({
    queryKey: ["/api/recovery/brain-gym/daily/leaderboard", { date: dailyChallenge.date }],
    queryFn: async () => {
      const r = await fetch(
        `/api/recovery/brain-gym/daily/leaderboard?date=${dailyChallenge.date}`,
      );
      if (!r.ok) throw new Error("leaderboard");
      return r.json();
    },
  });

  function changeDifficulty(d: Difficulty) {
    setDifficulty(d);
    setDifficultyState(d);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  function startDailyChallenge() {
    setIsDailyMode(true);
    setPackId(dailyChallenge.packId);
    setGame(dailyChallenge.gameType);
    document.getElementById("brain-gym-play")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleComplete(type: GameType, completionStats: GameCompletionStats) {
    const isDaily = isDailyMode && type === dailyChallenge.gameType && pack.id === dailyChallenge.packId;
    try {
      const res: any = await apiRequest("POST", "/api/recovery/brain-gym/complete", {
        gameType: type,
        packId: pack.id,
        difficulty,
        durationSec: completionStats.durationSec,
        hintsUsed: completionStats.hintsUsed,
        movesOrAttempts: completionStats.movesOrAttempts ?? null,
        accuracyPct: completionStats.accuracyPct ?? null,
        isDailyChallenge: isDaily,
        challengeDate: isDaily ? dailyChallenge.date : null,
      });
      if (isDaily) refetchLeaderboard();
      toast({
        title: isDaily ? "Daily challenge logged" : "Streak credit logged",
        description: res?.currentStreak
          ? `Day ${res.currentStreak} of your streak. Never zero.`
          : "Brain rep counted. Never zero.",
      });
    } catch {
      // Non-blocking — guests still get the win, no toast needed
    }
  }

  const personalCount =
    (stats?.byGame?.[game]?.count ?? 0);
  const personalFastest = stats?.byGame?.[game]?.fastestSec ?? null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="Brain Gym — Word Search, Crossword & Memory Games for Stroke Recovery"
        description="Free word search, crossword, and memory games built for stroke survivors. Themed packs from Nick Kremers' Sasquatch Method exercise language, vocabulary recall, and cognitive endurance."
        canonical="/recovery/brain-gym"
        keywords={[
          "stroke recovery brain games",
          "cognitive exercises stroke",
          "word search stroke survivor",
          "crossword aphasia recovery",
          "memory match brain training",
          "Sasquatch Method brain gym",
        ]}
      />

      <RecoveryHeader />

      {/* Hero */}
      <section className="border-b border-[#1a1a1a] bg-gradient-to-b from-[#1a1a1a] to-[#0D0D0D]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <Link href="/recovery/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 text-gray-400"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Button>
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="mb-3 text-sm font-bold uppercase tracking-widest"
                style={{ color: "#E2741B" }}
              >
                Brain Gym
              </p>
              <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl">
                Train the brain.
                <br />
                <span style={{ color: "#E2741B" }}>One rep at a time.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base text-gray-400 sm:text-lg">
                Word search, crossword, and memory games built for survivors. Themed
                from the Sasquatch Method, recovery anatomy, and the language of the
                comeback. Daily reps build the wire.
              </p>
            </div>
            <div className="rounded-md border border-[#E2741B]/30 bg-[#E2741B]/10 p-4 sm:w-72">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[#E2741B]">
                <Trophy className="h-4 w-4" />
                Daily Challenge
              </div>
              <p className="mt-2 text-xl font-black">{dailyChallenge.packName}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">
                {dailyChallenge.gameType === "wordsearch"
                  ? "Word Search"
                  : dailyChallenge.gameType === "crossword"
                    ? "Crossword"
                    : "Memory Match"}{" "}
                · {dailyChallenge.date}
              </p>
              <Button
                size="sm"
                onClick={startDailyChallenge}
                className="mt-3 w-full bg-[#E2741B] text-black hover:bg-[#E2741B]"
                data-testid="button-play-daily"
              >
                Play today's challenge
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Personal stats + leaderboard strip */}
      <section className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[1fr,1.2fr]">
            <div className="rounded-lg border border-[#1a1a1a] bg-[#111] p-5">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                <Flame className="h-4 w-4 text-[#E2741B]" />
                Your Brain Gym stats
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-3xl font-black text-white" data-testid="stat-total-solved">
                    {stats?.totalSolved ?? 0}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">Solved</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-white" data-testid="stat-fastest">
                    {fmtTime(stats?.fastestSec)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">Fastest</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-white">{personalCount}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">
                    {game === "wordsearch" ? "Word S." : game === "crossword" ? "Crossword" : "Memory"}
                  </p>
                </div>
              </div>
              {personalFastest != null && (
                <p className="mt-3 text-xs text-gray-500">
                  <Clock className="mr-1 inline h-3 w-3" />
                  Best for current game: <span className="text-[#E2741B] font-semibold">{fmtTime(personalFastest)}</span>
                </p>
              )}
            </div>
            <div className="rounded-lg border border-[#E2741B]/30 bg-[#E2741B]/5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#E2741B]">
                  <Trophy className="h-4 w-4" />
                  Daily Leaderboard · {dailyChallenge.date}
                </h3>
                <span className="text-xs text-gray-500">Top 10 fastest</span>
              </div>
              {leaderboard && leaderboard.leaderboard.length > 0 ? (
                <ol className="space-y-1.5" data-testid="list-daily-leaderboard">
                  {leaderboard.leaderboard.slice(0, 5).map((row) => (
                    <li
                      key={`${row.rank}-${row.name}`}
                      className="flex items-center justify-between rounded px-2 py-1 text-sm"
                      style={{
                        backgroundColor: row.isYou ? "rgba(226,116,27,0.18)" : "transparent",
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: row.rank <= 3 ? "#E2741B" : "#1a1a1a",
                            color: row.rank <= 3 ? "#000" : "#9ca3af",
                          }}
                        >
                          {row.rank}
                        </span>
                        <span className="font-semibold text-white">
                          {row.name}
                          {row.isYou && (
                            <span className="ml-2 rounded bg-[#E2741B] px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">
                              You
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {fmtTime(row.durationSec)}
                        {row.hintsUsed > 0 && (
                          <span className="ml-2 text-gray-500">· {row.hintsUsed} hints</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-400">
                  Be the first to crush today's challenge. Hit "Play today's challenge" above.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pack picker + difficulty + mute */}
      <section className="border-b border-[#1a1a1a] bg-[#0D0D0D]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
              <Sparkles className="h-4 w-4" />
              Themed Packs
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-gray-500">Difficulty</span>
              <div className="inline-flex rounded-md border border-[#333] bg-[#111] p-0.5" role="radiogroup" aria-label="Difficulty">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={difficulty === d}
                    onClick={() => changeDifficulty(d)}
                    data-testid={`difficulty-${d}`}
                    className="rounded px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors"
                    style={{
                      backgroundColor: difficulty === d ? "#E2741B" : "transparent",
                      color: difficulty === d ? "#000" : "#9ca3af",
                    }}
                  >
                    {DIFFICULTY_CONFIGS[d].label}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
                aria-label={muted ? "Unmute game sounds" : "Mute game sounds"}
                data-testid="button-mute-toggle"
                className="border-[#333] bg-transparent text-gray-300"
                title={muted ? "Sounds off" : "Sounds on"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="mb-4 text-xs text-gray-500">{cfg.blurb}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BRAIN_GYM_PACKS.map((p) => {
              const isActive = p.id === packId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPackId(p.id);
                    setIsDailyMode(false);
                  }}
                  data-testid={`pack-${p.id}`}
                  className="rounded-md border bg-[#111] p-4 text-left transition-all hover-elevate active-elevate-2"
                  style={{
                    borderColor: isActive ? p.accent : "#1e1e1e",
                    boxShadow: isActive ? `0 0 0 1px ${p.accent}` : "none",
                  }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: p.accent }}
                  >
                    {p.entries.length} terms
                  </p>
                  <p className="mt-1 text-base font-black text-white">{p.name}</p>
                  <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                    {p.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Games */}
      <section id="brain-gym-play" className="bg-[#0D0D0D]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase">
                {pack.name}
                {isDailyMode && (
                  <span className="ml-3 rounded bg-[#E2741B] px-2 py-1 text-xs font-bold uppercase tracking-widest text-black align-middle">
                    Daily Challenge
                  </span>
                )}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-400">
                {pack.description}
              </p>
            </div>
          </div>

          <Tabs value={game} onValueChange={(v) => { setGame(v as GameType); setIsDailyMode(false); }}>
            <TabsList className="mb-6 grid w-full grid-cols-3 bg-[#111] sm:max-w-md">
              <TabsTrigger value="wordsearch" data-testid="tab-wordsearch">
                Word Search
              </TabsTrigger>
              <TabsTrigger value="crossword" data-testid="tab-crossword">
                Crossword
              </TabsTrigger>
              <TabsTrigger value="memory" data-testid="tab-memory">
                Memory Match
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wordsearch" className="mt-0">
              <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-6">
                <WordSearchGame
                  key={`ws-${pack.id}-${difficulty}-${isDailyMode ? dailyChallenge.date : "free"}`}
                  entries={pack.entries}
                  packId={pack.id}
                  difficulty={difficulty}
                  size={cfg.wordSearchSize}
                  count={cfg.wordSearchCount}
                  accent={pack.accent}
                  seed={isDailyMode ? dailyChallenge.seed : undefined}
                  packTitle={pack.name}
                  onComplete={(s) => handleComplete("wordsearch", s)}
                />
              </div>
            </TabsContent>

            <TabsContent value="crossword" className="mt-0">
              <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-6">
                <CrosswordGame
                  key={`cw-${pack.id}-${difficulty}-${isDailyMode ? dailyChallenge.date : "free"}`}
                  entries={pack.entries}
                  packId={pack.id}
                  difficulty={difficulty}
                  count={cfg.crosswordCount}
                  accent={pack.accent}
                  onComplete={(s) => handleComplete("crossword", s)}
                />
              </div>
            </TabsContent>

            <TabsContent value="memory" className="mt-0">
              <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-6">
                <MemoryMatchGame
                  key={`mm-${pack.id}-${difficulty}-${isDailyMode ? dailyChallenge.date : "free"}`}
                  entries={pack.entries}
                  packId={pack.id}
                  difficulty={difficulty}
                  pairs={cfg.memoryPairs}
                  accent={pack.accent}
                  onComplete={(s) => handleComplete("memory", s)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Why it matters */}
      <section className="border-t border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-start gap-4">
            <Brain className="mt-1 h-8 w-8 flex-shrink-0" style={{ color: "#E2741B" }} />
            <div>
              <h3 className="text-xl font-black text-white sm:text-2xl">
                Why we built Brain Gym
              </h3>
              <p className="mt-3 text-gray-400">
                Cognitive exercise after stroke isn't a side dish — it's main course.
                Word retrieval, visual scanning, working memory, and focus are all
                trainable. These games are designed to give you a daily rep that's
                playable from the couch on a hard day, themed in the language of the
                Method so the vocabulary itself gets stronger every time you play.
              </p>
              <p className="mt-3 text-xs text-gray-500">
                Lived experience, not medical advice. Consult your healthcare team.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
