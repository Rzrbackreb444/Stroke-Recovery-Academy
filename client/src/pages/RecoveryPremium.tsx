import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import { Check, Flame, MessageCircle, Mic, Music, Lock } from "lucide-react";

type PremiumStatus = {
  active: boolean;
  priceCents: number;
  priceUsd: number;
};

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Unlimited Sasquatch Coach",
    body: "Free survivors get 25 Coach messages per day. Premium = unlimited. Talk to Sasquatch as much as you need, whenever the brain needs it.",
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

export default function RecoveryPremium() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const { data: status, isLoading: statusLoading } = useQuery<PremiumStatus>({
    queryKey: ["/api/sasquatch-premium/status"],
    enabled: isAuthenticated,
  });

  const checkoutMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sasquatch-premium/checkout", {});
      return (await res.json()) as { url?: string };
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
      else toast({ title: "Couldn't start checkout", variant: "destructive" });
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

  // ?subscribed=1 / ?canceled=1 flash + entitlement re-fetch on return.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "1") {
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
    }
    // intentionally only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priceUsd = status?.priceUsd ?? 19;
  const isActive = !!status?.active;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <RecoverySEO
        title="Sasquatch Premium — Unlimited Survivor Tools | Stroke Recovery Academy"
        description="7-day free trial. Unlimited AI Sasquatch Coach. Unlimited Recovery Anchor renders. Voice Cloning. Premium Campfire circles. Then $19/month. Cancel anytime."
        canonical="/recovery/premium"
      />
      <RecoveryHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Badge
            className="bg-amber-600/20 text-amber-400 border-amber-700/40 mb-4"
            data-testid="badge-premium-tag"
          >
            <Flame className="w-3 h-3 mr-1" />
            Sasquatch Premium
          </Badge>
          <h1
            className="text-4xl md:text-6xl font-black mb-4"
            data-testid="text-premium-title"
          >
            Unlimited.
            <br />
            <span style={{ color: "#C9941A" }}>Everything Sasquatch.</span>
          </h1>
          <p className="text-stone-400 text-lg md:text-xl max-w-2xl mx-auto">
            One subscription. Unlimited Coach. Unlimited Anchor renders. Voice
            Cloning included. Premium fires. Built by survivors, for survivors.
          </p>
        </div>

        <Card className="p-8 md:p-10 bg-stone-900 border-stone-800 mb-10">
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-5xl md:text-6xl font-black"
                  style={{ color: "#C9941A" }}
                  data-testid="text-price"
                >
                  ${priceUsd}
                </span>
                <span className="text-stone-400 text-lg">/month</span>
              </div>
              <p className="text-stone-500 text-sm mt-1">7-day free trial. Cancel anytime.</p>
            </div>

            {!isAuthenticated ? (
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => setLocation("/auth?next=/recovery/premium")}
                data-testid="button-signin-to-subscribe"
              >
                Sign in to subscribe
              </Button>
            ) : statusLoading ? (
              <Button size="lg" disabled data-testid="button-loading-status">
                Loading...
              </Button>
            ) : isActive ? (
              <div className="flex flex-col items-end gap-2">
                <Badge className="bg-green-700 text-white text-sm" data-testid="badge-active">
                  <Check className="w-3 h-3 mr-1" />
                  Active
                </Badge>
                <Button
                  variant="outline"
                  className="border-stone-700 text-stone-300"
                  onClick={() => portalMut.mutate()}
                  disabled={portalMut.isPending}
                  data-testid="button-manage-billing"
                >
                  {portalMut.isPending ? "Opening..." : "Manage billing"}
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => checkoutMut.mutate()}
                disabled={checkoutMut.isPending}
                data-testid="button-subscribe"
              >
                {checkoutMut.isPending ? "Starting checkout..." : `Start 7-day free trial`}
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex gap-3"
                  data-testid={`feature-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-md bg-amber-900/30 flex items-center justify-center">
                    <Icon className="w-5 h-5" style={{ color: "#C9941A" }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-100 mb-1">{f.title}</h3>
                    <p className="text-sm text-stone-400">{f.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 bg-stone-900 border-stone-800 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#C9941A" }} />
            <div>
              <h3 className="font-bold mb-1">Why $19?</h3>
              <p className="text-sm text-stone-400">
                Voice Cloning alone is $9/mo as a standalone add-on — Sasquatch
                Premium bundles it with unlimited Coach and Anchor renders for
                $10 more. The math says: if you use Coach more than ~5 days a
                month, Premium pays for itself.
              </p>
            </div>
          </div>
        </Card>

        <p className="text-center text-stone-500 text-sm">
          Stroke Recovery Academy is non-clinical. Always coordinate with your
          healthcare team. In crisis, call 988 or 911.
        </p>
      </main>
    </div>
  );
}
