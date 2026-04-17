import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, RotateCw, Trophy } from "lucide-react";
import {
  generateWordSearch,
  getCellsBetween,
  readCells,
} from "@/lib/wordSearch";
import type { PackEntry } from "@shared/brainGymPacks";

interface Props {
  entries: PackEntry[];
  size?: number;
  accent?: string;
  onComplete?: () => void;
}

interface FoundWord {
  word: string;
  cells: { row: number; col: number }[];
}

export default function WordSearchGame({
  entries,
  size = 14,
  accent = "#C9941A",
  onComplete,
}: Props) {
  const wordsForPuzzle = useMemo(
    () =>
      entries
        .filter((e) => e.word.replace(/[^A-Za-z]/g, "").length <= size)
        .slice(0, 12),
    [entries, size],
  );

  const [seedNonce, setSeedNonce] = useState(0);
  const puzzle = useMemo(
    () => generateWordSearch(wordsForPuzzle.map((e) => e.word), size, Date.now() + seedNonce),
    [wordsForPuzzle, size, seedNonce],
  );

  const [start, setStart] = useState<{ row: number; col: number } | null>(null);
  const [hover, setHover] = useState<{ row: number; col: number } | null>(null);
  const [found, setFound] = useState<FoundWord[]>([]);
  const [solved, setSolved] = useState(false);
  const calledComplete = useRef(false);

  const targetWords = useMemo(
    () => puzzle.placed.map((p) => p.word),
    [puzzle],
  );

  useEffect(() => {
    setStart(null);
    setHover(null);
    setFound([]);
    setSolved(false);
    calledComplete.current = false;
  }, [puzzle]);

  useEffect(() => {
    if (
      targetWords.length > 0 &&
      found.length === targetWords.length &&
      !calledComplete.current
    ) {
      calledComplete.current = true;
      setSolved(true);
      onComplete?.();
    }
  }, [found, targetWords, onComplete]);

  const activeCells: { row: number; col: number }[] = useMemo(() => {
    if (!start || !hover) return [];
    return getCellsBetween(start.row, start.col, hover.row, hover.col) ?? [];
  }, [start, hover]);

  const isFound = (row: number, col: number): FoundWord | undefined =>
    found.find((f) => f.cells.some((c) => c.row === row && c.col === col));

  const isActive = (row: number, col: number): boolean =>
    activeCells.some((c) => c.row === row && c.col === col);

  function handleCellDown(row: number, col: number) {
    setStart({ row, col });
    setHover({ row, col });
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
    const cells = getCellsBetween(start.row, start.col, hover.row, hover.col);
    if (cells) {
      const reading = readCells(puzzle.grid, cells);
      const reversed = reading.split("").reverse().join("");
      const matched = targetWords.find(
        (w) => w === reading || w === reversed,
      );
      const alreadyFound = matched && found.some((f) => f.word === matched);
      if (matched && !alreadyFound) {
        setFound((prev) => [...prev, { word: matched, cells }]);
      }
    }
    setStart(null);
    setHover(null);
  }

  function reset() {
    setSeedNonce((n) => n + 1);
  }

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6"
      onMouseUp={handleCellUp}
      onTouchEnd={handleCellUp}
      data-testid="game-word-search"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="inline-grid select-none rounded-md border border-[#1e1e1e] bg-[#0f0f0f] p-2"
          style={{
            gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
          }}
          onMouseLeave={() => setHover(null)}
        >
          {puzzle.grid.map((row, r) =>
            row.map((letter, c) => {
              const foundCell = isFound(r, c);
              const active = isActive(r, c);
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
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
                  }}
                >
                  {letter}
                </button>
              );
            }),
          )}
        </div>
        <div className="flex items-center gap-3">
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
        {solved && (
          <div
            className="mt-2 flex items-center gap-3 rounded-md border p-4"
            style={{ borderColor: `${accent}55`, backgroundColor: `${accent}15` }}
            data-testid="ws-solved-banner"
          >
            <Trophy className="h-6 w-6" style={{ color: accent }} />
            <div>
              <p className="font-bold text-white">Puzzle complete.</p>
              <p className="text-sm text-gray-400">
                Streak credit logged. Hammer it again tomorrow.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
