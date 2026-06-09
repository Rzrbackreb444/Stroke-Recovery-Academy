import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCw, Share2, Flame, Target, Clock, Lightbulb } from "lucide-react";
import { playVictory } from "@/lib/gameAudio";

export interface GameCompletionStats {
  durationSec: number;
  hintsUsed: number;
  movesOrAttempts?: number;
  accuracyPct?: number;
  totalSolved?: number;
  currentStreak?: number;
}

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  accent?: string;
  stats: GameCompletionStats;
  onPlayAgain: () => void;
  onClose: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function GameCompleteModal({
  open,
  title,
  subtitle = "Streak credit logged. Hammer it again tomorrow.",
  accent = "#E2741B",
  stats,
  onPlayAgain,
  onClose,
}: Props) {
  useEffect(() => {
    if (open) playVictory();
  }, [open]);

  const items: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    { label: "Time", value: formatTime(stats.durationSec), icon: <Clock className="h-4 w-4" /> },
    { label: "Hints used", value: String(stats.hintsUsed), icon: <Lightbulb className="h-4 w-4" /> },
  ];
  if (typeof stats.accuracyPct === "number") {
    items.push({
      label: "Accuracy",
      value: `${Math.round(stats.accuracyPct)}%`,
      icon: <Target className="h-4 w-4" />,
    });
  }
  if (typeof stats.currentStreak === "number") {
    items.push({
      label: "Streak",
      value: `${stats.currentStreak} 🔥`.replace("🔥", ""),
      icon: <Flame className="h-4 w-4" />,
    });
  }

  function share() {
    const text = `Just solved a Brain Gym puzzle in ${formatTime(stats.durationSec)} with ${stats.hintsUsed} hints. Never zero. — Stroke Recovery Academy`;
    const url = "https://strokerecoveryacademy.com/recovery/brain-gym";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      (navigator as any).share({ title: "Brain Gym", text, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="border-[#1e1e1e] bg-[#0D0D0D] text-white sm:max-w-md"
        data-testid="modal-game-complete"
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${accent}22`, border: `2px solid ${accent}` }}
          >
            <Trophy className="h-8 w-8" style={{ color: accent }} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map((it) => (
            <div
              key={it.label}
              className="rounded-md border border-[#1e1e1e] bg-[#111] p-3"
              data-testid={`stat-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
                <span style={{ color: accent }}>{it.icon}</span>
                {it.label}
              </div>
              <div className="mt-1 text-2xl font-black text-white">{it.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={onPlayAgain}
            className="flex-1 bg-[#E2741B] text-black"
            style={{ backgroundColor: accent, color: "#000" }}
            data-testid="button-play-again"
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Play again
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={share}
            className="border-[#333] bg-transparent text-gray-200"
            data-testid="button-share-result"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
