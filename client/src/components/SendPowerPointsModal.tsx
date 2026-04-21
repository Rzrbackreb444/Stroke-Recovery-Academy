import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Zap, Loader2 } from "lucide-react";

export interface PowerPointPackage {
  key: "cheer" | "spark" | "boost" | "surge" | "beast";
  label: string;
  tagline: string;
  points: number;
  amountCents: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  receiverId: string;
  receiverName: string;
  receiverAvatarUrl?: string | null;
}

export default function SendPowerPointsModal({ open, onOpenChange, receiverId, receiverName, receiverAvatarUrl }: Props) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<PowerPointPackage["key"]>("spark");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { data: packagesResp } = useQuery<{ packages: PowerPointPackage[] }>({
    queryKey: ["/api/power-points/packages"],
    enabled: open,
  });
  const packages = packagesResp?.packages || [];

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/power-points/checkout", {
        receiverId, packageKey: selected, message: message.trim() || undefined, isAnonymous,
      });
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (e: any) => {
      toast({ title: "Couldn't start checkout", description: e?.message || "Try again in a moment.", variant: "destructive" });
    },
  });

  const fmtUsd = (c: number) => `$${(c / 100).toFixed(2)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0D0D0D] border-[#333] text-white max-w-lg" data-testid="modal-send-power-points">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#C9941A]" /> Send Power Points
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Push them forward today. Your points fund recovery — every point unlocks therapist content, exercises, and AI tools.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#1a1a1a] border border-[#333]">
          <Avatar className="w-10 h-10 border border-[#333]">
            <AvatarImage src={receiverAvatarUrl || ""} />
            <AvatarFallback className="bg-[#2a2a2a] text-[#C9941A]">{receiverName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-gray-400">Sending to</p>
            <p className="font-semibold text-white">{receiverName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {packages.map((p) => {
            const active = selected === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelected(p.key)}
                data-testid={`pkg-${p.key}`}
                className={`text-left p-3 rounded-md border transition-all ${
                  active
                    ? "border-[#C9941A] bg-[#C9941A]/10 ring-1 ring-[#C9941A]"
                    : "border-[#333] bg-[#1a1a1a] hover:bg-[#222]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{p.label}</span>
                  <span className="text-xs text-gray-400">{fmtUsd(p.amountCents)}</span>
                </div>
                <div className="mt-1 text-[#C9941A] font-bold text-sm">{p.points.toLocaleString()} pts</div>
                <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{p.tagline}</div>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400">Add a motivational note (optional)</label>
          <Textarea
            value={message}
            maxLength={500}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Day 47, I see you. Don't quit."
            className="bg-[#1a1a1a] border-[#333] text-white resize-none"
            rows={3}
            data-testid="input-power-message"
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{message.length}/500</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={isAnonymous}
                onCheckedChange={(v) => setIsAnonymous(!!v)}
                data-testid="checkbox-anonymous"
              />
              Send anonymously
            </label>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 leading-snug">
          Power Points fund this survivor's recovery and platform access. They cannot be converted back to cash. By sending, you agree to the platform terms.
        </p>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} data-testid="button-cancel">Cancel</Button>
          <Button
            disabled={checkout.isPending}
            onClick={() => checkout.mutate()}
            className="bg-[#C9941A] hover:bg-[#B8851A] text-black font-bold"
            data-testid="button-send-power"
          >
            {checkout.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</> : <>Send Power</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
