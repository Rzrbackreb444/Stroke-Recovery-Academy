import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, RotateCw, Lightbulb, Volume2 } from "lucide-react";
import {
  buildCellNumberMap,
  generateCrossword,
  type CrosswordEntry,
  type CrosswordLayout,
} from "@/lib/crossword";
import type { PackEntry } from "@shared/brainGymPacks";
import { playCorrect, playWrong, isMuted } from "@/lib/gameAudio";
import { saveGame, loadGame, clearGame } from "@/lib/gameStorage";
import GameCompleteModal, { type GameCompletionStats } from "./GameCompleteModal";

interface Props {
  entries: PackEntry[];
  packId: string;
  difficulty: "easy" | "medium" | "hard";
  count: number;
  accent?: string;
  onComplete?: (stats: GameCompletionStats) => void;
}

type Direction = "across" | "down";

interface SaveState {
  values: (string | null)[][];
  startedAt: number;
  hintsUsed: number;
  attempts: number;
  layoutKey: string;
}

// Singleton audio element — reused so a new "Listen" stops the previous one.
let _ttsAudio: HTMLAudioElement | null = null;

function fallbackSpeak(text: string) {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

async function speak(text: string) {
  if (typeof window === "undefined" || isMuted()) return;

  // Stop any in-flight ElevenLabs playback or Web Speech utterance.
  if (_ttsAudio) {
    try { _ttsAudio.pause(); } catch { /* ignore */ }
    _ttsAudio = null;
  }
  if ("speechSynthesis" in window) {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }

  // Try premium ElevenLabs TTS first (Sasquatch voice). Falls back gracefully
  // to the Web Speech API on auth failure, network error, or unsupported envs.
  try {
    const r = await fetch("/api/voice/elevenlabs/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text }),
    });
    if (!r.ok) throw new Error(`tts ${r.status}`);
    const data = await r.json();
    if (!data?.audioBase64) throw new Error("no audio");
    const audio = new Audio(`data:${data.mimeType || "audio/mpeg"};base64,${data.audioBase64}`);
    audio.volume = 0.9;
    _ttsAudio = audio;
    await audio.play();
  } catch {
    fallbackSpeak(text);
  }
}

