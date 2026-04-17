import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, RotateCw, Trophy, Lightbulb } from "lucide-react";
import {
  buildCellNumberMap,
  generateCrossword,
  type CrosswordEntry,
  type CrosswordLayout,
} from "@/lib/crossword";
import type { PackEntry } from "@shared/brainGymPacks";

interface Props {
  entries: PackEntry[];
  accent?: string;
  onComplete?: () => void;
}

type Direction = "across" | "down";

export default function CrosswordGame({ entries, accent = "#C9941A", onComplete }: Props) {
  const layout = useMemo<CrosswordLayout>(
    () => generateCrossword(entries.map((e) => ({ word: e.word, clue: e.clue }))),
    [entries],
  );
  const numberMap = useMemo(() => buildCellNumberMap(layout), [layout]);

  const [values, setValues] = useState<(string | null)[][]>(() =>
    layout.grid.map((row) => row.map((c) => (c === null ? null : ""))),
  );
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState(false);
  const calledComplete = useRef(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setValues(layout.grid.map((row) => row.map((c) => (c === null ? null : ""))));
    setActive(layout.entries[0] ? { row: layout.entries[0].row, col: layout.entries[0].col } : null);
    setDirection("across");
    setRevealed(false);
    setSolved(false);
    calledComplete.current = false;
  }, [layout]);

  useEffect(() => {
    if (layout.entries.length === 0) return;
    let allCorrect = true;
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        const target = layout.grid[r][c];
        if (target === null) continue;
        if ((values[r]?.[c] ?? "") !== target) {
          allCorrect = false;
          break;
        }
      }
      if (!allCorrect) break;
    }
    if (allCorrect && !calledComplete.current) {
      calledComplete.current = true;
      setSolved(true);
      onComplete?.();
    }
  }, [values, layout, onComplete]);

  function focusCell(r: number, c: number) {
    const el = inputRefs.current[`${r},${c}`];
    if (el) el.focus();
  }

  function activateCell(r: number, c: number) {
    if (layout.grid[r][c] === null) return;
    if (active && active.row === r && active.col === c) {
      setDirection((d) => (d === "across" ? "down" : "across"));
    } else {
      setActive({ row: r, col: c });
    }
    focusCell(r, c);
  }

  function nextCell(r: number, c: number, dir: Direction): { row: number; col: number } | null {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= layout.rows || nc >= layout.cols) return null;
    if (layout.grid[nr][nc] === null) return null;
    return { row: nr, col: nc };
  }

  function prevCell(r: number, c: number, dir: Direction): { row: number; col: number } | null {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    const nr = r - dr;
    const nc = c - dc;
    if (nr < 0 || nc < 0) return null;
    if (layout.grid[nr][nc] === null) return null;
    return { row: nr, col: nc };
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const n = nextCell(r, c, "across");
      if (n) {
        setDirection("across");
        setActive(n);
        focusCell(n.row, n.col);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const n = prevCell(r, c, "across");
      if (n) {
        setDirection("across");
        setActive(n);
        focusCell(n.row, n.col);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = nextCell(r, c, "down");
      if (n) {
        setDirection("down");
        setActive(n);
        focusCell(n.row, n.col);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = prevCell(r, c, "down");
      if (n) {
        setDirection("down");
        setActive(n);
        focusCell(n.row, n.col);
      }
    } else if (e.key === "Backspace") {
      if ((values[r]?.[c] ?? "") === "") {
        const n = prevCell(r, c, direction);
        if (n) {
          setActive(n);
          focusCell(n.row, n.col);
        }
      }
    } else if (e.key === " ") {
      e.preventDefault();
      setDirection((d) => (d === "across" ? "down" : "across"));
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, r: number, c: number) {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    const letter = raw.slice(-1);
    setValues((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][c] = letter;
      return next;
    });
    if (letter) {
      const n = nextCell(r, c, direction);
      if (n) {
        setActive(n);
        focusCell(n.row, n.col);
      }
    }
  }

  function reveal() {
    setValues(layout.grid.map((row) => row.map((c) => (c === null ? null : c))));
    setRevealed(true);
  }

  function reset() {
    setValues(layout.grid.map((row) => row.map((c) => (c === null ? null : ""))));
    setRevealed(false);
    setSolved(false);
    calledComplete.current = false;
    if (layout.entries[0]) {
      setActive({ row: layout.entries[0].row, col: layout.entries[0].col });
    }
  }

  function hintLetter() {
    if (!active) return;
    const target = layout.grid[active.row][active.col];
    if (!target) return;
    setValues((prev) => {
      const next = prev.map((row) => row.slice());
      next[active.row][active.col] = target;
      return next;
    });
  }

  function activateEntry(entry: CrosswordEntry) {
    setActive({ row: entry.row, col: entry.col });
    setDirection(entry.direction);
    focusCell(entry.row, entry.col);
  }

  const acrossEntries = layout.entries.filter((e) => e.direction === "across");
  const downEntries = layout.entries.filter((e) => e.direction === "down");

  function isInActiveWord(r: number, c: number): boolean {
    if (!active) return false;
    if (direction === "across") {
      if (r !== active.row) return false;
      let startC = active.col;
      while (startC > 0 && layout.grid[r][startC - 1] !== null) startC--;
      let endC = active.col;
      while (endC < layout.cols - 1 && layout.grid[r][endC + 1] !== null) endC++;
      return c >= startC && c <= endC;
    }
    if (c !== active.col) return false;
    let startR = active.row;
    while (startR > 0 && layout.grid[startR - 1][c] !== null) startR--;
    let endR = active.row;
    while (endR < layout.rows - 1 && layout.grid[endR + 1][c] !== null) endR++;
    return r >= startR && r <= endR;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6" data-testid="game-crossword">
      <div className="flex flex-col items-center gap-4">
        <div
          className="inline-grid rounded-md border border-[#1e1e1e] bg-[#0f0f0f] p-1"
          style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))` }}
        >
          {layout.grid.map((row, r) =>
            row.map((cell, c) => {
              if (cell === null) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="h-7 w-7 sm:h-9 sm:w-9 bg-[#0a0a0a]"
                    style={{ borderRadius: 2 }}
                  />
                );
              }
              const isActive = active?.row === r && active?.col === c;
              const inWord = isInActiveWord(r, c);
              const num = numberMap[`${r},${c}`];
              const value = values[r]?.[c] ?? "";
              return (
                <div
                  key={`${r}-${c}`}
                  className="relative h-7 w-7 sm:h-9 sm:w-9"
                  style={{
                    borderRadius: 2,
                    backgroundColor: isActive
                      ? accent
                      : inWord
                        ? `${accent}33`
                        : "#1a1a1a",
                  }}
                >
                  {num !== undefined && (
                    <span className="absolute left-0.5 top-0 text-[8px] sm:text-[9px] font-bold leading-none text-gray-400">
                      {num}
                    </span>
                  )}
                  <input
                    ref={(el) => (inputRefs.current[`${r},${c}`] = el)}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleChange(e, r, c)}
                    onKeyDown={(e) => handleKey(e, r, c)}
                    onFocus={() => setActive({ row: r, col: c })}
                    onClick={() => activateCell(r, c)}
                    data-testid={`cw-cell-${r}-${c}`}
                    className="h-full w-full bg-transparent text-center text-sm sm:text-base font-bold uppercase outline-none"
                    style={{ color: isActive ? "#000" : "#fff", caretColor: "transparent" }}
                  />
                </div>
              );
            }),
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={hintLetter}
            data-testid="button-cw-hint"
            className="border-[#333] bg-transparent text-gray-300"
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            Hint letter
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={reveal}
            data-testid="button-cw-reveal"
            className="border-[#333] bg-transparent text-gray-300"
          >
            <Eye className="mr-2 h-4 w-4" />
            Reveal all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={reset}
            data-testid="button-cw-reset"
            className="border-[#333] bg-transparent text-gray-300"
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">
            Across
          </h3>
          <ol className="space-y-2">
            {acrossEntries.map((entry) => {
              const isActiveEntry =
                active && active.row === entry.row && direction === "across";
              return (
                <li
                  key={`a-${entry.number}`}
                  className="cursor-pointer rounded px-2 py-1 text-sm transition-colors"
                  onClick={() => activateEntry(entry)}
                  data-testid={`cw-clue-across-${entry.number}`}
                  style={{
                    color: isActiveEntry ? "#fff" : "#9ca3af",
                    backgroundColor: isActiveEntry ? `${accent}33` : "transparent",
                  }}
                >
                  <span className="font-bold" style={{ color: accent }}>
                    {entry.number}.
                  </span>{" "}
                  {entry.clue}
                </li>
              );
            })}
          </ol>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">
            Down
          </h3>
          <ol className="space-y-2">
            {downEntries.map((entry) => {
              const isActiveEntry =
                active && active.col === entry.col && direction === "down";
              return (
                <li
                  key={`d-${entry.number}`}
                  className="cursor-pointer rounded px-2 py-1 text-sm transition-colors"
                  onClick={() => activateEntry(entry)}
                  data-testid={`cw-clue-down-${entry.number}`}
                  style={{
                    color: isActiveEntry ? "#fff" : "#9ca3af",
                    backgroundColor: isActiveEntry ? `${accent}33` : "transparent",
                  }}
                >
                  <span className="font-bold" style={{ color: accent }}>
                    {entry.number}.
                  </span>{" "}
                  {entry.clue}
                </li>
              );
            })}
          </ol>
        </div>
        {solved && (
          <div
            className="sm:col-span-2 flex items-center gap-3 rounded-md border p-4"
            style={{ borderColor: `${accent}55`, backgroundColor: `${accent}15` }}
            data-testid="cw-solved-banner"
          >
            <Trophy className="h-6 w-6" style={{ color: accent }} />
            <div>
              <p className="font-bold text-white">Crossword solved.</p>
              <p className="text-sm text-gray-400">
                {revealed ? "Revealed run — try a fresh one tomorrow." : "Streak credit logged."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
