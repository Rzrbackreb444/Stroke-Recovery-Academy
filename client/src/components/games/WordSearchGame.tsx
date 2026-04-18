import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, RotateCw, Keyboard, Download, Pause, Play } from "lucide-react";
import {
  generateWordSearch,
  getCellsBetween,
  readCells,
} from "@/lib/wordSearch";
import type { PackEntry } from "@shared/brainGymPacks";
import { playCorrect, playWrong } from "@/lib/gameAudio";
import { saveGame, loadGame, clearGame } from "@/lib/gameStorage";
import GameCompleteModal, { type GameCompletionStats } from "./GameCompleteModal";

interface Props {
  entries: PackEntry[];
  packId: string;
  difficulty: "easy" | "medium" | "hard";
  size: number;
  count: number;
  accent?: string;
  seed?: number;
  packTitle?: string;
  onComplete?: (stats: GameCompletionStats) => void;
}

interface FoundWord {
  word: string;
  cells: { row: number; col: number }[];
}

interface SaveState {
  found: FoundWord[];
  startedAt: number;
  attempts: number;
  hintsUsed: number;
  seedNonce: number;
  pausedMs?: number;
  paused?: boolean;
}

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function WordSearchGame({
  entries,
  packId,
  difficulty,
  size,
  count,
  accent = "#C9941A",
  seed,
  packTitle,
  onComplete,
}: Props) {
  const wordsForPuzzle = useMemo(
    () =>
      entries
        .filter((e) => e.word.replace(/[^A-Za-z]/g, "").length <= size)
        .slice(0, count),
    [entries, size, count],
  );

  const [seedNonce, setSeedNonce] = useState(0);
  const baseSeed = useMemo(() => seed ?? Date.now(), [seed]);
  const puzzle = useMemo(
    () =>
      generateWordSearch(
        wordsForPuzzle.map((e) => e.word),
        size,
        baseSeed + seedNonce,
      ),
    [wordsForPuzzle, size, baseSeed, seedNonce],
  );

  const [start, setStart] = useState<{ row: number; col: number } | null>(null);
  const [hover, setHover] = useState<{ row: number; col: number } | null>(null);
  const [found, setFound] = useState<FoundWord[]>([]);
  const [solved, setSolved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [completionStats, setCompletionStats] = useState<GameCompletionStats | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [keyboardCursor, setKeyboardCursor] = useState<{ row: number; col: number } | null>(null);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [paused, setPaused] = useState(false);
  const [pausedMs, setPausedMs] = useState(0);
  const [pauseStartedAt, setPauseStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const calledComplete = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const targetWords = useMemo(
    () => puzzle.placed.map((p) => p.word),
    [puzzle],
  );

  const downloadPdf = useCallback(async () => {
    try {
      const res = await fetch("/api/recovery/brain-gym/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: packTitle || "Brain Gym Word Search",
          subtitle: `Stroke Recovery Academy · ${difficulty.toUpperCase()} · ${size}×${size}`,
          words: targetWords,
          grid: puzzle.grid,
        }),
      });
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(packTitle || "wordsearch").replace(/[^a-z0-9]+/gi, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
    }
  }, [packTitle, difficulty, size, targetWords, puzzle]);

  const saveKey = `wordsearch`;

  // Reset on new puzzle, then attempt to restore from autosave
  useEffect(() => {
    setStart(null);
    setHover(null);
    setSolved(false);
    setModalOpen(false);
    setCompletionStats(null);
    calledComplete.current = false;
    const saved = loadGame<SaveState>(saveKey, packId, difficulty);
    if (saved && saved.seedNonce === seedNonce) {
      setFound(saved.found || []);
      setStartedAt(saved.startedAt);
      setAttempts(saved.attempts || 0);
      setHintsUsed(saved.hintsUsed || 0);
      setPausedMs(saved.pausedMs || 0);
      // Restore paused state — autosave captures the full effective pausedMs
      // (including any in-progress pause segment), so we re-enter pause cleanly.
      if (saved.paused) {
        setPaused(true);
        setPauseStartedAt(Date.now());
      } else {
        setPaused(false);
        setPauseStartedAt(null);
      }
    } else {
      setFound([]);
      setStartedAt(Date.now());
      setAttempts(0);
      setHintsUsed(0);
      setPausedMs(0);
      setPaused(false);
      setPauseStartedAt(null);
    }
  }, [puzzle, packId, difficulty, seedNonce]);

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
  // touch tick so elapsedSec re-renders
  void tick;

  function togglePause() {
    if (solved) return;
    if (!paused) {
      setPaused(true);
      setPauseStartedAt(Date.now());
      setAnnounce("Game paused. Timer stopped.");
    } else {
      setPaused(false);
      if (pauseStartedAt) setPausedMs((m) => m + (Date.now() - pauseStartedAt));
      setPauseStartedAt(null);
      setAnnounce("Game resumed.");
    }
  }

  // Autosave every 5s while in progress.
  // When paused, we fold the in-progress pause segment into pausedMs so a reload
  // while paused doesn't silently count that gap as active play time.
  useEffect(() => {
    if (solved) return;
    const t = setInterval(() => {
      const effectivePausedMs =
        pausedMs + (paused && pauseStartedAt ? Date.now() - pauseStartedAt : 0);
      saveGame<SaveState>(saveKey, packId, difficulty, {
        found,
        startedAt,
        attempts,
        hintsUsed,
        seedNonce,
        pausedMs: effectivePausedMs,
        paused,
      });
    }, 5000);
    return () => clearInterval(t);
  }, [found, startedAt, attempts, hintsUsed, seedNonce, packId, difficulty, solved, pausedMs, paused, pauseStartedAt]);

  // Detect completion
  useEffect(() => {
    if (
      targetWords.length > 0 &&
      found.length === targetWords.length &&
      !calledComplete.current
    ) {
      calledComplete.current = true;
      setSolved(true);
      const durationSec = Math.max(
        1,
        Math.round((Date.now() - startedAt - pausedMs) / 1000),
      );
      const accuracyPct = attempts > 0 ? Math.round((found.length / attempts) * 100) : 100;
      const stats: GameCompletionStats = {
        durationSec,
        hintsUsed,
        movesOrAttempts: attempts,
        accuracyPct,
      };
      setCompletionStats(stats);
      setModalOpen(true);
      clearGame(saveKey, packId, difficulty);
      onComplete?.(stats);
    }
  }, [found, targetWords, onComplete, startedAt, attempts, hintsUsed, packId, difficulty, pausedMs]);

  const activeCells: { row: number; col: number }[] = useMemo(() => {
    if (!start || !hover) return [];
    return getCellsBetween(start.row, start.col, hover.row, hover.col) ?? [];
  }, [start, hover]);

  const isFound = (row: number, col: number): FoundWord | undefined =>
    found.find((f) => f.cells.some((c) => c.row === row && c.col === col));

  const isActive = (row: number, col: number): boolean =>
    activeCells.some((c) => c.row === row && c.col === col);

  const tryCommit = useCallback(
    (s: { row: number; col: number }, h: { row: number; col: number }) => {
      if (paused) return;
      const cells = getCellsBetween(s.row, s.col, h.row, h.col);
      if (!cells) return;
      const reading = readCells(puzzle.grid, cells);
      const reversed = reading.split("").reverse().join("");
      const matched = targetWords.find((w) => w === reading || w === reversed);
      const alreadyFound = matched && found.some((f) => f.word === matched);
      setAttempts((a) => a + 1);
      if (matched && !alreadyFound) {
        setFound((prev) => [...prev, { word: matched, cells }]);
        playCorrect();
        setAnnounce(`Found ${matched}.`);
      } else if (!matched) {
        playWrong();
      }
    },
    [puzzle, targetWords, found, paused],
  );

  function handleCellDown(row: number, col: number) {
    if (paused) return;
    setStart({ row, col });
    setHover({ row, col });
    setKeyboardMode(false);
  }

  function handleCellEnter(row: number, col: number) {
    if (paused) return;
    if (start) setHover({ row, col });
  }

  function handleCellUp() {
    if (!start || !hover) {
      setStart(null);
      setHover(null);
      return;
    }
    tryCommit(start, hover);
    setStart(null);
    setHover(null);
  }

  // Keyboard navigation handlers (full a11y)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (solved || paused) return;
      const cursor = keyboardCursor ?? { row: 0, col: 0 };
      const max = puzzle.size - 1;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setKeyboardMode(true);
          setKeyboardCursor({ row: Math.max(0, cursor.row - 1), col: cursor.col });
          if (start) setHover({ row: Math.max(0, cursor.row - 1), col: cursor.col });
          break;
        case "ArrowDown":
          e.preventDefault();
          setKeyboardMode(true);
          setKeyboardCursor({ row: Math.min(max, cursor.row + 1), col: cursor.col });
          if (start) setHover({ row: Math.min(max, cursor.row + 1), col: cursor.col });
          break;
        case "ArrowLeft":
          e.preventDefault();
          setKeyboardMode(true);
          setKeyboardCursor({ row: cursor.row, col: Math.max(0, cursor.col - 1) });
          if (start) setHover({ row: cursor.row, col: Math.max(0, cursor.col - 1) });
          break;
        case "ArrowRight":
          e.preventDefault();
          setKeyboardMode(true);
          setKeyboardCursor({ row: cursor.row, col: Math.min(max, cursor.col + 1) });
          if (start) setHover({ row: cursor.row, col: Math.min(max, cursor.col + 1) });
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (!keyboardMode) {
            setKeyboardMode(true);
            setKeyboardCursor({ row: 0, col: 0 });
            return;
          }
          if (!start) {
            setStart(cursor);
            setHover(cursor);
            setAnnounce(`Started selection at row ${cursor.row + 1}, column ${cursor.col + 1}.`);
          } else {
            tryCommit(start, cursor);
            setStart(null);
            setHover(null);
          }
          break;
        case "Escape":
          e.preventDefault();
          setStart(null);
          setHover(null);
          setAnnounce("Selection cancelled.");
          break;
      }
    },
    [keyboardCursor, keyboardMode, solved, paused, start, puzzle.size, tryCommit],
  );

  function reset() {
    setSeedNonce((n) => n + 1);
    clearGame(saveKey, packId, difficulty);
  }

  function enterKeyboardMode() {
    setKeyboardMode(true);
    setKeyboardCursor((c) => c ?? { row: 0, col: 0 });
    containerRef.current?.focus();
  }

  return (
    <>
      <div
        className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6"
        onMouseUp={handleCellUp}
        onTouchEnd={handleCellUp}
        data-testid="game-word-search"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Timer + Pause control */}
          <div className="flex w-full items-center justify-between gap-3">
            <div
              className="flex items-center gap-2 rounded-md border border-[#1e1e1e] bg-[#0f0f0f] px-3 py-1.5 font-mono text-sm tabular-nums text-gray-300"
              data-testid="text-ws-clock"
              aria-label={`Elapsed time: ${formatClock(elapsedSec)}`}
            >
              <span className={`inline-block h-2 w-2 rounded-full ${paused ? "bg-gray-500" : "bg-[#C9941A] animate-pulse"}`} />
              {formatClock(elapsedSec)}
              {paused && <span className="ml-1 text-xs uppercase tracking-widest text-gray-500">Paused</span>}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={togglePause}
              data-testid="button-ws-pause"
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
          </div>
          <div className="relative">
          {paused && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-[#0a0a0a]/95 backdrop-blur-sm"
              role="status"
              aria-live="polite"
              data-testid="overlay-ws-paused"
            >
              <Pause className="mb-3 h-12 w-12" style={{ color: accent }} />
              <p className="text-lg font-black uppercase tracking-widest text-white">Game Paused</p>
              <p className="mt-1 text-sm text-gray-400">Take your time. Resume when ready.</p>
              <Button
                type="button"
                onClick={togglePause}
                className="mt-5 bg-[#C9941A] text-black hover:bg-[#C9941A]"
                data-testid="button-ws-resume-overlay"
              >
                <Play className="mr-2 h-4 w-4" /> Resume
              </Button>
            </div>
          )}
          <div
            ref={containerRef}
            tabIndex={0}
            role="grid"
            aria-label={`Word search grid, ${puzzle.size} by ${puzzle.size}. Use arrow keys to move. Press Enter to start a selection, then arrows to extend, then Enter again to commit.`}
            onKeyDown={handleKeyDown}
            className="inline-grid select-none rounded-md border border-[#1e1e1e] bg-[#0f0f0f] p-2 outline-none focus:ring-2 focus:ring-[#C9941A]/60"
            style={{
              gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
              touchAction: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              overscrollBehavior: "contain",
            }}
            onMouseLeave={() => setHover(null)}
            onTouchMove={(e) => {
              if (start) e.preventDefault();
              const touch = e.touches[0];
              if (!touch) return;
              const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
              const cell = el?.closest('[data-row][data-col]') as HTMLElement | null;
              if (cell?.dataset.row && cell?.dataset.col) {
                handleCellEnter(Number(cell.dataset.row), Number(cell.dataset.col));
              }
            }}
          >
            {puzzle.grid.map((row, r) =>
              row.map((letter, c) => {
                const foundCell = isFound(r, c);
                const active = isActive(r, c);
                const isCursor =
                  keyboardMode && keyboardCursor?.row === r && keyboardCursor?.col === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    role="gridcell"
                    tabIndex={-1}
                    aria-label={`Row ${r + 1} column ${c + 1}: ${letter}${foundCell ? `, part of ${foundCell.word}` : ""}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
                      handleCellDown(r, c);
                    }}
                    onPointerEnter={() => handleCellEnter(r, c)}
                    data-row={r}
                    data-col={c}
                    data-testid={`ws-cell-${r}-${c}`}
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-base sm:text-lg font-bold uppercase transition-colors"
                    style={{
                      color: foundCell ? "#fff" : active ? "#000" : "#e5e5e5",
                      backgroundColor: foundCell
                        ? `${accent}cc`
                        : active
                          ? accent
                          : "transparent",
                      borderRadius: 4,
                      outline: isCursor ? `2px solid ${accent}` : "none",
                      outlineOffset: isCursor ? 1 : 0,
                      touchAction: "none",
                    }}
                  >
                    {letter}
                  </button>
                );
              }),
            )}
          </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={enterKeyboardMode}
              data-testid="button-ws-keyboard"
              className="border-[#333] bg-transparent text-gray-300"
              title="Use arrow keys + Enter to play without a mouse"
            >
              <Keyboard className="mr-2 h-4 w-4" />
              Keyboard mode
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reset}
              data-testid="button-ws-reset"
              className="border-[#333] bg-transparent text-gray-300"
            >
              <RotateCw className="mr-2 h-4 w-4" />
              New puzzle
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadPdf}
              data-testid="button-ws-pdf"
              className="border-[#333] bg-transparent text-gray-300"
              title="Download printable PDF"
            >
              <Download className="mr-2 h-4 w-4" />
              Print PDF
            </Button>
            <span className="text-sm text-gray-400" data-testid="text-ws-progress">
              {found.length} / {targetWords.length} found
            </span>
          </div>
          <p className="text-xs text-gray-500 text-center max-w-md">
            <span aria-hidden>↑↓←→</span> to move · <kbd className="px-1 py-0.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-300">Enter</kbd> to start &amp; commit · <kbd className="px-1 py-0.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-300">Esc</kbd> to cancel
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Find these words
          </h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {targetWords.map((w) => {
              const isDone = found.some((f) => f.word === w);
              return (
                <li
                  key={w}
                  className="flex items-center gap-2 rounded-md border border-[#1e1e1e] bg-[#111] px-3 py-2"
                  data-testid={`ws-target-${w}`}
                >
                  {isDone ? (
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: accent }} />
                  ) : (
                    <span className="h-4 w-4 flex-shrink-0 rounded-full border border-[#333]" />
                  )}
                  <span
                    className="text-sm font-semibold uppercase tracking-wide"
                    style={{
                      color: isDone ? accent : "#e5e5e5",
                      textDecoration: isDone ? "line-through" : "none",
                    }}
                  >
                    {w}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          {announce}
        </div>
      </div>

      {completionStats && (
        <GameCompleteModal
          open={modalOpen}
          accent={accent}
          title="Word search complete."
          subtitle="Streak credit logged. Hammer it again."
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
