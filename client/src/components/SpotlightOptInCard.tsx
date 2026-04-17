import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OptIn {
  optedIn: boolean;
  consent: boolean;
  consentAt: string | null;
}

export default function SpotlightOptInCard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<OptIn>({
    queryKey: ["/api/recovery/spotlight/me"],
  });

  const [consent, setConsent] = useState(false);

  const optIn = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/recovery/spotlight/me", {
        optedIn: true,
        consent: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recovery/spotlight/me"] });
      toast({
        title: "You're in.",
        description: "You may be featured in a future Survivor Spotlight.",
      });
    },
  });

  const optOut = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/recovery/spotlight/me", {
        optedIn: false,
        consent: false,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recovery/spotlight/me"] });
      toast({
        title: "Opted out",
        description: "You won't be considered for Survivor Spotlight.",
      });
    },
  });

  if (isLoading) return null;

  const optedIn = !!data?.optedIn;

  return (
    <Card className="border-[#C9941A]/30 bg-[#111]" data-testid="card-spotlight-optin">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-white">
          <Star className="h-4 w-4" style={{ color: "#C9941A" }} />
          Survivor Spotlight
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400">
          Each month we feature one survivor's story on the front of the platform
          and in the monthly newsletter. Selection is weighted-random from
          opted-in survivors. <span className="font-semibold text-gray-300">Paid subscribers count 3×</span> — that&apos;s how we keep the lights on. Admin reviews every pick before it&apos;s published.
        </p>

        {optedIn ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-md border border-[#C9941A]/40 bg-[#C9941A]/10 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#C9941A" }} />
              <div>
                <p className="text-sm font-semibold text-white">You&apos;re opted in.</p>
                <p className="mt-1 text-xs text-gray-400">
                  Consent recorded
                  {data?.consentAt
                    ? ` on ${new Date(data.consentAt).toLocaleDateString()}`
                    : ""}
                  . You can opt out anytime.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => optOut.mutate()}
              disabled={optOut.isPending}
              data-testid="button-spotlight-optout"
              className="border-[#333] text-gray-300"
            >
              Opt out
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-md border border-[#333] bg-[#0D0D0D] p-3 cursor-pointer">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(!!v)}
                data-testid="checkbox-spotlight-consent"
                className="mt-0.5"
              />
              <span className="text-xs text-gray-300 leading-relaxed">
                I grant Stroke Recovery Academy a non-exclusive, royalty-free
                release of likeness and content to publish my name, photo, and
                story (as I provide them) on this site, in the monthly
                newsletter, and in promotional material. I can revoke this
                consent at any time by opting out, after which my future
                appearance will be removed; previously sent emails cannot be
                recalled.
              </span>
            </label>
            <Button
              type="button"
              size="sm"
              onClick={() => optIn.mutate()}
              disabled={!consent || optIn.isPending}
              data-testid="button-spotlight-optin"
              className="bg-[#C9941A] text-black hover:bg-[#C9941A]"
            >
              {optIn.isPending ? "Saving…" : "Opt in to Survivor Spotlight"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
