import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import RecoverySEO from "@/components/RecoverySEO";
import { Building2, Check, Loader2, Lock, ShieldCheck, HeartPulse } from "lucide-react";

const ACCENT = "#E2741B";

interface InviteInfo {
  orgName: string;
  orgType: string;
  email: string | null;
  status: string;
}

export default function InstitutionJoin() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: invite, isLoading, error } = useQuery<InviteInfo>({
    queryKey: ["/api/institutions/invite", token],
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/institutions/invite/${token}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions/me/memberships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "You're in", description: "Welcome to your recovery. Heart's still thumpin'." });
      navigate("/institution/consent");
    },
    onError: (e: any) => {
      toast({ title: "Couldn't activate", description: e?.message ?? "Try again or ask your care team.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-[#1A1412] flex items-center justify-center px-4 py-16">
      <RecoverySEO title="Activate your access — Stroke Recovery Academy" description="Activate the Stroke Recovery Academy access your care team set up for you." canonical={`/institution/join/${token}`} noindex />
      <div className="w-full max-w-lg">
        {(isLoading || authLoading) && (
          <div className="text-center text-[#FDFBF7]/60" data-testid="institution-join-loading">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
            Loading your invite…
          </div>
        )}

        {!isLoading && (error || !invite) && (
          <div className="bg-white rounded-md p-8 text-center" data-testid="institution-join-invalid">
            <h1 className="font-display text-2xl text-[#1C1917] mb-2">This invite isn't valid</h1>
            <p className="text-[#5C534D] text-sm mb-6">
              It may have already been used or been revoked. Ask your care team to send a fresh link.
            </p>
            <Button onClick={() => navigate("/recovery")} variant="outline" data-testid="button-join-home">Go to recovery home</Button>
          </div>
        )}

        {!isLoading && invite && invite.status === "active" && (
          <div className="bg-white rounded-md p-8 text-center" data-testid="institution-join-used">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(226,116,27,0.12)" }}>
              <Check className="w-7 h-7" style={{ color: ACCENT }} />
            </div>
            <h1 className="font-display text-2xl text-[#1C1917] mb-2">Already activated</h1>
            <p className="text-[#5C534D] text-sm mb-6">This seat is live. Head to your dashboard.</p>
            <Button onClick={() => navigate("/recovery")} className="text-white border" style={{ backgroundColor: ACCENT, borderColor: ACCENT }} data-testid="button-join-dashboard">
              Go to my recovery
            </Button>
          </div>
        )}

        {!isLoading && invite && invite.status !== "active" && (
          <div className="bg-white rounded-md p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 border" style={{ backgroundColor: "rgba(226,116,27,0.1)", borderColor: "rgba(226,116,27,0.25)" }}>
              <Building2 className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Care team invite</span>
            </div>
            <h1 className="font-display text-3xl text-[#1C1917] mb-2" data-testid="text-invite-org">
              {invite.orgName} set you up.
            </h1>
            <p className="text-[#5C534D] leading-relaxed mb-6">
              Your care team activated full Stroke Recovery Academy access for you — daily reps, the Sasquatch Coach,
              and the survivor community. No cost to you.
            </p>

            <div className="space-y-3 mb-6">
              {[
                { icon: HeartPulse, t: "Full premium access", b: "Billed to your care team, not you." },
                { icon: Lock, t: "You start private", b: "Your care team only sees de-identified aggregate data by default." },
                { icon: ShieldCheck, t: "You stay in control", b: "Change or revoke what they see any time." },
              ].map((it) => (
                <div key={it.t} className="flex items-start gap-3">
                  <it.icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                  <div>
                    <p className="font-semibold text-[#1C1917] text-sm">{it.t}</p>
                    <p className="text-[#5C534D] text-sm">{it.b}</p>
                  </div>
                </div>
              ))}
            </div>

            {isAuthenticated ? (
              <Button
                size="lg"
                className="w-full text-white h-12 rounded-full font-semibold border"
                style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
                disabled={acceptMutation.isPending}
                onClick={() => acceptMutation.mutate()}
                data-testid="button-accept-invite"
              >
                {acceptMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activating…</> : "Activate my access"}
              </Button>
            ) : (
              <div>
                <Button
                  size="lg"
                  className="w-full text-white h-12 rounded-full font-semibold border"
                  style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
                  onClick={() => navigate(`/auth?next=${encodeURIComponent(`/institution/join/${token}`)}`)}
                  data-testid="button-signin-to-accept"
                >
                  Sign in to activate
                </Button>
                <p className="text-center text-xs text-[#78716C] mt-3">
                  {invite.email ? `Use ${invite.email} if you can.` : "New here? You can create an account in a minute."}
                </p>
              </div>
            )}
            <p className="text-center text-xs text-[#78716C] mt-4">
              Non-clinical peer accountability. For new symptoms or emergencies, contact your doctor or 911.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
