import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, Pause, Play, Eye } from "lucide-react";
import type { PackEntry } from "@shared/brainGymPacks";
import { playCorrect, playWrong } from "@/lib/gameAudio";
import { saveGame, loadGame, clearGame } from "@/lib/gameStorage";
import GameCompleteModal, { type GameCompletionStats } from "./GameCompleteModal";

const PREVIEW_SECONDS = 20;

interface Props {
  entries: PackEntry[];
  packId: string;
  difficulty: "easy" | "medium" | "hard";
  pairs: number;
  accent?: string;
  onComplete?: (stats: GameCompletionStats) => void;
}

interface Card {
  id: number;
  pairId: number;
  type: "word" | "definition";
  word: string;
  definition: string;
}

interface SaveState {
  matched: number[];
  moves: number;
  startedAt: number;
  seed: number;
  pausedMs?: number;
  paused?: boolean;
}

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function shuffle<T>(arr: T[], seed: number): T[] {
  let s = seed;
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function MemoryMatchGame({
  entries,
  packId,
  difficulty,
  pairs,
  accent = "#C9941A",
  onComplete,
}: Props) {
  const [seed, setSeed] = useState(() => Date.now());
  const [matched, setMatched] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [completionStats, setCompletionStats] = useState<GameCompletionStats | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);
  const [pausedMs, setPausedMs] = useState(0);
  const [pauseStartedAt, setPauseStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [previewRemaining, setPreviewRemaining] = useState(PREVIEW_SECONDS);

  const cards = useMemo<Card[]>(() => {
    const chosen = shuffle(entries, seed).slice(0, pairs);
    const all: Card[] = [];
    chosen.forEach((e, i) => {
      all.push({ id: i * 2, pairId: i, type: "word", word: e.word, definition: e.definition });
      all.push({ id: i * 2 + 1, pairId: i, type: "definition", word: e.word, definition: e.definition });
    });
    return shuffle(all, seed + 1);
  }, [entries, pairs, seed]);

  const saveKey = "memory";

  // Restore on mount / pack/difficulty change
  useEffect(() => {
    const saved = loadGame<SaveState>(saveKey, packId, difficulty);
    if (saved && saved.matched && saved.moves >= 0) {
      setSeed(saved.seed);
      setMatched(saved.matched);
      setMoves(saved.moves);
      setStartedAt(saved.startedAt);
      setFlipped([]);
      setSolved(false);
      setPausedMs(saved.pausedMs || 0);
      if (saved.paused) {
        setPaused(true);
        setPauseStartedAt(Date.now());
      } else {
        setPaused(false);
        setPauseStartedAt(null);
      }
      setPreviewRemaining(0); // resumed games skip preview
    } else {
      const fresh = Date.now();
      setSeed(fresh);
      setMatched([]);
      setMoves(0);
      setStartedAt(fresh);
      setFlipped([]);
      setSolved(false);
      setPausedMs(0);
      setPaused(false);
      setPauseStartedAt(null);
      setPreviewRemaining(PREVIEW_SECONDS);
    }
    setModalOpen(false);
    setCompletionStats(null);
  }, [packId, difficulty]);

  // Preview countdown — all cards face-up, then flip back and start clock
  useEffect(() => {
    if (previewRemaining <= 0) return;
    if (paused || solved) return;
    const t = setTimeout(() => {
      setPreviewRemaining((r) => {
        const next = r - 1;
        if (next <= 0) {
          // Preview ended — reset the timer baseline so elapsed clock starts from 0
          setStartedAt(Date.now());
          setPausedMs(0);
          setAnnounce("Preview over. Cards hidden. Go!");
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [previewRemaining, paused, solved]);

  const inPreview = previewRemaining > 0;

  // Live clock — ticks every second while playing
  useEffect(() => {
    if (solved || paused) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [solved, paused]);

  const elapsedSec = Math.max(
    0,
    Math.floor((Date.now() - startedAt - pausedMs - (pauseStartedAt ? Date.now() - pauseStartedAt : 0)) / 1000),
  );
  void tick;

  function togglePause() {
    if (solved) return;
    if (!paused) {
      setPaused(true);
      setPauseStartedAt(Date.now());
      // Hide any in-progress face-up cards so paused screen is a true blackout.
      setFlipped([]);
      setAnnounce("Memory match paused. Timer stopped.");
    } else {
      setPaused(false);
      if (pauseStartedAt) setPausedMs((m) => m + (Date.now() - pauseStartedAt));
      setPauseStartedAt(null);
      setAnnounce("Memory match resumed.");
    }
  }

  // Autosave — folds in-progress pause segment into pausedMs
  useEffect(() => {
    if (solved) return;
    const t = setInterval(() => {
      const effectivePausedMs =
        pausedMs + (paused && pauseStartedAt ? Date.now() - pauseStartedAt : 0);
      saveGame<SaveState>(saveKey, packId, difficulty, {
        matched,
        moves,
        startedAt,
        seed,
        pausedMs: effectivePausedMs,
        paused,
      });
    }, 5000);
    return () => clearInterval(t);
  }, [matched, moves, startedAt, seed, packId, difficulty, solved, pausedMs, paused, pauseStartedAt]);

  // Detect win
  useEffect(() => {
    if (cards.length > 0 && matched.length === cards.length && !solved) {
      setSolved(true);
      const durationSec = Math.max(1, Math.round((Date.now() - startedAt - pausedMs) / 1000));
      const accuracyPct = moves > 0 ? Math.round((cards.length / 2 / moves) * 100) : 100;
      const stats: GameCompletionStats = {
        durationSec,
        hintsUsed: 0,
        movesOrAttempts: moves,
        accuracyPct,
      };
      setCompletionStats(stats);
      setModalOpen(true);
      clearGame(saveKey, packId, difficulty);
      onComplete?.(stats);
    }
  }, [matched, cards, moves, startedAt, packId, difficulty, solved, onComplete, pausedMs]);

  // Process flipped pairs
  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    const cardA = cards.find((c) => c.id === a);
    const cardB = cards.find((c) => c.id === b);
    if (cardA && cardB && cardA.pairId === cardB.pairId && cardA.id !== cardB.id) {
      setMatched((prev) => [...prev, a, b]);
      setFlipped([]);
      setMoves((m) => m + 1);
      playCorrect();
    } else {
      const t = setTimeout(() => {
        setFlipped([]);
        setMoves((m) => m + 1);
        playWrong();
      }, 850);
      return () => clearTimeout(t);
    }
  }, [flipped, cards]);

  function handleFlip(id: number) {
    if (paused) return;
    if (inPreview) return;
    if (flipped.length === 2) return;
    if (matched.includes(id) || flipped.includes(id)) return;
    setFlipped((prev) => [...prev, id]);
  }

  function reset() {
    const fresh = Date.now();
    setSeed(fresh);
    setMatched([]);
    setFlipped([]);
    setMoves(0);
    setStartedAt(fresh);
    setSolved(false);
    setModalOpen(false);
    setCompletionStats(null);
    setPausedMs(0);
    setPaused(false);
    setPauseStartedAt(null);
    setPreviewRemaining(PREVIEW_SECONDS);
    clearGame(saveKey, packId, difficulty);
  }

  const isFlipped = (id: number) => inPreview || flipped.includes(id) || matched.includes(id);
  const isMatched = (id: number) => matched.includes(id);

  return (
    <>
      <div className="flex flex-col gap-4" data-testid="game-memory-match">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-400">
              Match each <span className="font-semibold" style={{ color: accent }}>word</span> to its definition.
            </p>
            {inPreview ? (
              <div
                className="flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm tabular-nums"
                style={{ borderColor: `${accent}55`, backgroundColor: `${accent}14`, color: accent }}
                data-testid="text-mm-preview"
                aria-label={`Memorize the cards — ${previewRemaining} seconds remaining`}
              >
                <Eye className="h-3.5 w-3.5" style={{ color: accent }} />
                Memorize · {previewRemaining}s
              </div>
            ) : (
              <div
                className="flex items-center gap-2 rounded-md border border-[#1e1e1e] bg-[#0f0f0f] px-3 py-1.5 font-mono text-sm tabular-nums text-gray-300"
                data-testid="text-mm-clock"
                aria-label={`Elapsed time: ${formatClock(elapsedSec)}`}
              >
                <span className={`inline-block h-2 w-2 rounded-full ${paused ? "bg-gray-500" : "bg-[#C9941A] animate-pulse"}`} />
                {formatClock(elapsedSec)}
                {paused && <span className="ml-1 text-xs uppercase tracking-widest text-gray-500">Paused</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400" data-testid="text-mm-progress">
              {matched.length / 2} / {cards.length / 2} pairs · {moves} moves
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={togglePause}
              data-testid="button-mm-pause"
              className="border-[#333] bg-transparent text-gray-300"
              disabled={solved}
              aria-pressed={paused}
            >
              {paused ? (
                <><Play className="mr-2 h-4 w-4" /> Resume</>
              ) : (
                <><Pause className="mr-2 h-4 w-4" /> Pause</>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reset}
              data-testid="button-mm-reset"
              className="border-[#333] bg-transparent text-gray-300"
            >
              <RotateCw className="mr-2 h-4 w-4" />
              New game
            </Button>
          </div>
        </div>
        <div className="relative">
        {paused && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-[#0a0a0a]/95 backdrop-blur-sm"
            role="status"
            aria-live="polite"
            data-testid="overlay-mm-paused"
          >
            <Pause className="mb-3 h-12 w-12" style={{ color: accent }} />
            <p className="text-lg font-black uppercase tracking-widest text-white">Game Paused</p>
            <p className="mt-1 text-sm text-gray-400">Cards hidden. Resume when ready.</p>
            <Button
              type="button"
              onClick={togglePause}
              className="mt-5 bg-[#C9941A] text-black hover:bg-[#C9941A]"
              data-testid="button-mm-resume-overlay"
            >
              <Play className="mr-2 h-4 w-4" /> Resume
            </Button>
          </div>
        )}
        <div
          className={`grid gap-3 ${
            cards.length <= 12
              ? "grid-cols-2 sm:grid-cols-4"
              : cards.length <= 16
                ? "grid-cols-2 sm:grid-cols-4"
                : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
          }`}
        >
          {cards.map((card) => {
            const flippedNow = isFlipped(card.id);
            const matchedNow = isMatched(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleFlip(card.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleFlip(card.id);
                  }
                }}
                data-testid={`mm-card-${card.id}`}
                aria-label={
                  matchedNow
                    ? `Matched: ${card.type === "word" ? card.word : card.definition}`
                    : flippedNow
                      ? card.type === "word"
                        ? card.word
                        : card.definition
                      : "Hidden card"
                }
                className="relative aspect-[3/4] rounded-md text-left transition-transform hover-elevate active-elevate-2"
                style={{
                  perspective: 1000,
                  cursor: flippedNow ? "default" : "pointer",
                }}
                disabled={matchedNow}
              >
                <div
                  className="absolute inset-0 rounded-md transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: flippedNow ? "rotateY(180deg)" : "none",
                  }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-md border border-[#1e1e1e] bg-[#111]"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <span className="text-3xl font-black" style={{ color: accent }}>
                      ?
                    </span>
                  </div>
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-md p-3 text-center"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      backgroundColor: matchedNow ? `${accent}33` : "#1a1a1a",
                      border: matchedNow ? `1px solid ${accent}` : "1px solid #1e1e1e",
                    }}
                  >
                    {card.type === "word" ? (
                      <span
                        className="text-base sm:text-lg font-black uppercase leading-tight"
                        style={{ color: matchedNow ? accent : "#fff" }}
                      >
                        {card.word}
                      </span>
                    ) : (
                      <span
                        className="text-xs sm:text-sm font-medium leading-snug"
                        style={{ color: matchedNow ? "#fff" : "#d1d5db" }}
                      >
                        {card.definition}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        </div>
        <div role="status" aria-live="polite" className="sr-only">
          {announce}
        </div>
      </div>

      {completionStats && (
        <GameCompleteModal
          open={modalOpen}
          accent={accent}
          title={`All ${cards.length / 2} pairs matched.`}
          subtitle={`Done in ${moves} moves. Streak credit logged.`}
          stats={completionStats}
          onPlayAgain={() => {
            setModalOpen(false);
            reset();
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
