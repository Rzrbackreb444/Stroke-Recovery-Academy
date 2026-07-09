import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Zap, Lock, Check, Loader2 } from "lucide-react";
import { Link } from "wouter";

interface Props {
  courseId: number;
  courseTitle?: string;
  className?: string;
  variant?: "default" | "large";
}

interface UnlockInfo { pointsRequired: number; unlocked: boolean; unlockedAt: string | null; }

export default function CourseUnlockButton({ courseId, courseTitle, className = "", variant = "default" }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: info, isLoading } = useQuery<UnlockInfo>({
    queryKey: ["/api/courses", courseId, "unlock-info"],
    queryFn: async () => (await fetch(`/api/courses/${courseId}/unlock-info`)).json(),
  });

  const { data: balance } = useQuery<{ total: number }>({
    queryKey: ["/api/credits/balance"],
  });

  const unlock = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/courses/${courseId}/unlock`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Course unlocked", description: "Enjoy — you've earned this." });
      qc.invalidateQueries({ queryKey: ["/api/courses", courseId, "unlock-info"] });
      qc.invalidateQueries({ queryKey: ["/api/credits/balance"] });
    },
    onError: (e: any) => {
      const msg = e?.message || "";
      if (msg.includes("402") || msg.toLowerCase().includes("insufficient")) {
        toast({ title: "Not enough Power Points", description: "Grab more or ask a supporter to gift you.", variant: "destructive" });
      } else {
        toast({ title: "Couldn't unlock", description: msg || "Try again.", variant: "destructive" });
      }
    },
  });

  if (isLoading || !info) {
    return <Button disabled variant="outline" className={className}><Loader2 className="w-4 h-4 animate-spin" /></Button>;
  }

  if (info.unlocked) {
    return (
      <Button disabled className={`bg-green-600/20 text-green-400 border border-green-600/40 ${className}`} data-testid={`button-unlocked-${courseId}`}>
        <Check className="w-4 h-4 mr-2" /> Unlocked
      </Button>
    );
  }

  const balanceTotal = balance?.total ?? 0;
  const canAfford = balanceTotal >= info.pointsRequired;
  const isLarge = variant === "large";

  if (!canAfford) {
    const short = info.pointsRequired - balanceTotal;
    return (
      <div className={`space-y-2 ${className}`}>
        <Button disabled variant="outline" className={`w-full border-[#333] text-gray-400 ${isLarge ? "h-12 text-base" : ""}`} data-testid={`button-need-points-${courseId}`}>
          <Lock className="w-4 h-4 mr-2" /> Need {info.pointsRequired.toLocaleString()} pts
        </Button>
        <p className="text-xs text-gray-500 text-center">
          You have {balanceTotal.toLocaleString()} — short {short.toLocaleString()}.{" "}
          <Link href="/pricing" className="text-[#E2741B] hover:underline">Get more</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <Button
        disabled={unlock.isPending}
        onClick={() => unlock.mutate()}
        className={`w-full bg-[#E2741B] hover:bg-[#B8851A] text-black font-bold ${isLarge ? "h-12 text-base" : ""}`}
        data-testid={`button-unlock-${courseId}`}
      >
        {unlock.isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Unlocking…</>
        ) : (
          <><Zap className="w-4 h-4 mr-2" /> Unlock for {info.pointsRequired.toLocaleString()} pts</>
        )}
      </Button>
      <p className="text-[11px] text-gray-500 text-center">
        {courseTitle ? `"${courseTitle}" · ` : ""}85% goes to the creator · points are non-refundable after 7 days
      </p>
    </div>
  );
}
