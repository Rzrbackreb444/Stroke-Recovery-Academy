import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import RecoverySEO from "@/components/RecoverySEO";
import { Loader2, Lock, BarChart3, UserCheck, Check, Building2 } from "lucide-react";

const ACCENT = "#E2741B";

interface Membership {
  orgId: number;
  orgName: string;
  orgType: string;
  role: string;
  shareLevel: "none" | "aggregate" | "identified";
  joinedAt: string | null;
}

const LEVELS = [
  {
    key: "none" as const,
    icon: Lock,
    title: "Private",
    body: "Your care team sees nothing about you. You still get full access.",
  },
  {
    key: "aggregate" as const,
    icon: BarChart3,
    title: "De-identified (default)",
    body: "You count toward anonymous cohort totals only — no name, no personal data. Nobody can pick you out.",
  },
  {
    key: "identified" as const,
    icon: UserCheck,
    title: "Identified summary",
    body: "Your care team can see your name and an engagement summary (streaks, check-ins). Never your journals or medical notes.",
  },
];

function ConsentCard({ m }: { m: Membership }) {
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async (shareLevel: string) => {
      const res = await apiRequest("PATCH", `/api/institutions/me/consent/${m.orgId}`, { shareLevel });
      return res.json();
    },
    onSuccess: (_d, shareLevel) => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions/me/memberships"] });
      toast({ title: "Consent updated", description: `Sharing set to ${shareLevel}.` });
    },
    onError: () => toast({ title: "Couldn't update", variant: "destructive" }),
  });

  return (
    <div className="bg-white rounded-md border border-[#E2C2A4]/40 p-6" data-testid={`consent-card-${m.orgId}`}>
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-4 h-4 text-[#78716C]" />
        <h3 className="font-semibold text-[#1C1917] text-lg" data-testid={`text-org-name-${m.orgId}`}>{m.orgName}</h3>
      </div>
      <p className="text-[#5C534D] text-sm mb-5">Choose what this care team can see. You can change this any time.</p>
      <div className="space-y-3">
        {LEVELS.map((lvl) => {
          const active = m.shareLevel === lvl.key;
          return (
            <button
              key={lvl.key}
              onClick={() => !active && mutation.mutate(lvl.key)}
              disabled={mutation.isPending}
              className={`w-full text-left rounded-md border p-4 flex items-start gap-3 transition ${active ? "" : "hover-elevate"}`}
              style={active ? { borderColor: ACCENT, backgroundColor: "rgba(226,116,27,0.06)" } : { borderColor: "rgba(226,194,164,0.5)" }}
              data-testid={`button-consent-${lvl.key}-${m.orgId}`}
            >
              <lvl.icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: active ? ACCENT : "#78716C" }} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1C1917] text-sm">{lvl.title}</span>
                  {active && <Check className="w-4 h-4" style={{ color: ACCENT }} />}
                </div>
                <p className="text-[#5C534D] text-sm mt-0.5">{lvl.body}</p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[#78716C] mt-4">
        Raw journals, medical logs, and flicker logs are never shared with any care team, at any level.
      </p>
    </div>
  );
}

export default function InstitutionConsent() {
  const { data: memberships, isLoading } = useQuery<Membership[]>({
    queryKey: ["/api/institutions/me/memberships"],
  });

  const survivorOrgs = (memberships ?? []).filter((m) => m.role === "survivor");

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-4 py-12">
      <RecoverySEO title="Your sharing settings — Stroke Recovery Academy" description="Control what your care team can see." canonical="/institution/consent" noindex />
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl text-[#1C1917] mb-2">Your sharing settings</h1>
        <p className="text-[#5C534D] mb-8">You decide what each care team sees about your recovery. Always reversible.</p>

        {isLoading && (
          <div className="text-center text-[#78716C] py-12" data-testid="consent-loading">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" /> Loading…
          </div>
        )}

        {!isLoading && survivorOrgs.length === 0 && (
          <div className="bg-white rounded-md border border-[#E2C2A4]/40 p-8 text-center" data-testid="consent-empty">
            <p className="text-[#5C534D] mb-4">You're not connected to any care team yet.</p>
            <Link href="/recovery">
              <Button variant="outline" data-testid="button-consent-home">Go to my recovery</Button>
            </Link>
          </div>
        )}

        {!isLoading && survivorOrgs.length > 0 && (
          <div className="space-y-5">
            {survivorOrgs.map((m) => <ConsentCard key={m.orgId} m={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}
