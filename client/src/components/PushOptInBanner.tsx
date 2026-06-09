import { useState, useEffect } from "react";
import { Bell, BellOff, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

const DISMISS_KEY = "sasquatch_push_dismissed_at";
const DISMISS_DAYS = 7;

export default function PushOptInBanner() {
  const { permission, isSubscribed, isLoading, isSupported, subscribe, error } =
    usePushNotifications();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) {
      setDismissed(false);
      return;
    }
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) {
      setDismissed(false);
      return;
    }
    const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    setDismissed(ageDays < DISMISS_DAYS);
  }, []);

  if (!isSupported) return null;
  if (isSubscribed) return null;
  if (permission === "denied") return null;
  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  async function handleEnable() {
    const ok = await subscribe();
    if (ok) {
      toast({
        title: "Sasquatch is on watch.",
        description:
          "I'll ping you for your morning Bonfire, when your streak's at risk, and when I've got something for you.",
      });
    } else if (error) {
      toast({
        title: "Couldn't turn on notifications",
        description: error,
        variant: "destructive",
      });
    }
  }

  return (
    <Card
      className="mb-6 p-5 border-2 bg-gradient-to-br from-amber-950/40 to-stone-900/40"
      style={{ borderColor: "#E2741B" }}
      data-testid="banner-push-optin"
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#E2741B" }}
        >
          <Bell className="w-6 h-6 text-stone-900" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-amber-100 mb-1">
            Let me ping you, Warrior.
          </h3>
          <p className="text-sm text-amber-100/80 mb-3 leading-relaxed">
            Three pings. That's it. Morning Bonfire. Streak rescue when you go
            dark. A nudge from me when it matters. No spam — I hate that stuff
            too.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleEnable}
              disabled={isLoading}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              data-testid="button-enable-push"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Asking your browser...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Turn on Sasquatch pings
                </>
              )}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-amber-100/60 hover:text-amber-100"
              data-testid="button-dismiss-push"
            >
              <BellOff className="w-4 h-4 mr-2" />
              Not right now
            </Button>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-amber-100/40 hover:text-amber-100"
          data-testid="button-close-push-banner"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
