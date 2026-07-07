import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import {
  Check,
  Flame,
  MessageCircle,
  Mic,
  Music,
  Lock,
  Quote,
  Sparkles,
  ShieldCheck,
  Zap,
  X,
  Star,
  ArrowDown,
  ArrowLeft,
  BookOpen,
  Clock,
  AlertTriangle,
  Loader2,
  PauseCircle,
  Percent,
  Heart,
} from "lucide-react";

type PremiumLifecycle = {
  status: string;
  plan: string;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  pastDue: boolean;
  graceEnd: string | null;
  downgraded: boolean;
};

type PremiumStatus = {
  active: boolean;
  priceCents: number;
  priceUsd: number;
  annualCents: number;
  annualUsd: number;
  annualMonthlyEquivalentUsd: number;
  annualSavingsUsd: number;
  trialDays: number;
  lifecycle: PremiumLifecycle | null;
};

type Plan = "monthly" | "annual";

type SaveOffer = "pause" | "discount";

type CancelOffer = { offer: SaveOffer; title: string; body: string };

type CancelContext = {
  eligible: boolean;
  status?: string;
  plan?: string;
  currentPeriodEnd?: string | null;
  trialEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  alreadySaved?: boolean;
  offers?: CancelOffer[];
};

const FEATURES = [
  {
    icon: BookOpen,
    title: "Your Recovery Story — write your book as you go",
    body: "Every journal entry, every check-in, every breakthrough is material. Mark the moments you want to keep. When you're ready, compile them into a real book — digital or print. Everything else stays between you and the Squatch.",
  },
  {
    icon: Flame,
    title: "Daily Never Zero report to Sasquatch",
    body: "For survivors serious about recovery. Every day you log a rep — one stretch, one step, one word — Sasquatch reads it and reports back: names your streak, calls out what you did, gives one focus for tomorrow. Accountability that talks back. Worth the subscription on its own.",
  },
  {
    icon: MessageCircle,
    title: "Unlimited Sasquatch Coach",
    body: "Free survivors get 5 Coach messages per day. Premium = unlimited. Talk to Sasquatch as much as you need, whenever the brain needs it.",
  },
  {
    icon: Music,
    title: "Unlimited Recovery Anchor renders",
    body: "Free tier caps at 3 musical-mnemonic anchor renders per month. Premium removes the cap — anchor every word, every cue, every routine.",
  },
  {
    icon: Mic,
    title: "Survivor Voice Cloning included",
    body: "ElevenLabs Instant Voice Cloning bundled in. Use your own voice (or your loved one's) across Anthem builder, Recovery Anchor, and Coach replies.",
  },
  {
    icon: Flame,
    title: "Premium Campfire circles",
    body: "Two premium-only fires: Coach Circle (Mon/Wed/Fri lunch) and Live with Nick (Saturday morning). Smaller rooms, deeper conversations.",
  },
];

// What changes after the trial — concrete outcomes, not feature names.
const OUTCOMES = [
  "You stop rationing Coach messages — you ask the question the moment your brain hands it to you.",
  "You anchor every routine word that won't stick (medication name, therapist name, son's name) into a melody you actually remember.",
  "You hear your own voice — pre-stroke or post-stroke — read your daily cues back to you.",
  "You sit in a smaller fire with Nick and 8–12 other survivors instead of scrolling a feed alone.",
  "You have a book — your recovery in your own words, something to hand to your doctor, your family, anyone who wasn't in the room.",
];

// Free vs Premium — reframes the price as an upgrade, not a paywall.
const COMPARISON: Array<{ feature: string; free: string; premium: string }> = [
  { feature: "Your Story — mark chapters + compile book", free: "—", premium: "Mark + compile" },
  { feature: "Never Zero daily report to Sasquatch", free: "Log only", premium: "Daily AI report back" },
  { feature: "Sasquatch Coach messages", free: "5 / day", premium: "Unlimited" },
  { feature: "Recovery Anchor renders", free: "3 / month", premium: "Unlimited" },
  { feature: "Voice Cloning (ElevenLabs)", free: "—", premium: "Included" },
  { feature: "Campfire — public fires", free: "Yes", premium: "Yes" },
  { feature: "Campfire — Coach Circle (Mon/Wed/Fri)", free: "—", premium: "Included" },
  { feature: "Campfire — Live with Nick (Sat AM)", free: "—", premium: "Included" },
  { feature: "Daily routine + journal", free: "Yes", premium: "Yes" },
  { feature: "66-Day Sasquatch Challenge", free: "Yes", premium: "Yes" },
  { feature: "Crisis safety net (988 / 911 routing)", free: "Yes", premium: "Yes" },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Can I really cancel anytime?",
    a: "Yes — one click in the billing portal during the 7-day trial and you owe $0. After the trial, cancel any time and you keep premium access through the end of the period you already paid for. No phone calls, no hoops.",
  },
  {
    q: "What does the 7-day free trial actually mean?",
    a: "From the moment you start, every premium feature is unlocked for 7 days. We collect your card so the subscription auto-starts on day 8 if you don't cancel — that's how Stripe trials work — but if you cancel before day 8 you are not charged a single cent.",
  },
  {
    q: "What if my recovery is slow and I don't use it much yet?",
    a: "That's exactly who Premium is built for. Unlimited Coach means you can ask the same question on day 4 that you asked on day 2 because your brain forgot the answer — and Sasquatch will answer kindly, every time, no judgment, no rationing.",
  },
  {
    q: "I'm a caregiver, not the survivor. Does this work for me?",
    a: "Yes. Many of our paying members are spouses, adult children, and parents using the Coach to learn how to support a survivor at home. Voice Cloning lets you record your own voice for the survivor to hear during routines.",
  },
  {
    q: "Is this medical advice?",
    a: "No. Stroke Recovery Academy is explicitly non-clinical. Sasquatch is a survivor-first peer companion built on lived experience, not a doctor or therapist. Always coordinate with your healthcare team. In a crisis, call 988 or 911.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "Your journal entries, routines, anchors, and Coach history stay in your account. You can export everything as JSON at /account/export, or fully delete your account at /account/delete — both are one-click survivor-controlled.",
  },
];

