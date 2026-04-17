import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, RotateCw, Keyboard } from "lucide-react";
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
}

export default function WordSearchGame({
  entries,
  packId,
  difficulty,
  size,
  count,
  accent = "#C9941A",
  seed,
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
  const calledComplete = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const targetWords = useMemo(
    () => puzzle.placed.map((p) => p.word),
    [puzzle],
  );

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
    } else {
      setFound([]);
      setStartedAt(Date.now());
      setAttempts(0);
      setHintsUsed(0);
    }
  }, [puzzle, packId, difficulty, seedNonce]);

  // Autosave every 5s while in progress
  useEffect(() => {
    if (solved) return;
    const t = setInterval(() => {
      saveGame<SaveState>(saveKey, packId, difficulty, {
        found,
        startedAt,
        attempts,
        hintsUsed,
        seedNonce,
      });
    }, 5000);
    return () => clearInterval(t);
  }, [found, startedAt, attempts, hintsUsed, seedNonce, packId, difficulty, solved]);

  // Detect completion
  useEffect(() => {
    if (
      targetWords.length > 0 &&
      found.length === targetWords.length &&
      !calledComplete.current
    ) {
      calledComplete.current = true;
      setSolved(true);
      const durationSec = Math.round((Date.now() - startedAt) / 1000);
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
  }, [found, targetWords, onComplete, startedAt, attempts, hintsUsed, packId, difficulty]);

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
    [puzzle, targetWords, found],
  );

  function handleCellDown(row: number, col: number) {
    setStart({ row, col });
    setHover({ row, col });
    setKeyboardMode(false);
  }

  function handleCellEnter(row: number, col: number) {
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
      if (solved) return;
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
    [keyboardCursor, keyboardMode, solved, start, puzzle.size, tryCommit],
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
          <div
            ref={containerRef}
            tabIndex={0}
            role="grid"
            aria-label={`Word search grid, ${puzzle.size} by ${puzzle.size}. Use arrow keys to move. Press Enter to start a selection, then arrows to extend, then Enter again to commit.`}
            onKeyDown={handleKeyDown}
            className="inline-grid select-none rounded-md border border-[#1e1e1e] bg-[#0f0f0f] p-2 outline-none focus:ring-2 focus:ring-[#C9941A]/60"
            style={{
              gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
            }}
            onMouseLeave={() => setHover(null)}
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
                    onMouseDown={() => handleCellDown(r, c)}
                    onMouseEnter={() => handleCellEnter(r, c)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleCellDown(r, c);
                    }}
                    onTouchMove={(e) => {
                      const touch = e.touches[0];
                      const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
                      if (el?.dataset.row && el?.dataset.col) {
                        handleCellEnter(Number(el.dataset.row), Number(el.dataset.col));
                      }
                    }}
                    data-row={r}
                    data-col={c}
                    data-testid={`ws-cell-${r}-${c}`}
                    className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center text-sm sm:text-base font-bold uppercase transition-colors"
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
                    }}
                  >
                    {letter}
                  </button>
                );
              }),
            )}
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