export default function CrosswordGame({
  entries,
  packId,
  difficulty,
  count,
  accent = "#C9941A",
  onComplete,
}: Props) {
  const trimmedEntries = useMemo(() => entries.slice(0, count), [entries, count]);
  const layout = useMemo<CrosswordLayout>(
    () => generateCrossword(trimmedEntries.map((e) => ({ word: e.word, clue: e.clue }))),
    [trimmedEntries],
  );
  const numberMap = useMemo(() => buildCellNumberMap(layout), [layout]);
  const layoutKey = useMemo(
    () => `${layout.rows}x${layout.cols}.${layout.entries.map((e) => e.word).join(",")}`,
    [layout],
  );

  const [values, setValues] = useState<(string | null)[][]>(() =>
    layout.grid.map((row) => row.map((c) => (c === null ? null : ""))),
  );
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [completionStats, setCompletionStats] = useState<GameCompletionStats | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [announce, setAnnounce] = useState("");
  const calledComplete = useRef(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const saveKey = "crossword";

  useEffect(() => {
    const fresh = layout.grid.map((row) => row.map((c) => (c === null ? null : "")));
    const saved = loadGame<SaveState>(saveKey, packId, difficulty);
    if (saved && saved.layoutKey === layoutKey) {
      setValues(saved.values);
      setStartedAt(saved.startedAt);
      setHintsUsed(saved.hintsUsed || 0);
      setAttempts(saved.attempts || 0);
    } else {
      setValues(fresh);
      setStartedAt(Date.now());
      setHintsUsed(0);
      setAttempts(0);
    }
    setActive(layout.entries[0] ? { row: layout.entries[0].row, col: layout.entries[0].col } : null);
    setDirection("across");
    setRevealed(false);
    setSolved(false);
    setModalOpen(false);
    setCompletionStats(null);
    calledComplete.current = false;
  }, [layout, layoutKey, packId, difficulty]);

  // Autosave
  useEffect(() => {
    if (solved) return;
    const t = setInterval(() => {
      saveGame<SaveState>(saveKey, packId, difficulty, {
        values,
        startedAt,
        hintsUsed,
        attempts,
        layoutKey,
      });
    }, 5000);
    return () => clearInterval(t);
  }, [values, startedAt, hintsUsed, attempts, layoutKey, packId, difficulty, solved]);

  // Detect completion
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
      const durationSec = Math.round((Date.now() - startedAt) / 1000);
      const totalCells = layout.entries.reduce((sum, e) => sum + e.word.length, 0);
      const accuracyPct = revealed
        ? 0
        : attempts > 0
          ? Math.max(0, Math.min(100, Math.round((totalCells / attempts) * 100)))
          : 100;
      const stats: GameCompletionStats = {
        durationSec,
        hintsUsed: hintsUsed + (revealed ? 999 : 0),
        movesOrAttempts: attempts,
        accuracyPct,
      };
      setCompletionStats({ ...stats, hintsUsed: revealed ? 0 : hintsUsed });
      setModalOpen(true);
      clearGame(saveKey, packId, difficulty);
      if (!revealed) onComplete?.(stats);
    }
  }, [values, layout, onComplete, startedAt, hintsUsed, attempts, revealed, packId, difficulty]);

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

  function nextCell(r: number, c: number, dir: Direction) {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= layout.rows || nc >= layout.cols) return null;
    if (layout.grid[nr][nc] === null) return null;
    return { row: nr, col: nc };
  }

  function prevCell(r: number, c: number, dir: Direction) {
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
    const target = layout.grid[r][c];
    setValues((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][c] = letter;
      return next;
    });
    if (letter) {
      setAttempts((a) => a + 1);
      if (target && letter === target) {
        playCorrect();
      } else if (target) {
        playWrong();
      }
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
    setHintsUsed(0);
    setAttempts(0);
    setStartedAt(Date.now());
    calledComplete.current = false;
    clearGame(saveKey, packId, difficulty);
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
    setHintsUsed((h) => h + 1);
    setAttempts((a) => a + 1);
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

  function clueRow(entry: CrosswordEntry, isActiveEntry: boolean) {
    return (
      <li
        key={`${entry.direction}-${entry.number}`}
        className="group flex items-start gap-2 rounded px-2 py-1.5 text-sm transition-colors"
        style={{
          color: isActiveEntry ? "#fff" : "#9ca3af",
          backgroundColor: isActiveEntry ? `${accent}33` : "transparent",
        }}
      >
        <button
          type="button"
          className="flex-1 text-left cursor-pointer"
          onClick={() => activateEntry(entry)}
          data-testid={`cw-clue-${entry.direction}-${entry.number}`}
        >
          <span className="font-bold mr-1" style={{ color: accent }}>
            {entry.number}.
          </span>
          {entry.clue}
        </button>
        <button
          type="button"
          aria-label={`Read clue ${entry.number} ${entry.direction} aloud`}
          onClick={() => {
            speak(`${entry.direction} ${entry.number}. ${entry.clue}`);
            setAnnounce(`Read aloud: ${entry.clue}`);
          }}
          className="flex-shrink-0 rounded p-1 text-gray-500 hover:text-[#C9941A] focus:outline-none focus:ring-1 focus:ring-[#C9941A]"
          data-testid={`cw-listen-${entry.direction}-${entry.number}`}
          title="Read clue aloud"
        >
          <Volume2 className="h-3.5 w-3.5" />
        </button>
      </li>
    );
  }

  return (
    <>
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
                      aria-label={`Row ${r + 1} column ${c + 1}`}
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
            <ol className="space-y-1">
              {acrossEntries.map((entry) => {
                const isActiveEntry =
                  !!(active && active.row === entry.row && direction === "across");
                return clueRow(entry, isActiveEntry);
              })}
            </ol>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">
              Down
            </h3>
            <ol className="space-y-1">
              {downEntries.map((entry) => {
                const isActiveEntry =
                  !!(active && active.col === entry.col && direction === "down");
                return clueRow(entry, isActiveEntry);
              })}
            </ol>
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
          title={revealed ? "Crossword revealed." : "Crossword solved."}
          subtitle={revealed ? "Revealed run — try a fresh one tomorrow." : "Streak credit logged."}
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
