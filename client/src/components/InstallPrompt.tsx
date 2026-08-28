import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "sra_install_dismissed_at";
const DISMISS_DAYS = 30;

export default function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window.matchMedia("(display-mode: standalone)").matches) ||
        (window.navigator as any).standalone) {
      setInstalled(true);
      return;
    }

    const dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400_000) return;

    const onBefore = (e: Event) => {
      e.preventDefault();
      const dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400_000) return;
      setEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setEvt(null); };

    window.addEventListener("beforeinstallprompt", onBefore as any);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => null);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore as any);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !evt) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Stroke Recovery Academy"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-[#1a1a1a] border border-[#E2741B]/40 rounded-lg shadow-xl p-4 flex items-start gap-3 pointer-events-none"
      data-testid="install-prompt"
    >
      <div className="bg-[#E2741B] rounded-md p-2 flex-shrink-0">
        <Download className="w-5 h-5 text-black" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">Install the app</div>
        <p className="text-xs text-gray-400 mt-0.5">
          Add Stroke Recovery to your home screen for one-tap check-ins, push reminders, and offline lessons.
        </p>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            data-testid="button-install-app"
            className="pointer-events-auto bg-[#E2741B] hover:bg-[#b08217] text-black font-semibold"
            onClick={async () => {
              await evt.prompt();
              const choice = await evt.userChoice;
              if (choice.outcome === "dismissed") {
                localStorage.setItem(DISMISS_KEY, String(Date.now()));
              }
              setEvt(null);
            }}
          >
            Install
          </Button>
          <Button
            size="sm"
            variant="ghost"
            data-testid="button-dismiss-install"
            className="pointer-events-auto text-gray-400"
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, String(Date.now()));
              setEvt(null);
            }}
          >
            Not now
          </Button>
        </div>
      </div>
      <button
        aria-label="Close install prompt"
        className="text-gray-500 hover:text-gray-300 -mt-1 pointer-events-auto"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, String(Date.now()));
          setEvt(null);
        }}
        data-testid="button-close-install"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
