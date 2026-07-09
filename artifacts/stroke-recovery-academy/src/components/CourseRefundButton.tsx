import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Eligibility {
  eligible: boolean;
  reason: "not_purchased" | "already_refunded" | "window_expired" | "watched_too_much" | null;
  daysLeft: number | null;
  watchedPercent: number | null;
  windowDays: number;
  maxWatchedPercent: number;
}

const REASON_TEXT: Record<string, string> = {
  not_purchased: "You haven't unlocked this course yet.",
  already_refunded: "This course has already been refunded.",
  window_expired: "Refund window closed (7 days from purchase).",
  watched_too_much: "You've watched too much to refund (over 25%).",
};

export default function CourseRefundButton({ courseId }: { courseId: number | string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery<Eligibility>({
    queryKey: ["/api/courses", courseId, "refund-eligibility"],
    queryFn: async () =>
      (await fetch(`/api/courses/${courseId}/refund-eligibility`)).json(),
    enabled: !!courseId && open,
  });

  const refundMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/courses/${courseId}/refund`, { reason });
      return res.json();
    },
    onSuccess: (r: any) => {
      toast({
        title: "Refund issued",
        description: `${r.pointsReturned} Power Points returned to your wallet.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "unlock-info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/course-unlocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      setOpen(false);
    },
    onError: (e: any) => {
      toast({ title: "Refund failed", description: e?.message || "Try again", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`button-refund-${courseId}`}>
          <RotateCcw className="w-4 h-4 mr-2" /> Refund
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request refund</DialogTitle>
          <DialogDescription>
            Refunds are available within 7 days of unlock if you've watched
            less than 25% of the course. Power Points return to your wallet.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Checking eligibility…</p>
        ) : data.eligible ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-md border p-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
              <div>
                <div className="font-medium">You're eligible</div>
                <div className="text-muted-foreground">
                  {data.daysLeft} day{data.daysLeft === 1 ? "" : "s"} left ·
                  {" "}{data.watchedPercent ?? 0}% watched
                </div>
              </div>
            </div>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional — tell us what didn't land"
              maxLength={500}
              data-testid="input-refund-reason"
            />
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border p-3 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
            <div data-testid="text-refund-ineligible">
              {REASON_TEXT[data.reason || ""] || "This course can't be refunded right now."}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button
            onClick={() => refundMut.mutate()}
            disabled={!data?.eligible || refundMut.isPending}
            data-testid="button-confirm-refund"
          >
            {refundMut.isPending ? "Processing…" : "Confirm refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