// Best-effort funnel ping — never throws, never blocks render.
function trackFunnel(event: "premium_page_view" | "trial_start", plan?: Plan) {
  try {
    void fetch("/api/sasquatch-premium/track", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, plan: plan ?? "unknown" }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* swallow */
  }
}

function fmtDate(d: string | null): string {
  if (!d) return "";
  const t = Date.parse(d);
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function LifecycleBanner({
  lifecycle,
  onManageBilling,
  managing,
  onResume,
  resuming,
}: {
  lifecycle: PremiumLifecycle | null;
  onManageBilling: () => void;
  managing: boolean;
  onResume: () => void;
  resuming: boolean;
}) {
  if (!lifecycle) return null;

  const { status, trialEnd, graceEnd, cancelAtPeriodEnd, currentPeriodEnd } = lifecycle;
  const inGrace = lifecycle.pastDue && !lifecycle.downgraded && !!graceEnd;

  // Past-due inside grace — most urgent. Update your card or you lose it.
  if (inGrace) {
    return (
      <div
        className="max-w-2xl mx-auto mb-6 rounded-xl bg-red-700/15 border border-red-700/40 px-5 py-4"
        data-testid="banner-lifecycle-pastdue"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-red-200">Your payment didn't go through.</div>
            <p className="text-red-200/80 text-sm mt-1">
              Premium's still on — for now. Update your card by{" "}
              <span className="font-semibold">{fmtDate(graceEnd)}</span> or it pauses. No drama, just fix the card.
            </p>
            <Button
              size="sm"
              className="mt-3 bg-red-600 hover:bg-red-700 text-white"
              onClick={onManageBilling}
              disabled={managing}
              data-testid="button-lifecycle-fix-card"
            >
              {managing ? "Opening..." : "Update payment"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Downgraded — grace lapsed, back on free.
  if (lifecycle.downgraded) {
    return (
      <div
        className="max-w-2xl mx-auto mb-6 rounded-xl bg-stone-700/15 border border-stone-500/40 px-5 py-4"
        data-testid="banner-lifecycle-downgraded"
      >
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-[#1C1917]">Premium's paused.</div>
            <p className="text-[#78716C] text-sm mt-1">
              The card never cleared, so you're back on free Coach. Start a plan again below whenever you're ready — heart's still thumpin'.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Trialing — show when the trial converts.
  if (status === "trialing" && trialEnd) {
    return (
      <div
        className="max-w-2xl mx-auto mb-6 rounded-xl bg-green-700/15 border border-green-700/40 px-5 py-4"
        data-testid="banner-lifecycle-trialing"
      >
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-[#1C1917]">You're on the free trial.</div>
            <p className="text-[#78716C] text-sm mt-1">
              {cancelAtPeriodEnd ? (
                <>Trial ends <span className="font-semibold">{fmtDate(trialEnd)}</span> — you won't be charged. Coach goes back to free after that.</>
              ) : (
                <>First charge lands <span className="font-semibold">{fmtDate(trialEnd)}</span> unless you cancel. Cancel anytime from billing.</>
              )}
            </p>
            {cancelAtPeriodEnd ? (
              <Button
                size="sm"
                className="mt-3 bg-[#C06B3E] hover:bg-[#A85B33] text-white"
                onClick={onResume}
                disabled={resuming}
                data-testid="button-lifecycle-resume-trial"
              >
                {resuming ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Bringing it back...</>
                ) : (
                  <><Heart className="w-4 h-4 mr-1.5" />Keep my premium</>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 border-[#E2C2A4]/40 text-[#5C534D]"
                onClick={onManageBilling}
                disabled={managing}
                data-testid="button-lifecycle-manage-trial"
              >
                {managing ? "Opening..." : "Manage billing"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active/paused but set to cancel at period end — one-click resume.
  if (cancelAtPeriodEnd && (status === "active" || status === "paused") && currentPeriodEnd) {
    return (
      <div
        className="max-w-2xl mx-auto mb-6 rounded-xl bg-amber-700/15 border border-amber-700/40 px-5 py-4"
        data-testid="banner-lifecycle-canceling"
      >
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-[#1C1917]">Premium ends soon.</div>
            <p className="text-[#78716C] text-sm mt-1">
              You're set to cancel. Premium runs through <span className="font-semibold">{fmtDate(currentPeriodEnd)}</span>, then Coach goes back to free. Changed your mind?
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Button
                size="sm"
                className="bg-[#C06B3E] hover:bg-[#A85B33] text-white"
                onClick={onResume}
                disabled={resuming}
                data-testid="button-lifecycle-resume"
              >
                {resuming ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Bringing it back...</>
                ) : (
                  <><Heart className="w-4 h-4 mr-1.5" />Keep my premium</>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-[#78716C]"
                onClick={onManageBilling}
                disabled={managing}
                data-testid="button-lifecycle-manage-canceling"
              >
                {managing ? "Opening..." : "Manage billing"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Mirrors server FEEDBACK_MAX in retentionService.ts — kept local (never
// imported from server code) so the cap holds without a cross-boundary import.
const FEEDBACK_MAX = 1000;

const CANCEL_REASONS: { code: string; label: string }[] = [
  { code: "too_expensive", label: "It's too expensive right now" },
  { code: "not_using", label: "I'm not using it enough" },
  { code: "missing_features", label: "It's missing something I need" },
  { code: "technical_issues", label: "Something's not working right" },
  { code: "recovered", label: "I got what I came for" },
  { code: "temporary_break", label: "Just need a break for now" },
  { code: "other", label: "Something else" },
];

type CancelStep = "confirm" | "reason" | "offer" | "final" | "done";
type CancelOutcome = "saved" | "paused" | "cancelled" | null;

function OfferIcon({ offer }: { offer: SaveOffer }) {
  return offer === "pause" ? (
    <PauseCircle className="w-5 h-5 text-[#C06B3E] shrink-0 mt-0.5" />
  ) : (
    <Percent className="w-5 h-5 text-[#C06B3E] shrink-0 mt-0.5" />
  );
}

// Native cancel + retention flow. Owns its own steps and mutations so the parent
// page stays thin. Server re-derives every money decision — the client only
// forwards the reason and the chosen offer key.
function CancelFlowDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<CancelStep>("confirm");
  const [reason, setReason] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [outcome, setOutcome] = useState<CancelOutcome>(null);

  const contextQuery = useQuery<CancelContext>({
    queryKey: ["/api/sasquatch-premium/cancel/context"],
    enabled: open,
  });
  const ctx = contextQuery.data;
  const offers = ctx?.offers ?? [];
  const accessUntil = fmtDate(ctx?.currentPeriodEnd ?? ctx?.trialEnd ?? null);

  // Fresh dialog every open.
  useEffect(() => {
    if (open) {
      setStep("confirm");
      setReason("");
      setFeedback("");
      setOutcome(null);
    }
  }, [open]);

  function finish(o: CancelOutcome) {
    queryClient.invalidateQueries({ queryKey: ["/api/sasquatch-premium/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/sasquatch-premium/cancel/context"] });
    setOutcome(o);
    setStep("done");
  }

  const reasonMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sasquatch-premium/cancel/reason", {
        reason,
        feedback: feedback.trim() || undefined,
      });
      return (await res.json()) as { ok?: boolean };
    },
    // Recording the reason is telemetry — never block the survivor's path on it.
    onSuccess: () => setStep(offers.length > 0 ? "offer" : "final"),
    onError: () => setStep(offers.length > 0 ? "offer" : "final"),
  });

  const offerMut = useMutation({
    mutationFn: async (offer: SaveOffer) => {
      const res = await apiRequest("POST", "/api/sasquatch-premium/retention-offer", {
        offer,
        reason: reason || undefined,
        feedback: feedback.trim() || undefined,
      });
      return (await res.json()) as { ok?: boolean; offer?: SaveOffer };
    },
    onSuccess: (data) => finish(data?.offer === "pause" ? "paused" : "saved"),
    onError: (err: any) => {
      toast({
        title: "Couldn't apply that offer",
        description: String(err?.message ?? "Try again in a moment"),
        variant: "destructive",
      });
    },
  });

  const cancelMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sasquatch-premium/cancel", {
        reason: reason || undefined,
        feedback: feedback.trim() || undefined,
      });
      return (await res.json()) as { ok?: boolean };
    },
    onSuccess: () => finish("cancelled"),
    onError: (err: any) => {
      toast({
        title: "Couldn't cancel",
        description: String(err?.message ?? "Try again in a moment"),
        variant: "destructive",
      });
    },
  });

  const busy = reasonMut.isPending || offerMut.isPending || cancelMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-cancel-flow">
        {contextQuery.isLoading ? (
          <div className="py-10 flex items-center justify-center" data-testid="cancel-loading">
            <Loader2 className="w-6 h-6 animate-spin text-[#C06B3E]" />
          </div>
        ) : ctx && ctx.eligible === false ? (
          <>
            <DialogHeader>
              <DialogTitle>No active subscription</DialogTitle>
              <DialogDescription>
                There's nothing to cancel on this account right now.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-close">
                Close
              </Button>
            </div>
          </>
        ) : step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle>Before you go.</DialogTitle>
              <DialogDescription>
                Cancel and Coach drops back to the free tier — no more unlimited
                Coach, Anchor, or Voice Cloning.{accessUntil ? ` You'd keep premium through ${accessUntil}.` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="bg-[#C06B3E] hover:bg-[#A85B33] text-white"
                onClick={() => onOpenChange(false)}
                data-testid="button-keep-premium"
              >
                <Heart className="w-4 h-4 mr-1.5" />
                Keep my premium
              </Button>
              <Button
                variant="ghost"
                className="text-[#78716C]"
                onClick={() => setStep("reason")}
                data-testid="button-continue-cancel"
              >
                Continue to cancel
              </Button>
            </div>
          </>
        ) : step === "reason" ? (
          <>
            <DialogHeader>
              <DialogTitle>What's driving this?</DialogTitle>
              <DialogDescription>
                Straight talk helps us fix it. One tap — takes a second.
              </DialogDescription>
            </DialogHeader>
            <RadioGroup value={reason} onValueChange={setReason} className="gap-1 py-1">
              {CANCEL_REASONS.map((r) => (
                <Label
                  key={r.code}
                  htmlFor={`reason-${r.code}`}
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover-elevate cursor-pointer text-[#1C1917] font-normal"
                  data-testid={`reason-option-${r.code}`}
                >
                  <RadioGroupItem value={r.code} id={`reason-${r.code}`} />
                  <span>{r.label}</span>
                </Label>
              ))}
            </RadioGroup>
            <Textarea
              placeholder="Anything else? (optional)"
              value={feedback}
              maxLength={FEEDBACK_MAX}
              onChange={(e) => setFeedback(e.target.value.slice(0, FEEDBACK_MAX))}
              className="resize-none border-[#E2C2A4]/40"
              rows={3}
              data-testid="input-cancel-feedback"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="ghost"
                className="text-[#78716C]"
                onClick={() => setStep("confirm")}
                disabled={busy}
                data-testid="button-reason-back"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                className="bg-[#C06B3E] hover:bg-[#A85B33] text-white"
                onClick={() => reasonMut.mutate()}
                disabled={!reason || busy}
                data-testid="button-reason-next"
              >
                {reasonMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
              </Button>
            </div>
          </>
        ) : step === "offer" ? (
          <>
            <DialogHeader>
              <DialogTitle>Wait — one thing first.</DialogTitle>
              <DialogDescription>
                Before you drop off, here's a way to stay without the sting.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-1">
              {offers.map((o) => (
                <Card
                  key={o.offer}
                  className="p-4 bg-white border-[#E2C2A4]/40"
                  data-testid={`offer-card-${o.offer}`}
                >
                  <div className="flex items-start gap-3">
                    <OfferIcon offer={o.offer} />
                    <div className="flex-1">
                      <div className="font-bold text-[#1C1917]">{o.title}</div>
                      <p className="text-sm text-[#78716C] mt-0.5">{o.body}</p>
                      <Button
                        size="sm"
                        className="mt-3 bg-[#C06B3E] hover:bg-[#A85B33] text-white"
                        onClick={() => offerMut.mutate(o.offer)}
                        disabled={busy}
                        data-testid={`button-accept-${o.offer}`}
                      >
                        {offerMut.isPending && offerMut.variables === o.offer ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : o.offer === "pause" ? (
                          "Pause instead"
                        ) : (
                          "Take the discount"
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="ghost"
                className="text-[#78716C]"
                onClick={() => setStep("reason")}
                disabled={busy}
                data-testid="button-offer-back"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                variant="ghost"
                className="text-[#A8A29E]"
                onClick={() => setStep("final")}
                disabled={busy}
                data-testid="button-offer-decline"
              >
                No thanks, cancel
              </Button>
            </div>
          </>
        ) : step === "final" ? (
          <>
            <DialogHeader>
              <DialogTitle>Cancel your premium?</DialogTitle>
              <DialogDescription>
                {accessUntil
                  ? `You'll keep everything through ${accessUntil}, then Coach goes back to free. No charge after that.`
                  : "Coach goes back to free at the end of your current period. No charge after that."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="destructive"
                onClick={() => cancelMut.mutate()}
                disabled={busy}
                data-testid="button-confirm-cancel"
              >
                {cancelMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Cancel my premium"
                )}
              </Button>
              <Button
                variant="ghost"
                className="text-[#78716C]"
                onClick={() => onOpenChange(false)}
                disabled={busy}
                data-testid="button-final-keep"
              >
                Never mind — keep it
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {outcome === "cancelled"
                  ? "You're all set."
                  : outcome === "paused"
                    ? "Paused — not gone."
                    : "Glad you're staying."}
              </DialogTitle>
              <DialogDescription>
                {outcome === "cancelled"
                  ? accessUntil
                    ? `Premium runs through ${accessUntil}, then Coach goes back to free. Change your mind anytime — heart's still thumpin'.`
                    : "Premium runs through the end of your period, then Coach goes back to free. Change your mind anytime."
                  : outcome === "paused"
                    ? "We skipped your next charge and kept your access. Billing picks back up automatically after the pause."
                    : "Your discount's locked in and you keep everything. Heart's still thumpin'."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end pt-2">
              <Button
                className="bg-[#C06B3E] hover:bg-[#A85B33] text-white"
                onClick={() => onOpenChange(false)}
                data-testid="button-done-close"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Squad waitlist dialog ─────────────────────────────────────────────────────
function SquadWaitlistDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const mut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/squad-waitlist", { email: email.trim(), name: name.trim() || undefined });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { setDone(true); },
    onError: () => { toast({ title: "Something went wrong", description: "Try again in a moment.", variant: "destructive" }); },
  });
  useEffect(() => { if (!open) { setDone(false); setEmail(""); setName(""); } }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#1C1917] border-[#3A3230] text-[#FDFBF7]">
        <DialogHeader>
          <DialogTitle className="text-[#FDFBF7] text-xl font-bold">
            {done ? "You're on the list." : "Join the Squad waitlist"}
          </DialogTitle>
          <DialogDescription className="text-[#FDFBF7]/55">
            {done
              ? "We'll email you the day Squad launches. You'll have first-access pricing."
              : "Squad is $59/mo — bi-weekly Zoom with Nick, accountability pods, direct message access. Launching soon. Get notified first."}
          </DialogDescription>
        </DialogHeader>
        {!done ? (
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Your first name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#2A2421] border-[#3A3230] text-[#FDFBF7] placeholder:text-[#FDFBF7]/30"
              data-testid="input-waitlist-name"
            />
            <Input
              placeholder="your@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#2A2421] border-[#3A3230] text-[#FDFBF7] placeholder:text-[#FDFBF7]/30"
              data-testid="input-waitlist-email"
            />
            <Button
              onClick={() => email.includes("@") && mut.mutate()}
              disabled={mut.isPending || !email.includes("@")}
              className="w-full bg-[#C06B3E] hover:bg-[#A85B33] text-white h-11"
              data-testid="button-waitlist-submit"
            >
              {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Notify me when Squad launches"}
            </Button>
            <p className="text-xs text-[#FDFBF7]/30 text-center">No spam. One email when Squad goes live.</p>
          </div>
        ) : (
          <div className="pt-2 text-center">
            <div className="w-12 h-12 rounded-full bg-[#C06B3E]/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-[#C06B3E]" />
            </div>
            <p className="text-[#FDFBF7]/70 text-sm">Check your inbox — confirmation incoming.</p>
            <Button variant="ghost" className="mt-4 text-[#FDFBF7]/40 text-xs" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function RecoveryPremium() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [plan, setPlan] = useState<Plan>("annual"); // default annual — anchors price + lifts ARPU
  const [squadWaitlistOpen, setSquadWaitlistOpen] = useState(() => {
    const p = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return p.get("squad") === "waitlist";
  });
  // Promo code (Wave H). Captured from `?promo=NICKLAUNCH` on first mount and
  // forwarded to the checkout body. The Stripe page also shows an "Add promo
  // code" link via allow_promotion_codes for survivors who didn't arrive via
  // a promo URL.
  const [promoCode, setPromoCode] = useState<string>("");

  const { data: status, isLoading: statusLoading } = useQuery<PremiumStatus>({
    queryKey: ["/api/sasquatch-premium/status"],
    enabled: isAuthenticated,
  });

  const checkoutMut = useMutation({
    mutationFn: async (selectedPlan: Plan) => {
      const res = await apiRequest("POST", "/api/sasquatch-premium/checkout", {
        plan: selectedPlan,
        promoCode: promoCode || undefined,
      });
      return (await res.json()) as { url?: string; plan?: Plan; alreadyActive?: boolean };
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.alreadyActive) {
        toast({ title: "You're already a premium member", description: "Redirecting to billing portal..." });
      } else {
        toast({ title: "Couldn't start checkout", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Checkout failed",
        description: String(err?.message ?? "Try again in a moment"),
        variant: "destructive",
      });
    },
  });

  const portalMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sasquatch-premium/portal", {});
      return (await res.json()) as { url?: string };
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't open billing portal",
        description: String(err?.message ?? ""),
        variant: "destructive",
      });
    },
  });

  // Native cancel/retention flow. The dialog owns its own steps + mutations;
  // this level owns one-click Resume (used by the lifecycle banner) and the
  // dialog open state.
  const [cancelOpen, setCancelOpen] = useState(false);

  const resumeMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sasquatch-premium/resume", {});
      return (await res.json()) as { ok?: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sasquatch-premium/status"] });
      // Also bust cancel/context — global staleTime:Infinity would otherwise
      // serve a resumed survivor a stale offers:[] the next time they reopen.
      queryClient.invalidateQueries({ queryKey: ["/api/sasquatch-premium/cancel/context"] });
      toast({
        title: "Premium's back on.",
        description: "Nothing changes — you keep everything. Heart's still thumpin'.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't resume premium",
        description: String(err?.message ?? "Try again in a moment"),
        variant: "destructive",
      });
    },
  });

  // ?subscribed=1 / ?canceled=1 flash + entitlement re-fetch + funnel events.
  // Page-view fires once on mount (auth OR anon — top of funnel).
  // trial_start fires when Stripe redirects back successfully.
  const fnRef = useRef<typeof trackFunnel>(trackFunnel);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    const planFromUrl: Plan | undefined =
      planParam === "annual" || planParam === "monthly" ? planParam : undefined;

    // Capture promo code from URL — sanitize to A-Z 0-9 - _ and cap length.
    const promoParam = (params.get("promo") || "").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
    if (promoParam) setPromoCode(promoParam);

    if (params.get("subscribed") === "1") {
      fnRef.current("trial_start", planFromUrl);
      toast({
        title: "Welcome to Sasquatch Premium.",
        description: "You're in. Coach is unlimited from this moment forward.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sasquatch-premium/status"] });
      window.history.replaceState({}, "", "/recovery/premium");
    } else if (params.get("canceled") === "1") {
      toast({
        title: "No worries.",
        description: "Free Coach is still here for you. Come back when you're ready.",
      });
      window.history.replaceState({}, "", "/recovery/premium");
    } else {
      fnRef.current("premium_page_view");
    }
    // intentionally only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthlyUsd = status?.priceUsd ?? 19;
  const annualUsd = status?.annualUsd ?? 190;
  const annualPerMonth = status?.annualMonthlyEquivalentUsd ?? 15.83;
  const annualSavings = status?.annualSavingsUsd ?? 38;
  const trialDays = status?.trialDays ?? 7;
  const isActive = !!status?.active;

  const displayUsd = plan === "annual" ? annualPerMonth : monthlyUsd;
  const billedSubline =
    plan === "annual"
      ? `Billed $${annualUsd}/year — save $${annualSavings}/yr.`
      : `Billed monthly. Cancel anytime.`;

  // The single CTA action — used by the hero, the pricing card, the final CTA,
  // and the sticky mobile bar so all four enter the same state machine.
  function startCheckout() {
    if (!isAuthenticated) {
      setLocation("/auth?next=/recovery/premium");
      return;
    }
    if (isActive) {
      portalMut.mutate();
      return;
    }
    checkoutMut.mutate(plan);
  }

  const ctaLabel = isActive
    ? "Manage billing"
    : checkoutMut.isPending
      ? "Starting checkout..."
      : `Start ${trialDays}-day free trial`;
  const ctaDisabled = checkoutMut.isPending || portalMut.isPending;

  function scrollToPricing() {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C1917]">
      <RecoverySEO
        title="Sasquatch Premium — Unlimited Survivor Tools | Stroke Recovery Academy"
        description="7-day free trial. Unlimited AI Sasquatch Coach. Unlimited Recovery Anchor renders. Voice Cloning. Premium Campfire circles. Then $19/month or $190/year. Cancel anytime."
        canonical="/recovery/premium"
      />
      <RecoveryHeader />
      <SquadWaitlistDialog open={squadWaitlistOpen} onOpenChange={setSquadWaitlistOpen} />

      {/* ── Tier nav ──────────────────────────────────────────────────────── */}
      <div className="bg-[#1C1917] border-b border-[#2A2421]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-3 text-sm">
          <a href="/recovery/premium" className="px-4 py-2 rounded-full bg-[#C06B3E] text-white font-semibold text-xs uppercase tracking-wider" data-testid="tab-solo">Solo — $19/mo</a>
          <a href="/recovery/premium?squad=waitlist" className="px-4 py-2 rounded-full bg-[#2A2421] text-[#FDFBF7]/60 font-semibold text-xs uppercase tracking-wider hover:bg-[#3A3230] transition-colors" data-testid="tab-squad">Squad — $59/mo <span className="ml-1.5 bg-[#3A3230] text-[#FDFBF7]/40 text-[10px] px-1.5 py-0.5 rounded-full">Soon</span></a>
          <a href="/recovery/coaching-with-nick" className="px-4 py-2 rounded-full bg-[#2A2421] text-[#FDFBF7]/60 font-semibold text-xs uppercase tracking-wider hover:bg-[#3A3230] transition-colors" data-testid="tab-nick">1:1 with Nick — $350/session</a>
          <a href="/partners" className="px-4 py-2 rounded-full bg-[#2A2421] text-[#FDFBF7]/60 font-semibold text-xs uppercase tracking-wider hover:bg-[#3A3230] transition-colors" data-testid="tab-partners">Rehab Partners</a>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C06B3E]/5 via-[#FDFBF7] to-[#FDFBF7] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 text-center">
          <Badge
            className="bg-[#C06B3E]/10 text-[#C06B3E] border-[#C06B3E]/20 mb-4"
            data-testid="badge-premium-tag"
          >
            <Flame className="w-3 h-3 mr-1" />
            Sasquatch Premium · {trialDays} days free
          </Badge>
          <h1
            className="text-4xl md:text-6xl font-black mb-4 leading-tight"
            data-testid="text-premium-title"
          >
            Stop rationing your
            <br />
            <span style={{ color: "#C06B3E" }}>recovery.</span>
          </h1>
          <p className="text-[#78716C] text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Unlimited Coach. Unlimited Recovery Anchors. Voice Cloning included.
            Premium fires with Nick. Built by a 7-year survivor, for survivors.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Button
              size="lg"
              className="bg-[#C06B3E] hover:bg-[#A85B33] text-white text-base px-8"
              onClick={startCheckout}
              disabled={ctaDisabled}
              data-testid="button-hero-cta"
            >
              {ctaLabel}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#E2C2A4]/30 text-[#1C1917] hover:bg-white"
              onClick={scrollToPricing}
              data-testid="button-hero-see-pricing"
            >
              See what's included
              <ArrowDown className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[#78716C] text-xs">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              Cancel anytime in one click
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#C06B3E]" />
              Full access from minute one
            </span>
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#A8A29E]" />
              Stripe — your card stays with Stripe, not us
            </span>
          </div>

          {/* Social proof row */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="flex -space-x-1.5">
              {["#7c3aed","#b45309","#0369a1","#047857","#be123c"].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-stone-950 flex items-center justify-center text-[9px] font-black text-white" style={{ background: c }}>
                  {["S","J","M","T","R"][i]}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#78716C]">
              Survivors with strokes from <span className="text-[#1C1917] font-semibold">ages 28 to 79</span> are using Coach daily.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* ── Founder bar ───────────────────────────────────────────────── */}
        <Card
          className="p-5 md:p-6 bg-white border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-10"
          data-testid="card-founder-bar"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#C06B3E] flex items-center justify-center text-xl font-black text-[#FDFBF7]">
              N
            </div>
            <div className="flex-1">
              <div className="text-sm text-[#78716C] mb-1">
                Built by <span className="text-[#1C1917] font-bold">Nick Kremers</span> —
                7 years post-stroke
              </div>
              <p className="text-[#78716C] text-sm md:text-base leading-relaxed">
                <Quote className="w-4 h-4 inline-block -mt-1 mr-1 text-[#C06B3E]" />
                I went from 0% to 90% recovery without a clinic-shaped roadmap.
                I built Sasquatch so the next survivor doesn't have to figure it
                out alone at 3am.
              </p>
            </div>
          </div>
        </Card>

        {/* ── Survivor voices ───────────────────────────────────────────── */}
        <section className="mb-12" data-testid="section-testimonials">
          <h2 className="text-xl md:text-2xl font-black mb-6 text-center text-[#1C1917]">
            From survivors using it daily
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                quote: "I asked Sasquatch the same question four times in one day because my brain wouldn't hold the answer. No judgment. Same answer every time. That's worth everything.",
                name: "Sandra K.",
                detail: "2 years post-stroke · Left hemiplegia",
              },
              {
                quote: "The daily report is the first thing that's made me feel accountable since leaving rehab. Nick's voice in text form — tough but kind. Exactly what I needed.",
                name: "Marcus T.",
                detail: "18 months post-stroke · Aphasia",
              },
              {
                quote: "My wife uses voice cloning so I hear her voice read my morning cues. That was worth the subscription alone.",
                name: "David R.",
                detail: "4 years post-stroke · Right-side weakness",
              },
            ].map((t, i) => (
              <Card key={i} className="p-5 bg-white border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]" data-testid={`card-testimonial-${i}`}>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, s) => <Star key={s} className="w-3 h-3 fill-[#C06B3E] text-[#C06B3E]" />)}
                </div>
                <p className="text-[#78716C] text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div>
                  <p className="text-[#1C1917] text-xs font-bold">{t.name}</p>
                  <p className="text-[#A8A29E] text-xs">{t.detail}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── What changes after 7 days ─────────────────────────────────── */}
        <section className="mb-12" data-testid="section-outcomes">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            What changes after <span style={{ color: "#C06B3E" }}>7 days.</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {OUTCOMES.map((o, i) => (
              <Card
                key={i}
                className="p-5 bg-white border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-start gap-3"
                data-testid={`card-outcome-${i}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-700/30 flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-[#1C1917] text-sm md:text-base leading-relaxed">{o}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            Everything Sasquatch, <span style={{ color: "#C06B3E" }}>uncapped.</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card
                  key={f.title}
                  className="p-5 bg-white border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                  data-testid={`feature-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-md bg-[#C06B3E]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5" style={{ color: "#C06B3E" }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1C1917] mb-1">{f.title}</h3>
                      <p className="text-sm text-[#78716C]">{f.body}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── Free vs Premium comparison ────────────────────────────────── */}
        <section className="mb-12" data-testid="section-comparison">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            Free vs <span style={{ color: "#C06B3E" }}>Premium.</span>
          </h2>
          <Card className="bg-white border-[#E2C2A4]/30 overflow-hidden">
            <div className="grid grid-cols-3 text-sm">
              <div className="px-4 py-3 font-bold text-[#78716C] border-b border-[#E2C2A4]/30">Feature</div>
              <div className="px-4 py-3 font-bold text-[#78716C] border-b border-[#E2C2A4]/30 text-center">Free</div>
              <div className="px-4 py-3 font-bold text-[#C06B3E] border-b border-[#E2C2A4]/30 text-center">
                Premium
              </div>
              {COMPARISON.map((row, idx) => (
                <div key={row.feature} className="contents" data-testid={`row-compare-${idx}`}>
                  <div className="px-4 py-3 text-[#1C1917] border-b border-[#E2C2A4]/30/60">
                    {row.feature}
                  </div>
                  <div className="px-4 py-3 text-[#78716C] text-center border-b border-[#E2C2A4]/30/60">
                    {row.free === "—" ? <X className="w-4 h-4 inline text-stone-600" /> : row.free}
                  </div>
                  <div className="px-4 py-3 text-[#C06B3E] text-center font-semibold border-b border-[#E2C2A4]/30/60 bg-[#C06B3E]/5">
                    {row.premium === "Included" || row.premium === "Unlimited" ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-4 h-4 text-green-400" />
                        {row.premium}
                      </span>
                    ) : (
                      row.premium
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ── Pricing card (the existing one, expanded) ─────────────────── */}
        <section id="pricing" className="scroll-mt-24 mb-12">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            Pick a plan. <span style={{ color: "#C06B3E" }}>Try it free.</span>
          </h2>

          <LifecycleBanner
            lifecycle={status?.lifecycle ?? null}
            onManageBilling={() => portalMut.mutate()}
            managing={portalMut.isPending}
            onResume={() => resumeMut.mutate()}
            resuming={resumeMut.isPending}
          />


          <div className="flex justify-center mb-6">
            <div
              className="inline-flex rounded-md border border-[#E2C2A4]/30 bg-white p-1 gap-1"
              role="tablist"
              aria-label="Billing interval"
            >
              <Button
                size="sm"
                variant={plan === "monthly" ? "default" : "ghost"}
                className={
                  plan === "monthly"
                    ? "bg-[#C06B3E] hover:bg-[#A85B33] text-white rounded-full shadow-sm"
                    : "text-[#78716C]"
                }
                onClick={() => setPlan("monthly")}
                data-testid="button-plan-monthly"
                role="tab"
                aria-selected={plan === "monthly"}
              >
                Monthly
              </Button>
              <Button
                size="sm"
                variant={plan === "annual" ? "default" : "ghost"}
                className={
                  plan === "annual"
                    ? "bg-[#C06B3E] hover:bg-[#A85B33] text-white"
                    : "text-[#78716C]"
                }
                onClick={() => setPlan("annual")}
                data-testid="button-plan-annual"
                role="tab"
                aria-selected={plan === "annual"}
              >
                Annual
                <Badge
                  className="ml-2 bg-green-700/30 text-green-300 border-green-700/40 text-[10px] rounded-full"
                  data-testid="badge-annual-savings"
                >
                  Save ${annualSavings}
                </Badge>
              </Button>
            </div>
          </div>

          {promoCode && !isActive && (
            <div
              className="max-w-md mx-auto mb-4 flex items-center justify-center gap-2 rounded-xl bg-green-700/15 border border-green-700/40 px-4 py-2 text-sm text-green-300"
              data-testid="banner-promo-applied"
            >
              <Check className="w-4 h-4" />
              Promo code <span className="font-bold">{promoCode}</span> will be applied at checkout.
            </div>
          )}

          <Card
            className={`relative p-8 md:p-10 bg-white mb-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
              plan === "annual" ? "border-[#C06B3E]/40 shadow-[0_4px_16px_rgba(192,107,62,0.08)]" : "border-[#E2C2A4]/30"
            }`}
          >
            {plan === "annual" && (
              <Badge
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C06B3E] text-[#FDFBF7] border-[#C06B3E]/30 rounded-full px-4"
                data-testid="badge-best-value"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Best value
              </Badge>
            )}
            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="text-5xl md:text-6xl font-black"
                    style={{ color: "#C06B3E" }}
                    data-testid="text-price"
                  >
                    ${displayUsd}
                  </span>
                  <span className="text-[#78716C] text-lg">/month</span>
                  {plan === "annual" && (
                    <span className="text-[#A8A29E] text-sm line-through ml-2" data-testid="text-strikethrough">
                      ${monthlyUsd}/mo
                    </span>
                  )}
                </div>
                <p className="text-[#78716C] text-sm mt-1" data-testid="text-billed-subline">
                  {trialDays}-day free trial. {billedSubline}
                </p>
              </div>

              {!isAuthenticated ? (
                <Button
                  size="lg"
                  className="bg-[#C06B3E] hover:bg-[#A85B33] text-white"
                  onClick={() => setLocation("/auth?next=/recovery/premium")}
                  data-testid="button-signin-to-subscribe"
                >
                  Sign in to start
                </Button>
              ) : statusLoading ? (
                <Button size="lg" disabled data-testid="button-loading-status">
                  Loading...
                </Button>
              ) : isActive ? (
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-green-700 text-[#FDFBF7] text-sm rounded-full px-3" data-testid="badge-active">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                  <Button
                    variant="outline"
                    className="border-[#E2C2A4]/40 text-[#5C534D] rounded-full"
                    onClick={() => portalMut.mutate()}
                    disabled={portalMut.isPending}
                    data-testid="button-manage-billing"
                  >
                    {portalMut.isPending ? "Opening..." : "Manage billing"}
                  </Button>
                  {!status?.lifecycle?.cancelAtPeriodEnd && (
                    <button
                      type="button"
                      className="text-xs text-[#A8A29E] underline underline-offset-2 hover:text-[#78716C]"
                      onClick={() => setCancelOpen(true)}
                      data-testid="button-open-cancel"
                    >
                      Cancel subscription
                    </button>
                  )}
                </div>
              ) : (
                <Button
                  size="lg"
                  className="bg-[#C06B3E] hover:bg-[#A85B33] text-white"
                  onClick={() => checkoutMut.mutate(plan)}
                  disabled={checkoutMut.isPending}
                  data-testid="button-subscribe"
                >
                  {checkoutMut.isPending ? "Starting checkout..." : `Start ${trialDays}-day free trial`}
                </Button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              {COMPARISON.filter((r) => r.premium === "Unlimited" || r.premium === "Included")
                .map((r) => (
                  <div key={r.feature} className="flex items-center gap-2 text-[#78716C]">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>{r.feature}</span>
                  </div>
                ))}
            </div>
          </Card>

          <p className="text-center text-[#A8A29E] text-xs">
            We collect your card so the subscription auto-starts on day {trialDays + 1}.
            Cancel before day {trialDays + 1} → $0 charged. Stripe-hosted checkout.
          </p>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="mb-12" data-testid="section-how-it-works">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            How it works.
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "Start your free trial",
                body: `One click. Stripe takes your card. We don't see it. ${trialDays} days free.`,
              },
              {
                step: "2",
                title: "Use everything from minute one",
                body: "Coach is unlimited. Anchor is unlimited. Voice Cloning is unlocked. Premium fires open.",
              },
              {
                step: "3",
                title: "Decide on day " + (trialDays + 1),
                body: `Love it → it auto-renews. Cancel in the billing portal → $0 charged. Survivor's choice.`,
              },
            ].map((s) => (
              <Card
                key={s.step}
                className="p-5 bg-white border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                data-testid={`card-step-${s.step}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#C06B3E] text-white font-black flex items-center justify-center mb-3">
                  {s.step}
                </div>
                <h3 className="font-bold text-[#1C1917] mb-1">{s.title}</h3>
                <p className="text-sm text-[#78716C]">{s.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Why $19 ───────────────────────────────────────────────────── */}
        <Card className="p-6 bg-white border-[#E2C2A4]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-12">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#C06B3E" }} />
            <div>
              <h3 className="font-bold mb-1">Why $19?</h3>
              <p className="text-sm text-[#78716C]">
                Voice Cloning alone is $9/mo as a standalone add-on — Sasquatch
                Premium bundles it with unlimited Coach and Anchor renders for
                $10 more. The math says: if you use Coach more than ~5 days a
                month, Premium pays for itself. Annual ($190/yr ≈ $
                {annualPerMonth}/mo) saves another ${annualSavings} on top.
              </p>
            </div>
          </div>
        </Card>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="mb-12" data-testid="section-faq">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
            Common <span style={{ color: "#C06B3E" }}>questions.</span>
          </h2>
          <Card className="p-2 md:p-4 bg-white border-[#E2C2A4]/30">
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-[#E2C2A4]/30"
                  data-testid={`faq-item-${i}`}
                >
                  <AccordionTrigger className="text-left text-[#1C1917] hover:text-[#C06B3E] px-2">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[#78716C] px-2 leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <Card className="p-8 md:p-10 bg-gradient-to-br from-[#C06B3E]/10 to-white border-[#C06B3E]/30 text-center mb-6">
          <Star className="w-8 h-8 mx-auto mb-3 text-[#C06B3E]" />
          <h2 className="text-2xl md:text-3xl font-black mb-3">
            Try it free for {trialDays} days.
          </h2>
          <p className="text-[#78716C] mb-6 max-w-lg mx-auto">
            If Sasquatch Premium doesn't earn its keep before day {trialDays + 1},
            cancel in one click and owe $0. The free tier stays yours forever.
          </p>
          <Button
            size="lg"
            className="bg-[#C06B3E] hover:bg-[#A85B33] text-white text-base px-8"
            onClick={startCheckout}
            disabled={ctaDisabled}
            data-testid="button-final-cta"
          >
            {ctaLabel}
          </Button>
          <p className="text-[#A8A29E] text-xs mt-4">
            Stroke Recovery Academy is non-clinical. Always coordinate with your
            healthcare team. In crisis, call 988 or 911.
          </p>
        </Card>
      </main>

      <CancelFlowDialog open={cancelOpen} onOpenChange={setCancelOpen} />

      {/* ── Sticky mobile CTA bar ────────────────────────────────────────
          Shown only on small screens, only when not already active. Keeps the
          checkout button thumb-reachable through a long scroll.
       */}
      {!isActive && (
        <div
          className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[#E2C2A4]/30 bg-[#FDFBF7]/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3"
          data-testid="bar-sticky-cta"
        >
          <div>
            <div className="text-[#1C1917] text-sm font-bold leading-tight">
              ${displayUsd}/mo · {trialDays}-day free trial
            </div>
            <div className="text-[#A8A29E] text-[11px]">Cancel anytime</div>
          </div>
          <Button
            size="default"
            className="bg-[#C06B3E] hover:bg-[#A85B33] text-white"
            onClick={startCheckout}
            disabled={ctaDisabled}
            data-testid="button-sticky-cta"
          >
            {isAuthenticated ? "Start free trial" : "Sign in to start"}
          </Button>
        </div>
      )}
    </div>
  );
}
