import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  receiverId: string;
  receiverName?: string;
  size?: "sm" | "default";
  className?: string;
}

export default function DailyGiftButton({ receiverId, receiverName, size = "sm", className }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: status } = useQuery<{ canSend: boolean; nextAvailableAt: string | null; pointsPerGift: number }>({
    queryKey: ["/api/engagement/daily-gift/status"],
  });

  const send = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/engagement/daily-gift", { receiverId, message: message.trim() || undefined });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/engagement/daily-gift/status"] });
      qc.invalidateQueries({ queryKey: ["/api/power-points/unread-count"] });
      toast({ title: "Power passed.", description: `${status?.pointsPerGift || 25} credits delivered to ${receiverName || "this survivor"}.` });
      setOpen(false);
      setMessage("");
    },
    onError: (e: any) => {
      toast({ title: "Couldn't send today", description: e?.message || "Try again in a moment.", variant: "destructive" });
    },
  });

  const disabled = !status?.canSend;
  const nextTime = status?.nextAvailableAt ? new Date(status.nextAvailableAt).toLocaleString(undefined, { hour: "numeric", minute: "2-digit" }) : null;

  return (
    <>
      <Button
        size={size}
        variant="outline"
        className={`border-[#E2741B]/40 text-[#E2741B] hover:text-[#E2741B] ${className || ""}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        disabled={disabled}
        data-testid={`button-daily-gift-${receiverId}`}
        title={disabled && nextTime ? `Next free gift available at ${nextTime}` : "Pass the Power — free daily gift"}
      >
        <Gift className="w-4 h-4 mr-1.5" />
        {disabled ? "Pass used today" : "Pass the Power"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0D0D0D] border border-[#E2741B]/40 text-white max-w-sm" data-testid="dialog-daily-gift">
          <DialogTitle className="text-[#E2741B]">Pass the Power</DialogTitle>
          <DialogDescription className="text-gray-400">
            One free gift per day — must be given away. {status?.pointsPerGift || 25} credits to {receiverName || "this survivor"}.
          </DialogDescription>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 280))}
            placeholder="Optional note of encouragement…"
            className="bg-[#1a1a1a] border-[#333] text-white"
            rows={3}
            data-testid="input-daily-gift-message"
          />
          <div className="text-xs text-gray-500 text-right">{message.length}/280</div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} data-testid="button-daily-gift-cancel">Cancel</Button>
            <Button
              className="flex-1 bg-[#E2741B] text-black hover:bg-[#b8831a]"
              onClick={() => send.mutate()}
              disabled={send.isPending}
              data-testid="button-daily-gift-send"
            >
              {send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send the Power"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
