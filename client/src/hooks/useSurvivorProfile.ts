import { useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export type SurvivorDeficits = {
  motor?: number;
  speech?: number;
  cognitive?: number;
  fatigue?: number;
  vision?: number;
  swallowing?: number;
  emotional?: number;
  sensory?: number;
};

export type SurvivorProfile = {
  id: number;
  userId: string;
  preferredName: string | null;
  pronouns: string | null;
  strokeDate: string | null;
  strokeType: "ischemic" | "hemorrhagic" | "tia" | "unknown" | null;
  affectedSide: "left" | "right" | "both" | "none" | "unsure" | null;
  deficits: SurvivorDeficits | null;
  recoveryGoals: string[] | null;
  currentChallenges: string[] | null;
  customGoal: string | null;
  goalDetails: Array<{
    horizon: "short" | "long";
    domain: "physical" | "cognitive" | "speech" | "emotional" | "memory" | "other";
    goal: string;
    status?: string;
  }> | null;
  assessmentScores: {
    physical?: number;
    cognitive?: number;
    speech?: number;
    emotional?: number;
    memory?: number;
  } | null;
  assessmentNotes: string | null;
  equipment: string[] | null;
  mobilityAids: string[] | null;
  dailyTimeBudgetMinutes: number | null;
  energyPattern: "morning" | "afternoon" | "evening" | "variable" | null;
  hasCaregiver: boolean | null;
  caregiverEmail: string | null;
  caregiverRelationship: string | null;
  bigButtonMode: boolean | null;
  dyslexiaFont: boolean | null;
  reducedMotion: boolean | null;
  voicePrefersTts: boolean | null;
  bio: string | null;
  story: string | null;
  location: string | null;
  timeZone: string | null;
  intakeCompletedAt: string | null;
  currentIntakeStep: number | null;
  updatedAt: string;
  intakeComplete: boolean;
  profileProvenance: Record<string, { source: string; updatedAt: string }>;
};

const QK = ["/api/survivor/profile"] as const;
export type SurvivorProfilePatch = Partial<SurvivorProfile> & {
  profileSource?: "survivor_intake" | "survivor_profile_settings" | "recovery_onboarding";
};

export function useSurvivorProfile() {
  const { isAuthenticated } = useAuth();

  const query = useQuery<{ profile: SurvivorProfile | null }>({
    queryKey: QK,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Single-flight write queue
  //
  // The intake fires PATCHes from a debounced typing handler AND from the
  // explicit "Continue" button. Without ordering, an older request can land
  // after a newer one and clobber freshly-typed fields or rewind
  // currentIntakeStep. The queue guarantees:
  //   • only one PATCH is in flight at a time
  //   • newer keys always overwrite older keys in the pending payload
  //   • every patch() call resolves only after the merged payload is durable
  // ─────────────────────────────────────────────────────────────────────────
  const pendingRef = useRef<SurvivorProfilePatch | null>(null);
  const inFlightRef = useRef(false);
  const waitersRef = useRef<Array<{ resolve: (v: any) => void; reject: (e: any) => void }>>([]);

  const flush = useCallback(async () => {
    if (inFlightRef.current) return;
    if (!pendingRef.current) return;
    const payload = pendingRef.current;
    const waiters = waitersRef.current;
    pendingRef.current = null;
    waitersRef.current = [];
    inFlightRef.current = true;
    try {
      const r = await apiRequest("PATCH", "/api/survivor/profile", payload);
      const data = await r.json();
      queryClient.setQueryData(QK, data);
      waiters.forEach((w) => w.resolve(data));
    } catch (err) {
      waiters.forEach((w) => w.reject(err));
    } finally {
      inFlightRef.current = false;
      // If new writes arrived while in flight, drain them.
      if (pendingRef.current) {
        // Fire-and-forget; new patch() callers will await their own waiters.
        flush();
      }
    }
  }, []);

  const patch = useCallback(
    (delta: SurvivorProfilePatch) => {
      pendingRef.current = { ...(pendingRef.current || {}), ...delta };
      const promise = new Promise((resolve, reject) => {
        waitersRef.current.push({ resolve, reject });
      });
      flush();
      return promise as Promise<any>;
    },
    [flush],
  );

  const completeMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/survivor/profile/complete", {});
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QK, data);
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/survivor/profile/reset-intake", {});
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QK, data);
    },
  });

  const profile = query.data?.profile ?? null;
  return {
    profile,
    isLoading: query.isLoading,
    isAuthenticated,
    intakeComplete: !!profile?.intakeCompletedAt,
    intakeStarted: !!profile,
    currentStep: profile?.currentIntakeStep ?? 0,
    patch,
    complete: completeMutation.mutateAsync,
    resetIntake: resetMutation.mutateAsync,
    isSaving: completeMutation.isPending,
  };
}
