import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Coins, Share2 } from "lucide-react";
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
      <DialogContent className="bg-[#0D0D0D] border border-[#C9941A]/40 text-white max-w-md" data-testid="dialog-sasquatch-quote">
        <DialogTitle className="sr-only">Check-in reward</DialogTitle>
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-[#C9941A]/10 border border-[#C9941A]/40 flex items-center justify-center">
            <Flame className="w-6 h-6 text-[#C9941A]" />
          </div>
          <div className="text-xs uppercase tracking-widest text-[#C9941A]">Sasquatch says</div>
          <p className="text-lg leading-snug font-serif" data-testid="text-quote">"{quote.text}"</p>

          <div className="flex items-center gap-2 text-sm text-gray-300 bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2" data-testid="text-credits-earned">
            <Coins className="w-4 h-4 text-[#C9941A]" />
            <span>+{creditsEarned} Power Points earned</span>
            {streakBonusLabel && <span className="text-[#C9941A]">· {streakBonusLabel}</span>}
          </div>

          {typeof streak === "number" && streak > 1 && (
            <div className="text-xs text-gray-400" data-testid="text-streak-count">{streak}-day streak and counting.</div>
          )}

          <div className="flex gap-2 w-full pt-2">
            <Button variant="outline" className="flex-1" onClick={share} data-testid="button-share-quote">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button className="flex-1 bg-[#C9941A] text-black hover:bg-[#b8831a]" onClick={onClose} data-testid="button-close-quote">
              Keep going
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
