import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, Trophy } from "lucide-react";
import type { PackEntry } from "@shared/brainGymPacks";

interface Props {
  entries: PackEntry[];
  pairs?: number;
  accent?: string;
  onComplete?: () => void;
}

interface Card {
  id: number;
  pairId: number;
  type: "word" | "definition";
  word: string;
  definition: string;
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
  pairs = 8,
  accent = "#C9941A",
  onComplete,
}: Props) {
  const [seed, setSeed] = useState(() => Date.now());

  const cards = useMemo<Card[]>(() => {
    const chosen = shuffle(entries, seed).slice(0, pairs);
    const all: Card[] = [];
    chosen.forEach((e, i) => {
      all.push({ id: i * 2, pairId: i, type: "word", word: e.word, definition: e.definition });
      all.push({ id: i * 2 + 1, pairId: i, type: "definition", word: e.word, definition: e.definition });
    });
    return shuffle(all, seed + 1);
  }, [entries, pairs, seed]);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setSolved(false);
  }, [cards]);

  useEffect(() => {
    if (matched.length > 0 && matched.length === cards.length) {
      setSolved(true);
      onComplete?.();
    }
  }, [matched, cards, onComplete]);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    const cardA = cards.find((c) => c.id === a);
    const cardB = cards.find((c) => c.id === b);
    if (cardA && cardB && cardA.pairId === cardB.pairId && cardA.id !== cardB.id) {
      setMatched((prev) => [...prev, a, b]);
      setFlipped([]);
      setMoves((m) => m + 1);
    } else {
      const t = setTimeout(() => {
        setFlipped([]);
        setMoves((m) => m + 1);
      }, 850);
      return () => clearTimeout(t);
    }
  }, [flipped, cards]);

  function handleFlip(id: number) {
    if (flipped.length === 2) return;
    if (matched.includes(id) || flipped.includes(id)) return;
    setFlipped((prev) => [...prev, id]);
  }

  function reset() {
    setSeed(Date.now());
  }

  const isFlipped = (id: number) => flipped.includes(id) || matched.includes(id);
  const isMatched = (id: number) => matched.includes(id);

  return (
    <div className="flex flex-col gap-4" data-testid="game-memory-match">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          Match each <span className="font-semibold" style={{ color: accent }}>word</span> to its definition.
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400" data-testid="text-mm-progress">
            {matched.length / 2} / {cards.length / 2} pairs · {moves} moves
          </span>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card) => {
          const flipped = isFlipped(card.id);
          const matchedNow = isMatched(card.id);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleFlip(card.id)}
              data-testid={`mm-card-${card.id}`}
              className="relative aspect-[3/4] rounded-md text-left transition-transform hover-elevate active-elevate-2"
              style={{
                perspective: 1000,
                cursor: flipped ? "default" : "pointer",
              }}
              disabled={matchedNow}
            >
              <div
                className="absolute inset-0 rounded-md transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: flipped ? "rotateY(180deg)" : "none",
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
      {solved && (
        <div
          className="flex items-center gap-3 rounded-md border p-4"
          style={{ borderColor: `${accent}55`, backgroundColor: `${accent}15` }}
          data-testid="mm-solved-banner"
        >
          <Trophy className="h-6 w-6" style={{ color: accent }} />
          <div>
            <p className="font-bold text-white">All pairs matched in {moves} moves.</p>
            <p className="text-sm text-gray-400">Streak credit logged. Hammer it again.</p>
          </div>
        </div>
      )}
    </div>
  );
}
