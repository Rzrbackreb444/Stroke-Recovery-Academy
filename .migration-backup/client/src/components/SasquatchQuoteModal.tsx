import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Coins, Share2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  quote: { text: string; tone: string } | null;
  creditsEarned: number;
  streakBonusLabel?: string | null;
  streak?: number;
}

export default function SasquatchQuoteModal({ open, onClose, quote, creditsEarned, streakBonusLabel, streak }: Props) {
  const { toast } = useToast();
  if (!quote) return null;

  const share = async () => {
    const text = `"${quote.text}" — Sasquatch\nFrom my recovery journey on Stroke Recovery Academy.`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Quote copied to clipboard" });
      }
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0D0D0D] border border-[#E2741B]/40 text-white max-w-md" data-testid="dialog-sasquatch-quote">
        <DialogTitle className="sr-only">Check-in reward</DialogTitle>
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-[#E2741B]/10 border border-[#E2741B]/40 flex items-center justify-center">
            <Flame className="w-6 h-6 text-[#E2741B]" />
          </div>
          <div className="text-xs uppercase tracking-widest text-[#E2741B]">Sasquatch says</div>
          <p className="text-lg leading-snug font-serif" data-testid="text-quote">"{quote.text}"</p>

          <div className="flex items-center gap-2 text-sm text-gray-300 bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2" data-testid="text-credits-earned">
            <Coins className="w-4 h-4 text-[#E2741B]" />
            <span>+{creditsEarned} Power Points earned</span>
            {streakBonusLabel && <span className="text-[#E2741B]">· {streakBonusLabel}</span>}
          </div>

          {typeof streak === "number" && streak > 1 && (
            <div className="text-xs text-gray-400" data-testid="text-streak-count">{streak}-day streak and counting.</div>
          )}

          {/* Streak milestone upgrade nudge — shown at 7, 14, 21, 30 day milestones */}
          {typeof streak === "number" && [7, 14, 21, 30, 66].includes(streak) && (
            <Link href="/recovery/premium" onClick={onClose} className="w-full block">
              <div
                className="w-full rounded-lg border border-[#E2741B]/30 bg-[#120d04] px-4 py-3 text-center hover-elevate"
                data-testid="banner-streak-upgrade"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#E2741B] mb-0.5">
                  <Sparkles className="w-3 h-3 inline mr-1" />{streak}-day milestone
                </p>
                <p className="text-xs text-gray-300 font-semibold">
                  You've built real momentum. Go unlimited — 7-day free trial.
                </p>
              </div>
            </Link>
          )}

          <div className="flex gap-2 w-full pt-2">
            <Button variant="outline" className="flex-1" onClick={share} data-testid="button-share-quote">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button className="flex-1 bg-[#E2741B] text-black hover:bg-[#b8831a]" onClick={onClose} data-testid="button-close-quote">
              Keep going
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
