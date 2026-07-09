import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Zap, Check, Copy, Loader2, Link2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Prefs { acceptsPowerPoints: boolean; publicSlug: string | null; }

export default function PowerPointsSettingsCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<Prefs>({ queryKey: ["/api/power-points/preferences"] });

  useEffect(() => { if (data?.publicSlug) setSlug(data.publicSlug); }, [data?.publicSlug]);

  const togglePrefs = useMutation({
    mutationFn: async (acceptsPowerPoints: boolean) =>
      (await apiRequest("POST", "/api/power-points/preferences", { acceptsPowerPoints })).json(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/power-points/preferences"] });
      toast({ title: "Saved" });
    },
  });

  const saveSlug = useMutation({
    mutationFn: async (s: string) => (await apiRequest("POST", "/api/survivors/me/slug", { slug: s })).json(),
    onSuccess: (res: any) => {
      toast({ title: "Profile link updated", description: `Share /survivor/${res.slug}` });
      qc.invalidateQueries({ queryKey: ["/api/power-points/preferences"] });
    },
    onError: (e: any) => toast({ title: "Couldn't save", description: e?.message || "Try a different slug", variant: "destructive" }),
  });

  const autoSlug = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/survivors/me/auto-slug", {})).json(),
    onSuccess: (res: any) => {
      setSlug(res.slug);
      queryClient.invalidateQueries({ queryKey: ["/api/power-points/preferences"] });
    },
  });

  if (isLoading) {
    return <Card className="bg-[#1a1a1a] border-[#333] p-6"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></Card>;
  }

  const profileUrl = slug ? `${window.location.origin}/survivor/${slug}` : "";

  return (
    <Card className="bg-[#1a1a1a] border-[#333] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-[#E2741B]" />
        <h2 className="text-xl font-semibold text-white">Power Points & Public Profile</h2>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-white">Accept Power Points</Label>
            <p className="text-gray-400 text-sm">Family, friends and therapists can gift you points that fund courses and tools.</p>
          </div>
          <Switch
            checked={data?.acceptsPowerPoints !== false}
            onCheckedChange={(v) => togglePrefs.mutate(v)}
            data-testid="switch-accepts-power"
          />
        </div>

        <Separator className="bg-[#333]" />

        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2"><Link2 className="w-4 h-4 text-[#E2741B]" /> Your public profile link</Label>
          <p className="text-gray-400 text-sm">Share this link with loved ones so they can send you Power Points directly.</p>

          {!data?.publicSlug && (
            <Button
              size="sm"
              onClick={() => autoSlug.mutate()}
              disabled={autoSlug.isPending}
              className="bg-[#E2741B] hover:bg-[#B8851A] text-black font-bold"
              data-testid="button-create-slug"
            >
              {autoSlug.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create my profile link"}
            </Button>
          )}

          {data?.publicSlug && (
            <>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center rounded-md border border-[#333] bg-[#0D0D0D] px-3 text-sm text-gray-400">
                  <span>{window.location.origin.replace(/^https?:\/\//, "")}/survivor/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="border-0 bg-transparent px-1 h-9 text-white focus-visible:ring-0"
                    maxLength={40}
                    data-testid="input-slug"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-[#333]"
                  onClick={async () => { await navigator.clipboard.writeText(profileUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  data-testid="button-copy-slug"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              {slug && slug !== data.publicSlug && (
                <Button
                  size="sm"
                  onClick={() => saveSlug.mutate(slug)}
                  disabled={saveSlug.isPending}
                  className="bg-[#E2741B] hover:bg-[#B8851A] text-black font-bold"
                  data-testid="button-save-slug"
                >
                  {saveSlug.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save new link"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
