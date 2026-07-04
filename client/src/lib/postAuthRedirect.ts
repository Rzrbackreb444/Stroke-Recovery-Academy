// Consistent post-authentication routing for every entry point (AuthPage,
// magic-link verify, alias verify). New survivors land on onboarding; returning
// survivors land on the dashboard. An explicit `next` deep-link always wins so
// gated pages (e.g. /recovery/premium) can round-trip through sign-in.
export async function routeAfterAuth(
  navigate: (to: string) => void,
  next?: string | null,
): Promise<void> {
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
    // fall through to onboarding
  }
  navigate("/recovery/onboarding");
}
