// Consistent post-authentication routing for every entry point (AuthPage,
// magic-link verify, alias verify). New survivors land on onboarding; returning
// survivors land on the dashboard. An explicit `next` deep-link always wins so
// gated pages (e.g. /recovery/premium) can round-trip through sign-in.
//
// IMPORTANT: We await a forced refetch of /api/auth/user before navigating so
// that ProtectedRoute sees a fresh (authenticated) cache value instead of the
// stale null that was cached before login. Without the await, ProtectedRoute
// mounts during the refetch window, sees isAuthenticated:false, and bounces the
// user back to the landing page.
import { queryClient } from "@/lib/queryClient";

export async function routeAfterAuth(
  navigate: (to: string) => void,
  next?: string | null,
): Promise<void> {
  // Flush the auth cache so ProtectedRoute won't see stale null data.
  try {
    await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
  } catch {
    // non-fatal — proceed even if refetch fails
  }

  if (next) {
    navigate(next);
    return;
  }

  try {
    const res = await fetch("/api/recovery/me/state", { credentials: "include" });
    if (res.ok) {
      const state = await res.json();
      if (state?.hasOnboarded) {
        navigate("/recovery/dashboard");
        return;
      }
    }
  } catch {
    // fall through to dashboard as safe default
  }
  navigate("/recovery/dashboard");
}
