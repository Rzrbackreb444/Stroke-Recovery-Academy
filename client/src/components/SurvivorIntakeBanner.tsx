import { Link, useLocation } from "wouter";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSurvivorProfile } from "@/hooks/useSurvivorProfile";

const DISMISS_KEY = "sra_intake_banner_dismissed_until";
const DISMISS_HOURS = 24;

// Routes where we never want to show the banner. Either they're auth pages,
// the intake itself, public marketing pages, or admin surfaces.
const HIDDEN_PATHS = [
  "/recovery/intake",
  "/api/login",
  "/login",
  "/checkout",
  "/admin",
  "/onboarding",
];

const SHOW_ON_PREFIXES = [
  "/recovery/",
  "/dashboard",
  "/my-",
  "/settings",
  "/journal",
];

function isHidden(path: string): boolean {
  if (HIDDEN_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  return false;
}

function shouldShowOn(path: string): boolean {
  if (path === "/" || path === "/recovery") return true;
  return SHOW_ON_PREFIXES.some((p) => path.startsWith(p));
}

export default function SurvivorIntakeBanner() {
  const [location] = useLocation();
  const { isAuthenticated, profile, intakeComplete, isLoading } = useSurvivorProfile();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
      setDismissed(Date.now() < until);
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!isAuthenticated || isLoading) return null;
  if (intakeComplete) return null;
  if (dismissed) return null;
  if (isHidden(location)) return null;
  if (!shouldShowOn(location)) return null;

  const isResume = !!profile && (profile.currentIntakeStep ?? 0) > 0;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + DISMISS_HOURS * 60 * 60 * 1000),
      );
    } catch {}
    setDismissed(true);
  };

  return (
    <Link href="/recovery/intake">
      <div
        className="cursor-pointer bg-gradient-to-r from-[#C9941A]/15 via-[#C9941A]/10 to-transparent border-b border-[#C9941A]/30 hover-elevate"
        data-testid="banner-survivor-intake"
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 text-sm">
          <div className="rounded-full bg-[#C9941A]/20 p-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#C9941A]" />
          </div>
          <div className="flex-1 min-w-0 text-white/90 truncate">
            <span className="font-semibold">
              {isResume ? "Pick up where you left off" : "Tune your dashboard to your recovery"}
            </span>
            <span className="hidden sm:inline text-white/60">
              {" "}— {isResume ? "a few questions left" : "5 minutes, all optional"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#C9941A] font-semibold whitespace-nowrap shrink-0">
            <span>{isResume ? "Resume" : "Start"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-1 shrink-0 rounded-md p-1 text-white/40 hover:text-white/80 hover-elevate"
            aria-label="Dismiss for today"
            data-testid="button-dismiss-intake-banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}
